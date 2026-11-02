import { useState } from "react";
import Icon from "@/components/ui/icon";
import type { Session } from "@/pages/AdminPanel";

const AUTH_URL = "https://functions.poehali.dev/e6567f16-b3db-4b0d-9c1f-abed808c2ac8";
const SESSION_KEY = "admin_auth";
const inputClass = "w-full border border-beige-dark rounded-xl px-4 py-3 text-ink placeholder-ink/30 focus:outline-none focus:border-ink transition-colors bg-beige/50 text-sm";
const labelClass = "block text-xs uppercase tracking-widest text-ink/50 mb-2";

const post = (payload: object) =>
  fetch(AUTH_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    .then(async r => ({ ok: r.ok, data: await r.json() }));

export default function MaxCodeLogin({ initialLogin, onAuth, onBack }: { initialLogin: string; onAuth: (s: Session) => void; onBack: () => void }) {
  const [step, setStep] = useState<"request" | "confirm">("request");
  const [login, setLogin] = useState(initialLogin);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const { ok } = await post({ action: "request_login_code", login });
      if (ok) setStep("confirm"); else setError("Укажите логин");
    } catch { setError("Ошибка соединения. Попробуйте снова."); }
    setLoading(false);
  };

  const confirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const { ok, data } = await post({ action: "confirm_login_code", login, code });
      if (ok && data.token) {
        const session: Session = { login, password: data.token, role: data.role, full_name: data.full_name, permissions: data.permissions ?? null };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
        onAuth(session);
        return;
      }
      setError(data.error || "Неверный или просроченный код");
    } catch { setError("Ошибка соединения. Попробуйте снова."); }
    setLoading(false);
  };

  return (
    <form onSubmit={step === "request" ? requestCode : confirm} className="bg-white rounded-2xl p-8 shadow-sm space-y-4">
      <p className="text-sm text-ink/70">
        {step === "request" ? "Введите логин. Мы отправим код в Max, в бот уведомлений о задачах." : "Если сотрудник подключён к боту, код уже в Max. Введите его ниже."}
      </p>
      <div>
        <label className={labelClass}>Логин</label>
        <input value={login} onChange={e => setLogin(e.target.value)} className={inputClass} autoComplete="username" required disabled={step === "confirm"} />
      </div>
      {step === "confirm" && (
        <div>
          <label className={labelClass}>Код из Max</label>
          <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} className={inputClass} inputMode="numeric" autoComplete="one-time-code" placeholder="6 цифр" required />
        </div>
      )}
      {error && <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl"><Icon name="AlertCircle" size={14} />{error}</div>}
      <button type="submit" disabled={loading} className="w-full bg-ink text-beige py-3.5 rounded-xl font-semibold text-sm hover:bg-ink/90 transition-colors disabled:opacity-60">
        {loading ? "Проверяем..." : step === "request" ? "Получить код" : "Войти"}
      </button>
      {step === "confirm" && <button type="button" onClick={() => { setStep("request"); setCode(""); setError(""); }} className="w-full text-xs text-ink/50 hover:text-ink">Отправить код ещё раз</button>}
      <button type="button" onClick={onBack} className="w-full text-xs text-ink/50 hover:text-ink">Войти по паролю</button>
    </form>
  );
}
