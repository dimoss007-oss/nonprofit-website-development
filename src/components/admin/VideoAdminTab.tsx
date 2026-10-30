import { useEffect, useState } from "react";
import { Creds, adminCall } from "@/components/admin/donorcabinet/adminApi";
import { VIDEO_CATEGORIES } from "@/components/home/VideoActionWidget";

const inp = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 bg-slate-50";
const lbl = "block text-xs uppercase tracking-widest text-slate-400 mb-1";

type Video = { id: number; title: string; category: string; video_url: string; embed_url: string; thumbnail_url: string | null; description: string; consent_obtained: boolean; is_published: boolean };
type Form = { id: number; title: string; category: string; video_url: string; thumbnail_url: string; description: string; consent: boolean };
const EMPTY: Form = { id: 0, title: "", category: "center_life", video_url: "", thumbnail_url: "", description: "", consent: false };
const catLabel = (id: string) => VIDEO_CATEGORIES.find(c => c.id === id)?.label || id;

export default function VideoAdminTab({ authLogin, authPassword }: { authLogin: string; authPassword: string }) {
  const creds: Creds = { authLogin, authPassword };
  const [videos, setVideos] = useState<Video[]>([]);
  const [form, setForm] = useState<Form>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm(f => ({ ...f, [k]: v }));

  const load = async () => {
    try { setVideos((await adminCall<{ videos: Video[] }>(creds, "video_list")).videos); }
    catch (e) { setError(e instanceof Error ? e.message : "Ошибка"); }
  };
  useEffect(() => { load(); }, []);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setError(""); setInfo("");
    try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : "Ошибка"); }
    setBusy(false);
  };

  const save = (publish: boolean) => run(async () => {
    await adminCall(creds, "video_save", {
      id: form.id || undefined, title: form.title, category: form.category, video_url: form.video_url,
      thumbnail_url: form.thumbnail_url, description: form.description, consent_obtained: form.consent, is_published: publish,
    });
    setInfo(publish ? "Опубликовано на сайте" : "Сохранено как черновик");
    setForm(EMPTY);
    await load();
  });

  const toggle = (v: Video) => run(async () => {
    await adminCall(creds, "video_save", { ...v, is_published: !v.is_published });
    await load();
  });

  const remove = (v: Video) => {
    if (!confirm("Удалить этот ролик?")) return;
    run(async () => { await adminCall(creds, "video_delete", { id: v.id }); await load(); });
  };

  const edit = (v: Video) => setForm({
    id: v.id, title: v.title, category: v.category, video_url: v.video_url,
    thumbnail_url: v.thumbnail_url || "", description: v.description || "", consent: v.consent_obtained,
  });

  const ready = form.title.trim() && form.video_url.trim();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <h3 className="font-semibold text-slate-800">{form.id ? "Редактирование ролика" : "Новый видеоотчёт"}</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Название (для себя)</label>
            <input className={inp} value={form.title} onChange={e => set("title", e.target.value)} placeholder="Разгрузка питания 12.09" />
          </div>
          <div>
            <label className={lbl}>Категория</label>
            <select className={inp} value={form.category} onChange={e => set("category", e.target.value)}>
              {VIDEO_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className={lbl}>Ссылка на видео (ВКонтакте, YouTube, RuTube)</label>
          <input className={inp} value={form.video_url} onChange={e => set("video_url", e.target.value)} placeholder="https://vk.com/video-123_456" />
        </div>
        <div>
          <label className={lbl}>Обложка (ссылка, необязательно)</label>
          <input className={inp} value={form.thumbnail_url} onChange={e => set("thumbnail_url", e.target.value)} />
        </div>
        <div>
          <label className={lbl}>Краткий итог под видео</label>
          <textarea className={`${inp} min-h-[80px]`} maxLength={1000} value={form.description} onChange={e => set("description", e.target.value)} />
        </div>
        <label className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer bg-amber-50 border border-amber-100 rounded-xl p-3">
          <input type="checkbox" checked={form.consent} onChange={e => set("consent", e.target.checked)} className="w-4 h-4 mt-0.5" />
          Подтверждаю наличие письменного согласия на видеосъемку и публикацию.
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && <p className="text-sm text-green-700">{info}</p>}
        <div className="flex flex-wrap gap-3">
          <button onClick={() => save(false)} disabled={busy || !ready} className="px-5 py-2 rounded-xl text-sm border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40">Сохранить черновик</button>
          <button onClick={() => save(true)} disabled={busy || !ready || !form.consent} className="px-5 py-2 rounded-xl text-sm font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-40">Опубликовать на сайте</button>
          {form.id > 0 && <button onClick={() => setForm(EMPTY)} className="px-5 py-2 rounded-xl text-sm text-slate-500">Отмена</button>}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {videos.map(v => (
          <div key={v.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
            <p className="font-medium text-slate-800">{v.title}</p>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">{catLabel(v.category)}</span>
              <span className={`px-2 py-0.5 rounded-full ${v.is_published ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>{v.is_published ? "На сайте" : "Черновик"}</span>
              <span className={`px-2 py-0.5 rounded-full ${v.consent_obtained ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>{v.consent_obtained ? "Согласие есть" : "Нет согласия"}</span>
            </div>
            <div className="flex gap-3 text-xs">
              <button onClick={() => edit(v)} className="text-slate-500 hover:text-slate-800">Изменить</button>
              {v.consent_obtained && <button onClick={() => toggle(v)} className="text-slate-500 hover:text-slate-800">{v.is_published ? "Снять с сайта" : "Опубликовать"}</button>}
              <button onClick={() => remove(v)} className="text-slate-400 hover:text-red-600">Удалить</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
