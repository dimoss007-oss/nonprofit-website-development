import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";

const NEWS_URL = "https://functions.poehali.dev/b33c4df8-295a-4694-a485-e771aec3d9ce";
const VK_SYNC_URL = "https://functions.poehali.dev/ce64965a-09e0-411a-bbed-d25e01b5c170";

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
        setPhotos([]); setSuccess(true);
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="font-cormorant text-ink text-2xl font-semibold">Добавить новость</h2>
        <div className="flex items-center gap-3">
          {syncResult && <span className="text-xs text-ink/60">{syncResult}</span>}
          <button onClick={handleVkSync} disabled={syncing} className="flex items-center gap-2 text-sm bg-[#4a76a8] text-white px-4 py-2 rounded-lg hover:bg-[#3d6491] transition-colors disabled:opacity-60">
            <Icon name="RefreshCw" size={14} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Синхронизация..." : "Загрузить из ВК"}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-beige-dark p-6 space-y-5">
        <div>
          <label className="block text-xs uppercase tracking-widest text-ink/50 mb-2">Заголовок *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Заголовок новости" className="w-full border border-beige-dark rounded-lg px-4 py-2.5 text-ink placeholder-ink/30 focus:outline-none focus:border-ink bg-beige/50 text-sm" required />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-ink/50 mb-2">Текст новости *</label>
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Напишите текст новости..." rows={5} className="w-full border border-beige-dark rounded-lg px-4 py-2.5 text-ink placeholder-ink/30 focus:outline-none focus:border-ink bg-beige/50 resize-y text-sm" required />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-ink/50 mb-2">Видео (ВКонтакте / Rutube)</label>
            <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://vk.com/video..." className="w-full border border-beige-dark rounded-lg px-4 py-2.5 text-ink placeholder-ink/30 focus:outline-none focus:border-ink bg-beige/50 text-sm" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-ink/50 mb-2">Дата публикации</label>
            <input type="date" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} className="w-full border border-beige-dark rounded-lg px-4 py-2.5 text-ink focus:outline-none focus:border-ink bg-beige/50 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-ink/50 mb-2">Фотографии</label>
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
          <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-2 border-2 border-dashed border-beige-dark hover:border-ink rounded-lg px-5 py-3 text-ink/50 hover:text-ink transition-colors w-full justify-center text-sm">
            <Icon name="ImagePlus" size={16} /> Добавить фото
          </button>
        </div>
        <button type="submit" disabled={saving} className="w-full bg-ink text-beige py-3 rounded-lg font-semibold text-sm hover:bg-ink/90 transition-colors disabled:opacity-60">
          {saving ? "Публикуем..." : success ? "Опубликовано!" : "Опубликовать новость"}
        </button>
      </form>

      <div>
        <h3 className="font-cormorant text-ink text-xl font-semibold mb-4">Опубликованные новости ({news.length})</h3>
        {loading ? (
          <div className="space-y-3">{[1, 2].map(i => <div key={i} className="bg-white rounded-xl border border-beige-dark p-5 animate-pulse h-20" />)}</div>
        ) : news.length === 0 ? (
          <p className="text-ink/40 text-center py-10">Новостей пока нет</p>
        ) : (
          <div className="space-y-3">
            {news.map((item) => (
              <div key={item.id} className="bg-white rounded-xl border border-beige-dark p-5 flex gap-4 items-start">
                {item.photos[0] && <img src={item.photos[0]} alt="" className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <time className="text-ink/40 text-xs">{formatDate(item.published_at)}</time>
                  <p className="font-semibold text-ink text-sm mt-0.5 truncate">{item.title}</p>
                  <p className="text-ink/50 text-xs mt-1 line-clamp-2">{item.text}</p>
                </div>
                {isAdmin && (
                  <button onClick={() => handleDelete(item.id)} disabled={deleting === item.id} className="p-2 text-ink/30 hover:text-red-400 transition-colors flex-shrink-0">
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