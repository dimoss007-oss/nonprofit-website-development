import Icon from "@/components/ui/icon";
import { PsychoSession } from "./psychoApi";

interface Props {
  session: PsychoSession;
  strategy: string;
  setStrategy: (v: string) => void;
  busy: string;
  onAttach: () => void;
  onDetach: () => void;
}

export default function PsychoResults({ session, strategy, setStrategy, busy, onAttach, onDetach }: Props) {
  const attached = !!session.attachedStrategy;
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-indigo-200 bg-white p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Icon name="Users" size={18} className="text-indigo-600" />
          <h3 className="font-semibold text-slate-800">Рекомендации для консультантов</h3>
        </div>
        <p className="text-xs text-slate-500">Этот текст увидят консультанты и соцработники в карточке семьи. Отредактируйте его перед прикреплением.</p>
        <textarea className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 min-h-[260px] focus:outline-none focus:border-indigo-400 bg-slate-50" value={strategy} onChange={e => setStrategy(e.target.value)} />
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={onAttach} disabled={!!busy || !session.clientId || !strategy.trim()} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40">
            <Icon name="Paperclip" size={15} />{busy === "attach" ? "Прикрепляем..." : attached ? "Обновить в карточке семьи" : "Прикрепить к карточке семьи"}
          </button>
          {attached && <button onClick={onDetach} disabled={!!busy} className="text-sm text-slate-500 hover:text-red-600">Открепить</button>}
          {!session.clientId && <span className="text-xs text-amber-700">Выберите карточку семьи в форме и сохраните протокол</span>}
          {attached && <span className="text-xs text-green-700">Прикреплено к карточке семьи</span>}
        </div>
      </div>

      <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Icon name="Lock" size={18} className="text-amber-700" />
          <h3 className="font-semibold text-amber-900">Супервизия</h3>
          <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-medium">Только для вас</span>
        </div>
        <p className="text-xs text-amber-800">Конфиденциальный блок: хранится в вашем кабинете и недоступен другим сотрудникам.</p>
        <div className="whitespace-pre-wrap text-sm text-slate-800 leading-relaxed">{session.aiSupervision}</div>
      </div>
    </div>
  );
}
