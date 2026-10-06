import { useState } from "react";
import Icon from "@/components/ui/icon";
import { cabinetPost, TOKEN_KEY } from "@/components/cabinet/cabinet.shared";

export default function CabinetLogin({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const requestCode = async () => {
    setBusy(true); setError("");
    try {
      await cabinetPost({ action: "request_code", email }, false);
      setStep("code");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось отправить код");
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setBusy(true); setError("");
    try {
      const d = await cabinetPost<{ token: string }>({ action: "verify_code", email, code }, false);
      localStorage.setItem(TOKEN_KEY, d.token);
      onLoggedIn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось войти");
    } finally {
      setBusy(false);
    }
  };

  const inputCls = "w-full border border-beige-dark rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-ink";

  return (
    <div className="max-w-md mx-auto bg-white border border-beige-dark rounded-3xl p-8 shadow-sm">
      <div className="w-12 h-12 rounded-2xl bg-ink text-beige flex items-center justify-center mx-auto mb-4">
        <Icon name="HeartHandshake" size={22} />
      </div>
      <h1 className="font-cormorant text-ink text-3xl font-semibold text-center">Личный кабинет</h1>
      <p className="text-sm text-ink/50 text-center mt-1 mb-6">
        Ваши пожертвования, награды и благодарности от центра
      </p>

      {step === "email" ? (
        <div className="space-y-3">
          <label className="text-xs text-ink/50 block">Email, с которого вы жертвовали</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && email && requestCode()} placeholder="name@example.com" className={inputCls} autoFocus />
          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <button onClick={requestCode} disabled={busy || !email.trim()} className="w-full bg-ink text-beige rounded-xl py-3 text-sm font-semibold hover:bg-ink/90 disabled:opacity-60 transition-colors">
            {busy ? "Отправляем код..." : "Получить код на почту"}
          </button>
          <p className="text-[11px] text-ink/40 text-center">Пароль не нужен. Мы отправим на почту одноразовый код.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-ink/70 text-center">Код отправлен на <span className="font-semibold">{email}</span></p>
          <input inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} onKeyDown={(e) => e.key === "Enter" && code.length === 6 && verify()} placeholder="000000" className={`${inputCls} text-center text-2xl tracking-[0.5em] font-semibold`} autoFocus />
          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <button onClick={verify} disabled={busy || code.length !== 6} className="w-full bg-ink text-beige rounded-xl py-3 text-sm font-semibold hover:bg-ink/90 disabled:opacity-60 transition-colors">
            {busy ? "Проверяем..." : "Войти"}
          </button>
          <button onClick={() => { setStep("email"); setCode(""); setError(""); }} className="w-full text-xs text-ink/50 hover:text-ink">
            Изменить email или отправить код ещё раз
          </button>
        </div>
      )}
    </div>
  );
}
