import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  API, UPLOAD_API, CHILD_REPORTS_API, ChildWithPatient, ChildDailyReport, ChildAiSummary,
  ChildScales, CHILD_SCALE_META, fmt, fmtDateTime,
} from "@/components/admin/crm/crmShared";

const EMPTY_SCALES: ChildScales = {
  scale_emotional: null, scale_stress: null, scale_sociability: null, scale_activity: null,
  scale_contact_mother: null, scale_contact_peers: null, scale_academic: null, scale_work: null,
  scale_attention: null, scale_discipline: null,
};

function ScaleInput({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs text-ink/60">{label}</label>
        <span className="text-xs font-semibold text-ink">{value ?? "—"}/10</span>
      </div>
      <input type="range" min={1} max={10} step={1} value={value ?? 5} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-sage" />
    </div>
  );
}

export default function ChildCard({ childId, onBack, onDeleted, onOpenPatient, isAdmin, authorName }: {
  childId: number; onBack: () => void; onDeleted: () => void; onOpenPatient: (patientId: number) => void; isAdmin: boolean; authorName: string;
}) {
  const [child, setChild] = useState<ChildWithPatient | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ last_name: "", first_name: "", middle_name: "", birth_date: "", previous_education: "", current_education: "", extracurriculars: "" });

  const [reports, setReports] = useState<ChildDailyReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [showReportForm, setShowReportForm] = useState(false);
  const [editingReportId, setEditingReportId] = useState<number | null>(null);
  const [scales, setScales] = useState<ChildScales>({ ...EMPTY_SCALES });
  const [identifiedProblems, setIdentifiedProblems] = useState("");
  const [takenActions, setTakenActions] = useState("");
  const [results, setResults] = useState("");
  const [savingReport, setSavingReport] = useState(false);

  const [summaries, setSummaries] = useState<ChildAiSummary[]>([]);
  const [summariesLoading, setSummariesLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [savingSummary, setSavingSummary] = useState(false);
  const [draft, setDraft] = useState("");

  const readAsBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const load = async () => {
    setLoading(true);
    const r = await fetch(`${API}?view=child&child_id=${childId}`);
    const d = await r.json();
    setChild(d.child ?? null);
    if (d.child) {
      setForm({
        last_name: d.child.last_name ?? "", first_name: d.child.first_name, middle_name: d.child.middle_name ?? "",
        birth_date: d.child.birth_date?.slice(0, 10) ?? "", previous_education: d.child.previous_education ?? "",
        current_education: d.child.current_education ?? "", extracurriculars: d.child.extracurriculars ?? "",
      });
    }
    setLoading(false);
  };

  const loadReports = async () => {
    setReportsLoading(true);
    try {
      const r = await fetch(`${CHILD_REPORTS_API}?child_id=${childId}`);
      const d = await r.json();
      setReports(d.reports || []);
    } finally {
      setReportsLoading(false);
    }
  };

  const loadSummaries = async () => {
    setSummariesLoading(true);
    try {
      const r = await fetch(`${API}?child_id=${childId}`);
      const d = await r.json();
      setSummaries(d.summaries || []);
    } finally {
      setSummariesLoading(false);
    }
  };

  useEffect(() => { load(); loadReports(); loadSummaries(); }, [childId]);

  const save = async () => {
    setSaving(true);
    await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update_child", child_id: childId, ...form }) });
    setSaving(false); setEditing(false); load();
  };

  const deleteChild = async () => {
    if (!confirm("Удалить запись о ребёнке?")) return;
    await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete_child", child_id: childId }) });
    onDeleted();
  };

  const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !child) return;
    setUploadingPhoto(true);
    try {
      const base64 = await readAsBase64(file);
      await fetch(UPLOAD_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ patient_id: child.patient_id, child_id: childId, file_name: file.name, file_data: base64, file_type: file.type, target: "child_photo" }) });
      await load();
    } finally {
      setUploadingPhoto(false);
    }
  };

  const resetReportForm = () => {
    setScales({ ...EMPTY_SCALES }); setIdentifiedProblems(""); setTakenActions(""); setResults(""); setEditingReportId(null); setShowReportForm(false);
  };

  const startEditReport = (r: ChildDailyReport) => {
    setScales({
      scale_emotional: r.scale_emotional, scale_stress: r.scale_stress, scale_sociability: r.scale_sociability, scale_activity: r.scale_activity,
      scale_contact_mother: r.scale_contact_mother, scale_contact_peers: r.scale_contact_peers, scale_academic: r.scale_academic, scale_work: r.scale_work,
      scale_attention: r.scale_attention, scale_discipline: r.scale_discipline,
    });
    setIdentifiedProblems(r.identified_problems ?? ""); setTakenActions(r.taken_actions ?? ""); setResults(r.results ?? "");
    setEditingReportId(r.id); setShowReportForm(true);
  };

  const submitReport = async () => {
    setSavingReport(true);
    try {
      const payload = { child_id: childId, author: authorName, identified_problems: identifiedProblems, taken_actions: takenActions, results, ...scales };
      if (editingReportId) {
        await fetch(`${CHILD_REPORTS_API}?id=${editingReportId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      } else {
        await fetch(CHILD_REPORTS_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      }
      resetReportForm();
      await loadReports();
      await load();
    } finally {
      setSavingReport(false);
    }
  };

  const deleteReport = async (id: number) => {
    if (!confirm("Удалить отчёт?")) return;
    await fetch(`${CHILD_REPORTS_API}?id=${id}`, { method: "DELETE" });
    loadReports(); load();
  };

  const generateSummary = async () => {
    setGenerating(true);
    try {
      const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "generate_child_summary", child_id: childId }) });
      const d = await r.json();
      setDraft(d.summary || "");
    } finally {
      setGenerating(false);
    }
  };

  const saveSummary = async () => {
    if (!draft.trim()) return;
    setSavingSummary(true);
    try {
      await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "save_child_summary", child_id: childId, summary_text: draft }) });
      setDraft("");
      await loadSummaries();
    } finally {
      setSavingSummary(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin" /></div>;
  if (!child) return null;

  const fullName = [child.last_name, child.first_name, child.middle_name].filter(Boolean).join(" ");
  const motherName = [child.patient_last_name, child.patient_first_name, child.patient_middle_name].filter(Boolean).join(" ");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-beige-mid transition-colors"><Icon name="ArrowLeft" size={18} /></button>
        <button onClick={() => photoRef.current?.click()} className="relative w-12 h-12 rounded-full overflow-hidden bg-beige-mid flex items-center justify-center flex-shrink-0 border border-beige-dark hover:border-ink transition-colors">
          {child.photo_url ? <img src={child.photo_url} alt="" className="w-full h-full object-cover" /> : <Icon name="Baby" size={18} className="text-ink/30" />}
          {uploadingPhoto && <div className="absolute inset-0 bg-black/30 flex items-center justify-center"><Icon name="Loader" size={14} className="animate-spin text-white" /></div>}
        </button>
        <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-cormorant text-ink text-2xl font-semibold">{fullName}</h2>
            {typeof child.current_age === "number" && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-beige-mid text-ink/60">{child.current_age} лет</span>}
            {typeof child.latest_avg_score === "number" && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${child.latest_avg_score >= 8 ? "bg-green-100 text-green-700" : child.latest_avg_score >= 5 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                Балл: {child.latest_avg_score}
              </span>
            )}
          </div>
          <button onClick={() => onOpenPatient(child.patient_id)} className="text-ink/50 text-sm hover:text-ink transition-colors flex items-center gap-1">
            <Icon name="User" size={12} /> Мама: {motherName}{child.patient_alias && ` (${child.patient_alias})`}
          </button>
        </div>
        <button onClick={() => setEditing(e => !e)} className="px-3 py-1.5 text-sm border border-beige-dark rounded-lg hover:border-ink transition-colors flex items-center gap-1.5">
          <Icon name="Pencil" size={14} /> Редактировать
        </button>
        {isAdmin && (
          <button onClick={deleteChild} className="px-3 py-1.5 text-sm border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1.5">
            <Icon name="Trash2" size={14} /> Удалить
          </button>
        )}
      </div>

      {editing && (
        <div className="bg-white border border-beige-dark rounded-2xl p-6 space-y-4">
          <h3 className="font-semibold text-ink mb-1">Редактирование</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div><label className="text-xs text-ink/50 mb-1 block">Фамилия</label><input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" /></div>
            <div><label className="text-xs text-ink/50 mb-1 block">Имя *</label><input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" /></div>
            <div><label className="text-xs text-ink/50 mb-1 block">Отчество</label><input value={form.middle_name} onChange={e => setForm(f => ({ ...f, middle_name: e.target.value }))} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" /></div>
          </div>
          <div><label className="text-xs text-ink/50 mb-1 block">Дата рождения</label><input type="date" value={form.birth_date} onChange={e => setForm(f => ({ ...f, birth_date: e.target.value }))} className="border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div><label className="text-xs text-ink/50 mb-1 block">Школа/сад, откуда прибыл</label><input value={form.previous_education} onChange={e => setForm(f => ({ ...f, previous_education: e.target.value }))} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" /></div>
            <div><label className="text-xs text-ink/50 mb-1 block">Школа/сад на данный момент</label><input value={form.current_education} onChange={e => setForm(f => ({ ...f, current_education: e.target.value }))} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" /></div>
            <div><label className="text-xs text-ink/50 mb-1 block">Секция/кружок</label><input value={form.extracurriculars} onChange={e => setForm(f => ({ ...f, extracurriculars: e.target.value }))} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" /></div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm rounded-lg border border-beige-dark hover:border-ink transition-colors">Отмена</button>
            <button onClick={save} disabled={saving || !form.first_name} className="px-4 py-2 text-sm rounded-lg bg-ink text-beige hover:bg-ink/90 transition-colors disabled:opacity-60">{saving ? "Сохранение..." : "Сохранить"}</button>
          </div>
        </div>
      )}

      <Tabs defaultValue="data" className="w-full">
        <TabsList>
          <TabsTrigger value="data">Данные</TabsTrigger>
          <TabsTrigger value="reports">Ежедневные отчёты</TabsTrigger>
          <TabsTrigger value="dynamics">Динамика</TabsTrigger>
          <TabsTrigger value="tasks" disabled>Задачи</TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="space-y-4 mt-4">
          <div className="bg-white border border-beige-dark rounded-2xl p-5 space-y-3">
            <h3 className="font-semibold text-ink text-sm uppercase tracking-wide">Основные данные</h3>
            <div><span className="text-xs text-ink/40 uppercase tracking-wide">Дата рождения</span><p className="text-sm text-ink mt-0.5">{fmt(child.birth_date)}</p></div>
            <div><span className="text-xs text-ink/40 uppercase tracking-wide">Школа/сад, откуда прибыл</span><p className="text-sm text-ink mt-0.5">{child.previous_education || "—"}</p></div>
            <div><span className="text-xs text-ink/40 uppercase tracking-wide">Школа/сад на данный момент</span><p className="text-sm text-ink mt-0.5">{child.current_education || "—"}</p></div>
            <div><span className="text-xs text-ink/40 uppercase tracking-wide">Секция/кружок</span><p className="text-sm text-ink mt-0.5">{child.extracurriculars || "—"}</p></div>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4 mt-4">
          {!showReportForm && (
            <button onClick={() => setShowReportForm(true)} className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm rounded-lg border border-dashed border-beige-dark text-ink/60 hover:text-ink hover:border-ink transition-colors">
              <Icon name="Plus" size={14} /> Добавить отчёт за день
            </button>
          )}
          {showReportForm && (
            <div className="bg-beige-mid rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">{editingReportId ? "Редактирование отчёта" : "Новый отчёт"}</p>
                <button onClick={resetReportForm} className="p-1 text-ink/40 hover:text-ink"><Icon name="X" size={16} /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {CHILD_SCALE_META.map((s) => (
                  <ScaleInput key={s.key} label={s.label} value={scales[s.key]} onChange={(v) => setScales((prev) => ({ ...prev, [s.key]: v }))} />
                ))}
              </div>
              <div className="space-y-3 pt-1 border-t border-beige-dark/40">
                <div><label className="text-xs text-ink/60 mb-1 block">Выявленные проблемы</label><textarea value={identifiedProblems} onChange={(e) => setIdentifiedProblems(e.target.value)} rows={2} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-ink resize-none" /></div>
                <div><label className="text-xs text-ink/60 mb-1 block">Предпринятые действия</label><textarea value={takenActions} onChange={(e) => setTakenActions(e.target.value)} rows={2} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-ink resize-none" /></div>
                <div><label className="text-xs text-ink/60 mb-1 block">Результаты</label><textarea value={results} onChange={(e) => setResults(e.target.value)} rows={2} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-ink resize-none" /></div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={resetReportForm} className="px-4 py-2 text-sm rounded-lg border border-beige-dark hover:border-ink transition-colors">Отмена</button>
                <button onClick={submitReport} disabled={savingReport} className="px-4 py-2 text-sm rounded-lg bg-ink text-beige hover:bg-ink/90 transition-colors disabled:opacity-60 flex items-center gap-1.5">
                  <Icon name={savingReport ? "Loader" : "Save"} size={14} className={savingReport ? "animate-spin" : ""} />
                  {savingReport ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
            </div>
          )}
          <div className="bg-white border border-beige-dark rounded-2xl p-5">
            <h3 className="font-semibold text-ink text-sm uppercase tracking-wide mb-3">История отчётов</h3>
            {reportsLoading && <div className="flex items-center justify-center py-8"><div className="w-5 h-5 border-2 border-ink border-t-transparent rounded-full animate-spin" /></div>}
            {!reportsLoading && reports.length === 0 && <p className="text-ink/40 text-sm py-4 text-center">Пока нет ни одного отчёта</p>}
            {!reportsLoading && reports.length > 0 && (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {reports.map((r) => (
                  <div key={r.id} className="rounded-xl p-3 bg-beige-mid group">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-ink">{fmt(r.report_date)}</span>
                        {r.author && <span className="text-xs text-ink/40">{r.author}</span>}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEditReport(r)} className="p-1 text-ink/40 hover:text-ink"><Icon name="Pencil" size={12} /></button>
                        <button onClick={() => deleteReport(r.id)} className="p-1 text-ink/30 hover:text-red-400"><Icon name="X" size={13} /></button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {CHILD_SCALE_META.filter((s) => r[s.key] !== null && r[s.key] !== undefined).map((s) => (
                        <span key={s.key} className="text-[10px] px-1.5 py-0.5 rounded bg-white text-ink/60">{s.label}: {r[s.key]}</span>
                      ))}
                    </div>
                    {(r.identified_problems || r.taken_actions || r.results) && (
                      <div className="space-y-0.5">
                        {r.identified_problems && <p className="text-xs text-ink/70"><span className="font-semibold text-ink/50">Проблемы: </span>{r.identified_problems}</p>}
                        {r.taken_actions && <p className="text-xs text-ink/70"><span className="font-semibold text-ink/50">Действия: </span>{r.taken_actions}</p>}
                        {r.results && <p className="text-xs text-ink/70"><span className="font-semibold text-ink/50">Результат: </span>{r.results}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="dynamics" className="space-y-4 mt-4">
          <div className="bg-white border border-beige-dark rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Icon name="Sparkles" size={16} className="text-purple-500" />
                <h3 className="font-semibold text-ink text-sm uppercase tracking-wide">ИИ-сводка за 7 дней</h3>
              </div>
              <button onClick={generateSummary} disabled={generating} className="text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-beige-dark hover:border-ink transition-colors disabled:opacity-60">
                <Icon name={generating ? "Loader" : "WandSparkles"} size={14} className={generating ? "animate-spin" : ""} />
                {generating ? "Формирование..." : "Сформировать ИИ-сводку"}
              </button>
            </div>
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={6} placeholder="Нажмите «Сформировать ИИ-сводку», затем при необходимости отредактируйте текст перед сохранением..." className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink resize-none" />
            <div className="flex justify-end">
              <button onClick={saveSummary} disabled={savingSummary || !draft.trim()} className="px-4 py-2 text-sm rounded-lg bg-ink text-beige hover:bg-ink/90 transition-colors disabled:opacity-60 flex items-center gap-1.5">
                <Icon name={savingSummary ? "Loader" : "Save"} size={14} className={savingSummary ? "animate-spin" : ""} />
                {savingSummary ? "Сохранение..." : "Сохранить в архив"}
              </button>
            </div>
          </div>
          <div className="bg-white border border-beige-dark rounded-2xl p-5">
            <h3 className="font-semibold text-ink text-sm uppercase tracking-wide mb-3">История сводок ({summaries.length})</h3>
            {summariesLoading && <div className="flex items-center justify-center py-8"><div className="w-5 h-5 border-2 border-ink border-t-transparent rounded-full animate-spin" /></div>}
            {!summariesLoading && summaries.length === 0 && <p className="text-ink/40 text-sm py-4 text-center">Пока нет сохранённых сводок</p>}
            {!summariesLoading && summaries.length > 0 && (
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {summaries.map((s) => (
                  <div key={s.id} className="rounded-xl p-3 bg-beige-mid">
                    <p className="text-sm text-ink whitespace-pre-wrap mb-1">{s.summary_text}</p>
                    <span className="text-xs text-ink/50">{fmtDateTime(s.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
