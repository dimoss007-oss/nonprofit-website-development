import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PatientDynamics from "@/components/admin/PatientDynamics";
import PatientTasks from "@/components/admin/crm/PatientTasks";
import PatientAiSummary from "@/components/admin/crm/PatientAiSummary";
import { API, UPLOAD_API, Child, PatientFull, EMPTY_FORM, RiskBadge, fmt, fmtDateTime, fmtSize, stayDuration, CARE_STAGE_META } from "@/components/admin/crm/crmShared";
import { PatientForm, ChildForm, ChildRow, Row } from "@/components/admin/crm/PatientFormParts";

export default function PatientCard({ patientId, onBack, onDeleted, isAdmin, authorName, onViewShiftHistory }: { patientId: number; onBack: () => void; onDeleted: () => void; isAdmin: boolean; authorName: string; onViewShiftHistory?: (patientId: number) => void }) {
  const [data, setData] = useState<PatientFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addingChild, setAddingChild] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editingCareStageSince, setEditingCareStageSince] = useState(false);
  const [careStageSinceInput, setCareStageSinceInput] = useState("");
  const [savingCareStageSince, setSavingCareStageSince] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  const readAsBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const load = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    const r = await fetch(`${API}?id=${patientId}`);
    setData(await r.json());
    if (showSpinner) setLoading(false);
  };

  useEffect(() => { load(true); }, [patientId]);

  const save = async (form: typeof EMPTY_FORM) => {
    setSaving(true);
    await fetch(`${API}?id=${patientId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false); setEditing(false); load();
  };

  const deletePatient = async () => {
    if (!confirm("Удалить пациента и все его данные?")) return;
    await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete_patient", patient_id: patientId }) });
    onDeleted();
  };

  const addChild = async (c: Omit<Child, "id">) => {
    await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "add_child", patient_id: patientId, ...c }) });
    setAddingChild(false); load();
  };

  const deleteChild = async (childId: number) => {
    if (!confirm("Удалить запись о ребёнке?")) return;
    await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete_child", child_id: childId }) });
    load();
  };

  const updateChild = async (childId: number, d: Omit<Child, "id">) => {
    await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update_child", child_id: childId, ...d }) });
    load();
  };

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const input = e.target;
    if (!files.length) return;
    setUploading(true);
    await Promise.all(files.map(async (file) => {
      const base64 = await readAsBase64(file);
      await fetch(UPLOAD_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ patient_id: patientId, file_name: file.name, file_data: base64, file_type: file.type }) });
    }));
    input.value = "";
    setUploading(false);
    load();
  };

  const uploadPatientPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const base64 = await readAsBase64(file);
      await fetch(UPLOAD_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ patient_id: patientId, file_name: file.name, file_data: base64, file_type: file.type, target: "patient_photo" }) });
      await load();
    } finally {
      setUploadingPhoto(false);
    }
  };

  const uploadChildPhoto = async (childId: number, file: File) => {
    const base64 = await readAsBase64(file);
    await fetch(UPLOAD_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ patient_id: patientId, child_id: childId, file_name: file.name, file_data: base64, file_type: file.type, target: "child_photo" }) });
    await load();
  };

  const discharge = async () => {
    const today = new Date().toISOString().slice(0, 10);
    await fetch(`${API}?id=${patientId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data!.patient, birth_date: data!.patient.birth_date?.slice(0, 10) ?? "", admission_date: data!.patient.admission_date?.slice(0, 10) ?? "", passport_issued_date: data!.patient.passport_issued_date?.slice(0, 10) ?? "", discharge_date: today }) });
    load();
  };

  const readmit = async () => {
    await fetch(`${API}?id=${patientId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data!.patient, birth_date: data!.patient.birth_date?.slice(0, 10) ?? "", admission_date: data!.patient.admission_date?.slice(0, 10) ?? "", passport_issued_date: data!.patient.passport_issued_date?.slice(0, 10) ?? "", discharge_date: "" }) });
    load();
  };

  const setCareStage = async (stage: "inpatient" | "posttreatment") => {
    await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "set_care_stage", patient_id: patientId, care_stage: stage }) });
    load();
  };

  const saveCareStageSince = async () => {
    if (!careStageSinceInput) return;
    setSavingCareStageSince(true);
    try {
      await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update_care_stage_since", patient_id: patientId, care_stage_since: careStageSinceInput }) });
      setEditingCareStageSince(false);
      await load();
    } finally {
      setSavingCareStageSince(false);
    }
  };

  const deleteDoc = async (docId: number) => {
    if (!confirm("Удалить документ?")) return;
    await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete_document", document_id: docId }) });
    load();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin" /></div>;
  if (!data) return null;

  const { patient, children, documents, latest_risk_level, shift_reports_count, tasks, saved_summaries } = data;
  const fullName = [patient.last_name, patient.first_name, patient.middle_name].filter(Boolean).join(" ");
  const lastSummary = saved_summaries?.[0];
  const duration = stayDuration(patient.admission_date, patient.discharge_date);
  const isActive = !patient.discharge_date;
  const isPostTreatment = (patient.care_stage ?? "inpatient") === "posttreatment";
  const postTreatmentDuration = isPostTreatment ? stayDuration(patient.care_stage_since) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-beige-mid transition-colors"><Icon name="ArrowLeft" size={18} /></button>
        <button onClick={() => photoRef.current?.click()} className="relative w-12 h-12 rounded-full overflow-hidden bg-beige-mid flex items-center justify-center flex-shrink-0 border border-beige-dark hover:border-ink transition-colors">
          {patient.photo_url ? (
            <img src={patient.photo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <Icon name="User" size={18} className="text-ink/30" />
          )}
          {uploadingPhoto && <div className="absolute inset-0 bg-black/30 flex items-center justify-center"><Icon name="Loader" size={14} className="animate-spin text-white" /></div>}
        </button>
        <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={uploadPatientPhoto} />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-cormorant text-ink text-2xl font-semibold">{fullName}</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isActive ? "bg-green-100 text-green-700" : "bg-beige-dark text-ink/50"}`}>
              {isActive ? "В центре" : "Выписана"}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${(patient.care_stage ?? "inpatient") === "posttreatment" ? "bg-blue-100 text-blue-700" : "bg-beige-mid text-ink/60"}`}>
              {CARE_STAGE_META[patient.care_stage ?? "inpatient"].label}
            </span>
            <RiskBadge level={latest_risk_level} />
            {lastSummary && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700 flex items-center gap-1">
                <Icon name="Sparkles" size={11} />
                Сводка от {fmtDateTime(lastSummary.created_at)}
              </span>
            )}
          </div>
          <p className="text-ink/50 text-sm">
            {patient.alias && <span className="text-ink/70">Псевдоним: {patient.alias} · </span>}
            Поступила: {fmt(patient.admission_date)}
          </p>
        </div>
        <button onClick={() => setEditing(e => !e)} className="px-3 py-1.5 text-sm border border-beige-dark rounded-lg hover:border-ink transition-colors flex items-center gap-1.5">
          <Icon name="Pencil" size={14} /> Редактировать
        </button>
        {onViewShiftHistory && (
          <button onClick={() => onViewShiftHistory(patientId)} className="relative px-3 py-1.5 text-sm border border-cyan-200 text-cyan-700 rounded-lg hover:bg-cyan-50 transition-colors flex items-center gap-1.5">
            <Icon name="Clock" size={14} /> Отчёты смены
            {!!shift_reports_count && (
              <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold bg-cyan-600 text-white">
                {shift_reports_count}
              </span>
            )}
          </button>
        )}
        {isActive ? (
          <button onClick={() => confirm("Выписать пациента? Будет установлена сегодняшняя дата.") && discharge()} className="px-3 py-1.5 text-sm border border-orange-200 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors flex items-center gap-1.5">
            <Icon name="LogOut" size={14} /> Выписать
          </button>
        ) : (
          <button onClick={readmit} className="px-3 py-1.5 text-sm border border-green-200 text-green-700 rounded-lg hover:bg-green-50 transition-colors flex items-center gap-1.5">
            <Icon name="LogIn" size={14} /> Вернуть в центр
          </button>
        )}
        {(patient.care_stage ?? "inpatient") === "inpatient" ? (
          <button onClick={() => confirm("Перевести пациента на амбулаторную программу?") && setCareStage("posttreatment")} className="px-3 py-1.5 text-sm border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1.5">
            <Icon name="ArrowRightCircle" size={14} /> Перевести на амб. программу
          </button>
        ) : (
          <button onClick={() => setCareStage("inpatient")} className="px-3 py-1.5 text-sm border border-beige-dark rounded-lg hover:border-ink transition-colors flex items-center gap-1.5">
            <Icon name="ArrowLeftCircle" size={14} /> Вернуть в стационар
          </button>
        )}
        {isAdmin && (
          <button onClick={deletePatient} className="px-3 py-1.5 text-sm border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1.5">
            <Icon name="Trash2" size={14} /> Удалить
          </button>
        )}
      </div>

      {editing && (
        <div className="bg-white border border-beige-dark rounded-2xl p-6">
          <h3 className="font-semibold text-ink mb-4">Редактирование</h3>
          <PatientForm initial={{ last_name: patient.last_name, first_name: patient.first_name, middle_name: patient.middle_name ?? "", alias: patient.alias ?? "", birth_date: patient.birth_date?.slice(0, 10) ?? "", address: patient.address ?? "", admission_date: patient.admission_date?.slice(0, 10) ?? "", discharge_date: patient.discharge_date?.slice(0, 10) ?? "", case_description: patient.case_description ?? "", passport_series: patient.passport_series ?? "", passport_number: patient.passport_number ?? "", passport_issued_date: patient.passport_issued_date?.slice(0, 10) ?? "", passport_issued_by: patient.passport_issued_by ?? "" }} onSave={save} onCancel={() => setEditing(false)} loading={saving} />
        </div>
      )}

      <Tabs defaultValue="data" className="w-full">
        <TabsList>
          <TabsTrigger value="data">Данные</TabsTrigger>
          <TabsTrigger value="dynamics">Динамика</TabsTrigger>
          <TabsTrigger value="tasks">Основное задание</TabsTrigger>
          <TabsTrigger value="additional-tasks">Доп. задание</TabsTrigger>
          <TabsTrigger value="ai-summary">Аналитическая сводка</TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="space-y-6 mt-4">
          {(duration || postTreatmentDuration) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {duration && (
                <div className={`rounded-2xl p-5 flex items-center gap-4 ${isActive ? "bg-green-50 border border-green-200" : "bg-beige border border-beige-dark"}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? "bg-green-100" : "bg-beige-dark"}`}>
                    <Icon name="Timer" size={18} className={isActive ? "text-green-600" : "text-ink/40"} />
                  </div>
                  <div>
                    <p className="text-xs text-ink/40 uppercase tracking-wide mb-0.5">{isActive ? "Находится в центре" : "Находилась в центре"}</p>
                    <p className="font-semibold text-ink text-lg leading-tight">{duration}</p>
                  </div>
                </div>
              )}
              {postTreatmentDuration && (
                <div className="rounded-2xl p-5 flex items-center gap-4 bg-blue-50 border border-blue-200">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-100">
                    <Icon name="Timer" size={18} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-ink/40 uppercase tracking-wide mb-0.5">На амбулаторной программе</p>
                    <p className="font-semibold text-ink text-lg leading-tight">{postTreatmentDuration}</p>
                    <p className="text-xs text-ink/50 mt-0.5">с {fmt(patient.care_stage_since)}</p>
                    {editingCareStageSince ? (
                      <div className="flex items-center gap-2 mt-2">
                        <input type="date" value={careStageSinceInput} onChange={(e) => setCareStageSinceInput(e.target.value)} className="border border-beige-dark rounded-lg px-2 py-1 text-sm bg-white focus:outline-none focus:border-ink" />
                        <button onClick={saveCareStageSince} disabled={savingCareStageSince} className="px-2.5 py-1 text-xs rounded-lg bg-ink text-beige hover:bg-ink/90 transition-colors disabled:opacity-60">
                          {savingCareStageSince ? "..." : "Сохранить"}
                        </button>
                        <button onClick={() => setEditingCareStageSince(false)} className="p-1 text-ink/40 hover:text-ink"><Icon name="X" size={14} /></button>
                      </div>
                    ) : (
                      <button onClick={() => { setCareStageSinceInput(patient.care_stage_since?.slice(0, 10) ?? ""); setEditingCareStageSince(true); }} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1">
                        <Icon name="Pencil" size={11} /> Изменить дату
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-beige-dark rounded-2xl p-5 space-y-3">
              <h3 className="font-semibold text-ink text-sm uppercase tracking-wide">Личные данные</h3>
              <Row label="Псевдоним" value={patient.alias || "—"} />
              <Row label="Дата рождения" value={fmt(patient.birth_date)} />
              <Row label="Прописка" value={patient.address || "—"} />
              <Row label="Дата поступления" value={fmt(patient.admission_date)} />
              <Row label="Дата выписки" value={fmt(patient.discharge_date)} />
            </div>
            <div className="bg-white border border-beige-dark rounded-2xl p-5 space-y-3">
              <h3 className="font-semibold text-ink text-sm uppercase tracking-wide">Паспорт</h3>
              <Row label="Серия и номер" value={[patient.passport_series, patient.passport_number].filter(Boolean).join(" ") || "—"} />
              <Row label="Дата выдачи" value={fmt(patient.passport_issued_date)} />
              <Row label="Кем выдан" value={patient.passport_issued_by || "—"} />
            </div>
          </div>

          <div className="bg-white border border-beige-dark rounded-2xl p-5">
            <h3 className="font-semibold text-ink text-sm uppercase tracking-wide mb-3">Описание случая</h3>
            <p className="text-sm text-ink/70 whitespace-pre-wrap">{patient.case_description || "Не заполнено"}</p>
          </div>

          <div className="bg-white border border-beige-dark rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-ink text-sm uppercase tracking-wide">Дети ({children.length})</h3>
              <button onClick={() => setAddingChild(true)} className="text-sm flex items-center gap-1 text-ink/60 hover:text-ink transition-colors"><Icon name="Plus" size={14} /> Добавить</button>
            </div>
            {addingChild && <div className="mb-4"><ChildForm onAdd={addChild} onCancel={() => setAddingChild(false)} /></div>}
            {children.length === 0 && !addingChild && <p className="text-ink/40 text-sm">Нет данных о детях</p>}
            <div className="space-y-1">{children.map(c => <ChildRow key={c.id} child={c} onUpdate={updateChild} onDelete={deleteChild} onUploadPhoto={uploadChildPhoto} isAdmin={isAdmin} authorName={authorName} />)}</div>
          </div>

          <div className="bg-white border border-beige-dark rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-ink text-sm uppercase tracking-wide">Документы ({documents.length})</h3>
              <button onClick={() => fileRef.current?.click()} disabled={uploading} className="text-sm flex items-center gap-1 text-ink/60 hover:text-ink transition-colors disabled:opacity-50">
                <Icon name={uploading ? "Loader" : "Upload"} size={14} className={uploading ? "animate-spin" : ""} />
                {uploading ? "Загрузка..." : "Прикрепить"}
              </button>
              <input ref={fileRef} type="file" multiple className="hidden" onChange={uploadFile} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
            </div>
            {documents.length === 0 && <p className="text-ink/40 text-sm">Нет прикреплённых документов</p>}
            <div className="space-y-2">
              {documents.map(d => {
                const isImage = d.file_type?.startsWith("image/");
                return (
                  <div key={d.id} className="flex items-center gap-3 py-2 border-b border-beige-mid last:border-0">
                    <div className="w-8 h-8 bg-beige-mid rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon name={isImage ? "Image" : "FileText"} size={14} className="text-ink/50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-ink hover:underline truncate block">{d.file_name}</a>
                      <span className="text-xs text-ink/40">{fmtSize(d.file_size)} · {fmt(d.uploaded_at)}</span>
                    </div>
                    {isAdmin && <button onClick={() => deleteDoc(d.id)} className="p-1 text-ink/30 hover:text-red-400 transition-colors flex-shrink-0"><Icon name="X" size={14} /></button>}
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="dynamics" className="mt-4">
          <PatientDynamics patientId={patientId} authorName={authorName} isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <PatientTasks patientId={patientId} tasks={tasks ?? []} taskType="main" onChanged={() => load()} />
        </TabsContent>

        <TabsContent value="additional-tasks" className="mt-4">
          <PatientTasks patientId={patientId} tasks={tasks ?? []} taskType="additional" onChanged={() => load()} />
        </TabsContent>

        <TabsContent value="ai-summary" className="mt-4">
          <PatientAiSummary patientId={patientId} currentSummary={data.advanced_local_summary} savedSummaries={data.saved_summaries ?? []} onChanged={() => load()} />
        </TabsContent>
      </Tabs>
    </div>
  );
}