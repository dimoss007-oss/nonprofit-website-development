import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";

const FINANCE_STATS_URL = "https://functions.poehali.dev/db543e97-ee86-4802-9be1-5dfc071da53b";
const AUTH_URL = "https://functions.poehali.dev/42446f5d-c602-4dda-95e8-a4ca03153de0";
const LOGO_IMG = "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/4ca974da-fec3-4fd3-834d-c7dccc97fca9.jpg";
const SESSION_KEY = "finance_admin_auth";

interface MonthStats {
  month: string;
  month_label: string;
  income: number;
  expense: number;
  balance: number;
  transactions_count: number;
}

function fmt(n: number) {
  return n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function AdminFinance() {
  const [authed, setAuthed] = useState(false);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [months, setMonths] = useState<MonthStats[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved === "1") {
      setAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    fetch(FINANCE_STATS_URL)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setMonths(d.months);
      })
      .finally(() => setLoading(false));
  }, [authed]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    try {
      const r = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });
      if (r.ok) {
        sessionStorage.setItem(SESSION_KEY, "1");
        setAuthed(true);
      } else {
        setAuthError("Неверный логин или пароль");
      }
    } catch {
      setAuthError("Ошибка соединения");
    } finally {
      setAuthLoading(false);
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-beige flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-sm">
          <div className="flex justify-center mb-6">
            <img src={LOGO_IMG} alt="Логотип" className="h-14 w-auto" />
          </div>
          <h1 className="text-xl font-cormorant font-semibold text-ink text-center mb-6">
            Финансы — вход
          </h1>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Логин"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="border border-beige-dark rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage"
            />
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-beige-dark rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage"
            />
            {authError && <p className="text-red-500 text-sm">{authError}</p>}
            <button
              type="submit"
              disabled={authLoading}
              className="bg-sage text-white rounded px-4 py-2 text-sm font-medium hover:bg-sage-dark transition-colors disabled:opacity-50"
            >
              {authLoading ? "Вход..." : "Войти"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const totals = months.reduce(
    (acc, m) => ({ income: acc.income + m.income, expense: acc.expense + m.expense, balance: acc.balance + m.balance }),
    { income: 0, expense: 0, balance: 0 }
  );

  return (
    <div className="min-h-screen bg-beige">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <img src={LOGO_IMG} alt="Логотип" className="h-10 w-auto" />
            <h1 className="text-2xl font-cormorant font-semibold text-ink">Итоги по месяцам</h1>
          </div>
          <button
            onClick={() => { sessionStorage.removeItem(SESSION_KEY); setAuthed(false); }}
            className="text-sm text-muted-foreground hover:text-ink flex items-center gap-1 transition-colors"
          >
            <Icon name="LogOut" size={15} />
            Выйти
          </button>
        </div>

        {/* Карточки итого */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg p-5 shadow-sm border border-beige-dark">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Всего доходов</div>
            <div className="text-2xl font-semibold text-green-600">{fmt(totals.income)} ₽</div>
          </div>
          <div className="bg-white rounded-lg p-5 shadow-sm border border-beige-dark">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Всего расходов</div>
            <div className="text-2xl font-semibold text-red-500">{fmt(totals.expense)} ₽</div>
          </div>
          <div className="bg-white rounded-lg p-5 shadow-sm border border-beige-dark">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Общий баланс</div>
            <div className={`text-2xl font-semibold ${totals.balance >= 0 ? "text-sage" : "text-red-500"}`}>
              {totals.balance >= 0 ? "+" : ""}{fmt(totals.balance)} ₽
            </div>
          </div>
        </div>

        {/* Таблица по месяцам */}
        {loading ? (
          <div className="text-center py-16 text-muted-foreground">Загрузка...</div>
        ) : months.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">Нет данных</div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-beige-dark overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-beige-dark bg-beige/50">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Месяц</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground">Доходы</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground">Расходы</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground">Баланс</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground">Операций</th>
                </tr>
              </thead>
              <tbody>
                {months.map((m, i) => (
                  <tr key={m.month} className={`border-b border-beige-dark/50 ${i % 2 === 0 ? "" : "bg-beige/20"}`}>
                    <td className="px-5 py-3 font-medium text-ink capitalize">{m.month_label}</td>
                    <td className="px-5 py-3 text-right text-green-600">+{fmt(m.income)}</td>
                    <td className="px-5 py-3 text-right text-red-500">−{fmt(m.expense)}</td>
                    <td className={`px-5 py-3 text-right font-semibold ${m.balance >= 0 ? "text-sage" : "text-red-500"}`}>
                      {m.balance >= 0 ? "+" : ""}{fmt(m.balance)}
                    </td>
                    <td className="px-5 py-3 text-right text-muted-foreground">{m.transactions_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}