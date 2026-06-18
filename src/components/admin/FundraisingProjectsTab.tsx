import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { CRM_URL, fmt, OrgProject, ProjectStatus, PROJECT_STATUS_LABELS } from "./fundraising.types";

const inp = "w-full border border-beige-dark rounded-xl px-3 py-2 text-sm text-ink focus:outline-none focus:border-ink bg-beige/40";
const lbl = "block text-xs uppercase tracking-widest text-ink/50 mb-1";

const STATUS_COLORS: Record<ProjectStatus, string> = {
  active: "bg-green-100 text-green-700",
  completed: "bg-beige-dark text-ink/50",
  paused: "bg-amber-100 text-amber-700",
  cancelled: "bg-red-100 text-red-500",
};

const EMPTY: Partial<OrgProject> = {
  title: "", description: "", start_date: "", end_date: "", budget: undefined, status: "active", result: "",
};

function ProjectForm({ initial, onSave, onCancel }: {
  initial?: Partial<OrgProject>;
  onSave: (d: Partial<OrgProject>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<OrgProject>>({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof OrgProject, v: string | number | null) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); await onSave(form); setSaving(false);
  };

  return (
    <form onSubmit={submit} className="bg-white border border-beige-dark rounded-2xl p-5 space-y-4">
      <h3 className="font-semibold text-ink text-sm">{initial?.id ? "Редактировать проект" : "Новый проект"}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className={lbl}>Название *</label>
          <input required value={form.title || ""} onChange={e => set("title", e.target.value)} className={inp} />
        </div>
        <div className="sm:col-span-2">
          <label className={lbl}>Описание</label>
          <textarea value={form.description || ""} onChange={e => set("description", e.target.value)} rows={2} className={`${inp} resize-none`} />
        </div>
        <div>
          <label className={lbl}>Статус</label>
          <select value={form.status || "active"} onChange={e => set("status", e.target.value as ProjectStatus)} className={inp}>
            {(Object.entries(PROJECT_STATUS_LABELS) as [ProjectStatus, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Бюджет (₽)</label>
          <input type="number" min="0" value={form.budget ?? ""} onChange={e => set("budget", e.target.value ? parseFloat(e.target.value) : null)} className={inp} placeholder="0" />
        </div>
        <div>
          <label className={lbl}>Начало</label>
          <input type="date" value={form.start_date || ""} onChange={e => set("start_date", e.target.value)} className={inp} />
        </div>
        <div>
          <label className={lbl}>Конец</label>
          <input type="date" value={form.end_date || ""} onChange={e => set("end_date", e.target.value)} className={inp} />
        </div>
        <div className="sm:col-span-2">
          <label className={lbl}>Результат</label>
          <textarea value={form.result || ""} onChange={e => set("result", e.target.value)} rows={2} className={`${inp} resize-none`} placeholder="Описание достигнутых результатов" />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="bg-ink text-beige px-5 py-2 rounded-xl text-sm font-semibold hover:bg-ink/90 disabled:opacity-50">{saving ? "Сохраняем..." : "Сохранить"}</button>
        <button type="button" onClick={onCancel} className="px-5 py-2 rounded-xl text-sm border border-beige-dark text-ink/60 hover:text-ink">Отмена</button>
      </div>
    </form>
  );
}

export default function FundraisingProjectsTab() {
  const [projects, setProjects] = useState<OrgProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<OrgProject | null>(null);

  const load = () => {
    setLoading(true);
    fetch(`${CRM_URL}?type=projects`).then(r => r.json()).then(d => setProjects(d.projects || [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const save = async (data: Partial<OrgProject>) => {
    await fetch(`${CRM_URL}?type=project`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    setShowForm(false); setEditing(null); load();
  };

  const del = async (id: number) => {
    if (!confirm("Удалить проект?")) return;
    await fetch(`${CRM_URL}?type=project&id=${id}`, { method: "DELETE" });
    load();
  };

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString("ru-RU") : null;
  const totalDonors = (p: OrgProject) => p.donors?.length || 0;
  const totalIncome = (p: OrgProject) => p.donors?.reduce((s, d) => s + (d.amount || 0), 0) || 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-cormorant text-ink text-2xl font-semibold">Проекты организации</h2>
          <p className="text-xs text-ink/40 mt-0.5">{projects.filter(p => p.status === "active").length} активных</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); }} className="flex items-center gap-2 bg-ink text-beige px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-ink/90">
          <Icon name="Plus" size={15} /> Добавить
        </button>
      </div>

      {showForm && !editing && <ProjectForm onSave={save} onCancel={() => setShowForm(false)} />}
      {editing && <ProjectForm initial={editing} onSave={save} onCancel={() => setEditing(null)} />}

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin" /></div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 text-ink/40"><Icon name="FolderOpen" size={36} className="mx-auto mb-3 opacity-30" /><p>Проектов пока нет</p></div>
      ) : (
        <div className="space-y-3">
          {projects.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-beige-dark p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-ink">{p.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status]}`}>{PROJECT_STATUS_LABELS[p.status]}</span>
                  </div>
                  {p.description && <p className="text-xs text-ink/60 mb-2">{p.description}</p>}
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink/50">
                    {p.budget && <span className="flex items-center gap-1"><Icon name="Wallet" size={11} />{fmt(p.budget)}</span>}
                    {(p.start_date || p.end_date) && <span className="flex items-center gap-1"><Icon name="Calendar" size={11} />{fmtDate(p.start_date) || "..."} — {fmtDate(p.end_date) || "..."}</span>}
                    {totalDonors(p) > 0 && <span className="flex items-center gap-1"><Icon name="Users" size={11} />{totalDonors(p)} доноров · {fmt(totalIncome(p))}</span>}
                  </div>
                  {p.result && (
                    <div className="mt-2 pt-2 border-t border-beige-dark/50">
                      <p className="text-xs text-green-700 flex items-start gap-1"><Icon name="CheckCircle" size={11} className="mt-0.5 flex-shrink-0" />{p.result}</p>
                    </div>
                  )}
                  {p.donors && p.donors.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {p.donors.map((d, i) => (
                        <span key={i} className="text-[10px] bg-beige-mid text-ink/60 px-2 py-0.5 rounded-full">
                          {d.donor_name}{d.amount ? ` · ${fmt(d.amount)}` : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => { setEditing(p); setShowForm(false); }} className="p-1.5 text-ink/30 hover:text-ink rounded-lg hover:bg-beige-mid"><Icon name="Pencil" size={14} /></button>
                  <button onClick={() => del(p.id)} className="p-1.5 text-ink/30 hover:text-red-500 rounded-lg hover:bg-red-50"><Icon name="Trash2" size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
