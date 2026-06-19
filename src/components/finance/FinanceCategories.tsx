import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Category } from "./financeTypes";

interface Props {
  categories: Category[];
  catLoading: boolean;
  onAdd: (name: string, type: "income" | "expense") => Promise<void>;
  onDelete: (id: number) => void;
  onRename: (id: number, name: string, type: "income" | "expense") => Promise<void>;
}

export default function FinanceCategories({ categories, catLoading, onAdd, onDelete, onRename }: Props) {
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState<"income" | "expense">("income");
  const [catSaving, setCatSaving] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<"income" | "expense">("income");
  const [editSaving, setEditSaving] = useState(false);

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

  function startEdit(c: Category) {
    setEditingId(c.id);
    setEditName(c.name);
    setEditType(c.type);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editName.trim() || editingId === null) return;
    setEditSaving(true);
    await onRename(editingId, editName.trim(), editType);
    setEditSaving(false);
    setEditingId(null);
  }

  function renderCategory(c: Category) {
    if (editingId === c.id) {
      return (
        <li key={c.id} className="px-4 py-2 bg-beige/60 border-b border-beige-dark last:border-0">
          <form onSubmit={saveEdit} className="flex items-center gap-2 flex-wrap">
            <div className="flex rounded overflow-hidden border border-beige-dark text-xs flex-shrink-0">
              <button type="button" onClick={() => setEditType("income")}
                className={`px-2 py-1.5 transition-colors ${editType === "income" ? "bg-green-100 text-green-700 font-medium" : "text-ink/50 hover:bg-beige"}`}>
                Доход
              </button>
              <button type="button" onClick={() => setEditType("expense")}
                className={`px-2 py-1.5 transition-colors ${editType === "expense" ? "bg-red-50 text-red-600 font-medium" : "text-ink/50 hover:bg-beige"}`}>
                Расход
              </button>
            </div>
            <input
              autoFocus
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="flex-1 min-w-28 border border-sage rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-sage bg-white"
            />
            <div className="flex gap-1 flex-shrink-0">
              <button type="submit" disabled={editSaving || !editName.trim()}
                className="bg-sage text-white rounded px-3 py-1 text-xs font-medium hover:bg-sage-dark disabled:opacity-50 flex items-center gap-1">
                <Icon name="Check" size={12} />
                {editSaving ? "..." : "Сохранить"}
              </button>
              <button type="button" onClick={() => setEditingId(null)}
                className="border border-beige-dark rounded px-2 py-1 text-xs text-ink/50 hover:text-ink hover:bg-beige transition-colors">
                Отмена
              </button>
            </div>
          </form>
        </li>
      );
    }

    return (
      <li key={c.id} className="flex items-center justify-between px-5 py-2.5 group border-b border-beige-dark/40 last:border-0 hover:bg-beige/30 transition-colors">
        <span className="text-sm text-ink">{c.name}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button onClick={() => startEdit(c)}
            className="p-1 text-ink/40 hover:text-ink rounded hover:bg-beige transition-colors" title="Переименовать">
            <Icon name="Pencil" size={13} />
          </button>
          <button onClick={() => onDelete(c.id)}
            className="p-1 text-ink/40 hover:text-red-500 rounded hover:bg-red-50 transition-colors" title="Удалить">
            <Icon name="Trash2" size={13} />
          </button>
        </div>
      </li>
    );
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
            <div className="px-5 py-3 bg-green-50 border-b border-beige-dark flex items-center justify-between">
              <span className="text-sm font-medium text-green-700">Доходы</span>
              <span className="text-xs text-green-600/60">{incomeCategories.length}</span>
            </div>
            {incomeCategories.length === 0 ? (
              <div className="px-5 py-6 text-sm text-muted-foreground italic">Нет категорий</div>
            ) : (
              <ul>{incomeCategories.map(renderCategory)}</ul>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-beige-dark overflow-hidden">
            <div className="px-5 py-3 bg-red-50 border-b border-beige-dark flex items-center justify-between">
              <span className="text-sm font-medium text-red-600">Расходы</span>
              <span className="text-xs text-red-500/60">{expenseCategories.length}</span>
            </div>
            {expenseCategories.length === 0 ? (
              <div className="px-5 py-6 text-sm text-muted-foreground italic">Нет категорий</div>
            ) : (
              <ul>{expenseCategories.map(renderCategory)}</ul>
            )}
          </div>
        </div>
      )}

      <p className="text-xs text-ink/30 text-center">Наведите на категорию, чтобы переименовать или удалить</p>
    </div>
  );
}
