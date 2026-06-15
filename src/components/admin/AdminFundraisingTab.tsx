import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";

const FUNDRAISING_URL = "https://functions.poehali.dev/c07dbd95-dad7-4562-8589-f3a6fd76c820";

const getUrl = () => FUNDRAISING_URL;

type DonorType = "org" | "person";
type Section = "stats" | "orgs" | "persons";
type Status = "active" | "inactive";

interface Stats {
  orgs_total: number; orgs_active: number;
  persons_total: number; persons_active: number;
  donations_total: number; donations_count: number;
  donations_year: number; donations_month: number;
}

interface Org {
  id: number; name: string; phone: string; email: string;
  website: string; manager: string; status: Status;
  notes: string; created_at: string;
  total_donated: number; donations_count: number;
}

interface Person {
  id: number; full_name: string; phone: string; email: string;
  source: string; status: Status; notes: string; created_at: string;
  total_donated: number; donations_count: number;
}

interface Donation {
  id: number; donor_type: DonorType; donor_id: number;
  amount: number; donated_at: string; comment: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);

const STATUS_LABELS: Record<string, string> = {
  active: "Активный", inactive: "Неактивный",
};
const SOURCE_OPTIONS = ["Сайт", "Соцсети", "Мероприятие", "Рекомендация", "Холодный контакт", "Другое"];

function exportToCsv(filename: string, rows: string[][], headers: string[]) {
  const escape = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [headers, ...rows].map(r => r.map(escape).join(";")).join("\r\n");
  const blob = new Blob(["\uFEFF" + lines], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── Форма организации ──────────────────────────────────────────────────────
function OrgForm({ initial, adminUsers, onSave, onCancel }: {
  initial?: Partial<Org>;
  adminUsers: string[];
  onSave: (data: Partial<Org>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<Org>>({
    name: "", phone: "", email: "", website: "",
    manager: "", status: "active", notes: "", ...initial,
  });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof Org, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs uppercase tracking-widest text-ink/50 mb-1">Название *</label>
          <input required value={form.name || ""} onChange={e => set("name", e.target.value)}
            className="w-full border border-beige-dark rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink bg-beige/40" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-ink/50 mb-1">Телефон</label>
          <input value={form.phone || ""} onChange={e => set("phone", e.target.value)}
            className="w-full border border-beige-dark rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink bg-beige/40" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-ink/50 mb-1">Email</label>
          <input type="email" value={form.email || ""} onChange={e => set("email", e.target.value)}
            className="w-full border border-beige-dark rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink bg-beige/40" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-ink/50 mb-1">Сайт</label>
          <input value={form.website || ""} onChange={e => set("website", e.target.value)}
            placeholder="https://"
            className="w-full border border-beige-dark rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink bg-beige/40" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-ink/50 mb-1">Менеджер</label>
          <select value={form.manager || ""} onChange={e => set("manager", e.target.value)}
            className="w-full border border-beige-dark rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink bg-beige/40">
            <option value="">— не назначен —</option>
            {adminUsers.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-ink/50 mb-1">Статус</label>
          <select value={form.status || "active"} onChange={e => set("status", e.target.value as Status)}
            className="w-full border border-beige-dark rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink bg-beige/40">
            <option value="active">Активный</option>
            <option value="inactive">Неактивный</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs uppercase tracking-widest text-ink/50 mb-1">Заметки</label>
          <textarea value={form.notes || ""} onChange={e => set("notes", e.target.value)} rows={3}
            className="w-full border border-beige-dark rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink bg-beige/40 resize-none" />
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={saving}
          className="bg-ink text-beige px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-ink/90 transition-colors disabled:opacity-50">
          {saving ? "Сохраняем..." : "Сохранить"}
        </button>
        <button type="button" onClick={onCancel}
          className="px-6 py-2.5 rounded-xl text-sm text-ink/60 hover:text-ink border border-beige-dark transition-colors">
          Отмена
        </button>
      </div>
    </form>
  );
}

// ─── Форма физлица ───────────────────────────────────────────────────────────
function PersonForm({ initial, onSave, onCancel }: {
  initial?: Partial<Person>;
  onSave: (data: Partial<Person>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<Person>>({
    full_name: "", phone: "", email: "", source: "",
    status: "active", notes: "", ...initial,
  });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof Person, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs uppercase tracking-widest text-ink/50 mb-1">ФИО *</label>
          <input required value={form.full_name || ""} onChange={e => set("full_name", e.target.value)}
            className="w-full border border-beige-dark rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink bg-beige/40" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-ink/50 mb-1">Телефон</label>
          <input value={form.phone || ""} onChange={e => set("phone", e.target.value)}
            className="w-full border border-beige-dark rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink bg-beige/40" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-ink/50 mb-1">Email</label>
          <input type="email" value={form.email || ""} onChange={e => set("email", e.target.value)}
            className="w-full border border-beige-dark rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink bg-beige/40" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-ink/50 mb-1">Источник</label>
          <select value={form.source || ""} onChange={e => set("source", e.target.value)}
            className="w-full border border-beige-dark rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink bg-beige/40">
            <option value="">— не указан —</option>
            {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-ink/50 mb-1">Статус</label>
          <select value={form.status || "active"} onChange={e => set("status", e.target.value as Status)}
            className="w-full border border-beige-dark rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink bg-beige/40">
            <option value="active">Активный</option>
            <option value="inactive">Неактивный</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs uppercase tracking-widest text-ink/50 mb-1">Заметки</label>
          <textarea value={form.notes || ""} onChange={e => set("notes", e.target.value)} rows={3}
            className="w-full border border-beige-dark rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink bg-beige/40 resize-none" />
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={saving}
          className="bg-ink text-beige px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-ink/90 transition-colors disabled:opacity-50">
          {saving ? "Сохраняем..." : "Сохранить"}
        </button>
        <button type="button" onClick={onCancel}
          className="px-6 py-2.5 rounded-xl text-sm text-ink/60 hover:text-ink border border-beige-dark transition-colors">
          Отмена
        </button>
      </div>
    </form>
  );
}

// ─── Панель донора (история пожертвований) ───────────────────────────────────
function DonorPanel({ donorType, donorId, donorName, onClose, apiUrl }: {
  donorType: DonorType; donorId: number; donorName: string;
  onClose: () => void; apiUrl: string;
}) {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ amount: "", donated_at: new Date().toISOString().slice(0,10), comment: "" });
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
    setForm({ amount: "", donated_at: new Date().toISOString().slice(0,10), comment: "" });
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

          {/* Форма добавления */}
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

          {/* Список */}
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

// ─── Главный компонент ───────────────────────────────────────────────────────
export default function AdminFundraisingTab({ adminUsers }: { adminUsers: string[] }) {
  const [apiUrl, setApiUrl] = useState("");
  const [section, setSection] = useState<Section>("stats");
  const [stats, setStats] = useState<Stats | null>(null);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editOrg, setEditOrg] = useState<Org | null>(null);
  const [editPerson, setEditPerson] = useState<Person | null>(null);
  const [donorPanel, setDonorPanel] = useState<{ type: DonorType; id: number; name: string } | null>(null);

  // Получаем URL после монтирования
  useEffect(() => { setApiUrl(getUrl()); }, []);

  const loadStats = () => {
    if (!apiUrl) return;
    fetch(`${apiUrl}?type=stats`).then(r => r.json()).then(d => setStats(d));
  };

  const loadOrgs = () => {
    if (!apiUrl) return;
    setLoading(true);
    fetch(`${apiUrl}?type=orgs`).then(r => r.json()).then(d => setOrgs(d.orgs || [])).finally(() => setLoading(false));
  };

  const loadPersons = () => {
    if (!apiUrl) return;
    setLoading(true);
    fetch(`${apiUrl}?type=persons`).then(r => r.json()).then(d => setPersons(d.persons || [])).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!apiUrl) return;
    loadStats();
    if (section === "orgs") loadOrgs();
    if (section === "persons") loadPersons();
  }, [section, apiUrl]);

  const saveOrg = async (data: Partial<Org>) => {
    await fetch(`${apiUrl}?type=org`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setShowForm(false); setEditOrg(null);
    loadOrgs(); loadStats();
  };

  const savePerson = async (data: Partial<Person>) => {
    await fetch(`${apiUrl}?type=person`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setShowForm(false); setEditPerson(null);
    loadPersons(); loadStats();
  };

  const deleteOrg = async (id: number) => {
    if (!confirm("Удалить организацию и все её пожертвования?")) return;
    await fetch(`${apiUrl}?type=org&id=${id}`, { method: "DELETE" });
    loadOrgs(); loadStats();
  };

  const deletePerson = async (id: number) => {
    if (!confirm("Удалить жертвователя и все его пожертвования?")) return;
    await fetch(`${apiUrl}?type=person&id=${id}`, { method: "DELETE" });
    loadPersons(); loadStats();
  };

  const filteredOrgs = orgs.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    (o.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (o.manager || "").toLowerCase().includes(search.toLowerCase())
  );

  const filteredPersons = persons.filter(p =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (p.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.phone || "").includes(search)
  );

  const SECTIONS = [
    { id: "stats" as Section, label: "Статистика", icon: "BarChart3" },
    { id: "orgs" as Section, label: "Организации", icon: "Building2" },
    { id: "persons" as Section, label: "Физлица", icon: "UserHeart" },
  ];

  return (
    <div className="space-y-6">
      {/* Подвкладки */}
      <div className="flex items-center gap-1 bg-beige-mid rounded-xl p-1 w-fit">
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => { setSection(s.id); setShowForm(false); setSearch(""); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${section === s.id ? "bg-white text-ink shadow-sm" : "text-ink/50 hover:text-ink"}`}>
            <Icon name={s.icon} size={15} />
            {s.label}
          </button>
        ))}
      </div>

      {/* ── СТАТИСТИКА ── */}
      {section === "stats" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Всего собрано", value: fmt(stats?.donations_total || 0), icon: "Banknote", color: "text-green-600 bg-green-50" },
              { label: "За этот месяц", value: fmt(stats?.donations_month || 0), icon: "CalendarDays", color: "text-blue-600 bg-blue-50" },
              { label: "За этот год", value: fmt(stats?.donations_year || 0), icon: "TrendingUp", color: "text-violet-600 bg-violet-50" },
              { label: "Пожертвований", value: String(stats?.donations_count || 0), icon: "Heart", color: "text-rose-600 bg-rose-50" },
            ].map(card => (
              <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm">
                <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-3`}>
                  <Icon name={card.icon} size={20} />
                </div>
                <div className="text-xl font-bold text-ink">{card.value}</div>
                <div className="text-xs text-ink/50 mt-0.5">{card.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="text-xs uppercase tracking-widest text-ink/40 mb-3">Организации</div>
              <div className="flex items-end gap-4">
                <div>
                  <div className="text-3xl font-bold text-ink">{stats?.orgs_total || 0}</div>
                  <div className="text-xs text-ink/50">всего</div>
                </div>
                <div className="text-lg font-semibold text-green-600">
                  {stats?.orgs_active || 0} <span className="text-xs font-normal text-ink/40">активных</span>
                </div>
              </div>
              <button onClick={() => setSection("orgs")}
                className="mt-4 text-xs text-ink/40 hover:text-ink transition-colors flex items-center gap-1">
                Перейти к списку <Icon name="ArrowRight" size={12} />
              </button>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="text-xs uppercase tracking-widest text-ink/40 mb-3">Частные жертвователи</div>
              <div className="flex items-end gap-4">
                <div>
                  <div className="text-3xl font-bold text-ink">{stats?.persons_total || 0}</div>
                  <div className="text-xs text-ink/50">всего</div>
                </div>
                <div className="text-lg font-semibold text-green-600">
                  {stats?.persons_active || 0} <span className="text-xs font-normal text-ink/40">активных</span>
                </div>
              </div>
              <button onClick={() => setSection("persons")}
                className="mt-4 text-xs text-ink/40 hover:text-ink transition-colors flex items-center gap-1">
                Перейти к списку <Icon name="ArrowRight" size={12} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ОРГАНИЗАЦИИ ── */}
      {section === "orgs" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Поиск по названию, email, менеджеру..."
                className="w-full border border-beige-dark rounded-xl pl-9 pr-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink bg-white" />
            </div>
            <button
              onClick={() => exportToCsv(
                `организации-${new Date().toLocaleDateString("ru-RU").replace(/\./g,"-")}.csv`,
                orgs.map(o => [o.name, o.phone, o.email, o.website, o.manager, STATUS_LABELS[o.status] || o.status, String(o.total_donated), String(o.donations_count), o.notes, new Date(o.created_at).toLocaleDateString("ru-RU")]),
                ["Название","Телефон","Email","Сайт","Менеджер","Статус","Сумма пожертвований","Кол-во пожертвований","Заметки","Дата добавления"]
              )}
              className="flex items-center gap-2 border border-beige-dark text-ink/60 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-beige-mid transition-colors">
              <Icon name="Download" size={15} /> Excel
            </button>
            <button onClick={() => { setShowForm(true); setEditOrg(null); }}
              className="flex items-center gap-2 bg-ink text-beige px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-ink/90 transition-colors">
              <Icon name="Plus" size={15} /> Добавить
            </button>
          </div>

          {showForm && !editOrg && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="text-sm font-semibold text-ink mb-4">Новая организация</div>
              <OrgForm adminUsers={adminUsers} onSave={saveOrg} onCancel={() => setShowForm(false)} />
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-ink/30 text-sm">Загружаем...</div>
          ) : filteredOrgs.length === 0 ? (
            <div className="text-center py-12 text-ink/30 text-sm">
              {search ? "Ничего не найдено" : "Организаций пока нет"}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrgs.map(org => (
                <div key={org.id}>
                  {editOrg?.id === org.id ? (
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                      <div className="text-sm font-semibold text-ink mb-4">Редактировать</div>
                      <OrgForm initial={org} adminUsers={adminUsers} onSave={saveOrg} onCancel={() => setEditOrg(null)} />
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-ink">{org.name}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${org.status === "active" ? "bg-green-100 text-green-700" : "bg-beige-dark text-ink/50"}`}>
                              {STATUS_LABELS[org.status]}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-ink/50">
                            {org.phone && <span className="flex items-center gap-1"><Icon name="Phone" size={11} />{org.phone}</span>}
                            {org.email && <span className="flex items-center gap-1"><Icon name="Mail" size={11} />{org.email}</span>}
                            {org.website && <a href={org.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-ink transition-colors"><Icon name="Globe" size={11} />Сайт</a>}
                            {org.manager && <span className="flex items-center gap-1"><Icon name="User" size={11} />{org.manager}</span>}
                          </div>
                          {org.notes && <div className="mt-2 text-xs text-ink/40 italic">{org.notes}</div>}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => setDonorPanel({ type: "org", id: org.id, name: org.name })}
                            className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors font-medium">
                            <Icon name="Banknote" size={13} />
                            {org.donations_count > 0 ? fmt(org.total_donated) : "Взносы"}
                          </button>
                          <button onClick={() => { setEditOrg(org); setShowForm(false); }}
                            className="p-1.5 text-ink/30 hover:text-ink transition-colors rounded-lg hover:bg-beige-mid">
                            <Icon name="Pencil" size={15} />
                          </button>
                          <button onClick={() => deleteOrg(org.id)}
                            className="p-1.5 text-ink/30 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
                            <Icon name="Trash2" size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ФИЗЛИЦА ── */}
      {section === "persons" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Поиск по имени, email, телефону..."
                className="w-full border border-beige-dark rounded-xl pl-9 pr-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink bg-white" />
            </div>
            <button
              onClick={() => exportToCsv(
                `жертвователи-${new Date().toLocaleDateString("ru-RU").replace(/\./g,"-")}.csv`,
                persons.map(p => [p.full_name, p.phone, p.email, p.source, STATUS_LABELS[p.status] || p.status, String(p.total_donated), String(p.donations_count), p.notes, new Date(p.created_at).toLocaleDateString("ru-RU")]),
                ["ФИО","Телефон","Email","Источник","Статус","Сумма пожертвований","Кол-во пожертвований","Заметки","Дата добавления"]
              )}
              className="flex items-center gap-2 border border-beige-dark text-ink/60 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-beige-mid transition-colors">
              <Icon name="Download" size={15} /> Excel
            </button>
            <button onClick={() => { setShowForm(true); setEditPerson(null); }}
              className="flex items-center gap-2 bg-ink text-beige px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-ink/90 transition-colors">
              <Icon name="Plus" size={15} /> Добавить
            </button>
          </div>

          {showForm && !editPerson && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="text-sm font-semibold text-ink mb-4">Новый жертвователь</div>
              <PersonForm onSave={savePerson} onCancel={() => setShowForm(false)} />
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-ink/30 text-sm">Загружаем...</div>
          ) : filteredPersons.length === 0 ? (
            <div className="text-center py-12 text-ink/30 text-sm">
              {search ? "Ничего не найдено" : "Жертвователей пока нет"}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPersons.map(p => (
                <div key={p.id}>
                  {editPerson?.id === p.id ? (
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                      <div className="text-sm font-semibold text-ink mb-4">Редактировать</div>
                      <PersonForm initial={p} onSave={savePerson} onCancel={() => setEditPerson(null)} />
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-ink">{p.full_name}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${p.status === "active" ? "bg-green-100 text-green-700" : "bg-beige-dark text-ink/50"}`}>
                              {STATUS_LABELS[p.status]}
                            </span>
                            {p.source && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                                {p.source}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-ink/50">
                            {p.phone && <span className="flex items-center gap-1"><Icon name="Phone" size={11} />{p.phone}</span>}
                            {p.email && <span className="flex items-center gap-1"><Icon name="Mail" size={11} />{p.email}</span>}
                          </div>
                          {p.notes && <div className="mt-2 text-xs text-ink/40 italic">{p.notes}</div>}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => setDonorPanel({ type: "person", id: p.id, name: p.full_name })}
                            className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors font-medium">
                            <Icon name="Banknote" size={13} />
                            {p.donations_count > 0 ? fmt(p.total_donated) : "Взносы"}
                          </button>
                          <button onClick={() => { setEditPerson(p); setShowForm(false); }}
                            className="p-1.5 text-ink/30 hover:text-ink transition-colors rounded-lg hover:bg-beige-mid">
                            <Icon name="Pencil" size={15} />
                          </button>
                          <button onClick={() => deletePerson(p.id)}
                            className="p-1.5 text-ink/30 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
                            <Icon name="Trash2" size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Панель пожертвований */}
      {donorPanel && (
        <DonorPanel
          donorType={donorPanel.type}
          donorId={donorPanel.id}
          donorName={donorPanel.name}
          onClose={() => { setDonorPanel(null); loadStats(); if (section === "orgs") loadOrgs(); else loadPersons(); }}
          apiUrl={apiUrl}
        />
      )}
    </div>
  );
}