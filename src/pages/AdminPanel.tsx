import { useState, useEffect, useRef, useLayoutEffect } from "react";
import Icon from "@/components/ui/icon";
import AdminNewsTab from "@/components/admin/AdminNewsTab";
import AdminCrmTab from "@/components/admin/AdminCrmTab";
import AdminSopTab from "@/components/admin/AdminSopTab";
import AdminUsersTab, { parsePermissions, ALL_TABS, type TabId } from "@/components/admin/AdminUsersTab";
import AdminTasksTab from "@/components/admin/AdminTasksTab";
import AdminRequestsTab from "@/components/admin/AdminRequestsTab";
import AdminGalleryTab from "@/components/admin/AdminGalleryTab";
import AdminFundraisingTab from "@/components/admin/AdminFundraisingTab";
import AdminGovTab from "@/components/admin/AdminGovTab";
import AdminShiftLogsTab from "@/components/admin/AdminShiftLogsTab";
import AdminTasksWidget from "@/components/admin/AdminTasksWidget";
import AdminResidentsYearWidget from "@/components/admin/AdminResidentsYearWidget";
import PasswordResetForm from "@/components/admin/PasswordResetForm";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminAiSettingsTab from "@/components/admin/AdminAiSettingsTab";
import AdminHeader from "@/components/admin/AdminHeader";
import AiChatModal from "@/components/admin/AiChatModal";
import type { Task } from "@/components/admin/taskTypes";

const AUTH_URL = "https://functions.poehali.dev/e6567f16-b3db-4b0d-9c1f-abed808c2ac8";
const LOGO_IMG = "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/4ca974da-fec3-4fd3-834d-c7dccc97fca9.jpg";
const SESSION_KEY = "admin_auth";

type Tab = TabId | "ai_settings" | "dashboard";
type Role = "admin" | "user";

interface Session { login: string; password: string; role: Role; full_name: string; permissions?: string | null }
interface AdminUser { login: string; full_name?: string }

function LoginScreen({ onAuth }: { onAuth: (s: Session) => void }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [resetMode, setResetMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch(AUTH_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "login", login, password }) });
      const d = await res.json();
      if (d.ok) {
        const session: Session = { login, password, role: d.role, full_name: d.full_name, permissions: d.permissions ?? null };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
        onAuth(session);
      } else { setError("Неверный логин или пароль"); }
    } catch { setError("Ошибка соединения. Попробуйте снова."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-beige-mid font-golos flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src={LOGO_IMG} alt="Спасение надежды" style={{ borderRadius: "50%", width: 64, height: 64, objectFit: "cover", margin: "0 auto 16px" }} />
          <div className="font-cormorant text-ink text-2xl font-semibold">Спасение надежды</div>
          <div className="text-ink/40 text-xs uppercase tracking-widest mt-1">Панель управления</div>
        </div>
        {resetMode ? <PasswordResetForm initialLogin={login} onBack={() => setResetMode(false)} /> : (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-ink/50 mb-2">Логин</label>
            <input type="text" value={login} onChange={e => setLogin(e.target.value)} placeholder="Введите логин" autoComplete="username" className="w-full border border-beige-dark rounded-xl px-4 py-3 text-ink placeholder-ink/30 focus:outline-none focus:border-ink transition-colors bg-beige/50 text-sm" required />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-ink/50 mb-2">Пароль</label>
            <div className="relative">
              <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Введите пароль" autoComplete="current-password" className="w-full border border-beige-dark rounded-xl px-4 py-3 pr-11 text-ink placeholder-ink/30 focus:outline-none focus:border-ink transition-colors bg-beige/50 text-sm" required />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/60 transition-colors">
                <Icon name={showPass ? "EyeOff" : "Eye"} size={16} />
              </button>
            </div>
          </div>
          {error && <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl"><Icon name="AlertCircle" size={14} />{error}</div>}
          <button type="submit" disabled={loading} className="w-full bg-ink text-beige py-3.5 rounded-xl font-semibold text-sm hover:bg-ink/90 transition-colors disabled:opacity-60">
            {loading ? "Проверяем..." : "Войти"}
          </button>
          <button type="button" onClick={() => setResetMode(true)} className="w-full text-xs text-ink/50 hover:text-ink transition-colors">
            Забыли пароль?
          </button>
        </form>
        )}
        <div className="text-center mt-6">
          <a href="/" className="text-ink/40 hover:text-ink/70 text-sm transition-colors">← На главную</a>
        </div>
      </div>
    </div>
  );
}

function getSession(): Session | null {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null"); }
  catch { return null; }
}

export default function AdminPanel() {
  const [session, setSession] = useState<Session | null>(() => getSession());
  const [tab, setTab] = useState<Tab>("tasks");
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [focusGovId, setFocusGovId] = useState<number | null>(null);
  const [focusPatientId, setFocusPatientId] = useState<number | null>(null);
  const [shiftFilterPatientId, setShiftFilterPatientId] = useState<number | null>(null);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(112);

  const goToPatient = (patientId: number) => {
    setFocusPatientId(patientId);
    setTab("crm");
  };

  const goToShiftHistory = (patientId: number) => {
    setShiftFilterPatientId(patientId);
    setTab("shifts");
  };

  const goToTaskLink = (task: Task) => {
    if (task.link_type === "gov_agency" && task.link_id) {
      setFocusGovId(task.link_id);
      setTab("gov");
    }
  };

  useEffect(() => {
    if (!session || session.role === "admin") return;
    if (tab === "ai_settings" || tab === "dashboard") {
      setTab("tasks");
      return;
    }
    const perms = parsePermissions(session.permissions);
    if (perms && !perms.includes(tab)) {
      const first = ALL_TABS.find(t => perms.includes(t.id));
      if (first) setTab(first.id);
    }
  }, [session?.login]);

  useEffect(() => {
    if (!session) return;
    fetch(AUTH_URL, { method: "GET" })
      .then(r => r.json())
      .then(d => {
        const users: AdminUser[] = (d.users || []).map((u: { login: string; full_name?: string }) => ({ login: u.login, full_name: u.full_name }));
        setAdminUsers([{ login: session.login, full_name: session.full_name }, ...users.filter(u => u.login !== session.login)]);
      })
      .catch(() => setAdminUsers([{ login: session.login, full_name: session.full_name }]));
  }, [session?.login]);

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () => setHeaderHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => { ro.disconnect(); window.removeEventListener("resize", update); };
  }, [session]);

  if (!session) return <LoginScreen onAuth={s => setSession(s)} />;

  const logout = () => { sessionStorage.removeItem(SESSION_KEY); setSession(null); };
  const isAdmin = session.role === "admin";
  const userPerms = parsePermissions(session.permissions);

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "dashboard",   label: "Дашборд",       icon: "LayoutDashboard" },
    { id: "crm",         label: "Семьи",         icon: "Users" },
    { id: "shifts",      label: "Журнал",        icon: "Clock" },
    { id: "tasks",       label: "Задачи",        icon: "ClipboardList" },
    { id: "requests",    label: "Заявки",        icon: "Inbox" },
    { id: "fundraising", label: "Фандрайзинг",   icon: "HandCoins" },
    { id: "sop",         label: "СОП",           icon: "ShieldAlert" },
    { id: "gov",         label: "Госорганы",     icon: "Landmark" },
    { id: "news",        label: "Новости",       icon: "Newspaper" },
    { id: "gallery",     label: "Галерея",       icon: "Images" },
    { id: "users",       label: "Сотрудники",    icon: "UserCog" },
    { id: "ai_settings", label: "Настройки ИИ",  icon: "BrainCircuit" },
  ];

  const visibleTabs = isAdmin
    ? TABS
    : TABS.filter(t => t.id !== "ai_settings" && t.id !== "dashboard" && (userPerms ? userPerms.includes(t.id as TabId) : true));
  const pick = (ids: string[]) => ids.map(id => visibleTabs.find(t => t.id === id)).filter(Boolean) as typeof TABS;

  return (
    <div className="min-h-screen bg-slate-50 font-inter text-slate-800">
      <AdminHeader
        headerRef={headerRef}
        logo={LOGO_IMG}
        fullName={session.full_name || session.login}
        isAdmin={isAdmin}
        tab={tab}
        mainTabs={pick(["dashboard", "crm", "shifts", "tasks", "requests", "fundraising"])}
        refTabs={pick(["sop", "gov", "news", "gallery"])}
        settingsTabs={pick(["users", "ai_settings"])}
        onSelect={id => setTab(id as Tab)}
        onAi={() => setAiChatOpen(true)}
        onLogout={logout}
      />

      <main className="pb-16 max-w-7xl mx-auto px-4 sm:px-6" style={{ paddingTop: headerHeight + 16 }}>
        {tab === "dashboard" && isAdmin && <AdminDashboard />}
        {tab === "crm" && <AdminCrmTab isAdmin={isAdmin} authorName={session.full_name || session.login} focusPatientId={focusPatientId} onFocusHandled={() => setFocusPatientId(null)} onViewShiftHistory={goToShiftHistory} />}
        {tab === "sop" && <AdminSopTab isAdmin={isAdmin} />}
        {tab === "news" && <AdminNewsTab isAdmin={isAdmin} />}
        {tab === "tasks" && (
          <div className="space-y-6">
            <AdminResidentsYearWidget />
            {isAdmin && (
              <AdminTasksWidget
                onGoToTasks={() => setTab("tasks")}
                users={adminUsers}
              />
            )}
            <AdminTasksTab
              session={{ login: session.login, full_name: session.full_name }}
              isAdmin={isAdmin}
              users={adminUsers}
              onGoToLink={goToTaskLink}
            />
          </div>
        )}
        {tab === "requests" && <AdminRequestsTab isAdmin={isAdmin} />}
        {tab === "users" && <AdminUsersTab authLogin={session.login} authPassword={session.password} isAdmin={isAdmin} />}
        {tab === "gallery" && <AdminGalleryTab />}
        {tab === "fundraising" && <AdminFundraisingTab adminUsers={adminUsers.map(u => u.full_name || u.login)} users={adminUsers} authLogin={session.login} authPassword={session.password} />}
        {tab === "gov" && <AdminGovTab focusAgencyId={focusGovId} onFocusHandled={() => setFocusGovId(null)} users={adminUsers} />}
        {tab === "shifts" && <AdminShiftLogsTab onSelectPatient={goToPatient} filterPatientId={shiftFilterPatientId} onClearFilter={() => setShiftFilterPatientId(null)} />}
        {tab === "ai_settings" && <AdminAiSettingsTab isAdmin={isAdmin} authLogin={session.login} authPassword={session.password} />}
      </main>

      {isAdmin && (
        <AiChatModal open={aiChatOpen} onClose={() => setAiChatOpen(false)} authLogin={session.login} authPassword={session.password} />
      )}
    </div>
  );
}