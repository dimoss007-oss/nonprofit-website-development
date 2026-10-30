import { createFileRoute } from "@tanstack/react-router";
import DonationTerms from "@/pages/DonationTerms";

export const Route = createFileRoute("/donation-terms")({
  head: () => ({
    meta: [
      { title: "Условия внесения пожертвования — АНО «Спасение надежды»" },
      { name: "description", content: "Условия внесения добровольных пожертвований в пользу АНО «Спасение надежды». Порядок, цели и возврат пожертвований." },
    ],
    links: [{ rel: "canonical", href: "https://***.ru/donation-terms" }],
  }),
  component: DonationTerms,
});
