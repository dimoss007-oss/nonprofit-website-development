import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { Creds, adminCall } from "@/components/admin/donorcabinet/adminApi";

const inp = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 bg-slate-50";
const lbl = "block text-xs uppercase tracking-widest text-slate-400 mb-1";
const rub = (n: number) => `${Math.round(n).toLocaleString("ru-RU")} ₽`;

type Org = { id: number; name: string; email: string | null; inn: string | null };
type Project = { goal_id: number; title: string; amount: number; story: string; photo_url: string | null };
type Draft = { org: Org; year: number; total: number; count: number; projects: Project[] };

export default function AnnualReportTab({ authLogin, authPassword }: { authLogin: string; authPassword: string }) {
  const creds: Creds = { authLogin, authPassword };
  const thisYear = new Date().getFullYear();
  const [q, setQ] = useState("");
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [orgId, setOrgId] = useState("");
  const [year, setYear] = useState(String(thisYear));
  const [draft, setDraft] = useState<Draft | null>(null);
  const [intro, setIntro] = useState("");
  const [families, setFamilies] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      adminCall<{ orgs: Org[] }>(creds, "annual_orgs", { q }).then(d => setOrgs(d.orgs)).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const run = async (name: string, fn: () => Promise<void>) => {
    setBusy(name); setError("");
    try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : "Ошибка"); }
    setBusy("");
  };

  const build = () => run("draft", async () => {
    const d = await adminCall<Draft>(creds, "annual_draft", { org_id: Number(orgId), year: Number(year) });
    setDraft(d);
    setProjects(d.projects);
    setPhotos(d.projects.map(p => p.photo_url).filter((u): u is string => !!u));
    setIntro("");
    if (d.total <= 0) return;
    const g = await adminCall<{ intro: string }>(creds, "annual_intro", { company: d.org.name, year: d.year, total: d.total, projects: d.projects });
    setIntro(g.intro);
  });

  const regenerate = () => run("intro", async () => {
    if (!draft) return;
    const g = await adminCall<{ intro: string }>(creds, "annual_intro", { company: draft.org.name, year: draft.year, total: draft.total, projects });
    setIntro(g.intro);
  });

  const download = () => run("pdf", async () => {
    if (!draft) return;
    const d = await adminCall<{ pdf_base64: string; file_name: string }>(creds, "annual_pdf", {
      company: draft.org.name, year: draft.year, intro, total: draft.total, count: draft.count,
      families: Number(families) || 0, projects, photos: photos.slice(0, 3),
    });
    const bytes = Uint8Array.from(atob(d.pdf_base64), ch => ch.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url; a.download = d.file_name; a.click();
    URL.revokeObjectURL(url);
  });

  const years = Array.from({ length: 6 }, (_, i) => String(thisYear - i));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <h3 className="font-semibold text-slate-800">Годовой отчёт для компании</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-2">
            <label className={lbl}>Компания (поиск по названию, email или ИНН)</label>
            <input className={inp} value={q} onChange={e => setQ(e.target.value)} placeholder="Начните вводить название" />
            <select className={inp} value={orgId} onChange={e => setOrgId(e.target.value)}>
              <option value="">Выберите компанию</option>
              {orgs.map(o => <option key={o.id} value={o.id}>{o.name}{o.inn ? ` (ИНН ${o.inn})` : ""}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Год</label>
            <select className={inp} value={year} onChange={e => setYear(e.target.value)}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <button onClick={build} disabled={!!busy || !orgId} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40">
          <Icon name="FileText" size={15} />{busy === "draft" ? "Собираем..." : "Собрать черновик отчёта"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {draft && draft.total <= 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-sm text-slate-700">
          За {draft.year} год у «{draft.org.name}» не найдено пожертвований. Проверьте год и то, что пожертвования внесены на эту компанию.
        </div>
      )}

      {draft && draft.total > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-50 rounded-xl p-3"><div className="font-bold text-slate-800">{rub(draft.total)}</div><div className="text-xs text-slate-500">вклад за {draft.year}</div></div>
            <div className="bg-slate-50 rounded-xl p-3"><div className="font-bold text-slate-800">{draft.count}</div><div className="text-xs text-slate-500">пожертвований</div></div>
            <div className="bg-slate-50 rounded-xl p-3"><div className="font-bold text-slate-800">{projects.length}</div><div className="text-xs text-slate-500">проектов</div></div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className={lbl}>Вступительное слово ({intro.length} из 1500 знаков)</label>
              <button onClick={regenerate} disabled={!!busy} className="text-xs text-indigo-600 hover:underline disabled:opacity-40">{busy === "intro" ? "Пишем..." : "Написать заново"}</button>
            </div>
            <textarea className={`${inp} min-h-[200px]`} maxLength={1500} value={intro} onChange={e => setIntro(e.target.value)} />
          </div>

          <div>
            <label className={lbl}>Сколько семей получили помощь (необязательно)</label>
            <input type="number" min="0" className={`${inp} max-w-[200px]`} value={families} onChange={e => setFamilies(e.target.value)} />
          </div>

          <div>
            <label className={lbl}>Проекты ({projects.length})</label>
            {projects.length === 0 && <p className="text-sm text-slate-500">Пожертвования без привязки к конкретным сборам: в отчёте будут только общие цифры.</p>}
            <div className="space-y-2">
              {projects.map(p => (
                <div key={p.goal_id} className="border border-slate-100 rounded-xl p-3 flex gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{p.title} <span className="text-slate-400 font-normal">· {rub(p.amount)}</span></p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.story || "История не подготовлена"}</p>
                  </div>
                  <button onClick={() => setProjects(list => list.filter(x => x.goal_id !== p.goal_id))} className="text-xs text-slate-400 hover:text-red-600 self-start">Убрать</button>
                </div>
              ))}
            </div>
          </div>

          {photos.length > 0 && (
            <div>
              <label className={lbl}>Фото (в отчёт попадут первые 3)</label>
              <div className="flex flex-wrap gap-3">
                {photos.map((u, i) => (
                  <div key={u} className={`relative ${i >= 3 ? "opacity-40" : ""}`}>
                    <img src={u} alt="" className="w-28 h-20 object-cover rounded-lg" />
                    <button onClick={() => setPhotos(list => list.filter(x => x !== u))} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-red-600 flex items-center justify-center" aria-label="Убрать фото">
                      <Icon name="X" size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={download} disabled={!!busy || !intro.trim()} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-40">
            <Icon name="Download" size={16} />{busy === "pdf" ? "Готовим файл..." : "Скачать PDF"}
          </button>
        </div>
      )}
    </div>
  );
}
