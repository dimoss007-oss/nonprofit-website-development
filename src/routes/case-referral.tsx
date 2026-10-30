import { createFileRoute } from "@tanstack/react-router";
import CaseReferral from "@/pages/CaseReferral";

export const Route = createFileRoute("/case-referral")({
  head: () => ({
    meta: [
      { title: "Для обращений — АНО «Спасение надежды»" },
      { name: "description", content: "Форма для обращений от организаций и специалистов о семьях и людях, нуждающихся в помощи." },
      { property: "og:title", content: "Для обращений — АНО «Спасение надежды»" },
      { property: "og:description", content: "Сообщите о случае, требующем помощи кризисного центра." },
    ],
    links: [{ rel: "canonical", href: "https://***.ru/case-referral" }],
  }),
  component: CaseReferral,
});
