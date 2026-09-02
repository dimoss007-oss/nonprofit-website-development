import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { API } from "@/components/admin/crm/crmShared";

export default function AdminAiSettingsTab({ isAdmin, authLogin, authPassword }: { isAdmin: boolean; authLogin: string; authPassword: string }) {
  const [prompt, setPrompt] = useState("");
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(`${API}?view=ai_settings`);
        const d = await r.json();
        setPrompt(d.yandexgpt_system_prompt || "");
        setOriginalPrompt(d.yandexgpt_system_prompt || "");
      } finally {
        setLoading(false);
      }
    })();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="bg-white border border-beige-dark rounded-2xl p-8 text-center">
        <Icon name="Lock" size={32} className="text-ink/20 mx-auto mb-3" />
        <p className="text-ink/50 text-sm">Раздел доступен только администраторам</p>
      </div>
    );
  }

  const save = async () => {
    const text = prompt.trim();
    if (!text) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const r = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_ai_settings",
          auth_login: authLogin,
          auth_password: authPassword,
          yandexgpt_system_prompt: text,
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || "Не удалось сохранить промпт");
        return;
      }
      setOriginalPrompt(text);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = prompt.trim() !== originalPrompt.trim();

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-white border border-beige-dark rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Icon name="BrainCircuit" size={16} className="text-purple-500" />
          <h3 className="font-semibold text-ink text-sm uppercase tracking-wide">Системный промпт YandexGPT</h3>
        </div>
        <p className="text-xs text-ink/50 leading-relaxed">
          Эта инструкция передаётся нейросети перед каждым запросом на генерацию аналитической сводки по резиденту.
          Изменения применяются сразу — и к ручной генерации, и к ночному автообновлению.
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 border-2 border-ink border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={10}
            className="w-full border border-beige-dark rounded-xl px-4 py-3 text-sm text-ink placeholder-ink/30 focus:outline-none focus:border-ink transition-colors bg-beige/50 resize-y leading-relaxed"
            placeholder="Текст системного промпта..."
          />
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl">
            <Icon name="AlertCircle" size={14} />
            {error}
          </div>
        )}
        {saved && (
          <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 px-4 py-3 rounded-xl">
            <Icon name="CheckCircle2" size={14} />
            Промпт сохранён и уже применяется
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={() => setPrompt(originalPrompt)}
            disabled={!hasChanges || saving}
            className="px-4 py-2 text-sm rounded-lg border border-beige-dark hover:border-ink transition-colors disabled:opacity-40"
          >
            Отменить
          </button>
          <button
            onClick={save}
            disabled={!hasChanges || saving || loading}
            className="px-4 py-2 text-sm rounded-lg bg-ink text-beige hover:bg-ink/90 transition-colors disabled:opacity-60 flex items-center gap-1.5"
          >
            <Icon name={saving ? "Loader" : "Save"} size={14} className={saving ? "animate-spin" : ""} />
            {saving ? "Сохранение..." : "Сохранить промпт"}
          </button>
        </div>
      </div>
    </div>
  );
}
