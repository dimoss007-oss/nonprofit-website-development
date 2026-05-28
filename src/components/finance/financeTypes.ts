export interface MonthStats {
  month: string;
  month_label: string;
  income: number;
  expense: number;
  balance: number;
  transactions_count: number;
}

export interface Transaction {
  id: number;
  type: "income" | "expense";
  amount: number;
  description: string | null;
  category: string | null;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  type: "income" | "expense";
}

export function fmt(n: number) {
  return n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const LOGO_IMG = "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/4ca974da-fec3-4fd3-834d-c7dccc97fca9.jpg";
