import { createFileRoute } from "@tanstack/react-router";
import Gratitude from "@/pages/Gratitude";

export const Route = createFileRoute("/gratitude")({
  component: Gratitude,
});
