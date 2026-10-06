import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { FeedPost, Message, cabinetGet, cabinetPost, fmtDateTime } from "@/components/cabinet/cabinet.shared";

const KIND_ICON: Record<string, string> = { award: "Award", gift: "Gift", anniversary: "Cake", reminder: "Heart", broadcast: "Mail" };

export function CabinetMessages({ onRead }: { onRead: () => void }) {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    cabinetGet<{ messages: Message[] }>("messages")
      .then(async (d) => {
        setMessages(d.messages);
        if (d.messages.some((m) => !m.is_read)) {
          await cabinetPost({ action: "mark_read" });
          onRead();
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Ошибка"));
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!messages) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin" /></div>;
  if (!messages.length) return <p className="text-sm text-ink/40 bg-white border border-beige-dark rounded-2xl p-8 text-center">Сообщений пока нет. Здесь будут благодарности и новости от центра.</p>;

  return (
    <div className="space-y-3">
      {messages.map((m) => (
        <div key={m.id} className={`bg-white border rounded-2xl p-5 ${m.is_read ? "border-beige-dark" : "border-sage"}`}>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-beige-mid text-ink/60 flex items-center justify-center flex-shrink-0"><Icon name={KIND_ICON[m.kind] || "Mail"} fallback="Mail" size={16} /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-ink text-sm">{m.title}</p>
                {!m.is_read && <span className="text-[10px] px-2 py-0.5 rounded-full bg-sage text-white">новое</span>}
              </div>
              <p className="text-sm text-ink/70 mt-1 whitespace-pre-wrap break-words">{m.body}</p>
              <p className="text-[11px] text-ink/40 mt-2">{fmtDateTime(m.created_at)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CabinetFeed() {
  const [posts, setPosts] = useState<FeedPost[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    cabinetGet<{ posts: FeedPost[] }>("feed").then((d) => setPosts(d.posts)).catch((e) => setError(e instanceof Error ? e.message : "Ошибка"));
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!posts) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin" /></div>;
  if (!posts.length) return <p className="text-sm text-ink/40 bg-white border border-beige-dark rounded-2xl p-8 text-center">Закрытая лента для своих скоро наполнится новостями и фото из жизни центра.</p>;

  return (
    <div className="space-y-4">
      {posts.map((p) => (
        <article key={p.id} className="bg-white border border-beige-dark rounded-3xl overflow-hidden">
          {p.image_url && <img src={p.image_url} alt={p.title} className="w-full max-h-80 object-cover" loading="lazy" />}
          <div className="p-6">
            <p className="text-[11px] text-ink/40">{fmtDateTime(p.created_at)}</p>
            <h3 className="font-cormorant text-ink text-2xl font-semibold mt-1">{p.title}</h3>
            <p className="text-sm text-ink/70 mt-2 whitespace-pre-wrap break-words">{p.body}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
