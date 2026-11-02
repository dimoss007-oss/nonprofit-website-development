import { useEffect, useRef, useState } from "react";
import { Creds, adminCall } from "@/components/admin/donorcabinet/adminApi";
import { PENZA_DISTRICTS } from "@/lib/penza-map";

const inp = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 bg-slate-50";
const lbl = "block text-xs uppercase tracking-widest text-slate-400 mb-1";

type Stats = { period_label: string; trips: number; families: number; km: number; districts: number; settlements: number; parcels: number; map_url: string | null };
type Action = { id: number; title: string; amount: number; goal_id: number | null; sort_order: number; is_active: boolean; result_text: string };
type Trip = { id: number; district: string; lat: number; lon: number; title: string; description: string; photo_url: string | null; trip_date: string | null; consent_obtained: boolean; is_published: boolean };
type Partner = { id: number; company: string; contact_name: string; phone: string; interest: string; status: string; created_at: string };
type TripForm = { id: number; district: string; title: string; description: string; photo_url: string; trip_date: string; consent: boolean };

const EMPTY_TRIP: TripForm = { id: 0, district: "", title: "", description: "", photo_url: "", trip_date: "", consent: false };
const INTERESTS: Record<string, string> = { trips: "Выезды", car: "Автомобиль", other: "Другое" };
const STATUSES: Record<string, string> = { new: "Новая", in_work: "В работе", done: "Обработана" };
const STAT_FIELDS: { k: "trips" | "families" | "districts" | "settlements" | "km" | "parcels"; l: string }[] = [
  { k: "trips", l: "Выездов" }, { k: "families", l: "Семей получили помощь" }, { k: "districts", l: "Районов области" },
  { k: "settlements", l: "Населённых пунктов" }, { k: "km", l: "Километров в пути" }, { k: "parcels", l: "Продуктовых наборов" },
];

export default function BrigadeAdminTab({ authLogin, authPassword }: { authLogin: string; authPassword: string }) {
  const creds: Creds = { authLogin, authPassword };
  const [stats, setStats] = useState<Stats>({ period_label: "", trips: 0, families: 0, km: 0, districts: 0, settlements: 0, parcels: 0, map_url: "" });
  const [actions, setActions] = useState<Action[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [tripForm, setTripForm] = useState<TripForm>(EMPTY_TRIP);
  const [newTitle, setNewTitle] = useState("");
  const [newAmount, setNewAmount] = useState("1000");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const d = await adminCall<{ stats: Stats; actions: Action[]; trips: Trip[]; partners: Partner[] }>(creds, "brigade_get");
      setStats({ ...d.stats, map_url: d.stats.map_url || "" });
      setActions(d.actions); setTrips(d.trips); setPartners(d.partners);
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка"); }
  };
  useEffect(() => { load(); }, []);

  const run = async (fn: () => Promise<void>, ok = "Сохранено") => {
    setError(""); setInfo("");
    try { await fn(); setInfo(ok); await load(); } catch (e) { setError(e instanceof Error ? e.message : "Ошибка"); }
  };

  const patch = (id: number, p: Partial<Action>) => setActions(list => list.map(a => a.id === id ? { ...a, ...p } : a));
  const setT = <K extends keyof TripForm>(k: K, v: TripForm[K]) => setTripForm(f => ({ ...f, [k]: v }));

  const saveTrip = (publish: boolean) => run(async () => {
    const d = PENZA_DISTRICTS.find(x => x.name === tripForm.district);
    await adminCall(creds, "brigade_trip_save", {
      id: tripForm.id || undefined, district: tripForm.district, lat: d?.lat, lon: d?.lon, title: tripForm.title,
      description: tripForm.description, photo_url: tripForm.photo_url, trip_date: tripForm.trip_date,
      consent_obtained: tripForm.consent, is_published: publish,
    });
    setTripForm(EMPTY_TRIP);
  }, publish ? "Опубликовано на карте" : "Сохранено как черновик");

  const uploadPhoto = (file: File) => run(async () => {
    const data = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(",")[1] || "");
      r.onerror = () => reject(new Error("Не удалось прочитать файл"));
      r.readAsDataURL(file);
    });
    const d = await adminCall<{ photo_url: string }>(creds, "brigade_trip_photo", { file_data: data, file_type: file.type });
    setT("photo_url", d.photo_url);
  }, "Фото загружено");

  const toggleTrip = (t: Trip) => run(async () => {
    await adminCall(creds, "brigade_trip_save", { ...t, consent_obtained: t.consent_obtained, is_published: !t.is_published });
  });

  return (
    <div className="space-y-6">
      {(error || info) && <p className={`text-sm ${error ? "text-red-600" : "text-green-700"}`}>{error || info}</p>}

      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <h3 className="font-semibold text-slate-800">Цифры за отчётный период</h3>
        <div>
          <label className={lbl}>Период (подпись над цифрами)</label>
          <input className={inp} value={stats.period_label} onChange={e => setStats(s => ({ ...s, period_label: e.target.value }))} placeholder="За 3 квартал 2026" />
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {STAT_FIELDS.map(f => (
            <div key={f.k}>
              <label className={lbl}>{f.l}</label>
              <input type="number" min="0" className={inp} value={stats[f.k]} onChange={e => setStats(s => ({ ...s, [f.k]: Number(e.target.value) }))} />
            </div>
          ))}
        </div>
        <button onClick={() => run(() => adminCall(creds, "brigade_stats_save", stats).then(() => undefined))} className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700">Сохранить цифры</button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <h3 className="font-semibold text-slate-800">{tripForm.id ? "Редактирование выезда" : "Отметка на карте добрых дел"}</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Район</label>
            <select className={inp} value={tripForm.district} onChange={e => setT("district", e.target.value)}>
              <option value="">Выберите район</option>
              {PENZA_DISTRICTS.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Дата выезда</label>
            <input type="date" className={inp} value={tripForm.trip_date} onChange={e => setT("trip_date", e.target.value)} />
          </div>
        </div>
        <div>
          <label className={lbl}>Заголовок</label>
          <input className={inp} value={tripForm.title} onChange={e => setT("title", e.target.value)} placeholder="Выезд в Сосновоборский район" />
        </div>
        <div>
          <label className={lbl}>Краткое описание (без имён и адресов)</label>
          <textarea className={`${inp} min-h-[80px]`} maxLength={1000} value={tripForm.description} onChange={e => setT("description", e.target.value)} />
        </div>
        <div className="flex items-center gap-3">
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); e.target.value = ""; }} />
          <button onClick={() => fileRef.current?.click()} className="px-4 py-2 rounded-xl text-sm border border-slate-200 text-slate-700 hover:bg-slate-50">{tripForm.photo_url ? "Заменить фото" : "Загрузить фото"}</button>
          {tripForm.photo_url && <img src={tripForm.photo_url} alt="" className="h-14 rounded-lg" />}
        </div>
        <label className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer bg-amber-50 border border-amber-100 rounded-xl p-3">
          <input type="checkbox" checked={tripForm.consent} onChange={e => setT("consent", e.target.checked)} className="w-4 h-4 mt-0.5" />
          Подтверждаю: на фото и в тексте нет данных, по которым можно узнать семью, либо есть письменное согласие на публикацию.
        </label>
        <div className="flex flex-wrap gap-3">
          <button disabled={!tripForm.district || !tripForm.title.trim()} onClick={() => saveTrip(false)} className="px-5 py-2 rounded-xl text-sm border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40">Сохранить черновик</button>
          <button disabled={!tripForm.district || !tripForm.title.trim() || !tripForm.consent} onClick={() => saveTrip(true)} className="px-5 py-2 rounded-xl text-sm font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-40">Опубликовать на карте</button>
          {tripForm.id > 0 && <button onClick={() => setTripForm(EMPTY_TRIP)} className="px-5 py-2 rounded-xl text-sm text-slate-500">Отмена</button>}
        </div>
        <div className="grid sm:grid-cols-2 gap-3 pt-2">
          {trips.map(t => (
            <div key={t.id} className="border border-slate-100 rounded-xl p-3 space-y-1.5">
              <p className="text-sm font-medium text-slate-800">{t.title}</p>
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">{t.district}</span>
                <span className={`px-2 py-0.5 rounded-full ${t.is_published ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>{t.is_published ? "На карте" : "Черновик"}</span>
              </div>
              <div className="flex gap-3 text-xs">
                <button onClick={() => setTripForm({ id: t.id, district: t.district, title: t.title, description: t.description, photo_url: t.photo_url || "", trip_date: t.trip_date || "", consent: t.consent_obtained })} className="text-slate-500 hover:text-slate-800">Изменить</button>
                {t.consent_obtained && <button onClick={() => toggleTrip(t)} className="text-slate-500 hover:text-slate-800">{t.is_published ? "Снять с карты" : "Опубликовать"}</button>}
                <button onClick={() => { if (confirm("Удалить отметку?")) run(() => adminCall(creds, "brigade_trip_delete", { id: t.id }).then(() => undefined), "Удалено"); }} className="text-slate-400 hover:text-red-600">Удалить</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <h3 className="font-semibold text-slate-800">Карточки целевых сборов</h3>
        <div className="space-y-3">
          {actions.map(a => (
            <div key={a.id} className="border border-slate-100 rounded-xl p-3 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <input className={`${inp} flex-1 min-w-[200px]`} value={a.title} onChange={e => patch(a.id, { title: e.target.value })} />
                <input type="number" min="1" className={`${inp} w-28`} value={a.amount} onChange={e => patch(a.id, { amount: Number(e.target.value) })} />
                <label className="flex items-center gap-1.5 text-sm text-slate-600"><input type="checkbox" checked={a.is_active} onChange={e => patch(a.id, { is_active: e.target.checked })} />Показывать</label>
              </div>
              <input className={inp} value={a.result_text || ""} onChange={e => patch(a.id, { result_text: e.target.value })} placeholder="Что получится на эту сумму" />
              <div className="flex gap-3">
                <button onClick={() => run(() => adminCall(creds, "brigade_action_save", a).then(() => undefined))} className="px-3 py-1.5 rounded-xl text-xs bg-indigo-600 text-white">Сохранить</button>
                <button onClick={() => { if (confirm("Удалить карточку?")) run(() => adminCall(creds, "brigade_action_delete", { id: a.id }).then(() => undefined), "Удалено"); }} className="text-xs text-slate-400 hover:text-red-600">Удалить</button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <input className={`${inp} flex-1 min-w-[200px]`} placeholder="Новая карточка, например: Купить зимние шины" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
          <input type="number" min="1" className={`${inp} w-28`} value={newAmount} onChange={e => setNewAmount(e.target.value)} />
          <button disabled={!newTitle.trim()} onClick={() => run(async () => { await adminCall(creds, "brigade_action_save", { title: newTitle, amount: Number(newAmount), sort_order: actions.length + 1 }); setNewTitle(""); }, "Карточка добавлена")} className="px-4 py-2 rounded-xl text-sm font-semibold bg-green-600 text-white disabled:opacity-40">Добавить</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <h3 className="font-semibold text-slate-800">Заявки партнёров ({partners.length})</h3>
        {partners.length === 0 && <p className="text-sm text-slate-500">Пока нет заявок. Новые также приходят уведомлением в бот MAX.</p>}
        {partners.map(p => (
          <div key={p.id} className="border border-slate-100 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm">
              <p className="font-medium text-slate-800">{p.company} <span className="text-slate-400 font-normal">· {INTERESTS[p.interest] || p.interest}</span></p>
              <p className="text-slate-600">{p.contact_name}, <a href={`tel:${p.phone}`} className="text-indigo-600">{p.phone}</a> <span className="text-slate-400">· {new Date(p.created_at).toLocaleDateString("ru-RU")}</span></p>
            </div>
            <select className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm" value={p.status} onChange={e => run(() => adminCall(creds, "partner_status", { id: p.id, status: e.target.value }).then(() => undefined))}>
              {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
