import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { COLOR_KEYS, colorOf } from "@/components/cabinet/cabinet.shared";
import { Creds, ICON_CHOICES, KIND_LABELS, adminCall, inputCls } from "@/components/admin/donorcabinet/adminApi";

type Item = Record<string, any>;
type Entity = "achievement" | "level" | "impact";

const EMPTY: Record<Entity, Item> = {
  achievement: { title: "", description: "", icon: "Award", color: "amber", kind: "total_amount", threshold: 1000, reward_message: "", certificate: false, gift_title: "", is_active: true, sort_order: 50 },
  level: { title: "", description: "", min_amount: 0, icon: "Heart", color: "rose", sort_order: 50 },
  impact: { title: "", icon: "Heart", unit_label: "", unit_cost: 500, sort_order: 50, is_active: true },
};

const HEADINGS: Record<Entity, { title: string; hint: string; add: string }> = {
  achievement: { title: "Ачивки", hint: "Награды, которые жертвователи получают автоматически или от вас вручную", add: "Добавить ачивку" },
  level: { title: "Уровни", hint: "Ступени с прогресс-баром в кабинете. Уровень зависит от общей суммы помощи", add: "Добавить уровень" },
  impact: { title: "На что пошли деньги", hint: "Сколько единиц помощи оплачивает вклад жертвователя. Считается автоматически по сумме", add: "Добавить пункт" },
};

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <div className={wide ? "sm:col-span-2" : ""}><label className="text-xs text-ink/50 mb-1 block">{label}</label>{children}</div>;
}

function IconColor({ item, set, colors = true }: { item: Item; set: (k: string, v: unknown) => void; colors?: boolean }) {
  return (
    <>
      <Field label="Значок">
        <div className="flex flex-wrap gap-1.5">
          {ICON_CHOICES.map((n) => (
            <button key={n} type="button" onClick={() => set("icon", n)} className={`w-8 h-8 rounded-lg flex items-center justify-center border ${item.icon === n ? "bg-ink text-beige border-ink" : "bg-white text-ink/60 border-beige-dark hover:border-ink"}`}><Icon name={n} size={15} /></button>
          ))}
        </div>
      </Field>
      {colors && (
        <Field label="Цвет">
          <div className="flex gap-2">
            {COLOR_KEYS.map((c) => (
              <button key={c} type="button" onClick={() => set("color", c)} className={`w-8 h-8 rounded-full border-2 ${colorOf(c).bg} ${item.color === c ? "border-ink" : "border-transparent"}`} aria-label={c} />
            ))}
          </div>
        </Field>
      )}
    </>
  );
}

export default function DonorCatalog({ creds, entity }: { creds: Creds; entity: Entity }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Item | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const head = HEADINGS[entity];

  const load = async () => {
    setLoading(true);
    try { setItems((await adminCall<{ items: Item[] }>(creds, "crud_list", { entity })).items); }
    catch (e) { setError(e instanceof Error ? e.message : "Ошибка"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [entity]);

  const set = (k: string, v: unknown) => setEditing((p) => (p ? { ...p, [k]: v } : p));

  const save = async () => {
    if (!editing) return;
    setSaving(true); setError("");
    try { await adminCall(creds, "crud_save", { entity, item: editing }); setEditing(null); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Не удалось сохранить"); }
    finally { setSaving(false); }
  };

  const remove = async (it: Item) => {
    const extra = entity === "achievement" && it.awarded_count ? ` Она выдана ${it.awarded_count} жертвователям и пропадёт у них.` : "";
    if (!confirm(`Удалить «${it.title}»?${extra}`)) return;
    try { await adminCall(creds, "crud_delete", { entity, id: it.id }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Не удалось удалить"); }
  };

  const toggleActive = async (it: Item) => {
    try { await adminCall(creds, "crud_save", { entity, item: { ...it, is_active: !it.is_active } }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Ошибка"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div><h3 className="font-semibold text-ink">{head.title}</h3><p className="text-xs text-ink/50 mt-0.5 max-w-xl">{head.hint}</p></div>
        <button onClick={() => { setEditing({ ...EMPTY[entity] }); setError(""); }} className="flex items-center gap-1.5 bg-ink text-beige px-4 py-2 rounded-xl text-sm font-semibold hover:bg-ink/90 transition-colors"><Icon name="Plus" size={14} />{head.add}</button>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      {editing && (
        <div className="bg-white border border-ink/20 rounded-2xl p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Название *"><input value={editing.title || ""} onChange={(e) => set("title", e.target.value)} className={inputCls} /></Field>
            {entity !== "impact" && <Field label="Описание"><input value={editing.description || ""} onChange={(e) => set("description", e.target.value)} className={inputCls} /></Field>}
            {entity === "level" && <Field label="Нижняя граница суммы, ₽"><input type="number" min={0} value={editing.min_amount} onChange={(e) => set("min_amount", e.target.value)} className={inputCls} /></Field>}
            {entity === "impact" && (
              <>
                <Field label="Что оплачивает помощь *"><input value={editing.unit_label || ""} onChange={(e) => set("unit_label", e.target.value)} placeholder="дней питания для семьи" className={inputCls} /></Field>
                <Field label="Стоимость одной единицы, ₽ *"><input type="number" min={1} value={editing.unit_cost} onChange={(e) => set("unit_cost", e.target.value)} className={inputCls} /></Field>
              </>
            )}
            {entity === "achievement" && (
              <>
                <Field label="За что выдаётся">
                  <select value={editing.kind} onChange={(e) => set("kind", e.target.value)} className={inputCls}>
                    {Object.entries(KIND_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </Field>
                {editing.kind !== "manual" && editing.kind !== "first_donation" && (
                  <Field label="Порог"><input type="number" min={1} value={editing.threshold} onChange={(e) => set("threshold", e.target.value)} className={inputCls} /></Field>
                )}
                <Field label="Личное благодарственное сообщение" wide><textarea value={editing.reward_message || ""} onChange={(e) => set("reward_message", e.target.value)} rows={3} placeholder="Появится в сообщениях кабинета, когда жертвователь получит награду" className={inputCls} /></Field>
                <Field label="Реальный подарок (необязательно)"><input value={editing.gift_title || ""} onChange={(e) => set("gift_title", e.target.value)} placeholder="Открытка с рисунком детей" className={inputCls} /></Field>
                <Field label="Сертификат"><label className="flex items-center gap-2 text-sm pt-2"><input type="checkbox" checked={!!editing.certificate} onChange={(e) => set("certificate", e.target.checked)} className="accent-sage w-4 h-4" />Можно скачать PDF-сертификат за эту награду</label></Field>
              </>
            )}
            <IconColor item={editing} set={set} colors={entity !== "impact"} />
            <Field label="Порядок в списке"><input type="number" value={editing.sort_order} onChange={(e) => set("sort_order", e.target.value)} className={inputCls} /></Field>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm rounded-lg border border-beige-dark hover:border-ink transition-colors">Отмена</button>
            <button onClick={save} disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-ink text-beige hover:bg-ink/90 disabled:opacity-60 transition-colors">{saving ? "Сохранение..." : "Сохранить"}</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {items.map((it) => {
            const c = colorOf(it.color);
            return (
              <div key={it.id} className={`bg-white border border-beige-dark rounded-2xl px-4 py-3 flex items-center gap-3 group ${it.is_active === false ? "opacity-50" : ""}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${entity === "impact" ? "bg-beige-mid text-ink/60" : `${c.bg} ${c.text}`}`}><Icon name={it.icon} fallback="Heart" size={18} /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-ink">{it.title}</p>
                  <p className="text-xs text-ink/50 truncate">
                    {entity === "achievement" && `${KIND_LABELS[it.kind]}${it.kind !== "manual" && it.kind !== "first_donation" ? `: ${Number(it.threshold)}` : ""} · выдана ${it.awarded_count ?? 0}${it.certificate ? " · сертификат" : ""}${it.gift_title ? ` · подарок: ${it.gift_title}` : ""}`}
                    {entity === "level" && `от ${Number(it.min_amount).toLocaleString("ru-RU")} ₽ ${it.description ? "· " + it.description : ""}`}
                    {entity === "impact" && `${Number(it.unit_cost).toLocaleString("ru-RU")} ₽ = 1 единица: ${it.unit_label}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  {it.is_active !== undefined && <button onClick={() => toggleActive(it)} className="p-1.5 text-ink/40 hover:text-ink" title={it.is_active ? "Отключить" : "Включить"}><Icon name={it.is_active ? "Eye" : "EyeOff"} size={15} /></button>}
                  <button onClick={() => { setEditing({ ...it }); setError(""); }} className="p-1.5 text-ink/40 hover:text-ink"><Icon name="Pencil" size={15} /></button>
                  <button onClick={() => remove(it)} className="p-1.5 text-ink/30 hover:text-red-500"><Icon name="Trash2" size={15} /></button>
                </div>
              </div>
            );
          })}
          {!items.length && <p className="text-center text-sm text-ink/40 py-8">Пока ничего нет</p>}
        </div>
      )}
    </div>
  );
}
