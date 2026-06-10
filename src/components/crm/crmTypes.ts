export const API = "https://functions.poehali.dev/c30060e8-222e-48b5-823a-3f1a5b44fbd5";
export const UPLOAD_API = "https://functions.poehali.dev/8a6d9ba2-3c66-4604-bccf-68b50295e021";
export const AUTH_URL = "https://functions.poehali.dev/42446f5d-c602-4dda-95e8-a4ca03153de0";
export const SESSION_KEY = "crm_admin_auth";

export const EMPTY_FORM = {
  last_name: "", first_name: "", middle_name: "", birth_date: "",
  address: "", admission_date: "", case_description: "",
  passport_series: "", passport_number: "", passport_issued_date: "", passport_issued_by: "",
};

export type Child = { id: number; last_name?: string; first_name: string; middle_name?: string; birth_date?: string };
export type Document = { id: number; file_name: string; file_url: string; file_type?: string; file_size?: number; uploaded_at: string };
export type Patient = {
  id: number; last_name: string; first_name: string; middle_name?: string;
  birth_date?: string; address?: string; admission_date?: string;
  case_description?: string; created_at: string; children_count?: number;
  passport_series?: string; passport_number?: string;
  passport_issued_date?: string; passport_issued_by?: string;
};
export type PatientFull = { patient: Patient; children: Child[]; documents: Document[] };

export function fmt(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU");
}

export function fmtSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}
