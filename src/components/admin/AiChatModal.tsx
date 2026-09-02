import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const CHAT_API = "https://functions.poehali.dev/ca19dfbe-f809-4d0a-bb57-c57da6698400";

type ChatRole = "user" | "assistant";
type ChatMsg = { role: ChatRole; text: string };

function renderMarkdownLine(line: string, key: number) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p key={key} className="text-sm leading-relaxed">
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <span key={i} className="font-semibold">{part.slice(2, -2)}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}

function MarkdownText({ text }: { text: string }) {
  return <div className="space-y-1.5">{text.split("\n\n").filter(Boolean).map((line, i) => renderMarkdownLine(line, i))}</div>;
}

export default function AiChatModal({ open, onClose, authLogin, authPassword }: { open: boolean; onClose: () => void; authLogin: string; authPassword: string }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, sending]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const nextMessages: ChatMsg[] = [...messages, { role: "user", text }];
    setMessages(nextMessages);
    setInput("");
    setSending(true);
    setError(null);

    try {
      const r = await fetch(CHAT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auth_login: authLogin, auth_password: authPassword, messages: nextMessages }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || "Не удалось получить ответ от ИИ");
        return;
      }
      setMessages([...nextMessages, { role: "assistant", text: d.reply }]);
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-beige-dark">
          <DialogTitle className="font-cormorant text-xl flex items-center gap-2">
            <Icon name="Sparkles" size={18} className="text-purple-500" />
            Чат с YandexGPT Pro
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-beige-mid/30">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center gap-2 py-10">
              <Icon name="MessageCircle" size={32} className="text-ink/20" />
              <p className="text-sm text-ink/40">Задайте любой вопрос нейросети — она отвечает с тем же системным промптом, что используется для аналитики отчётов.</p>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  m.role === "user"
                    ? "bg-ink text-beige rounded-br-md"
                    : "bg-white border border-beige-dark text-ink rounded-bl-md"
                }`}
              >
                {m.role === "assistant" ? <MarkdownText text={m.text} /> : <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="bg-white border border-beige-dark rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-ink/30 animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 rounded-full bg-ink/30 animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 rounded-full bg-ink/30 animate-bounce" />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-2.5 rounded-xl">
              <Icon name="AlertCircle" size={14} />
              {error}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-beige-dark px-5 py-3 space-y-2">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Напишите сообщение..."
              rows={2}
              className="flex-1 border border-beige-dark rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-ink resize-none bg-white"
            />
            <button
              onClick={send}
              disabled={sending || !input.trim()}
              className="px-4 py-2.5 text-sm rounded-xl bg-ink text-beige hover:bg-ink/90 transition-colors disabled:opacity-60 flex items-center gap-1.5 flex-shrink-0"
            >
              <Icon name={sending ? "Loader" : "Send"} size={14} className={sending ? "animate-spin" : ""} />
            </button>
          </div>
          {messages.length > 0 && (
            <button onClick={clearChat} className="text-xs text-ink/40 hover:text-ink/70 transition-colors flex items-center gap-1">
              <Icon name="RotateCcw" size={11} />
              Очистить диалог
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
