import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";

const GALLERY_URL = "https://functions.poehali.dev/abf6fa73-1b43-4ff7-af96-8b6e8ca2b46a";
const AUTH_URL = "https://functions.poehali.dev/a964c253-7e52-4d10-9000-b278238e84e4";
const LOGO_IMG = "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/4ca974da-fec3-4fd3-834d-c7dccc97fca9.jpg";
const SESSION_KEY = "admin_auth";

interface GalleryPhoto {
  id: number;
  title: string;
  photo_url: string;
  created_at: string;
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

function LoginScreen({ onAuth }: { onAuth: () => void }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });
      if (res.ok) {
        sessionStorage.setItem(SESSION_KEY, "1");
        onAuth();
      } else {
        setError("Неверный логин или пароль");
      }
    } catch {
      setError("Ошибка соединения. Попробуйте снова.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-beige-mid font-golos flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src={LOGO_IMG} alt="Спасение надежды" className="w-16 h-16 object-contain mx-auto mb-4" />
          <div className="font-cormorant text-ink text-2xl font-semibold">Спасение надежды</div>
          <div className="text-muted-foreground text-xs uppercase tracking-widest mt-1">Панель управления</div>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-sm p-8 shadow-sm space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-widest text-ink/50 mb-2">Логин</label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="Введите логин"
              autoComplete="username"
              className="w-full border border-beige-dark rounded-sm px-4 py-3 text-ink placeholder-ink/30 focus:outline-none focus:border-sage transition-colors bg-beige/50"
              required
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-ink/50 mb-2">Пароль</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                autoComplete="current-password"
                className="w-full border border-beige-dark rounded-sm px-4 py-3 pr-11 text-ink placeholder-ink/30 focus:outline-none focus:border-sage transition-colors bg-beige/50"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/60 transition-colors"
              >
                <Icon name={showPass ? "EyeOff" : "Eye"} size={16} />
              </button>
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm bg-red-50 px-4 py-3 rounded-sm">
              <Icon name="AlertCircle" size={14} />
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sage text-white py-3.5 rounded-sm font-golos font-semibold uppercase tracking-wider text-sm hover:bg-sage-dark transition-colors disabled:opacity-60"
          >
            {loading ? "Проверяем..." : "Войти"}
          </button>
        </form>
        <div className="text-center mt-6">
          <a href="/" className="text-ink/40 hover:text-ink/70 text-sm transition-colors">← На главную</a>
        </div>
      </div>
    </div>
  );
}

export default function AdminGallery() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [photoTitle, setPhotoTitle] = useState("");
  const [pendingFiles, setPendingFiles] = useState<{ file: File; preview: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [deleting, setDeleting] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadPhotos = () => {
    setLoading(true);
    fetch(GALLERY_URL)
      .then((r) => r.json())
      .then((d) => setPhotos(d.photos || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (authed) loadPhotos(); }, [authed]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const items = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPendingFiles((prev) => [...prev, ...items]);
  };

  const removeFile = (idx: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingFiles.length) return;
    setSaving(true);
    setSavedCount(0);
    try {
      for (const item of pendingFiles) {
        const b64 = await compressAndConvert(item.file);
        await fetch(GALLERY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photo: b64, title: photoTitle }),
        });
        setSavedCount((c) => c + 1);
      }
      setPhotoTitle("");
      setPendingFiles([]);
      loadPhotos();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить фото из галереи?")) return;
    setDeleting(id);
    await fetch(`${GALLERY_URL}?id=${id}`, { method: "DELETE" });
    setDeleting(null);
    loadPhotos();
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthed(false);
  };

  if (!authed) return <LoginScreen onAuth={() => setAuthed(true)} />;

  return (
    <div className="min-h-screen bg-beige-mid font-golos">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-beige/95 backdrop-blur-sm border-b border-beige-dark">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <img src={LOGO_IMG} alt="Спасение надежды" className="w-14 h-14 object-contain" />
            <div>
              <div className="font-cormorant text-ink text-lg font-semibold leading-none">Спасение надежды</div>
              <div className="text-muted-foreground text-[10px] uppercase tracking-wider">Управление галереей</div>
            </div>
          </a>
          <div className="flex items-center gap-4">
            <a href="/admin/news" className="text-sm text-ink/60 hover:text-ink transition-colors">
              Новости
            </a>
            <a href="/gallery" className="text-sm text-ink/60 hover:text-ink transition-colors">
              Просмотр галереи
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-ink/60 hover:text-ink text-sm transition-colors"
            >
              <Icon name="LogOut" size={14} />
              Выйти
            </button>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-20 max-w-5xl mx-auto px-6">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px w-8 bg-sage" />
            <span className="text-sage text-xs tracking-[0.2em] uppercase font-golos">Панель управления</span>
          </div>
          <h1 className="font-cormorant text-ink text-4xl font-semibold">Фотогалерея</h1>
        </div>

        {/* UPLOAD FORM */}
        <form onSubmit={handleSubmit} className="bg-white rounded-sm p-8 shadow-sm mb-12">
          <h2 className="font-cormorant text-ink text-2xl font-semibold mb-6">Добавить фотографии</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-widest text-ink/50 mb-2">Подпись ко всем фото (необязательно)</label>
              <input
                type="text"
                value={photoTitle}
                onChange={(e) => setPhotoTitle(e.target.value)}
                placeholder="Например: Летний лагерь 2024"
                className="w-full border border-beige-dark rounded-sm px-4 py-3 text-ink placeholder-ink/30 focus:outline-none focus:border-sage transition-colors bg-beige/50"
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
              {pendingFiles.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-4">
                  {pendingFiles.map((p, idx) => (
                    <div key={idx} className="relative aspect-square rounded-sm overflow-hidden group">
                      <img src={p.preview} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Icon name="X" size={12} className="text-white" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="aspect-square border-2 border-dashed border-beige-dark hover:border-sage rounded-sm flex flex-col items-center justify-center text-ink/40 hover:text-sage transition-colors gap-1"
                  >
                    <Icon name="Plus" size={20} />
                    <span className="text-xs">Ещё</span>
                  </button>
                </div>
              )}
              {pendingFiles.length === 0 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 border-2 border-dashed border-beige-dark hover:border-sage rounded-sm px-6 py-6 text-ink/50 hover:text-sage transition-colors w-full justify-center"
                >
                  <Icon name="ImagePlus" size={22} />
                  <span className="text-sm">Выбрать фотографии (можно несколько)</span>
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={saving || !pendingFiles.length}
              className="w-full bg-sage text-white py-4 rounded-sm font-golos font-semibold uppercase tracking-wider text-sm hover:bg-sage-dark transition-colors disabled:opacity-60"
            >
              {saving
                ? `Загружаем... ${savedCount}/${pendingFiles.length}`
                : `Загрузить ${pendingFiles.length > 0 ? `${pendingFiles.length} фото` : "фото"}`}
            </button>
          </div>
        </form>

        {/* GALLERY LIST */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-cormorant text-ink text-3xl font-semibold">
              В галерее
              {photos.length > 0 && <span className="text-muted-foreground text-xl font-light ml-2">({photos.length})</span>}
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square bg-beige-dark rounded-sm animate-pulse" />
              ))}
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-sm">
              <Icon name="Images" size={40} className="text-ink/20 mx-auto mb-3" />
              <p className="text-foreground/40">Фотографий пока нет</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
              {photos.map((p) => (
                <div key={p.id} className="relative aspect-square rounded-sm overflow-hidden group">
                  <img src={p.photo_url} alt={p.title || ""} className="w-full h-full object-cover" />
                  {p.title && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                      {p.title}
                    </div>
                  )}
                  <button
                    onClick={() => handleDelete(p.id)}
                    disabled={deleting === p.id}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all disabled:opacity-40"
                  >
                    <Icon name="Trash2" size={14} className="text-white" />
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
