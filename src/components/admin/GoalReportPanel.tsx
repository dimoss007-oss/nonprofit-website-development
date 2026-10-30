import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { Creds, adminCall } from "@/components/admin/donorcabinet/adminApi";

const area = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 bg-slate-50 min-h-[84px]";
const lbl = "block text-xs uppercase tracking-widest text-slate-400 mb-1";

type Report = { situation_before: string; action_taken: string; situation_after: string; photo_url: string | null; ai_text: string | null; in_top?: boolean; tag?: string; sent_at: string | null; sent_count: number };

export default function GoalReportPanel({ goalId, goalTitle, creds, onClose }: { goalId: number; goalTitle: string; creds: Creds; onClose: () => void }) {
  const [before, setBefore] = useState("");
  const [action, setAction] = useState("");
  const [after, setAfter] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sentInfo, setSentInfo] = useState("");
  const [donors, setDonors] = useState(0);
  const [inTop, setInTop] = useState(false);
  const [brigade, setBrigade] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    adminCall<{ report: Report | null; donors_count: number }>(creds, "goal_report_get", { goal_id: goalId })
      .then(d => {
        setDonors(d.donors_count);
        const r = d.report;
        if (!r) return;
        setBefore(r.situation_before || ""); setAction(r.action_taken || ""); setAfter(r.situation_after || "");
        setPhoto(r.photo_url); setText(r.ai_text || ""); setInTop(!!r.in_top); setBrigade(r.tag === "mobile_brigade");
        if (r.sent_at) setSentInfo(`Отправлено ${new Date(r.sent_at).toLocaleDateString("ru-RU")}, писем: ${r.sent_count}`);
      })
      .catch(e => setError(e instanceof Error ? e.message : "Ошибка"));
  }, [goalId]);

  const run = async (name: string, fn: () => Promise<void>) => {
    setBusy(name); setError(""); setInfo("");
    try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : "Ошибка"); }
    setBusy("");
  };

  const fields = { situation_before: before, action_taken: action, situation_after: after };

  const generate = () => run("gen", async () => {
    const d = await adminCall<{ ai_text: string }>(creds, "goal_report_generate", fields);
    setText(d.ai_text);
    await adminCall(creds, "goal_report_save", { goal_id: goalId, ...fields, ai_text: d.ai_text });
  });

  const save = () => run("save", async () => {
    await adminCall(creds, "goal_report_save", { goal_id: goalId, ...fields, ai_text: text, in_top: inTop, tag: brigade ? "mobile_brigade" : "" });
    setInfo(inTop ? "Сохранено, история показана на сайте" : "Сохранено");
  });

  const upload = (file: File) => run("photo", async () => {
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
      reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
      reader.readAsDataURL(file);
    });
    const d = await adminCall<{ photo_url: string }>(creds, "goal_report_photo", { goal_id: goalId, file_data: data, file_type: file.type });
    setPhoto(d.photo_url);
  });

  const send = () => {
    if (!confirm(`Отправить отчёт донорам сбора (${donors})? Отменить рассылку будет нельзя.`)) return;
    run("send", async () => {
      await adminCall(creds, "goal_report_save", { goal_id: goalId, ...fields, ai_text: text });
      const d = await adminCall<{ recipients: number; queue?: { sent: number; pending: number; failed: number; error?: string } | null }>(creds, "goal_report_send", { goal_id: goalId });
      setInfo(`Получателей: ${d.recipients}. Отправлено: ${d.queue?.sent ?? 0}, в очереди: ${d.queue?.pending ?? 0}`);
      if (d.queue?.error) setError(d.queue.error);
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-indigo-200 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-800">Отчёт донорам: {goalTitle}</h3>
          <p className="text-xs text-slate-400">Доноров с email у этого сбора: {donors}</p>
        </div>
        <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-800"><Icon name="X" size={16} /></button>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <div><label className={lbl}>Было</label><textarea className={area} value={before} onChange={e => setBefore(e.target.value)} /></div>
        <div><label className={lbl}>Что сделали</label><textarea className={area} value={action} onChange={e => setAction(e.target.value)} /></div>
        <div><label className={lbl}>Стало</label><textarea className={area} value={after} onChange={e => setAfter(e.target.value)} /></div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
        <button onClick={() => fileRef.current?.click()} disabled={!!busy} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          <Icon name="ImagePlus" size={15} />{busy === "photo" ? "Загружаем..." : photo ? "Заменить фото" : "Загрузить главное фото"}
        </button>
        <button onClick={generate} disabled={!!busy} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
          <Icon name="Sparkles" size={15} />{busy === "gen" ? "Пишем текст..." : "Сгенерировать текст (YandexGPT)"}
        </button>
      </div>

      {(text || photo) && (
        <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
          <p className={lbl}>Предпросмотр письма (текст можно поправить)</p>
          {photo && <img src={photo} alt="" className="max-h-56 rounded-xl" />}
          <textarea className={`${area} min-h-[220px] bg-white`} value={text} onChange={e => setText(e.target.value)} />
        </div>
      )}

      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
        <input type="checkbox" checked={inTop} onChange={e => setInTop(e.target.checked)} className="w-4 h-4" />
        Добавить в топ-5 этого месяца на сайте («Благодаря вам»)
      </label>

      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
        <input type="checkbox" checked={brigade} onChange={e => setBrigade(e.target.checked)} className="w-4 h-4" />
        Показывать на странице «Мобильная бригада»
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {info && <p className="text-sm text-green-700">{info}</p>}
      {sentInfo && <p className="text-xs text-slate-500">{sentInfo}</p>}

      <div className="flex flex-wrap gap-3">
        <button onClick={save} disabled={!!busy} className="px-5 py-2 rounded-xl text-sm border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50">Сохранить черновик</button>
        <button onClick={send} disabled={!!busy || !text.trim() || donors === 0} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-40">
          <Icon name="Send" size={15} />{busy === "send" ? "Отправляем..." : "Отправить донорам сбора"}
        </button>
      </div>
    </div>
  );
}
