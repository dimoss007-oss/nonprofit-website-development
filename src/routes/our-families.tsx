import { createFileRoute } from "@tanstack/react-router";
import OurFamilies from "@/pages/OurFamilies";

export const Route = createFileRoute("/our-families")({
  component: OurFamilies,
});
