import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Org, Person } from "./fundraising.types";

const TASKS_API = "https://functions.poehali.dev/6036e39a-3369-4ec5-a7b3-a4393528188a";

type Frequency = "" | "daily" | "weekly" | "monthly";

const FREQ_OPTIONS: { value: Frequency; label: string }[] = [
  { value: "", label: "Разово" },
  { value: "daily", label: "Каждый день" },
  { value: "weekly", label: "Раз в неделю" },
  { value: "monthly", label: "Раз в месяц" },
];

type Donor = {
  name: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
};

function DonorTaskButton({ donor, users }: { donor: Donor; users: { login: string; full_name?: string }[] }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(`Связаться с ${donor.name}`);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [assignee, setAssignee] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const create = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const user = users.find(u => u.login === assignee);
    await fetch(TASKS_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        title: title.trim(),
        description: [
          donor.phone ? `Телефон: ${donor.phone}` : "",
          donor.email ? `Email: ${donor.email}` : "",
          donor.contactPerson ? `Контакт: ${donor.contactPerson}` : "",
        ].filter(Boolean).join("\n") || undefined,
        priority: "medium",
        deadline: date,
        assignee_login: assignee || undefined,
        assignee_name: user?.full_name || assignee || undefined,
        reminder_frequency: frequency || undefined,
      }),
    });
    setSaving(false);
    setDone(true);
    setOpen(false);
    setTimeout(() => setDone(false), 3000);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Добавить в задачи"
        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${
          done ? "bg-violet-100 text-violet-700" : "text-ink/60 bg-beige-mid hover:bg-beige-dark"
        }`}
      >
        <Icon name={done ? "CalendarCheck" : "ListPlus"} size={13} />
        {done ? "Добавлено!" : "В задачи"}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-beige-dark p-3 min-w-[260px] space-y-2">
          <p className="text-xs font-medium text-ink mb-1">Добавить задачу</p>

          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Название задачи"
            className="w-full border border-beige-dark rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-ink"
          />

          <div className="flex gap-2">
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="flex-1 border border-beige-dark rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-ink"
            />
            <select
              value={assignee}
              onChange={e => setAssignee(e.target.value)}
              className="flex-1 border border-beige-dark rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-ink"
            >
              <option value="">Не назначен</option>
              {users.map(u => <option key={u.login} value={u.login}>{u.full_name || u.login}</option>)}
            </select>
          </div>

          <div>
            <p className="text-[10px] text-ink/40 uppercase tracking-wider mb-1">Напоминание в MAX</p>
            <div className="grid grid-cols-2 gap-1">
              {FREQ_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFrequency(opt.value)}
                  className={`text-[11px] px-2 py-1.5 rounded-lg font-medium transition-colors ${
                    frequency === opt.value ? "bg-ink text-beige" : "bg-beige/60 text-ink/50 hover:bg-beige-dark"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={create}
            disabled={saving || !date || !title.trim()}
            className="w-full bg-ink text-beige text-xs font-semibold py-1.5 rounded-lg hover:bg-ink/90 transition-colors disabled:opacity-50"
          >
            {saving ? "Создаём..." : "Добавить в задачи"}
          </button>
        </div>
      )}
    </div>
  );
}

export function OrgTaskButton({ org, users }: { org: Org; users: { login: string; full_name?: string }[] }) {
  return (
    <DonorTaskButton
      donor={{ name: org.name, phone: org.phone, email: org.email, contactPerson: org.contact_person }}
      users={users}
    />
  );
}

export function PersonTaskButton({ person, users }: { person: Person; users: { login: string; full_name?: string }[] }) {
  return (
    <DonorTaskButton
      donor={{ name: person.full_name, phone: person.phone, email: person.email }}
      users={users}
    />
  );
}
