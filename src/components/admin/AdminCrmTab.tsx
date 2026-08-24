import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API, Patient, EMPTY_FORM, CareStage, ChildWithPatient } from "@/components/admin/crm/crmShared";
import PatientCard from "@/components/admin/crm/PatientCard";
import PatientList from "@/components/admin/crm/PatientList";
import ChildrenList from "@/components/admin/crm/ChildrenList";
import ChildCard from "@/components/admin/crm/ChildCard";

type Section = "patients" | "children";

export default function AdminCrmTab({ isAdmin = true, authorName = "Сотрудник", focusPatientId, onFocusHandled, onViewShiftHistory }: { isAdmin?: boolean; authorName?: string; focusPatientId?: number | null; onFocusHandled?: () => void; onViewShiftHistory?: (patientId: number) => void }) {
  const [section, setSection] = useState<Section>("patients");

  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [careStage, setCareStage] = useState<CareStage>("inpatient");

  const [allChildren, setAllChildren] = useState<ChildWithPatient[]>([]);
  const [childrenLoading, setChildrenLoading] = useState(false);
  const [childSearch, setChildSearch] = useState("");
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);

  const loadPatients = async () => {
    setLoading(true);
    const r = await fetch(API);
    const d = await r.json();
    setAllPatients(d.patients || []);
    setLoading(false);
  };

  const loadChildren = async () => {
    setChildrenLoading(true);
    const r = await fetch(`${API}?view=children`);
    const d = await r.json();
    setAllChildren(d.children || []);
    setChildrenLoading(false);
  };

  useEffect(() => { loadPatients(); }, []);
  useEffect(() => { if (section === "children") loadChildren(); }, [section]);

  useEffect(() => {
    if (!focusPatientId) return;
    setSection("patients");
    setSelectedId(focusPatientId);
    onFocusHandled?.();
  }, [focusPatientId]);

  const stagePatients = allPatients.filter(p => (p.care_stage ?? "inpatient") === careStage);
  const postTreatmentCount = allPatients.filter(p => p.care_stage === "posttreatment").length;

  const q = search.toLowerCase();
  const patients = search
    ? stagePatients.filter(p => `${p.last_name} ${p.first_name} ${p.middle_name ?? ""}`.toLowerCase().includes(q))
    : stagePatients;

  const cq = childSearch.toLowerCase();
  const children = childSearch
    ? allChildren.filter(c => `${c.last_name ?? ""} ${c.first_name} ${c.middle_name ?? ""}`.toLowerCase().includes(cq))
    : allChildren;

  const createPatient = async (form: typeof EMPTY_FORM) => {
    setSaving(true);
    const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await r.json();
    setSaving(false); setAdding(false);
    setSelectedId(d.patient?.id);
    loadPatients();
  };

  const openPatientFromChild = (patientId: number) => {
    setSelectedChildId(null);
    setSection("patients");
    setSelectedId(patientId);
  };

  if (selectedId) return (
    <PatientCard patientId={selectedId} onBack={() => setSelectedId(null)} onDeleted={() => { setSelectedId(null); loadPatients(); }} isAdmin={isAdmin} authorName={authorName} onViewShiftHistory={onViewShiftHistory} />
  );

  if (selectedChildId) return (
    <ChildCard
      childId={selectedChildId}
      onBack={() => setSelectedChildId(null)}
      onDeleted={() => { setSelectedChildId(null); loadChildren(); }}
      onOpenPatient={openPatientFromChild}
      isAdmin={isAdmin}
      authorName={authorName}
    />
  );

  return (
    <div className="space-y-6">
      <Tabs value={section} onValueChange={(v) => setSection(v as Section)}>
        <TabsList>
          <TabsTrigger value="patients">Пациенты</TabsTrigger>
          <TabsTrigger value="children">Дети</TabsTrigger>
        </TabsList>
      </Tabs>

      {section === "patients" ? (
        <PatientList
          allPatients={stagePatients}
          patients={patients}
          loading={loading}
          search={search}
          setSearch={setSearch}
          adding={adding}
          setAdding={setAdding}
          saving={saving}
          careStage={careStage}
          setCareStage={setCareStage}
          postTreatmentCount={postTreatmentCount}
          onCreatePatient={createPatient}
          onSelect={setSelectedId}
        />
      ) : (
        <ChildrenList
          children={children}
          loading={childrenLoading}
          search={childSearch}
          setSearch={setChildSearch}
          onSelect={setSelectedChildId}
        />
      )}
    </div>
  );
}