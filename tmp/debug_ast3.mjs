import pgsql from "pgsql-parser"
await pgsql.loadModule()
const sql = `create function public.f() returns jsonb language sql stable as $$ select '[]'::jsonb $$;`
const ast = pgsql.parseSync(sql)
console.log("keys:", Object.keys(ast.stmts[0].stmt))
