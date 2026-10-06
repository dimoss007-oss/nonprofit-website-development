import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { cabinetGet, money } from "@/components/cabinet/cabinet.shared";

type Row = { place: number; name: string; total: number; count: number; me: boolean };

export default function CabinetRating() {
  const [data, setData] = useState<{ top: Row[]; me: Row | null; total_donors: number } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    cabinetGet<{ top: Row[]; me: Row | null; total_donors: number }>("rating").then(setData).catch((e) => setError(e instanceof Error ? e.message : "Ошибка"));
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin" /></div>;
  if (!data.top.length) return <p className="text-sm text-ink/40 bg-white border border-beige-dark rounded-2xl p-8 text-center">Рейтинг появится, когда его участники сделают пожертвования.</p>;

  const medal = (p: number) => (p === 1 ? "text-amber-500" : p === 2 ? "text-slate-400" : p === 3 ? "text-orange-400" : "text-ink/30");
  const inTop = data.top.some((r) => r.me);

  return (
    <div className="space-y-4">
      <p className="text-xs text-ink/50">Рейтинг показывает имя и первую букву фамилии. Скрыть себя можно в профиле.</p>
      <div className="bg-white border border-beige-dark rounded-3xl divide-y divide-beige-mid overflow-hidden">
        {data.top.map((r) => (
          <div key={r.place} className={`flex items-center gap-3 px-5 py-3.5 ${r.me ? "bg-sage-pale/60" : ""}`}>
            <span className={`w-8 flex justify-center ${medal(r.place)}`}>{r.place <= 3 ? <Icon name="Trophy" size={18} /> : <span className="text-sm font-semibold">{r.place}</span>}</span>
            <span className="flex-1 text-sm text-ink font-medium">{r.name}{r.me && <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-ink text-beige">это вы</span>}</span>
            <span className="text-xs text-ink/40">{r.count} раз</span>
            <span className="text-sm font-semibold text-ink w-28 text-right">{money(r.total)}</span>
          </div>
        ))}
      </div>
      {data.me && !inTop && <p className="text-sm text-ink/70 text-center">Вы на {data.me.place}-м месте из {data.total_donors}</p>}
    </div>
  );
}
