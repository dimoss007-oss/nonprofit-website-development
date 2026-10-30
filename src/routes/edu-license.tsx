import { createFileRoute } from "@tanstack/react-router";
import EduLicense from "@/pages/EduLicense";

export const Route = createFileRoute("/edu-license")({
  head: () => ({
    meta: [
      { title: "Сведения об образовательной лицензии — АНО «Спасение надежды»" },
      { name: "description", content: "Официальные документы, регламентирующие образовательную деятельность АНО «Спасение надежды»: программы дополнительного образования, положения и отчёты." },
    ],
    links: [{ rel: "canonical", href: "https://***.ru/edu-license" }],
  }),
  component: EduLicense,
});
