import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";

const NEWS_URL = "https://functions.poehali.dev/b33c4df8-295a-4694-a485-e771aec3d9ce";
const LOGO_IMG = "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/4ca974da-fec3-4fd3-834d-c7dccc97fca9.jpg";

interface NewsItem {
  id: number;
  title: string;
  text: string;
  photos: string[];
  created_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AdminNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
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
      Array.from(files).map(async (file) => ({
        file,
        preview: URL.createObjectURL(file),
      }))
    );
    setPhotos((prev) => [...prev, ...newItems]);
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !text.trim()) return;
    setSaving(true);
    try {
      const photosB64 = await Promise.all(photos.map((p) => fileToBase64(p.file)));
      const res = await fetch(NEWS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, text, photos: photosB64 }),
      });
      if (res.ok) {
        setTitle("");
        setText("");
        setPhotos([]);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        loadNews();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить новость?")) return;
    setDeleting(id);
    await fetch(`${NEWS_URL}?id=${id}`, { method: "DELETE" });
    setDeleting(null);
    loadNews();
  };

  return (
    <div className="min-h-screen bg-beige-mid font-golos">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-beige/95 backdrop-blur-sm border-b border-beige-dark">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <img src={LOGO_IMG} alt="Спасение надежды" className="w-14 h-14 object-contain" />
            <div>
              <div className="font-cormorant text-ink text-lg font-semibold leading-none">Спасение надежды</div>
              <div className="text-muted-foreground text-[10px] uppercase tracking-wider">Управление новостями</div>
            </div>
          </a>
          <div className="flex items-center gap-4">
            <a href="/news" className="text-sm text-ink/60 hover:text-ink transition-colors">
              Просмотр новостей
            </a>
            <a href="/" className="flex items-center gap-2 text-ink/60 hover:text-ink text-sm transition-colors">
              <Icon name="ArrowLeft" size={14} />
              На главную
            </a>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-20 max-w-5xl mx-auto px-6">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px w-8 bg-sage" />
            <span className="text-sage text-xs tracking-[0.2em] uppercase font-golos">Панель управления</span>
          </div>
          <h1 className="font-cormorant text-ink text-4xl font-semibold">Добавить новость</h1>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="bg-white rounded-sm p-8 shadow-sm mb-12">
          <div className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-widest text-ink/50 mb-2">Заголовок *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Заголовок новости"
                className="w-full border border-beige-dark rounded-sm px-4 py-3 text-ink placeholder-ink/30 focus:outline-none focus:border-sage transition-colors bg-beige/50"
                required
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-ink/50 mb-2">Текст новости *</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Напишите текст новости..."
                rows={6}
                className="w-full border border-beige-dark rounded-sm px-4 py-3 text-ink placeholder-ink/30 focus:outline-none focus:border-sage transition-colors bg-beige/50 resize-y"
                required
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-ink/50 mb-3">Фотографии</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              {photos.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                  {photos.map((p, idx) => (
                    <div key={idx} className="relative aspect-video rounded-sm overflow-hidden group">
                      <img src={p.preview} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Icon name="X" size={12} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 border-2 border-dashed border-beige-dark hover:border-sage rounded-sm px-6 py-4 text-ink/50 hover:text-sage transition-colors w-full justify-center"
              >
                <Icon name="ImagePlus" size={18} />
                <span className="text-sm">Добавить фото</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-sage text-white py-4 rounded-sm font-golos font-semibold uppercase tracking-wider text-sm hover:bg-sage-dark transition-colors disabled:opacity-60"
            >
              {saving ? "Публикуем..." : success ? "Опубликовано!" : "Опубликовать новость"}
            </button>
          </div>
        </form>

        {/* NEWS LIST */}
        <div>
          <h2 className="font-cormorant text-ink text-3xl font-semibold mb-6">Опубликованные новости</h2>
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-sm p-6 animate-pulse">
                  <div className="h-4 bg-beige-dark rounded w-32 mb-3" />
                  <div className="h-6 bg-beige-dark rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : news.length === 0 ? (
            <p className="text-foreground/40 text-center py-12">Новостей пока нет</p>
          ) : (
            <div className="space-y-4">
              {news.map((item) => (
                <div key={item.id} className="bg-white rounded-sm p-6 shadow-sm flex gap-4 items-start">
                  {item.photos[0] && (
                    <img src={item.photos[0]} alt="" className="w-20 h-20 object-cover rounded-sm flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <time className="text-muted-foreground text-xs">{formatDate(item.created_at)}</time>
                    <h3 className="font-cormorant text-ink text-xl font-semibold mt-1 mb-1 truncate">{item.title}</h3>
                    <p className="text-foreground/60 text-sm line-clamp-2">{item.text}</p>
                    {item.photos.length > 1 && (
                      <span className="text-xs text-muted-foreground mt-1 inline-block">{item.photos.length} фото</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deleting === item.id}
                    className="flex-shrink-0 w-9 h-9 flex items-center justify-center text-destructive/50 hover:text-destructive hover:bg-red-50 rounded-sm transition-colors disabled:opacity-40"
                  >
                    <Icon name="Trash2" size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
