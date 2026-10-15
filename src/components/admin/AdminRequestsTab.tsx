import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/2a909b11-72ee-48fd-9e6a-24527476dc11";

type Status = "new" | "in_progress" | "done";

type Attachment = { filename: string; url: string };

type ContactRequest = {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  subject?: string;
  message: string;
  status: Status;
  created_at: string;
  request_type?: "contact" | "case_referral";
  organization?: string;
  district?: string;
  responsible_name?: string;
  responsible_phone?: string;
  beneficiary_name?: string;
  beneficiary_phone?: string;
  attachments?: Attachment[];
};

const STATUS_LABEL: Record<Status, string> = { new: "Новая", in_progress: "В работе", done: "Обработана" };
const STATUS_COLOR: Record<Status, string> = {
  new: "bg-red-50 text-red-600 border border-red-100",
  in_progress: "bg-amber-50 text-amber-700 border border-amber-100",
  done: "bg-green-50 text-green-600 border border-green-100",
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
    <div className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md ${req.status === "new" ? "border-red-200" : "border-slate-100"}`}>
      {/* Заголовок */}
      <button onClick={onToggle} className="w-full px-5 py-4 flex items-start gap-4 text-left hover:bg-slate-50/60 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {req.request_type === "case_referral" && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-violet-100 text-violet-700 flex items-center gap-1">
                <Icon name="FileWarning" size={10} />Случай
              </span>
            )}
            <span className="font-semibold text-sm text-slate-800">{req.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[req.status]}`}>{STATUS_LABEL[req.status]}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {req.organization && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Icon name="Building2" size={11} />{req.organization}
              </span>
            )}
            {req.district && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Icon name="MapPin" size={11} />{req.district}
              </span>
            )}
            {req.phone && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Icon name="Phone" size={11} />{req.phone}
              </span>
            )}
            {req.email && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Icon name="Mail" size={11} />{req.email}
              </span>
            )}
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Icon name="Clock" size={11} />{fmt(req.created_at)}
            </span>
          </div>
          {req.subject && <p className="text-xs text-slate-500 mt-1 font-medium">{req.subject}</p>}
          {!expanded && <p className="text-xs text-slate-400 mt-1 line-clamp-1">{req.message}</p>}
        </div>
        <Icon name={expanded ? "ChevronUp" : "ChevronDown"} size={16} className="text-slate-300 flex-shrink-0 mt-0.5" />
      </button>

      {/* Раскрытое содержимое */}
      {expanded && (
        <div className="px-5 pb-4 space-y-4 border-t border-slate-100 pt-4">
          {req.request_type === "case_referral" && (req.beneficiary_name || req.beneficiary_phone) && (
            <div className="bg-violet-50 rounded-xl p-4">
              <p className="text-xs text-violet-500 mb-1 uppercase tracking-wide">Благополучатель</p>
              <p className="text-sm text-slate-800">{req.beneficiary_name || "—"}</p>
              {req.beneficiary_phone && (
                <a href={`tel:${req.beneficiary_phone}`} className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                  <Icon name="Phone" size={11} />{req.beneficiary_phone}
                </a>
              )}
            </div>
          )}

          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs text-slate-400 mb-1 uppercase tracking-wide">
              {req.request_type === "case_referral" ? "Описание случая" : "Сообщение"}
            </p>
            <p className="text-sm text-slate-800 whitespace-pre-wrap">{req.message}</p>
          </div>

          {req.attachments && req.attachments.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 mb-2 uppercase tracking-wide">Вложения</p>
              <div className="flex flex-wrap gap-2">
                {req.attachments.map((a, i) => (
                  <a
                    key={i}
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border border-slate-200 hover:border-indigo-300 text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    <Icon name="Paperclip" size={12} />{a.filename}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onStatusChange(req.id, next.status)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border border-slate-200 hover:border-indigo-300 text-slate-500 hover:text-slate-800 transition-colors"
              >
                <Icon name={next.icon} size={12} />{next.label}
              </button>

              {req.phone && (
                <a href={`tel:${req.phone}`} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
                  <Icon name="Phone" size={12} />Позвонить
                </a>
              )}
              {req.email && (
                <a href={`mailto:${req.email}`} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border border-slate-200 hover:border-indigo-300 text-slate-500 hover:text-slate-800 transition-colors">
                  <Icon name="Mail" size={12} />Написать
                </a>
              )}
            </div>

            {isAdmin && (
              <button onClick={() => onDelete(req.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors">
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
  const [search, setSearch] = useState("");
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

  const q = search.toLowerCase();
  const filtered = requests
    .filter(r => filterStatus === "all" || r.status === filterStatus)
    .filter(r => !q || `${r.name} ${r.phone ?? ""} ${r.email ?? ""} ${r.organization ?? ""} ${r.subject ?? ""} ${r.message}`.toLowerCase().includes(q));
  const counts = {
    all: requests.length,
    new: requests.filter(r => r.status === "new").length,
    in_progress: requests.filter(r => r.status === "in_progress").length,
    done: requests.filter(r => r.status === "done").length,
  };

  const metrics: { id: Status | "all"; label: string; color: string; border: string; hover: string }[] = [
    { id: "all", label: "Всего заявок", color: "text-slate-800", border: "border-slate-100", hover: "hover:bg-slate-50" },
    { id: "new", label: "Новые", color: counts.new > 0 ? "text-red-500" : "text-slate-700", border: counts.new > 0 ? "border-red-100" : "border-slate-100", hover: "hover:bg-red-50" },
    { id: "in_progress", label: "В работе", color: "text-amber-600", border: "border-amber-100", hover: "hover:bg-amber-50" },
    { id: "done", label: "Обработанные", color: "text-green-600", border: "border-green-100", hover: "hover:bg-green-50" },
  ];

  return (
    <div className="space-y-6 font-inter">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Заявки с сайта</h1>
          <p className="text-sm text-slate-500 mt-1">Обращения от посетителей и направления случаев от организаций</p>
        </div>
        <button onClick={load} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition text-sm font-medium flex items-center gap-2 shadow-sm">
          <Icon name="RefreshCw" size={14} />Обновить
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map(m => (
          <button key={m.id} onClick={() => setFilterStatus(m.id)} className={`bg-white p-4 rounded-2xl border shadow-sm flex flex-col items-center justify-center transition ${m.border} ${m.hover} ${filterStatus === m.id ? "ring-2 ring-offset-1 ring-indigo-300" : ""}`}>
            <span className={`text-2xl font-bold ${m.color}`}>{counts[m.id]}</span>
            <span className="text-xs text-slate-500 font-medium mt-1">{m.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center flex-1 min-w-[220px] bg-slate-50 rounded-xl px-4 py-2 border border-slate-100 focus-within:border-indigo-300 transition">
          <Icon name="Search" size={15} className="text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по имени, телефону, организации, тексту..." className="bg-transparent border-none outline-none text-sm text-slate-700 w-full ml-3 placeholder:text-slate-400" />
        </div>
        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100 flex-wrap">
          {([["all", "Все"], ["new", "Новые"], ["in_progress", "В работе"], ["done", "Обработанные"]] as [Status | "all", string][]).map(([s, label]) => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition ${filterStatus === s ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>{label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Icon name="Inbox" size={40} className="mx-auto mb-3 opacity-30" />
          <p>{search ? "Ничего не найдено" : filterStatus === "all" ? "Заявок пока нет" : "Нет заявок с таким статусом"}</p>
        </div>
      ) : (
        <div className="space-y-3">
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