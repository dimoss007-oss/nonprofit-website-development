import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { FILES_API, TaskFile, formatSize, fileIcon } from "./taskTypes";

export default function TaskFilesSection({ taskId, uploaderLogin }: { taskId: number; uploaderLogin: string }) {
  const [files, setFiles] = useState<TaskFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    fetch(`${FILES_API}?task_id=${taskId}`)
      .then(r => r.json())
      .then(d => setFiles(d.files || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [taskId]);

  const upload = async (file: File) => {
    setUploading(true);
    const data = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.readAsDataURL(file);
    });
    await fetch(FILES_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "upload",
        task_id: taskId,
        filename: file.name,
        content_type: file.type || "application/octet-stream",
        data,
        uploaded_by: uploaderLogin,
      }),
    });
    setUploading(false);
    load();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  };

  const handleDelete = async (id: number) => {
    await fetch(FILES_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", file_id: id }),
    });
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="border-t border-beige-dark mt-3 pt-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-ink/40 font-medium uppercase tracking-wider">Файлы</p>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1 text-xs text-ink/40 hover:text-ink transition-colors disabled:opacity-40"
        >
          <Icon name={uploading ? "Loader" : "Paperclip"} size={12} />
          {uploading ? "Загружаем..." : "Прикрепить"}
        </button>
        <input ref={inputRef} type="file" className="hidden" onChange={e => { if (e.target.files?.[0]) upload(e.target.files[0]); e.target.value = ""; }} />
      </div>

      {loading ? (
        <p className="text-xs text-ink/30">Загрузка...</p>
      ) : files.length === 0 ? (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          className="border border-dashed border-beige-dark rounded-xl py-3 text-center text-xs text-ink/25 cursor-pointer hover:border-ink/20 hover:text-ink/40 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          Перетащите файл или нажмите для выбора
        </div>
      ) : (
        <div className="space-y-1.5">
          {files.map(f => (
            <div key={f.id} className="flex items-center gap-2 group">
              <Icon name={fileIcon(f.filename)} size={13} className="text-ink/30 flex-shrink-0" />
              <a href={f.url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0 text-xs text-ink/70 hover:text-ink truncate transition-colors">
                {f.filename}
              </a>
              {f.size && <span className="text-[10px] text-ink/25 flex-shrink-0">{formatSize(f.size)}</span>}
              <button
                onClick={() => handleDelete(f.id)}
                className="opacity-0 group-hover:opacity-100 p-0.5 text-ink/20 hover:text-red-400 transition-all flex-shrink-0"
              >
                <Icon name="X" size={11} />
              </button>
            </div>
          ))}
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            className="text-[10px] text-ink/20 py-1 cursor-pointer hover:text-ink/40 transition-colors"
            onClick={() => inputRef.current?.click()}
          >
            + ещё файл
          </div>
        </div>
      )}
    </div>
  );
}
