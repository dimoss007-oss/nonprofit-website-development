import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";

const NEWS_URL = "https://functions.poehali.dev/b33c4df8-295a-4694-a485-e771aec3d9ce";
const VK_SYNC_URL = "https://functions.poehali.dev/7aa0c61c-d0d9-445c-bf64-da1978b51e1a?route=sync";

interface NewsItem {
  id: number;
  title: string;
  text: string;
  photos: string[];
  video_url: string;
  published_at: string;
  created_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

function compressAndConvert(file: File, maxWidth = 1600, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxWidth / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function AdminNewsTab({ isAdmin = true }: { isAdmin?: boolean }) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [publishedAt, setPublishedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadNews = () => {
    setLoading(true);
    fetch(NEWS_URL)
      .then((r) => r.json())
      .then((d) => setNews(d.news || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadNews(); }, []);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const newItems = await Promise.all(
      Array.from(files).map(async (file) => ({ file, preview: URL.createObjectURL(file) }))
    );
    setPhotos((prev) => [...prev, ...newItems]);
  };

  const removePhoto = (idx: number) => setPhotos((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !text.trim()) return;
    setSaving(true);
    try {
      const photosB64 = await Promise.all(photos.map((p) => compressAndConvert(p.file)));
      const res = await fetch(NEWS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, text, photos: photosB64, video_url: videoUrl, published_at: publishedAt }),
      });
      if (res.ok) {
        setTitle(""); setText(""); setVideoUrl("");
        setPublishedAt(new Date().toISOString().slice(0, 10));
        setPhotos([]); setSuccess(true); setShowForm(false);
        setTimeout(() => setSuccess(false), 3000);
        loadNews();
      }
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить новость?")) return;
    setDeleting(id);
    await fetch(`${NEWS_URL}?id=${id}`, { method: "DELETE" });
    setDeleting(null);
    loadNews();
  };

  const handleVkSync = async () => {
    setSyncing(true); setSyncResult(null);
    try {
      const res = await fetch(VK_SYNC_URL, { method: "POST" });
      const data = await res.json();
      setSyncResult(res.ok ? `Добавлено: ${data.added}, пропущено: ${data.skipped}` : `Ошибка: ${data.error || "неизвестная"}`);
      if (res.ok) loadNews();
    } catch { setSyncResult("Ошибка соединения"); }
    finally { setSyncing(false); setTimeout(() => setSyncResult(null), 5000); }
  };

  const handleExport = () => {
    const rows = [...news]
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
      .map((n) => ({
        date: n.published_at.slice(0, 10),
        title: n.title,
        text: n.text,
      }));
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `news-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const q = search.trim().toLowerCase();
  const filtered = q ? news.filter(n => `${n.title} ${n.text}`.toLowerCase().includes(q)) : news;
  const now = new Date();
  const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30);
  const thisYear = news.filter(n => new Date(n.published_at).getFullYear() === now.getFullYear()).length;
  const lastMonth = news.filter(n => new Date(n.published_at) >= monthAgo).length;
  const withPhotos = news.filter(n => n.photos.length > 0).length;
  const metrics = [
    { label: "Всего новостей", value: news.length, color: "text-slate-800", border: "border-slate-100" },
    { label: "За этот год", value: thisYear, color: "text-green-600", border: "border-green-100" },
    { label: "За 30 дней", value: lastMonth, color: "text-blue-600", border: "border-blue-100" },
    { label: "С фотографиями", value: withPhotos, color: "text-slate-700", border: "border-slate-100" },
  ];

  return (
    <div className="space-y-6 font-inter">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Новости</h1>
          <p className="text-sm text-slate-500 mt-1">Публикации на сайте организации и синхронизация с ВКонтакте</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {syncResult && <span className="text-xs text-slate-500">{syncResult}</span>}
          <button onClick={handleVkSync} disabled={syncing} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition text-sm font-medium flex items-center gap-2 shadow-sm disabled:opacity-60">
            <Icon name="RefreshCw" size={14} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Синхронизация..." : "Загрузить из ВК"}
          </button>
          <button onClick={handleExport} disabled={!news.length} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition text-sm font-medium flex items-center gap-2 shadow-sm disabled:opacity-60">
            <Icon name="Download" size={14} />
            Выгрузить
          </button>
          <button onClick={() => setShowForm(v => !v)} className="px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition text-sm font-medium flex items-center gap-2 shadow-sm">
            <Icon name={showForm ? "X" : "Plus"} size={16} /> {showForm ? "Закрыть" : "Добавить"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map(m => (
          <div key={m.label} className={`bg-white p-4 rounded-2xl border shadow-sm flex flex-col items-center justify-center ${m.border}`}>
            <span className={`text-2xl font-bold ${m.color}`}>{loading ? "—" : m.value}</span>
            <span className="text-xs text-slate-500 font-medium mt-1 text-center">{m.label}</span>
          </div>
        ))}
      </div>

      {showForm && (
  <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2">Заголовок *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Заголовок новости" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-300 focus:outline-none focus:border-indigo-400 bg-slate-50 text-sm" required />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2">Текст новости *</label>
            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Напишите текст новости..." rows={5} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-300 focus:outline-none focus:border-indigo-400 bg-slate-50 resize-y text-sm" required />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2">Видео (ВКонтакте / Rutube)</label>
              <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://vk.com/video..." className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-300 focus:outline-none focus:border-indigo-400 bg-slate-50 text-sm" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2">Дата публикации</label>
              <input type="date" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-indigo-400 bg-slate-50 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2">Фотографии</label>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
            {photos.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-3">
                {photos.map((p, idx) => (
                  <div key={idx} className="relative aspect-video rounded-lg overflow-hidden group">
                    <img src={p.preview} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removePhoto(idx)} className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Icon name="X" size={10} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-2 border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-xl px-5 py-3 text-slate-400 hover:text-slate-800 transition-colors w-full justify-center text-sm">
              <Icon name="ImagePlus" size={16} /> Добавить фото
            </button>
          </div>
          <button type="submit" disabled={saving} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors disabled:opacity-60">
            {saving ? "Публикуем..." : success ? "Опубликовано!" : "Опубликовать новость"}
          </button>
      </form>
      )}

      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center bg-slate-50 rounded-xl px-4 py-2 border border-slate-100 focus-within:border-indigo-300 transition">
          <Icon name="Search" size={15} className="text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по заголовку и тексту..." className="bg-transparent border-none outline-none text-sm text-slate-700 w-full ml-3 placeholder:text-slate-400" />
        </div>
      </div>

      <div>
        {loading ? (
          <div className="space-y-3">{[1, 2].map(i => <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse h-20" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Icon name="Newspaper" size={40} className="mx-auto mb-3 opacity-30" />
            <p>{search ? "Ничего не найдено" : "Новостей пока нет"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex gap-4 items-start transition-all hover:-translate-y-0.5 hover:shadow-md">
                {item.photos[0] && <img src={item.photos[0]} alt="" className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <time className="text-slate-400 text-xs">{formatDate(item.published_at)}</time>
                  <p className="font-semibold text-slate-800 text-sm mt-0.5 truncate">{item.title}</p>
                  <p className="text-slate-400 text-xs mt-1 line-clamp-2">{item.text}</p>
                </div>
                {isAdmin && (
                  <button onClick={() => handleDelete(item.id)} disabled={deleting === item.id} className="p-2 text-slate-300 hover:text-red-500 transition-colors flex-shrink-0">
                    <Icon name={deleting === item.id ? "Loader" : "Trash2"} size={16} className={deleting === item.id ? "animate-spin" : ""} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}