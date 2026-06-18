import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import {
  DonorType, CRM_URL, fmt,
  Interaction, DonorTask, DonorDocument, DonorMetrics,
  Donation, FundraisingGoal,
  FUNDRAISING_URL,
  INTERACTION_LABELS, INTERACTION_ICONS, InteractionType,
  TASK_LABELS, TaskType,
  DOC_TYPE_LABELS, DocType,
  DONATION_TYPE_LABELS,
} from "./fundraising.types";

type CrmSection = "history" | "donations" | "tasks" | "docs" | "metrics";

const inp = "w-full border border-beige-dark rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-ink bg-white";
const lbl = "block text-xs text-ink/50 mb-1";
const sectionBtn = (active: boolean) =>
  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${active ? "bg-ink text-beige" : "text-ink/50 hover:text-ink hover:bg-beige-mid"}`;

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU");
}
function isOverdue(d: string | null) {
  if (!d) return false;
  return new Date(d) < new Date();
}

// ─── История взаимодействий ────────────────────────────────────────────────
function HistorySection({ donorType, donorId }: { donorType: DonorType; donorId: number }) {
  const [items, setItems] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ interaction_type: "call" as InteractionType, title: "", description: "", interaction_date: new Date().toISOString().slice(0, 10), outcome: "", next_step: "" });
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`${CRM_URL}?type=interactions&donor_type=${donorType}&donor_id=${donorId}`)
      .then(r => r.json()).then(d => setItems(d.interactions || [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [donorId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch(`${CRM_URL}?type=interaction`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ donor_type: donorType, donor_id: donorId, ...form }),
    });
    setSaving(false);
    setOpen(false);
    setForm({ interaction_type: "call", title: "", description: "", interaction_date: new Date().toISOString().slice(0, 10), outcome: "", next_step: "" });
    load();
  };

  const del = async (id: number) => {
    if (!confirm("Удалить запись?")) return;
    await fetch(`${CRM_URL}?type=interaction&id=${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-3">
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 text-xs bg-ink text-beige px-3 py-1.5 rounded-lg hover:bg-ink/90 transition-colors">
        <Icon name="Plus" size={12} /> Добавить запись
      </button>
      {open && (
        <form onSubmit={save} className="bg-beige/50 rounded-xl p-3 space-y-2 border border-beige-dark">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={lbl}>Тип</label>
              <select value={form.interaction_type} onChange={e => setForm(f => ({ ...f, interaction_type: e.target.value as InteractionType }))} className={inp}>
                {(Object.entries(INTERACTION_LABELS) as [InteractionType, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Дата</label>
              <input type="date" value={form.interaction_date} onChange={e => setForm(f => ({ ...f, interaction_date: e.target.value }))} className={inp} />
            </div>
          </div>
          <div>
            <label className={lbl}>Тема</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Краткая тема" className={inp} />
          </div>
          <div>
            <label className={lbl}>Описание</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className={`${inp} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={lbl}>Итог / результат</label>
              <input value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))} className={inp} />
            </div>
            <div>
              <label className={lbl}>Следующий шаг</label>
              <input value={form.next_step} onChange={e => setForm(f => ({ ...f, next_step: e.target.value }))} className={inp} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="bg-ink text-beige px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50">{saving ? "..." : "Сохранить"}</button>
            <button type="button" onClick={() => setOpen(false)} className="text-xs text-ink/50 hover:text-ink">Отмена</button>
          </div>
        </form>
      )}
      {loading ? <div className="text-center py-4 text-ink/30 text-xs">Загружаем...</div>
        : items.length === 0 ? <div className="text-center py-6 text-ink/30 text-xs">История пуста</div>
        : (
          <div className="space-y-2">
            {items.map(it => (
              <div key={it.id} className="rounded-xl border border-beige-dark p-3 group">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-beige-mid flex items-center justify-center flex-shrink-0">
                      <Icon name={INTERACTION_ICONS[it.interaction_type] || "MessageSquare"} size={13} className="text-ink/60" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink leading-tight">{it.title || INTERACTION_LABELS[it.interaction_type]}</p>
                      <p className="text-xs text-ink/40">{fmtDate(it.interaction_date)} · {INTERACTION_LABELS[it.interaction_type]}</p>
                    </div>
                  </div>
                  <button onClick={() => del(it.id)} className="opacity-0 group-hover:opacity-100 p-1 text-ink/30 hover:text-red-500 transition-all">
                    <Icon name="Trash2" size={12} />
                  </button>
                </div>
                {it.description && <p className="text-xs text-ink/60 mt-2 ml-9">{it.description}</p>}
                {it.outcome && <p className="text-xs text-green-700 mt-1 ml-9 flex items-center gap-1"><Icon name="Check" size={10} />Итог: {it.outcome}</p>}
                {it.next_step && <p className="text-xs text-amber-600 mt-0.5 ml-9 flex items-center gap-1"><Icon name="ArrowRight" size={10} />Далее: {it.next_step}</p>}
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

// ─── Пожертвования ─────────────────────────────────────────────────────────
function DonationsSection({ donorType, donorId }: { donorType: DonorType; donorId: number }) {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [goals, setGoals] = useState<FundraisingGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ amount: "", donated_at: new Date().toISOString().slice(0, 10), comment: "", donation_type: "money", goal_id: "", payment_purpose: "", is_regular: false });
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch(`${FUNDRAISING_URL}?type=donations&donor_type=${donorType}&donor_id=${donorId}`).then(r => r.json()),
      fetch(`${FUNDRAISING_URL}?type=goals`).then(r => r.json()),
    ]).then(([d, g]) => {
      setDonations(d.donations || []);
      setGoals(g.goals || []);
    }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [donorId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount) return;
    setSaving(true);
    await fetch(`${FUNDRAISING_URL}?type=donation`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ donor_type: donorType, donor_id: donorId, ...form, amount: parseFloat(form.amount), goal_id: form.goal_id ? parseInt(form.goal_id) : null }),
    });
    setSaving(false); setOpen(false);
    setForm({ amount: "", donated_at: new Date().toISOString().slice(0, 10), comment: "", donation_type: "money", goal_id: "", payment_purpose: "", is_regular: false });
    load();
  };

  const del = async (id: number) => {
    if (!confirm("Удалить пожертвование?")) return;
    await fetch(`${FUNDRAISING_URL}?type=donation&id=${id}`, { method: "DELETE" });
    load();
  };

  const total = donations.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="space-y-3">
      {total > 0 && <div className="bg-green-50 rounded-xl px-3 py-2 text-sm text-green-700 font-semibold">Итого: {fmt(total)}</div>}
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 text-xs bg-ink text-beige px-3 py-1.5 rounded-lg hover:bg-ink/90 transition-colors">
        <Icon name="Plus" size={12} /> Добавить пожертвование
      </button>
      {open && (
        <form onSubmit={save} className="bg-beige/50 rounded-xl p-3 space-y-2 border border-beige-dark">
          <div className="grid grid-cols-2 gap-2">
            <div><label className={lbl}>Сумма (₽) *</label><input type="number" min="1" required value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className={inp} placeholder="0" /></div>
            <div><label className={lbl}>Дата</label><input type="date" value={form.donated_at} onChange={e => setForm(f => ({ ...f, donated_at: e.target.value }))} className={inp} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={lbl}>Тип</label>
              <select value={form.donation_type} onChange={e => setForm(f => ({ ...f, donation_type: e.target.value }))} className={inp}>
                {Object.entries(DONATION_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Цель сбора</label>
              <select value={form.goal_id} onChange={e => setForm(f => ({ ...f, goal_id: e.target.value }))} className={inp}>
                <option value="">— не указана —</option>
                {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
              </select>
            </div>
          </div>
          <div><label className={lbl}>Назначение платежа</label><input value={form.payment_purpose} onChange={e => setForm(f => ({ ...f, payment_purpose: e.target.value }))} placeholder="Благотворительное пожертвование..." className={inp} /></div>
          <div><label className={lbl}>Комментарий</label><input value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} className={inp} /></div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_regular} onChange={e => setForm(f => ({ ...f, is_regular: e.target.checked }))} className="rounded" />
            <span className="text-xs text-ink/60">Регулярное пожертвование</span>
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="bg-ink text-beige px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50">{saving ? "..." : "Добавить"}</button>
            <button type="button" onClick={() => setOpen(false)} className="text-xs text-ink/50 hover:text-ink">Отмена</button>
          </div>
        </form>
      )}
      {loading ? <div className="text-center py-4 text-ink/30 text-xs">Загружаем...</div>
        : donations.length === 0 ? <div className="text-center py-6 text-ink/30 text-xs">Пожертвований пока нет</div>
        : (
          <div className="space-y-2">
            {donations.map(d => (
              <div key={d.id} className="flex items-center justify-between gap-2 py-2 border-b border-beige-dark/50 last:border-0 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-green-700">{fmt(d.amount)}</span>
                    {d.is_regular && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Регулярное</span>}
                    {d.thank_you_sent && <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full">Поблагодарили</span>}
                  </div>
                  <p className="text-xs text-ink/40 mt-0.5">
                    {fmtDate(d.donated_at)}
                    {d.payment_purpose && ` · ${d.payment_purpose}`}
                    {d.comment && ` · ${d.comment}`}
                  </p>
                </div>
                <button onClick={() => del(d.id)} className="opacity-0 group-hover:opacity-100 p-1 text-ink/30 hover:text-red-500">
                  <Icon name="Trash2" size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

// ─── Задачи ────────────────────────────────────────────────────────────────
function TasksSection({ donorType, donorId }: { donorType: DonorType; donorId: number }) {
  const [tasks, setTasks] = useState<DonorTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ task_type: "call" as TaskType, title: "", due_date: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`${CRM_URL}?type=tasks&donor_type=${donorType}&donor_id=${donorId}`)
      .then(r => r.json()).then(d => setTasks(d.tasks || [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [donorId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch(`${CRM_URL}?type=task`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ donor_type: donorType, donor_id: donorId, ...form }),
    });
    setSaving(false); setOpen(false);
    setForm({ task_type: "call", title: "", due_date: "", notes: "" });
    load();
  };

  const done = async (id: number) => {
    await fetch(`${CRM_URL}?type=task_done&id=${id}`, { method: "POST" });
    load();
  };

  const del = async (id: number) => {
    await fetch(`${CRM_URL}?type=task&id=${id}`, { method: "DELETE" });
    load();
  };

  const pending = tasks.filter(t => !t.is_done);
  const completed = tasks.filter(t => t.is_done);

  return (
    <div className="space-y-3">
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 text-xs bg-ink text-beige px-3 py-1.5 rounded-lg hover:bg-ink/90 transition-colors">
        <Icon name="Plus" size={12} /> Добавить задачу
      </button>
      {open && (
        <form onSubmit={save} className="bg-beige/50 rounded-xl p-3 space-y-2 border border-beige-dark">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={lbl}>Тип задачи</label>
              <select value={form.task_type} onChange={e => setForm(f => ({ ...f, task_type: e.target.value as TaskType }))} className={inp}>
                {(Object.entries(TASK_LABELS) as [TaskType, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div><label className={lbl}>Срок</label><input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className={inp} /></div>
          </div>
          <div><label className={lbl}>Заголовок</label><input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inp} /></div>
          <div><label className={lbl}>Заметки</label><input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inp} /></div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="bg-ink text-beige px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50">{saving ? "..." : "Сохранить"}</button>
            <button type="button" onClick={() => setOpen(false)} className="text-xs text-ink/50 hover:text-ink">Отмена</button>
          </div>
        </form>
      )}
      {loading ? <div className="text-center py-4 text-ink/30 text-xs">Загружаем...</div>
        : tasks.length === 0 ? <div className="text-center py-6 text-ink/30 text-xs">Задач нет</div>
        : (
          <div className="space-y-1.5">
            {pending.map(t => (
              <div key={t.id} className={`flex items-start gap-2 p-2.5 rounded-xl border group ${isOverdue(t.due_date) ? "border-red-200 bg-red-50" : "border-beige-dark"}`}>
                <button onClick={() => done(t.id)} className="w-4 h-4 rounded border-2 border-ink/30 hover:border-green-500 hover:bg-green-50 flex-shrink-0 mt-0.5 transition-colors" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink font-medium leading-tight">{t.title}</p>
                  <p className={`text-xs mt-0.5 ${isOverdue(t.due_date) ? "text-red-500 font-medium" : "text-ink/40"}`}>
                    {TASK_LABELS[t.task_type]}{t.due_date ? ` · ${fmtDate(t.due_date)}` : ""}
                    {isOverdue(t.due_date) ? " — просрочено" : ""}
                  </p>
                </div>
                <button onClick={() => del(t.id)} className="opacity-0 group-hover:opacity-100 p-1 text-ink/30 hover:text-red-500"><Icon name="X" size={11} /></button>
              </div>
            ))}
            {completed.length > 0 && (
              <details className="mt-2">
                <summary className="text-xs text-ink/40 cursor-pointer select-none">Выполнено ({completed.length})</summary>
                <div className="mt-1.5 space-y-1">
                  {completed.map(t => (
                    <div key={t.id} className="flex items-center gap-2 p-2 rounded-lg opacity-50">
                      <Icon name="CheckCircle" size={13} className="text-green-500 flex-shrink-0" />
                      <p className="text-xs text-ink line-through">{t.title}</p>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
    </div>
  );
}

// ─── Документы ────────────────────────────────────────────────────────────
function DocsSection({ donorType, donorId }: { donorType: DonorType; donorId: number }) {
  const [docs, setDocs] = useState<DonorDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ doc_type: "contract" as DocType, title: "", url: "", notes: "", doc_date: "" });
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`${CRM_URL}?type=documents&donor_type=${donorType}&donor_id=${donorId}`)
      .then(r => r.json()).then(d => setDocs(d.documents || [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [donorId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch(`${CRM_URL}?type=document`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ donor_type: donorType, donor_id: donorId, ...form }),
    });
    setSaving(false); setOpen(false);
    setForm({ doc_type: "contract", title: "", url: "", notes: "", doc_date: "" });
    load();
  };

  const del = async (id: number) => {
    if (!confirm("Удалить документ?")) return;
    await fetch(`${CRM_URL}?type=document&id=${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-3">
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 text-xs bg-ink text-beige px-3 py-1.5 rounded-lg hover:bg-ink/90 transition-colors">
        <Icon name="Plus" size={12} /> Добавить документ
      </button>
      {open && (
        <form onSubmit={save} className="bg-beige/50 rounded-xl p-3 space-y-2 border border-beige-dark">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={lbl}>Тип</label>
              <select value={form.doc_type} onChange={e => setForm(f => ({ ...f, doc_type: e.target.value as DocType }))} className={inp}>
                {(Object.entries(DOC_TYPE_LABELS) as [DocType, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div><label className={lbl}>Дата документа</label><input type="date" value={form.doc_date} onChange={e => setForm(f => ({ ...f, doc_date: e.target.value }))} className={inp} /></div>
          </div>
          <div><label className={lbl}>Название *</label><input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inp} /></div>
          <div><label className={lbl}>Ссылка (URL)</label><input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://drive.google.com/..." className={inp} /></div>
          <div><label className={lbl}>Заметки</label><input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inp} /></div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="bg-ink text-beige px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50">{saving ? "..." : "Сохранить"}</button>
            <button type="button" onClick={() => setOpen(false)} className="text-xs text-ink/50 hover:text-ink">Отмена</button>
          </div>
        </form>
      )}
      {loading ? <div className="text-center py-4 text-ink/30 text-xs">Загружаем...</div>
        : docs.length === 0 ? <div className="text-center py-6 text-ink/30 text-xs">Документов нет</div>
        : (
          <div className="space-y-2">
            {docs.map(d => (
              <div key={d.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-beige-dark group">
                <div className="w-7 h-7 rounded-lg bg-beige-mid flex items-center justify-center flex-shrink-0">
                  <Icon name="FileText" size={13} className="text-ink/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink leading-tight truncate">{d.title}</p>
                  <p className="text-xs text-ink/40">{DOC_TYPE_LABELS[d.doc_type]}{d.doc_date ? ` · ${fmtDate(d.doc_date)}` : ""}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {d.url && <a href={d.url} target="_blank" rel="noreferrer" className="p-1 text-ink/40 hover:text-ink"><Icon name="ExternalLink" size={12} /></a>}
                  <button onClick={() => del(d.id)} className="opacity-0 group-hover:opacity-100 p-1 text-ink/30 hover:text-red-500"><Icon name="Trash2" size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

// ─── Метрики отношений ─────────────────────────────────────────────────────
function MetricsSection({ donorType, donorId }: { donorType: DonorType; donorId: number }) {
  const [metrics, setMetrics] = useState<DonorMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ engagement_level: 3, support_probability: 50, interests: "", last_contact_at: "", next_step: "", next_step_date: "" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`${CRM_URL}?type=metrics&donor_type=${donorType}&donor_id=${donorId}`)
      .then(r => r.json()).then(d => {
        setMetrics(d.metrics);
        if (d.metrics) {
          setForm({
            engagement_level: d.metrics.engagement_level,
            support_probability: d.metrics.support_probability,
            interests: d.metrics.interests || "",
            last_contact_at: d.metrics.last_contact_at || "",
            next_step: d.metrics.next_step || "",
            next_step_date: d.metrics.next_step_date || "",
          });
        }
      }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [donorId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch(`${CRM_URL}?type=metrics`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ donor_type: donorType, donor_id: donorId, ...form }),
    });
    setSaving(false); setEditing(false); load();
  };

  const LEVELS = ["", "Холодный", "Тёплый", "Лояльный", "Активный", "Чемпион"];
  const engColor = (l: number) => ["", "text-slate-500", "text-blue-500", "text-amber-500", "text-green-600", "text-violet-600"][l] || "text-ink";

  if (loading) return <div className="text-center py-4 text-ink/30 text-xs">Загружаем...</div>;

  return (
    <div className="space-y-3">
      {!editing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-beige-dark p-3">
              <p className="text-xs text-ink/40 mb-1">Вовлечённость</p>
              <p className={`text-lg font-bold ${engColor(metrics?.engagement_level || 0)}`}>
                {"★".repeat(metrics?.engagement_level || 0)}{"☆".repeat(5 - (metrics?.engagement_level || 0))}
              </p>
              <p className="text-xs text-ink/60">{LEVELS[metrics?.engagement_level || 0] || "Не указано"}</p>
            </div>
            <div className="bg-white rounded-xl border border-beige-dark p-3">
              <p className="text-xs text-ink/40 mb-1">Вероятность поддержки</p>
              <p className="text-2xl font-bold text-ink">{metrics?.support_probability ?? "—"}%</p>
              <div className="h-1.5 bg-beige-mid rounded-full mt-1.5 overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${metrics?.support_probability || 0}%` }} />
              </div>
            </div>
          </div>
          {metrics?.interests && (
            <div className="bg-white rounded-xl border border-beige-dark p-3">
              <p className="text-xs text-ink/40 mb-1">Направления интереса</p>
              <p className="text-sm text-ink">{metrics.interests}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-beige-dark p-3">
              <p className="text-xs text-ink/40 mb-1">Последний контакт</p>
              <p className="text-sm text-ink font-medium">{fmtDate(metrics?.last_contact_at || null)}</p>
            </div>
            <div className={`bg-white rounded-xl border p-3 ${isOverdue(metrics?.next_step_date || null) ? "border-red-200 bg-red-50" : "border-beige-dark"}`}>
              <p className="text-xs text-ink/40 mb-1">Следующий шаг</p>
              <p className={`text-sm font-medium ${isOverdue(metrics?.next_step_date || null) ? "text-red-600" : "text-ink"}`}>
                {metrics?.next_step || "—"}
              </p>
              {metrics?.next_step_date && <p className="text-xs text-ink/40 mt-0.5">{fmtDate(metrics.next_step_date)}</p>}
            </div>
          </div>
          <button onClick={() => setEditing(true)} className="text-xs text-ink/50 hover:text-ink flex items-center gap-1">
            <Icon name="Pencil" size={11} /> Редактировать метрики
          </button>
        </div>
      ) : (
        <form onSubmit={save} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Вовлечённость (1–5)</label>
              <input type="range" min="1" max="5" value={form.engagement_level} onChange={e => setForm(f => ({ ...f, engagement_level: parseInt(e.target.value) }))} className="w-full" />
              <p className="text-xs text-center font-medium mt-1 text-ink/60">{LEVELS[form.engagement_level]}</p>
            </div>
            <div>
              <label className={lbl}>Вероятность поддержки (%)</label>
              <input type="range" min="0" max="100" step="5" value={form.support_probability} onChange={e => setForm(f => ({ ...f, support_probability: parseInt(e.target.value) }))} className="w-full" />
              <p className="text-xs text-center font-medium mt-1 text-ink/60">{form.support_probability}%</p>
            </div>
          </div>
          <div><label className={lbl}>Интересующие направления</label><input value={form.interests} onChange={e => setForm(f => ({ ...f, interests: e.target.value }))} placeholder="Помощь детям, юридическая помощь..." className={inp} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={lbl}>Дата последнего контакта</label><input type="date" value={form.last_contact_at} onChange={e => setForm(f => ({ ...f, last_contact_at: e.target.value }))} className={inp} /></div>
            <div><label className={lbl}>Дата следующего шага</label><input type="date" value={form.next_step_date} onChange={e => setForm(f => ({ ...f, next_step_date: e.target.value }))} className={inp} /></div>
          </div>
          <div><label className={lbl}>Следующий шаг</label><input value={form.next_step} onChange={e => setForm(f => ({ ...f, next_step: e.target.value }))} placeholder="Отправить отчёт, позвонить..." className={inp} /></div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="bg-ink text-beige px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50">{saving ? "..." : "Сохранить"}</button>
            <button type="button" onClick={() => setEditing(false)} className="text-xs text-ink/50 hover:text-ink">Отмена</button>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── Главная панель ────────────────────────────────────────────────────────
export function DonorCrmPanel({ donorType, donorId, donorName, onClose }: {
  donorType: DonorType;
  donorId: number;
  donorName: string;
  onClose: () => void;
}) {
  const [section, setSection] = useState<CrmSection>("history");

  const SECTIONS: { id: CrmSection; label: string; icon: string }[] = [
    { id: "history", label: "История", icon: "Clock" },
    { id: "donations", label: "Пожертвования", icon: "Banknote" },
    { id: "tasks", label: "Задачи", icon: "CheckSquare" },
    { id: "docs", label: "Документы", icon: "FileText" },
    { id: "metrics", label: "Метрики", icon: "Activity" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4">
      <div className="bg-white w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col">
        {/* Шапка */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-beige-dark flex-shrink-0">
          <div>
            <p className="font-semibold text-ink">{donorName}</p>
            <p className="text-xs text-ink/40">{donorType === "org" ? "Организация" : "Физическое лицо"}</p>
          </div>
          <button onClick={onClose} className="text-ink/40 hover:text-ink p-1">
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Навигация */}
        <div className="flex items-center gap-1 px-5 py-2.5 border-b border-beige-dark overflow-x-auto flex-shrink-0">
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)} className={sectionBtn(section === s.id)}>
              <Icon name={s.icon} size={12} />
              {s.label}
            </button>
          ))}
        </div>

        {/* Контент */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {section === "history" && <HistorySection donorType={donorType} donorId={donorId} />}
          {section === "donations" && <DonationsSection donorType={donorType} donorId={donorId} />}
          {section === "tasks" && <TasksSection donorType={donorType} donorId={donorId} />}
          {section === "docs" && <DocsSection donorType={donorType} donorId={donorId} />}
          {section === "metrics" && <MetricsSection donorType={donorType} donorId={donorId} />}
        </div>
      </div>
    </div>
  );
}
