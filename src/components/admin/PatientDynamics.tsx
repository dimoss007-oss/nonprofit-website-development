import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/b9e0c53c-5060-4447-a399-d6cbcdade3a2";

type DailyReport = {
  id: number;
  patient_id: number;
  author: string;
  report_date: string;
  mood: number;
  anxiety: number;
  sleep: number;
  appetite: number;
  social_activity: number;
  aggression: number;
  notes?: string;
  risk_markers: string[];
  risk_level: "none" | "attention" | "high";
  created_at: string;
};

const EMPTY_SCALES = { mood: 3, anxiety: 3, sleep: 3, appetite: 3, social_activity: 3, aggression: 3 };

const SCALE_META: { key: keyof typeof EMPTY_SCALES; label: string; color: string }[] = [
  { key: "mood", label: "Настроение", color: "#4f9d69" },
  { key: "anxiety", label: "Тревожность", color: "#d97706" },
  { key: "sleep", label: "Сон", color: "#3b82f6" },
  { key: "appetite", label: "Аппетит", color: "#8b5cf6" },
  { key: "social_activity", label: "Соц. активность", color: "#06b6d4" },
  { key: "aggression", label: "Агрессия", color: "#ef4444" },
];

const RISK_META = {
  none: { label: "Норма", badge: "bg-green-100 text-green-700" },
  attention: { label: "Внимание", badge: "bg-amber-100 text-amber-700" },
  high: { label: "Высокий риск", badge: "bg-red-100 text-red-700" },
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
}

function ScaleSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs text-ink/60">{label}</label>
        <span className="text-xs font-semibold text-ink">{value}/5</span>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-sage"
      />
    </div>
  );
}

export default function PatientDynamics({ patientId, authorName }: { patientId: number; authorName: string }) {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scales, setScales] = useState({ ...EMPTY_SCALES });
  const [notes, setNotes] = useState("");
  const [lastResult, setLastResult] = useState<DailyReport | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}?patient_id=${patientId}`);
      const d = await r.json();
      setReports(d.reports || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [patientId]);

  const submit = async () => {
    setSaving(true);
    try {
      const r = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: patientId,
          author: authorName,
          notes,
          ...scales,
        }),
      });
      const d = await r.json();
      if (d.report) {
        setLastResult(d.report);
        setNotes("");
        setScales({ ...EMPTY_SCALES });
        await load();
      }
    } finally {
      setSaving(false);
    }
  };

  const chartData = reports.map((r) => ({
    date: fmtDate(r.report_date),
    ...SCALE_META.reduce((acc, s) => ({ ...acc, [s.key]: r[s.key] }), {}),
  }));

  const latestRisk = reports.length > 0 ? reports[reports.length - 1] : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white border border-beige-dark rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold text-ink text-sm uppercase tracking-wide">Ежедневный отчёт по динамике</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          {SCALE_META.map((s) => (
            <ScaleSlider
              key={s.key}
              label={s.label}
              value={scales[s.key]}
              onChange={(v) => setScales((prev) => ({ ...prev, [s.key]: v }))}
            />
          ))}
        </div>
        <div>
          <label className="text-xs text-ink/60 mb-1 block">Комментарий (по желанию)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Наблюдения за день..."
            className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink resize-none"
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={submit}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-ink text-beige hover:bg-ink/90 transition-colors disabled:opacity-60 flex items-center gap-1.5"
          >
            <Icon name={saving ? "Loader" : "Save"} size={14} className={saving ? "animate-spin" : ""} />
            {saving ? "Сохранение..." : "Сохранить отчёт за сегодня"}
          </button>
        </div>

        {lastResult && lastResult.risk_markers.length > 0 && (
          <div className={`rounded-xl p-3 border ${lastResult.risk_level === "high" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
            <div className="flex items-center gap-2 mb-1.5">
              <Icon name="AlertTriangle" size={14} className={lastResult.risk_level === "high" ? "text-red-600" : "text-amber-600"} />
              <span className={`text-xs font-semibold ${lastResult.risk_level === "high" ? "text-red-700" : "text-amber-700"}`}>Обнаружены маркеры риска</span>
            </div>
            <ul className="text-xs text-ink/70 space-y-0.5 list-disc list-inside">
              {lastResult.risk_markers.map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          </div>
        )}
      </div>

      {latestRisk && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink/50">Текущий статус:</span>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${RISK_META[latestRisk.risk_level].badge}`}>
            {RISK_META[latestRisk.risk_level].label}
          </span>
        </div>
      )}

      <div className="bg-white border border-beige-dark rounded-2xl p-5">
        <h3 className="font-semibold text-ink text-sm uppercase tracking-wide mb-4">Динамика показателей</h3>
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-ink border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!loading && reports.length === 0 && (
          <p className="text-ink/40 text-sm py-4 text-center">Пока нет ни одного отчёта по этому пациенту</p>
        )}
        {!loading && reports.length > 0 && (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e1d8" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {SCALE_META.map((s) => (
                <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} dot={{ r: 3 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {reports.length > 0 && (
        <div className="bg-white border border-beige-dark rounded-2xl p-5">
          <h3 className="font-semibold text-ink text-sm uppercase tracking-wide mb-3">История отчётов</h3>
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {[...reports].reverse().map((r) => (
              <div key={r.id} className="rounded-xl p-3 bg-beige-mid">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-medium text-ink">{fmtDate(r.report_date)}</span>
                  <span className="text-xs text-ink/40">{r.author}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${RISK_META[r.risk_level].badge}`}>{RISK_META[r.risk_level].label}</span>
                </div>
                {r.notes && <p className="text-sm text-ink/70 mb-1">{r.notes}</p>}
                {r.risk_markers.length > 0 && (
                  <ul className="text-xs text-ink/50 list-disc list-inside">
                    {r.risk_markers.map((m, i) => <li key={i}>{m}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
