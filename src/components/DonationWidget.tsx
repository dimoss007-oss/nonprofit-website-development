import { useState } from "react";
import { QRCodeSVG as QRCode } from "qrcode.react";
import { useRobokassa, openPaymentPage, isValidEmail } from "@/components/extensions/robokassa/useRobokassa";

const ROBOKASSA_URL = "https://functions.poehali.dev/cd7d4ba3-bafb-4d4f-8035-e06d64cd7b3c";
const SUCCESS_URL = "https://spasenie58.ru/";
const FAIL_URL = "https://spasenie58.ru/";

const AMOUNTS = [300, 500, 1000, 2000, 5000];

export default function DonationWidget() {
  const [amount, setAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"form" | "qr">("form");
  const [paymentUrl, setPaymentUrl] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { createPayment, isLoading } = useRobokassa({ apiUrl: ROBOKASSA_URL });

  const finalAmount = customAmount ? parseFloat(customAmount) : amount;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Укажите имя";
    if (!email.trim()) e.email = "Укажите email";
    else if (!isValidEmail(email)) e.email = "Неверный формат email";
    if (!finalAmount || finalAmount < 10) e.amount = "Минимальная сумма — 10 ₽";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const data = await createPayment({
      amount: finalAmount,
      userName: name,
      userEmail: email,
      userPhone: "",
      orderComment: "Пожертвование",
      cartItems: [{ id: "donation", name: "Пожертвование", price: finalAmount, quantity: 1 }],
      successUrl: SUCCESS_URL,
      failUrl: FAIL_URL,
    });
    setPaymentUrl(data.payment_url);
    setStep("qr");
  };

  const handlePayNow = () => openPaymentPage(paymentUrl);

  if (step === "qr") {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full mx-auto text-center">
        <p className="font-cormorant text-ink text-2xl font-semibold mb-1">Спасибо, {name.split(" ")[0]}!</p>
        <p className="text-ink/60 text-sm mb-6">Сумма пожертвования: <span className="font-semibold text-ink">{finalAmount.toLocaleString("ru")} ₽</span></p>
        <div className="flex justify-center mb-6 p-4 bg-beige rounded-xl">
          <QRCode value={paymentUrl} size={180} />
        </div>
        <p className="text-ink/50 text-xs mb-5">Отсканируйте QR-код камерой телефона или оплатите кнопкой ниже</p>
        <button
          onClick={handlePayNow}
          className="w-full bg-sage text-white font-golos font-semibold py-3 rounded-xl hover:bg-sage-dark transition-colors"
        >
          Оплатить онлайн
        </button>
        <button
          onClick={() => setStep("form")}
          className="mt-3 w-full text-ink/40 text-sm hover:text-ink/70 transition-colors"
        >
          Назад
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full mx-auto">
      <p className="font-cormorant text-ink text-2xl font-semibold mb-1 text-center">Поддержать центр</p>
      <p className="text-ink/50 text-xs text-center mb-6">Ваше пожертвование помогает семьям в кризисе</p>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {AMOUNTS.map((a) => (
          <button
            key={a}
            onClick={() => { setAmount(a); setCustomAmount(""); }}
            className={`py-2 rounded-xl text-sm font-golos font-medium border transition-colors ${
              amount === a && !customAmount
                ? "bg-sage text-white border-sage"
                : "border-beige-dark text-ink hover:border-sage hover:text-sage"
            }`}
          >
            {a.toLocaleString("ru")} ₽
          </button>
        ))}
        <input
          type="number"
          placeholder="Своя"
          value={customAmount}
          onChange={(e) => { setCustomAmount(e.target.value); setAmount(0); }}
          className="py-2 px-3 rounded-xl text-sm font-golos border border-beige-dark focus:border-sage focus:outline-none text-center"
        />
      </div>
      {errors.amount && <p className="text-red-500 text-xs mb-3">{errors.amount}</p>}

      <div className="space-y-3 mb-5">
        <div>
          <input
            type="text"
            placeholder="Ваше имя"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-beige-dark focus:border-sage focus:outline-none text-sm font-golos"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>
        <div>
          <input
            type="email"
            placeholder="Email для чека"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-beige-dark focus:border-sage focus:outline-none text-sm font-golos"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full bg-sage text-white font-golos font-semibold py-3 rounded-xl hover:bg-sage-dark transition-colors disabled:opacity-60"
      >
        {isLoading ? "Создаём платёж..." : `Пожертвовать ${finalAmount ? finalAmount.toLocaleString("ru") + " ₽" : ""}`}
      </button>
    </div>
  );
}