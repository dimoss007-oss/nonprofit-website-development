import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/e6567f16-b3db-4b0d-9c1f-abed808c2ac8";

type AdminUser = { id: number; login: string; role: "admin" | "user"; full_name?: string; phone?: string; created_at: string; permissions?: string | null };

const ROLE_LABELS = { admin: "Администратор", user: "Пользователь" };
const ROLE_COLORS = { admin: "bg-ink text-beige", user: "bg-beige-dark text-ink" };

export const ALL_TABS = [
  { id: "crm",         label: "Пациенты",     icon: "Users" },
  { id: "news",        label: "Новости",       icon: "Newspaper" },
  { id: "tasks",       label: "Задачи",        icon: "ClipboardList" },
  { id: "requests",    label: "Заявки",        icon: "Inbox" },
  { id: "users",       label: "Сотрудники",    icon: "UserCog" },
  { id: "gallery",     label: "Галерея",       icon: "Images" },
  { id: "fundraising", label: "Фандрайзинг",   icon: "HandCoins" },
] as const;

export type TabId = typeof ALL_TABS[number]["id"];

export function parsePermissions(raw?: string | null): TabId[] | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as TabId[]; }
  catch { return null; }
}

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

function Avatar({ name, login, size = "md" }: { name?: string; login: string; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  return (
    <div className={`${sz} ${getAvatarColor(login)} rounded-xl flex items-center justify-center flex-shrink-0 font-semibold`}>
      {getInitials(name, login)}
    </div>
  );
}

function PermissionsEditor({ value, onChange }: { value: TabId[]; onChange: (v: TabId[]) => void }) {
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

function PermissionsBadges({ perms }: { perms: TabId[] | null }) {
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

export default function AdminUsersTab({ authLogin, authPassword, isAdmin = false }: {
  authLogin: string;
  authPassword: string;
  isAdmin?: boolean;
}) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [newLogin, setNewLogin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "user">("user");
  const [newFullName, setNewFullName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPerms, setNewPerms] = useState<TabId[]>(ALL_TABS.map(t => t.id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    const r = await fetch(API, { method: "GET" });
    const d = await r.json();
    setUsers(d.users || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createUser = async () => {
    if (!newLogin.trim() || !newPassword.trim()) { setError("Заполните логин и пароль"); return; }
    setSaving(true); setError("");
    const permissions = newRole === "user" ? newPerms : null;
    const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", auth_login: authLogin, auth_password: authPassword, login: newLogin, password: newPassword, role: newRole, full_name: newFullName, phone: newPhone, permissions }) });
    const d = await r.json();
    setSaving(false);
    if (d.error) { setError(d.error); return; }
    setAdding(false); setNewLogin(""); setNewPassword(""); setNewRole("user"); setNewFullName(""); setNewPhone(""); setNewPerms(ALL_TABS.map(t => t.id));
    load();
  };

  const deleteUser = async (id: number) => {
    if (!confirm("Удалить пользователя?")) return;
    await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", auth_login: authLogin, auth_password: authPassword, user_id: id }) });
    load();
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <h2 className="font-cormorant text-ink text-2xl font-semibold">Сотрудники</h2>
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="space-y-2">
            <div className="bg-white border border-beige-dark rounded-2xl px-5 py-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-ink rounded-xl flex items-center justify-center flex-shrink-0"><Icon name="Shield" size={16} className="text-beige" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-ink">Администратор</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-ink text-beige">Администратор</span>
                </div>
                <p className="text-xs text-ink/40 mt-0.5">Главный аккаунт системы</p>
              </div>
            </div>
            {users.length === 0 && <p className="text-center text-ink/40 text-sm py-8">Других сотрудников нет</p>}
            {users.map(u => (
              <div key={u.id} className="bg-white border border-beige-dark rounded-2xl px-5 py-4 flex items-center gap-4">
                <Avatar name={u.full_name} login={u.login} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-ink">{u.full_name || u.login}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role]}`}>{ROLE_LABELS[u.role]}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <p className="text-xs text-ink/40">@{u.login}</p>
                    {u.phone && <p className="text-xs text-ink/50 flex items-center gap-1"><Icon name="Phone" size={11} />{u.phone}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-cormorant text-ink text-2xl font-semibold">Сотрудники</h2>
        <button onClick={() => { setAdding(true); setError(""); }} className="flex items-center gap-2 bg-ink text-beige px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-ink/90 transition-colors">
          <Icon name="UserPlus" size={16} /> Добавить
        </button>
      </div>

      <div className="bg-beige-mid border border-beige-dark rounded-2xl px-5 py-4 flex items-start gap-3">
        <Icon name="BellRing" size={18} className="text-ink/40 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-ink">Уведомления о задачах в Max</p>
          <p className="text-xs text-ink/50 mt-1">Чтобы сотрудник получал уведомления в мессенджере Max при назначении задачи — пусть напишет боту команду:</p>
          <code className="inline-block mt-2 bg-white border border-beige-dark text-ink text-xs px-3 py-1.5 rounded-lg font-mono">/bind логин</code>
          <p className="text-xs text-ink/40 mt-1.5">Например: <span className="font-mono">/bind maria</span> — если логин сотрудника «maria»</p>
        </div>
      </div>

      {adding && (
        <div className="bg-white border border-beige-dark rounded-2xl p-6 space-y-4">
          <h3 className="font-semibold text-ink">Новый сотрудник</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Имя / Должность</label>
              <input value={newFullName} onChange={e => setNewFullName(e.target.value)} placeholder="Мария Иванова" className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
            </div>
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Телефон</label>
              <input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="+7 (900) 000-00-00" className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
            </div>
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Роль</label>
              <select value={newRole} onChange={e => setNewRole(e.target.value as "admin" | "user")} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink bg-white">
                <option value="user">Пользователь</option>
                <option value="admin">Администратор</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Логин *</label>
              <input value={newLogin} onChange={e => setNewLogin(e.target.value)} placeholder="login" className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-ink/50 mb-1 block">Пароль *</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
            </div>
            {newRole === "user" && (
              <div className="sm:col-span-2">
                <PermissionsEditor value={newPerms} onChange={setNewPerms} />
              </div>
            )}
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)} className="px-4 py-2 text-sm rounded-lg border border-beige-dark hover:border-ink transition-colors">Отмена</button>
            <button onClick={createUser} disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-ink text-beige hover:bg-ink/90 disabled:opacity-60 transition-colors">{saving ? "Создание..." : "Создать"}</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          <div className="bg-white border border-beige-dark rounded-2xl px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-ink rounded-xl flex items-center justify-center flex-shrink-0"><Icon name="Shield" size={16} className="text-beige" /></div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-ink">Администратор (мастер)</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-ink text-beige">Администратор</span>
              </div>
              <p className="text-xs text-ink/40 mt-0.5">Главный аккаунт — логин и пароль из настроек системы</p>
            </div>
          </div>

          {users.length === 0 && <p className="text-center text-ink/40 text-sm py-8">Дополнительных сотрудников нет</p>}

          {users.map(u => (
            <EditableUserRow
              key={u.id}
              user={u}
              authLogin={authLogin}
              authPassword={authPassword}
              onDeleted={deleteUser}
              onUpdated={load}
              editing={editingId === u.id}
              onEdit={() => setEditingId(u.id)}
              onCancelEdit={() => setEditingId(null)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EditableUserRow({ user, authLogin, authPassword, onDeleted, onUpdated, editing, onEdit, onCancelEdit }: {
  user: AdminUser;
  authLogin: string;
  authPassword: string;
  onDeleted: (id: number) => void;
  onUpdated: () => void;
  editing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
}) {
  const [role, setRole] = useState<"admin" | "user">(user.role);
  const [fullName, setFullName] = useState(user.full_name || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [newPassword, setNewPassword] = useState("");
  const [perms, setPerms] = useState<TabId[]>(() => parsePermissions(user.permissions) ?? ALL_TABS.map(t => t.id));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const permissions = role === "user" ? perms : null;
    await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update", auth_login: authLogin, auth_password: authPassword, user_id: user.id, role, full_name: fullName, phone, new_password: newPassword, permissions }) });
    setSaving(false);
    onCancelEdit();
    onUpdated();
  };

  const currentPerms = parsePermissions(user.permissions);

  if (editing) return (
    <div className="bg-white border border-ink/20 rounded-2xl p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Имя / Должность</label>
          <input value={fullName} onChange={e => setFullName(e.target.value)} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
        </div>
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Телефон</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+7 (900) 000-00-00" className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
        </div>
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Роль</label>
          <select value={role} onChange={e => setRole(e.target.value as "admin" | "user")} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink bg-white">
            <option value="user">Пользователь</option>
            <option value="admin">Администратор</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Новый пароль (необязательно)</label>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Оставьте пустым, чтобы не менять" className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
        </div>
        {role === "user" && (
          <div className="sm:col-span-2">
            <PermissionsEditor value={perms} onChange={setPerms} />
          </div>
        )}
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancelEdit} className="px-3 py-1.5 text-sm rounded-lg border border-beige-dark hover:border-ink transition-colors">Отмена</button>
        <button onClick={save} disabled={saving} className="px-3 py-1.5 text-sm rounded-lg bg-ink text-beige hover:bg-ink/90 disabled:opacity-60 transition-colors">{saving ? "Сохранение..." : "Сохранить"}</button>
      </div>
    </div>
  );

  return (
    <div className="bg-white border border-beige-dark rounded-2xl px-5 py-4 flex items-center gap-4 group">
      <Avatar name={user.full_name} login={user.login} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-ink">{user.full_name || user.login}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_COLORS[user.role]}`}>{ROLE_LABELS[user.role]}</span>
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <p className="text-xs text-ink/40">@{user.login}</p>
          {user.phone && <p className="text-xs text-ink/50 flex items-center gap-1"><Icon name="Phone" size={11} />{user.phone}</p>}
        </div>
        {user.role === "user" && <PermissionsBadges perms={currentPerms} />}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="p-1.5 text-ink/40 hover:text-ink transition-colors"><Icon name="Pencil" size={14} /></button>
        <button onClick={() => onDeleted(user.id)} className="p-1.5 text-ink/30 hover:text-red-400 transition-colors"><Icon name="Trash2" size={14} /></button>
      </div>
    </div>
  );
}
