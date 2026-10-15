import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { GALLERY_TAGS, tagLabel } from "@/lib/galleryTags";

const GALLERY_URL = "https://functions.poehali.dev/abf6fa73-1b43-4ff7-af96-8b6e8ca2b46a";

interface GalleryPhoto {
  id: number;
  title: string;
  photo_url: string;
  created_at: string;
  tags?: string[];
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

export default function AdminGalleryTab() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [photoTitle, setPhotoTitle] = useState("");
  const [pendingFiles, setPendingFiles] = useState<{ file: File; preview: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [dropZoneDrag, setDropZoneDrag] = useState(false);
  const [reordering, setReordering] = useState(false);
  const dragIdx = useRef<number | null>(null);
  const dragOverIdx = useRef<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadTags, setUploadTags] = useState<string[]>([]);
  const [filterTag, setFilterTag] = useState("all");
  const [selected, setSelected] = useState<number[]>([]);
  const [tagBusy, setTagBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const toggleUploadTag = (id: string) =>
    setUploadTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));

  const toggleSelect = (id: number) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

  const matchesFilter = (p: GalleryPhoto) =>
    filterTag === "all" || (filterTag === "none" ? !(p.tags || []).length : (p.tags || []).includes(filterTag));

  const applyTag = async (tag: string, mode: "add" | "remove") => {
    if (!selected.length) return;
    setTagBusy(true);
    await fetch(GALLERY_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selected, tags: [tag], mode }),
    });
    setTagBusy(false);
    loadPhotos();
  };

  const loadPhotos = () => {
    setLoading(true);
    fetch(GALLERY_URL)
      .then((r) => r.json())
      .then((d) => setPhotos(d.photos || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadPhotos(); }, []);

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
          body: JSON.stringify({ photo: b64, title: photoTitle, tags: uploadTags }),
        });
        setSavedCount((c) => c + 1);
      }
      setPhotoTitle("");
      setPendingFiles([]);
      setShowForm(false);
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

  // Drag & drop сортировка
  const handleDragStart = (idx: number) => {
    dragIdx.current = idx;
  };

  const handleDragEnter = (idx: number) => {
    if (dragIdx.current === null || dragIdx.current === idx) return;
    dragOverIdx.current = idx;
    setPhotos((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx.current!, 1);
      next.splice(idx, 0, moved);
      dragIdx.current = idx;
      return next;
    });
  };

  const handleDragEnd = async () => {
    dragIdx.current = null;
    dragOverIdx.current = null;
    setReordering(true);
    try {
      await fetch(GALLERY_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: photos.map((p) => p.id) }),
      });
    } finally {
      setReordering(false);
    }
  };

  const q = search.trim().toLowerCase();
  const matchesSearch = (p: GalleryPhoto) => !q || (p.title || "").toLowerCase().includes(q);
  const visible = photos.filter((p) => matchesFilter(p) && matchesSearch(p));
  const tagged = photos.filter((p) => (p.tags || []).length > 0).length;
  const metrics = [
    { label: "Всего фото", value: photos.length, color: "text-slate-800", border: "border-slate-100" },
    { label: "С метками", value: tagged, color: "text-green-600", border: "border-green-100" },
    { label: "Без метки", value: photos.length - tagged, color: photos.length - tagged > 0 ? "text-amber-600" : "text-slate-700", border: photos.length - tagged > 0 ? "border-amber-100" : "border-slate-100" },
    { label: "Выбрано", value: selected.length, color: "text-blue-600", border: "border-blue-100" },
  ];

  return (
    <div className="space-y-6 font-inter">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Галерея</h1>
          <p className="text-sm text-slate-500 mt-1">Фотографии для сайта: загрузка, метки и порядок показа</p>
        </div>
        <div className="flex items-center gap-3">
          {reordering && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Icon name="Loader2" size={12} className="animate-spin" /> Сохраняем порядок...
            </span>
          )}
          <button onClick={loadPhotos} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition text-sm font-medium flex items-center gap-2 shadow-sm">
            <Icon name="RefreshCw" size={14} /> Обновить
          </button>
          <button onClick={() => setShowForm((v) => !v)} className="px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition text-sm font-medium flex items-center gap-2 shadow-sm">
            <Icon name={showForm ? "X" : "Plus"} size={16} /> {showForm ? "Закрыть" : "Добавить фото"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className={`bg-white p-4 rounded-2xl border shadow-sm flex flex-col items-center justify-center ${m.border}`}>
            <span className={`text-2xl font-bold ${m.color}`}>{loading ? "—" : m.value}</span>
            <span className="text-xs text-slate-500 font-medium mt-1 text-center">{m.label}</span>
          </div>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div>
            <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2">Подпись (необязательно)</label>
            <input
              type="text"
              value={photoTitle}
              onChange={(e) => setPhotoTitle(e.target.value)}
              placeholder="Описание фотографий"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 transition-colors bg-slate-50 text-sm"
            />
          </div>

          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dropZoneDrag ? "border-indigo-400 bg-indigo-50" : "border-slate-200 hover:border-indigo-300"}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDropZoneDrag(true); }}
            onDragLeave={() => setDropZoneDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDropZoneDrag(false); handleFiles(e.dataTransfer.files); }}
          >
            <Icon name="ImagePlus" size={32} className="mx-auto text-slate-400 mb-3" />
            <div className="text-sm text-slate-500">Перетащите фото сюда или <span className="text-indigo-600 underline">выберите файлы</span></div>
            <div className="text-xs text-slate-400 mt-1">JPG, PNG, WEBP — несколько файлов сразу</div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {pendingFiles.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {pendingFiles.map((item, idx) => (
                <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100">
                  <img src={item.preview} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Icon name="X" size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2">Метки (где показывать на сайте)</label>
            <div className="flex flex-wrap gap-2">
              {GALLERY_TAGS.map((t) => (
                <button key={t.id} type="button" onClick={() => toggleUploadTag(t.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${uploadTags.includes(t.id) ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"}`}>
                  #{t.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || pendingFiles.length === 0}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors disabled:opacity-40"
          >
            {saving
              ? `Загружаем ${savedCount}/${pendingFiles.length + savedCount}...`
              : `Загрузить ${pendingFiles.length > 0 ? `${pendingFiles.length} фото` : "фото"}`}
          </button>
        </form>
      )}

      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center bg-slate-50 rounded-xl px-4 py-2 border border-slate-100 focus-within:border-indigo-300 transition">
          <Icon name="Search" size={15} className="text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по подписи фото..." className="bg-transparent border-none outline-none text-sm text-slate-700 w-full ml-3 placeholder:text-slate-400" />
        </div>
      </div>

      <div className="space-y-4">
        {photos.length > 1 && !loading && (
          <p className="text-xs text-slate-400 mb-4 flex items-center gap-1.5">
            <Icon name="GripVertical" size={13} />
            Перетащите фото чтобы изменить порядок
          </p>
        )}

        {!loading && photos.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {[{ id: "all", label: "Все" }, ...GALLERY_TAGS, { id: "none", label: "Без метки" }].map((t) => (
              <button key={t.id} onClick={() => setFilterTag(t.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${filterTag === t.id ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"}`}>
                {t.id === "all" || t.id === "none" ? t.label : `#${t.label}`}
              </button>
            ))}
            <button
              onClick={() => setSelected(visible.map((p) => p.id))}
              className="ml-auto text-xs text-indigo-600 underline"
            >
              Выбрать все показанные
            </button>
          </div>
        )}

        {selected.length > 0 && (
          <div className="sticky top-2 z-20 bg-white border border-indigo-200 rounded-2xl shadow-lg p-4 mb-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate-800 font-medium">Выбрано фото: {selected.length}</p>
              <button onClick={() => setSelected([])} className="text-xs text-slate-400 underline">Снять выбор</button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">Добавить метку:</span>
              {GALLERY_TAGS.map((t) => (
                <button key={t.id} disabled={tagBusy} onClick={() => applyTag(t.id, "add")}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50">+ #{t.label}</button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">Убрать метку:</span>
              {GALLERY_TAGS.map((t) => (
                <button key={t.id} disabled={tagBusy} onClick={() => applyTag(t.id, "remove")}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border border-red-300 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">− #{t.label}</button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-300">
            <Icon name="Loader2" size={24} className="animate-spin mr-3" />
            Загружаем...
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Icon name="ImageOff" size={40} className="mx-auto mb-3 opacity-30" />
            <div className="text-sm">Галерея пуста</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {photos.map((photo, idx) => matchesFilter(photo) && matchesSearch(photo) && (
              <div
                key={photo.id}
                draggable={filterTag === "all"}
                onDragStart={() => handleDragStart(idx)}
                onDragEnter={() => handleDragEnter(idx)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className={`relative group aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 shadow-sm hover:shadow-md transition-shadow select-none ${selected.includes(photo.id) ? "ring-4 ring-indigo-500" : ""} ${filterTag === "all" ? "cursor-grab active:cursor-grabbing" : ""}`}
              >
                <img src={photo.photo_url} alt={photo.title} className="w-full h-full object-cover pointer-events-none" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />

                <button
                  type="button"
                  onClick={() => toggleSelect(photo.id)}
                  aria-label="Выбрать фото"
                  className={`absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors ${selected.includes(photo.id) ? "bg-indigo-600 border-indigo-600" : "bg-black/40 border-white"}`}
                >
                  {selected.includes(photo.id) && <Icon name="Check" size={14} className="text-white" />}
                </button>

                {(photo.tags || []).length > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 p-1.5 flex flex-wrap gap-1 bg-gradient-to-t from-black/70 to-transparent">
                    {(photo.tags || []).map((t) => (
                      <span key={t} className="text-[10px] leading-none px-1.5 py-1 rounded-full bg-white/90 text-slate-800">#{tagLabel(t)}</span>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => handleDelete(photo.id)}
                  disabled={deleting === photo.id}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                  title="Удалить"
                >
                  {deleting === photo.id
                    ? <Icon name="Loader2" size={13} className="animate-spin" />
                    : <Icon name="Trash2" size={13} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
