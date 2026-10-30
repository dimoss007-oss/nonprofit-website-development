import { createFileRoute } from "@tanstack/react-router";
import Partners from "@/pages/Partners";

export const Route = createFileRoute("/partners")({
  head: () => ({
    meta: [
      { title: "Партнёры — АНО «Спасение надежды»" },
      { name: "description", content: "Партнёры кризисного центра «Спасение надежды» — организации, при поддержке которых реализуется проект помощи семьям в Пензе." },
      { property: "og:title", content: "Партнёры — АНО «Спасение надежды»" },
      { property: "og:description", content: "Организации, при поддержке которых реализуется наш проект." },
    ],
    links: [{ rel: "canonical", href: "https://***.ru/partners" }],
  }),
  component: Partners,
});
