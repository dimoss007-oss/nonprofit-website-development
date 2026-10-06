import { useState } from "react";
import Icon from "@/components/ui/icon";
import { CHILD_WEEKLY_API } from "@/components/admin/crm/crmShared";

type Candidate = { id: number; name: string; mother?: string };
type Item = { name_in_text: string; text: string; child_id: number | null; status: "matched" | "ambiguous" | "unmatched"; candidates: Candidate[] };
type ChildOpt = { id: number; name: string; mother?: string };

const mondayOf = (d: Date) => {
  const x = new Date(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

const weekLabel = (start: string) => {
  const from = new Date(start + "T00:00:00");
  const to = new Date(from);
  to.setDate(to.getDate() + 6);
  const f = (d: Date) => d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
  return `${f(from)} – ${f(to)}.${to.getFullYear()}`;
};

const EXAMPLE = "Анна - спокойная, хорошо общалась с детьми\nМаксим - капризничал вечером, помогла беседа\nСофья - без замечаний, помогала на кухне";

export default function ChildrenBulkReport({ authorName, onSaved }: { authorName: string; onSaved?: () => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [items, setItems] = useState<Item[] | null>(null);
  const [options, setOptions] = useState<ChildOpt[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const post = async (body: object) => {
    const r = await fetch(CHILD_WEEKLY_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json();
    return { ok: r.ok, d };
  };

  const reset = () => { setItems(null); setError(""); };

  const parse = async () => {
    setBusy(true); setError(""); setDone("");
    try {
      const { ok, d } = await post({ action: "parse", report_text: text, week_start: weekStart });
      if (!ok) { setError(d.error || "Не удалось разобрать отчёт"); return; }
      setItems(d.items);
      setOptions(d.children || []);
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setBusy(false);
    }
  };

  const setChild = (idx: number, id: number | null) =>
    setItems((prev) => prev && prev.map((it, i) => (i === idx ? { ...it, child_id: id, status: id ? "matched" : "unmatched" } : it)));

  const setItemText = (idx: number, value: string) =>
    setItems((prev) => prev && prev.map((it, i) => (i === idx ? { ...it, text: value } : it)));

  const skip = (idx: number) => setItems((prev) => prev && prev.filter((_, i) => i !== idx));

  const ready = items?.filter((i) => i.child_id) ?? [];
  const missing = (items?.length ?? 0) - ready.length;

  const save = async () => {
    if (!ready.length) { setError("Выберите ребёнка хотя бы для одной строки"); return; }
    setBusy(true); setError("");
    try {
      const { ok, d } = await post({ action: "import", week_start: weekStart, author: authorName, items: ready.map((i) => ({ child_id: i.child_id, text: i.text })) });
      if (!ok) { setError(d.error || "Не удалось сохранить"); return; }
      const parts = [];
      if (d.created) parts.push(`добавлено: ${d.created}`);
      if (d.updated) parts.push(`обновлено: ${d.updated}`);
      setDone(`Отчёт сохранён (${parts.join(", ")}). Он уже учитывается в ИИ-сводках.`);
      setText(""); setItems(null); setOpen(false);
      onSaved?.();
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <div className="space-y-2">
        <button onClick={() => { setOpen(true); setDone(""); }} className="w-full flex items-center justify-center gap-2 bg-ink text-beige px-4 py-3 rounded-xl text-sm font-semibold hover:bg-ink/90 transition-colors">
          <Icon name="ClipboardPaste" size={16} /> Еженедельный отчёт по всем детям
        </button>
        {done && <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{done}</p>}
      </div>
    );
  }

  return (
    <div className="bg-white border border-ink/20 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-ink">Еженедельный отчёт по детям</h3>
        <button onClick={() => { setOpen(false); reset(); }} className="p-1 text-ink/40 hover:text-ink"><Icon name="X" size={16} /></button>
      </div>

      <div>
        <label className="text-xs text-ink/50 mb-1 block">Неделя (любой день недели)</label>
        <input type="date" value={weekStart} onChange={(e) => { if (e.target.value) { setWeekStart(mondayOf(new Date(e.target.value + "T00:00:00"))); reset(); } }} className="border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
        <span className="text-xs text-ink/50 ml-3">{weekLabel(weekStart)}</span>
      </div>

      {!items && (
        <>
          <div>
            <label className="text-xs text-ink/50 mb-1 block">Отчёт: каждая строка — «Имя ребёнка - состояние»</label>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={10} placeholder={EXAMPLE} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink resize-y" />
            <p className="text-[11px] text-ink/40 mt-1">Подойдёт и «Имя: состояние», и нумерация. Можно писать «Саша Петров», если в центре несколько Саш. Продолжение на следующих строках относится к тому же ребёнку.</p>
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex justify-end">
            <button onClick={parse} disabled={busy || !text.trim()} className="px-4 py-2 text-sm rounded-lg bg-ink text-beige hover:bg-ink/90 disabled:opacity-60 transition-colors flex items-center gap-1.5">
              <Icon name={busy ? "Loader" : "ScanSearch"} size={14} className={busy ? "animate-spin" : ""} />
              {busy ? "Разбираю..." : "Разобрать по детям"}
            </button>
          </div>
        </>
      )}

      {items && (
        <>
          <p className="text-xs text-ink/50">Проверьте, кому что отнесено. Если имя не распознано, выберите ребёнка вручную или уберите строку.</p>
          <div className="space-y-2">
            {items.map((it, idx) => (
              <div key={idx} className={`rounded-xl border p-3 space-y-2 ${it.child_id ? "border-green-200 bg-green-50/40" : "border-amber-300 bg-amber-50"}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-ink/50">В тексте: <span className="font-semibold text-ink">{it.name_in_text}</span></span>
                  <Icon name="ArrowRight" size={12} className="text-ink/30" />
                  <select value={it.child_id ?? ""} onChange={(e) => setChild(idx, e.target.value ? Number(e.target.value) : null)} className="border border-beige-dark rounded-lg px-2 py-1 text-sm bg-white focus:outline-none focus:border-ink min-w-[180px]">
                    <option value="">— выберите ребёнка —</option>
                    {(it.status === "ambiguous" ? it.candidates : options).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}{c.mother ? ` (мама ${c.mother})` : ""}</option>
                    ))}
                  </select>
                  {it.status === "ambiguous" && <span className="text-[11px] text-amber-700">Несколько совпадений</span>}
                  <button onClick={() => skip(idx)} className="ml-auto p-1 text-ink/30 hover:text-red-400" title="Убрать строку"><Icon name="X" size={14} /></button>
                </div>
                <textarea value={it.text} onChange={(e) => setItemText(idx, e.target.value)} rows={2} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-ink resize-y" />
              </div>
            ))}
          </div>
          {missing > 0 && <p className="text-xs text-amber-700">Без ребёнка: {missing}. Такие строки не сохранятся.</p>}
          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button onClick={reset} className="px-4 py-2 text-sm rounded-lg border border-beige-dark hover:border-ink transition-colors">Назад к тексту</button>
            <button onClick={save} disabled={busy || ready.length === 0} className="px-4 py-2 text-sm rounded-lg bg-ink text-beige hover:bg-ink/90 disabled:opacity-60 transition-colors flex items-center gap-1.5">
              <Icon name={busy ? "Loader" : "Save"} size={14} className={busy ? "animate-spin" : ""} />
              {busy ? "Сохранение..." : `Сохранить (${ready.length})`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
