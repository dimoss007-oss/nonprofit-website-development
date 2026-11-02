import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import PsychoSessionForm from "./psycho/PsychoSessionForm";
import PsychoResults from "./psycho/PsychoResults";
import { Creds, FamilyOption, PsychoRow, PsychoSession, emptySession, fromRow, psychoCall, toPayload } from "./psycho/psychoApi";

export default function PsychologistTab({ authLogin, authPassword }: { authLogin: string; authPassword: string }) {
  const creds: Creds = { authLogin, authPassword };
  const [sessions, setSessions] = useState<PsychoSession[]>([]);
  const [families, setFamilies] = useState<FamilyOption[]>([]);
  const [current, setCurrent] = useState<PsychoSession>(emptySession());
  const [strategy, setStrategy] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const load = async () => {
    const d = await psychoCall<{ sessions: PsychoRow[] }>(creds, "list");
    setSessions(d.sessions.map(fromRow));
  };

  useEffect(() => {
    load().catch(e => setError(e.message));
    psychoCall<{ families: FamilyOption[] }>(creds, "families").then(d => setFamilies(d.families)).catch(() => {});
  }, []);

  const open = (s: PsychoSession) => { setCurrent(s); setStrategy(s.aiConsultantStrategy || ""); setError(""); setInfo(""); };
  const startNew = () => open(emptySession());

  const run = async (name: string, fn: () => Promise<void>) => {
    setBusy(name); setError(""); setInfo("");
    try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : "Ошибка"); }
    setBusy("");
  };

  const persist = async (): Promise<string> => {
    const d = await psychoCall<{ id: string }>(creds, "save", toPayload(current));
    setCurrent(c => ({ ...c, id: d.id }));
    return d.id;
  };

  const save = () => run("save", async () => { await persist(); await load(); setInfo("Протокол сохранён"); });

  const analyze = () => run("analyze", async () => {
    const id = await persist();
    const d = await psychoCall<{ ai_consultant_strategy: string; ai_supervision: string }>(creds, "analyze", { id });
    setCurrent(c => ({ ...c, id, aiConsultantStrategy: d.ai_consultant_strategy, aiSupervision: d.ai_supervision }));
    setStrategy(d.ai_consultant_strategy);
    await load();
  });

  const attach = (detach: boolean) => run("attach", async () => {
    await psychoCall(creds, "attach", { id: current.id, text: strategy, detach });
    setCurrent(c => ({ ...c, aiConsultantStrategy: strategy || c.aiConsultantStrategy, attachedStrategy: detach ? undefined : strategy }));
    await load();
    setInfo(detach ? "Рекомендации откреплены" : "Рекомендации прикреплены к карточке семьи");
  });

  const remove = (s: PsychoSession) => {
    if (!confirm("Удалить протокол? Вместе с ним удалятся рекомендации и супервизия.")) return;
    run("delete", async () => {
      await psychoCall(creds, "delete", { id: s.id });
      if (current.id === s.id) startNew();
      await load();
    });
  };

  const hasResults = !!current.aiSupervision;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Кабинет психолога</h1>
          <p className="text-sm text-slate-500 mt-1">Протоколы сессий и ИИ-супервизия. ФИО клиента в нейросеть не передаётся.</p>
        </div>
        <button onClick={startNew} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700">
          <Icon name="Plus" size={15} />Новый протокол
        </button>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6 items-start">
        <aside className="bg-white rounded-2xl border border-slate-200 p-3 space-y-1.5 max-h-[70vh] overflow-y-auto">
          {sessions.length === 0 && <p className="text-sm text-slate-400 p-3">Протоколов пока нет</p>}
          {sessions.map(s => (
            <div key={s.id} className={`group rounded-xl px-3 py-2.5 border cursor-pointer ${current.id === s.id ? "border-indigo-300 bg-indigo-50" : "border-transparent hover:bg-slate-50"}`} onClick={() => open(s)}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-800 truncate">{s.clientName}</span>
                <button onClick={e => { e.stopPropagation(); remove(s); }} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600" aria-label="Удалить протокол"><Icon name="Trash2" size={14} /></button>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                {new Date(s.date).toLocaleDateString("ru-RU")}
                {s.aiSupervision && <span className="px-1.5 rounded bg-amber-100 text-amber-800">анализ</span>}
                {s.attachedStrategy && <span className="px-1.5 rounded bg-green-100 text-green-700">в карточке</span>}
              </div>
            </div>
          ))}
        </aside>

        <div className="space-y-6 min-w-0">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5">
            <h2 className="font-semibold text-slate-800">{current.id ? "Протокол сессии" : "Новый протокол"}</h2>
            <PsychoSessionForm value={current} families={families} onChange={setCurrent} disabled={!!busy} />
            <div className="flex flex-wrap gap-3">
              <button onClick={save} disabled={!!busy || !current.clientName.trim()} className="px-5 py-2.5 rounded-xl text-sm border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40">{busy === "save" ? "Сохраняем..." : "Сохранить протокол"}</button>
              <button onClick={analyze} disabled={!!busy || !current.clientName.trim()} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40">
                <Icon name="Sparkles" size={15} />{busy === "analyze" ? "Анализируем (до минуты)..." : "Проанализировать сессию через YandexGPT"}
              </button>
            </div>
            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
            {info && <p className="text-sm text-green-700">{info}</p>}
          </div>

          {hasResults && (
            <PsychoResults session={current} strategy={strategy} setStrategy={setStrategy} busy={busy} onAttach={() => attach(false)} onDetach={() => attach(true)} />
          )}
        </div>
      </div>
    </div>
  );
}
