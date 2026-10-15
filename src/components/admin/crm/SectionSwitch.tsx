export type CrmSection = "patients" | "children" | "alumni";

const ITEMS: { id: CrmSection; label: string }[] = [
  { id: "patients", label: "Матери" },
  { id: "children", label: "Дети" },
  { id: "alumni", label: "Выпускники" },
];

export default function SectionSwitch({ section, setSection }: { section: CrmSection; setSection: (v: CrmSection) => void }) {
  return (
    <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
      {ITEMS.map(i => (
        <button key={i.id} onClick={() => setSection(i.id)} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition ${section === i.id ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>{i.label}</button>
      ))}
    </div>
  );
}
