import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import Icon from "@/components/ui/icon";
import SiteFooter from "@/components/shared/SiteFooter";
import TopStoriesWidget from "@/components/home/TopStoriesWidget";
import VideoActionWidget from "@/components/home/VideoActionWidget";
import TargetDonationModal from "@/components/TargetDonationModal";
import { CABINET_URL } from "@/components/cabinet/cabinet.shared";

const HERO_URL = "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/files/fb5b6930-e8ca-4e47-8918-2079633bec5a.jpg";

type Stats = { period_label: string; trips: number; families: number; km: number; map_url: string | null };
type Action = { id: number; title: string; amount: number; goal_id: number };

const nf = (n: number) => n.toLocaleString("ru-RU");

export default function MobileBrigade() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [actions, setActions] = useState<Action[]>([]);
  const [active, setActive] = useState<Action | null>(null);

  useEffect(() => {
    fetch(`${CABINET_URL}?view=brigade`).then(r => r.json())
      .then(d => { setStats(d.stats || null); setActions(d.actions || []); })
      .catch(() => {});
  }, []);

  const counters = stats ? [
    { value: stats.trips, label: "Выездов", icon: "Truck" },
    { value: stats.families, label: "Семей проконсультировано", icon: "Users" },
    { value: stats.km, label: "Километров пройдено", icon: "Route" },
  ] : [];

  return (
    <div className="min-h-screen bg-beige font-golos">
      <header className="relative bg-ink text-beige">
        <img src={HERO_URL} alt="Мобильная выездная бригада" className="absolute inset-0 w-full h-full object-cover opacity-45" />
        <div className="relative max-w-4xl mx-auto px-4 py-24 sm:py-32 text-center">
          <Link to="/" className="text-sm text-beige/70 hover:underline">На главную</Link>
          <h1 className="font-cormorant text-4xl sm:text-6xl font-semibold mt-4 mb-5 leading-tight">Мобильная выездная бригада</h1>
          <p className="text-lg text-beige/90 max-w-2xl mx-auto leading-relaxed">
            Мы приезжаем туда, где нужна помощь: в отдалённые сёла и районы, к семьям, которые не могут добраться до центра сами.
          </p>
          {actions.length > 0 && (
            <a href="#help" className="inline-flex items-center gap-2 mt-8 px-7 py-3.5 rounded-xl bg-beige text-ink font-semibold hover:opacity-90 transition-opacity">
              <Icon name="HeartHandshake" size={18} /> Поддержать выезды
            </a>
          )}
        </div>
      </header>

      <main>
        {stats && (stats.trips > 0 || stats.families > 0 || stats.km > 0) && (
          <section className="py-14 px-4" aria-label="Результаты бригады">
            <div className="max-w-5xl mx-auto">
              {stats.period_label && <p className="text-center text-sm uppercase tracking-widest text-ink/50 mb-6">{stats.period_label}</p>}
              <div className="grid sm:grid-cols-3 gap-5">
                {counters.map(c => (
                  <div key={c.label} className="bg-white rounded-2xl border border-beige-dark/60 p-6 text-center">
                    <Icon name={c.icon} size={22} className="mx-auto text-ink/40 mb-2" />
                    <div className="font-cormorant text-5xl font-semibold text-ink">{nf(c.value)}</div>
                    <div className="text-sm text-ink/60 mt-1">{c.label}</div>
                  </div>
                ))}
              </div>
              {stats.map_url && (
                <div className="mt-8 rounded-2xl overflow-hidden border border-beige-dark/60 bg-white aspect-[16/10]">
                  <iframe src={stats.map_url} title="Карта выездов бригады" loading="lazy" className="w-full h-full border-0" />
                </div>
              )}
            </div>
          </section>
        )}

        <TopStoriesWidget tag="mobile_brigade" title="Истории помощи" subtitle="Что мы сделали в поездках бригады" donateSrc="brigade" />
        <VideoActionWidget category="mobile_brigade" title="Бригада в действии" />

        {actions.length > 0 && (
          <section id="help" className="py-16 px-4 bg-ink text-beige" aria-labelledby="brigade-help-title">
            <div className="max-w-3xl mx-auto text-center">
              <h2 id="brigade-help-title" className="font-cormorant text-4xl font-semibold mb-3">На что пойдёт ваша помощь</h2>
              <p className="text-beige/70 mb-8">Выберите, что именно вы хотите оплатить. Сумму можно изменить при оплате.</p>
              <div className="grid gap-3">
                {actions.map(a => (
                  <button key={a.id} onClick={() => setActive(a)}
                    className="flex items-center justify-between gap-4 text-left rounded-2xl bg-beige text-ink px-6 py-4 hover:opacity-90 transition-opacity">
                    <span className="font-medium">{a.title}</span>
                    <span className="whitespace-nowrap text-sm font-semibold">от {nf(a.amount)} ₽</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}
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
