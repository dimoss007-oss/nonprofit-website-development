import { useState } from "react";

const YOOKASSA_URL = "https://functions.poehali.dev/96a24ba0-1990-499e-97df-59219cdda4af";
const LOGO_URL = "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/4ca974da-fec3-4fd3-834d-c7dccc97fca9.jpg";

const AMOUNTS = [300, 500, 1000, 3000, 5000, 10000];

export default function Donate() {
  const [amount, setAmount] = useState(1000);
  const [customAmount, setCustomAmount] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [monthly, setMonthly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const finalAmount = customAmount ? Number(customAmount) : amount;

  const handlePay = async () => {
    if (!finalAmount || finalAmount < 1) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(YOOKASSA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          user_name: name || "Аноним",
          user_email: email || undefined,
          monthly,
          success_url: `${window.location.origin}/donate`,
        }),
      });
      const data = await res.json();
      if (data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        setError(data.error || "Не удалось создать платёж");
      }
    } catch {
      setError("Ошибка соединения. Попробуйте снова.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-beige-mid flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <img src={LOGO_URL} alt="Спасение надежды" className="w-16 h-16 object-contain mx-auto mb-4" />
          <h1 className="font-cormorant text-ink text-3xl font-semibold mb-2">Поддержать организацию</h1>
          <p className="text-foreground/60 text-sm">АНО «Спасение надежды» · Пенза</p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-foreground/50 text-xs uppercase tracking-wider mb-2.5 block">Сумма пожертвования</label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {AMOUNTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => { setAmount(a); setCustomAmount(""); }}
                  className={`py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                    amount === a && !customAmount
                      ? "bg-sage text-beige"
                      : "border border-sage/20 text-ink hover:border-sage/50"
                  }`}
                >
                  {a.toLocaleString("ru")} ₽
                </button>
              ))}
            </div>
            <input
              type="number"
              placeholder="Другая сумма (₽)"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="w-full border border-sage/20 text-ink placeholder-foreground/40 px-3 py-2.5 rounded-lg focus:outline-none focus:border-sage text-sm"
            />
          </div>

          <div className="space-y-2">
            <input
              type="text"
              placeholder="Ваше имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-sage/20 text-ink placeholder-foreground/40 px-3 py-2.5 rounded-lg focus:outline-none focus:border-sage text-sm"
            />
            <input
              type="email"
              placeholder="Email (для квитанции)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-sage/20 text-ink placeholder-foreground/40 px-3 py-2.5 rounded-lg focus:outline-none focus:border-sage text-sm"
            />
          </div>

          <label className="flex items-start gap-3 cursor-pointer select-none group">
            <div className="relative mt-0.5 flex-shrink-0">
              <input
                type="checkbox"
                checked={monthly}
                onChange={(e) => setMonthly(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${monthly ? "bg-sage border-sage" : "border-sage/30 group-hover:border-sage/60"}`}>
                {monthly && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-ink">Ежемесячное пожертвование</span>
              <p className="text-xs text-foreground/50 mt-0.5">Карта будет сохранена, списание произойдёт автоматически каждый месяц</p>
            </div>
          </label>

          {error && (
            <div className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-lg">{error}</div>
          )}

          <button
            onClick={handlePay}
            disabled={loading || !finalAmount || finalAmount < 1}
            className="w-full bg-sage text-beige py-3.5 font-golos font-semibold text-sm tracking-wide uppercase rounded-lg hover:bg-sage-dark transition-colors duration-300 disabled:opacity-60"
          >
            {loading ? "Переходим к оплате..." : `${monthly ? "Подписаться" : "Пожертвовать"} ${finalAmount ? `${finalAmount.toLocaleString("ru")} ₽` : ""}${monthly ? " / мес" : ""}`}
          </button>

          <p className="text-foreground/40 text-xs text-center">
            Ваши данные защищены · Оплата через ЮКасса ·{" "}
            <a href="/donation-terms" target="_blank" className="underline hover:text-foreground/60">
              Условия пожертвования
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}