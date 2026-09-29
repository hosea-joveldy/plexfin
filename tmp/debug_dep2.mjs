import pgsql from "pgsql-parser"
await pgsql.loadModule()
const sql = `create or replace function public.f() returns jsonb language sql stable as $$ select '[]'::jsonb $$;`
const ast = pgsql.parseSync(sql)
const f = ast.stmts[0].stmt.CreateFunctionStmt
console.log("keys:", Object.keys(f))
console.log(JSON.stringify(f, (k,v)=> k==="stmt" && v && typeof v==="object" && Object.keys(v).length>3 ? "[obj]" : v).slice(0, 600))
