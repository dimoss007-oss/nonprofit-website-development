import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { FundraisingGoal, FUNDRAISING_URL, fmt } from "./fundraising.types";

const inp = "w-full border border-beige-dark rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink bg-beige/40";
const lbl = "block text-xs uppercase tracking-widest text-ink/50 mb-1";

const EMPTY: Partial<FundraisingGoal> = { title: "", description: "", target_amount: 0, is_active: true };

function GoalCard({ goal, onEdit, onDelete, onToggle }: {
  goal: FundraisingGoal;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const pct = goal.target_amount > 0
    ? Math.min(100, Math.round((goal.collected_amount / goal.target_amount) * 100))
    : 0;
  const remaining = Math.max(0, goal.target_amount - goal.collected_amount);

  return (
    <div className={`bg-white rounded-2xl border p-5 space-y-3 ${goal.is_active ? "border-beige-dark" : "border-dashed border-beige-dark opacity-60"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-ink">{goal.title}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${goal.is_active ? "bg-green-100 text-green-700" : "bg-beige-dark text-ink/40"}`}>
              {goal.is_active ? "Активна" : "Архив"}
            </span>
          </div>
          {goal.description && <p className="text-xs text-ink/50 mt-0.5">{goal.description}</p>}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={onEdit} className="p-1.5 text-ink/30 hover:text-ink transition-colors">
            <Icon name="Pencil" size={14} />
          </button>
          <button onClick={onToggle} className="p-1.5 text-ink/30 hover:text-amber-500 transition-colors" title={goal.is_active ? "В архив" : "Активировать"}>
            <Icon name={goal.is_active ? "EyeOff" : "Eye"} size={14} />
          </button>
          <button onClick={onDelete} className="p-1.5 text-ink/30 hover:text-red-500 transition-colors">
            <Icon name="Trash2" size={14} />
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-semibold text-ink">{fmt(goal.collected_amount)}</span>
          <span className="text-ink/40">из {fmt(goal.target_amount)} · {pct}%</span>
        </div>
        <div className="h-2.5 bg-beige-mid rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? "bg-green-500" : pct >= 60 ? "bg-amber-400" : "bg-sage"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {remaining > 0 && (
          <p className="text-xs text-ink/40 mt-1">Осталось собрать: {fmt(remaining)}</p>
        )}
        {pct >= 100 && (
          <p className="text-xs text-green-600 mt-1 font-medium">Цель достигнута!</p>
        )}
      </div>
    </div>
  );
}

function GoalForm({ initial, onSave, onCancel }: {
  initial?: Partial<FundraisingGoal>;
  onSave: (data: Partial<FundraisingGoal>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof FundraisingGoal, v: string | boolean | number) =>
    setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <form onSubmit={submit} className="bg-white border border-beige-dark rounded-2xl p-6 space-y-4">
      <h3 className="font-semibold text-ink">{initial?.id ? "Редактировать цель" : "Новая цель сбора"}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={lbl}>Название *</label>
          <input required value={form.title || ""} onChange={e => set("title", e.target.value)} className={inp} placeholder="Питание для подопечных" />
        </div>
        <div className="sm:col-span-2">
          <label className={lbl}>Описание</label>
          <input value={form.description || ""} onChange={e => set("description", e.target.value)} className={inp} placeholder="Краткое пояснение для доноров" />
        </div>
        <div>
          <label className={lbl}>Цель (₽) *</label>
          <input type="number" min="1" required value={form.target_amount || ""} onChange={e => set("target_amount", parseFloat(e.target.value))} className={inp} placeholder="50000" />
        </div>
        <div>
          <label className={lbl}>Уже собрано (₽)</label>
          <input type="number" min="0" value={form.collected_amount || 0} onChange={e => set("collected_amount", parseFloat(e.target.value))} className={inp} />
        </div>
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="bg-ink text-beige px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-ink/90 disabled:opacity-50">
          {saving ? "Сохраняем..." : "Сохранить"}
        </button>
        <button type="button" onClick={onCancel} className="px-6 py-2.5 rounded-xl text-sm text-ink/60 hover:text-ink border border-beige-dark">
          Отмена
        </button>
      </div>
    </form>
  );
}

export default function FundraisingGoalsTab() {
  const [goals, setGoals] = useState<FundraisingGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editGoal, setEditGoal] = useState<FundraisingGoal | null>(null);

  const load = () => {
    setLoading(true);
    fetch(`${FUNDRAISING_URL}?type=goals&all=1`)
      .then(r => r.json())
      .then(d => setGoals(d.goals || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const saveGoal = async (data: Partial<FundraisingGoal>) => {
    await fetch(`${FUNDRAISING_URL}?type=goal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setShowForm(false);
    setEditGoal(null);
    load();
  };

  const deleteGoal = async (id: number) => {
    if (!confirm("Удалить цель сбора?")) return;
    await fetch(`${FUNDRAISING_URL}?type=goal&id=${id}`, { method: "DELETE" });
    load();
  };

  const toggleGoal = async (goal: FundraisingGoal) => {
    await fetch(`${FUNDRAISING_URL}?type=goal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...goal, is_active: !goal.is_active }),
    });
    load();
  };

  const totalTarget = goals.filter(g => g.is_active).reduce((s, g) => s + g.target_amount, 0);
  const totalCollected = goals.filter(g => g.is_active).reduce((s, g) => s + g.collected_amount, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-cormorant text-ink text-2xl font-semibold">Цели сбора</h2>
          {goals.length > 0 && (
            <p className="text-xs text-ink/40 mt-0.5">
              Активные: {fmt(totalCollected)} из {fmt(totalTarget)}
            </p>
          )}
        </div>
        <button onClick={() => { setShowForm(true); setEditGoal(null); }}
          className="flex items-center gap-2 bg-ink text-beige px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-ink/90 transition-colors">
          <Icon name="Plus" size={15} /> Добавить цель
        </button>
      </div>

      {(showForm && !editGoal) && (
        <GoalForm onSave={saveGoal} onCancel={() => setShowForm(false)} />
      )}

      {editGoal && (
        <GoalForm initial={editGoal} onSave={saveGoal} onCancel={() => setEditGoal(null)} />
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin" />
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-16 text-ink/40">
          <Icon name="Target" size={40} className="mx-auto mb-3 opacity-30" />
          <p>Целей сбора пока нет</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {goals.map(g => (
            <GoalCard key={g.id} goal={g}
              onEdit={() => { setEditGoal(g); setShowForm(false); }}
              onDelete={() => deleteGoal(g.id)}
              onToggle={() => toggleGoal(g)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
