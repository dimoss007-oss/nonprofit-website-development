import Icon from "@/components/ui/icon";
import {
  DonorType, Person,
  STATUS_LABELS, STATUS_COLORS, DONOR_CATEGORY_LABELS, DONOR_CATEGORY_COLORS,
  fmt, exportToCsv,
} from "./fundraising.types";
import { PersonForm } from "./FundraisingForms";
import { PersonTaskButton } from "./OrgTaskButton";

interface Props {
  users: { login: string; full_name?: string }[];
  persons: Person[];
  filteredPersons: Person[];
  loading: boolean;
  search: string;
  setSearch: (v: string) => void;
  showForm: boolean;
  setShowForm: (v: boolean) => void;
  editPerson: Person | null;
  setEditPerson: (p: Person | null) => void;
  savePerson: (data: Partial<Person>) => Promise<void>;
  deletePerson: (id: number) => Promise<void>;
  setDonorPanel: (p: { type: DonorType; id: number; name: string } | null) => void;
}

export function FundraisingPersonsSection({ users, persons, filteredPersons, loading, search, setSearch, showForm, setShowForm, editPerson, setEditPerson, savePerson, deletePerson, setDonorPanel }: Props) {
  return (
    <div className="space-y-4">
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex items-center flex-1 min-w-[220px] bg-slate-50 rounded-xl px-4 py-2 border border-slate-100 focus-within:border-indigo-300 transition">
          <Icon name="Search" size={15} className="text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по имени, email, телефону..." className="bg-transparent border-none outline-none text-sm text-slate-700 w-full ml-3 placeholder:text-slate-400" />
        </div>
        <button
          onClick={() => exportToCsv(
            `жертвователи-${new Date().toLocaleDateString("ru-RU").replace(/\./g, "-")}.csv`,
            persons.map(p => [p.full_name, p.phone, p.email, p.source, STATUS_LABELS[p.status] || p.status, String(p.total_donated), String(p.donations_count), p.notes, new Date(p.created_at).toLocaleDateString("ru-RU")]),
            ["ФИО", "Телефон", "Email", "Источник", "Статус", "Сумма пожертвований", "Кол-во пожертвований", "Заметки", "Дата добавления"]
          )}
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 shadow-sm transition-colors">
          <Icon name="Download" size={15} /> Excel
        </button>
        <button onClick={() => { setShowForm(true); setEditPerson(null); }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-100 shadow-sm transition-colors">
          <Icon name="Plus" size={15} /> Добавить
        </button>
      </div>

      {showForm && !editPerson && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="text-sm font-semibold text-slate-800 mb-4">Новый жертвователь</div>
          <PersonForm onSave={savePerson} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-300 text-sm">Загружаем...</div>
      ) : filteredPersons.length === 0 ? (
        <div className="text-center py-12 text-slate-300 text-sm">
          {search ? "Ничего не найдено" : "Жертвователей пока нет"}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPersons.map(p => (
            <div key={p.id}>
              {editPerson?.id === p.id ? (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="text-sm font-semibold text-slate-800 mb-4">Редактировать</div>
                  <PersonForm initial={p} onSave={savePerson} onCancel={() => setEditPerson(null)} />
                </div>
              ) : (
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800">{p.full_name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status] ?? "bg-slate-100 text-slate-400"}`}>
                          {STATUS_LABELS[p.status]}
                        </span>
                        {p.donor_category && p.donor_category !== "donation" && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${DONOR_CATEGORY_COLORS[p.donor_category] ?? "bg-slate-100 text-slate-500"}`}>
                            {DONOR_CATEGORY_LABELS[p.donor_category]}
                          </span>
                        )}
                        {p.source && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                            {p.source}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-400">
                        {p.phone && <span className="flex items-center gap-1"><Icon name="Phone" size={11} />{p.phone}</span>}
                        {p.email && <span className="flex items-center gap-1"><Icon name="Mail" size={11} />{p.email}</span>}
                        {p.address && <span className="flex items-center gap-1"><Icon name="MapPin" size={11} />{p.address}</span>}
                      </div>
                      {p.notes && <div className="mt-2 text-xs text-slate-400 italic">{p.notes}</div>}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => setDonorPanel({ type: "person", id: p.id, name: p.full_name })}
                        className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors font-medium">
                        <Icon name="ClipboardList" size={13} />
                        CRM{p.donations_count > 0 ? ` · ${fmt(p.total_donated)}` : ""}
                      </button>
                      <PersonTaskButton person={p} users={users} />
                      <button onClick={() => { setEditPerson(p); setShowForm(false); }}
                        className="p-1.5 text-slate-300 hover:text-slate-800 transition-colors rounded-lg hover:bg-slate-50">
                        <Icon name="Pencil" size={15} />
                      </button>
                      <button onClick={() => deletePerson(p.id)}
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
