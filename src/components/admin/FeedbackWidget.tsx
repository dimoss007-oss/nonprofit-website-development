import { useState } from "react";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/2a909b11-72ee-48fd-9e6a-24527476dc11";

const CATEGORIES = [
  { id: "idea", label: "Идея" },
  { id: "bug", label: "Ошибка" },
  { id: "question", label: "Вопрос" },
];

interface Props { authorName: string; authorLogin: string }

export default function FeedbackWidget({ authorName, authorLogin }: Props) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("idea");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const send = async () => {
    if (!message.trim()) { setError("Опишите, что нужно доработать"); return; }
    setSending(true); setError("");
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "feedback", category, message, author_name: authorName, author_login: authorLogin }),
      });
      const d = await res.json();
      if (d.ok) { setSent(true); setMessage(""); setTimeout(() => { setSent(false); setOpen(false); }, 2000); }
      else setError(d.error || "Не удалось отправить");
    } catch { setError("Ошибка соединения. Попробуйте снова."); }
    setSending(false);
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end">
      {open && (
        <div className="mb-3 w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
            <div>
              <p className="text-sm font-semibold text-slate-800">Обратная связь</p>
              <p className="text-xs text-slate-500">Что доработать в CRM?</p>
            </div>
            <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-500" aria-label="Закрыть">
              <Icon name="X" size={16} />
            </button>
          </div>
          {sent ? (
            <div className="px-4 py-10 text-center">
              <Icon name="CheckCircle" size={32} className="text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">Спасибо! Сообщение отправлено</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              <div className="flex gap-2">
                {CATEGORIES.map(c => (
                  <button key={c.id} onClick={() => setCategory(c.id)} className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${category === c.id ? "bg-brand-50 border-brand-100 text-brand-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                    {c.label}
                  </button>
                ))}
              </div>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5} placeholder="Опишите, что не хватает или что работает неудобно" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button onClick={send} disabled={sending} className="w-full bg-brand-600 hover:bg-brand-700 text-white py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-60">
                {sending ? "Отправляю..." : "Отправить"}
              </button>
            </div>
          )}
        </div>
      )}
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium shadow-lg transition-colors" aria-label="Обратная связь">
        <Icon name="MessageSquarePlus" size={16} />
        <span className="hidden sm:inline">Обратная связь</span>
      </button>
    </div>
  );
}
