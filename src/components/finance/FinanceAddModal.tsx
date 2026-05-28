import Icon from "@/components/ui/icon";
import { Category } from "./financeTypes";

interface Props {
  addType: "income" | "expense";
  addAmount: string;
  addDesc: string;
  addCategory: string;
  addLoading: boolean;
  addError: string;
  filteredCats: Category[];
  onTypeChange: (type: "income" | "expense") => void;
  onAmountChange: (v: string) => void;
  onDescChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function FinanceAddModal({ addType, addAmount, addDesc, addCategory, addLoading, addError, filteredCats, onTypeChange, onAmountChange, onDescChange, onCategoryChange, onSubmit, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-cormorant font-semibold text-ink">Новая операция</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-ink">
            <Icon name="X" size={18} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => onTypeChange("income")}
              className={`rounded py-2 text-sm font-medium transition-colors ${addType === "income" ? "bg-green-100 text-green-700 border-2 border-green-400" : "bg-beige border-2 border-transparent text-muted-foreground"}`}>
              + Доход
            </button>
            <button type="button" onClick={() => onTypeChange("expense")}
              className={`rounded py-2 text-sm font-medium transition-colors ${addType === "expense" ? "bg-red-50 text-red-600 border-2 border-red-400" : "bg-beige border-2 border-transparent text-muted-foreground"}`}>
              − Расход
            </button>
          </div>
          <input type="number" placeholder="Сумма, ₽" value={addAmount} onChange={(e) => onAmountChange(e.target.value)}
            min="0" step="any"
            className="border border-beige-dark rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage" />
          <select value={addCategory} onChange={(e) => onCategoryChange(e.target.value)}
            className="border border-beige-dark rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage text-ink bg-white">
            <option value="">— Без категории —</option>
            {filteredCats.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
          <input type="text" placeholder="Описание (необязательно)" value={addDesc} onChange={(e) => onDescChange(e.target.value)}
            className="border border-beige-dark rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage" />
          {addError && <p className="text-red-500 text-sm">{addError}</p>}
          <button type="submit" disabled={addLoading}
            className="bg-sage text-white rounded px-4 py-2 text-sm font-medium hover:bg-sage-dark transition-colors disabled:opacity-50">
            {addLoading ? "Сохранение..." : "Сохранить"}
          </button>
        </form>
      </div>
    </div>
  );
}
