import { createFileRoute } from "@tanstack/react-router";
import MobileBrigade from "@/pages/MobileBrigade";

export const Route = createFileRoute("/mobile-brigade")({
  head: () => ({
    meta: [
      { title: "Мобильная выездная бригада — Спасение надежды" },
      { name: "description", content: "Мы приезжаем туда, где нужна помощь. Результаты выездов, истории семей и адресный сбор." },
    ],
  }),
  component: MobileBrigade,
});
