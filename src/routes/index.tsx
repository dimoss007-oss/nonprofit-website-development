import { createFileRoute } from "@tanstack/react-router";
import Index from "@/pages/Index";
import { fetchNewsList } from "@/lib/news-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "АНО «Спасение надежды» — кризисный центр в Пензе" },
      { name: "description", content: "Кризисный центр для семей, попавших в трудную жизненную ситуацию. Помощь, поддержка, реабилитация в Пензе." },
      { property: "og:title", content: "АНО «Спасение надежды» — кризисный центр в Пензе" },
      { property: "og:description", content: "Кризисный центр для семей, попавших в трудную жизненную ситуацию. Помощь, поддержка, реабилитация в Пензе." },
    ],
    links: [{ rel: "canonical", href: "https://***.ru" }],
  }),
  loader: async () => {
    const news = await fetchNewsList();
    return { news: news ? news.slice(0, 3) : null };
  },
  component: IndexRoute,
});

function IndexRoute() {
  const data = Route.useLoaderData();
  return <Index initialNews={data?.news ?? null} />;
}