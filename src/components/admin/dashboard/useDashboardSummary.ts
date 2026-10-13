import { useCallback, useEffect, useState } from "react";
import type { DashboardSummary } from "./dashboard.types";

const DASHBOARD_URL = "https://functions.poehali.dev/a668d9fc-6079-4be9-bf2b-8999423d46cb";
const SESSION_KEY = "admin_auth";

const authFields = () => {
  try {
    const s = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
    return { auth_login: s?.login || "", auth_password: s?.password || "" };
  } catch {
    return { auth_login: "", auth_password: "" };
  }
};

const call = (payload: object) =>
  fetch(DASHBOARD_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, ...authFields() }),
  });

export function useDashboardSummary() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    call({ action: "get_dashboard_summary" })
      .then(r => {
        if (!r.ok) throw new Error("bad status");
        return r.json();
      })
      .then((d: DashboardSummary) => setData(d))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const [summaryLoading, setSummaryLoading] = useState(false);

  const refreshSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const r = await call({ action: "generate_daily_summary" });
      const d = await r.json();
      if (r.ok && d.summary) {
        setData(prev => prev && { ...prev, aiReports: { ...prev.aiReports, dailySummary: d.summary, dailySummaryFresh: true, dailySummaryDate: d.date } });
      }
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const saveCapacity = useCallback(async (capacity: number) => {
    const r = await call({ action: "set_bed_capacity", capacity });
    if (r.ok) load();
    return r.ok;
  }, [load]);

  return { data, loading, error, reload: load, saveCapacity, summaryLoading, refreshSummary };
}
