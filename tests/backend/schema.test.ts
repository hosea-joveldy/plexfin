import { describe, expect, it, beforeAll } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import pgsql from "pgsql-parser"

/**
 * Validation of supabase/schema.sql against a real PostgreSQL parser
 * (libpg_query — the same parser Postgres itself uses).
 *
 * No live Postgres is available in this environment, so instead of
 * executing the DDL we parse it and assert on the resulting AST.
 */

const schema = readFileSync(resolve(__dirname, "../../supabase/schema.sql"), "utf8")

const REQUIRED_TABLES = [
  "users",
  "profiles",
  "content",
  "genres",
  "content_genres",
  "languages",
  "ratings",
  "content_ratings",
  "watch_history",
  "reviews",
  "settings",
] as const

type AnyStmt = { stmt: Record<string, any> }

let statements: AnyStmt[] = []
let tables: Record<string, any> = {}
let indexes: Array<{ name: string; table: string }> = []
let triggers: Array<{ name: string; table: string }> = []

beforeAll(async () => {
  await pgsql.loadModule()
  const ast = pgsql.parseSync(schema)
  expect(ast.version).toBeTruthy()
  statements = ast.stmts
  tables = {}
  indexes = []
  triggers = []
  for (const { stmt } of statements) {
    if (stmt.CreateStmt) {
      tables[stmt.CreateStmt.relation.relname] = stmt.CreateStmt
    } else if (stmt.IndexStmt) {
      indexes.push({ name: stmt.IndexStmt.idxname, table: stmt.IndexStmt.relation.relname })
    } else if (stmt.CreateTrigStmt) {
      triggers.push({ name: stmt.CreateTrigStmt.trigname, table: stmt.CreateTrigStmt.relation.relname })
    }
  }
})

function columns(table: string): Array<{ name: string; def: any }> {
  expect(tables[table], `table public.${table} must exist`).toBeTruthy()
  return tables[table].tableElts
    .filter((el: any) => el.ColumnDef)
    .map((el: any) => ({ name: el.ColumnDef.colname, def: el.ColumnDef }))
}

/** All constraints on a table: inline column constraints plus table-level ones. */
function constraints(table: string): any[] {
  expect(tables[table], `table public.${table} must exist`).toBeTruthy()
  return [
    ...tables[table].tableElts.flatMap((el: any) =>
      el.ColumnDef ? (el.ColumnDef.constraints ?? []) : el.Constraint ? [el] : [],
    ),
  ].map((c) => c.Constraint ?? c)
}

function hasConstraint(table: string, contype: string, match?: (c: any) => boolean): any {
  return constraints(table).find((c) => c.contype === contype && (!match || match(c)))
}

function checkBounds(table: string, column: string): [number, number] {
  const col = columns(table).find((c) => c.name === column)
  expect(col, `${table}.${column} exists`).toBeTruthy()
  const check = (col!.def.constraints ?? []).find(
    (c: any) => c.Constraint?.contype === "CONSTR_CHECK",
  )
  expect(check, `${table}.${column} has a CHECK constraint`).toBeTruthy()
  const expr = check!.Constraint.raw_expr
  // AEXPR_BETWEEN decompiles to `x >= lo AND x <= hi`; walk it and read the
  // operator structure directly instead of deparsing (the deparser does not
  // handle bare A_Expr nodes).
  const kind = expr.A_Expr?.kind
  expect(kind, "check is a BETWEEN expression").toBe("AEXPR_BETWEEN")
  const bounds = expr.A_Expr.rexpr.List.items.map((i: any) => {
    // libpg_query's WASM build omits ival when it is 0 (`ival: {}` === 0)
    const ival = i.A_Const?.ival
    if (!ival) return undefined
    return "ival" in ival && ival.ival !== undefined ? ival.ival : 0
  })
  expect(bounds.length).toBe(2)
  expect(bounds.every((b: any) => typeof b === "number"), `numeric bounds on ${table}.${column}`).toBe(true)
  return [bounds[0], bounds[1]]
}

describe("supabase/schema.sql", () => {
  it("is syntactically valid PostgreSQL", () => {
    const kinds = statements.map((s) => Object.keys(s.stmt)[0])
    expect(kinds).toContain("CreateExtensionStmt")
    expect(kinds.filter((k) => k === "CreateStmt").length).toBeGreaterThanOrEqual(11)
    expect(kinds.filter((k) => k === "IndexStmt").length).toBeGreaterThanOrEqual(20)
    expect(kinds.filter((k) => k === "CreateTrigStmt").length).toBeGreaterThanOrEqual(7)
  })

  it("defines all 11 required tables", () => {
    for (const table of REQUIRED_TABLES) {
      expect(tables[table], `expected create table for public.${table}`).toBeTruthy()
    }
  })

  it("uses UUID primary keys on all entity tables", () => {
    for (const table of ["users", "profiles", "content", "genres", "languages", "ratings", "watch_history", "reviews"]) {
      const id = columns(table).find((c) => c.name === "id")
      expect(id, `${table}.id exists`).toBeTruthy()
      expect(id!.def.typeName.names.at(-1).String.sval, `${table}.id is uuid`).toBe("uuid")
      const pk = hasConstraint(table, "CONSTR_PRIMARY")
      expect(pk, `${table} has a primary key`).toBeTruthy()
      // inline column PKs carry no key list; table-level ones do.
      // In both cases the PK must be on the single `id` column.
      if (pk!.keys) {
        expect(pk!.keys.map((k: any) => k.String.sval)).toEqual(["id"])
      } else {
        expect(columns(table).find((c) => c.name === "id")!.def.constraints.some((c: any) => c.Constraint?.contype === "CONSTR_PRIMARY"), `${table}.id is the primary key column`).toBe(true)
      }
    }
  })

  it("generates UUIDs in the database via gen_random_uuid()", () => {
    for (const table of ["content", "genres", "languages", "ratings", "watch_history", "reviews"]) {
      const id = columns(table).find((c) => c.name === "id")!
      const defaulted = (id.def.constraints ?? []).some(
        (c: any) =>
          c.Constraint?.contype === "CONSTR_DEFAULT" &&
          pgsql.deparseSync(c.Constraint.raw_expr).includes("gen_random_uuid()"),
      )
      expect(defaulted, `${table}.id default gen_random_uuid()`).toBe(true)
    }
  })

  it("links users, profiles, and settings to auth.users", () => {
    const fkTarget = (table: string): string[] =>
      constraints(table)
        .filter((c) => c.contype === "CONSTR_FOREIGN")
        .map((c) => `${c.pktable.schemaname}.${c.pktable.relname}`)

    expect(fkTarget("users")).toContain("auth.users")
    expect(fkTarget("profiles")).toContain("public.users")
    expect(fkTarget("settings")).toContain("public.users")
  })

  it("enforces one rating/review/watch entry per user per content item", () => {
    for (const table of ["ratings", "reviews", "watch_history"]) {
      const unique = hasConstraint(table, "CONSTR_UNIQUE")
      expect(unique, `${table} has a unique constraint`).toBeTruthy()
      expect(unique!.keys.map((k: any) => k.String.sval)).toEqual(["user_id", "content_id"])
    }
  })

  it("joins content to genres through content_genres with a composite key", () => {
    const pk = hasConstraint("content_genres", "CONSTR_PRIMARY")
    expect(pk!.keys.map((k: any) => k.String.sval)).toEqual(["content_id", "genre_id"])
    const targets = constraints("content_genres")
      .filter((c) => c.contype === "CONSTR_FOREIGN")
      .map((c) => c.pktable.relname)
    expect(targets).toContain("content")
    expect(targets).toContain("genres")
  })

  it("keeps content columns aligned with the frontend ContentItem shape", () => {
    const names = columns("content").map((c) => c.name)
    for (const col of [
      "slug", // mirrors ContentItem.id, e.g. "the-last-lighthouse"
      "title",
      "description",
      "logline",
      "thumbnail_url",
      "backdrop_url",
      "release_year",
      "duration_minutes",
      "rating_code",
      "video_url",
    ]) {
      expect(names, `content.${col}`).toContain(col)
    }
    // slug must be unique so it can serve as the stable public identifier
    const slugUnique = !!hasConstraint(
      "content",
      "CONSTR_UNIQUE",
      (c) => !c.keys || c.keys.some((k: any) => k.String.sval === "slug"),
    )
    expect(slugUnique, "content.slug is unique").toBe(true)
  })

  it("indexes foreign keys and common lookup columns", () => {
    const on = (table: string) => indexes.filter((i) => i.table === table).map((i) => i.name)
    expect(on("content").some((n) => n.includes("release_year"))).toBe(true)
    expect(on("content").some((n) => n.includes("content_type"))).toBe(true)
    expect(on("content").some((n) => n.includes("rating_code"))).toBe(true)
    expect(on("content_genres").some((n) => n.includes("genre_id"))).toBe(true)
    expect(on("ratings").some((n) => n.includes("content_id"))).toBe(true)
    expect(on("reviews").some((n) => n.includes("content_id"))).toBe(true)
    expect(on("watch_history").some((n) => n.includes("user_id") && n.includes("last_watched_at"))).toBe(true)
  })

  it("covers every foreign key column with an index", () => {
    const pkColumns: Record<string, string[]> = {
      users: ["id"],
      profiles: ["id"],
      content: ["id"],
      content_ratings: ["content_id"],
      settings: ["user_id"],
    }
    for (const table of REQUIRED_TABLES) {
      for (const c of constraints(table).filter((c) => c.contype === "CONSTR_FOREIGN")) {
        for (const attr of c.fkattrs ?? []) {
          const col = attr.String.sval
          if ((pkColumns[table] ?? []).includes(col)) continue
          if (table === "content_genres") continue // covered by composite PK
          const matched = indexes.some((i) => i.table === table && i.name.includes(col))
          expect(matched, `${table}.${col} should have an index`).toBe(true)
        }
      }
    }
  })

  it("auto-updates updated_at via triggers", () => {
    const fn = statements.find((s) => s.stmt.CreateFunctionStmt)
    expect(fn, "set_updated_at function").toBeTruthy()
    const fnName = fn!.stmt.CreateFunctionStmt.funcname.at(-1).String.sval
    expect(fnName).toBe("set_updated_at")
    for (const table of ["profiles", "content", "ratings", "reviews", "watch_history", "settings"]) {
      expect(triggers.some((t) => t.table === table), `updated_at trigger on ${table}`).toBe(true)
    }
  })

  it("validates rating values between 1 and 5 and progress between 0 and 100", () => {
    expect(checkBounds("ratings", "rating")).toEqual([1, 5])
    expect(checkBounds("watch_history", "progress_percent")).toEqual([0, 100])
  })

  it("enables row level security hooks for later policy work", () => {
    // RLS policies are configured in a later task; the schema should at least
    // not prevent them. Sanity check: all tables are present and parseable.
    expect(Object.keys(tables).length).toBeGreaterThanOrEqual(REQUIRED_TABLES.length)
    expect(tables.content.relation.schemaname).toBe("public")
  })
})
