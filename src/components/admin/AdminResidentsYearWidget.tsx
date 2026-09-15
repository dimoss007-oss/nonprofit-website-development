import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { API } from "@/components/admin/crm/crmShared";

type Stats = {
  year: number;
  admitted_this_year: number;
  carried_over: number;
  total_residents_this_year: number;
  children_admitted_this_year: number;
  children_carried_over: number;
  total_children_this_year: number;
};

export default function AdminResidentsYearWidget() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}?view=stats`)
      .then(r => r.json())
      .then(d => setStats(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="bg-white rounded-2xl border border-beige-dark p-5">
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-beige-dark rounded w-1/2" />
        <div className="h-8 bg-beige-dark rounded w-1/3" />
      </div>
    </div>
  );

  if (!stats) return null;

  return (
    <div className="bg-white rounded-2xl border border-beige-dark p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
          <Icon name="HeartHandshake" size={16} className="text-blue-600" />
        </div>
        <h3 className="font-semibold text-ink text-sm">Оказана помощь за {stats.year} год</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-ink/50 mb-0.5">
            <Icon name="Users" size={13} />
            <span className="text-xs">Взрослых</span>
          </div>
          <p className="font-cormorant text-4xl font-semibold text-ink">{stats.total_residents_this_year}</p>
          <p className="text-xs text-ink/40 mt-0.5">{stats.admitted_this_year} поступили · {stats.carried_over} с прошлого года</p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-ink/50 mb-0.5">
            <Icon name="Baby" size={13} />
            <span className="text-xs">Детей</span>
          </div>
          <p className="font-cormorant text-4xl font-semibold text-ink">{stats.total_children_this_year}</p>
          <p className="text-xs text-ink/40 mt-0.5">{stats.children_admitted_this_year} поступили · {stats.children_carried_over} с прошлого года</p>
        </div>
      </div>
    </div>
  );
}
