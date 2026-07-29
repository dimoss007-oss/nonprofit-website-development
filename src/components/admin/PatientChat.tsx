import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

const CHAT_API = "https://functions.poehali.dev/6252f900-ff7e-44d1-8b3c-be6604ad90d2";

type MessageType = "post" | "report" | "task" | "note" | "ai";

type ChatMessage = {
  id: number;
  type: MessageType;
  author: string;
  author_id?: string | null;
  content: string;
  media?: string[];
  tags?: string[];
  mentions?: string[];
  created_at: string;
};

const TYPE_META: Record<MessageType, { label: string; badge: string }> = {
  report: { label: "Отчёт", badge: "bg-green-100 text-green-700" },
  task: { label: "Задача", badge: "bg-violet-100 text-violet-700" },
  note: { label: "Заметка", badge: "bg-amber-100 text-amber-700" },
  post: { label: "Сообщение", badge: "bg-blue-100 text-blue-700" },
  ai: { label: "DeepSeek AI", badge: "bg-sage-pale text-sage-dark" },
};

function fmtDate(d: string) {
  return new Date(d).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function PatientChat({ patientId, authorName }: { patientId: number; authorName: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [msgType, setMsgType] = useState<MessageType>("report");
  const [askAi, setAskAi] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const tag = `patient-${patientId}`;

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${CHAT_API}?tag=${encodeURIComponent(tag)}`);
      const d = await r.json();
      setMessages(d.messages || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [patientId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  const send = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      await fetch(CHAT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: msgType,
          content,
          author: authorName,
          tags: [tag],
          use_ai: askAi,
        }),
      });
      setText("");
      await load();
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="bg-white border border-beige-dark rounded-2xl p-5 flex flex-col gap-4">
      <h3 className="font-semibold text-ink text-sm uppercase tracking-wide">Отчёты / AI-чат</h3>

      <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-ink border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!loading && messages.length === 0 && (
          <p className="text-ink/40 text-sm py-4 text-center">Пока нет ни одного сообщения по этому пациенту</p>
        )}
        {messages.map((m) => {
          const meta = TYPE_META[m.type] || TYPE_META.post;
          return (
            <div key={m.id} className={`rounded-xl p-3 ${m.type === "ai" ? "bg-sage-pale/40 border border-sage-pale" : "bg-beige-mid"}`}>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${meta.badge}`}>{meta.label}</span>
                <span className="text-xs font-medium text-ink">{m.author}</span>
                <span className="text-[11px] text-ink/35">{fmtDate(m.created_at)}</span>
              </div>
              <p className="text-sm text-ink/80 whitespace-pre-wrap">{m.content}</p>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-beige-mid pt-3 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={msgType}
            onChange={(e) => setMsgType(e.target.value as MessageType)}
            className="text-xs border border-beige-dark rounded-lg px-2 py-1.5 focus:outline-none focus:border-ink bg-white"
          >
            <option value="report">Отчёт</option>
            <option value="task">Задача</option>
            <option value="note">Заметка</option>
            <option value="post">Сообщение</option>
          </select>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Напишите отчёт или сообщение..."
          rows={3}
          className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink resize-none"
        />
        <div className="flex justify-end">
          <button
            onClick={send}
            disabled={sending || !text.trim()}
            className="px-4 py-2 text-sm rounded-lg bg-ink text-beige hover:bg-ink/90 transition-colors disabled:opacity-60 flex items-center gap-1.5"
          >
            <Icon name={sending ? "Loader" : "Send"} size={14} className={sending ? "animate-spin" : ""} />
            {sending ? "Отправка..." : "Отправить"}
          </button>
        </div>
      </div>
    </div>
  );
}