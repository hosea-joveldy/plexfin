import Hero from "@/components/home/Hero";
import ContentRow from "@/components/home/ContentRow";
import { contentRows } from "@/data/mock-rows";

export default function Home() {
  return (
    <div className="flex flex-col">
      <Hero />
      {contentRows.map((row) => (
        <ContentRow
          key={row.id}
          title={row.title}
          items={row.items}
          showProgress={row.id === "continue-watching"}
        />
      ))}
    </div>
  );
}