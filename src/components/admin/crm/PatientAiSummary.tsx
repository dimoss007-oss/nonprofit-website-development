import { useState } from "react";
import Icon from "@/components/ui/icon";
import { API, AiSummary, fmtDateTime } from "@/components/admin/crm/crmShared";

export default function PatientAiSummary({ patientId, currentSummary, savedSummaries, onChanged }: { patientId: number; currentSummary?: string; savedSummaries: AiSummary[]; onChanged: () => void }) {
  const [saving, setSaving] = useState(false);

  const saveSummary = async () => {
    if (!currentSummary) return;
    setSaving(true);
    try {
      await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_local_summary", patient_id: patientId, summary_text: currentSummary }),
      });
      onChanged();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-beige-dark rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Icon name="Sparkles" size={16} className="text-purple-500" />
          <h3 className="font-semibold text-ink text-sm uppercase tracking-wide">Аналитическая сводка (за 7 дней)</h3>
        </div>
        <p className="text-sm text-ink/70 leading-relaxed whitespace-pre-wrap">
          {currentSummary || "Недостаточно данных для формирования сводки."}
        </p>
        <div className="flex justify-end">
          <button
            onClick={saveSummary}
            disabled={saving || !currentSummary}
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
              <p className="text-sm text-ink whitespace-pre-wrap mb-1">{s.summary_text}</p>
              <span className="text-xs text-ink/50">{fmtDateTime(s.created_at)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
