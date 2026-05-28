import Icon from "@/components/ui/icon";
import { MonthStats, Transaction, fmt } from "./financeTypes";

interface Props {
  loading: boolean;
  months: MonthStats[];
  totals: { income: number; expense: number; balance: number };
  expandedMonth: string | null;
  transactions: Record<string, Transaction[]>;
  txLoading: string | null;
  onToggleMonth: (month: string) => void;
  onDeleteTransaction: (id: number, month: string) => void;
}

export default function FinanceStats({ loading, months, totals, expandedMonth, transactions, txLoading, onToggleMonth, onDeleteTransaction }: Props) {
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
              <div key={m.month} className="bg-white rounded-lg shadow-sm border border-beige-dark overflow-hidden">
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
                  <div className="border-t border-beige-dark">
                    {isLoadingTx ? (
                      <div className="text-center py-6 text-muted-foreground text-sm">Загрузка...</div>
                    ) : txList.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground text-sm">Нет операций</div>
                    ) : (
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
                                {tx.category
                                  ? <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tx.type === "income" ? "bg-green-100 text-green-700" : "bg-red-50 text-red-600"}`}>{tx.category}</span>
                                  : <span className="text-muted-foreground text-xs">—</span>}
                              </td>
                              <td className="px-5 py-2 text-ink">{tx.description || <span className="text-muted-foreground italic">без описания</span>}</td>
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
                    )}
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
