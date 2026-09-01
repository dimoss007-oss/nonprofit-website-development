import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/b9e0c53c-5060-4447-a399-d6cbcdade3a2";

type DailyReport = {
  id: number;
  patient_id: number;
  author: string;
  report_date: string;
  overall_state: number;
  contact_children: number;
  contact_surroundings: number;
  contact_staff: number;
  engagement_level: number;
  negative_behavior_level: number;
  positive_thinking_level: number;
  tasks_completion: number;
  feelings_diary_usage: number;
  self_analysis_usage: number;
  notes?: string;
  problems_identified?: string;
  actions_taken?: string;
  results?: string;
  risk_markers: string[];
  risk_level: "none" | "attention" | "high";
  created_at: string;
};

const EMPTY_SCALES = {
  overall_state: 5,
  contact_children: 5,
  contact_surroundings: 5,
  contact_staff: 5,
  engagement_level: 5,
  negative_behavior_level: 5,
  positive_thinking_level: 5,
  tasks_completion: 5,
  feelings_diary_usage: 5,
  self_analysis_usage: 5,
};

const SCALE_META: { key: keyof typeof EMPTY_SCALES; label: string; color: string; gradient?: "yellow-red" | "blue-green" }[] = [
  { key: "overall_state", label: "Общее состояние", color: "#f97316" },
  { key: "contact_children", label: "Контакт с детьми", color: "#4f9d69" },
  { key: "contact_surroundings", label: "Контакт с окружающими", color: "#3b82f6" },
  { key: "contact_staff", label: "Контакт с сотрудниками", color: "#06b6d4" },
  { key: "engagement_level", label: "Уровень вовлечённости в процесс", color: "#8b5cf6" },
  { key: "negative_behavior_level", label: "Уровень проявления негативного поведения", color: "#ef4444", gradient: "yellow-red" },
  { key: "positive_thinking_level", label: "Уровень применения позитивного мышления", color: "#22c55e", gradient: "blue-green" },
  { key: "tasks_completion", label: "Выполнение основных заданий", color: "#d97706" },
  { key: "feelings_diary_usage", label: "Применение инструмента «Дневник чувств»", color: "#ec4899" },
  { key: "self_analysis_usage", label: "Применение инструмента «Самоанализ»", color: "#0ea5e9" },
];

const RISK_META = {
  none: { label: "Норма", badge: "bg-green-100 text-green-700" },
  attention: { label: "Внимание", badge: "bg-amber-100 text-amber-700" },
  high: { label: "Высокий риск", badge: "bg-red-100 text-red-700" },
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
}

function stateColor(v: number) {
  if (v <= 4) return "#ef4444";
  if (v <= 6) return "#eab308";
  return "#22c55e";
}

function StateDot(props: { cx?: number; cy?: number; payload?: { overall_state: number | null } }) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || payload?.overall_state == null) return null;
  return <circle cx={cx} cy={cy} r={5} fill={stateColor(payload.overall_state)} stroke="#fff" strokeWidth={1.5} />;
}

function ScaleSlider({ label, value, onChange, gradient }: { label: string; value: number; onChange: (v: number) => void; gradient?: "yellow-red" | "blue-green" }) {
  const gradientClass = gradient === "yellow-red" ? "gradient-yellow-red" : gradient === "blue-green" ? "gradient-blue-green" : "";
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs text-ink/60">{label}</label>
        <span className="text-xs font-semibold text-ink">{value}/10</span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={gradientClass ? `w-full ${gradientClass}` : "w-full accent-sage"}
      />
    </div>
  );
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function PatientDynamics({ patientId, authorName, isAdmin }: { patientId: number; authorName: string; isAdmin: boolean }) {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [reportDate, setReportDate] = useState(todayIso());
  const [scales, setScales] = useState({ ...EMPTY_SCALES });
  const [notes, setNotes] = useState("");
  const [problemsIdentified, setProblemsIdentified] = useState("");
  const [actionsTaken, setActionsTaken] = useState("");
  const [results, setResults] = useState("");
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

  const resetForm = () => {
    setScales({ ...EMPTY_SCALES });
    setNotes("");
    setProblemsIdentified("");
    setActionsTaken("");
    setResults("");
    setEditingId(null);
    setReportDate(todayIso());
  };

  const startEdit = (r: DailyReport) => {
    setScales({
      overall_state: r.overall_state, contact_children: r.contact_children, contact_surroundings: r.contact_surroundings,
      contact_staff: r.contact_staff, engagement_level: r.engagement_level, negative_behavior_level: r.negative_behavior_level,
      positive_thinking_level: r.positive_thinking_level, tasks_completion: r.tasks_completion,
      feelings_diary_usage: r.feelings_diary_usage, self_analysis_usage: r.self_analysis_usage,
    });
    setNotes(r.notes ?? "");
    setProblemsIdentified(r.problems_identified ?? "");
    setActionsTaken(r.actions_taken ?? "");
    setResults(r.results ?? "");
    setEditingId(r.id);
    setReportDate(r.report_date?.slice(0, 10) ?? todayIso());
  };

  const submit = async () => {
    setSaving(true);
    try {
      const payload = {
        patient_id: patientId,
        author: authorName,
        report_date: reportDate,
        notes,
        problems_identified: problemsIdentified,
        actions_taken: actionsTaken,
        results,
        ...scales,
      };
      const r = editingId
        ? await fetch(`${API}?id=${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await r.json();
      if (d.report) {
        setLastResult(d.report);
        resetForm();
        await load();
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteReport = async (id: number) => {
    if (!confirm("Удалить отчёт?")) return;
    await fetch(`${API}?id=${id}`, { method: "DELETE" });
    load();
  };

  const chartData = reports.map((r) => ({
    date: fmtDate(r.report_date),
    ...SCALE_META.reduce((acc, s) => ({ ...acc, [s.key]: r[s.key] }), {}),
  }));

  const stateChartData = reports
    .filter((r) => r.overall_state != null)
    .map((r) => ({ date: fmtDate(r.report_date), overall_state: r.overall_state }));

  const latestRisk = reports.length > 0 ? reports[reports.length - 1] : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white border border-beige-dark rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-ink text-sm uppercase tracking-wide">{editingId ? "Редактирование отчёта" : "Ежедневный отчёт по динамике"}</h3>
          {editingId && <button onClick={resetForm} className="p-1 text-ink/40 hover:text-ink"><Icon name="X" size={16} /></button>}
        </div>
        <div>
          <label className="text-xs text-ink/60 mb-1 block">Дата отчёта</label>
          <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          {SCALE_META.map((s) => (
            <ScaleSlider
              key={s.key}
              label={s.label}
              value={scales[s.key]}
              onChange={(v) => setScales((prev) => ({ ...prev, [s.key]: v }))}
              gradient={s.gradient}
            />
          ))}
        </div>
        <div className="space-y-3 pt-1 border-t border-beige-mid">
          <div>
            <label className="text-xs text-ink/60 mb-1 block">Выявленные проблемы</label>
            <textarea
              value={problemsIdentified}
              onChange={(e) => setProblemsIdentified(e.target.value)}
              rows={2}
              placeholder="Проявления болезни, эмоциональный фон..."
              className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink resize-none"
            />
          </div>
          <div>
            <label className="text-xs text-ink/60 mb-1 block">Предпринятые действия</label>
            <textarea
              value={actionsTaken}
              onChange={(e) => setActionsTaken(e.target.value)}
              rows={2}
              placeholder="Консультация, беседа с психологом, соц. работником, применение ИП, эмоциональная группа, мотивационная беседа..."
              className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink resize-none"
            />
          </div>
          <div>
            <label className="text-xs text-ink/60 mb-1 block">Результаты</label>
            <textarea
              value={results}
              onChange={(e) => setResults(e.target.value)}
              rows={2}
              placeholder="Какие действия сработали, не сработали, к чему привели..."
              className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink resize-none"
            />
          </div>
          <div>
            <label className="text-xs text-ink/60 mb-1 block">Комментарий (по желанию)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Дополнительные наблюдения за день..."
              className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink resize-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          {editingId && (
            <button onClick={resetForm} className="px-4 py-2 text-sm rounded-lg border border-beige-dark hover:border-ink transition-colors">Отмена</button>
          )}
          <button
            onClick={submit}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-ink text-beige hover:bg-ink/90 transition-colors disabled:opacity-60 flex items-center gap-1.5"
          >
            <Icon name={saving ? "Loader" : "Save"} size={14} className={saving ? "animate-spin" : ""} />
            {saving ? "Сохранение..." : editingId ? "Сохранить изменения" : "Сохранить отчёт"}
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

      {stateChartData.length > 0 && (
        <div className="bg-white border border-beige-dark rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="font-semibold text-ink text-sm uppercase tracking-wide">Динамика общего состояния</h3>
            <div className="flex items-center gap-3 text-xs text-ink/50">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] inline-block" />Кризис</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#eab308] inline-block" />Нестабильно</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#22c55e] inline-block" />Стабильно</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stateChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e1d8" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 10]} ticks={[0, 3, 6, 8, 10]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="overall_state" name="Общее состояние" stroke="#a3a3a3" strokeWidth={2} dot={<StateDot />} connectNulls />
            </LineChart>
          </ResponsiveContainer>
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
              <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fontSize: 11 }} />
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
              <div key={r.id} className="rounded-xl p-3 bg-beige-mid group">
                <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-ink">{fmtDate(r.report_date)}</span>
                    <span className="text-xs text-ink/40">{r.author}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${RISK_META[r.risk_level].badge}`}>{RISK_META[r.risk_level].label}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(r)} className="p-1 text-ink/40 hover:text-ink"><Icon name="Pencil" size={12} /></button>
                    {isAdmin && <button onClick={() => deleteReport(r.id)} className="p-1 text-ink/30 hover:text-red-400"><Icon name="X" size={13} /></button>}
                  </div>
                </div>
                {(r.problems_identified || r.actions_taken || r.results) && (
                  <div className="space-y-1 mb-1">
                    {r.problems_identified && (
                      <p className="text-xs text-ink/70"><span className="font-semibold text-ink/50">Выявлены проблемы: </span>{r.problems_identified}</p>
                    )}
                    {r.actions_taken && (
                      <p className="text-xs text-ink/70"><span className="font-semibold text-ink/50">Предпринятые действия: </span>{r.actions_taken}</p>
                    )}
                    {r.results && (
                      <p className="text-xs text-ink/70"><span className="font-semibold text-ink/50">Результат: </span>{r.results}</p>
                    )}
                  </div>
                )}
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