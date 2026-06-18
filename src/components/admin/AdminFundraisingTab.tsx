import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { QRCodeSVG } from "qrcode.react";
import {
  DonorType, Section, Org, Person, Stats,
  FUNDRAISING_URL, STATUS_LABELS, STATUS_COLORS, DONOR_CATEGORY_LABELS, DONOR_CATEGORY_COLORS,
  fmt, exportToCsv,
} from "./fundraising.types";
import { OrgForm, PersonForm } from "./FundraisingForms";
import { FundraisingStats } from "./FundraisingStats";
import FundraisingGoalsTab from "./FundraisingGoalsTab";
import FundraisingFunnelTab from "./FundraisingFunnelTab";
import FundraisingCampaignsTab from "./FundraisingCampaignsTab";
import FundraisingProjectsTab from "./FundraisingProjectsTab";
import FundraisingTasksTab from "./FundraisingTasksTab";
import FundraisingDocsTab from "./FundraisingDocsTab";
import FundraisingKpiTab from "./FundraisingKpiTab";
import { DonorCrmPanel } from "./DonorCrmPanel";

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
      <div className="bg-white border border-beige-dark rounded-2xl p-6 flex flex-col items-center gap-3 shadow-sm">
        <QRCodeSVG
          ref={qrRef}
          value={url}
          size={size}
          level="M"
          includeMargin={false}
          imageSettings={{ src: LOGO_URL, height: 40, width: 40, excavate: true }}
        />
        <p className="text-ink/40 text-xs text-center max-w-[200px]">{label}</p>
      </div>
      <button onClick={downloadPng}
        className="flex items-center gap-2 bg-ink text-beige px-4 py-2 rounded-xl text-sm font-semibold hover:bg-ink/90 transition-colors">
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
        <span className="text-sm text-ink/50">Размер:</span>
        <div className="flex items-center gap-1 bg-beige-mid rounded-xl p-1">
          {[200, 260, 360].map(s => (
            <button key={s} onClick={() => setSize(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${size === s ? "bg-white text-ink shadow-sm" : "text-ink/50 hover:text-ink"}`}>
              {s === 200 ? "S" : s === 260 ? "M" : "L"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div className="space-y-3">
          <h3 className="font-medium text-ink text-sm flex items-center gap-2">
            <Icon name="Globe" size={15} /> Страница пожертвований
          </h3>
          <QRCard url={DONATE_URL} label="спасениенадежды.рф/donate" filename="qr-сайт-donate.png" size={size} />
        </div>

        <div className="space-y-3">
          <h3 className="font-medium text-ink text-sm flex items-center gap-2">
            <Icon name="CreditCard" size={15} /> Прямая оплата ЮКасса
          </h3>
          <div className="flex flex-col items-center gap-3">
            <div className="bg-white border border-beige-dark rounded-2xl p-6 flex flex-col items-center gap-3 shadow-sm">
              <img
                src="https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/dc6bf240-210a-4de7-89eb-385cddae5a3c.png"
                alt="QR-код ЮКасса"
                style={{ width: size, height: size }}
                className="object-contain"
              />
              <p className="text-ink/40 text-xs text-center max-w-[200px]">Сразу открывает форму оплаты</p>
            </div>
            <a
              href="https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/dc6bf240-210a-4de7-89eb-385cddae5a3c.png"
              download="qr-юкасса-donate.png"
              className="flex items-center gap-2 bg-ink text-beige px-4 py-2 rounded-xl text-sm font-semibold hover:bg-ink/90 transition-colors"
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

export default function AdminFundraisingTab({ adminUsers }: { adminUsers: string[] }) {
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
    { id: "docs" as Section, label: "Документы", icon: "FileText" },
    { id: "qr" as Section, label: "QR", icon: "QrCode" },
  ];

  return (
    <div className="space-y-6">
      {/* Подвкладки — скролл */}
      <div className="overflow-x-auto pb-1 -mx-1 px-1">
        <div className="flex items-center gap-1 bg-beige-mid rounded-xl p-1 w-fit min-w-full sm:min-w-0">
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => { setSection(s.id); setShowForm(false); setSearch(""); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${section === s.id ? "bg-white text-ink shadow-sm" : "text-ink/50 hover:text-ink"}`}>
              <Icon name={s.icon} size={13} />
              {s.label}
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
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Поиск по названию, email, менеджеру..."
                className="w-full border border-beige-dark rounded-xl pl-9 pr-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink bg-white" />
            </div>
            <button
              onClick={() => exportToCsv(
                `организации-${new Date().toLocaleDateString("ru-RU").replace(/\./g, "-")}.csv`,
                orgs.map(o => [o.name, o.phone, o.email, o.website, o.manager, STATUS_LABELS[o.status] || o.status, String(o.total_donated), String(o.donations_count), o.notes, new Date(o.created_at).toLocaleDateString("ru-RU")]),
                ["Название", "Телефон", "Email", "Сайт", "Менеджер", "Статус", "Сумма пожертвований", "Кол-во пожертвований", "Заметки", "Дата добавления"]
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
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[org.status] ?? "bg-beige-dark text-ink/50"}`}>
                              {STATUS_LABELS[org.status]}
                            </span>
                            {org.donor_category && org.donor_category !== "donation" && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${DONOR_CATEGORY_COLORS[org.donor_category] ?? "bg-beige-dark text-ink/60"}`}>
                                {DONOR_CATEGORY_LABELS[org.donor_category]}
                              </span>
                            )}
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
                            className="flex items-center gap-1.5 text-xs text-ink/60 bg-beige-mid px-3 py-1.5 rounded-lg hover:bg-beige-dark transition-colors font-medium">
                            <Icon name="ClipboardList" size={13} />
                            CRM{org.donations_count > 0 ? ` · ${fmt(org.total_donated)}` : ""}
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
                `жертвователи-${new Date().toLocaleDateString("ru-RU").replace(/\./g, "-")}.csv`,
                persons.map(p => [p.full_name, p.phone, p.email, p.source, STATUS_LABELS[p.status] || p.status, String(p.total_donated), String(p.donations_count), p.notes, new Date(p.created_at).toLocaleDateString("ru-RU")]),
                ["ФИО", "Телефон", "Email", "Источник", "Статус", "Сумма пожертвований", "Кол-во пожертвований", "Заметки", "Дата добавления"]
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
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status] ?? "bg-beige-dark text-ink/50"}`}>
                              {STATUS_LABELS[p.status]}
                            </span>
                            {p.donor_category && p.donor_category !== "donation" && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${DONOR_CATEGORY_COLORS[p.donor_category] ?? "bg-beige-dark text-ink/60"}`}>
                                {DONOR_CATEGORY_LABELS[p.donor_category]}
                              </span>
                            )}
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
                            className="flex items-center gap-1.5 text-xs text-ink/60 bg-beige-mid px-3 py-1.5 rounded-lg hover:bg-beige-dark transition-colors font-medium">
                            <Icon name="ClipboardList" size={13} />
                            CRM{p.donations_count > 0 ? ` · ${fmt(p.total_donated)}` : ""}
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

      {/* ── ВОРОНКА ── */}
      {section === "funnel" && <FundraisingFunnelTab adminUsers={adminUsers} />}

      {/* ── ЦЕЛИ СБОРА ── */}
      {section === "goals" && <FundraisingGoalsTab />}

      {/* ── КАМПАНИИ ── */}
      {section === "campaigns" && <FundraisingCampaignsTab />}

      {/* ── ПРОЕКТЫ ── */}
      {section === "projects" && <FundraisingProjectsTab />}

      {/* ── ЗАДАЧИ ── */}
      {section === "tasks" && <FundraisingTasksTab />}

      {/* ── ДОКУМЕНТЫ ── */}
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