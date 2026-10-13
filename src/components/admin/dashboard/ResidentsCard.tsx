import { useState } from "react";
import DashboardCard from "./DashboardCard";
import type { DashboardSummary } from "./dashboard.types";

interface Props {
  data?: DashboardSummary["residents"];
  loading: boolean;
  onSaveCapacity: (capacity: number) => Promise<boolean>;
}

export default function ResidentsCard({ data, loading, onSaveCapacity }: Props) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0) return;
    setSaving(true);
    await onSaveCapacity(n);
    setSaving(false);
    setValue("");
  };

  return (
    <DashboardCard title="Оперативная сводка" icon="Users" iconClass="bg-blue-50 text-blue-600" loading={loading}>
      {data && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="В стационаре" value={data.totalActive} />
            <Stat label="Детей с ними" value={data.totalChildren} />
            <Stat label="Свободных мест" value={data.freeBeds ?? "—"} />
            <Stat label="Новые за неделю" value={data.newThisWeek} />
          </div>
          {data.freeBeds === null && (
            <div className="flex items-center gap-2">
              <input
                value={value}
                onChange={e => setValue(e.target.value.replace(/\D/g, ""))}
                placeholder="Всего мест в центре"
                inputMode="numeric"
                className="flex-1 min-w-0 border border-beige-dark rounded-lg px-3 py-2 text-sm bg-beige/50 focus:outline-none focus:border-ink"
              />
              <button onClick={save} disabled={saving || !value} className="px-3 py-2 rounded-lg text-sm bg-ink text-beige disabled:opacity-50">
                Сохранить
              </button>
            </div>
          )}
        </div>
      )}
    </DashboardCard>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-beige-mid rounded-xl px-3 py-3 min-w-0">
      <p className="text-2xl font-semibold text-ink break-words">{value}</p>
      <p className="text-xs text-ink/60 mt-1 break-words leading-snug">{label}</p>
    </div>
  );
}
