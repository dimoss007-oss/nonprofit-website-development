export interface DashboardTask {
  id: string;
  title: string;
  author: string;
  date: string;
  isUrgent: boolean;
  isOverdue: boolean;
  hasDeadline: boolean;
}

export interface DashboardNews {
  id: string;
  title: string;
  snippet: string;
  photo: string | null;
  date: string;
}

export interface DashboardSummary {
  residents: {
    totalActive: number;
    freeBeds: number | null;
    newThisWeek: number;
    totalChildren: number;
  };
  finance: {
    monthlyTotalRub: number;
    activeRecurringDonors: number;
    trend: "up" | "down" | "stable";
  };
  tasks: DashboardTask[];
  aiReports: {
    weeklyDigestStatus: "ready" | "pending" | "error";
    criticalAlerts: string[];
    dailySummary: string;
    dailySummaryFresh: boolean;
    dailySummaryDate: string | null;
  };
  news: DashboardNews[];
  system: {
    lastVkSync: string | null;
  };
}
