import { createFileRoute } from "@tanstack/react-router";
import News from "@/pages/News";
import { fetchNewsList } from "@/lib/news-data";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "Новости — АНО «Спасение надежды»" },
      { name: "description", content: "Актуальные новости кризисного центра «Спасение надежды» в Пензе. Помощь семьям в трудной жизненной ситуации." },
      { property: "og:title", content: "Новости — АНО «Спасение надежды»" },
      { property: "og:description", content: "Актуальные новости кризисного центра «Спасение надежды» в Пензе." },
    ],
    links: [{ rel: "canonical", href: "https://***.ru/news" }],
  }),
  loader: async () => ({ news: await fetchNewsList() }),
  component: NewsRoute,
});

function NewsRoute() {
  const data = Route.useLoaderData();
  return <News initialNews={data?.news ?? null} />;
}
