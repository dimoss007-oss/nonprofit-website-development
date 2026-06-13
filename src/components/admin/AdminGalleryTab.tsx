import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";

const GALLERY_URL = "https://functions.poehali.dev/abf6fa73-1b43-4ff7-af96-8b6e8ca2b46a";

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

  return (
    <div className="space-y-8">
      {/* Загрузка фото */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="font-cormorant text-xl font-semibold text-ink mb-5">Добавить фотографии</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-widest text-ink/50 mb-2">Подпись (необязательно)</label>
            <input
              type="text"
              value={photoTitle}
              onChange={(e) => setPhotoTitle(e.target.value)}
              placeholder="Описание фотографий"
              className="w-full border border-beige-dark rounded-xl px-4 py-3 text-ink placeholder-ink/30 focus:outline-none focus:border-ink transition-colors bg-beige/50 text-sm"
            />
          </div>

          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dropZoneDrag ? "border-ink bg-beige/60" : "border-beige-dark hover:border-ink/40"}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDropZoneDrag(true); }}
            onDragLeave={() => setDropZoneDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDropZoneDrag(false); handleFiles(e.dataTransfer.files); }}
          >
            <Icon name="ImagePlus" size={32} className="mx-auto text-ink/30 mb-3" />
            <div className="text-sm text-ink/50">Перетащите фото сюда или <span className="text-ink underline">выберите файлы</span></div>
            <div className="text-xs text-ink/30 mt-1">JPG, PNG, WEBP — несколько файлов сразу</div>
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
                <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden bg-beige-mid">
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

          <button
            type="submit"
            disabled={saving || pendingFiles.length === 0}
            className="w-full bg-ink text-beige py-3 rounded-xl font-semibold text-sm hover:bg-ink/90 transition-colors disabled:opacity-40"
          >
            {saving
              ? `Загружаем ${savedCount}/${pendingFiles.length + savedCount}...`
              : `Загрузить ${pendingFiles.length > 0 ? `${pendingFiles.length} фото` : "фото"}`}
          </button>
        </form>
      </div>

      {/* Список фото с drag & drop */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-cormorant text-xl font-semibold text-ink">
            Фотографии в галерее {!loading && <span className="text-ink/40 text-base font-normal">({photos.length})</span>}
          </h2>
          <div className="flex items-center gap-3">
            {reordering && (
              <span className="text-xs text-ink/40 flex items-center gap-1">
                <Icon name="Loader2" size={12} className="animate-spin" /> Сохраняем порядок...
              </span>
            )}
            <button onClick={loadPhotos} className="text-ink/40 hover:text-ink transition-colors" title="Обновить">
              <Icon name="RefreshCw" size={16} />
            </button>
          </div>
        </div>

        {photos.length > 1 && !loading && (
          <p className="text-xs text-ink/40 mb-4 flex items-center gap-1.5">
            <Icon name="GripVertical" size={13} />
            Перетащите фото чтобы изменить порядок
          </p>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-ink/30">
            <Icon name="Loader2" size={24} className="animate-spin mr-3" />
            Загружаем...
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-16 text-ink/30">
            <Icon name="ImageOff" size={40} className="mx-auto mb-3" />
            <div className="text-sm">Галерея пуста</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {photos.map((photo, idx) => (
              <div
                key={photo.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragEnter={() => handleDragEnter(idx)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className="relative group aspect-square rounded-xl overflow-hidden bg-beige-mid cursor-grab active:cursor-grabbing select-none transition-transform active:scale-95"
              >
                <img src={photo.photo_url} alt={photo.title} className="w-full h-full object-cover pointer-events-none" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />

                {/* Иконка перетаскивания */}
                <div className="absolute top-2 left-2 bg-black/50 text-white rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Icon name="GripVertical" size={13} />
                </div>

                {photo.title && (
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="text-white text-xs truncate">{photo.title}</div>
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
