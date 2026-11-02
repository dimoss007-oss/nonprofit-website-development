import { useState } from "react";
import Icon from "@/components/ui/icon";
import { PENZA_MAP, project } from "@/lib/penza-map";

export type Trip = { id: number; district: string; lat: number; lon: number; title: string; description: string; photo_url: string | null; trip_date: string | null };

export default function BrigadeMap({ trips }: { trips: Trip[] }) {
  const [activeId, setActiveId] = useState<number | null>(null);
  if (trips.length === 0) return null;
  const active = trips.find(t => t.id === activeId) || null;

  return (
    <section className="py-14 px-5 bg-white" aria-labelledby="brigade-map-title">
      <div className="max-w-5xl mx-auto">
        <h2 id="brigade-map-title" className="font-golos text-2xl sm:text-3xl font-bold text-navy text-center">Карта добрых дел</h2>
        <p className="text-center text-navy/75 mt-2">Нажмите на отметку, чтобы узнать о выезде в район</p>
        <div className="grid md:grid-cols-2 gap-6 mt-8 items-start">
          <div className="bg-mist rounded-xl border border-azure/15 p-3">
            <svg viewBox={`0 0 ${PENZA_MAP.width} ${PENZA_MAP.height}`} className="w-full h-auto" role="group" aria-label="Карта Пензенской области">
              <path d={PENZA_MAP.path} fill="#dbeafe" stroke="#1d4ed8" strokeWidth="1.5" strokeLinejoin="round" />
              {trips.map(t => {
                const { x, y } = project(t.lat, t.lon);
                const on = t.id === activeId;
                return (
                  <g key={t.id} transform={`translate(${x} ${y})`} onClick={() => setActiveId(t.id)} className="cursor-pointer">
                    <circle r="18" fill="transparent" />
                    <circle r={on ? 9 : 7} fill={on ? "#0f766e" : "#1d4ed8"} stroke="#fff" strokeWidth="2.5" />
                    <foreignObject x="-22" y="-22" width="44" height="44">
                      <button type="button" onClick={() => setActiveId(t.id)} aria-label={`${t.district}: ${t.title}`} aria-pressed={on} className="w-11 h-11 rounded-full opacity-0 focus-visible:opacity-100" />
                    </foreignObject>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="min-h-[200px]">
            {active ? (
              <article className="bg-white rounded-xl border border-azure/20 overflow-hidden shadow-sm">
                {active.photo_url && <img src={active.photo_url} alt="" loading="lazy" className="w-full h-48 object-cover" />}
                <div className="p-5">
                  <p className="text-xs uppercase tracking-wide text-teal-deep font-semibold">{active.district}</p>
                  <h3 className="font-golos text-xl font-bold text-navy mt-1">{active.title}</h3>
                  {active.description && <p className="text-sm text-navy/80 mt-2 leading-relaxed">{active.description}</p>}
                </div>
              </article>
            ) : (
              <div className="rounded-xl border border-dashed border-azure/30 p-6 text-navy/70 text-sm flex items-start gap-3">
                <Icon name="MapPin" size={20} className="text-azure shrink-0" />
                Выберите отметку на карте
              </div>
            )}
            <ul className="mt-4 flex flex-wrap gap-2">
              {trips.map(t => (
                <li key={t.id}>
                  <button onClick={() => setActiveId(t.id)} className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${t.id === activeId ? "bg-azure text-white border-azure" : "bg-white text-navy border-azure/25 hover:bg-mist"}`}>{t.district}</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
