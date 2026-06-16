import { useEffect, useState } from "react";

const YOOKASSA_URL = "https://functions.poehali.dev/96a24ba0-1990-499e-97df-59219cdda4af";
const LOGO_URL = "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/4ca974da-fec3-4fd3-834d-c7dccc97fca9.jpg";

export default function DonatePay() {
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(YOOKASSA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: 100,
        user_name: "Жертвователь",
        description: "Пожертвование АНО Спасение надежды",
        success_url: `${window.location.origin}/donate`,
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.payment_url) {
          window.location.href = data.payment_url;
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-beige-mid flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-sm w-full text-center space-y-4">
          <img src={LOGO_URL} alt="Спасение надежды" className="w-14 h-14 object-contain mx-auto" />
          <p className="text-ink/60 text-sm">Не удалось перейти к оплате</p>
          <a href="/donate" className="inline-block bg-sage text-beige px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-sage-dark transition-colors">
            Перейти на страницу пожертвований
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-beige-mid flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-sm w-full text-center space-y-5">
        <img src={LOGO_URL} alt="Спасение надежды" className="w-14 h-14 object-contain mx-auto" />
        <div className="w-8 h-8 border-2 border-sage border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-ink/60 text-sm">Переходим к оплате...</p>
      </div>
    </div>
  );
}
