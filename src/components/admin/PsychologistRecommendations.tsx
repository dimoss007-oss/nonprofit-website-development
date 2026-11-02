import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { Creds, psychoCall } from "./psycho/psychoApi";

type Item = { session_date: string; text: string };

export default function PsychologistRecommendations({ familyId, authLogin, authPassword }: { familyId: number; authLogin: string; authPassword: string }) {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const creds: Creds = { authLogin, authPassword };
    psychoCall<{ items: Item[] }>(creds, "recommendations", { family_id: familyId }).then(d => setItems(d.items)).catch(() => setItems([]));
  }, [familyId, authLogin, authPassword]);

  if (items.length === 0) return null;
  return (
    <div className="bg-white border border-indigo-200 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Icon name="Brain" size={18} className="text-indigo-600" />
        <h4 className="font-semibold text-ink">Рекомендации психолога</h4>
      </div>
      {items.map((it, i) => (
        <div key={i} className="rounded-xl bg-indigo-50/60 p-4">
          <p className="text-xs text-ink/50 mb-2">От {new Date(it.session_date).toLocaleDateString("ru-RU")}</p>
          <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">{it.text}</p>
        </div>
      ))}
    </div>
  );
}
