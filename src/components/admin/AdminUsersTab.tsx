import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import LoginLogPanel from "@/components/admin/LoginLogPanel";
import EditableUserRow from "@/components/admin/users/EditableUserRow";
import { Avatar, PermissionsEditor, ProfileFields } from "@/components/admin/users/UserWidgets";
import { API, ALL_TABS, AdminUser, DEFAULT_TABS, EMPTY_PROFILE, ProfileForm, ROLE_COLORS, ROLE_LABELS, Role, TabId, parsePermissions } from "@/components/admin/users/usersShared";

export { ALL_TABS, parsePermissions };
export type { TabId };

export default function AdminUsersTab({ authLogin, authPassword, isAdmin = false }: {
  authLogin: string;
  authPassword: string;
  isAdmin?: boolean;
}) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [view, setView] = useState<"staff" | "log">("staff");

  const [newLogin, setNewLogin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<Role>("user");
  const [newFullName, setNewFullName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPerms, setNewPerms] = useState<TabId[]>(DEFAULT_TABS);
  const [newProfile, setNewProfile] = useState<ProfileForm>(EMPTY_PROFILE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    let d: { users?: AdminUser[] } = {};
    if (isAdmin) {
      const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "list_full", auth_login: authLogin, auth_password: authPassword }) });
      if (r.ok) d = await r.json();
    }
    if (!d.users) d = await (await fetch(API, { method: "GET" })).json();
    setUsers(d.users || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createUser = async () => {
    if (!newLogin.trim() || !newPassword.trim()) { setError("Заполните логин и пароль"); return; }
    setSaving(true); setError("");
    const permissions = newRole !== "admin" ? newPerms : null;
    const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", auth_login: authLogin, auth_password: authPassword, login: newLogin, password: newPassword, role: newRole, full_name: newFullName, phone: newPhone, permissions, ...newProfile }) });
    const d = await r.json();
    setSaving(false);
    if (d.error) { setError(d.error); return; }
    setAdding(false); setNewLogin(""); setNewPassword(""); setNewRole("user"); setNewFullName(""); setNewPhone(""); setNewPerms(DEFAULT_TABS); setNewProfile(EMPTY_PROFILE);
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
                <Avatar name={u.full_name} login={u.login} photoUrl={u.photo_url} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-ink">{u.full_name || u.login}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role]}`}>{ROLE_LABELS[u.role]}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${u.max_linked ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}><Icon name={u.max_linked ? "MessageCircleCheck" : "MessageCircleWarning"} size={11} />{u.max_linked ? "Max привязан" : "Max не привязан"}</span>
                  </div>
                  {u.position && <p className="text-xs text-ink/60 mt-0.5">{u.position}</p>}
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

  if (view === "log") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setView("staff")} className="flex items-center gap-1.5 text-sm text-ink/50 hover:text-ink"><Icon name="ArrowLeft" size={16} />К сотрудникам</button>
          <h2 className="font-cormorant text-ink text-2xl font-semibold">Журнал входов</h2>
        </div>
        <LoginLogPanel authLogin={authLogin} authPassword={authPassword} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-cormorant text-ink text-2xl font-semibold">Сотрудники</h2>
        <button onClick={() => setView("log")} className="flex items-center gap-2 border border-beige-dark px-4 py-2.5 rounded-xl text-sm hover:border-ink transition-colors mr-auto ml-4"><Icon name="History" size={16} /> Журнал входов</button>
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
              <label className="text-xs text-ink/50 mb-1 block">ФИО</label>
              <input value={newFullName} onChange={e => setNewFullName(e.target.value)} placeholder="Мария Иванова" className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
            </div>
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Телефон</label>
              <input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="+7 (900) 000-00-00" className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
            </div>
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Роль</label>
              <select value={newRole} onChange={e => setNewRole(e.target.value as Role)} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink bg-white">
                <option value="user">Пользователь</option>
                <option value="psychologist">Психолог</option>
                <option value="admin">Администратор</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Логин *</label>
              <input value={newLogin} onChange={e => setNewLogin(e.target.value)} placeholder="login" className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
            </div>
            <ProfileFields value={newProfile} onChange={setNewProfile} />
            <div className="sm:col-span-2">
              <label className="text-xs text-ink/50 mb-1 block">Пароль *</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
            </div>
            {newRole !== "admin" && (
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
