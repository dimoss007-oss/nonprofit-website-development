import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { DonorType, Donation, fmt } from "./fundraising.types";

export function DonorPanel({ donorType, donorId, donorName, onClose, apiUrl }: {
  donorType: DonorType; donorId: number; donorName: string;
  onClose: () => void; apiUrl: string;
}) {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ amount: "", donated_at: new Date().toISOString().slice(0, 10), comment: "" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`${apiUrl}?type=donations&donor_type=${donorType}&donor_id=${donorId}`)
      .then(r => r.json())
      .then(d => setDonations(d.donations || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [donorId]);

  const addDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount) return;
    setSaving(true);
    await fetch(`${apiUrl}?type=donation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ donor_type: donorType, donor_id: donorId, ...form, amount: parseFloat(form.amount) }),
    });
    setForm({ amount: "", donated_at: new Date().toISOString().slice(0, 10), comment: "" });
    setSaving(false);
    load();
  };

  const deleteDonation = async (id: number) => {
    if (!confirm("Удалить запись о пожертвовании?")) return;
    await fetch(`${apiUrl}?type=donation&id=${id}`, { method: "DELETE" });
    load();
  };

  const total = donations.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4">
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-beige-dark">
          <div>
            <div className="font-semibold text-ink">{donorName}</div>
            <div className="text-xs text-ink/50">История пожертвований</div>
          </div>
          <button onClick={onClose} className="text-ink/40 hover:text-ink transition-colors">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {total > 0 && (
            <div className="bg-green-50 rounded-xl px-4 py-3 text-sm text-green-700 font-semibold">
              Итого: {fmt(total)}
            </div>
          )}

          <form onSubmit={addDonation} className="bg-beige/50 rounded-xl p-4 space-y-3">
            <div className="text-xs uppercase tracking-widest text-ink/50 font-medium">Добавить пожертвование</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-ink/50 mb-1">Сумма (₽) *</label>
                <input type="number" min="1" step="0.01" required
                  value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0"
                  className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-ink bg-white" />
              </div>
              <div>
                <label className="block text-xs text-ink/50 mb-1">Дата</label>
                <input type="date"
                  value={form.donated_at} onChange={e => setForm(f => ({ ...f, donated_at: e.target.value }))}
                  className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-ink bg-white" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-ink/50 mb-1">Комментарий</label>
              <input value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
                placeholder="Необязательно"
                className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-ink bg-white" />
            </div>
            <button type="submit" disabled={saving}
              className="w-full bg-ink text-beige py-2 rounded-lg text-sm font-semibold hover:bg-ink/90 transition-colors disabled:opacity-50">
              {saving ? "Сохраняем..." : "Добавить"}
            </button>
          </form>

          {loading ? (
            <div className="text-center py-6 text-ink/30 text-sm">Загружаем...</div>
          ) : donations.length === 0 ? (
            <div className="text-center py-6 text-ink/30 text-sm">Пожертвований пока нет</div>
          ) : (
            <div className="space-y-2">
              {donations.map(d => (
                <div key={d.id} className="flex items-center justify-between gap-3 py-2.5 border-b border-beige-dark/50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-green-700">{fmt(d.amount)}</div>
                    <div className="text-xs text-ink/40 mt-0.5">
                      {new Date(d.donated_at).toLocaleDateString("ru-RU")}
                      {d.comment && <> · {d.comment}</>}
                    </div>
                  </div>
                  <button onClick={() => deleteDonation(d.id)}
                    className="text-ink/25 hover:text-red-500 transition-colors flex-shrink-0">
                    <Icon name="Trash2" size={14} />
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
