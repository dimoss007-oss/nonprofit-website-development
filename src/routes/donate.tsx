import { createFileRoute } from "@tanstack/react-router";
import Donate from "@/pages/Donate";

export const Route = createFileRoute("/donate")({
  component: Donate,
});
