import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/a6165b16-3047-437e-95c8-119e4f3c08a1";

type Family = {
  id: number;
  last_name: string;
  first_name: string;
  middle_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  district?: string;
  case_description?: string;
  status: "active" | "closed";
  created_at: string;
};

function fmt(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU");
}

const EMPTY_FORM = { last_name: "", first_name: "", middle_name: "", phone: "", email: "", address: "", district: "", case_description: "", status: "active" as "active" | "closed" };

function FamilyForm({ initial, onSave, onCancel, loading }: { initial?: Partial<typeof EMPTY_FORM>; onSave: (data: typeof EMPTY_FORM) => void; onCancel: () => void; loading: boolean }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div><label className="text-xs text-ink/50 mb-1 block">Фамилия *</label><input value={form.last_name} onChange={set("last_name")} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" /></div>
        <div><label className="text-xs text-ink/50 mb-1 block">Имя *</label><input value={form.first_name} onChange={set("first_name")} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" /></div>
        <div><label className="text-xs text-ink/50 mb-1 block">Отчество</label><input value={form.middle_name} onChange={set("middle_name")} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label className="text-xs text-ink/50 mb-1 block">Телефон</label><input value={form.phone} onChange={set("phone")} placeholder="+7 900 000-00-00" className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" /></div>
        <div><label className="text-xs text-ink/50 mb-1 block">Email</label><input value={form.email} onChange={set("email")} placeholder="mail@example.com" className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label className="text-xs text-ink/50 mb-1 block">Адрес</label><input value={form.address} onChange={set("address")} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" /></div>
        <div><label className="text-xs text-ink/50 mb-1 block">Район области</label><input value={form.district} onChange={set("district")} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" /></div>
      </div>
      <div><label className="text-xs text-ink/50 mb-1 block">Описание случая</label><textarea value={form.case_description} onChange={set("case_description")} rows={4} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink resize-none" /></div>
      <div>
        <label className="text-xs text-ink/50 mb-1 block">Статус</label>
        <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as "active" | "closed" }))} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink bg-white">
          <option value="active">На сопровождении</option>
          <option value="closed">Случай закрыт</option>
        </select>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-beige-dark hover:border-ink transition-colors">Отмена</button>
        <button onClick={() => onSave(form)} disabled={loading || !form.last_name || !form.first_name} className="px-4 py-2 text-sm rounded-lg bg-ink text-beige hover:bg-ink/90 transition-colors disabled:opacity-60">{loading ? "Сохранение..." : "Сохранить"}</button>
      </div>
    </div>
  );
}

function FamilyCard({ familyId, onBack, onDeleted, isAdmin }: { familyId: number; onBack: () => void; onDeleted: () => void; isAdmin: boolean }) {
  const [family, setFamily] = useState<Family | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = async () => {
    const r = await fetch(`${API}?id=${familyId}`);
    const d = await r.json();
    setFamily(d.family || null);
  };

  useEffect(() => { load(); }, [familyId]);

  const save = async (form: typeof EMPTY_FORM) => {
    setSaving(true);
    await fetch(`${API}?id=${familyId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    setEditing(false);
    load();
  };

  const remove = async () => {
    await fetch(`${API}?id=${familyId}`, { method: "DELETE" });
    onDeleted();
  };

  if (!family) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-ink/50 hover:text-ink transition-colors">
        <Icon name="ArrowLeft" size={16} /> Назад к списку
      </button>

      <div className="bg-white border border-beige-dark rounded-2xl p-6">
        {editing ? (
          <FamilyForm
            initial={{ ...family, middle_name: family.middle_name ?? "", phone: family.phone ?? "", email: family.email ?? "", address: family.address ?? "", district: family.district ?? "", case_description: family.case_description ?? "" }}
            onSave={save}
            onCancel={() => setEditing(false)}
            loading={saving}
          />
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-cormorant text-2xl font-semibold text-ink">{family.last_name} {family.first_name} {family.middle_name ?? ""}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${family.status === "active" ? "bg-rose-100 text-rose-700" : "bg-beige-dark text-ink/40"}`}>
                  {family.status === "active" ? "На сопровождении" : "Случай закрыт"}
                </span>
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-beige-dark hover:border-ink transition-colors">
                    <Icon name="Pencil" size={14} /> Изменить
                  </button>
                  <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-red-200 text-red-600 hover:border-red-400 transition-colors">
                    <Icon name="Trash2" size={14} /> Удалить
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
              <div><p className="text-xs text-ink/40 mb-1">Телефон</p><p className="text-sm text-ink">{family.phone || "—"}</p></div>
              <div><p className="text-xs text-ink/40 mb-1">Email</p><p className="text-sm text-ink">{family.email || "—"}</p></div>
              <div><p className="text-xs text-ink/40 mb-1">Адрес</p><p className="text-sm text-ink">{family.address || "—"}</p></div>
              <div><p className="text-xs text-ink/40 mb-1">Район области</p><p className="text-sm text-ink">{family.district || "—"}</p></div>
              <div><p className="text-xs text-ink/40 mb-1">Дата добавления</p><p className="text-sm text-ink">{fmt(family.created_at)}</p></div>
            </div>

            <div className="mt-5">
              <p className="text-xs text-ink/40 mb-1">Описание случая</p>
              <p className="text-sm text-ink whitespace-pre-wrap">{family.case_description || "—"}</p>
            </div>
          </>
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={() => setConfirmDelete(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <p className="text-ink font-semibold mb-2">Удалить запись?</p>
            <p className="text-sm text-ink/50 mb-5">Данные о семье будут удалены безвозвратно.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDelete(false)} className="px-4 py-2 text-sm rounded-lg border border-beige-dark hover:border-ink transition-colors">Отмена</button>
              <button onClick={remove} className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">Удалить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminSopTab({ isAdmin = true }: { isAdmin?: boolean }) {
  const [allFamilies, setAllFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadFamilies = async () => {
    setLoading(true);
    const r = await fetch(API);
    const d = await r.json();
    setAllFamilies(d.families || []);
    setLoading(false);
  };

  useEffect(() => { loadFamilies(); }, []);

  const q = search.toLowerCase();
  const families = search
    ? allFamilies.filter(f => `${f.last_name} ${f.first_name} ${f.middle_name ?? ""} ${f.district ?? ""}`.toLowerCase().includes(q))
    : allFamilies;

  const active = allFamilies.filter(f => f.status === "active");

  const createFamily = async (form: typeof EMPTY_FORM) => {
    setSaving(true);
    const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await r.json();
    setSaving(false);
    setAdding(false);
    setSelectedId(d.family?.id);
    loadFamilies();
  };

  if (selectedId) return (
    <FamilyCard familyId={selectedId} onBack={() => setSelectedId(null)} onDeleted={() => { setSelectedId(null); loadFamilies(); }} isAdmin={isAdmin} />
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-cormorant text-ink text-2xl font-semibold">Семьи в СОП</h2>
        {isAdmin && (
          <button onClick={() => setAdding(true)} className="flex items-center gap-2 bg-ink text-beige px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-ink/90 transition-colors">
            <Icon name="UserPlus" size={16} /> Добавить
          </button>
        )}
      </div>

      {allFamilies.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-rose-200 rounded-2xl px-4 py-3.5 text-center">
            <p className="font-cormorant text-3xl font-semibold text-rose-700">{active.length}</p>
            <p className="text-xs text-ink/50 mt-0.5">на сопровождении</p>
          </div>
          <div className="bg-white border border-beige-dark rounded-2xl px-4 py-3.5 text-center">
            <p className="font-cormorant text-3xl font-semibold text-ink">{allFamilies.length}</p>
            <p className="text-xs text-ink/50 mt-0.5">всего в базе</p>
          </div>
        </div>
      )}

      {adding && (
        <div className="bg-white border border-beige-dark rounded-2xl p-6">
          <h3 className="font-semibold text-ink mb-4">Новая семья</h3>
          <FamilyForm onSave={createFamily} onCancel={() => setAdding(false)} loading={saving} />
        </div>
      )}

      <div className="relative">
        <Icon name="Search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по ФИО или району..." className="w-full bg-white border border-beige-dark rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-ink" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin" /></div>
      ) : families.length === 0 ? (
        <div className="text-center py-16 text-ink/40">
          <Icon name="ShieldAlert" size={40} className="mx-auto mb-3 opacity-30" />
          <p>{search ? "Ничего не найдено" : "Записей пока нет"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {families.map(f => (
            <button key={f.id} onClick={() => setSelectedId(f.id)} className={`w-full bg-white border rounded-2xl px-5 py-4 text-left hover:border-ink transition-colors group ${f.status === "active" ? "border-rose-200" : "border-beige-dark"}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-ink">{f.last_name} {f.first_name} {f.middle_name ?? ""}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${f.status === "active" ? "bg-rose-100 text-rose-700" : "bg-beige-dark text-ink/40"}`}>
                      {f.status === "active" ? "На сопровождении" : "Закрыт"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 flex-wrap">
                    {f.district && <span className="text-xs text-ink/40">{f.district}</span>}
                    {f.phone && <span className="text-xs text-ink/40">{f.phone}</span>}
                    {f.address && <span className="text-xs text-ink/40 truncate">{f.address}</span>}
                  </div>
                </div>
                <Icon name="ChevronRight" size={16} className="text-ink/30 group-hover:text-ink transition-colors flex-shrink-0" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}