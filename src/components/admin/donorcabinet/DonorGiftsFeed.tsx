import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { fmtDateTime } from "@/components/cabinet/cabinet.shared";
import { Creds, adminCall, inputCls } from "@/components/admin/donorcabinet/adminApi";

type Gift = { id: number; title: string; status: string; note?: string; email: string; full_name?: string; created_at: string; sent_at?: string | null };
type Account = { id: number; email: string; full_name?: string };
type Post = { id: number; title: string; body: string; image_url?: string; is_published: boolean; created_at: string };

export function DonorGifts({ creds }: { creds: Creds }) {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState<number | "">("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setGifts((await adminCall<{ gifts: Gift[] }>(creds, "gifts")).gifts);
      setAccounts((await adminCall<{ accounts: Account[] }>(creds, "accounts")).accounts);
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка"); }
  };
  useEffect(() => { load(); }, []);

  const mark = async (g: Gift, status: "sent" | "planned") => {
    try { await adminCall(creds, "mark_gift", { id: g.id, status, notify: status === "sent" }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Ошибка"); }
  };

  const add = async () => {
    try { await adminCall(creds, "add_gift", { account_id: accountId, title }); setTitle(""); setAccountId(""); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Ошибка"); }
  };

  const planned = gifts.filter((g) => g.status !== "sent");
  const sent = gifts.filter((g) => g.status === "sent");

  const Row = ({ g }: { g: Gift }) => (
    <div className="bg-white border border-beige-dark rounded-2xl px-4 py-3 flex items-center gap-3">
      <Icon name="Gift" size={18} className={g.status === "sent" ? "text-green-600" : "text-sage"} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink">{g.title}</p>
        <p className="text-xs text-ink/50 truncate">{g.full_name || g.email} · {g.status === "sent" ? `отправлено ${fmtDateTime(g.sent_at)}` : `создано ${fmtDateTime(g.created_at)}`}</p>
      </div>
      {g.status === "sent"
        ? <button onClick={() => mark(g, "planned")} className="text-xs text-ink/40 hover:text-ink">Вернуть</button>
        : <button onClick={() => mark(g, "sent")} className="px-3 py-1.5 text-xs rounded-lg bg-ink text-beige hover:bg-ink/90 transition-colors">Отправлено</button>}
    </div>
  );

  return (
    <div className="space-y-5">
      <p className="text-xs text-ink/50">Подарки появляются сами, когда жертвователь получает награду с подарком. Отметьте «Отправлено», и он увидит сообщение в кабинете.</p>
      {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      <div className="bg-white border border-beige-dark rounded-2xl p-4 flex gap-2 flex-wrap items-end">
        <div className="flex-1 min-w-[200px]"><label className="text-xs text-ink/50 mb-1 block">Кому</label>
          <select value={accountId} onChange={(e) => setAccountId(Number(e.target.value))} className={inputCls}><option value="">Выберите жертвователя</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.full_name || a.email}</option>)}</select></div>
        <div className="flex-1 min-w-[200px]"><label className="text-xs text-ink/50 mb-1 block">Подарок</label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Открытка с рисунком детей" className={inputCls} /></div>
        <button onClick={add} disabled={!accountId || !title.trim()} className="px-4 py-2 rounded-lg bg-ink text-beige text-sm font-semibold hover:bg-ink/90 disabled:opacity-50 transition-colors">Добавить</button>
      </div>
      <div className="space-y-2"><h4 className="text-xs uppercase tracking-wider text-ink/50">Нужно отправить ({planned.length})</h4>{planned.map((g) => <Row key={g.id} g={g} />)}{!planned.length && <p className="text-sm text-ink/40 py-3">Всё отправлено</p>}</div>
      {!!sent.length && <div className="space-y-2"><h4 className="text-xs uppercase tracking-wider text-ink/50">Отправлено ({sent.length})</h4>{sent.map((g) => <Row key={g.id} g={g} />)}</div>}
    </div>
  );
}

export function DonorFeedAdmin({ creds }: { creds: Creds }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [editing, setEditing] = useState<Partial<Post> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try { setPosts((await adminCall<{ items: Post[] }>(creds, "crud_list", { entity: "feed" })).items); }
    catch (e) { setError(e instanceof Error ? e.message : "Ошибка"); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true); setError("");
    try { await adminCall(creds, "crud_save", { entity: "feed", item: editing }); setEditing(null); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Не удалось сохранить"); }
    finally { setSaving(false); }
  };

  const remove = async (p: Post) => {
    if (!confirm(`Удалить публикацию «${p.title}»?`)) return;
    try { await adminCall(creds, "crud_delete", { entity: "feed", id: p.id }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Ошибка"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <p className="text-xs text-ink/50 max-w-xl">Закрытая лента видна только вошедшим в личный кабинет жертвователям: новости, фото, отчёты.</p>
        <button onClick={() => { setEditing({ title: "", body: "", image_url: "", is_published: true }); setError(""); }} className="flex items-center gap-1.5 bg-ink text-beige px-4 py-2 rounded-xl text-sm font-semibold hover:bg-ink/90 transition-colors"><Icon name="Plus" size={14} />Новая публикация</button>
      </div>
      {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      {editing && (
        <div className="bg-white border border-ink/20 rounded-2xl p-5 space-y-3">
          <div><label className="text-xs text-ink/50 mb-1 block">Заголовок *</label><input value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className={inputCls} /></div>
          <div><label className="text-xs text-ink/50 mb-1 block">Текст *</label><textarea rows={6} value={editing.body || ""} onChange={(e) => setEditing({ ...editing, body: e.target.value })} className={inputCls} /></div>
          <div><label className="text-xs text-ink/50 mb-1 block">Ссылка на фото (необязательно)</label><input value={editing.image_url || ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} placeholder="https://..." className={inputCls} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.is_published !== false} onChange={(e) => setEditing({ ...editing, is_published: e.target.checked })} className="accent-sage w-4 h-4" />Опубликовано</label>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm rounded-lg border border-beige-dark hover:border-ink transition-colors">Отмена</button>
            <button onClick={save} disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-ink text-beige hover:bg-ink/90 disabled:opacity-60 transition-colors">{saving ? "Сохранение..." : "Сохранить"}</button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {posts.map((p) => (
          <div key={p.id} className={`bg-white border border-beige-dark rounded-2xl px-4 py-3 flex items-center gap-3 group ${p.is_published ? "" : "opacity-50"}`}>
            {p.image_url ? <img src={p.image_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" /> : <div className="w-12 h-12 rounded-lg bg-beige-mid flex items-center justify-center text-ink/30 flex-shrink-0"><Icon name="Newspaper" size={18} /></div>}
            <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-ink truncate">{p.title}</p><p className="text-xs text-ink/50">{fmtDateTime(p.created_at)}{!p.is_published && " · скрыто"}</p></div>
            <button onClick={() => setEditing(p)} className="p-1.5 text-ink/40 hover:text-ink"><Icon name="Pencil" size={15} /></button>
            <button onClick={() => remove(p)} className="p-1.5 text-ink/30 hover:text-red-500"><Icon name="Trash2" size={15} /></button>
          </div>
        ))}
        {!posts.length && <p className="text-center text-sm text-ink/40 py-8">Публикаций пока нет</p>}
      </div>
    </div>
  );
}
