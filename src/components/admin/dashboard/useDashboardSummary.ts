import { useCallback, useEffect, useState } from "react";
import type { DashboardSummary } from "./dashboard.types";

const DASHBOARD_URL = "https://functions.poehali.dev/a668d9fc-6079-4be9-bf2b-8999423d46cb";

export function useDashboardSummary() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    fetch(`${DASHBOARD_URL}?action=get_dashboard_summary`)
      .then(r => {
        if (!r.ok) throw new Error("bad status");
        return r.json();
      })
      .then((d: DashboardSummary) => setData(d))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}
