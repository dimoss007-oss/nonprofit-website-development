import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { QRCodeSVG } from "qrcode.react";
import {
  DonorType, Section, Org, Person, Stats,
  FUNDRAISING_URL, STATUS_LABELS, STATUS_COLORS, DONOR_CATEGORY_LABELS, DONOR_CATEGORY_COLORS,
  fmt, exportToCsv,
} from "./fundraising.types";
import { OrgForm, PersonForm } from "./FundraisingForms";
import { OrgTaskButton, PersonTaskButton } from "./OrgTaskButton";
import { FundraisingStats } from "./FundraisingStats";
import FundraisingGoalsTab from "./FundraisingGoalsTab";
import FundraisingFunnelTab from "./FundraisingFunnelTab";
import FundraisingCampaignsTab from "./FundraisingCampaignsTab";
import FundraisingProjectsTab from "./FundraisingProjectsTab";
import FundraisingTasksTab from "./FundraisingTasksTab";
import FundraisingDocsTab from "./FundraisingDocsTab";
import BrigadeAdminTab from "./BrigadeAdminTab";
import VideoAdminTab from "./VideoAdminTab";
import GratitudeAdminTab from "./GratitudeAdminTab";
import FundraisingKpiTab from "./FundraisingKpiTab";
import { DonorCrmPanel } from "./DonorCrmPanel";
import DonorCabinetAdmin from "./donorcabinet/DonorCabinetAdmin";

const DONATE_URL = "https://спасениенадежды.рф/donate";
const DONATE_LINK_URL = "https://спасениенадежды.рф/donate-pay";
const LOGO_URL = "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/4ca974da-fec3-4fd3-834d-c7dccc97fca9.jpg";

function QRCard({ url, label, filename, size }: { url: string; label: string; filename: string; size: number }) {
  const qrRef = useRef<SVGSVGElement>(null);

  const downloadPng = () => {
    const svg = qrRef.current;
    if (!svg) return;
    const padding = 40;
    const total = size + padding * 2;
    const canvas = document.createElement("canvas");
    canvas.width = total; canvas.height = total;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, total, total);
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, padding, padding, size, size);
      const a = document.createElement("a");
      a.download = filename;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center gap-3 shadow-sm">
        <QRCodeSVG
          ref={qrRef}
          value={url}
          size={size}
          level="M"
          includeMargin={false}
          imageSettings={{ src: LOGO_URL, height: 40, width: 40, excavate: true }}
        />
        <p className="text-slate-400 text-xs text-center max-w-[200px]">{label}</p>
      </div>
      <button onClick={downloadPng}
        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-100 transition-colors">
        <Icon name="Download" size={14} />
        Скачать PNG
      </button>
    </div>
  );
}

function DonateQR() {
  const [size, setSize] = useState(260);

  return (
    <div className="space-y-8 py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-400">Размер:</span>
        <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1">
          {[200, 260, 360].map(s => (
            <button key={s} onClick={() => setSize(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${size === s ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-800"}`}>
              {s === 200 ? "S" : s === 260 ? "M" : "L"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div className="space-y-3">
          <h3 className="font-medium text-slate-800 text-sm flex items-center gap-2">
            <Icon name="Globe" size={15} /> Страница пожертвований
          </h3>
          <QRCard url={DONATE_URL} label="спасениенадежды.рф/donate" filename="qr-сайт-donate.png" size={size} />
        </div>

        <div className="space-y-3">
          <h3 className="font-medium text-slate-800 text-sm flex items-center gap-2">
            <Icon name="CreditCard" size={15} /> Прямая оплата ЮКасса
          </h3>
          <div className="flex flex-col items-center gap-3">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center gap-3 shadow-sm">
              <img
                src="https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/dc6bf240-210a-4de7-89eb-385cddae5a3c.png"
                alt="QR-код ЮКасса"
                style={{ width: size, height: size }}
                className="object-contain"
              />
              <p className="text-slate-400 text-xs text-center max-w-[200px]">Сразу открывает форму оплаты</p>
            </div>
            <a
              href="https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/dc6bf240-210a-4de7-89eb-385cddae5a3c.png"
              download="qr-юкасса-donate.png"
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-100 transition-colors"
            >
              <Icon name="Download" size={14} />
              Скачать PNG
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminFundraisingTab({ adminUsers, users, authLogin = "", authPassword = "" }: { adminUsers: string[]; users: { login: string; full_name?: string }[]; authLogin?: string; authPassword?: string }) {
  const apiUrl = FUNDRAISING_URL;
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

  const loadStats = () => {
    fetch(`${apiUrl}?type=stats`).then(r => r.json()).then(d => setStats(d));
  };

  const loadOrgs = () => {
    setLoading(true);
    fetch(`${apiUrl}?type=orgs`).then(r => r.json()).then(d => setOrgs(d.orgs || [])).finally(() => setLoading(false));
  };

  const loadPersons = () => {
    setLoading(true);
    fetch(`${apiUrl}?type=persons`).then(r => r.json()).then(d => setPersons(d.persons || [])).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStats();
    if (section === "orgs") loadOrgs();
    if (section === "persons") loadPersons();
  }, [section]);

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
    { id: "kpi" as Section, label: "KPI", icon: "TrendingUp" },
    { id: "funnel" as Section, label: "Воронка", icon: "Filter" },
    { id: "orgs" as Section, label: "Организации", icon: "Building2" },
    { id: "persons" as Section, label: "Физлица", icon: "UserHeart" },
    { id: "goals" as Section, label: "Цели", icon: "Target" },
    { id: "campaigns" as Section, label: "Кампании", icon: "Megaphone" },
    { id: "projects" as Section, label: "Проекты", icon: "FolderOpen" },
    { id: "tasks" as Section, label: "Задачи", icon: "CheckSquare" },
    { id: "cabinet" as Section, label: "Кабинет", icon: "HeartHandshake" },
    { id: "brigade" as Section, label: "Бригада", icon: "Truck" },
    { id: "videos" as Section, label: "Видеоотчёты", icon: "Video" },
    { id: "gratitude" as Section, label: "Благодарности", icon: "Heart" },
    { id: "docs" as Section, label: "Документы", icon: "FileText" },
    { id: "qr" as Section, label: "QR", icon: "QrCode" },
  ];

  const metrics = [
    { key: "total", label: "Всего собрано", value: fmt(stats?.donations_total || 0), color: "text-green-600", border: "border-green-100", hover: "hover:bg-green-50", go: "stats" as Section },
    { key: "month", label: "За этот месяц", value: fmt(stats?.donations_month || 0), color: "text-blue-600", border: "border-blue-100", hover: "hover:bg-blue-50", go: "stats" as Section },
    { key: "orgs", label: "Организации", value: String(stats?.orgs_total || 0), color: "text-slate-700", border: "border-slate-100", hover: "hover:bg-slate-50", go: "orgs" as Section },
    { key: "persons", label: "Физлица", value: String(stats?.persons_total || 0), color: "text-slate-700", border: "border-slate-100", hover: "hover:bg-slate-50", go: "persons" as Section },
    { key: "count", label: "Пожертвований", value: String(stats?.donations_count || 0), color: "text-rose-500", border: "border-rose-100", hover: "hover:bg-rose-50", go: "stats" as Section },
  ];

  const switchSection = (id: Section) => { setSection(id); setShowForm(false); setSearch(""); };
  const currentLabel = SECTIONS.find(x => x.id === section)?.label ?? "";

  return (
    <div className="space-y-6 font-inter">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Фандрайзинг</h1>
          <p className="text-sm text-slate-500 mt-1">Пожертвования, партнёры и работа с жертвователями</p>
        </div>
        <span className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium shadow-sm">{currentLabel}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {metrics.map(m => (
          <button key={m.key} onClick={() => switchSection(m.go)} className={`bg-white p-4 rounded-2xl border shadow-sm flex flex-col items-center justify-center transition ${m.border} ${m.hover} ${m.key === "count" ? "col-span-2 md:col-span-1" : ""}`}>
            <span className={`text-2xl font-bold ${m.color}`}>{m.value}</span>
            <span className="text-xs text-slate-500 font-medium mt-1">{m.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {SECTIONS.map(x => (
            <button key={x.id} onClick={() => switchSection(x.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${section === x.id ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}>
              <Icon name={x.icon} size={14} />
              {x.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── СТАТИСТИКА ── */}
      {section === "stats" && (
        <FundraisingStats stats={stats} setSection={setSection} />
      )}

      {/* ── ОРГАНИЗАЦИИ ── */}
      {section === "orgs" && (
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
      )}

      {/* ── ФИЗЛИЦА ── */}
      {section === "persons" && (
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
      )}

      {/* ── ВОРОНКА ── */}
      {section === "funnel" && <FundraisingFunnelTab adminUsers={adminUsers} />}

      {/* ── ЦЕЛИ СБОРА ── */}
      {section === "goals" && <FundraisingGoalsTab authLogin={authLogin} authPassword={authPassword} />}

      {/* ── КАМПАНИИ ── */}
      {section === "campaigns" && <FundraisingCampaignsTab />}

      {/* ── ПРОЕКТЫ ── */}
      {section === "projects" && <FundraisingProjectsTab />}

      {/* ── ЗАДАЧИ ── */}
      {section === "tasks" && <FundraisingTasksTab />}

      {/* ── ДОКУМЕНТЫ ── */}
      {section === "cabinet" && <DonorCabinetAdmin authLogin={authLogin} authPassword={authPassword} />}
      {section === "brigade" && <BrigadeAdminTab authLogin={authLogin} authPassword={authPassword} />}
      {section === "videos" && <VideoAdminTab authLogin={authLogin} authPassword={authPassword} />}
      {section === "gratitude" && <GratitudeAdminTab authLogin={authLogin} authPassword={authPassword} />}
      {section === "docs" && <FundraisingDocsTab />}

      {/* ── KPI ── */}
      {section === "kpi" && <FundraisingKpiTab />}

      {/* ── QR-КОД ── */}
      {section === "qr" && <DonateQR />}

      {/* CRM-панель донора */}
      {donorPanel && (
        <DonorCrmPanel
          donorType={donorPanel.type}
          donorId={donorPanel.id}
          donorName={donorPanel.name}
          onClose={() => { setDonorPanel(null); loadStats(); if (section === "orgs") loadOrgs(); else loadPersons(); }}
        />
      )}
    </div>
  );
}