import { useState } from "react";
import { EMPTY_FORM, Priority } from "./taskTypes";

export default function TaskForm({
  initial, onSave, onCancel, loading, users,
}: {
  initial?: Partial<typeof EMPTY_FORM>;
  onSave: (d: typeof EMPTY_FORM) => void;
  onCancel: () => void;
  loading: boolean;
  users: { login: string; full_name?: string }[];
}) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleAssignee = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const user = users.find(u => u.login === val);
    setForm(f => ({ ...f, assignee_login: val, assignee_name: user?.full_name || val }));
  };

  const handleCoAssignee = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const user = users.find(u => u.login === val);
    setForm(f => ({ ...f, co_assignee_login: val, co_assignee_name: user?.full_name || val }));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-ink/50 mb-1 block">Название *</label>
        <input value={form.title} onChange={set("title")} placeholder="Что нужно сделать?" className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
      </div>
      <div>
        <label className="text-xs text-ink/50 mb-1 block">Описание</label>
        <textarea value={form.description} onChange={set("description")} rows={3} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink resize-none" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Исполнитель</label>
          <select value={form.assignee_login} onChange={handleAssignee} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink bg-white">
            <option value="">Не назначен</option>
            {users.map(u => (
              <option key={u.login} value={u.login}>{u.full_name || u.login}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Соисполнитель</label>
          <select value={form.co_assignee_login} onChange={handleCoAssignee} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink bg-white">
            <option value="">Не назначен</option>
            {users.map(u => (
              <option key={u.login} value={u.login}>{u.full_name || u.login}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Приоритет</label>
          <select value={form.priority} onChange={set("priority")} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink bg-white">
            <option value="low">Низкий</option>
            <option value="medium">Средний</option>
            <option value="high">Высокий</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Дата начала</label>
          <input type="date" value={form.start_date} onChange={set("start_date")} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-ink/50 mb-1 block">Дедлайн</label>
          <input type="date" value={form.deadline} onChange={set("deadline")} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-beige-dark hover:border-ink transition-colors">Отмена</button>
        <button onClick={() => onSave(form)} disabled={loading || !form.title.trim()} className="px-4 py-2 text-sm rounded-lg bg-ink text-beige hover:bg-ink/90 transition-colors disabled:opacity-60">
          {loading ? "Сохранение..." : "Сохранить"}
        </button>
      </div>
    </div>
  );
}
