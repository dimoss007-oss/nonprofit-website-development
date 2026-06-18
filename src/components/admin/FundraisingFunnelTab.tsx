import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import {
  FunnelCard, FunnelStage, FUNNEL_STAGES, FUNNEL_URL,
  DONOR_CATEGORY_LABELS, DONOR_CATEGORY_COLORS, fmt,
} from "./fundraising.types";

const inp = "w-full border border-beige-dark rounded-xl px-3 py-2 text-sm text-ink focus:outline-none focus:border-ink bg-white";
const lbl = "block text-xs text-ink/50 mb-1";

const EMPTY_FORM: Partial<FunnelCard> = {
  name: "", donor_type: "org", donor_category: "donation",
  stage: "identified", contact_person: "", phone: "", email: "",
  potential_amount: undefined, notes: "", manager: "",
  next_action_at: "", next_action_note: "",
};

function fmtDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("ru-RU");
}

function isOverdue(d: string | null) {
  if (!d) return false;
  return new Date(d) < new Date();
}

// ─── Форма карточки ───────────────────────────────────────────────────────────
function CardForm({ initial, onSave, onCancel }: {
  initial?: Partial<FunnelCard>;
  onSave: (data: Partial<FunnelCard>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<FunnelCard>>({ ...EMPTY_FORM, ...initial });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof FunnelCard, v: string | number | null) =>
    setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className={lbl}>Название / организация *</label>
          <input required value={form.name || ""} onChange={e => set("name", e.target.value)} className={inp} />
        </div>
        <div>
          <label className={lbl}>Этап воронки</label>
          <select value={form.stage || "identified"} onChange={e => set("stage", e.target.value as FunnelStage)} className={inp}>
            {FUNNEL_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Категория</label>
          <select value={form.donor_category || "donation"} onChange={e => set("donor_category", e.target.value)} className={inp}>
            {Object.entries(DONOR_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Контактное лицо</label>
          <input value={form.contact_person || ""} onChange={e => set("contact_person", e.target.value)} className={inp} />
        </div>
        <div>
          <label className={lbl}>Потенциальная сумма (₽)</label>
          <input type="number" min="0" value={form.potential_amount ?? ""} onChange={e => set("potential_amount", e.target.value ? parseFloat(e.target.value) : null)} className={inp} placeholder="0" />
        </div>
        <div>
          <label className={lbl}>Телефон</label>
          <input value={form.phone || ""} onChange={e => set("phone", e.target.value)} className={inp} />
        </div>
        <div>
          <label className={lbl}>Email</label>
          <input type="email" value={form.email || ""} onChange={e => set("email", e.target.value)} className={inp} />
        </div>
        <div>
          <label className={lbl}>Следующее действие (дата)</label>
          <input type="date" value={form.next_action_at || ""} onChange={e => set("next_action_at", e.target.value)} className={inp} />
        </div>
        <div>
          <label className={lbl}>Что сделать</label>
          <input value={form.next_action_note || ""} onChange={e => set("next_action_note", e.target.value)} placeholder="Позвонить, отправить отчёт..." className={inp} />
        </div>
        <div className="sm:col-span-2">
          <label className={lbl}>Заметки</label>
          <textarea value={form.notes || ""} onChange={e => set("notes", e.target.value)} rows={2} className={`${inp} resize-none`} />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="bg-ink text-beige px-5 py-2 rounded-xl text-sm font-semibold hover:bg-ink/90 disabled:opacity-50">
          {saving ? "Сохраняем..." : "Сохранить"}
        </button>
        <button type="button" onClick={onCancel} className="px-5 py-2 rounded-xl text-sm border border-beige-dark text-ink/60 hover:text-ink">
          Отмена
        </button>
      </div>
    </form>
  );
}

// ─── Карточка в колонке ───────────────────────────────────────────────────────
function KanbanCard({ card, stages, onEdit, onDelete, onMove }: {
  card: FunnelCard;
  stages: typeof FUNNEL_STAGES;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (stage: FunnelStage) => void;
}) {
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const overdue = isOverdue(card.next_action_at);
  const cat = card.donor_category as keyof typeof DONOR_CATEGORY_COLORS;

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const currentIdx = stages.findIndex(s => s.id === card.stage);

  return (
    <div className="bg-white rounded-xl border border-beige-dark p-3 shadow-sm hover:shadow-md transition-shadow cursor-default group">
      <div className="flex items-start justify-between gap-1 mb-2">
        <p className="font-semibold text-sm text-ink leading-tight flex-1">{card.name}</p>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={onEdit} className="p-1 text-ink/40 hover:text-ink rounded">
            <Icon name="Pencil" size={12} />
          </button>
          <button onClick={onDelete} className="p-1 text-ink/40 hover:text-red-500 rounded">
            <Icon name="Trash2" size={12} />
          </button>
        </div>
      </div>

      {card.donor_category && card.donor_category !== "donation" && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${DONOR_CATEGORY_COLORS[cat] ?? "bg-beige-dark text-ink/60"}`}>
          {DONOR_CATEGORY_LABELS[cat]}
        </span>
      )}

      <div className="mt-2 space-y-1">
        {card.contact_person && (
          <p className="text-xs text-ink/50 flex items-center gap-1">
            <Icon name="User" size={10} /> {card.contact_person}
          </p>
        )}
        {card.potential_amount && (
          <p className="text-xs text-green-700 font-semibold">{fmt(card.potential_amount)}</p>
        )}
        {card.next_action_at && (
          <p className={`text-xs flex items-center gap-1 ${overdue ? "text-red-500 font-medium" : "text-ink/40"}`}>
            <Icon name="Clock" size={10} />
            {overdue ? "Просрочено: " : ""}{fmtDate(card.next_action_at)}
            {card.next_action_note && <span className="text-ink/40"> · {card.next_action_note}</span>}
          </p>
        )}
      </div>

      {/* Переместить */}
      <div className="mt-3 flex items-center justify-between gap-1">
        <button
          disabled={currentIdx === 0}
          onClick={() => onMove(stages[currentIdx - 1].id)}
          className="p-1 text-ink/30 hover:text-ink disabled:opacity-20 rounded hover:bg-beige-mid transition-colors"
          title="Назад"
        >
          <Icon name="ChevronLeft" size={13} />
        </button>
        <div className="relative flex-1" ref={menuRef}>
          <button
            onClick={() => setMenu(m => !m)}
            className="w-full text-[10px] text-ink/40 hover:text-ink text-center py-0.5 rounded hover:bg-beige-mid transition-colors truncate"
          >
            переместить ↕
          </button>
          {menu && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-beige-dark rounded-xl shadow-xl z-20 py-1 max-h-52 overflow-y-auto">
              {stages.map((s, i) => (
                <button key={s.id} onClick={() => { onMove(s.id); setMenu(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-beige-mid transition-colors flex items-center gap-2 ${s.id === card.stage ? "text-ink font-semibold" : "text-ink/60"}`}>
                  <span className="w-4 text-center opacity-50">{i + 1}</span>
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          disabled={currentIdx === stages.length - 1}
          onClick={() => onMove(stages[currentIdx + 1].id)}
          className="p-1 text-ink/30 hover:text-ink disabled:opacity-20 rounded hover:bg-beige-mid transition-colors"
          title="Вперёд"
        >
          <Icon name="ChevronRight" size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Главный компонент ────────────────────────────────────────────────────────
export default function FundraisingFunnelTab({ adminUsers = [] }: { adminUsers?: string[] }) {
  const [grouped, setGrouped] = useState<Record<string, FunnelCard[]>>({});
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<FunnelStage | null>(null);
  const [editing, setEditing] = useState<FunnelCard | null>(null);
  const [defaultStage, setDefaultStage] = useState<FunnelStage>("identified");

  const load = () => {
    setLoading(true);
    fetch(FUNNEL_URL)
      .then(r => r.json())
      .then(d => setGrouped(d.grouped || {}))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const saveCard = async (data: Partial<FunnelCard>) => {
    await fetch(FUNNEL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setAdding(null);
    setEditing(null);
    load();
  };

  const deleteCard = async (id: number) => {
    if (!confirm("Удалить карточку из воронки?")) return;
    await fetch(`${FUNNEL_URL}?id=${id}`, { method: "DELETE" });
    load();
  };

  const moveCard = async (id: number, stage: FunnelStage) => {
    await fetch(`${FUNNEL_URL}?move=1&id=${id}&stage=${stage}`, { method: "POST" });
    load();
  };

  // Статистика
  const allCards = Object.values(grouped).flat();
  const totalPotential = allCards.reduce((s, c) => s + (c.potential_amount || 0), 0);
  const fundedCards = grouped["funded"] || [];
  const overdueCount = allCards.filter(c => isOverdue(c.next_action_at)).length;

  return (
    <div className="space-y-5">

      {/* Шапка */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-cormorant text-ink text-2xl font-semibold">Воронка фандрайзинга</h2>
          <div className="flex items-center gap-4 mt-1 text-xs text-ink/50">
            <span>{allCards.length} доноров в работе</span>
            {totalPotential > 0 && <span>Потенциал: {fmt(totalPotential)}</span>}
            {overdueCount > 0 && (
              <span className="text-red-500 font-medium flex items-center gap-1">
                <Icon name="AlertCircle" size={12} /> {overdueCount} просроченных
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => { setDefaultStage("identified"); setAdding("identified"); setEditing(null); }}
          className="flex items-center gap-2 bg-ink text-beige px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-ink/90 transition-colors"
        >
          <Icon name="Plus" size={15} /> Добавить
        </button>
      </div>

      {/* Форма добавления / редактирования поверх */}
      {(adding || editing) && (
        <div className="bg-white border border-beige-dark rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-ink mb-4 text-sm">
            {editing ? "Редактировать карточку" : "Новый донор в воронку"}
          </h3>
          <CardForm
            initial={editing || { ...EMPTY_FORM, stage: defaultStage }}
            onSave={saveCard}
            onCancel={() => { setAdding(null); setEditing(null); }}
          />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        /* Горизонтальный скролл с колонками */
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3" style={{ minWidth: `${FUNNEL_STAGES.length * 220}px` }}>
            {FUNNEL_STAGES.map((stage, stageIdx) => {
              const cards = grouped[stage.id] || [];
              const stagePotential = cards.reduce((s, c) => s + (c.potential_amount || 0), 0);

              return (
                <div key={stage.id} className="flex-shrink-0 w-52">
                  {/* Заголовок колонки */}
                  <div className={`rounded-xl border px-3 py-2.5 mb-2 ${stage.color}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Icon name={stage.icon} size={13} className="opacity-60" />
                        <span className="text-xs font-semibold text-ink/80 leading-tight">{stage.label}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-ink/60 bg-white/60 rounded-full w-5 h-5 flex items-center justify-center">
                          {cards.length}
                        </span>
                        <button
                          onClick={() => { setDefaultStage(stage.id); setAdding(stage.id); setEditing(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                          className="w-5 h-5 flex items-center justify-center text-ink/40 hover:text-ink hover:bg-white/60 rounded transition-colors"
                          title="Добавить в этот этап"
                        >
                          <Icon name="Plus" size={12} />
                        </button>
                      </div>
                    </div>
                    {stagePotential > 0 && (
                      <p className="text-[10px] text-ink/50 mt-0.5">{fmt(stagePotential)}</p>
                    )}
                  </div>

                  {/* Карточки */}
                  <div className="space-y-2">
                    {cards.map(card => (
                      <KanbanCard
                        key={card.id}
                        card={card}
                        stages={FUNNEL_STAGES}
                        onEdit={() => { setEditing(card); setAdding(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        onDelete={() => deleteCard(card.id)}
                        onMove={(s) => moveCard(card.id, s)}
                      />
                    ))}
                    {cards.length === 0 && (
                      <div className="border-2 border-dashed border-beige-dark rounded-xl h-16 flex items-center justify-center">
                        <span className="text-xs text-ink/20">пусто</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Легенда прогресса */}
      {allCards.length > 0 && (
        <div className="bg-white border border-beige-dark rounded-2xl p-4">
          <p className="text-xs text-ink/40 mb-3 uppercase tracking-widest">Прогресс по воронке</p>
          <div className="flex items-center gap-0.5 h-3 rounded-full overflow-hidden">
            {FUNNEL_STAGES.map(s => {
              const cnt = (grouped[s.id] || []).length;
              const pct = allCards.length > 0 ? (cnt / allCards.length) * 100 : 0;
              if (pct === 0) return null;
              return (
                <div key={s.id} style={{ width: `${pct}%` }}
                  className="h-full bg-ink/10 hover:bg-ink/30 transition-colors cursor-default first:rounded-l-full last:rounded-r-full"
                  title={`${s.label}: ${cnt}`} />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            {FUNNEL_STAGES.map(s => {
              const cnt = (grouped[s.id] || []).length;
              if (cnt === 0) return null;
              return (
                <span key={s.id} className="text-[10px] text-ink/50 flex items-center gap-1">
                  <Icon name={s.icon} size={10} /> {s.label}: {cnt}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
