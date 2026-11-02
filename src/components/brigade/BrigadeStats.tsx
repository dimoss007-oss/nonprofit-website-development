export type BrigadeStatsData = { period_label: string; trips: number; families: number; km: number; districts: number; settlements: number; parcels: number };

const nf = (n: number) => n.toLocaleString("ru-RU");

export default function BrigadeStats({ stats }: { stats: BrigadeStatsData }) {
  const items = [
    { value: stats.trips, label: "выездов" },
    { value: stats.families, label: "семей получили помощь" },
    { value: stats.districts, label: "районов области" },
    { value: stats.settlements, label: "населённых пунктов" },
    { value: stats.km, label: "километров в пути" },
    { value: stats.parcels, label: "продуктовых наборов" },
  ];
  if (items.every(i => !i.value)) return null;
  return (
    <section className="py-14 px-5 bg-mist" aria-labelledby="brigade-stats-title">
      <div className="max-w-5xl mx-auto">
        <h2 id="brigade-stats-title" className="font-golos text-2xl sm:text-3xl font-bold text-navy text-center">Результаты бригады</h2>
        {stats.period_label && <p className="text-center text-sm text-navy/70 mt-2">{stats.period_label}</p>}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {items.map(i => (
            <div key={i.label} className="bg-white rounded-xl border border-azure/15 p-5 sm:p-6 text-center">
              <div className="font-golos text-4xl sm:text-5xl font-bold text-azure">{nf(i.value)}</div>
              <div className="text-sm text-navy/75 mt-2">{i.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
