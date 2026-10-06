import { useCallback, useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import CabinetLogin from "@/components/cabinet/CabinetLogin";
import CabinetOverview from "@/components/cabinet/CabinetOverview";
import CabinetAchievements from "@/components/cabinet/CabinetAchievements";
import CabinetRating from "@/components/cabinet/CabinetRating";
import CabinetYear from "@/components/cabinet/CabinetYear";
import { CabinetFeed, CabinetMessages } from "@/components/cabinet/CabinetInbox";
import { CabinetDocs, CabinetProfile } from "@/components/cabinet/CabinetProfileDocs";
import { AuthError, Overview, TOKEN_KEY, cabinetGet, cabinetPost } from "@/components/cabinet/cabinet.shared";

const LOGO_URL = "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/4ca974da-fec3-4fd3-834d-c7dccc97fca9.jpg";

const TABS = [
  { id: "overview", label: "Обзор", icon: "LayoutDashboard" },
  { id: "achievements", label: "Награды", icon: "Award" },
  { id: "messages", label: "Сообщения", icon: "Mail" },
  { id: "feed", label: "Для своих", icon: "Newspaper" },
  { id: "rating", label: "Рейтинг", icon: "Trophy" },
  { id: "year", label: "Итог года", icon: "Sparkles" },
  { id: "docs", label: "Документы", icon: "FileText" },
  { id: "profile", label: "Профиль", icon: "UserCog" },
] as const;

type TabId = typeof TABS[number]["id"];

export default function Cabinet() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(!!localStorage.getItem(TOKEN_KEY));
  const [tab, setTab] = useState<TabId>("overview");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!localStorage.getItem(TOKEN_KEY)) { setAuthed(false); setLoading(false); return; }
    try {
      setData(await cabinetGet<Overview>("overview"));
      setAuthed(true);
      setError("");
    } catch (e) {
      if (e instanceof AuthError) {
        localStorage.removeItem(TOKEN_KEY);
        setAuthed(false);
      } else {
        setError(e instanceof Error ? e.message : "Не удалось загрузить кабинет");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const logout = async () => {
    try { await cabinetPost({ action: "logout" }); } catch { /* сессия уже недействительна */ }
    localStorage.removeItem(TOKEN_KEY);
    setData(null);
    setAuthed(false);
  };

  return (
    <div className="min-h-screen bg-beige-mid">
      <header className="bg-ink text-beige">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <a href="/" className="flex items-center gap-3 min-w-0">
            <img src={LOGO_URL} alt="Спасение надежды" className="w-9 h-9 object-contain" />
            <span className="font-cormorant text-xl font-semibold truncate">Спасение надежды</span>
          </a>
          <div className="flex-1" />
          <a href="/donate" className="px-4 py-2 rounded-xl bg-sage text-white text-sm font-semibold hover:bg-sage-dark transition-colors">Помочь</a>
          {authed && data && (
            <button onClick={logout} className="p-2 rounded-lg text-beige/70 hover:text-beige hover:bg-white/10 transition-colors" title="Выйти"><Icon name="LogOut" size={18} /></button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {loading && <div className="flex justify-center py-24"><div className="w-8 h-8 border-2 border-ink border-t-transparent rounded-full animate-spin" /></div>}

        {!loading && !authed && <CabinetLogin onLoggedIn={() => { setLoading(true); load(); }} />}

        {!loading && authed && error && <p className="text-center text-red-600 bg-red-50 rounded-xl px-4 py-3 text-sm">{error}</p>}

        {!loading && authed && data && (
          <div className="space-y-6">
            <div>
              <h1 className="font-cormorant text-ink text-4xl font-semibold">Здравствуйте, {data.profile.name}</h1>
              <p className="text-sm text-ink/50 mt-1">Спасибо, что помогаете женщинам и детям обретать надежду</p>
            </div>

            <nav className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
              {TABS.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${tab === t.id ? "bg-ink text-beige" : "bg-white text-ink/60 border border-beige-dark hover:text-ink"}`}>
                  <Icon name={t.icon} size={14} />{t.label}
                  {t.id === "messages" && data.unread_messages > 0 && (
                    <span className="ml-1 min-w-[18px] h-[18px] px-1 rounded-full bg-sage text-white text-[10px] flex items-center justify-center">{data.unread_messages}</span>
                  )}
                </button>
              ))}
            </nav>

            {tab === "overview" && <CabinetOverview data={data} onGoTo={(id) => setTab(id as TabId)} />}
            {tab === "achievements" && <CabinetAchievements data={data} />}
            {tab === "messages" && <CabinetMessages onRead={load} />}
            {tab === "feed" && <CabinetFeed />}
            {tab === "rating" && <CabinetRating />}
            {tab === "year" && <CabinetYear years={data.years_available} />}
            {tab === "docs" && <CabinetDocs data={data} />}
            {tab === "profile" && <CabinetProfile data={data} onSaved={load} />}
          </div>
        )}
      </main>
    </div>
  );
}
