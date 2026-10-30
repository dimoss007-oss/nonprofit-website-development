import { createFileRoute } from "@tanstack/react-router";
import Program from "@/pages/Program";

export const Route = createFileRoute("/program")({
  head: () => ({
    meta: [
      { title: "Программы — АНО «Спасение надежды»" },
      { name: "description", content: "Программы помощи семьям кризисного центра «Спасение надежды» в Пензе: реабилитация, психологическая поддержка, социальная помощь." },
      { property: "og:title", content: "Программы — АНО «Спасение надежды»" },
      { property: "og:description", content: "Программы помощи семьям: реабилитация, психологическая поддержка, социальная помощь." },
    ],
    links: [{ rel: "canonical", href: "https://***.ru/program" }],
  }),
  component: Program,
});
