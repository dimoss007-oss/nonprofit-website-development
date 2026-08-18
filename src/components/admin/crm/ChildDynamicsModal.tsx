import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { API, ChildAiSummary, fmtDateTime } from "@/components/admin/crm/crmShared";

export default function ChildDynamicsModal({ childId, childName, open, onClose }: { childId: number; childName: string; open: boolean; onClose: () => void }) {
  const [summaries, setSummaries] = useState<ChildAiSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}?child_id=${childId}`);
      const d = await r.json();
      setSummaries(d.summaries || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (open) load(); }, [open, childId]);

  const generate = async () => {
    setGenerating(true);
    try {
      const r = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate_child_summary", child_id: childId }),
      });
      const d = await r.json();
      setDraft(d.summary || "");
    } finally {
      setGenerating(false);
    }
  };

  const save = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_child_summary", child_id: childId, summary_text: draft }),
      });
      setDraft("");
      await load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setDraft(""); onClose(); } }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-cormorant text-xl">Динамика — {childName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-beige-mid rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="Sparkles" size={16} className="text-purple-500" />
                <p className="text-sm font-semibold text-ink">ИИ-сводка за 7 дней</p>
              </div>
              <button
                onClick={generate}
                disabled={generating}
                className="text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-beige-dark hover:border-ink transition-colors disabled:opacity-60"
              >
                <Icon name={generating ? "Loader" : "WandSparkles"} size={14} className={generating ? "animate-spin" : ""} />
                {generating ? "Формирование..." : "Сформировать ИИ-сводку за 7 дней"}
              </button>
            </div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={6}
              placeholder="Нажмите «Сформировать ИИ-сводку», затем при необходимости отредактируйте текст перед сохранением..."
              className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-ink resize-none"
            />
            <div className="flex justify-end">
              <button
                onClick={save}
                disabled={saving || !draft.trim()}
                className="px-4 py-2 text-sm rounded-lg bg-ink text-beige hover:bg-ink/90 transition-colors disabled:opacity-60 flex items-center gap-1.5"
              >
                <Icon name={saving ? "Loader" : "Save"} size={14} className={saving ? "animate-spin" : ""} />
                {saving ? "Сохранение..." : "Сохранить в архив"}
              </button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-ink text-sm uppercase tracking-wide mb-3">История сводок ({summaries.length})</h3>
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-ink border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!loading && summaries.length === 0 && <p className="text-ink/40 text-sm py-4 text-center">Пока нет сохранённых сводок</p>}
            {!loading && summaries.length > 0 && (
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {summaries.map((s) => (
                  <div key={s.id} className="rounded-xl p-3 bg-beige-mid">
                    <p className="text-sm text-ink whitespace-pre-wrap mb-1">{s.summary_text}</p>
                    <span className="text-xs text-ink/50">{fmtDateTime(s.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}