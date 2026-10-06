import Icon from "@/components/ui/icon";
import { Overview, colorOf, downloadPdf, cabinetPost, fmtDate, money } from "@/components/cabinet/cabinet.shared";
import { useState } from "react";

export default function CabinetAchievements({ data }: { data: Overview }) {
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const earned = data.achievements.filter((a) => a.earned);
  const locked = data.achievements.filter((a) => !a.earned);

  const certificate = async (id: number) => {
    setBusyId(id); setError("");
    try {
      const d = await cabinetPost<{ file_name: string; file_base64: string }>({ action: "certificate", achievement_id: id });
      downloadPdf(d.file_name, d.file_base64);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось создать сертификат");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-beige-dark rounded-3xl p-6">
        <h3 className="font-semibold text-ink text-sm uppercase tracking-wide mb-4">Уровни</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {data.levels.map((lv) => {
            const reached = data.stats.total >= Number(lv.min_amount);
            const isCurrent = data.level.current?.id === lv.id;
            const s = colorOf(lv.color);
            return (
              <div key={lv.id} className={`rounded-2xl border p-4 ${isCurrent ? "border-ink bg-white shadow-sm" : "border-beige-dark bg-beige-mid/50"} ${reached ? "" : "opacity-60"}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg} ${s.text}`}><Icon name={lv.icon} fallback="Heart" size={18} /></div>
                <p className="font-semibold text-ink text-sm mt-2">{lv.title}</p>
                <p className="text-xs text-ink/50">от {money(lv.min_amount)}</p>
                {isCurrent && <p className="text-[10px] text-sage-dark font-semibold mt-1">Ваш уровень</p>}
              </div>
            );
          })}
        </div>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div>
        <h3 className="font-semibold text-ink text-sm uppercase tracking-wide mb-3">Полученные награды ({earned.length})</h3>
        {earned.length === 0 ? (
          <p className="text-sm text-ink/40 bg-white border border-beige-dark rounded-2xl p-6 text-center">Пока наград нет. Первая появится после первого пожертвования.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {earned.map((a) => {
              const s = colorOf(a.color);
              return (
                <div key={a.id} className={`bg-white border border-beige-dark rounded-2xl p-4 flex gap-3 ring-1 ${s.ring}`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg} ${s.text}`}><Icon name={a.icon} fallback="Award" size={22} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink text-sm">{a.title}</p>
                    <p className="text-xs text-ink/50">{a.description}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-[11px] text-ink/40">{fmtDate(a.awarded_at)}</span>
                      {a.certificate && (
                        <button onClick={() => certificate(a.id)} disabled={busyId === a.id} className="text-[11px] text-sage-dark font-semibold hover:underline flex items-center gap-1 disabled:opacity-60">
                          <Icon name={busyId === a.id ? "Loader" : "Download"} size={11} className={busyId === a.id ? "animate-spin" : ""} />Сертификат
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {locked.length > 0 && (
        <div>
          <h3 className="font-semibold text-ink text-sm uppercase tracking-wide mb-3">Впереди ({locked.length})</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {locked.map((a) => (
              <div key={a.id} className="bg-white/60 border border-dashed border-beige-dark rounded-2xl p-4 flex gap-3">
                <div className="w-12 h-12 rounded-xl bg-beige-mid text-ink/30 flex items-center justify-center flex-shrink-0"><Icon name="Lock" size={18} /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ink/70 text-sm">{a.title}</p>
                  <p className="text-xs text-ink/40">{a.description}</p>
                  {a.progress ? (
                    <div className="mt-2">
                      <div className="h-1.5 bg-beige-mid rounded-full overflow-hidden"><div className="h-full bg-sage rounded-full" style={{ width: `${a.progress.pct}%` }} /></div>
                      <p className="text-[10px] text-ink/40 mt-1">{a.kind === "total_amount" ? `${money(a.progress.value)} из ${money(a.progress.target)}` : `${Math.floor(a.progress.value)} из ${a.progress.target}`}</p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-ink/40 mt-1">Выдаётся центром</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
