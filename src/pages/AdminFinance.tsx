import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import FinanceLogin from "@/components/finance/FinanceLogin";
import FinanceStats from "@/components/finance/FinanceStats";
import FinanceCategories from "@/components/finance/FinanceCategories";
import FinanceAddModal from "@/components/finance/FinanceAddModal";
import { MonthStats, Transaction, Category, LOGO_IMG } from "@/components/finance/financeTypes";

const FINANCE_STATS_URL = "https://functions.poehali.dev/db543e97-ee86-4802-9be1-5dfc071da53b";
const FINANCE_TX_URL = "https://functions.poehali.dev/c443f063-9d2e-4815-875f-3ddfb3d28e4f";
const FINANCE_DELETE_URL = "https://functions.poehali.dev/5a30b7f7-b1b4-4966-8b0f-47e8184e56e7";
const FINANCE_ADD_URL = "https://functions.poehali.dev/d9876769-0e63-4650-93e4-562a00f11c15";
const FINANCE_CAT_URL = "https://functions.poehali.dev/997daeb8-44e8-44b1-b7f2-cea1a4aa51bf";
const AUTH_URL = "https://functions.poehali.dev/42446f5d-c602-4dda-95e8-a4ca03153de0";
const SESSION_KEY = "finance_admin_auth";

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

  async function handleAddCategory(name: string, type: "income" | "expense") {
    const r = await fetch(FINANCE_CAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type }),
    });
    const d = await r.json();
    if (d.ok) {
      setCategories((prev) => [...prev, { id: d.id, name, type }]);
    }
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

  async function handleChangeTransactionCategory(id: number, month: string, category: string) {
    await fetch(FINANCE_ADD_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, category }),
    });
    setTransactions((prev) => ({
      ...prev,
      [month]: (prev[month] || []).map((tx) => tx.id === id ? { ...tx, category: category || null } : tx),
    }));
  }

  async function handleRenameCategory(id: number, name: string, type: "income" | "expense") {
    await fetch(FINANCE_CAT_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name, type }),
    });
    setCategories((prev) => prev.map((c) => c.id === id ? { ...c, name, type } : c));
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
      <FinanceLogin
        login={login}
        password={password}
        authError={authError}
        authLoading={authLoading}
        onLoginChange={setLogin}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
      />
    );
  }

  const totals = months.reduce(
    (acc, m) => ({ income: acc.income + m.income, expense: acc.expense + m.expense, balance: acc.balance + m.balance }),
    { income: 0, expense: 0, balance: 0 }
  );

  const filteredCats = categories.filter((c) => c.type === addType);

  return (
    <div className="min-h-screen bg-beige">
      <div className="max-w-4xl mx-auto px-4 py-10">

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

        {tab === "stats" && (
          <FinanceStats
            loading={loading}
            months={months}
            totals={totals}
            expandedMonth={expandedMonth}
            transactions={transactions}
            txLoading={txLoading}
            categories={categories}
            onToggleMonth={toggleMonth}
            onDeleteTransaction={deleteTransaction}
            onChangeCategory={handleChangeTransactionCategory}
          />
        )}

        {tab === "categories" && (
          <FinanceCategories
            categories={categories}
            catLoading={catLoading}
            onAdd={handleAddCategory}
            onDelete={handleDeleteCategory}
            onRename={handleRenameCategory}
          />
        )}
      </div>

      {showAddForm && (
        <FinanceAddModal
          addType={addType}
          addAmount={addAmount}
          addDesc={addDesc}
          addCategory={addCategory}
          addLoading={addLoading}
          addError={addError}
          filteredCats={filteredCats}
          onTypeChange={(type) => { setAddType(type); setAddCategory(""); }}
          onAmountChange={setAddAmount}
          onDescChange={setAddDesc}
          onCategoryChange={setAddCategory}
          onSubmit={handleAdd}
          onClose={() => setShowAddForm(false)}
        />
      )}
    </div>
  );
}