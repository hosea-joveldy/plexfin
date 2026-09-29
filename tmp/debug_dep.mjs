import pgsql from "pgsql-parser"
await pgsql.loadModule()
const sql = `create or replace function public.f() returns jsonb language sql stable as $$ select '[]'::jsonb $$;`
const ast = pgsql.parseSync(sql)
const f = ast.stmts[0].stmt.CreateFunctionStmt
try { console.log("raw ok:", pgsql.deparseSync(f).slice(0,60)) } catch (e) { console.log("raw fail:", e.message) }
try { console.log("wrap ok:", pgsql.deparseSync({stmt: f}).slice(0,60)) } catch (e) { console.log("wrap fail:", e.message) }
try { console.log("rawStmt ok:", pgsql.deparseSync(ast.stmts[0]).slice(0,60)) } catch (e) { console.log("rawStmt fail:", e.message) }
