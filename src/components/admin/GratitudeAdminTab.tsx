import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { Creds, adminCall } from "@/components/admin/donorcabinet/adminApi";

const inp = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 bg-slate-50";
const lbl = "block text-xs uppercase tracking-widest text-slate-400 mb-1";
const TYPES = [["drawing", "Рисунок"], ["card", "Открытка"], ["letter", "Письмо"]] as const;

type Post = { id: number; post_type: string; media_url: string | null; caption: string; letter_text: string | null; consent_obtained: boolean; goal_id: number | null; goal_title?: string | null; is_published: boolean };
type Goal = { id: number; title: string };
type Form = { id: number; post_type: string; media_url: string; caption: string; letter_text: string; consent: boolean; goal_id: string };

const EMPTY: Form = { id: 0, post_type: "drawing", media_url: "", caption: "", letter_text: "", consent: false, goal_id: "" };

async function compress(file: File): Promise<{ data: string; type: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Не удалось обработать картинку");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const url = canvas.toDataURL("image/jpeg", 0.82);
  return { data: url.split(",")[1] || "", type: "image/jpeg" };
}

export default function GratitudeAdminTab({ authLogin, authPassword }: { authLogin: string; authPassword: string }) {
  const creds: Creds = { authLogin, authPassword };
  const [posts, setPosts] = useState<Post[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [form, setForm] = useState<Form>(EMPTY);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm(f => ({ ...f, [k]: v }));

  const load = async () => {
    try {
      setPosts((await adminCall<{ posts: Post[] }>(creds, "gratitude_list")).posts);
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка"); }
  };

  useEffect(() => {
    load();
    fetch("https://functions.poehali.dev/c07dbd95-dad7-4562-8589-f3a6fd76c820?type=goals&all=1")
      .then(r => r.json()).then(d => setGoals(d.goals || [])).catch(() => {});
  }, []);

  const run = async (name: string, fn: () => Promise<void>) => {
    setBusy(name); setError(""); setInfo("");
    try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : "Ошибка"); }
    setBusy("");
  };

  const upload = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) { setError("Нужна картинка"); return; }
    run("upload", async () => {
      const img = await compress(file);
      const d = await adminCall<{ media_url: string }>(creds, "gratitude_upload", { file_data: img.data, file_type: img.type });
      set("media_url", d.media_url);
    });
  };

  const save = (publish: boolean) => run(publish ? "publish" : "save", async () => {
    await adminCall(creds, "gratitude_save", {
      id: form.id || undefined, post_type: form.post_type, media_url: form.media_url, caption: form.caption,
      letter_text: form.letter_text, consent_obtained: form.consent, goal_id: form.goal_id || null, is_published: publish,
    });
    setInfo(publish ? "Опубликовано на сайте" : "Сохранено как черновик");
    setForm(EMPTY);
    await load();
  });

  const anonymize = () => run("anon", async () => {
    const d = await adminCall<{ text: string }>(creds, "gratitude_anonymize", { text: form.letter_text });
    set("letter_text", d.text);
    setInfo("Имена и адреса убраны. Прочитайте текст перед публикацией.");
  });

  const unpublish = (p: Post) => run("toggle", async () => {
    await adminCall(creds, "gratitude_save", { ...p, consent_obtained: p.consent_obtained, is_published: !p.is_published });
    await load();
  });

  const remove = (p: Post) => {
    if (!confirm("Удалить эту запись?")) return;
    run("del", async () => { await adminCall(creds, "gratitude_delete", { id: p.id }); await load(); });
  };

  const edit = (p: Post) => setForm({
    id: p.id, post_type: p.post_type, media_url: p.media_url || "", caption: p.caption || "",
    letter_text: p.letter_text || "", consent: p.consent_obtained, goal_id: p.goal_id ? String(p.goal_id) : "",
  });

  const isLetter = form.post_type === "letter";
  const hasContent = !!form.media_url || !!form.letter_text.trim();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <h3 className="font-semibold text-slate-800">{form.id ? "Редактирование" : "Новая благодарность"}</h3>

        <div className="flex gap-2">
          {TYPES.map(([id, label]) => (
            <button key={id} type="button" onClick={() => set("post_type", id)}
              className={`px-4 py-1.5 rounded-xl text-sm border ${form.post_type === id ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-medium" : "border-slate-200 text-slate-500"}`}>{label}</button>
          ))}
        </div>

        <div
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files[0]); }}
          onClick={() => fileRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center text-sm transition-colors ${drag ? "border-indigo-400 bg-indigo-50" : "border-slate-200 text-slate-500"}`}>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { upload(e.target.files?.[0]); e.target.value = ""; }} />
          {form.media_url ? <img src={form.media_url} alt="" className="max-h-52 mx-auto rounded-xl" /> : (
            <>
              <Icon name="ImagePlus" size={24} className="mx-auto mb-2 text-slate-400" />
              {busy === "upload" ? "Загружаем..." : "Перетащите скан или фото сюда или нажмите для выбора"}
            </>
          )}
        </div>
        {form.media_url && <button type="button" onClick={() => set("media_url", "")} className="text-xs text-slate-500 hover:text-red-600">Убрать картинку</button>}

        <div>
          <label className={lbl}>Короткая подпись</label>
          <input className={inp} maxLength={300} value={form.caption} onChange={e => set("caption", e.target.value)} placeholder="Спасибо за то, что у нас с мамой есть место..." />
        </div>

        {isLetter && (
          <div>
            <label className={lbl}>Текст письма</label>
            <textarea className={`${inp} min-h-[140px]`} value={form.letter_text} onChange={e => set("letter_text", e.target.value)} placeholder="Вставьте текст письма" />
            <button type="button" onClick={anonymize} disabled={!!busy || form.letter_text.trim().length < 20}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40">
              <Icon name="ShieldCheck" size={15} />{busy === "anon" ? "Обрабатываем..." : "Убрать имена и адреса (YandexGPT)"}
            </button>
          </div>
        )}

        <div>
          <label className={lbl}>Привязать к сбору (необязательно)</label>
          <select className={inp} value={form.goal_id} onChange={e => set("goal_id", e.target.value)}>
            <option value="">Без привязки</option>
            {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
          </select>
        </div>

        <label className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer bg-amber-50 border border-amber-100 rounded-xl p-3">
          <input type="checkbox" checked={form.consent} onChange={e => set("consent", e.target.checked)} className="w-4 h-4 mt-0.5" />
          Подтверждаю, что получено добровольное согласие на публикацию, и материалы не раскрывают личность подопечного (152-ФЗ).
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && <p className="text-sm text-green-700">{info}</p>}

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => save(false)} disabled={!!busy || !hasContent} className="px-5 py-2 rounded-xl text-sm border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40">Сохранить черновик</button>
          <button type="button" onClick={() => save(true)} disabled={!!busy || !form.consent || !hasContent} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-40">
            <Icon name="Globe" size={15} />Опубликовать на сайте
          </button>
          {form.id > 0 && <button type="button" onClick={() => setForm(EMPTY)} className="px-5 py-2 rounded-xl text-sm text-slate-500">Отмена</button>}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.map(p => (
          <div key={p.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {p.media_url ? <img src={p.media_url} alt="" className="w-full h-40 object-cover" /> : <div className="h-40 bg-slate-50 flex items-center justify-center"><Icon name="Mail" size={28} className="text-slate-300" /></div>}
            <div className="p-3 space-y-2">
              <p className="text-sm text-slate-700 line-clamp-2">{p.caption || "Без подписи"}</p>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className={`px-2 py-0.5 rounded-full ${p.is_published ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>{p.is_published ? "На сайте" : "Черновик"}</span>
                <span className={`px-2 py-0.5 rounded-full ${p.consent_obtained ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>{p.consent_obtained ? "Согласие есть" : "Нет согласия"}</span>
                {p.goal_title && <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">{p.goal_title}</span>}
              </div>
              <div className="flex gap-3 text-xs">
                <button onClick={() => edit(p)} className="text-slate-500 hover:text-slate-800">Изменить</button>
                {(p.is_published || p.consent_obtained) && <button onClick={() => unpublish(p)} className="text-slate-500 hover:text-slate-800">{p.is_published ? "Снять с сайта" : "Опубликовать"}</button>}
                <button onClick={() => remove(p)} className="text-slate-400 hover:text-red-600">Удалить</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
