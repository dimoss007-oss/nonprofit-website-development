import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/2a909b11-72ee-48fd-9e6a-24527476dc11";

interface Item {
  id: number;
  author_name: string;
  category: string;
  message: string;
  status: "new" | "done";
  created_at: string;
  reply?: string | null;
}

const CATEGORY: Record<string, { label: string; color: string }> = {
  idea: { label: "Идея", color: "bg-brand-50 text-brand-700 border border-brand-100" },
  bug: { label: "Ошибка", color: "bg-red-50 text-red-600 border border-red-100" },
  question: { label: "Вопрос", color: "bg-amber-50 text-amber-700 border border-amber-100" },
};

export default function AdminFeedbackTab() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"new" | "done" | "all">("new");

  const load = async () => {
    try {
      const res = await fetch(`${API}?kind=feedback`);
      const d = await res.json();
      setItems(d.items || []);
    } catch { setItems([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggle = async (item: Item) => {
    const status = item.status === "done" ? "new" : "done";
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status } : i));
    await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "feedback_status", id: item.id, status }),
    });
  };

  const [drafts, setDrafts] = useState<Record<number, string>>({});

  const sendReply = async (item: Item) => {
    const reply = (drafts[item.id] ?? item.reply ?? "").trim();
    await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "feedback_reply", id: item.id, reply }),
    });
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, reply: reply || null } : i));
    setDrafts(prev => { const n = { ...prev }; delete n[item.id]; return n; });
  };

  const shown = items.filter(i => filter === "all" || i.status === filter);
  const newCount = items.filter(i => i.status === "new").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Пожелания сотрудников</h2>
          <p className="text-sm text-slate-500">Новых: {newCount}</p>
        </div>
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1">
          {([["new", "Новые"], ["done", "Выполненные"], ["all", "Все"]] as const).map(([id, label]) => (
            <button key={id} onClick={() => setFilter(id)} className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${filter === id ? "bg-brand-50 text-brand-700 font-semibold" : "text-slate-600 hover:bg-slate-100"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Загрузка...</p>
      ) : shown.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500 text-sm">Пока ничего нет</div>
      ) : (
        <div className="space-y-3">
          {shown.map(item => {
            const cat = CATEGORY[item.category] || CATEGORY.idea;
            const done = item.status === "done";
            return (
              <div key={item.id} className={`bg-white border border-slate-200 rounded-2xl p-4 ${done ? "opacity-70" : ""}`}>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cat.color}`}>{cat.label}</span>
                  <span className="text-sm font-semibold text-slate-700">{item.author_name}</span>
                  <span className="text-xs text-slate-400">{new Date(item.created_at).toLocaleString("ru-RU")}</span>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{item.message}</p>
                <div className="mt-3 flex gap-2">
                  <input
                    value={drafts[item.id] ?? item.reply ?? ""}
                    onChange={e => setDrafts(prev => ({ ...prev, [item.id]: e.target.value }))}
                    maxLength={1000}
                    placeholder="Короткий ответ сотруднику"
                    className="flex-1 min-w-0 border border-slate-200 rounded-xl px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button onClick={() => sendReply(item)} disabled={(drafts[item.id] ?? item.reply ?? "") === (item.reply ?? "")} className="px-3 py-1.5 text-xs font-medium rounded-xl bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-40 transition-colors">
                    {item.reply ? "Обновить" : "Ответить"}
                  </button>
                </div>
                <button onClick={() => toggle(item)} className={`mt-3 inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${done ? "border-slate-200 text-slate-600 hover:bg-slate-50" : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"}`}>
                  <Icon name={done ? "RotateCcw" : "Check"} size={13} className="mr-1.5" />
                  {done ? "Вернуть в новые" : "Отметить выполненным"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
