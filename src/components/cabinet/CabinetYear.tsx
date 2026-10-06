import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { cabinetGet, money } from "@/components/cabinet/cabinet.shared";

const MONTHS = ["январе", "феврале", "марте", "апреле", "мае", "июне", "июле", "августе", "сентябре", "октябре", "ноябре", "декабре"];

type Summary = {
  year: number; empty: boolean; total?: number; count?: number; best_month?: number; best_month_amount?: number;
  months_active?: number; awards?: string[]; impact?: { title: string; icon: string; unit_label: string; count: number }[];
};

export default function CabinetYear({ years }: { years: number[] }) {
  const [year, setYear] = useState(years[0] || new Date().getFullYear());
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setData(null);
    cabinetGet<Summary>("year_summary", `&year=${year}`).then(setData).catch((e) => setError(e instanceof Error ? e.message : "Ошибка"));
  }, [year]);

  return (
    <div className="space-y-4">
      {years.length > 1 && (
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="border border-beige-dark rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-ink">
          {years.map((y) => <option key={y} value={y}>{y} год</option>)}
        </select>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!data && !error && <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin" /></div>}
      {data?.empty && <p className="text-sm text-ink/40 bg-white border border-beige-dark rounded-2xl p-8 text-center">За {data.year} год пожертвований пока нет.</p>}
      {data && !data.empty && (
        <div className="bg-ink text-beige rounded-3xl p-8">
          <p className="text-xs uppercase tracking-widest text-beige/50">Ваш {data.year} год в добре</p>
          <p className="font-cormorant text-6xl font-semibold mt-2 leading-none">{money(data.total)}</p>
          <p className="text-beige/60 text-sm mt-2">{data.count} пожертвований, помощь в {data.months_active} мес. года</p>
          {data.best_month && <p className="text-sm text-beige/80 mt-4 flex items-center gap-2"><Icon name="Sparkles" size={14} />Самая щедрая помощь была в {MONTHS[data.best_month - 1]}: {money(data.best_month_amount)}</p>}
          {!!data.impact?.some((i) => i.count > 0) && (
            <div className="grid sm:grid-cols-2 gap-2 mt-6">
              {data.impact.filter((i) => i.count > 0).map((i) => (
                <div key={i.title} className="bg-white/10 rounded-2xl px-4 py-3 flex items-center gap-3">
                  <Icon name={i.icon} fallback="Heart" size={18} className="text-beige/70" />
                  <span className="text-sm"><span className="font-cormorant text-2xl font-semibold mr-1.5">{i.count}</span><span className="text-beige/70">{i.unit_label}</span></span>
                </div>
              ))}
            </div>
          )}
          {!!data.awards?.length && <p className="text-xs text-beige/60 mt-5">Награды года: {data.awards.join(", ")}</p>}
          <p className="text-sm text-beige/80 mt-6 font-cormorant text-xl">Спасибо, что вы с нами.</p>
        </div>
      )}
    </div>
  );
}
