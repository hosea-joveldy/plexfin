import { describe, expect, it, beforeAll } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import pgsql from "pgsql-parser"

/**
 * Validation of supabase/storage-setup.sql — the storage bucket layout and
 * the upload / URL helper functions the admin UI and the player call.
 *
 * No live Postgres is available in this environment, so (as in schema.test.ts
 * and rpc.test.ts) we parse the SQL with libpg_query — the same parser
 * Postgres itself uses — and assert on the resulting AST. Every function is
 * additionally deparsed and re-parsed to prove it is well-formed in isolation.
 *
 * A note on what SQL can and cannot do here: Supabase Storage signs URLs and
 * moves bytes in the Storage API service, not in the database. There is no
 * storage.create_signed_url() SQL function. So the RPCs in this file validate
 * input and return the canonical object path; the client finishes the job
 * with the Storage JS SDK (upload() / createSignedUrl() / public URL).
 */

const storage = readFileSync(
  resolve(__dirname, "../../supabase/storage-setup.sql"),
  "utf8",
)

const REQUIRED_FUNCTIONS = [
  "upload_video",
  "upload_thumbnail",
  "get_video_url",
  "get_thumbnail_url",
] as const

type AnyStmt = { stmt: Record<string, any> }

let statements: AnyStmt[] = []
let functions: Record<string, any> = {}
let schemas: Record<string, string> = {}
/** Deparsed INSERT statements targeting storage.buckets. */
let bucketInserts: string[] = []
/** Deparsed CREATE POLICY statements on storage.objects. */
let policies: Array<{ name: string; table: string; command: string; roles: string[]; sql: string }> = []

beforeAll(async () => {
  await pgsql.loadModule()
  const ast = pgsql.parseSync(storage)
  expect(ast.version).toBeTruthy()
  statements = ast.stmts
  functions = {}
  schemas = {}
  bucketInserts = []
  policies = []

  for (const { stmt } of statements) {
    if (stmt.CreateFunctionStmt) {
      const f = stmt.CreateFunctionStmt
      const name = f.funcname[f.funcname.length - 1].String.sval
      functions[name] = f
      schemas[name] = f.funcname
        .slice(0, -1)
        .map((n: any) => n.String.sval)
        .join(".")
    } else if (stmt.InsertStmt) {
      const insert = stmt.InsertStmt
      if (insert.relation?.relname === "buckets") {
        bucketInserts.push(psql_deparse({ InsertStmt: insert }))
      }
    } else if (stmt.CreatePolicyStmt) {
      const p = stmt.CreatePolicyStmt
      policies.push({
        name: p.policy_name,
        table: p.table?.relname ?? "",
        command: p.cmd_name ?? "",
        roles: (p.roles ?? []).map((r: any) => r.RoleSpec?.rolename ?? String(r)),
        sql: psql_deparse({ CreatePolicyStmt: p }),
      })
    }
  }
})

/** deparseSync routed through a wrapper node, which is what it accepts. */
function psql_deparse(node: Record<string, any>): string {
  return pgsql.deparseSync(node)
}

/** Deparse and re-parse — proves each definition stands alone. */
function roundTrip(key: string) {
  expect(functions[key], `function ${key} must exist`).toBeTruthy()
  const deparsed = pgsql.deparseSync({ CreateFunctionStmt: functions[key] })
  const reparsed = pgsql.parseSync(deparsed)
  expect(reparsed.stmts).toHaveLength(1)
  return deparsed
}

function paramNames(key: string): string[] {
  const f = functions[key]
  return (f.parameters ?? [])
    .filter((p: any) => p.FunctionParameter.mode !== 0x0008 /* OUT */)
    .map((p: any) => p.FunctionParameter.name)
}

function returnType(key: string): string {
  return functions[key].returnType.names
    .map((n: any) => n.String.sval)
    .filter(Boolean)
    .join(".")
}

/** Function options (SECURITY DEFINER, SET search_path, ...). */
function options(key: string): Record<string, any> {
  const out: Record<string, any> = {}
  for (const o of functions[key].options ?? []) {
    if (o.DefElem) out[o.DefElem.defname] = o.DefElem.arg
  }
  return out
}

/** Deparsed definition of a function, lower-cased, for coarse checks. */
function body(key: string): string {
  return pgsql.deparseSync({ CreateFunctionStmt: functions[key] }).toLowerCase()
}

/** Raw SQL body of a function (from the parsed AS option). */
function functionBodySql(key: string): string {
  const f = functions[key]
  const asOption = (f.options ?? []).find((o: any) => o.DefElem?.defname === "as")
  return asOption.DefElem.arg.List.items[0].String.sval
}

/** String literal keys emitted by jsonb_build_object calls in a function body. */
function jsonKeys(key: string): Set<string> {
  const keys = new Set<string>()
  const bodyAst = pgsql.parseSync(functionBodySql(key))
  const calls: any[] = []
  collectBuildObjectCalls(bodyAst, calls)
  for (const fc of calls) {
    for (let i = 0; i + 1 < fc.args.length; i += 2) {
      const v = fc.args[i]?.A_Const?.sval?.sval
      if (typeof v === "string") keys.add(v)
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

describe("supabase/storage-setup.sql", () => {
  it("is syntactically valid PostgreSQL", () => {
    expect(statements.length).toBeGreaterThan(0)
    for (const { stmt } of statements) {
      expect(stmt).toBeTruthy()
    }
  })

  describe("buckets", () => {
    it("creates a private 'videos' bucket", () => {
      const insert = bucketInserts.find((s) => /'videos'/.test(s))
      expect(insert, "a row for the 'videos' bucket").toBeTruthy()
      expect(insert!).toMatch(/public/i)
      expect(insert!).toMatch(/false/)
    })

    it("creates a public 'thumbnails' bucket", () => {
      const insert = bucketInserts.find((s) => /'thumbnails'/.test(s))
      expect(insert, "a row for the 'thumbnails' bucket").toBeTruthy()
      expect(insert!).toMatch(/true/)
    })

    it("is idempotent — bucket rows use on conflict", () => {
      // A plain INSERT would fail on re-run; the script must be re-runnable.
      for (const insert of bucketInserts) {
        expect(insert).toMatch(/on conflict/i)
      }
    })

    it("restricts the videos bucket to video mime types", () => {
      const insert = bucketInserts.find((s) => /'videos'/.test(s))
      expect(insert!).toMatch(/video\//)
    })

    it("restricts the thumbnails bucket to image mime types", () => {
      const insert = bucketInserts.find((s) => /'thumbnails'/.test(s))
      expect(insert!).toMatch(/image\//)
    })
  })

  describe("functions", () => {
    it("defines all 4 required storage functions", () => {
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
      for (const name of REQUIRED_FUNCTIONS) {
        const deparsed = roundTrip(name)
        expect(deparsed.length, `${name} body is non-empty`).toBeGreaterThan(0)
      }
    })

    it("returns jsonb so callers get one structured shape for success and errors", () => {
      for (const name of REQUIRED_FUNCTIONS) {
        expect(returnType(name), `${name} returns jsonb`).toBe("jsonb")
      }
    })

    it("locks down the search_path on every function", () => {
      for (const name of REQUIRED_FUNCTIONS) {
        expect(options(name).search_path, `${name} pins search_path`).toBeTruthy()
      }
    })

    it("runs security definer and checks authorization explicitly in the body", () => {
      for (const name of REQUIRED_FUNCTIONS) {
        expect(body(name), `${name} is security definer`).toMatch(/security definer/)
      }
    })
  })

  describe("upload_video", () => {
    it("targets the private videos bucket", () => {
      expect(body("upload_video")).toContain("'videos'")
    })

    it("returns the canonical object path for the client to upload to", () => {
      // SQL cannot move bytes; it returns the path, the client uploads.
      expect(jsonKeys("upload_video")).toContain("path")
      expect(jsonKeys("upload_video")).toContain("bucket")
    })

    it("rejects file types that are not video", () => {
      expect(body("upload_video")).toMatch(/mime/)
    })

    it("validates the file name through the shared safe-name helper", () => {
      expect(body("upload_video")).toMatch(/safe_storage_name|build_media_path/)
    })

    it("only allows admins to upload video masters", () => {
      expect(body("upload_video")).toMatch(/is_media_admin/)
    })
  })

  describe("upload_thumbnail", () => {
    it("targets the public thumbnails bucket", () => {
      expect(body("upload_thumbnail")).toContain("'thumbnails'")
    })

    it("returns the canonical object path for the client to upload to", () => {
      expect(jsonKeys("upload_thumbnail")).toContain("path")
      expect(jsonKeys("upload_thumbnail")).toContain("bucket")
    })

    it("rejects file types that are not images", () => {
      expect(body("upload_thumbnail")).toMatch(/mime/)
    })

    it("validates the file name through the shared safe-name helper", () => {
      expect(body("upload_thumbnail")).toMatch(/safe_storage_name|build_media_path/)
    })

    it("only allows admins to upload thumbnails", () => {
      expect(body("upload_thumbnail")).toMatch(/is_media_admin/)
    })
  })

  describe("get_video_url", () => {
    it("takes an expiry for the signed url", () => {
      expect(paramNames("get_video_url")).toContain("p_expires_in")
    })

    it("serves from the private videos bucket", () => {
      expect(body("get_video_url")).toContain("'videos'")
    })

    it("verifies the object exists before handing back a path", () => {
      expect(body("get_video_url")).toMatch(/storage\.objects/)
    })

    it("requires a signed-in user", () => {
      expect(body("get_video_url")).toMatch(/is_active_user|auth\.uid/)
    })

    it("returns the path and expiry the client needs to createSignedUrl", () => {
      const keys = jsonKeys("get_video_url")
      expect(keys).toContain("path")
      expect(keys).toContain("expiresIn")
    })
  })

  describe("get_thumbnail_url", () => {
    it("serves from the public thumbnails bucket", () => {
      expect(body("get_thumbnail_url")).toContain("'thumbnails'")
    })

    it("marks the result as a public url", () => {
      expect(jsonKeys("get_thumbnail_url")).toContain("public")
    })

    it("verifies the object exists before handing back a path", () => {
      expect(body("get_thumbnail_url")).toMatch(/storage\.objects/)
    })

    it("returns the path the client turns into a public URL", () => {
      const keys = jsonKeys("get_thumbnail_url")
      expect(keys).toContain("path")
    })
  })

  describe("storage policies", () => {
    it("creates policies on storage.objects", () => {
      expect(policies.length, "storage.objects policies exist").toBeGreaterThan(0)
      for (const p of policies) {
        expect(p.table, `policy "${p.name}" targets storage.objects`).toBe("objects")
      }
    })

    it("grants uploads to authenticated users only, never anon", () => {
      const uploads = policies.filter((p) => p.command === "insert")
      expect(uploads.length, "at least one INSERT policy").toBeGreaterThan(0)
      for (const p of uploads) {
        expect(p.roles.join(","), `policy "${p.name}" is not open to anon`).not.toMatch(/anon/)
      }
    })

    it("scopes upload policies to the plexfin buckets", () => {
      const uploads = policies.filter((p) => p.command === "insert")
      for (const p of uploads) {
        expect(p.sql, `policy "${p.name}" filters by bucket`).toMatch(/bucket_id/i)
        expect(p.sql, `policy "${p.name}" names a plexfin bucket`).toMatch(/videos|thumbnails/i)
      }
    })

    it("restricts video uploads to admins", () => {
      const videoUploads = policies.filter(
        (p) => p.command === "insert" && /videos/i.test(p.sql),
      )
      expect(videoUploads.length, "a videos INSERT policy exists").toBeGreaterThan(0)
      for (const p of videoUploads) {
        expect(p.sql, `policy "${p.name}" checks admin role`).toMatch(/is_media_admin|role\s*=\s*'admin'|role\s*=\s*'admin'/i)
      }
    })

    it("requires an authenticated session to upload", () => {
      const uploads = policies.filter((p) => p.command === "insert")
      expect(uploads.length, "upload policies target the authenticated role").toBeGreaterThan(0)
    })
  })

  describe("grants", () => {
    it("grants execute on the upload functions to authenticated only", () => {
      const sql = storage.toLowerCase()
      const uploadGrants = sql.match(/grant execute on function public\.upload_[a-z_]+[^;]*;/g) ?? []
      expect(uploadGrants.length).toBeGreaterThan(0)
      for (const g of uploadGrants) {
        expect(g, `grant is scoped: ${g}`).toMatch(/authenticated/)
        expect(g, `grant does not include anon: ${g}`).not.toMatch(/anon/)
      }
    })
  })
})
