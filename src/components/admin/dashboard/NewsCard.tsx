import Icon from "@/components/ui/icon";
import DashboardCard from "./DashboardCard";
import type { DashboardSummary } from "./dashboard.types";

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });

export default function NewsCard({ data, loading }: { data?: DashboardSummary["news"]; loading: boolean }) {
  return (
    <DashboardCard title="Новости" icon="Newspaper" iconClass="bg-amber-50 text-amber-600" loading={loading} className="lg:col-span-3">
      {data && data.length === 0 && <p className="text-sm text-ink/50">Новостей пока нет</p>}
      <ul className="grid gap-3 grid-cols-1 md:grid-cols-3">
        {data?.map(n => (
          <li key={n.id} className="flex gap-3 rounded-xl border border-beige-dark bg-beige-mid p-3 min-w-0">
            {n.photo ? (
              <img src={n.photo} alt="" loading="lazy" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-beige-dark flex items-center justify-center flex-shrink-0 text-ink/30">
                <Icon name="Image" size={20} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink line-clamp-2 break-words">{n.title}</p>
              <p className="text-xs text-ink/60 mt-1 line-clamp-2 break-words">{n.snippet}</p>
              <p className="text-[11px] text-ink/40 mt-1">{formatDate(n.date)}</p>
            </div>
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}
