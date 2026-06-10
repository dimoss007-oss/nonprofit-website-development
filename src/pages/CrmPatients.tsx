import { useState, useEffect } from "react";
import { SESSION_KEY } from "@/components/crm/crmTypes";
import CrmLogin from "@/components/crm/CrmLogin";
import PatientCard from "@/components/crm/PatientCard";
import PatientList from "@/components/crm/PatientList";

export default function CrmPatients() {
  const [authed, setAuthed] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "1") setAuthed(true);
  }, []);

  if (!authed) return <CrmLogin onAuth={() => setAuthed(true)} />;

  if (selectedId) {
    return (
      <div className="min-h-screen bg-beige-mid">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <PatientCard
            patientId={selectedId}
            onBack={() => setSelectedId(null)}
            onDeleted={() => setSelectedId(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-beige-mid">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <PatientList onSelect={id => setSelectedId(id)} />
      </div>
    </div>
  );
}
