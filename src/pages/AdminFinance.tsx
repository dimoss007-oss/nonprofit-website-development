import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";

const FINANCE_STATS_URL = "https://functions.poehali.dev/db543e97-ee86-4802-9be1-5dfc071da53b";
const FINANCE_TX_URL = "https://functions.poehali.dev/c443f063-9d2e-4815-875f-3ddfb3d28e4f";
const FINANCE_DELETE_URL = "https://functions.poehali.dev/5a30b7f7-b1b4-4966-8b0f-47e8184e56e7";
const FINANCE_ADD_URL = "https://functions.poehali.dev/d9876769-0e63-4650-93e4-562a00f11c15";
const FINANCE_CAT_URL = "https://functions.poehali.dev/997daeb8-44e8-44b1-b7f2-cea1a4aa51bf";
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

interface Transaction {
  id: number;
  type: "income" | "expense";
  amount: number;
  description: string | null;
  category: string | null;
  created_at: string;
}

interface Category {
  id: number;
  name: string;
  type: "income" | "expense";
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

  const [tab, setTab] = useState<"stats" | "categories">("stats");

  const [months, setMonths] = useState<MonthStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Record<string, Transaction[]>>({});
  const [txLoading, setTxLoading] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState<"income" | "expense">("income");
  const [catSaving, setCatSaving] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addType, setAddType] = useState<"income" | "expense">("income");
  const [addAmount, setAddAmount] = useState("");
  const [addDesc, setAddDesc] = useState("");
  const [addCategory, setAddCategory] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "1") setAuthed(true);
  }, []);

  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    fetch(FINANCE_STATS_URL)
      .then((r) => r.json())
      .then((d) => { if (d.ok) setMonths(d.months); })
      .finally(() => setLoading(false));
    loadCategories();
  }, [authed]);

  function loadCategories() {
    setCatLoading(true);
    fetch(FINANCE_CAT_URL)
      .then((r) => r.json())
      .then((d) => { if (d.ok) setCategories(d.categories); })
      .finally(() => setCatLoading(false));
  }

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

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCatSaving(true);
    const r = await fetch(FINANCE_CAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCatName.trim(), type: newCatType }),
    });
    const d = await r.json();
    if (d.ok) {
      setCategories((prev) => [...prev, { id: d.id, name: newCatName.trim(), type: newCatType }]);
      setNewCatName("");
    }
    setCatSaving(false);
  }

  async function handleDeleteCategory(id: number) {
    if (!confirm("Удалить категорию?")) return;
    await fetch(FINANCE_CAT_URL, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addAmount || isNaN(Number(addAmount))) { setAddError("Введите корректную сумму"); return; }
    setAddLoading(true);
    setAddError("");
    try {
      const r = await fetch(FINANCE_ADD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: addType, amount: Number(addAmount), description: addDesc, category: addCategory }),
      });
      const d = await r.json();
      if (!d.ok) { setAddError("Ошибка сохранения"); return; }

      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const newTx: Transaction = { id: d.id, type: addType, amount: Number(addAmount), description: addDesc || null, category: addCategory || null, created_at: d.created_at };

      if (transactions[month]) {
        setTransactions((prev) => ({ ...prev, [month]: [newTx, ...prev[month]] }));
      }
      setMonths((prev) => {
        const exists = prev.find((m) => m.month === month);
        if (!exists) return prev;
        const income = exists.income + (addType === "income" ? newTx.amount : 0);
        const expense = exists.expense + (addType === "expense" ? newTx.amount : 0);
        return prev.map((m) => m.month === month ? { ...m, income, expense, balance: income - expense, transactions_count: m.transactions_count + 1 } : m);
      });

      setAddAmount("");
      setAddDesc("");
      setAddCategory("");
      setShowAddForm(false);
    } finally {
      setAddLoading(false);
    }
  }

  async function deleteTransaction(id: number, month: string) {
    if (!confirm("Удалить эту операцию?")) return;
    await fetch(FINANCE_DELETE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setTransactions((prev) => ({
      ...prev,
      [month]: (prev[month] || []).filter((tx) => tx.id !== id),
    }));
    setMonths((prev) =>
      prev.map((m) => {
        if (m.month !== month) return m;
        const tx = transactions[month]?.find((t) => t.id === id);
        if (!tx) return m;
        const income = m.income - (tx.type === "income" ? tx.amount : 0);
        const expense = m.expense - (tx.type === "expense" ? tx.amount : 0);
        return { ...m, income, expense, balance: income - expense, transactions_count: m.transactions_count - 1 };
      })
    );
  }

  async function toggleMonth(month: string) {
    if (expandedMonth === month) { setExpandedMonth(null); return; }
    setExpandedMonth(month);
    if (transactions[month]) return;
    setTxLoading(month);
    try {
      const r = await fetch(`${FINANCE_TX_URL}?month=${month}`);
      const d = await r.json();
      if (d.ok) setTransactions((prev) => ({ ...prev, [month]: d.transactions }));
    } finally {
      setTxLoading(null);
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-beige flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-sm">
          <div className="flex justify-center mb-6">
            <img src={LOGO_IMG} alt="Логотип" className="h-14 w-auto" />
          </div>
          <h1 className="text-xl font-cormorant font-semibold text-ink text-center mb-6">Финансы — вход</h1>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input type="text" placeholder="Логин" value={login} onChange={(e) => setLogin(e.target.value)}
              className="border border-beige-dark rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage" />
            <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)}
              className="border border-beige-dark rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage" />
            {authError && <p className="text-red-500 text-sm">{authError}</p>}
            <button type="submit" disabled={authLoading}
              className="bg-sage text-white rounded px-4 py-2 text-sm font-medium hover:bg-sage-dark transition-colors disabled:opacity-50">
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

  const filteredCats = categories.filter((c) => c.type === addType);
  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");

  return (
    <div className="min-h-screen bg-beige">
      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Шапка */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img src={LOGO_IMG} alt="Логотип" className="h-10 w-auto" />
            <h1 className="text-2xl font-cormorant font-semibold text-ink">Финансы</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { setShowAddForm(true); setAddError(""); }}
              className="text-sm bg-sage text-white rounded px-3 py-1.5 flex items-center gap-1.5 hover:bg-sage-dark transition-colors">
              <Icon name="Plus" size={14} />
              Добавить
            </button>
            <button onClick={() => { sessionStorage.removeItem(SESSION_KEY); setAuthed(false); }}
              className="text-sm text-muted-foreground hover:text-ink flex items-center gap-1 transition-colors">
              <Icon name="LogOut" size={15} />
              Выйти
            </button>
          </div>
        </div>

        {/* Вкладки */}
        <div className="flex gap-1 mb-6 bg-white rounded-lg p-1 shadow-sm border border-beige-dark w-fit">
          <button onClick={() => setTab("stats")}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${tab === "stats" ? "bg-sage text-white" : "text-muted-foreground hover:text-ink"}`}>
            Статистика
          </button>
          <button onClick={() => setTab("categories")}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${tab === "categories" ? "bg-sage text-white" : "text-muted-foreground hover:text-ink"}`}>
            Категории
          </button>
        </div>

        {/* ===== ВКЛАДКА СТАТИСТИКА ===== */}
        {tab === "stats" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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

            {loading ? (
              <div className="text-center py-16 text-muted-foreground">Загрузка...</div>
            ) : months.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">Нет данных</div>
            ) : (
              <div className="flex flex-col gap-3">
                {months.map((m) => {
                  const isOpen = expandedMonth === m.month;
                  const txList = transactions[m.month] || [];
                  const isLoadingTx = txLoading === m.month;

                  return (
                    <div key={m.month} className="bg-white rounded-lg shadow-sm border border-beige-dark overflow-hidden">
                      <button onClick={() => toggleMonth(m.month)}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-beige/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <span className="font-medium text-ink capitalize w-28 text-left">{m.month_label}</span>
                          <span className="text-green-600 text-sm">+{fmt(m.income)}</span>
                          <span className="text-red-500 text-sm">−{fmt(m.expense)}</span>
                          <span className={`font-semibold text-sm ${m.balance >= 0 ? "text-sage" : "text-red-500"}`}>
                            = {m.balance >= 0 ? "+" : ""}{fmt(m.balance)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground text-sm">
                          <span>{m.transactions_count} оп.</span>
                          <Icon name={isOpen ? "ChevronUp" : "ChevronDown"} size={16} />
                        </div>
                      </button>

                      {isOpen && (
                        <div className="border-t border-beige-dark">
                          {isLoadingTx ? (
                            <div className="text-center py-6 text-muted-foreground text-sm">Загрузка...</div>
                          ) : txList.length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground text-sm">Нет операций</div>
                          ) : (
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-beige/40 border-b border-beige-dark">
                                  <th className="text-left px-5 py-2 font-medium text-muted-foreground">Дата</th>
                                  <th className="text-left px-5 py-2 font-medium text-muted-foreground">Категория</th>
                                  <th className="text-left px-5 py-2 font-medium text-muted-foreground">Описание</th>
                                  <th className="text-right px-5 py-2 font-medium text-muted-foreground">Сумма</th>
                                  <th className="w-10"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {txList.map((tx, i) => (
                                  <tr key={tx.id} className={`border-b border-beige-dark/30 group ${i % 2 === 0 ? "" : "bg-beige/10"}`}>
                                    <td className="px-5 py-2 text-muted-foreground whitespace-nowrap">{tx.created_at}</td>
                                    <td className="px-5 py-2">
                                      {tx.category
                                        ? <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tx.type === "income" ? "bg-green-100 text-green-700" : "bg-red-50 text-red-600"}`}>{tx.category}</span>
                                        : <span className="text-muted-foreground text-xs">—</span>}
                                    </td>
                                    <td className="px-5 py-2 text-ink">{tx.description || <span className="text-muted-foreground italic">без описания</span>}</td>
                                    <td className={`px-5 py-2 text-right font-medium ${tx.type === "income" ? "text-green-600" : "text-red-500"}`}>
                                      {tx.type === "income" ? "+" : "−"}{fmt(tx.amount)} ₽
                                    </td>
                                    <td className="pr-3 py-2 text-right">
                                      <button onClick={() => deleteTransaction(tx.id, m.month)}
                                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all" title="Удалить">
                                        <Icon name="Trash2" size={14} />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ===== ВКЛАДКА КАТЕГОРИИ ===== */}
        {tab === "categories" && (
          <div className="flex flex-col gap-6">
            {/* Форма добавления */}
            <div className="bg-white rounded-lg shadow-sm border border-beige-dark p-5">
              <h2 className="font-medium text-ink mb-4">Новая категория</h2>
              <form onSubmit={handleAddCategory} className="flex gap-2 flex-wrap">
                <div className="flex rounded overflow-hidden border border-beige-dark text-sm">
                  <button type="button" onClick={() => setNewCatType("income")}
                    className={`px-3 py-2 transition-colors ${newCatType === "income" ? "bg-green-100 text-green-700 font-medium" : "text-muted-foreground hover:bg-beige"}`}>
                    Доход
                  </button>
                  <button type="button" onClick={() => setNewCatType("expense")}
                    className={`px-3 py-2 transition-colors ${newCatType === "expense" ? "bg-red-50 text-red-600 font-medium" : "text-muted-foreground hover:bg-beige"}`}>
                    Расход
                  </button>
                </div>
                <input type="text" placeholder="Название категории" value={newCatName} onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 min-w-40 border border-beige-dark rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage" />
                <button type="submit" disabled={catSaving || !newCatName.trim()}
                  className="bg-sage text-white rounded px-4 py-2 text-sm font-medium hover:bg-sage-dark transition-colors disabled:opacity-50 flex items-center gap-1.5">
                  <Icon name="Plus" size={14} />
                  Добавить
                </button>
              </form>
            </div>

            {catLoading ? (
              <div className="text-center py-10 text-muted-foreground">Загрузка...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Доходы */}
                <div className="bg-white rounded-lg shadow-sm border border-beige-dark overflow-hidden">
                  <div className="px-5 py-3 bg-green-50 border-b border-beige-dark">
                    <span className="text-sm font-medium text-green-700">Доходы</span>
                  </div>
                  {incomeCategories.length === 0 ? (
                    <div className="px-5 py-6 text-sm text-muted-foreground italic">Нет категорий</div>
                  ) : (
                    <ul>
                      {incomeCategories.map((c, i) => (
                        <li key={c.id} className={`flex items-center justify-between px-5 py-2.5 group ${i % 2 === 0 ? "" : "bg-beige/20"}`}>
                          <span className="text-sm text-ink">{c.name}</span>
                          <button onClick={() => handleDeleteCategory(c.id)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all">
                            <Icon name="Trash2" size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Расходы */}
                <div className="bg-white rounded-lg shadow-sm border border-beige-dark overflow-hidden">
                  <div className="px-5 py-3 bg-red-50 border-b border-beige-dark">
                    <span className="text-sm font-medium text-red-600">Расходы</span>
                  </div>
                  {expenseCategories.length === 0 ? (
                    <div className="px-5 py-6 text-sm text-muted-foreground italic">Нет категорий</div>
                  ) : (
                    <ul>
                      {expenseCategories.map((c, i) => (
                        <li key={c.id} className={`flex items-center justify-between px-5 py-2.5 group ${i % 2 === 0 ? "" : "bg-beige/20"}`}>
                          <span className="text-sm text-ink">{c.name}</span>
                          <button onClick={() => handleDeleteCategory(c.id)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all">
                            <Icon name="Trash2" size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Модальная форма добавления операции */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-cormorant font-semibold text-ink">Новая операция</h2>
              <button onClick={() => setShowAddForm(false)} className="text-muted-foreground hover:text-ink">
                <Icon name="X" size={18} />
              </button>
            </div>
            <form onSubmit={handleAdd} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => { setAddType("income"); setAddCategory(""); }}
                  className={`rounded py-2 text-sm font-medium transition-colors ${addType === "income" ? "bg-green-100 text-green-700 border-2 border-green-400" : "bg-beige border-2 border-transparent text-muted-foreground"}`}>
                  + Доход
                </button>
                <button type="button" onClick={() => { setAddType("expense"); setAddCategory(""); }}
                  className={`rounded py-2 text-sm font-medium transition-colors ${addType === "expense" ? "bg-red-50 text-red-600 border-2 border-red-400" : "bg-beige border-2 border-transparent text-muted-foreground"}`}>
                  − Расход
                </button>
              </div>
              <input type="number" placeholder="Сумма, ₽" value={addAmount} onChange={(e) => setAddAmount(e.target.value)}
                min="0" step="any"
                className="border border-beige-dark rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage" />
              <select value={addCategory} onChange={(e) => setAddCategory(e.target.value)}
                className="border border-beige-dark rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage text-ink bg-white">
                <option value="">— Без категории —</option>
                {filteredCats.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
              <input type="text" placeholder="Описание (необязательно)" value={addDesc} onChange={(e) => setAddDesc(e.target.value)}
                className="border border-beige-dark rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage" />
              {addError && <p className="text-red-500 text-sm">{addError}</p>}
              <button type="submit" disabled={addLoading}
                className="bg-sage text-white rounded px-4 py-2 text-sm font-medium hover:bg-sage-dark transition-colors disabled:opacity-50">
                {addLoading ? "Сохранение..." : "Сохранить"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
