import { useEffect, useState } from "react";
import SiteFooter from "@/components/shared/SiteFooter";
import VideoActionWidget from "@/components/home/VideoActionWidget";
import TargetDonationModal from "@/components/TargetDonationModal";
import { CABINET_URL } from "@/components/cabinet/cabinet.shared";
import BrigadeHero from "@/components/brigade/BrigadeHero";
import BrigadeProcess from "@/components/brigade/BrigadeProcess";
import BrigadeStats, { BrigadeStatsData } from "@/components/brigade/BrigadeStats";
import BrigadeMap, { Trip } from "@/components/brigade/BrigadeMap";
import BrigadeStories from "@/components/brigade/BrigadeStories";
import BrigadeGoals, { BrigadeAction } from "@/components/brigade/BrigadeGoals";
import BrigadeRecurring from "@/components/brigade/BrigadeRecurring";
import BrigadePartnerForm from "@/components/brigade/BrigadePartnerForm";

export default function MobileBrigade() {
  const [stats, setStats] = useState<BrigadeStatsData | null>(null);
  const [actions, setActions] = useState<BrigadeAction[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [active, setActive] = useState<BrigadeAction | null>(null);

  useEffect(() => {
    fetch(`${CABINET_URL}?view=brigade`).then(r => r.json())
      .then(d => { setStats(d.stats || null); setActions(d.actions || []); setTrips(d.trips || []); })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white font-golos">
      <BrigadeHero showCta />
      <main>
        <BrigadeProcess />
        {stats && <BrigadeStats stats={stats} />}
        <BrigadeMap trips={trips} />
        <BrigadeStories />
        <VideoActionWidget
          categories={["brigade_prep", "brigade_districts", "center_address", "mobile_brigade"]}
          title="Видео о работе бригады"
          subtitle="Короткие ролики: сборы бригады, помощь в районах и обращение центра"
        />
        <section id="help" className="py-14 px-5 bg-navy" aria-label="Поддержать бригаду">
          <div className="max-w-5xl mx-auto space-y-10">
            <BrigadeGoals actions={actions} onPick={setActive} />
            <BrigadeRecurring />
          </div>
        </section>
        <BrigadePartnerForm />
      </main>
      <TargetDonationModal
        open={!!active}
        onClose={() => setActive(null)}
        goalId={active?.goal_id}
        title={active?.title || ""}
        currentAmount={0}
        targetAmount={0}
        defaultAmount={active?.amount}
      />
      <SiteFooter />
    </div>
  );
}
