import { useState } from "react";
import Icon from "@/components/ui/icon";
import { AUTH_URL, SESSION_KEY } from "./crmTypes";

export default function CrmLogin({ onAuth }: { onAuth: () => void }) {
  const [login, setLogin] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const r = await fetch(AUTH_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ login, password: pass }) });
    const d = await r.json();
    setLoading(false);
    if (d.ok) { sessionStorage.setItem(SESSION_KEY, "1"); onAuth(); }
    else setError("Неверный логин или пароль");
  };

  return (
    <div className="min-h-screen bg-beige-mid flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-ink rounded-xl flex items-center justify-center mx-auto mb-3">
            <Icon name="Users" size={22} className="text-beige" />
          </div>
          <h1 className="font-cormorant text-ink text-2xl font-semibold">CRM — Пациенты</h1>
          <p className="text-ink/50 text-sm mt-1">Кризисный центр «Спасение надежды»</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input value={login} onChange={e => setLogin(e.target.value)} placeholder="Логин" className="w-full border border-beige-dark rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-ink" />
          <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Пароль" className="w-full border border-beige-dark rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-ink" />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button disabled={loading} className="w-full bg-ink text-beige py-2.5 rounded-xl text-sm font-semibold hover:bg-ink/90 transition-colors disabled:opacity-60">
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}
