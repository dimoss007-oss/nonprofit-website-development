import type { ReactNode } from "react";
import Icon from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  title: string;
  icon: string;
  iconClass: string;
  loading: boolean;
  className?: string;
  badge?: ReactNode;
  children: ReactNode;
}

export default function DashboardCard({ title, icon, iconClass, loading, className = "", badge, children }: Props) {
  return (
    <section className={`bg-white rounded-2xl border border-beige-dark p-5 flex flex-col ${className}`}>
      <header className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconClass}`}>
            <Icon name={icon} size={16} />
          </div>
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
        </div>
        {!loading && badge}
      </header>
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ) : children}
    </section>
  );
}

export function StatusBadge({ tone, children }: { tone: "good" | "bad" | "warn" | "neutral"; children: ReactNode }) {
  const tones = {
    good: "bg-green-100 text-green-700",
    bad: "bg-red-100 text-red-700",
    warn: "bg-amber-100 text-amber-700",
    neutral: "bg-beige-dark text-ink/70",
  };
  return <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${tones[tone]}`}>{children}</span>;
}
