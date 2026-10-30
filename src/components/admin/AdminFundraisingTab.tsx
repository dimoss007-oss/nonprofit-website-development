import { useEffect, useState } from "react";
import {
  DonorType, Section, Org, Person, Stats,
  FUNDRAISING_URL,
  fmt,
} from "./fundraising.types";
import { FundraisingStats } from "./FundraisingStats";
import FundraisingGoalsTab from "./FundraisingGoalsTab";
import FundraisingFunnelTab from "./FundraisingFunnelTab";
import FundraisingCampaignsTab from "./FundraisingCampaignsTab";
import FundraisingProjectsTab from "./FundraisingProjectsTab";
import FundraisingTasksTab from "./FundraisingTasksTab";
import FundraisingDocsTab from "./FundraisingDocsTab";
import AnnualReportTab from "./AnnualReportTab";
import BrigadeAdminTab from "./BrigadeAdminTab";
import VideoAdminTab from "./VideoAdminTab";
import GratitudeAdminTab from "./GratitudeAdminTab";
import FundraisingKpiTab from "./FundraisingKpiTab";
import { DonorCrmPanel } from "./DonorCrmPanel";
import DonorCabinetAdmin from "./donorcabinet/DonorCabinetAdmin";
import { DonateQR } from "./DonateQR";
import { FundraisingOrgsSection } from "./FundraisingOrgsSection";
import { FundraisingPersonsSection } from "./FundraisingPersonsSection";
import { FundraisingNav } from "./FundraisingNav";

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
    { id: "annual" as Section, label: "Годовые отчёты", icon: "FileBarChart" },
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
      <FundraisingNav
        metrics={metrics}
        sections={SECTIONS}
        section={section}
        currentLabel={currentLabel}
        switchSection={switchSection}
      />

      {/* ── СТАТИСТИКА ── */}
      {section === "stats" && (
        <FundraisingStats stats={stats} setSection={setSection} />
      )}

      {/* ── ОРГАНИЗАЦИИ ── */}
      {section === "orgs" && (
        <FundraisingOrgsSection
          adminUsers={adminUsers}
          users={users}
          orgs={orgs}
          filteredOrgs={filteredOrgs}
          loading={loading}
          search={search}
          setSearch={setSearch}
          showForm={showForm}
          setShowForm={setShowForm}
          editOrg={editOrg}
          setEditOrg={setEditOrg}
          saveOrg={saveOrg}
          deleteOrg={deleteOrg}
          setDonorPanel={setDonorPanel}
        />
      )}

      {/* ── ФИЗЛИЦА ── */}
      {section === "persons" && (
        <FundraisingPersonsSection
          users={users}
          persons={persons}
          filteredPersons={filteredPersons}
          loading={loading}
          search={search}
          setSearch={setSearch}
          showForm={showForm}
          setShowForm={setShowForm}
          editPerson={editPerson}
          setEditPerson={setEditPerson}
          savePerson={savePerson}
          deletePerson={deletePerson}
          setDonorPanel={setDonorPanel}
        />
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
      {section === "annual" && <AnnualReportTab authLogin={authLogin} authPassword={authPassword} />}
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