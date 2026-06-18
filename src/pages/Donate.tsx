import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { FundraisingGoal, FUNDRAISING_URL, fmt } from "@/components/admin/fundraising.types";

const YOOKASSA_URL = "https://functions.poehali.dev/96a24ba0-1990-499e-97df-59219cdda4af";
const LOGO_URL = "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/4ca974da-fec3-4fd3-834d-c7dccc97fca9.jpg";

const NEEDS = [
  { icon: "UtensilsCrossed", label: "Питание", desc: "3 раза в день для каждой семьи", amount: 300 },
  { icon: "Shirt", label: "Одежда и вещи", desc: "Сезонная одежда, обувь, гигиена", amount: 500 },
  { icon: "Scale", label: "Юридическая помощь", desc: "Адвокат, документы, суд", amount: 1000 },
  { icon: "HeartHandshake", label: "Психолог", desc: "Сессия для мамы или ребёнка", amount: 2000 },
  { icon: "Baby", label: "Детские нужды", desc: "Игрушки, книги, школьные принадлежности", amount: 500 },
  { icon: "Home", label: "Содержание центра", desc: "Коммунальные услуги, ремонт", amount: 3000 },
];

const AMOUNTS = [300, 500, 1000, 3000, 5000, 10000];

function GoalProgress({ goal }: { goal: FundraisingGoal }) {
  const pct = goal.target_amount > 0
    ? Math.min(100, Math.round((goal.collected_amount / goal.target_amount) * 100))
    : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-ink">{goal.title}</span>
        <span className="text-ink/50 text-xs">{pct}%</span>
      </div>
      {goal.description && <p className="text-xs text-ink/40">{goal.description}</p>}
      <div className="h-2 bg-beige-mid rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${pct >= 100 ? "bg-green-500" : "bg-sage"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-ink/40">
        <span>{fmt(goal.collected_amount)} собрано</span>
        <span>цель: {fmt(goal.target_amount)}</span>
      </div>
    </div>
  );
}

export default function Donate() {
  const [amount, setAmount] = useState(1000);
  const [customAmount, setCustomAmount] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [monthly, setMonthly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [goals, setGoals] = useState<FundraisingGoal[]>([]);
  const [selectedNeed, setSelectedNeed] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${FUNDRAISING_URL}?type=goals`)
      .then(r => r.json())
      .then(d => setGoals((d.goals || []).filter((g: FundraisingGoal) => g.is_active)))
      .catch(() => {});
  }, []);

  const finalAmount = customAmount ? Number(customAmount) : amount;

  const handleSelectNeed = (needAmount: number, idx: number) => {
    setSelectedNeed(idx);
    setCustomAmount("");
    setAmount(needAmount);
  };

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
    <div className="min-h-screen bg-beige-mid">

      {/* Шапка с миссией */}
      <div className="bg-ink text-beige py-14 px-4 text-center">
        <img src={LOGO_URL} alt="Спасение надежды" className="w-14 h-14 object-contain mx-auto mb-5 opacity-90" />
        <h1 className="font-cormorant text-4xl sm:text-5xl font-semibold mb-3 leading-tight">
          Помогите женщинам<br />и детям обрести надежду
        </h1>
        <p className="text-beige/60 text-sm max-w-md mx-auto leading-relaxed">
          АНО «Спасение надежды» — кризисный центр в Пензе для женщин,<br className="hidden sm:block" />
          оказавшихся в трудной жизненной ситуации. Мы даём кров, поддержку и новый старт.
        </p>
        <div className="flex items-center justify-center gap-6 mt-8 text-sm text-beige/50">
          <span className="flex items-center gap-1.5"><Icon name="Users" size={14} />Более 200 семей помогли</span>
          <span className="flex items-center gap-1.5"><Icon name="Calendar" size={14} />Работаем с 2018 года</span>
          <span className="flex items-center gap-1.5"><Icon name="ShieldCheck" size={14} />Официальная НКО</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">

        {/* На что идут деньги */}
        <div>
          <h2 className="font-cormorant text-ink text-2xl font-semibold mb-1">На что идут ваши средства</h2>
          <p className="text-sm text-ink/50 mb-5">Нажмите на нужду — сумма подставится автоматически</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {NEEDS.map((need, i) => (
              <button key={i} onClick={() => handleSelectNeed(need.amount, i)}
                className={`text-left rounded-2xl border p-4 transition-all ${selectedNeed === i ? "border-ink bg-white shadow-sm" : "border-beige-dark bg-white hover:border-ink/40"}`}>
                <Icon name={need.icon} size={20} className={selectedNeed === i ? "text-ink" : "text-ink/40"} />
                <p className="font-semibold text-ink text-sm mt-2">{need.label}</p>
                <p className="text-xs text-ink/40 mt-0.5 leading-tight">{need.desc}</p>
                <p className={`text-sm font-bold mt-2 ${selectedNeed === i ? "text-ink" : "text-ink/60"}`}>{need.amount.toLocaleString("ru")} ₽</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Форма пожертвования */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
              <h2 className="font-cormorant text-ink text-2xl font-semibold">Сделать пожертвование</h2>

              <div>
                <label className="text-ink/50 text-xs uppercase tracking-wider mb-2.5 block">Сумма пожертвования</label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {AMOUNTS.map(a => (
                    <button key={a} type="button"
                      onClick={() => { setAmount(a); setCustomAmount(""); setSelectedNeed(null); }}
                      className={`py-2.5 text-sm font-semibold rounded-lg transition-all ${amount === a && !customAmount ? "bg-sage text-beige" : "border border-sage/20 text-ink hover:border-sage/50"}`}>
                      {a.toLocaleString("ru")} ₽
                    </button>
                  ))}
                </div>
                <input type="number" placeholder="Другая сумма (₽)"
                  value={customAmount} onChange={e => { setCustomAmount(e.target.value); setSelectedNeed(null); }}
                  className="w-full border border-sage/20 text-ink placeholder-foreground/40 px-3 py-2.5 rounded-lg focus:outline-none focus:border-sage text-sm" />
              </div>

              <div className="space-y-2">
                <input type="text" placeholder="Ваше имя (необязательно)"
                  value={name} onChange={e => setName(e.target.value)}
                  className="w-full border border-sage/20 text-ink placeholder-foreground/40 px-3 py-2.5 rounded-lg focus:outline-none focus:border-sage text-sm" />
                <input type="email" placeholder="Email для квитанции (необязательно)"
                  value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full border border-sage/20 text-ink placeholder-foreground/40 px-3 py-2.5 rounded-lg focus:outline-none focus:border-sage text-sm" />
              </div>

              <label className="flex items-start gap-3 cursor-pointer select-none group">
                <div className="relative mt-0.5 flex-shrink-0">
                  <input type="checkbox" checked={monthly} onChange={e => setMonthly(e.target.checked)} className="sr-only" />
                  <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${monthly ? "bg-sage border-sage" : "border-sage/30 group-hover:border-sage/60"}`}>
                    {monthly && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium text-ink">Ежемесячное пожертвование</span>
                  <p className="text-xs text-foreground/50 mt-0.5">Регулярная поддержка позволяет планировать работу центра</p>
                </div>
              </label>

              {error && <div className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-lg">{error}</div>}

              <button onClick={handlePay} disabled={loading || !finalAmount || finalAmount < 1}
                className="w-full bg-sage text-beige py-3.5 font-golos font-semibold text-sm tracking-wide uppercase rounded-lg hover:bg-sage-dark transition-colors duration-300 disabled:opacity-60">
                {loading ? "Переходим к оплате..." : `${monthly ? "Подписаться" : "Пожертвовать"} ${finalAmount ? `${finalAmount.toLocaleString("ru")} ₽` : ""}${monthly ? " / мес" : ""}`}
              </button>

              <p className="text-foreground/40 text-xs text-center">
                Ваши данные защищены · Оплата через ЮКасса ·{" "}
                <a href="/donation-terms" target="_blank" className="underline hover:text-foreground/60">Условия пожертвования</a>
              </p>
            </div>
          </div>

          {/* Прогресс целей */}
          <div className="lg:col-span-2 space-y-4">
            {goals.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-cormorant text-ink text-xl font-semibold mb-4">Текущие цели</h3>
                <div className="space-y-5">
                  {goals.map(g => <GoalProgress key={g.id} goal={g} />)}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
              <h3 className="font-cormorant text-ink text-xl font-semibold">Почему это важно</h3>
              {[
                { icon: "ShieldAlert", text: "Женщины часто уходят без документов, денег и жилья" },
                { icon: "Baby", text: "С ними — дети, которым нужна стабильность и безопасность" },
                { icon: "HandHeart", text: "Ваша поддержка — это реальный шанс на новую жизнь" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-beige-mid flex items-center justify-center flex-shrink-0">
                    <Icon name={item.icon} size={15} className="text-ink/60" />
                  </div>
                  <p className="text-sm text-ink/70 leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
