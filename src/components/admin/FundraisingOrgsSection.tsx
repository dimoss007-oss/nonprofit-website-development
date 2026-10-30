import Icon from "@/components/ui/icon";
import {
  DonorType, Org,
  STATUS_LABELS, STATUS_COLORS, DONOR_CATEGORY_LABELS, DONOR_CATEGORY_COLORS,
  fmt, exportToCsv,
} from "./fundraising.types";
import { OrgForm } from "./FundraisingForms";
import { OrgTaskButton } from "./OrgTaskButton";

interface Props {
  adminUsers: string[];
  users: { login: string; full_name?: string }[];
  orgs: Org[];
  filteredOrgs: Org[];
  loading: boolean;
  search: string;
  setSearch: (v: string) => void;
  showForm: boolean;
  setShowForm: (v: boolean) => void;
  editOrg: Org | null;
  setEditOrg: (o: Org | null) => void;
  saveOrg: (data: Partial<Org>) => Promise<void>;
  deleteOrg: (id: number) => Promise<void>;
  setDonorPanel: (p: { type: DonorType; id: number; name: string } | null) => void;
}

export function FundraisingOrgsSection({ adminUsers, users, orgs, filteredOrgs, loading, search, setSearch, showForm, setShowForm, editOrg, setEditOrg, saveOrg, deleteOrg, setDonorPanel }: Props) {
  return (
    <div className="space-y-4">
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex items-center flex-1 min-w-[220px] bg-slate-50 rounded-xl px-4 py-2 border border-slate-100 focus-within:border-indigo-300 transition">
          <Icon name="Search" size={15} className="text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по названию, email, менеджеру..." className="bg-transparent border-none outline-none text-sm text-slate-700 w-full ml-3 placeholder:text-slate-400" />
        </div>
        <button
          onClick={() => exportToCsv(
            `организации-${new Date().toLocaleDateString("ru-RU").replace(/\./g, "-")}.csv`,
            orgs.map(o => [o.name, o.phone, o.email, o.website, o.manager, STATUS_LABELS[o.status] || o.status, String(o.total_donated), String(o.donations_count), o.notes, new Date(o.created_at).toLocaleDateString("ru-RU")]),
            ["Название", "Телефон", "Email", "Сайт", "Менеджер", "Статус", "Сумма пожертвований", "Кол-во пожертвований", "Заметки", "Дата добавления"]
          )}
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 shadow-sm transition-colors">
          <Icon name="Download" size={15} /> Excel
        </button>
        <button onClick={() => { setShowForm(true); setEditOrg(null); }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-100 shadow-sm transition-colors">
          <Icon name="Plus" size={15} /> Добавить
        </button>
      </div>

      {showForm && !editOrg && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="text-sm font-semibold text-slate-800 mb-4">Новая организация</div>
          <OrgForm adminUsers={adminUsers} onSave={saveOrg} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-300 text-sm">Загружаем...</div>
      ) : filteredOrgs.length === 0 ? (
        <div className="text-center py-12 text-slate-300 text-sm">
          {search ? "Ничего не найдено" : "Организаций пока нет"}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrgs.map(org => (
            <div key={org.id}>
              {editOrg?.id === org.id ? (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="text-sm font-semibold text-slate-800 mb-4">Редактировать</div>
                  <OrgForm initial={org} adminUsers={adminUsers} onSave={saveOrg} onCancel={() => setEditOrg(null)} />
                </div>
              ) : (
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800">{org.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[org.status] ?? "bg-slate-100 text-slate-400"}`}>
                          {STATUS_LABELS[org.status]}
                        </span>
                        {org.donor_category && org.donor_category !== "donation" && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${DONOR_CATEGORY_COLORS[org.donor_category] ?? "bg-slate-100 text-slate-500"}`}>
                            {DONOR_CATEGORY_LABELS[org.donor_category]}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-400">
                        {org.phone && <span className="flex items-center gap-1"><Icon name="Phone" size={11} />{org.phone}</span>}
                        {org.email && <span className="flex items-center gap-1"><Icon name="Mail" size={11} />{org.email}</span>}
                        {org.address && <span className="flex items-center gap-1"><Icon name="MapPin" size={11} />{org.address}</span>}
                        {org.website && <a href={org.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-slate-800 transition-colors"><Icon name="Globe" size={11} />Сайт</a>}
                        {org.manager && <span className="flex items-center gap-1"><Icon name="User" size={11} />{org.manager}</span>}
                      </div>
                      {org.notes && <div className="mt-2 text-xs text-slate-400 italic">{org.notes}</div>}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => setDonorPanel({ type: "org", id: org.id, name: org.name })}
                        className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors font-medium">
                        <Icon name="ClipboardList" size={13} />
                        CRM{org.donations_count > 0 ? ` · ${fmt(org.total_donated)}` : ""}
                      </button>
                      <OrgTaskButton org={org} users={users} />
                      <button onClick={() => { setEditOrg(org); setShowForm(false); }}
                        className="p-1.5 text-slate-300 hover:text-slate-800 transition-colors rounded-lg hover:bg-slate-50">
                        <Icon name="Pencil" size={15} />
                      </button>
                      <button onClick={() => deleteOrg(org.id)}
                        className="p-1.5 text-slate-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
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
  );
}
