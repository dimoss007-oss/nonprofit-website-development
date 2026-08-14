import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { API, PatientTask, TaskType, elapsedTime, fmt } from "@/components/admin/crm/crmShared";

function LiveTimer({ createdAt }: { createdAt: string }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);
  return <>{elapsedTime(createdAt)}</>;
}

export default function PatientTasks({ patientId, tasks, taskType, onChanged }: { patientId: number; tasks: PatientTask[]; taskType: TaskType; onChanged: () => void }) {
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [saving, setSaving] = useState(false);
  const [completingId, setCompletingId] = useState<number | null>(null);

  const typeTasks = tasks.filter(t => t.task_type === taskType);
  const activeTask = typeTasks.find(t => t.status === "active");
  const completedTasks = typeTasks.filter(t => t.status === "completed");
  const isMain = taskType === "main";
  const currentLabel = isMain ? "Текущее основное задание" : "Текущее дополнительное задание";
  const emptyLabel = isMain ? "Активных основных заданий нет — добавьте новое" : "Активных дополнительных заданий нет — добавьте новое";
  const historyLabel = isMain ? "История основных заданий" : "История дополнительных заданий";

  const addTask = async () => {
    if (!description.trim()) return;
    setSaving(true);
    try {
      await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_task", patient_id: patientId, description, deadline: deadline || null, task_type: taskType }),
      });
      setDescription("");
      setDeadline("");
      onChanged();
    } finally {
      setSaving(false);
    }
  };

  const completeTask = async (taskId: number) => {
    setCompletingId(taskId);
    try {
      await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete_task", task_id: taskId }),
      });
      onChanged();
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-beige-dark rounded-2xl p-5">
        <h3 className="font-semibold text-ink text-sm uppercase tracking-wide mb-4">{currentLabel}</h3>
        {activeTask ? (
          <div className="space-y-3">
            <p className="text-sm text-ink whitespace-pre-wrap">{activeTask.description}</p>
            <div className="flex items-center gap-4 flex-wrap text-xs text-ink/50">
              {activeTask.deadline && (
                <span className="flex items-center gap-1"><Icon name="CalendarClock" size={13} /> Дедлайн: {fmt(activeTask.deadline)}</span>
              )}
              <span className="flex items-center gap-1 text-ink/70 font-medium">
                <Icon name="Timer" size={13} /> В работе: <LiveTimer createdAt={activeTask.created_at} />
              </span>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => completeTask(activeTask.id)}
                disabled={completingId === activeTask.id}
                className="px-4 py-2 text-sm rounded-lg bg-ink text-beige hover:bg-ink/90 transition-colors disabled:opacity-60 flex items-center gap-1.5"
              >
                <Icon name={completingId === activeTask.id ? "Loader" : "Check"} size={14} className={completingId === activeTask.id ? "animate-spin" : ""} />
                Завершить
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-ink/40 text-sm">{emptyLabel}</p>
            <div>
              <label className="text-xs text-ink/60 mb-1 block">Описание задания</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Например: пройти технику «Дневник чувств» и обсудить с психологом..."
                className="w-full border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink resize-none"
              />
            </div>
            <div>
              <label className="text-xs text-ink/60 mb-1 block">Дедлайн (по желанию)</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="border border-beige-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={addTask}
                disabled={saving || !description.trim()}
                className="px-4 py-2 text-sm rounded-lg bg-ink text-beige hover:bg-ink/90 transition-colors disabled:opacity-60 flex items-center gap-1.5"
              >
                <Icon name={saving ? "Loader" : "Plus"} size={14} className={saving ? "animate-spin" : ""} />
                {saving ? "Сохранение..." : "Добавить задание"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-beige-dark rounded-2xl p-5">
        <h3 className="font-semibold text-ink text-sm uppercase tracking-wide mb-3">{historyLabel} ({completedTasks.length})</h3>
        {completedTasks.length === 0 && <p className="text-ink/40 text-sm">Пока нет завершённых заданий</p>}
        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
          {completedTasks.map(t => (
            <div key={t.id} className="rounded-xl p-3 bg-beige-mid">
              <p className="text-sm text-ink whitespace-pre-wrap mb-1">{t.description}</p>
              <div className="flex items-center gap-3 flex-wrap text-xs text-ink/50">
                <span>Начато: {fmt(t.created_at)}</span>
                <span>Завершено: {fmt(t.completed_at)}</span>
                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                  Затрачено: {elapsedTime(t.created_at, t.completed_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
