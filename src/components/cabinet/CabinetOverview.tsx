import Icon from "@/components/ui/icon";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Overview, colorOf, fmtDate, money, referralLink } from "@/components/cabinet/cabinet.shared";
import { useState } from "react";

const MONTHS = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
const monthLabel = (label: string) => MONTHS[Number(label.split("-")[1]) - 1] || label;

function Stat({ icon, label, value, hint }: { icon: string; label: string; value: string; hint?: string }) {
  return (
    <div className="bg-white border border-beige-dark rounded-2xl p-4">
      <div className="flex items-center gap-2 text-ink/40 text-xs"><Icon name={icon} size={14} />{label}</div>
      <p className="font-cormorant text-ink text-3xl font-semibold mt-1 leading-none">{value}</p>
      {hint && <p className="text-[11px] text-ink/40 mt-1.5">{hint}</p>}
    </div>
  );
}

export default function CabinetOverview({ data, onGoTo }: { data: Overview; onGoTo: (tab: string) => void }) {
  const { stats, level } = data;
  const [copied, setCopied] = useState(false);
  const current = level.current;
  const style = colorOf(current?.color);
  const link = referralLink(data.site_url, data.profile.referral_code);
  const hasDonations = stats.count > 0;

  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { window.prompt("Скопируйте ссылку", link); }
  };

  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: "Помочь семьям вместе", text: "Присоединяйтесь, помогите женщинам и детям обрести надежду", url: link }); return; } catch { return; }
    }
    copy();
  };

  const chart = stats.by_month.map((m) => ({ name: monthLabel(m.label), amount: m.amount }));

  return (
    <div className="space-y-6">
      <div className="bg-white border border-beige-dark rounded-3xl p-6">
        <div className="flex items-start gap-4 flex-wrap">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${style.bg} ${style.text}`}>
            <Icon name={current?.icon || "Heart"} fallback="Heart" size={30} />
          </div>
          <div className="flex-1 min-w-[200px]">
            <p className="text-xs text-ink/40 uppercase tracking-wider">Ваш уровень</p>
            <h2 className="font-cormorant text-ink text-3xl font-semibold leading-tight">{current?.title || "Пока без уровня"}</h2>
            <p className="text-sm text-ink/60 mt-0.5">{current?.description || "Сделайте первое пожертвование, чтобы получить уровень «Друг»"}</p>
          </div>
        </div>
        {level.next ? (
          <div className="mt-5">
            <div className="flex justify-between text-xs text-ink/50 mb-1.5">
              <span>{current?.title || "Старт"}</span>
              <span>{level.next.title} · {money(level.next.min_amount)}</span>
            </div>
            <div className="h-3 bg-beige-mid rounded-full overflow-hidden">
              <div className="h-full bg-sage rounded-full transition-all duration-700" style={{ width: `${level.progress_pct}%` }} />
            </div>
            <p className="text-xs text-ink/50 mt-1.5">До уровня «{level.next.title}» осталось {money(level.left_to_next)}</p>
          </div>
        ) : (
          hasDonations && <p className="mt-4 text-sm text-ink/60 bg-beige-mid rounded-xl px-4 py-3">Вы достигли высшего уровня. Спасибо, что вы с нами!</p>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon="Coins" label="Всего помощи" value={money(stats.total)} hint={stats.first_date ? `с ${fmtDate(stats.first_date)}` : undefined} />
        <Stat icon="HeartHandshake" label="Пожертвований" value={String(stats.count)} hint={stats.count ? `в среднем ${money(stats.avg)}` : undefined} />
        <Stat icon="CalendarCheck" label="Месяцев подряд" value={String(stats.streak)} hint={stats.years ? `с нами ${stats.years} лет` : undefined} />
        <Stat icon="Calendar" label="В этом году" value={money(stats.year_total)} hint={data.rating_place ? `${data.rating_place}-е место из ${data.rating_total}` : undefined} />
      </div>

      {hasDonations && (
        <div className="bg-white border border-beige-dark rounded-3xl p-6">
          <h3 className="font-semibold text-ink text-sm uppercase tracking-wide mb-4">Ваша помощь за 12 месяцев</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="donorFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(9 75% 58%)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(9 75% 58%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 20% 86%)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(225 45% 20% / 0.4)" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(225 45% 20% / 0.4)" />
                <Tooltip formatter={(v: number) => [money(v), "Пожертвования"]} />
                <Area type="monotone" dataKey="amount" stroke="hsl(9 75% 58%)" strokeWidth={2.5} fill="url(#donorFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {hasDonations && data.impact.some((i) => i.count > 0) && (
        <div className="bg-white border border-beige-dark rounded-3xl p-6">
          <h3 className="font-semibold text-ink text-sm uppercase tracking-wide">На что пошли ваши деньги</h3>
          <p className="text-xs text-ink/40 mt-0.5 mb-4">Примерный расчёт по средним затратам центра</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {data.impact.filter((i) => i.count > 0).map((i) => (
              <div key={i.title} className="flex items-center gap-3 bg-beige-mid rounded-2xl px-4 py-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-sage flex-shrink-0"><Icon name={i.icon} fallback="Heart" size={18} /></div>
                <div><p className="font-cormorant text-ink text-2xl font-semibold leading-none">{i.count}</p><p className="text-xs text-ink/60 mt-0.5">{i.unit_label}</p></div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-ink text-beige rounded-3xl p-6">
        <div className="flex items-start gap-3">
          <Icon name="Users" size={20} className="mt-0.5 text-beige/70" />
          <div className="flex-1">
            <h3 className="font-cormorant text-2xl font-semibold">Позовите друзей помогать</h3>
            <p className="text-sm text-beige/60 mt-1">Поделитесь личной ссылкой. Когда друзья помогут по ней, мы покажем это здесь.</p>
            <div className="mt-3 flex gap-2 flex-wrap">
              <input readOnly value={link} className="flex-1 min-w-[220px] bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs text-beige" onFocus={(e) => e.currentTarget.select()} />
              <button onClick={copy} className="px-4 py-2 rounded-xl bg-beige text-ink text-sm font-semibold hover:bg-white transition-colors flex items-center gap-1.5"><Icon name={copied ? "Check" : "Copy"} size={14} />{copied ? "Скопировано" : "Копировать"}</button>
              <button onClick={share} className="px-4 py-2 rounded-xl border border-white/30 text-beige text-sm hover:bg-white/10 transition-colors flex items-center gap-1.5"><Icon name="Share2" size={14} />Поделиться</button>
            </div>
            {data.referrals.friends > 0 && <p className="text-xs text-beige/70 mt-3">Друзей помогло: {data.referrals.friends} на сумму {money(data.referrals.amount)}. Спасибо!</p>}
          </div>
        </div>
      </div>

      {!hasDonations && (
        <div className="bg-white border border-dashed border-beige-dark rounded-3xl p-8 text-center">
          <Icon name="Sprout" size={32} className="mx-auto text-sage mb-3" />
          <p className="font-cormorant text-ink text-2xl font-semibold">Здесь появится ваша история помощи</p>
          <p className="text-sm text-ink/50 mt-1 mb-4">Статистика, награды и документы откроются после первого пожертвования с этого email.</p>
          <a href="/donate" className="inline-block bg-sage text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-sage-dark transition-colors">Помочь сейчас</a>
        </div>
      )}

      {data.recent.length > 0 && (
        <div className="bg-white border border-beige-dark rounded-3xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-ink text-sm uppercase tracking-wide">Последние пожертвования</h3>
            <button onClick={() => onGoTo("docs")} className="text-xs text-ink/50 hover:text-ink">Документы</button>
          </div>
          <div className="divide-y divide-beige-mid">
            {data.recent.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-ink/70 flex items-center gap-2">{fmtDate(r.dt)}{r.monthly && <span className="text-[10px] px-2 py-0.5 rounded-full bg-beige-mid text-ink/60">ежемесячно</span>}</span>
                <span className="font-semibold text-ink">{money(r.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
