import { useState } from "react";
import Icon from "@/components/ui/icon";
import { MonthStats, Transaction, Category, fmt } from "./financeTypes";

interface Props {
  loading: boolean;
  months: MonthStats[];
  totals: { income: number; expense: number; balance: number };
  expandedMonth: string | null;
  transactions: Record<string, Transaction[]>;
  txLoading: string | null;
  categories: Category[];
  onToggleMonth: (month: string) => void;
  onDeleteTransaction: (id: number, month: string) => void;
  onChangeCategory: (id: number, month: string, category: string) => Promise<void>;
  onChangeDescription: (id: number, month: string, description: string) => Promise<void>;
}

function CategoryCell({ tx, month, categories, onChangeCategory, isLast }: {
  tx: Transaction;
  month: string;
  categories: Category[];
  onChangeCategory: (id: number, month: string, category: string) => Promise<void>;
  isLast: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const relevant = categories.filter(c => c.type === tx.type);

  const select = async (name: string) => {
    setSaving(true);
    await onChangeCategory(tx.id, month, name);
    setSaving(false);
    setOpen(false);
  };

  // Открываем вверх для последних строк, чтобы не уходить за край таблицы
  const dropDir = isLast ? "bottom-full mb-1" : "top-full mt-1";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={saving}
        title="Изменить категорию"
        className="group/cat flex items-center gap-1"
      >
        {tx.category
          ? <span className={`text-xs px-2 py-0.5 rounded-full font-medium transition-opacity ${tx.type === "income" ? "bg-green-100 text-green-700" : "bg-red-50 text-red-600"} group-hover/cat:opacity-70`}>
              {saving ? "..." : tx.category}
            </span>
          : <span className="text-muted-foreground text-xs hover:text-ink transition-colors">
              {saving ? "..." : "— добавить"}
            </span>
        }
        <Icon name="ChevronDown" size={11} className="opacity-0 group-hover/cat:opacity-40 transition-opacity text-ink/50 flex-shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className={`absolute left-0 ${dropDir} z-20 bg-white border border-beige-dark rounded-xl shadow-xl py-1 min-w-40 max-h-52 overflow-y-auto`}>
            <button
              onClick={() => select("")}
              className="w-full text-left px-3 py-1.5 text-xs text-ink/40 hover:bg-beige-mid hover:text-ink transition-colors flex items-center gap-2"
            >
              <Icon name="X" size={11} /> Без категории
            </button>
            {relevant.length > 0 && <div className="border-t border-beige-dark/40 my-1" />}
            {relevant.map(c => (
              <button
                key={c.id}
                onClick={() => select(c.name)}
                className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center gap-2 ${c.name === tx.category ? "font-semibold text-ink bg-beige-mid" : "text-ink/70 hover:bg-beige-mid hover:text-ink"}`}
              >
                {c.name === tx.category && <Icon name="Check" size={11} className="text-sage flex-shrink-0" />}
                {c.name}
              </button>
            ))}
            {relevant.length === 0 && (
              <p className="px-3 py-2 text-xs text-ink/30 italic">Нет категорий</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function DescriptionCell({ tx, month, onChangeDescription }: {
  tx: Transaction;
  month: string;
  onChangeDescription: (id: number, month: string, description: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(tx.description || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await onChangeDescription(tx.id, month, value);
    setSaving(false);
    setEditing(false);
  };

  const cancel = () => {
    setValue(tx.description || "");
    setEditing(false);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") save();
    if (e.key === "Escape") cancel();
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          autoFocus
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={onKey}
          disabled={saving}
          placeholder="Описание..."
          className="border border-sage rounded px-2 py-0.5 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-sage w-full min-w-32 bg-white"
        />
        <button onClick={save} disabled={saving} className="p-1 text-sage hover:text-sage-dark disabled:opacity-40" title="Сохранить (Enter)">
          <Icon name="Check" size={14} />
        </button>
        <button onClick={cancel} className="p-1 text-ink/30 hover:text-ink" title="Отмена (Esc)">
          <Icon name="X" size={14} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => { setValue(tx.description || ""); setEditing(true); }}
      className="group/desc text-left w-full"
      title="Нажмите, чтобы изменить"
    >
      {tx.description
        ? <span className="text-ink group-hover/desc:underline decoration-dashed underline-offset-2">{tx.description}</span>
        : <span className="text-muted-foreground italic group-hover/desc:text-ink/60 transition-colors">без описания</span>
      }
    </button>
  );
}

export default function FinanceStats({
  loading, months, totals, expandedMonth, transactions, txLoading,
  categories, onToggleMonth, onDeleteTransaction, onChangeCategory, onChangeDescription,
}: Props) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-5 shadow-sm border border-beige-dark">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Всего доходов</div>
          <div className="text-2xl font-semibold text-green-600">{fmt(totals.income)} ₽</div>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm border border-beige-dark">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Всего расходов</div>
          <div className="text-2xl font-semibold text-red-500">{fmt(totals.expense)} ₽</div>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm border border-beige-dark">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Общий баланс</div>
          <div className={`text-2xl font-semibold ${totals.balance >= 0 ? "text-sage" : "text-red-500"}`}>
            {totals.balance >= 0 ? "+" : ""}{fmt(totals.balance)} ₽
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Загрузка...</div>
      ) : months.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">Нет данных</div>
      ) : (
        <div className="flex flex-col gap-3">
          {months.map((m) => {
            const isOpen = expandedMonth === m.month;
            const txList = transactions[m.month] || [];
            const isLoadingTx = txLoading === m.month;

            return (
              <div key={m.month} className="bg-white rounded-lg shadow-sm border border-beige-dark overflow-visible">
                <button onClick={() => onToggleMonth(m.month)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-beige/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-ink capitalize w-28 text-left">{m.month_label}</span>
                    <span className="text-green-600 text-sm">+{fmt(m.income)}</span>
                    <span className="text-red-500 text-sm">−{fmt(m.expense)}</span>
                    <span className={`font-semibold text-sm ${m.balance >= 0 ? "text-sage" : "text-red-500"}`}>
                      = {m.balance >= 0 ? "+" : ""}{fmt(m.balance)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground text-sm">
                    <span>{m.transactions_count} оп.</span>
                    <Icon name={isOpen ? "ChevronUp" : "ChevronDown"} size={16} />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-beige-dark overflow-visible">
                    {isLoadingTx ? (
                      <div className="text-center py-6 text-muted-foreground text-sm">Загрузка...</div>
                    ) : txList.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground text-sm">Нет операций</div>
                    ) : (() => {
                      const expenseTx = txList.filter(t => t.type === "expense");
                      const catMap: Record<string, number> = {};
                      expenseTx.forEach(t => {
                        const key = t.category || "Без категории";
                        catMap[key] = (catMap[key] || 0) + t.amount;
                      });
                      const catEntries = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
                      const totalExpense = expenseTx.reduce((s, t) => s + t.amount, 0);

                      return (
                        <>
                          {catEntries.length > 0 && (
                            <div className="px-5 py-4 border-b border-beige-dark/50">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Расходы по категориям</p>
                              <div className="space-y-2">
                                {catEntries.map(([cat, sum]) => {
                                  const pct = totalExpense > 0 ? Math.round((sum / totalExpense) * 100) : 0;
                                  return (
                                    <div key={cat}>
                                      <div className="flex items-center justify-between text-xs mb-1">
                                        <span className="text-ink/70">{cat}</span>
                                        <span className="text-red-500 font-medium">
                                          {fmt(sum)} ₽ <span className="text-ink/30 font-normal">· {pct}%</span>
                                        </span>
                                      </div>
                                      <div className="h-1.5 bg-beige-mid rounded-full overflow-hidden">
                                        <div className="h-full bg-red-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-beige/40 border-b border-beige-dark">
                                <th className="text-left px-5 py-2 font-medium text-muted-foreground">Дата</th>
                                <th className="text-left px-5 py-2 font-medium text-muted-foreground">Категория</th>
                                <th className="text-left px-5 py-2 font-medium text-muted-foreground">Описание</th>
                                <th className="text-right px-5 py-2 font-medium text-muted-foreground">Сумма</th>
                                <th className="w-10"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {txList.map((tx, i) => (
                                <tr key={tx.id} className={`border-b border-beige-dark/30 group ${i % 2 === 0 ? "" : "bg-beige/10"}`}>
                                  <td className="px-5 py-2 text-muted-foreground whitespace-nowrap">{tx.created_at}</td>
                                  <td className="px-5 py-2">
                                    <CategoryCell
                                      tx={tx}
                                      month={m.month}
                                      categories={categories}
                                      onChangeCategory={onChangeCategory}
                                      isLast={i >= txList.length - 3}
                                    />
                                  </td>
                                  <td className="px-5 py-2 text-ink">
                                    <DescriptionCell tx={tx} month={m.month} onChangeDescription={onChangeDescription} />
                                  </td>
                                  <td className={`px-5 py-2 text-right font-medium ${tx.type === "income" ? "text-green-600" : "text-red-500"}`}>
                                    {tx.type === "income" ? "+" : "−"}{fmt(tx.amount)} ₽
                                  </td>
                                  <td className="pr-3 py-2 text-right">
                                    <button onClick={() => onDeleteTransaction(tx.id, m.month)}
                                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all" title="Удалить">
                                      <Icon name="Trash2" size={14} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}