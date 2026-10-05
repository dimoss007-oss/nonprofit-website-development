import { useState } from "react";
import Icon from "@/components/ui/icon";

const CONTRACT_API = "https://functions.poehali.dev/f031009a-8971-49ec-8e6e-2c84ce422d80";

export default function ContractButton({ patientId, defaultDate }: { patientId: number; defaultDate?: string }) {
  const [open, setOpen] = useState(false);
  const [number, setNumber] = useState("");
  const [date, setDate] = useState(() => (defaultDate || new Date().toISOString()).slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = async () => {
    if (!number.trim()) { setError("Укажите номер договора"); return; }
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(CONTRACT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: patientId, contract_number: number.trim(), contract_date: date }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Не удалось сформировать договор"); return; }
      const bytes = Uint8Array.from(atob(d.file_base64), (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: d.content_type }));
      const a = document.createElement("a");
      a.href = url; a.download = d.file_name; a.click();
      URL.revokeObjectURL(url);
      setOpen(false);
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="px-3 py-1.5 text-sm border border-beige-dark rounded-lg hover:border-ink transition-colors flex items-center gap-1.5">
        <Icon name="FileText" size={14} /> Договор (Word)
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 z-20 w-72 bg-white border border-beige-dark rounded-xl shadow-lg p-4 space-y-3">
          <div>
            <label className="block text-xs uppercase tracking-widest text-ink/50 mb-1.5">Номер договора</label>
            <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="например, 07/07" className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm text-ink bg-beige/50 focus:outline-none focus:border-ink" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-ink/50 mb-1.5">Дата заключения</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm text-ink bg-beige/50 focus:outline-none focus:border-ink" />
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <button onClick={download} disabled={loading} className="w-full flex items-center justify-center gap-2 bg-ink text-beige py-2 rounded-lg text-sm font-semibold hover:bg-ink/90 transition-colors disabled:opacity-60">
            <Icon name={loading ? "Loader" : "Download"} size={14} className={loading ? "animate-spin" : ""} />
            {loading ? "Формирую..." : "Скачать договор"}
          </button>
        </div>
      )}
    </div>
  );
}
