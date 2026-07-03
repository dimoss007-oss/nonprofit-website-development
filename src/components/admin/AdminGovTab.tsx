import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { GOV_API, Agency, AgreementStatus, ContactStatus } from "./govAgency.types";
import { AgencyCard, AgencyForm, ContactDraft } from "./GovAgencyCard";

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

  const save = async (data: Partial<Agency>, contact: ContactDraft) => {
    const res = await fetch(`${GOV_API}?type=agency`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!editAgency && contact.name.trim()) {
      const { id } = await res.json();
      await fetch(`${GOV_API}?type=contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agency_id: id, name: contact.name, phone: contact.phone, role: contact.role }),
      });
    }
    setShowForm(false);
    setEditAgency(null);
    load();
  };

  const setContactStatus = async (id: number, status: ContactStatus) => {
    await fetch(`${GOV_API}?type=set_contact_status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, contact_status: status }),
    });
    setAgencies(prev => prev.map(a => a.id === id ? { ...a, contact_status: status, has_contact: status === "has_contact" } : a));
  };

  const setAgreementStatus = async (id: number, status: AgreementStatus) => {
    await fetch(`${GOV_API}?type=set_agreement_status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, agreement_status: status }),
    });
    setAgencies(prev => prev.map(a => a.id === id ? { ...a, agreement_status: status } : a));
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

  const stats = {
    total: agencies.length,
    hasContact: agencies.filter(a => a.contact_status === "has_contact").length,
    noAnswer: agencies.filter(a => a.contact_status === "no_answer").length,
    noContact: agencies.filter(a => a.contact_status !== "has_contact" && a.contact_status !== "no_answer").length,
    sent: agencies.filter(a => a.agreement_status === "sent").length,
    signed: agencies.filter(a => a.agreement_status === "signed").length,
    rejected: agencies.filter(a => a.agreement_status === "rejected").length,
    noAgreement: agencies.filter(a => !a.agreement_status).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-ink">Госорганы</h2>
          <p className="text-xs text-ink/40 mt-0.5">{stats.total} {stats.total === 1 ? "орган" : stats.total < 5 ? "органа" : "органов"}</p>
        </div>
        <button
          onClick={() => { setEditAgency(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-ink text-beige px-4 py-2 rounded-xl text-sm font-semibold hover:bg-ink/90 transition-colors"
        >
          <Icon name="Plus" size={14} /> Добавить орган
        </button>
      </div>

      {agencies.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
            <p className="text-xs text-green-600 font-medium uppercase tracking-wider mb-1">Есть контакт</p>
            <p className="text-2xl font-bold text-green-700">{stats.hasContact}</p>
            <p className="text-xs text-green-500 mt-0.5">из {stats.total}</p>
          </div>
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
            <p className="text-xs text-orange-600 font-medium uppercase tracking-wider mb-1">Нет ответа</p>
            <p className="text-2xl font-bold text-orange-700">{stats.noAnswer}</p>
            <p className="text-xs text-orange-500 mt-0.5">органов</p>
          </div>
          <div className="bg-beige border border-beige-dark rounded-2xl p-4">
            <p className="text-xs text-ink/50 font-medium uppercase tracking-wider mb-1">Нет контакта</p>
            <p className="text-2xl font-bold text-ink">{stats.noContact}</p>
            <p className="text-xs text-ink/30 mt-0.5">органов</p>
          </div>
          <div className="bg-white border border-beige-dark rounded-2xl p-4 col-span-2">
            <p className="text-xs text-ink/50 font-medium uppercase tracking-wider mb-2">Соглашения</p>
            <div className="flex items-end gap-4">
              <div>
                <p className="text-xl font-bold text-blue-600">{stats.sent}</p>
                <p className="text-[10px] text-blue-400 mt-0.5">отправлено</p>
              </div>
              <div>
                <p className="text-xl font-bold text-green-600">{stats.signed}</p>
                <p className="text-[10px] text-green-400 mt-0.5">подписано</p>
              </div>
              <div>
                <p className="text-xl font-bold text-red-500">{stats.rejected}</p>
                <p className="text-[10px] text-red-400 mt-0.5">отклонено</p>
              </div>
              <div className="ml-auto">
                <p className="text-xl font-bold text-ink/30">{stats.noAgreement}</p>
                <p className="text-[10px] text-ink/20 mt-0.5">без статуса</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {(showForm || editAgency) && (
        <div className="bg-beige/60 rounded-2xl border border-beige-dark p-5">
          <h3 className="text-sm font-semibold text-ink mb-4">{editAgency ? "Редактировать орган" : "Новый госорган"}</h3>
          <AgencyForm
            initial={editAgency || undefined}
            onSave={save}
            onCancel={() => { setShowForm(false); setEditAgency(null); }}
            isEdit={!!editAgency}
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
            className="w-full border border-beige-dark rounded-xl pl-9 pr-4 py-2 text-sm text-ink focus:outline-none focus:border-ink bg-white"
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
              onContactStatusChange={setContactStatus}
              onAgreementChange={setAgreementStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}