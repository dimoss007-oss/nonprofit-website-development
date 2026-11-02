import { useState } from "react";
import { CABINET_URL } from "@/components/cabinet/cabinet.shared";

const field = "w-full px-4 py-3 rounded-lg border border-azure/30 text-sm text-navy bg-white focus:outline-none focus:border-azure";

export default function BrigadePartnerForm() {
  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [interest, setInterest] = useState("trips");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const r = await fetch(CABINET_URL, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "partner_request", company, contact_name: name, phone, interest }),
      });
      const d = await r.json();
      if (r.ok) setSent(true); else setError(d.error || "Не удалось отправить заявку");
    } catch {
      setError("Ошибка соединения. Попробуйте снова.");
    }
    setLoading(false);
  };

  return (
    <section id="partner" className="py-14 px-5 bg-mist" aria-labelledby="partner-title">
      <div className="max-w-2xl mx-auto">
        <h2 id="partner-title" className="font-golos text-2xl sm:text-3xl font-bold text-navy text-center">Стать партнёром проекта</h2>
        <p className="text-center text-navy/75 mt-2 mb-8">Для компаний, готовых финансировать выезды или обслуживание автомобиля бригады</p>
        {sent ? (
          <div className="bg-white rounded-xl border border-teal-deep/30 p-6 text-center text-navy" role="status">
            Спасибо! Заявка отправлена, ответственный сотрудник центра свяжется с вами.
          </div>
        ) : (
          <form onSubmit={submit} className="bg-white rounded-xl border border-azure/15 p-5 sm:p-6 space-y-3">
            <input className={field} value={company} onChange={e => setCompany(e.target.value)} placeholder="Название компании" aria-label="Название компании" required />
            <input className={field} value={name} onChange={e => setName(e.target.value)} placeholder="Контактное лицо" aria-label="Контактное лицо" required />
            <input className={field} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Телефон" aria-label="Телефон" required />
            <select className={field} value={interest} onChange={e => setInterest(e.target.value)} aria-label="Что вам интересно">
              <option value="trips">Финансирование выездов</option>
              <option value="car">Обслуживание автомобиля</option>
              <option value="other">Другое</option>
            </select>
            {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
            <button type="submit" disabled={loading} className="w-full px-6 py-3.5 rounded-lg bg-navy text-white font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity">{loading ? "Отправляем..." : "Отправить заявку"}</button>
            <p className="text-xs text-navy/60">Нажимая кнопку, вы соглашаетесь на обработку персональных данных для связи с вами.</p>
          </form>
        )}
      </div>
    </section>
  );
}
