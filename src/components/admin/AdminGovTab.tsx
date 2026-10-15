import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { GOV_API, Agency, AgreementStatus, ContactStatus } from "./govAgency.types";
import { AgencyCard, AgencyForm, ContactDraft } from "./GovAgencyCard";

export default function AdminGovTab({ focusAgencyId, onFocusHandled, users = [] }: { focusAgencyId?: number | null; onFocusHandled?: () => void; users?: { login: string; full_name?: string }[] } = {}) {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editAgency, setEditAgency] = useState<Agency | null>(null);
  const [search, setSearch] = useState("");
  const [contactFilter, setContactFilter] = useState<ContactStatus | "all">("all");

  const load = () => {
    setLoading(true);
    fetch(`${GOV_API}?type=agencies`)
      .then(r => r.json())
      .then(d => setAgencies(d.agencies || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!focusAgencyId) return;
    setContactFilter("all");
    setSearch("");
  }, [focusAgencyId]);

  useEffect(() => {
    if (!focusAgencyId || loading) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(`agency-${focusAgencyId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-indigo-300");
        setTimeout(() => el.classList.remove("ring-2", "ring-indigo-300"), 2500);
        onFocusHandled?.();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [focusAgencyId, loading, agencies, contactFilter, search]);

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

  const filtered = agencies.filter(a => {
    const matchesSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.address || "").toLowerCase().includes(search.toLowerCase()) ||
      (a.email || "").toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (contactFilter === "all") return true;
    if (contactFilter === "no_contact") return a.contact_status !== "has_contact" && a.contact_status !== "no_answer";
    return a.contact_status === contactFilter;
  });

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

  const metrics = [
    { id: "has_contact" as const, label: "Есть контакт", value: stats.hasContact, color: "text-green-600", border: "border-green-100", hover: "hover:bg-green-50" },
    { id: "no_answer" as const, label: "Нет ответа", value: stats.noAnswer, color: "text-amber-600", border: "border-amber-100", hover: "hover:bg-amber-50" },
    { id: "no_contact" as const, label: "Нет контакта", value: stats.noContact, color: "text-slate-700", border: "border-slate-100", hover: "hover:bg-slate-50" },
  ];

  return (
    <div className="space-y-6 font-inter">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Госорганы</h1>
          <p className="text-sm text-slate-500 mt-1">Контакты и соглашения с государственными органами · всего {stats.total}</p>
        </div>
        <button
          onClick={() => { setEditAgency(null); setShowForm(true); }}
          className="px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition text-sm font-medium flex items-center gap-2 shadow-sm"
        >
          <Icon name="Plus" size={16} /> Добавить орган
        </button>
      </div>

      {agencies.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {metrics.map(m => (
            <button
              key={m.id}
              onClick={() => setContactFilter(f => f === m.id ? "all" : m.id)}
              className={`bg-white p-4 rounded-2xl border shadow-sm flex flex-col items-center justify-center transition ${m.border} ${m.hover} ${contactFilter === m.id ? "ring-2 ring-offset-1 ring-indigo-300" : ""}`}
            >
              <span className={`text-2xl font-bold ${m.color}`}>{m.value}</span>
              <span className="text-xs text-slate-500 font-medium mt-1">{m.label}</span>
            </button>
          ))}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm col-span-2">
            <p className="text-xs text-slate-500 font-medium text-center mb-2">Соглашения</p>
            <div className="flex items-end justify-around gap-2">
              <div className="text-center"><p className="text-xl font-bold text-blue-600">{stats.sent}</p><p className="text-[10px] text-slate-400">отправлено</p></div>
              <div className="text-center"><p className="text-xl font-bold text-green-600">{stats.signed}</p><p className="text-[10px] text-slate-400">подписано</p></div>
              <div className="text-center"><p className="text-xl font-bold text-red-500">{stats.rejected}</p><p className="text-[10px] text-slate-400">отклонено</p></div>
              <div className="text-center"><p className="text-xl font-bold text-slate-400">{stats.noAgreement}</p><p className="text-[10px] text-slate-400">без статуса</p></div>
            </div>
          </div>
        </div>
      )}

      {(showForm || editAgency) && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">{editAgency ? "Редактировать орган" : "Новый госорган"}</h3>
          <AgencyForm
            initial={editAgency || undefined}
            onSave={save}
            onCancel={() => { setShowForm(false); setEditAgency(null); }}
            isEdit={!!editAgency}
          />
        </div>
      )}

      {agencies.length > 0 && (
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
          <div className="flex items-center flex-1 min-w-[220px] bg-slate-50 rounded-xl px-4 py-2 border border-slate-100 focus-within:border-indigo-300 transition">
            <Icon name="Search" size={15} className="text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по названию, адресу, email..."
              className="bg-transparent border-none outline-none text-sm text-slate-700 w-full ml-3 placeholder:text-slate-400"
            />
          </div>
          {contactFilter !== "all" && (
            <button
              onClick={() => setContactFilter("all")}
              className="flex items-center gap-1.5 text-sm bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-indigo-700 transition flex-shrink-0"
            >
              <Icon name="X" size={14} /> Сбросить фильтр
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-slate-300">Загрузка...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-300">
          {search ? "Ничего не найдено" : "Госорганов пока нет — добавьте первый"}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map(a => (
            <div key={a.id} id={`agency-${a.id}`} className="rounded-2xl transition-shadow">
              <AgencyCard
                agency={a}
                onEdit={ag => { setEditAgency(ag); setShowForm(false); }}
                onArchive={archive}
                onContactStatusChange={setContactStatus}
                onAgreementChange={setAgreementStatus}
                defaultExpanded={a.id === focusAgencyId}
                users={users}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}