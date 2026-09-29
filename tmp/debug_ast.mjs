import pgsql from "pgsql-parser"
import { readFileSync } from "node:fs"
await pgsql.loadModule()
const sql = readFileSync("supabase/rpc.sql", "utf8")
const ast = pgsql.parseSync(sql)
for (const { stmt } of ast.stmts) {
  if (stmt.CreateFunctionStmt) {
    const f = stmt.CreateFunctionStmt
    console.log("funcname:", JSON.stringify(f.funcname))
    console.log("returnType:", JSON.stringify(f.returnType?.names))
    console.log("params:", JSON.stringify((f.parameters ?? []).slice(0,2)))
    break
  }
}
