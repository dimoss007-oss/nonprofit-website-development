import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";

const AUTH_URL = "https://functions.poehali.dev/e6567f16-b3db-4b0d-9c1f-abed808c2ac8";

type Entry = { id: number; login: string; full_name: string | null; method: string; success: boolean; ip: string | null; user_agent: string | null; created_at: string };

const METHODS: Record<string, string> = { password: "Пароль", max_code: "Код из Max" };

function device(ua: string | null) {
  if (!ua) return "—";
  const os = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad|iOS/.test(ua) ? "iOS" : /Mac OS/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "";
  const br = /YaBrowser/.test(ua) ? "Яндекс Браузер" : /Edg\//.test(ua) ? "Edge" : /Firefox/.test(ua) ? "Firefox" : /Chrome/.test(ua) ? "Chrome" : /Safari/.test(ua) ? "Safari" : "";
  return [br, os].filter(Boolean).join(", ") || "—";
}

export default function LoginLogPanel({ authLogin, authPassword }: { authLogin: string; authPassword: string }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [onlyFailed, setOnlyFailed] = useState(false);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try {
      const r = await fetch(AUTH_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "login_log", auth_login: authLogin, auth_password: authPassword, limit: 300 }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Ошибка");
      setEntries(d.entries);
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка"); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const shown = entries.filter(e => (!onlyFailed || !e.success) && (!q || `${e.login} ${e.full_name ?? ""}`.toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Поиск по сотруднику" className="border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink bg-white" />
        <label className="flex items-center gap-2 text-sm text-ink/70"><input type="checkbox" checked={onlyFailed} onChange={e => setOnlyFailed(e.target.checked)} />Только неудачные</label>
        <button onClick={load} className="ml-auto flex items-center gap-1.5 text-sm text-ink/60 hover:text-ink"><Icon name="RefreshCw" size={14} />Обновить</button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? (
        <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-white border border-beige-dark rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-ink/40 border-b border-beige-dark">
                <th className="px-4 py-3">Когда</th><th className="px-4 py-3">Сотрудник</th><th className="px-4 py-3">Способ</th><th className="px-4 py-3">Результат</th><th className="px-4 py-3">IP</th><th className="px-4 py-3">Устройство</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-ink/40">Записей нет</td></tr>}
              {shown.map(e => (
                <tr key={e.id} className="border-b border-beige-dark/60 last:border-0">
                  <td className="px-4 py-2.5 whitespace-nowrap">{new Date(e.created_at + "Z").toLocaleString("ru-RU")}</td>
                  <td className="px-4 py-2.5"><div className="font-medium text-ink">{e.full_name || e.login}</div><div className="text-xs text-ink/40">@{e.login}</div></td>
                  <td className="px-4 py-2.5">{METHODS[e.method] || e.method}</td>
                  <td className="px-4 py-2.5"><span className={`text-xs px-2 py-0.5 rounded-full ${e.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}>{e.success ? "Вход" : "Отказ"}</span></td>
                  <td className="px-4 py-2.5 text-ink/60">{e.ip || "—"}</td>
                  <td className="px-4 py-2.5 text-ink/60">{device(e.user_agent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
