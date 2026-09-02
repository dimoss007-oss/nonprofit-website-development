import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { API, AiSummary, fmtDateTime } from "@/components/admin/crm/crmShared";

const PERIODS = [
  { value: 7, label: "7 дней" },
  { value: 14, label: "14 дней" },
  { value: 30, label: "30 дней" },
];

type Source = "rule_based" | "yandex_gpt";

const SOURCES: { value: Source; label: string; icon: string }[] = [
  { value: "rule_based", label: "Алгоритм", icon: "ListChecks" },
  { value: "yandex_gpt", label: "YandexGPT Pro", icon: "Sparkles" },
];

type TextSummary = { summary_text: string; counts?: { red: number; yellow: number; green: number }; days: number };

function renderMarkdownLine(line: string, key: number) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p key={key} className="text-sm text-ink/80 leading-relaxed">
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <span key={i} className="font-semibold text-ink">{part.slice(2, -2)}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}

function MarkdownText({ text }: { text: string }) {
  return <div className="space-y-2">{text.split("\n\n").filter(Boolean).map((line, i) => renderMarkdownLine(line, i))}</div>;
}

export default function PatientAiSummary({ patientId, currentSummary, savedSummaries, onChanged }: { patientId: number; currentSummary?: string; savedSummaries: AiSummary[]; onChanged: () => void }) {
  const [saving, setSaving] = useState(false);
  const [days, setDays] = useState(7);
  const [source, setSource] = useState<Source>("rule_based");
  const [textSummary, setTextSummary] = useState<TextSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const loadSummary = async (period: number, src: Source) => {
    setLoadingSummary(true);
    setTextSummary(null);
    try {
      const view = src === "yandex_gpt" ? "yandex_summary" : "text_summary";
      const r = await fetch(`${API}?id=${patientId}&view=${view}&days=${period}`);
      const d = await r.json();
      if (d.summary_text) setTextSummary(d);
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => { loadSummary(days, source); }, [patientId, days, source]);

  const saveSummary = async () => {
    const text = textSummary?.summary_text || currentSummary;
    if (!text) return;
    setSaving(true);
    try {
      await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_local_summary", patient_id: patientId, summary_text: text, source }),
      });
      onChanged();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-beige-dark rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Icon name="Sparkles" size={16} className="text-purple-500" />
            <h3 className="font-semibold text-ink text-sm uppercase tracking-wide">Аналитическая сводка</h3>
          </div>
          <div className="flex items-center gap-1 bg-beige-mid rounded-lg p-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setDays(p.value)}
                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${days === p.value ? "bg-white text-ink shadow-sm" : "text-ink/50 hover:text-ink"}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1 bg-beige-mid rounded-lg p-1 w-fit">
          {SOURCES.map((s) => (
            <button
              key={s.value}
              onClick={() => setSource(s.value)}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors flex items-center gap-1.5 ${source === s.value ? "bg-white text-ink shadow-sm" : "text-ink/50 hover:text-ink"}`}
            >
              <Icon name={s.icon} size={13} />
              {s.label}
            </button>
          ))}
        </div>

        {textSummary?.counts && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-green-100 text-green-700">🟢 {textSummary.counts.green}</span>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-amber-100 text-amber-700">🟡 {textSummary.counts.yellow}</span>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-red-100 text-red-700">🔴 {textSummary.counts.red}</span>
          </div>
        )}

        {loadingSummary ? (
          <div className="flex items-center justify-center py-6">
            <div className="w-5 h-5 border-2 border-ink border-t-transparent rounded-full animate-spin" />
          </div>
        ) : textSummary ? (
          <MarkdownText text={textSummary.summary_text} />
        ) : (
          <p className="text-sm text-ink/70 leading-relaxed whitespace-pre-wrap">
            {currentSummary || "Недостаточно данных для формирования сводки."}
          </p>
        )}

        <div className="flex justify-between items-center">
          <button
            onClick={() => loadSummary(days, source)}
            disabled={loadingSummary}
            className="px-4 py-2 text-sm rounded-lg border border-beige-dark hover:border-ink transition-colors disabled:opacity-60 flex items-center gap-1.5"
          >
            <Icon name="RefreshCw" size={14} className={loadingSummary ? "animate-spin" : ""} />
            Сформировать выжимку
          </button>
          <button
            onClick={saveSummary}
            disabled={saving || (!textSummary?.summary_text && !currentSummary)}
            className="px-4 py-2 text-sm rounded-lg bg-ink text-beige hover:bg-ink/90 transition-colors disabled:opacity-60 flex items-center gap-1.5"
          >
            <Icon name={saving ? "Loader" : "Save"} size={14} className={saving ? "animate-spin" : ""} />
            {saving ? "Сохранение..." : "Сохранить в историю"}
          </button>
        </div>
      </div>

      <div className="bg-white border border-beige-dark rounded-2xl p-5">
        <h3 className="font-semibold text-ink text-sm uppercase tracking-wide mb-3">История сводок ({savedSummaries.length})</h3>
        {savedSummaries.length === 0 && <p className="text-ink/40 text-sm">Пока нет сохранённых сводок</p>}
        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
          {savedSummaries.map(s => (
            <div key={s.id} className="rounded-xl p-3 bg-beige-mid">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-sm text-ink whitespace-pre-wrap flex-1">{s.summary_text}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink/50">{fmtDateTime(s.created_at)}</span>
                {s.source === "yandex_gpt" && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">YandexGPT</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
