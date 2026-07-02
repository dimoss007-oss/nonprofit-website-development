export const GOV_API = "https://functions.poehali.dev/afaf030c-c06d-4ad0-a892-c452595fa437";

export const inp = "w-full border border-beige-dark rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink bg-beige/40";
export const lbl = "block text-xs uppercase tracking-widest text-ink/50 mb-1";

export type AgreementStatus = "sent" | "signed" | "rejected" | null;

export interface Agency {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  service_phone: string | null;
  has_contact: boolean;
  email: string | null;
  working_hours: string | null;
  notes: string | null;
  created_at: string;
  agreement_status: AgreementStatus;
}

export interface AgencyContact {
  id: number;
  agency_id: number;
  name: string;
  phone: string | null;
  role: string | null;
}

export interface GovDocument {
  id: number;
  agency_id: number;
  title: string;
  url: string | null;
  notes: string | null;
  doc_date: string | null;
  created_at: string;
}

export const emptyForm = (): Partial<Agency> => ({
  name: "", phone: "", address: "", service_phone: "",
  has_contact: false, email: "", working_hours: "", notes: "",
  agreement_status: null,
});