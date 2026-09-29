import pgsql from "pgsql-parser"
await pgsql.loadModule()
const sql = `create or replace function public.f() returns jsonb language sql stable as $$ select '[]'::jsonb $$;`
const ast = pgsql.parseSync(sql)
const f = ast.stmts[0].stmt.CreateFunctionStmt
// strip the 'replace' field like the existing api.test.ts probably does? check how roundTrip works there
const clone = { ...f, replace: undefined }
try { console.log("no-replace ok:", pgsql.deparseSync(clone).slice(0,80)) } catch (e) { console.log("no-replace fail:", e.message) }
