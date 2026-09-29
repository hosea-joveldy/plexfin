import pgsql from "pgsql-parser"
import { readFileSync } from "node:fs"
await pgsql.loadModule()
const sql = readFileSync("supabase/rpc.sql", "utf8")
const ast = pgsql.parseSync(sql)
let n = 0
for (const { stmt } of ast.stmts) {
  const keys = Object.keys(stmt)
  if (keys.includes("CreateFunctionStmt")) n++
  console.log(keys.join(","), "->", keys.includes("CreateFunctionStmt") ? stmt.CreateFunctionStmt.funcname.map(x=>x.String.sval).join(".") : "")
}
console.log("total CreateFunctionStmt:", n)
