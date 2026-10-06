import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { fmtDate, money } from "@/components/cabinet/cabinet.shared";
import { Creds, adminCall, inputCls } from "@/components/admin/donorcabinet/adminApi";

type Account = { id: number; email: string; full_name?: string; total: number; count: number; level?: string | null; awards: number; last_login_at?: string | null; last_dt?: string | null };
type Ach = { id: number; title: string; kind: string };
type Award = { id: number; title: string; awarded_at: string; source: string };

export default function DonorPeople({ creds }: { creds: Creds }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [achs, setAchs] = useState<Ach[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [awards, setAwards] = useState<Award[]>([]);
  const [pick, setPick] = useState<number | "">("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setAccounts((await adminCall<{ accounts: Account[] }>(creds, "accounts")).accounts);
      const a = await adminCall<{ items: Ach[] }>(creds, "crud_list", { entity: "achievement" });
      setAchs(a.items);
    } catch (e) { setError(e instanceof Error ? e.message : "Ошибка"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const open = async (id: number) => {
    if (openId === id) { setOpenId(null); return; }
    setOpenId(id); setPick("");
    try { setAwards((await adminCall<{ awards: Award[] }>(creds, "account_awards", { account_id: id })).awards); }
    catch (e) { setError(e instanceof Error ? e.message : "Ошибка"); }
  };

  const give = async (accountId: number) => {
    if (!pick) return;
    try { await adminCall(creds, "award", { account_id: accountId, achievement_id: pick }); await open(accountId); setOpenId(accountId); await load(); setPick(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Ошибка"); }
  };

  const takeAway = async (accountId: number, achievementId: number) => {
    if (!confirm("Забрать награду у жертвователя?")) return;
    try { await adminCall(creds, "revoke", { account_id: accountId, achievement_id: achievementId }); setAwards((p) => p.filter((x) => x.id !== achievementId)); await load(); setOpenId(accountId); }
    catch (e) { setError(e instanceof Error ? e.message : "Ошибка"); }
  };

  const q = search.trim().toLowerCase();
  const filtered = accounts.filter((a) => !q || a.email.toLowerCase().includes(q) || (a.full_name || "").toLowerCase().includes(q));

  return (
    <div className="space-y-4">
      <div className="relative">
        <Icon name="Search" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по имени или email..." className="w-full bg-white border border-beige-dark rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-ink" />
      </div>
      {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      {loading ? <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="space-y-2">
          {filtered.map((a) => (
            <div key={a.id} className="bg-white border border-beige-dark rounded-2xl">
              <button onClick={() => open(a.id)} className="w-full text-left px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{a.full_name || a.email}</p>
                  <p className="text-xs text-ink/50 truncate">{a.full_name ? `${a.email} · ` : ""}{a.count} пожертв. {a.last_dt ? `· последнее ${fmtDate(a.last_dt)}` : ""} {a.last_login_at ? "· заходил в кабинет" : "· в кабинет не заходил"}</p>
                </div>
                {a.level && <span className="text-[11px] px-2 py-0.5 rounded-full bg-beige-mid text-ink/60">{a.level}</span>}
                <span className="text-[11px] text-ink/50 flex items-center gap-1"><Icon name="Award" size={12} />{a.awards}</span>
                <span className="text-sm font-semibold text-ink w-24 text-right">{money(a.total)}</span>
              </button>
              {openId === a.id && (
                <div className="px-4 pb-4 pt-1 border-t border-beige-mid space-y-3">
                  <div className="flex flex-wrap gap-2 pt-3">
                    {awards.length === 0 && <span className="text-xs text-ink/40">Наград пока нет</span>}
                    {awards.map((w) => (
                      <span key={w.id} className="inline-flex items-center gap-1.5 text-xs bg-beige-mid rounded-full pl-3 pr-1.5 py-1">
                        {w.title}<span className="text-ink/40">{w.source === "manual" ? "вручную" : "авто"}</span>
                        <button onClick={() => takeAway(a.id, w.id)} className="text-ink/30 hover:text-red-500" title="Забрать награду"><Icon name="X" size={12} /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <select value={pick} onChange={(e) => setPick(Number(e.target.value))} className={`${inputCls} max-w-xs`}>
                      <option value="">Выдать награду вручную...</option>
                      {achs.filter((x) => !awards.some((w) => w.id === x.id)).map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}
                    </select>
                    <button onClick={() => give(a.id)} disabled={!pick} className="px-4 py-2 text-sm rounded-lg bg-ink text-beige hover:bg-ink/90 disabled:opacity-50 transition-colors">Выдать</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {!filtered.length && <p className="text-center text-sm text-ink/40 py-8">Жертвователей не найдено</p>}
        </div>
      )}
    </div>
  );
}
