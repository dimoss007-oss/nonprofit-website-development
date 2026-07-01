import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { GOV_API, Agency } from "./govAgency.types";
import { AgencyCard, AgencyForm } from "./GovAgencyCard";

export default function AdminGovTab() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editAgency, setEditAgency] = useState<Agency | null>(null);
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    fetch(`${GOV_API}?type=agencies`)
      .then(r => r.json())
      .then(d => setAgencies(d.agencies || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const save = async (data: Partial<Agency>) => {
    await fetch(`${GOV_API}?type=agency`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setShowForm(false);
    setEditAgency(null);
    load();
  };

  const toggleContact = async (id: number, value: boolean) => {
    await fetch(`${GOV_API}?type=toggle_contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, has_contact: value }),
    });
    setAgencies(prev => prev.map(a => a.id === id ? { ...a, has_contact: value } : a));
  };

  const archive = async (id: number) => {
    if (!confirm("Удалить госорган?")) return;
    await fetch(`${GOV_API}?type=archive_agency`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  };

  const filtered = agencies.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.address || "").toLowerCase().includes(search.toLowerCase()) ||
    (a.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-ink">Госорганы</h2>
          <p className="text-xs text-ink/40 mt-0.5">{agencies.length} {agencies.length === 1 ? "орган" : agencies.length < 5 ? "органа" : "органов"}</p>
        </div>
        <button
          onClick={() => { setEditAgency(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-ink text-beige px-4 py-2 rounded-xl text-sm font-semibold hover:bg-ink/90 transition-colors"
        >
          <Icon name="Plus" size={14} /> Добавить орган
        </button>
      </div>

      {(showForm || editAgency) && (
        <div className="bg-beige/60 rounded-2xl border border-beige-dark p-5">
          <h3 className="text-sm font-semibold text-ink mb-4">{editAgency ? "Редактировать орган" : "Новый госорган"}</h3>
          <AgencyForm
            initial={editAgency || undefined}
            onSave={save}
            onCancel={() => { setShowForm(false); setEditAgency(null); }}
          />
        </div>
      )}

      {agencies.length > 0 && (
        <div className="relative">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по названию, адресу, email..."
            className="w-full border border-beige-dark rounded-xl pl-9 pr-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink bg-white"
          />
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-ink/30">Загрузка...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-ink/30">
          {search ? "Ничего не найдено" : "Госорганов пока нет — добавьте первый"}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map(a => (
            <AgencyCard
              key={a.id}
              agency={a}
              onEdit={ag => { setEditAgency(ag); setShowForm(false); }}
              onArchive={archive}
              onToggleContact={toggleContact}
            />
          ))}
        </div>
      )}
    </div>
  );
}