import { useState } from "react";
import Icon from "@/components/ui/icon";
import AdminNewsTab from "@/components/admin/AdminNewsTab";
import AdminCrmTab from "@/components/admin/AdminCrmTab";

const AUTH_URL = "https://functions.poehali.dev/a964c253-7e52-4d10-9000-b278238e84e4";
const LOGO_IMG = "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/4ca974da-fec3-4fd3-834d-c7dccc97fca9.jpg";
const SESSION_KEY = "admin_auth";

type Tab = "news" | "crm";

function LoginScreen({ onAuth }: { onAuth: () => void }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch(AUTH_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ login, password }) });
      if (res.ok) { sessionStorage.setItem(SESSION_KEY, "1"); onAuth(); }
      else setError("Неверный логин или пароль");
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
            <input type="text" value={login} onChange={(e) => setLogin(e.target.value)} placeholder="Введите логин" autoComplete="username" className="w-full border border-beige-dark rounded-xl px-4 py-3 text-ink placeholder-ink/30 focus:outline-none focus:border-ink transition-colors bg-beige/50 text-sm" required />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-ink/50 mb-2">Пароль</label>
            <div className="relative">
              <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Введите пароль" autoComplete="current-password" className="w-full border border-beige-dark rounded-xl px-4 py-3 pr-11 text-ink placeholder-ink/30 focus:outline-none focus:border-ink transition-colors bg-beige/50 text-sm" required />
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

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "crm", label: "Пациенты", icon: "Users" },
  { id: "news", label: "Новости", icon: "Newspaper" },
];

export default function AdminPanel() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");
  const [tab, setTab] = useState<Tab>("crm");

  if (!authed) return <LoginScreen onAuth={() => setAuthed(true)} />;

  const logout = () => { sessionStorage.removeItem(SESSION_KEY); setAuthed(false); };

  return (
    <div className="min-h-screen bg-beige-mid font-golos">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-beige-dark">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-3 flex-shrink-0">
            <img src={LOGO_IMG} alt="Спасение надежды" style={{ borderRadius: "50%", width: 40, height: 40, objectFit: "cover" }} />
            <div className="hidden sm:block">
              <div className="font-cormorant text-ink text-base font-semibold leading-none">Спасение надежды</div>
              <div className="text-ink/40 text-[10px] uppercase tracking-wider mt-0.5">Панель управления</div>
            </div>
          </a>

          {/* Tabs */}
          <nav className="flex items-center gap-1 bg-beige-mid rounded-xl p-1">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? "bg-white text-ink shadow-sm" : "text-ink/50 hover:text-ink"}`}
              >
                <Icon name={t.icon} size={15} />
                {t.label}
              </button>
            ))}
          </nav>

          <button onClick={logout} className="flex items-center gap-2 text-ink/50 hover:text-ink text-sm transition-colors flex-shrink-0">
            <Icon name="LogOut" size={15} />
            <span className="hidden sm:inline">Выйти</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="pt-20 pb-16 max-w-6xl mx-auto px-4">
        {tab === "news" && <AdminNewsTab />}
        {tab === "crm" && <AdminCrmTab />}
      </main>
    </div>
  );
}