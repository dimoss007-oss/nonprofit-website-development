import { useState } from "react";
import { PaymentButton } from "@/components/extensions/robokassa/PaymentButton";
import QRCode from "react-qr-code";

const ROBOKASSA_URL = "https://functions.poehali.dev/3317a497-ca88-4c4a-a762-5067d6219617";
const LOGO_URL = "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/4ca974da-fec3-4fd3-834d-c7dccc97fca9.jpg";

const AMOUNTS = [300, 500, 1000, 3000, 5000, 10000];

export default function Donate() {
  const [amount, setAmount] = useState(1000);
  const [customAmount, setCustomAmount] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [qrUrl, setQrUrl] = useState("");

  const finalAmount = customAmount ? Number(customAmount) : amount;

  if (qrUrl) {
    return (
      <div className="min-h-screen bg-beige-mid flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-sm w-full text-center">
          <img src={LOGO_URL} alt="Спасение надежды" className="w-16 h-16 object-contain mx-auto mb-4" />
          <h2 className="font-cormorant text-ink text-2xl font-semibold mb-1">Спасибо{name ? `, ${name.split(" ")[0]}` : ""}!</h2>
          <p className="text-foreground/60 text-sm mb-5">Сумма: <span className="font-semibold text-sage">{finalAmount.toLocaleString("ru")} ₽</span></p>
          <div className="flex justify-center mb-4 p-4 bg-beige rounded-xl">
            <QRCode value={qrUrl} size={160} />
          </div>
          <p className="text-foreground/50 text-xs mb-4">Отсканируйте QR-код или нажмите кнопку</p>
          <button
            onClick={() => window.open(qrUrl, "_blank")}
            className="w-full bg-sage text-beige py-3 font-golos font-semibold text-sm rounded-lg hover:bg-sage-dark transition-colors mb-3"
          >
            Оплатить онлайн
          </button>
          <button onClick={() => setQrUrl("")} className="text-foreground/40 text-xs hover:text-foreground/60 transition-colors">
            Изменить сумму
          </button>
        </div>
      </div>
    );
  }

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

          <PaymentButton
            apiUrl={ROBOKASSA_URL}
            amount={finalAmount}
            userName={name || "Аноним"}
            userEmail={email || "noreply@spasenienadezhdi.ru"}
            userPhone=""
            cartItems={[{ id: "donation", name: "Пожертвование", price: finalAmount, quantity: 1 }]}
            successUrl={`${window.location.origin}/donate`}
            failUrl={`${window.location.origin}/donate`}
            buttonText={`Пожертвовать ${finalAmount ? `${finalAmount.toLocaleString("ru")} ₽` : ""}`}
            className="w-full bg-sage text-beige py-3.5 font-golos font-semibold text-sm tracking-wide uppercase rounded-lg hover:bg-sage-dark transition-colors duration-300 disabled:opacity-60"
            disabled={!finalAmount || finalAmount < 1}
            onSuccess={(_orderNumber, paymentUrl) => { if (paymentUrl) setQrUrl(paymentUrl); }}
          />

          <p className="text-foreground/40 text-xs text-center">
            Ваши данные защищены ·{" "}
            <a href="/donation-terms" target="_blank" className="underline hover:text-foreground/60">
              Условия пожертвования
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
