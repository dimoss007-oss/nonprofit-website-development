import { CABINET_URL } from "@/components/cabinet/cabinet.shared";

export type Creds = { authLogin: string; authPassword: string };

export interface PsychoSession {
  id: string;
  date: string;
  clientId: string;
  clientName: string;
  request: string;
  phenomenology: string;
  contactInterruptions: string;
  clientFeelings: string;
  clientBackground: string;
  clientFigure: string;
  therapistFeelings: string;
  aiConsultantStrategy?: string;
  aiSupervision?: string;
  attachedStrategy?: string;
  attachedAt?: string | null;
}

export type FamilyOption = { id: number; name: string };

export const emptySession = (): PsychoSession => ({
  id: "", date: new Date().toISOString().slice(0, 10), clientId: "", clientName: "",
  request: "", phenomenology: "", contactInterruptions: "", clientFeelings: "",
  clientBackground: "", clientFigure: "", therapistFeelings: "",
});

export async function psychoCall<T = Record<string, unknown>>(creds: Creds, action: string, payload: object = {}): Promise<T> {
  const r = await fetch(CABINET_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: `psycho_${action}`, auth_login: creds.authLogin, auth_password: creds.authPassword, ...payload }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Ошибка запроса");
  return d as T;
}

type Row = {
  id: string; session_date: string; client_id: number | null; client_name: string; request: string; phenomenology: string;
  contact_interruptions: string; client_feelings: string; client_background: string; client_figure: string; therapist_feelings: string;
  ai_consultant_strategy: string | null; ai_supervision: string | null; attached_strategy: string | null; attached_at: string | null;
};

export const fromRow = (r: Row): PsychoSession => ({
  id: r.id, date: String(r.session_date).slice(0, 10), clientId: r.client_id ? String(r.client_id) : "", clientName: r.client_name,
  request: r.request, phenomenology: r.phenomenology, contactInterruptions: r.contact_interruptions, clientFeelings: r.client_feelings,
  clientBackground: r.client_background, clientFigure: r.client_figure, therapistFeelings: r.therapist_feelings,
  aiConsultantStrategy: r.ai_consultant_strategy || undefined, aiSupervision: r.ai_supervision || undefined,
  attachedStrategy: r.attached_strategy || undefined, attachedAt: r.attached_at,
});

export const toPayload = (s: PsychoSession) => ({
  id: s.id || undefined, date: s.date, client_id: s.clientId ? Number(s.clientId) : null, client_name: s.clientName,
  request: s.request, phenomenology: s.phenomenology, contact_interruptions: s.contactInterruptions,
  client_feelings: s.clientFeelings, client_background: s.clientBackground, client_figure: s.clientFigure,
  therapist_feelings: s.therapistFeelings,
});

export type { Row as PsychoRow };
