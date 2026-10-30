import { createFileRoute } from "@tanstack/react-router";
import DonatePay from "@/pages/DonatePay";

export const Route = createFileRoute("/donate-pay")({
  component: DonatePay,
});
