import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Category } from "./financeTypes";

interface Props {
  categories: Category[];
  catLoading: boolean;
  onAdd: (name: string, type: "income" | "expense") => Promise<void>;
  onDelete: (id: number) => void;
}

export default function FinanceCategories({ categories, catLoading, onAdd, onDelete }: Props) {
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState<"income" | "expense">("income");
  const [catSaving, setCatSaving] = useState(false);

  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCatSaving(true);
    await onAdd(newCatName.trim(), newCatType);
    setNewCatName("");
    setCatSaving(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-lg shadow-sm border border-beige-dark p-5">
        <h2 className="font-medium text-ink mb-4">Новая категория</h2>
        <form onSubmit={handleSubmit} className="flex gap-2 flex-wrap">
          <div className="flex rounded overflow-hidden border border-beige-dark text-sm">
            <button type="button" onClick={() => setNewCatType("income")}
              className={`px-3 py-2 transition-colors ${newCatType === "income" ? "bg-green-100 text-green-700 font-medium" : "text-muted-foreground hover:bg-beige"}`}>
              Доход
            </button>
            <button type="button" onClick={() => setNewCatType("expense")}
              className={`px-3 py-2 transition-colors ${newCatType === "expense" ? "bg-red-50 text-red-600 font-medium" : "text-muted-foreground hover:bg-beige"}`}>
              Расход
            </button>
          </div>
          <input type="text" placeholder="Название категории" value={newCatName} onChange={(e) => setNewCatName(e.target.value)}
            className="flex-1 min-w-40 border border-beige-dark rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage" />
          <button type="submit" disabled={catSaving || !newCatName.trim()}
            className="bg-sage text-white rounded px-4 py-2 text-sm font-medium hover:bg-sage-dark transition-colors disabled:opacity-50 flex items-center gap-1.5">
            <Icon name="Plus" size={14} />
            Добавить
          </button>
        </form>
      </div>

      {catLoading ? (
        <div className="text-center py-10 text-muted-foreground">Загрузка...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-beige-dark overflow-hidden">
            <div className="px-5 py-3 bg-green-50 border-b border-beige-dark">
              <span className="text-sm font-medium text-green-700">Доходы</span>
            </div>
            {incomeCategories.length === 0 ? (
              <div className="px-5 py-6 text-sm text-muted-foreground italic">Нет категорий</div>
            ) : (
              <ul>
                {incomeCategories.map((c, i) => (
                  <li key={c.id} className={`flex items-center justify-between px-5 py-2.5 group ${i % 2 === 0 ? "" : "bg-beige/20"}`}>
                    <span className="text-sm text-ink">{c.name}</span>
                    <button onClick={() => onDelete(c.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all">
                      <Icon name="Trash2" size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-beige-dark overflow-hidden">
            <div className="px-5 py-3 bg-red-50 border-b border-beige-dark">
              <span className="text-sm font-medium text-red-600">Расходы</span>
            </div>
            {expenseCategories.length === 0 ? (
              <div className="px-5 py-6 text-sm text-muted-foreground italic">Нет категорий</div>
            ) : (
              <ul>
                {expenseCategories.map((c, i) => (
                  <li key={c.id} className={`flex items-center justify-between px-5 py-2.5 group ${i % 2 === 0 ? "" : "bg-beige/20"}`}>
                    <span className="text-sm text-ink">{c.name}</span>
                    <button onClick={() => onDelete(c.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all">
                      <Icon name="Trash2" size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
