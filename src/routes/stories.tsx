import { createFileRoute } from "@tanstack/react-router";
import Stories from "@/pages/Stories";

export const Route = createFileRoute("/stories")({
  component: Stories,
});
