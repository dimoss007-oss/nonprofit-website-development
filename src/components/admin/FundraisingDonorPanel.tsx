import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { DonorType, Donation, FundraisingGoal, DonationType, fmt, DONATION_TYPE_LABELS, FUNDRAISING_URL } from "./fundraising.types";

const THANK_YOU_TEMPLATES = [
  {
    label: "Первое пожертвование",
    subject: "Спасибо за вашу поддержку — АНО «Спасение надежды»",
    body: (name: string, amount: string) =>
      `Дорогой(ая) ${name},\n\nот всей нашей команды — огромное спасибо за ваше пожертвование в размере ${amount}!\n\nБлагодаря вашей поддержке женщины и дети, оказавшиеся в трудной жизненной ситуации, получают кров, питание и помощь специалистов.\n\nВы делаете реальную разницу.\n\nС благодарностью,\nКоманда АНО «Спасение надежды»\nТел.: +7 (841) 2 XX-XX-XX\nспасениенадежды.рф`,
  },
  {
    label: "Регулярный жертвователь",
    subject: "Вы снова с нами — спасибо!",
    body: (name: string, amount: string) =>
      `Дорогой(ая) ${name},\n\nВаше очередное пожертвование (${amount}) получено. Мы очень ценим вашу постоянную поддержку.\n\nИменно такие люди, как вы, позволяют нам работать без остановки — каждый день.\n\nС теплом и признательностью,\nАНО «Спасение надежды»`,
  },
  {
    label: "Крупное / грантовое",
    subject: "Подтверждение получения средств — АНО «Спасение надежды»",
    body: (name: string, amount: string) =>
      `Уважаемые коллеги,\n\nПодтверждаем получение средств в размере ${amount}.\n\nСредства будут направлены строго по целевому назначению. Отчёт об использовании предоставим в согласованные сроки.\n\nВыражаем искреннюю благодарность за оказанное доверие.\n\nС уважением,\nДирекция АНО «Спасение надежды»`,
  },
];

export function DonorPanel({ donorType, donorId, donorName, onClose, apiUrl }: {
  donorType: DonorType; donorId: number; donorName: string;
  onClose: () => void; apiUrl: string;
}) {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [goals, setGoals] = useState<FundraisingGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    amount: "", donated_at: new Date().toISOString().slice(0, 10),
    comment: "", donation_type: "money" as DonationType, goal_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [thankYouModal, setThankYouModal] = useState<{ donation: Donation } | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [customBody, setCustomBody] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch(`${apiUrl}?type=donations&donor_type=${donorType}&donor_id=${donorId}`).then(r => r.json()),
      fetch(`${FUNDRAISING_URL}?type=goals`).then(r => r.json()),
    ]).then(([d, g]) => {
      setDonations(d.donations || []);
      setGoals((g.goals || []).filter((gl: FundraisingGoal) => gl.is_active));
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [donorId]);

  const addDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount) return;
    setSaving(true);
    await fetch(`${apiUrl}?type=donation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        donor_type: donorType, donor_id: donorId,
        ...form,
        amount: parseFloat(form.amount),
        goal_id: form.goal_id ? parseInt(form.goal_id) : null,
      }),
    });
    setForm({ amount: "", donated_at: new Date().toISOString().slice(0, 10), comment: "", donation_type: "money", goal_id: "" });
    setSaving(false);
    load();
  };

  const deleteDonation = async (id: number) => {
    if (!confirm("Удалить запись о пожертвовании?")) return;
    await fetch(`${apiUrl}?type=donation&id=${id}`, { method: "DELETE" });
    load();
  };

  const markThankYou = async (id: number) => {
    await fetch(`${apiUrl}?type=donation_thankyou&id=${id}`, { method: "POST" });
    load();
  };

  const openThankYou = (donation: Donation) => {
    const tpl = THANK_YOU_TEMPLATES[0];
    setCustomBody(tpl.body(donorName, fmt(donation.amount)));
    setSelectedTemplate(0);
    setThankYouModal({ donation });
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const total = donations.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4">
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-beige-dark">
          <div>
            <div className="font-semibold text-ink">{donorName}</div>
            <div className="text-xs text-ink/50">История пожертвований</div>
          </div>
          <button onClick={onClose} className="text-ink/40 hover:text-ink transition-colors">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {total > 0 && (
            <div className="bg-green-50 rounded-xl px-4 py-3 text-sm text-green-700 font-semibold">
              Итого: {fmt(total)}
            </div>
          )}

          <form onSubmit={addDonation} className="bg-beige/50 rounded-xl p-4 space-y-3">
            <div className="text-xs uppercase tracking-widest text-ink/50 font-medium">Добавить пожертвование</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-ink/50 mb-1">Сумма (₽) *</label>
                <input type="number" min="1" step="0.01" required
                  value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0"
                  className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-ink bg-white" />
              </div>
              <div>
                <label className="block text-xs text-ink/50 mb-1">Дата</label>
                <input type="date"
                  value={form.donated_at} onChange={e => setForm(f => ({ ...f, donated_at: e.target.value }))}
                  className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-ink bg-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-ink/50 mb-1">Тип</label>
                <select value={form.donation_type} onChange={e => setForm(f => ({ ...f, donation_type: e.target.value as DonationType }))}
                  className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-ink bg-white">
                  {(Object.entries(DONATION_TYPE_LABELS) as [DonationType, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-ink/50 mb-1">Цель сбора</label>
                <select value={form.goal_id} onChange={e => setForm(f => ({ ...f, goal_id: e.target.value }))}
                  className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-ink bg-white">
                  <option value="">— не указана —</option>
                  {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-ink/50 mb-1">Комментарий</label>
              <input value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
                placeholder="Необязательно"
                className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-ink bg-white" />
            </div>
            <button type="submit" disabled={saving}
              className="w-full bg-ink text-beige py-2 rounded-lg text-sm font-semibold hover:bg-ink/90 transition-colors disabled:opacity-50">
              {saving ? "Сохраняем..." : "Добавить"}
            </button>
          </form>

          {loading ? (
            <div className="text-center py-6 text-ink/30 text-sm">Загружаем...</div>
          ) : donations.length === 0 ? (
            <div className="text-center py-6 text-ink/30 text-sm">Пожертвований пока нет</div>
          ) : (
            <div className="space-y-2">
              {donations.map(d => (
                <div key={d.id} className="rounded-xl border border-beige-dark px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-green-700">{fmt(d.amount)}</span>
                        {d.donation_type && d.donation_type !== "money" && (
                          <span className="text-xs bg-beige-dark text-ink/60 px-2 py-0.5 rounded-full">
                            {DONATION_TYPE_LABELS[d.donation_type]}
                          </span>
                        )}
                        {d.thank_you_sent && (
                          <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Icon name="Check" size={10} /> Поблагодарили
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-ink/40 mt-0.5">
                        {new Date(d.donated_at).toLocaleDateString("ru-RU")}
                        {d.comment && <> · {d.comment}</>}
                        {d.goal_id && goals.find(g => g.id === d.goal_id) && (
                          <> · 🎯 {goals.find(g => g.id === d.goal_id)?.title}</>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!d.thank_you_sent && (
                        <button onClick={() => openThankYou(d)}
                          title="Написать благодарность"
                          className="text-ink/30 hover:text-amber-500 transition-colors p-1">
                          <Icon name="Mail" size={14} />
                        </button>
                      )}
                      <button onClick={() => deleteDonation(d.id)}
                        className="text-ink/25 hover:text-red-500 transition-colors p-1">
                        <Icon name="Trash2" size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {thankYouModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-beige-dark">
              <h3 className="font-semibold text-ink">Письмо благодарности</h3>
              <button onClick={() => setThankYouModal(null)} className="text-ink/40 hover:text-ink">
                <Icon name="X" size={18} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              <div>
                <p className="text-xs text-ink/50 mb-2 uppercase tracking-widest">Шаблон</p>
                <div className="flex flex-wrap gap-2">
                  {THANK_YOU_TEMPLATES.map((t, i) => (
                    <button key={i}
                      onClick={() => {
                        setSelectedTemplate(i);
                        setCustomBody(t.body(donorName, fmt(thankYouModal.donation.amount)));
                      }}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${selectedTemplate === i ? "bg-ink text-beige border-ink" : "border-beige-dark text-ink/60 hover:border-ink"}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-ink/50 uppercase tracking-widest">Тема письма</p>
                  <button onClick={() => copyText(THANK_YOU_TEMPLATES[selectedTemplate].subject)}
                    className="text-xs text-ink/40 hover:text-ink flex items-center gap-1">
                    <Icon name="Copy" size={12} /> Копировать
                  </button>
                </div>
                <div className="bg-beige/50 rounded-lg px-3 py-2 text-sm text-ink border border-beige-dark">
                  {THANK_YOU_TEMPLATES[selectedTemplate].subject}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-ink/50 uppercase tracking-widest">Текст письма</p>
                  <button onClick={() => copyText(customBody)}
                    className="text-xs text-ink/40 hover:text-ink flex items-center gap-1">
                    <Icon name="Copy" size={12} /> Копировать
                  </button>
                </div>
                <textarea value={customBody} onChange={e => setCustomBody(e.target.value)}
                  rows={10}
                  className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-ink bg-white resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-beige-dark flex gap-3">
              <button onClick={() => { markThankYou(thankYouModal.donation.id); setThankYouModal(null); }}
                className="flex-1 bg-ink text-beige py-2.5 rounded-xl text-sm font-semibold hover:bg-ink/90 transition-colors flex items-center justify-center gap-2">
                <Icon name="CheckCheck" size={15} /> Отметить как отправленное
              </button>
              <button onClick={() => setThankYouModal(null)}
                className="px-4 py-2.5 rounded-xl text-sm border border-beige-dark text-ink/60 hover:text-ink transition-colors">
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
