import pgsql from "pgsql-parser"
await pgsql.loadModule()
const sql = `
create or replace view public.content_items with (security_invoker = true) as
  select c.slug from public.content c where c.status = 'published';

create or replace function public.get_continue_watching(
  p_user_id uuid default auth.uid(),
  p_limit integer default 20
)
returns jsonb
language sql
stable
as $$
  select coalesce(jsonb_agg(content_item_json(wi.item, wi.progress)), '[]'::jsonb)
  from (
    select item, progress
    from watch_history
    order by last_watched_at desc
    limit least(greatest(p_limit, 1), 50)
  ) wi;
$$;
`
const ast = pgsql.parseSync(sql)
for (const { stmt } of ast.stmts) {
  try {
    const d = pgsql.deparseSync(stmt)
    console.log("=== DEPARSE ===\n" + d)
  } catch (e) {
    console.log("DEPARSE FAILED:", String(e).slice(0, 300))
  }
}
const f = ast.stmts[1].stmt.CreateFunctionStmt
console.log("params:", JSON.stringify(f.parameters.map(p => ({
  name: p.FunctionParameter.name,
  mode: p.FunctionParameter.mode,
  type: p.FunctionParameter.argType.names.map(n => n.String.sval).filter(Boolean),
  defexpr: !!p.FunctionParameter.defexpr,
}))))
console.log("returnType:", f.returnType.names.map(n => n.String.sval).filter(Boolean))
console.log("replace:", f.replace)
