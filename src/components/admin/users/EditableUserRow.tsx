import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import { Avatar, PermissionsBadges, PermissionsEditor, ProfileFields } from "./UserWidgets";
import { API, AdminUser, DEFAULT_TABS, ProfileForm, ROLE_COLORS, ROLE_LABELS, Role, TabId, fmtDate, parsePermissions, readAsBase64, toProfile } from "./usersShared";

export default function EditableUserRow({ user, authLogin, authPassword, onDeleted, onUpdated, editing, onEdit, onCancelEdit }: {
  user: AdminUser;
  authLogin: string;
  authPassword: string;
  onDeleted: (id: number) => void;
  onUpdated: () => void;
  editing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
}) {
  const [role, setRole] = useState<Role>(user.role);
  const [fullName, setFullName] = useState(user.full_name || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [newPassword, setNewPassword] = useState("");
  const [perms, setPerms] = useState<TabId[]>(() => parsePermissions(user.permissions) ?? DEFAULT_TABS);
  const [profile, setProfile] = useState<ProfileForm>(() => toProfile(user));
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const photoRef = useRef<HTMLInputElement>(null);

  const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setPhotoError("Фото не должно быть больше 5 МБ"); return; }
    setUploadingPhoto(true); setPhotoError("");
    try {
      const file_data = await readAsBase64(file);
      const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "upload_photo", auth_login: authLogin, auth_password: authPassword, user_id: user.id, file_name: file.name, file_data, file_type: file.type }) });
      const d = await r.json();
      if (d.error) setPhotoError(d.error); else onUpdated();
    } catch {
      setPhotoError("Не удалось загрузить фото");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const save = async () => {
    setSaving(true);
    const permissions = role !== "admin" ? perms : null;
    await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update", auth_login: authLogin, auth_password: authPassword, user_id: user.id, role, full_name: fullName, phone, new_password: newPassword, permissions, ...profile }) });
    setSaving(false);
    onCancelEdit();
    onUpdated();
  };

  const currentPerms = parsePermissions(user.permissions);

  if (editing) return (
    <div className="bg-white border border-ink/20 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => photoRef.current?.click()} className="relative rounded-xl overflow-hidden hover:opacity-80 transition-opacity">
          <Avatar name={user.full_name} login={user.login} size="lg" photoUrl={user.photo_url} />
          {uploadingPhoto && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Icon name="Loader" size={16} className="animate-spin text-white" /></div>}
        </button>
        <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
        <div>
          <button type="button" onClick={() => photoRef.current?.click()} className="text-sm text-ink underline underline-offset-2">{user.photo_url ? "Заменить фото" : "Загрузить фото"}</button>
          {photoError && <p className="text-xs text-red-500 mt-1">{photoError}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-ink/50 mb-1 block">ФИО</label>
          <input value={fullName} onChange={e => setFullName(e.target.value)} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
        </div>
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Телефон</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+7 (900) 000-00-00" className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
        </div>
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Роль</label>
          <select value={role} onChange={e => setRole(e.target.value as Role)} className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink bg-white">
            <option value="user">Пользователь</option>
            <option value="psychologist">Психолог</option>
                <option value="admin">Администратор</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Новый пароль (необязательно)</label>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Оставьте пустым, чтобы не менять" className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
        </div>
        <ProfileFields value={profile} onChange={setProfile} />
        {role !== "admin" && (
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
      <Avatar name={user.full_name} login={user.login} photoUrl={user.photo_url} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-ink">{user.full_name || user.login}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_COLORS[user.role]}`}>{ROLE_LABELS[user.role]}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${user.max_linked ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}><Icon name={user.max_linked ? "MessageCircleCheck" : "MessageCircleWarning"} size={11} />{user.max_linked ? "Max привязан" : "Max не привязан"}</span>
        </div>
        {user.position && <p className="text-xs text-ink/60 mt-0.5">{user.position}</p>}
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <p className="text-xs text-ink/40">@{user.login}</p>
          {user.birth_date && <p className="text-xs text-ink/50 flex items-center gap-1"><Icon name="Cake" size={11} />{fmtDate(user.birth_date)}</p>}
          {(user.passport_series || user.passport_number) && <p className="text-xs text-ink/50 flex items-center gap-1"><Icon name="IdCard" size={11} />{[user.passport_series, user.passport_number].filter(Boolean).join(" ")}</p>}
          {user.phone && <p className="text-xs text-ink/50 flex items-center gap-1"><Icon name="Phone" size={11} />{user.phone}</p>}
        </div>
        {user.role !== "admin" && <PermissionsBadges perms={currentPerms} />}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="p-1.5 text-ink/40 hover:text-ink transition-colors"><Icon name="Pencil" size={14} /></button>
        <button onClick={() => onDeleted(user.id)} className="p-1.5 text-ink/30 hover:text-red-400 transition-colors"><Icon name="Trash2" size={14} /></button>
      </div>
    </div>
  );
}
