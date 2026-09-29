import Hero from '@/components/home/Hero'
import ContentRow from '@/components/home/ContentRow'
import useContent from '@/hooks/useContent'

export default function Home() {
  const { contentRows, loading } = useContent()

  return (
    <div className="flex flex-col">
      <Hero />
      {loading ? <p className="px-8 py-6 text-sm text-white/60">Loading titles…</p> : null}
      {contentRows.map((row) => (
        <ContentRow key={row.id} title={row.title} items={row.items} showProgress={row.type === 'continue_watching'} />
      ))}
    </div>
  )
}
