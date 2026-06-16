import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/2a909b11-72ee-48fd-9e6a-24527476dc11";

type Status = "new" | "in_progress" | "done";

type ContactRequest = {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  subject?: string;
  message: string;
  status: Status;
  created_at: string;
};

const STATUS_LABEL: Record<Status, string> = { new: "Новая", in_progress: "В работе", done: "Обработана" };
const STATUS_COLOR: Record<Status, string> = {
  new: "bg-red-100 text-red-600",
  in_progress: "bg-yellow-100 text-yellow-700",
  done: "bg-green-100 text-green-700",
};
const STATUS_NEXT: Record<Status, { status: Status; label: string; icon: string }> = {
  new: { status: "in_progress", label: "Взять в работу", icon: "Play" },
  in_progress: { status: "done", label: "Обработана", icon: "Check" },
  done: { status: "new", label: "Вернуть", icon: "RotateCcw" },
};

function fmt(d: string) {
  const date = new Date(d);
  return date.toLocaleDateString("ru-RU") + " " + date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function RequestCard({ req, onStatusChange, onDelete, isAdmin, expanded, onToggle }: {
  req: ContactRequest;
  onStatusChange: (id: number, status: Status) => void;
  onDelete: (id: number) => void;
  isAdmin: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const next = STATUS_NEXT[req.status];

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden transition-all ${req.status === "new" ? "border-red-200" : "border-beige-dark"}`}>
      {/* Заголовок */}
      <button onClick={onToggle} className="w-full px-5 py-4 flex items-start gap-4 text-left hover:bg-beige/30 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-ink">{req.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[req.status]}`}>{STATUS_LABEL[req.status]}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {req.phone && (
              <span className="text-xs text-ink/50 flex items-center gap-1">
                <Icon name="Phone" size={11} />{req.phone}
              </span>
            )}
            {req.email && (
              <span className="text-xs text-ink/50 flex items-center gap-1">
                <Icon name="Mail" size={11} />{req.email}
              </span>
            )}
            <span className="text-xs text-ink/40 flex items-center gap-1">
              <Icon name="Clock" size={11} />{fmt(req.created_at)}
            </span>
          </div>
          {req.subject && <p className="text-xs text-ink/60 mt-1 font-medium">{req.subject}</p>}
          {!expanded && <p className="text-xs text-ink/40 mt-1 line-clamp-1">{req.message}</p>}
        </div>
        <Icon name={expanded ? "ChevronUp" : "ChevronDown"} size={16} className="text-ink/30 flex-shrink-0 mt-0.5" />
      </button>

      {/* Раскрытое содержимое */}
      {expanded && (
        <div className="px-5 pb-4 space-y-4 border-t border-beige-mid pt-4">
          <div className="bg-beige-mid rounded-xl p-4">
            <p className="text-xs text-ink/40 mb-1 uppercase tracking-wide">Сообщение</p>
            <p className="text-sm text-ink whitespace-pre-wrap">{req.message}</p>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onStatusChange(req.id, next.status)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-beige-dark hover:border-ink text-ink/60 hover:text-ink transition-colors"
              >
                <Icon name={next.icon} size={12} />{next.label}
              </button>

              {req.phone && (
                <a href={`tel:${req.phone}`} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-ink text-beige hover:bg-ink/90 transition-colors">
                  <Icon name="Phone" size={12} />Позвонить
                </a>
              )}
              {req.email && (
                <a href={`mailto:${req.email}`} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-beige-dark hover:border-ink text-ink/60 hover:text-ink transition-colors">
                  <Icon name="Mail" size={12} />Написать
                </a>
              )}
            </div>

            {isAdmin && (
              <button onClick={() => onDelete(req.id)} className="p-1.5 text-ink/20 hover:text-red-400 transition-colors">
                <Icon name="Trash2" size={14} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminRequestsTab({ isAdmin }: { isAdmin: boolean }) {
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    const r = await fetch(API);
    const d = await r.json();
    setRequests(d.requests || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Автоматически раскрываем первую новую заявку
  useEffect(() => {
    if (requests.length > 0 && expandedId === null) {
      const first = requests.find(r => r.status === "new");
      if (first) setExpandedId(first.id);
    }
  }, [requests]);

  const changeStatus = async (id: number, status: Status) => {
    await fetch(API, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_status", id, status }),
    });
    setRequests(rs => rs.map(r => r.id === id ? { ...r, status } : r));
  };

  const deleteRequest = async (id: number) => {
    if (!confirm("Удалить заявку?")) return;
    await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", id }) });
    setRequests(rs => rs.filter(r => r.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const filtered = filterStatus === "all" ? requests : requests.filter(r => r.status === filterStatus);
  const counts = {
    all: requests.length,
    new: requests.filter(r => r.status === "new").length,
    in_progress: requests.filter(r => r.status === "in_progress").length,
    done: requests.filter(r => r.status === "done").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-cormorant text-ink text-2xl font-semibold">Заявки с сайта</h2>
          {counts.new > 0 && (
            <p className="text-sm text-red-500 mt-0.5 flex items-center gap-1">
              <Icon name="AlertCircle" size={14} />{counts.new} {counts.new === 1 ? "новая заявка" : counts.new < 5 ? "новые заявки" : "новых заявок"}
            </p>
          )}
        </div>
        <button onClick={load} className="flex items-center gap-2 text-ink/50 hover:text-ink text-sm transition-colors border border-beige-dark rounded-xl px-3 py-2 hover:border-ink">
          <Icon name="RefreshCw" size={14} />Обновить
        </button>
      </div>

      {/* Фильтры */}
      <div className="flex items-center gap-1 bg-beige-mid rounded-xl p-1 w-fit flex-wrap">
        {([["all", "Все", "Layers"], ["new", "Новые", "Sparkles"], ["in_progress", "В работе", "Clock"], ["done", "Обработанные", "CheckCircle2"]] as [Status | "all", string, string][]).map(([s, label, icon]) => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filterStatus === s ? "bg-white text-ink shadow-sm" : "text-ink/50 hover:text-ink"}`}>
            <Icon name={icon} size={14} />
            {label}
            {counts[s] > 0 && <span className={`text-xs rounded-full px-1.5 py-0.5 ${s === "new" && counts.new > 0 ? "bg-red-100 text-red-600" : "opacity-50"}`}>{counts[s]}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-ink/40">
          <Icon name="Inbox" size={40} className="mx-auto mb-3 opacity-30" />
          <p>{filterStatus === "all" ? "Заявок пока нет" : "Нет заявок с таким статусом"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(req => (
            <RequestCard
              key={req.id}
              req={req}
              onStatusChange={changeStatus}
              onDelete={deleteRequest}
              isAdmin={isAdmin}
              expanded={expandedId === req.id}
              onToggle={() => setExpandedId(expandedId === req.id ? null : req.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}