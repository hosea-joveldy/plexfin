import Hero from "@/components/home/Hero";
import ContentRow from "@/components/home/ContentRow";
import Hero from '@/components/home/Hero';
import ContentRow from '@/components/home/ContentRow';
import useContent from '@/hooks/useContent';

export default function Home() {
  const { featuredContent, contentRows, loading, error } = useContent();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="flex flex-col">
      <Hero content={featuredContent} />
      {contentRows.map((row, index) => (
        <ContentRow
          key={index}
          title={row.title}
          items={row.items}
          showProgress={row.type === 'continue_watching'}
        />
      ))}
    </div>
  );
}