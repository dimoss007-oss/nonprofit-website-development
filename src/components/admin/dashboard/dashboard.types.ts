export interface DashboardTask {
  id: string;
  title: string;
  author: string;
  date: string;
  isUrgent: boolean;
}

export interface DashboardSummary {
  residents: {
    totalActive: number;
    freeBeds: number;
    newThisWeek: number;
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
  };
  system: {
    lastVkSync: string;
  };
}
