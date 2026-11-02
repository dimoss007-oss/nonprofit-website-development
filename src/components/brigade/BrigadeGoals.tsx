import Icon from "@/components/ui/icon";

export type BrigadeAction = { id: number; title: string; amount: number; goal_id: number; result_text: string };

const ICONS: Record<number, string> = { 0: "Fuel", 1: "ShoppingBasket", 2: "MessageCircle" };
const nf = (n: number) => n.toLocaleString("ru-RU");

export default function BrigadeGoals({ actions, onPick }: { actions: BrigadeAction[]; onPick: (a: BrigadeAction) => void }) {
  if (actions.length === 0) return null;
  return (
    <div>
      <h3 className="font-golos text-xl font-bold text-white mb-1">Целевые сборы</h3>
      <p className="text-white/85 text-sm mb-5">Выберите, что именно вы хотите оплатить</p>
      <div className="grid sm:grid-cols-3 gap-4">
        {actions.map((a, i) => (
          <button key={a.id} onClick={() => onPick(a)} className="text-left bg-white rounded-xl p-5 flex flex-col hover:shadow-lg transition-shadow focus-visible:outline-offset-2">
            <Icon name={ICONS[i % 3]} fallback="Circle" size={26} className="text-teal-deep" />
            <span className="font-golos text-3xl font-bold text-azure mt-3">{nf(a.amount)} ₽</span>
            <span className="font-semibold text-navy mt-1 leading-snug">{a.title}</span>
            {a.result_text && <span className="text-sm text-navy/75 mt-2 leading-relaxed flex-1">{a.result_text}</span>}
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-azure">Оплатить <Icon name="ArrowRight" size={14} /></span>
          </button>
        ))}
      </div>
    </div>
  );
}
