import { useState, useEffect } from "react";
import { API, Patient, EMPTY_FORM } from "@/components/admin/crm/crmShared";
import PatientCard from "@/components/admin/crm/PatientCard";
import PatientList from "@/components/admin/crm/PatientList";

export default function AdminCrmTab({ isAdmin = true, authorName = "Сотрудник" }: { isAdmin?: boolean; authorName?: string }) {
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadPatients = async () => {
    setLoading(true);
    const r = await fetch(API);
    const d = await r.json();
    setAllPatients(d.patients || []);
    setLoading(false);
  };

  useEffect(() => { loadPatients(); }, []);

  const q = search.toLowerCase();
  const patients = search
    ? allPatients.filter(p => `${p.last_name} ${p.first_name} ${p.middle_name ?? ""}`.toLowerCase().includes(q))
    : allPatients;

  const createPatient = async (form: typeof EMPTY_FORM) => {
    setSaving(true);
    const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await r.json();
    setSaving(false); setAdding(false);
    setSelectedId(d.patient?.id);
    loadPatients();
  };

  if (selectedId) return (
    <PatientCard patientId={selectedId} onBack={() => setSelectedId(null)} onDeleted={() => { setSelectedId(null); loadPatients(); }} isAdmin={isAdmin} authorName={authorName} />
  );

  return (
    <PatientList
      allPatients={allPatients}
      patients={patients}
      loading={loading}
      search={search}
      setSearch={setSearch}
      adding={adding}
      setAdding={setAdding}
      saving={saving}
      onCreatePatient={createPatient}
      onSelect={setSelectedId}
    />
  );
}
