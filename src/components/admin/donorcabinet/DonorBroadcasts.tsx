import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { fmtDateTime } from "@/components/cabinet/cabinet.shared";
import { Creds, adminCall, inputCls } from "@/components/admin/donorcabinet/adminApi";

type Broadcast = { id: number; title: string; audience: string; in_cabinet: boolean; by_email: boolean; recipients_count: number; created_at: string; sent: number; pending: number; failed: number };
type Level = { id: number; title: string };

const AUDIENCES: Record<string, string> = {
  all: "Все зарегистрированные жертвователи",
  donors: "Те, кто уже жертвовал",
  level: "Жертвователи определённого уровня",
  lapsed: "Давно не жертвовали",
};

export default function DonorBroadcasts({ creds, smtp }: { creds: Creds; smtp: boolean }) {
  const [list, setList] = useState<Broadcast[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [audience, setAudience] = useState("all");
  const [levelId, setLevelId] = useState<number | "">("");
  const [inCabinet, setInCabinet] = useState(true);
  const [byEmail, setByEmail] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const load = async () => {
    try {
      setList((await adminCall<{ broadcasts: Broadcast[] }>(creds, "broadcasts")).broadcasts);
      const lv = await adminCall<{ items: Level[] }>(creds, "crud_list", { entity: "level" });
      setLevels(lv.items);
      if (lv.items[0] && levelId === "") setLevelId(lv.items[0].id);
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка"); }
  };
  useEffect(() => { load(); }, []);

  const send = async () => {
    const who = AUDIENCES[audience].toLowerCase();
    if (!confirm(`Отправить рассылку: ${who}? Отменить её будет нельзя.`)) return;
    setBusy(true); setError(""); setInfo("");
    try {
      const d = await adminCall<{ recipients: number; emails_queued: number; queue?: { sent: number; pending: number; failed: number; error?: string } | null }>(creds, "broadcast", {
        title, body: text, audience, level_id: audience === "level" ? levelId : null, in_cabinet: inCabinet, by_email: byEmail,
      });
      const parts = [`получателей: ${d.recipients}`];
      if (byEmail) parts.push(`писем отправлено: ${d.queue?.sent ?? 0}, в очереди: ${d.queue?.pending ?? 0}`);
      setInfo(`Рассылка создана (${parts.join(", ")})`);
      if (d.queue?.error) setError(d.queue.error);
      setTitle(""); setText("");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Не удалось отправить"); }
    finally { setBusy(false); }
  };

  const flush = async (action: "run_queue" | "retry_failed") => {
    setBusy(true); setError(""); setInfo("");
    try {
      const d = await adminCall<{ queue: { sent: number; pending: number; failed: number; error?: string } }>(creds, action);
      setInfo(`Отправлено писем: ${d.queue.sent}, осталось в очереди: ${d.queue.pending}`);
      if (d.queue.error) setError(d.queue.error);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка"); }
    finally { setBusy(false); }
  };

  const pending = list.reduce((s, b) => s + Number(b.pending), 0);
  const failed = list.reduce((s, b) => s + Number(b.failed), 0);

  return (
    <div className="space-y-5">
      {!smtp && <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm">Почта пока не подключена. Рассылки в кабинет работают, письма и вход по коду заработают после добавления данных почты в секреты.</div>}

      <div className="bg-white border border-beige-dark rounded-2xl p-5 space-y-3">
        <h3 className="font-semibold text-ink">Новая рассылка</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-ink/50 mb-1 block">Кому</label>
            <select value={audience} onChange={(e) => setAudience(e.target.value)} className={inputCls}>{Object.entries(AUDIENCES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          </div>
          {audience === "level" && (
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Уровень</label>
              <select value={levelId} onChange={(e) => setLevelId(Number(e.target.value))} className={inputCls}>{levels.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}</select>
            </div>
          )}
          <div className="sm:col-span-2"><label className="text-xs text-ink/50 mb-1 block">Тема *</label><input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} /></div>
          <div className="sm:col-span-2"><label className="text-xs text-ink/50 mb-1 block">Текст *</label><textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} className={inputCls} /></div>
        </div>
        <div className="flex flex-wrap items-center gap-5">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={inCabinet} onChange={(e) => setInCabinet(e.target.checked)} className="accent-sage w-4 h-4" />В личный кабинет</label>
          <label className={`flex items-center gap-2 text-sm ${smtp ? "" : "opacity-40"}`}><input type="checkbox" disabled={!smtp} checked={byEmail} onChange={(e) => setByEmail(e.target.checked)} className="accent-sage w-4 h-4" />На email</label>
        </div>
        {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        {info && <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">{info}</p>}
        <div className="flex justify-end">
          <button onClick={send} disabled={busy || !title.trim() || !text.trim() || (!inCabinet && !byEmail)} className="px-5 py-2.5 rounded-xl bg-ink text-beige text-sm font-semibold hover:bg-ink/90 disabled:opacity-60 transition-colors flex items-center gap-1.5">
            <Icon name={busy ? "Loader" : "Send"} size={14} className={busy ? "animate-spin" : ""} />Отправить
          </button>
        </div>
      </div>

      {(pending > 0 || failed > 0) && (
        <div className="bg-white border border-beige-dark rounded-2xl p-4 flex items-center gap-3 flex-wrap">
          <Icon name="Mail" size={16} className="text-ink/40" />
          <p className="text-sm text-ink/70 flex-1">В очереди писем: {pending}{failed > 0 && `, с ошибкой: ${failed}`}</p>
          {pending > 0 && <button onClick={() => flush("run_queue")} disabled={busy} className="px-3 py-1.5 text-sm rounded-lg border border-beige-dark hover:border-ink transition-colors">Отправить очередь</button>}
          {failed > 0 && <button onClick={() => flush("retry_failed")} disabled={busy} className="px-3 py-1.5 text-sm rounded-lg border border-beige-dark hover:border-ink transition-colors">Повторить неудачные</button>}
        </div>
      )}

      <div className="bg-white border border-beige-dark rounded-2xl p-5">
        <h3 className="font-semibold text-ink text-sm uppercase tracking-wide mb-3">История рассылок</h3>
        {!list.length ? <p className="text-sm text-ink/40 text-center py-6">Пока рассылок не было</p> : (
          <div className="divide-y divide-beige-mid">
            {list.map((b) => (
              <div key={b.id} className="py-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-ink">{b.title}</p>
                  <span className="text-[11px] text-ink/40">{fmtDateTime(b.created_at)}</span>
                </div>
                <p className="text-xs text-ink/50 mt-0.5">{AUDIENCES[b.audience] || b.audience} · получателей {b.recipients_count}{b.in_cabinet && " · кабинет"}{b.by_email && ` · email: отправлено ${b.sent}${Number(b.pending) ? `, ждёт ${b.pending}` : ""}${Number(b.failed) ? `, ошибок ${b.failed}` : ""}`}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
