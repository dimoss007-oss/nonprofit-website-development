import Icon from "@/components/ui/icon";
import { ALL_TABS, INPUT_CLS, ProfileForm, TabId } from "./usersShared";

const AVATAR_COLORS = [
  "bg-rose-100 text-rose-600", "bg-orange-100 text-orange-600",
  "bg-amber-100 text-amber-700", "bg-teal-100 text-teal-700",
  "bg-sky-100 text-sky-700", "bg-violet-100 text-violet-600",
  "bg-pink-100 text-pink-600", "bg-lime-100 text-lime-700",
];

function getInitials(name?: string, login?: string): string {
  const src = name?.trim() || login || "?";
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

function getAvatarColor(login: string): string {
  let hash = 0;
  for (let i = 0; i < login.length; i++) hash = login.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function Avatar({ name, login, size = "md", photoUrl }: { name?: string; login: string; size?: "sm" | "md" | "lg"; photoUrl?: string | null }) {
  const sz = size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-16 h-16 text-lg" : "w-10 h-10 text-sm";
  if (photoUrl) {
    return <img src={photoUrl} alt={name || login} className={`${sz} rounded-xl object-cover flex-shrink-0`} />;
  }
  return (
    <div className={`${sz} ${getAvatarColor(login)} rounded-xl flex items-center justify-center flex-shrink-0 font-semibold`}>
      {getInitials(name, login)}
    </div>
  );
}

export function ProfileFields({ value, onChange }: { value: ProfileForm; onChange: (v: ProfileForm) => void }) {
  const set = (k: keyof ProfileForm, v: string) => onChange({ ...value, [k]: v });
  return (
    <>
      <div>
        <label className="text-xs text-ink/50 mb-1 block">Должность</label>
        <input value={value.position} onChange={e => set("position", e.target.value)} placeholder="Например, психолог" className={INPUT_CLS} />
      </div>
      <div>
        <label className="text-xs text-ink/50 mb-1 block">Дата рождения</label>
        <input type="date" value={value.birth_date} onChange={e => set("birth_date", e.target.value)} className={INPUT_CLS} />
      </div>
      <div className="sm:col-span-2 border-t border-beige-dark pt-3">
        <p className="text-xs uppercase tracking-widest text-ink/40 mb-3">Паспорт</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-ink/50 mb-1 block">Серия</label>
            <input value={value.passport_series} onChange={e => set("passport_series", e.target.value)} placeholder="0000" maxLength={10} className={INPUT_CLS} />
          </div>
          <div>
            <label className="text-xs text-ink/50 mb-1 block">Номер</label>
            <input value={value.passport_number} onChange={e => set("passport_number", e.target.value)} placeholder="000000" maxLength={20} className={INPUT_CLS} />
          </div>
          <div>
            <label className="text-xs text-ink/50 mb-1 block">Дата выдачи</label>
            <input type="date" value={value.passport_issued_date} onChange={e => set("passport_issued_date", e.target.value)} className={INPUT_CLS} />
          </div>
          <div>
            <label className="text-xs text-ink/50 mb-1 block">Кем выдан</label>
            <input value={value.passport_issued_by} onChange={e => set("passport_issued_by", e.target.value)} className={INPUT_CLS} />
          </div>
        </div>
      </div>
    </>
  );
}

export function PermissionsEditor({ value, onChange }: { value: TabId[]; onChange: (v: TabId[]) => void }) {
  const toggle = (id: TabId) => {
    onChange(value.includes(id) ? value.filter(x => x !== id) : [...value, id]);
  };
  return (
    <div>
      <label className="text-xs text-ink/50 mb-2 block">Доступные разделы</label>
      <div className="flex flex-wrap gap-2">
        {ALL_TABS.map(t => {
          const on = value.includes(t.id);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => toggle(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${on ? "bg-ink text-beige border-ink" : "bg-white text-ink/50 border-beige-dark hover:border-ink/40"}`}
            >
              <Icon name={t.icon} size={12} />
              {t.label}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-ink/30 mt-1.5">Только для роли «Пользователь». Администратор видит всё.</p>
    </div>
  );
}

export function PermissionsBadges({ perms }: { perms: TabId[] | null }) {
  if (!perms) return <span className="text-xs text-ink/30">Все разделы</span>;
  if (perms.length === 0) return <span className="text-xs text-red-400">Нет доступа</span>;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {perms.map(id => {
        const t = ALL_TABS.find(x => x.id === id);
        return t ? (
          <span key={id} className="text-[10px] px-1.5 py-0.5 bg-beige-mid rounded text-ink/60">{t.label}</span>
        ) : null;
      })}
    </div>
  );
}
