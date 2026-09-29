import { describe, expect, it, beforeAll } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import pgsql from "pgsql-parser"

/**
 * Validation of supabase/rpc.sql — the content-management RPC layer.
 *
 * No live Postgres is available in this environment, so (as in
 * schema.test.ts) we parse the SQL with libpg_query — the same parser
 * Postgres itself uses — and assert on the resulting AST. Every function
 * is additionally deparsed and re-parsed to prove it is well-formed in
 * isolation.
 */

const rpc = readFileSync(resolve(__dirname, "../../supabase/rpc.sql"), "utf8")

const REQUIRED_FUNCTIONS = [
  "get_content_list",
  "get_content_by_id",
  "get_content_by_genre",
  "get_trending_content",
  "get_continue_watching",
  "get_new_releases",
  "search_content",
  "get_related_content",
  "get_all_genres",
  "get_all_languages",
  "get_content_by_rating_range",
] as const

type AnyStmt = { stmt: Record<string, any> }

let statements: AnyStmt[] = []
let functions: Record<string, any> = {}
let schemas: Record<string, string> = {}

beforeAll(async () => {
  await pgsql.loadModule()
  const ast = pgsql.parseSync(rpc)
  expect(ast.version).toBeTruthy()
  statements = ast.stmts
  functions = {}
  schemas = {}
  for (const { stmt } of statements) {
    if (stmt.CreateFunctionStmt) {
      const f = stmt.CreateFunctionStmt
      const name = f.funcname[f.funcname.length - 1].String.sval
      functions[name] = f
      schemas[name] = f.funcname
        .slice(0, -1)
        .map((n: any) => n.String.sval)
        .join(".")
    }
  }
})

/** Deparse and re-parse — proves each definition stands alone. */
function roundTrip(key: string) {
  expect(functions[key], `function ${key} must exist`).toBeTruthy()
  // deparseSync only routes wrapped nodes ({ CreateFunctionStmt: ... });
  // a bare CreateFunctionStmt is read as a node named after its first key.
  const deparsed = pgsql.deparseSync({ CreateFunctionStmt: functions[key] })
  const reparsed = pgsql.parseSync(deparsed)
  expect(reparsed.stmts).toHaveLength(1)
  return deparsed
}

function params(key: string): Array<{ name: string; types: string[]; hasDefault: boolean }> {
  const f = functions[key]
  return (f.parameters ?? []).map((p: any) => ({
    name: p.FunctionParameter.name,
    types: p.FunctionParameter.argType.names
      .map((n: any) => n.String.sval)
      .filter(Boolean),
    hasDefault: !!p.FunctionParameter.defexpr,
  }))
}

function paramNames(key: string): string[] {
  return params(key).map((p) => p.name)
}

function returnType(key: string): string {
  return functions[key].returnType.names
    .map((n: any) => n.String.sval)
    .filter(Boolean)
    .join(".")
}

/** Deparsed body of a function (lower-cased) for coarse "does it use X" checks. */
function body(key: string): string {
  return pgsql.deparseSync({ CreateFunctionStmt: functions[key] }).toLowerCase()
}

/**
 * Keys emitted by a function that returns ContentItem-shaped JSON.
 * Most content functions delegate the projection to content_item_json,
 * so its emitted keys count towards every caller.
 */
function jsonKeys(key: string): Set<string> {
  const keys = new Set<string>()
  for (const name of [key, "content_item_json"]) {
    if (!functions[name]) continue
    for (const k of ownJsonKeys(name)) keys.add(k)
  }
  return keys
}

/**
 * String keys emitted by jsonb_build_object calls in a function's body,
 * read from the parsed body AST (regex can't handle camelCase or the
 * key/value argument pairs reliably).
 */
function ownJsonKeys(key: string): string[] {
  const bodySql = functionBodySql(key)
  const bodyAst = pgsql.parseSync(bodySql)
  const calls: any[] = []
  collectBuildObjectCalls(bodyAst, calls)
  const keys: string[] = []
  for (const fc of calls) {
    // jsonb_build_object(key1, value1, key2, value2, ...) — keys sit at even indices
    for (let i = 0; i + 1 < fc.args.length; i += 2) {
      const v = fc.args[i]?.A_Const?.sval?.sval
      if (typeof v === "string") keys.push(v)
    }
  }
  return keys
}

function collectBuildObjectCalls(node: any, out: any[]): void {
  if (node === null || typeof node !== "object") return
  if (Array.isArray(node)) {
    for (const child of node) collectBuildObjectCalls(child, out)
    return
  }
  const fc = node.FuncCall
  if (fc && fc.funcname?.at(-1)?.String?.sval === "jsonb_build_object") out.push(fc)
  for (const value of Object.values(node)) collectBuildObjectCalls(value, out)
}

/** Raw SQL body of a function (from the parsed AS option). */
function functionBodySql(key: string): string {
  const f = functions[key]
  const asOption = (f.options ?? []).find(
    (o: any) => o.DefElem?.defname === "as",
  )
  return asOption.DefElem.arg.List.items[0].String.sval
}

describe("supabase/rpc.sql", () => {
  it("is syntactically valid PostgreSQL", () => {
    expect(statements.length).toBeGreaterThan(0)
    for (const { stmt } of statements) {
      expect(stmt).toBeTruthy()
    }
  })

  it("defines all 11 required content RPC functions", () => {
    for (const name of REQUIRED_FUNCTIONS) {
      expect(functions[name], `function public.${name} must be defined`).toBeTruthy()
    }
  })

  it("puts every function in the public schema so it is callable over PostgREST", () => {
    for (const name of REQUIRED_FUNCTIONS) {
      expect(schemas[name], `${name} is schema-qualified to public`).toBe("public")
    }
  })

  it("round-trips every function definition on its own", () => {
    for (const name of [...REQUIRED_FUNCTIONS, "content_item_json"]) {
      const deparsed = roundTrip(name)
      expect(deparsed.length, `${name} body is non-empty`).toBeGreaterThan(0)
    }
  })

  describe("ContentItem shape", () => {
    // Keys required by the frontend ContentItem interface in src/data/types.ts.
    const CONTENT_ITEM_KEYS = [
      "id",
      "title",
      "description",
      "logline",
      "thumbnailUrl",
      "backdropUrl",
      "year",
      "rating",
      "genres",
      "durationMinutes",
    ]

    const CONTENT_FUNCTIONS = [
      "get_content_list",
      "get_content_by_id",
      "get_content_by_genre",
      "get_trending_content",
      "get_continue_watching",
      "get_new_releases",
      "search_content",
      "get_related_content",
      "get_content_by_rating_range",
    ]

    it("returns camelCase keys matching the frontend ContentItem interface", () => {
      for (const name of CONTENT_FUNCTIONS) {
        const keys = jsonKeys(name)
        for (const key of CONTENT_ITEM_KEYS) {
          expect(keys, `${name} returns "${key}"`).toContain(key)
        }
      }
    })

    it("builds genres as a text array via array_agg", () => {
      const sql = body("content_item_json")
      expect(sql).toMatch(/array_agg/)
      expect(sql).toMatch(/text\[\]/)
    })

    it("adds progressPercent only for functions that track playback", () => {
      expect(body("get_continue_watching")).toMatch(/'progresspercent'/)
      expect(body("get_content_list")).not.toMatch(/'progresspercent'/)
    })

    it("adds stars (aggregate rating) to every catalog item", () => {
      expect(body("content_item_json")).toMatch(/'stars'/)
    })
  })

  describe("get_content_list", () => {
    it("supports pagination with a default page size", () => {
      const ps = params("get_content_list")
      expect(paramNames("get_content_list")).toEqual(
        expect.arrayContaining(["p_page", "p_page_size"]),
      )
      for (const p of ps.filter((p) => ["p_page", "p_page_size"].includes(p.name))) {
        expect(p.hasDefault, `${p.name} has a default`).toBe(true)
      }
    })

    it("filters by type, genre, year and language", () => {
      expect(paramNames("get_content_list")).toEqual(
        expect.arrayContaining(["p_type", "p_genre", "p_year", "p_language"]),
      )
    })

    it("orders deterministically so pagination cannot repeat or skip rows", () => {
      expect(body("get_content_list")).toMatch(/order by[\s\S]*release_year desc[\s\S]*c\.id/)
    })

    it("returns a jsonb array", () => {
      expect(returnType("get_content_list")).toBe("jsonb")
    })
  })

  describe("get_content_by_id", () => {
    it("accepts either a uuid or a slug and resolves both", () => {
      expect(paramNames("get_content_by_id")).toEqual(
        expect.arrayContaining(["p_id", "p_slug"]),
      )
      const sql = body("get_content_by_id")
      expect(sql).toMatch(/::uuid/) // null uuid cast for the branch not taken
      expect(sql).toMatch(/slug/)
    })

    it("returns a single jsonb object", () => {
      expect(returnType("get_content_by_id")).toBe("jsonb")
    })
  })

  describe("get_content_by_genre", () => {
    it("accepts a genre name or slug", () => {
      expect(paramNames("get_content_by_genre")).toEqual(
        expect.arrayContaining(["p_genre"]),
      )
    })

    it("is paginated with defaults", () => {
      const ps = params("get_content_by_genre")
      expect(paramNames("get_content_by_genre")).toEqual(
        expect.arrayContaining(["p_page", "p_page_size"]),
      )
      for (const p of ps.filter((p) => ["p_page", "p_page_size"].includes(p.name))) {
        expect(p.hasDefault, `${p.name} has a default`).toBe(true)
      }
    })
  })

  describe("get_trending_content", () => {
    it("sorts by view count and rating descending", () => {
      const sql = body("get_trending_content")
      expect(sql).toMatch(/view_count desc/)
      expect(sql).toMatch(/average_rating desc/)
    })

    it("accepts a time window and a limit", () => {
      expect(paramNames("get_trending_content")).toEqual(
        expect.arrayContaining(["p_window_days", "p_limit"]),
      )
    })
  })

  describe("get_continue_watching", () => {
    it("reads a user's watch history by explicit user id", () => {
      expect(paramNames("get_continue_watching")).toEqual(
        expect.arrayContaining(["p_user_id"]),
      )
      expect(body("get_continue_watching")).toContain("watch_history")
    })

    it("returns only partially watched items (0 < progress < 100)", () => {
      const sql = body("get_continue_watching")
      expect(sql).toMatch(/progress_percent > 0/)
      expect(sql).toMatch(/progress_percent < 100/)
    })

    it("orders by most recently watched", () => {
      expect(body("get_continue_watching")).toMatch(/last_watched_at desc/)
    })
  })

  describe("get_new_releases", () => {
    it("sorts by newest first and is paginated", () => {
      const sql = body("get_new_releases")
      expect(sql).toMatch(/release_year desc/)
      expect(sql).toMatch(/created_at desc/)
      expect(paramNames("get_new_releases")).toEqual(
        expect.arrayContaining(["p_page", "p_page_size"]),
      )
    })
  })

  describe("search_content", () => {
    it("uses trigram similarity against title and description", () => {
      const sql = body("search_content")
      expect(sql).toMatch(/similarity/)
      expect(sql).toMatch(/title/)
      expect(sql).toMatch(/description/)
    })

    it("is paginated", () => {
      expect(paramNames("search_content")).toEqual(
        expect.arrayContaining(["p_page", "p_page_size"]),
      )
    })
  })

  describe("get_related_content", () => {
    it("excludes the seed item from its own results", () => {
      expect(body("get_related_content")).toMatch(/<> p_content_id/)
      expect(body("get_related_content")).toContain("p_content_id")
    })

    it("takes a limit and returns at most that many items", () => {
      expect(paramNames("get_related_content")).toEqual(
        expect.arrayContaining(["p_content_id", "p_limit"]),
      )
    })
  })

  describe("get_content_by_rating_range", () => {
    it("accepts min and max bounds", () => {
      expect(paramNames("get_content_by_rating_range")).toEqual(
        expect.arrayContaining(["p_min_rating", "p_max_rating"]),
      )
    })

    it("treats omitted bounds as open-ended", () => {
      const ps = params("get_content_by_rating_range")
      for (const p of ps.filter((p) => ["p_min_rating", "p_max_rating"].includes(p.name))) {
        expect(p.hasDefault, `${p.name} defaults to null (unbounded)`).toBe(true)
      }
    })

    it("is paginated", () => {
      expect(paramNames("get_content_by_rating_range")).toEqual(
        expect.arrayContaining(["p_page", "p_page_size"]),
      )
    })
  })

  describe("taxonomy lookups", () => {
    it("get_all_genres returns every genre as jsonb", () => {
      expect(returnType("get_all_genres")).toBe("jsonb")
      expect(body("get_all_genres")).toContain("genres")
    })

    it("get_all_languages returns every language as jsonb", () => {
      expect(returnType("get_all_languages")).toBe("jsonb")
      expect(body("get_all_languages")).toContain("languages")
    })
  })

  describe("catalog hygiene", () => {
    it("only exposes published content to the frontend", () => {
      const sql = statements
        .map((s) => pgsql.deparseSync(s.stmt).toLowerCase())
        .join("\n")
      expect(sql).toContain("status = 'published'")
    })
  })
})
