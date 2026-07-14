import { useState, useEffect } from "react";
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
import AdminTasksWidget from "@/components/admin/AdminTasksWidget";
import type { Task } from "@/components/admin/taskTypes";

const AUTH_URL = "https://functions.poehali.dev/e6567f16-b3db-4b0d-9c1f-abed808c2ac8";
const LOGO_IMG = "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/4ca974da-fec3-4fd3-834d-c7dccc97fca9.jpg";
const SESSION_KEY = "admin_auth";

type Tab = TabId;
type Role = "admin" | "user";

interface Session { login: string; password: string; role: Role; full_name: string; permissions?: string | null }
interface AdminUser { login: string; full_name?: string }

function LoginScreen({ onAuth }: { onAuth: (s: Session) => void }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

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
        </form>
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

  const goToTaskLink = (task: Task) => {
    if (task.link_type === "gov_agency" && task.link_id) {
      setFocusGovId(task.link_id);
      setTab("gov");
    }
  };

  useEffect(() => {
    if (!session || session.role === "admin") return;
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

  if (!session) return <LoginScreen onAuth={s => setSession(s)} />;

  const logout = () => { sessionStorage.removeItem(SESSION_KEY); setSession(null); };
  const isAdmin = session.role === "admin";
  const userPerms = parsePermissions(session.permissions);

  const TABS: { id: Tab; label: string; icon: string; active: string; inactive: string }[] = [
    { id: "crm",         label: "Пациенты",     icon: "Users",         active: "bg-blue-100 text-blue-700 shadow-sm",     inactive: "text-blue-400 hover:bg-blue-50 hover:text-blue-600" },
    { id: "sop",         label: "СОП",           icon: "ShieldAlert",   active: "bg-red-100 text-red-700 shadow-sm",       inactive: "text-red-400 hover:bg-red-50 hover:text-red-600" },
    { id: "news",        label: "Новости",       icon: "Newspaper",     active: "bg-amber-100 text-amber-700 shadow-sm",   inactive: "text-amber-400 hover:bg-amber-50 hover:text-amber-600" },
    { id: "tasks",       label: "Задачи",        icon: "ClipboardList", active: "bg-violet-100 text-violet-700 shadow-sm", inactive: "text-violet-400 hover:bg-violet-50 hover:text-violet-600" },
    { id: "requests",    label: "Заявки",        icon: "Inbox",         active: "bg-rose-100 text-rose-700 shadow-sm",     inactive: "text-rose-400 hover:bg-rose-50 hover:text-rose-600" },
    { id: "users",       label: "Сотрудники",    icon: "UserCog",       active: "bg-sage-pale text-sage-dark shadow-sm",   inactive: "text-sage hover:bg-sage-pale/50 hover:text-sage-dark" },
    { id: "gallery",     label: "Галерея",       icon: "Images",        active: "bg-orange-100 text-orange-700 shadow-sm", inactive: "text-orange-400 hover:bg-orange-50 hover:text-orange-600" },
    { id: "fundraising", label: "Фандрайзинг",   icon: "HandCoins",     active: "bg-green-100 text-green-700 shadow-sm",   inactive: "text-green-500 hover:bg-green-50 hover:text-green-700" },
    { id: "gov",         label: "Госорганы",     icon: "Landmark",      active: "bg-slate-100 text-slate-700 shadow-sm",   inactive: "text-slate-400 hover:bg-slate-50 hover:text-slate-600" },
  ];

  const visibleTabs = isAdmin
    ? TABS
    : TABS.filter(t => userPerms ? userPerms.includes(t.id) : true);

  return (
    <div className="min-h-screen bg-beige-mid font-golos">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-beige-dark">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-3 flex-shrink-0">
            <img src={LOGO_IMG} alt="Спасение надежды" style={{ borderRadius: "50%", width: 40, height: 40, objectFit: "cover" }} />
            <div className="hidden sm:block">
              <div className="font-cormorant text-ink text-base font-semibold leading-none">Спасение надежды</div>
              <div className="text-ink/40 text-[10px] uppercase tracking-wider mt-0.5">Панель управления</div>
            </div>
          </a>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-2 text-xs text-ink/40">
              <span>{session.full_name}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${isAdmin ? "bg-ink text-beige" : "bg-beige-dark text-ink"}`}>
                {isAdmin ? "Администратор" : "Пользователь"}
              </span>
            </div>
            <button onClick={logout} className="flex items-center gap-2 text-ink/50 hover:text-ink text-sm transition-colors">
              <Icon name="LogOut" size={15} />
              <span className="hidden sm:inline">Выйти</span>
            </button>
          </div>
        </div>
        <div className="border-t border-beige-dark/50 bg-white">
          <div className="max-w-6xl mx-auto px-4 py-1.5">
            <nav className="flex items-center gap-1 flex-wrap">
              {visibleTabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t.id ? t.active : t.inactive}`}>
                  <Icon name={t.icon} size={14} />
                  {t.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="pt-28 pb-16 max-w-6xl mx-auto px-4">
        {tab === "crm" && <AdminCrmTab isAdmin={isAdmin} />}
        {tab === "sop" && <AdminSopTab isAdmin={isAdmin} />}
        {tab === "news" && <AdminNewsTab isAdmin={isAdmin} />}
        {tab === "tasks" && (
          <div className="space-y-6">
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
        {tab === "fundraising" && <AdminFundraisingTab adminUsers={adminUsers.map(u => u.full_name || u.login)} users={adminUsers} />}
        {tab === "gov" && <AdminGovTab focusAgencyId={focusGovId} onFocusHandled={() => setFocusGovId(null)} users={adminUsers} />}
      </main>
    </div>
  );
}