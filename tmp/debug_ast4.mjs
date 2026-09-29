import pgsql from "pgsql-parser"
import { readFileSync } from "node:fs"
await pgsql.loadModule()
const sql = readFileSync("supabase/rpc.sql", "utf8")
const ast = pgsql.parseSync(sql)
console.log("count:", ast.stmts.length)
for (const { stmt } of ast.stmts) console.log(Object.keys(stmt)[0])
