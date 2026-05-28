import { LOGO_IMG } from "./financeTypes";

interface Props {
  login: string;
  password: string;
  authError: string;
  authLoading: boolean;
  onLoginChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function FinanceLogin({ login, password, authError, authLoading, onLoginChange, onPasswordChange, onSubmit }: Props) {
  return (
    <div className="min-h-screen bg-beige flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <img src={LOGO_IMG} alt="Логотип" className="h-14 w-auto" />
        </div>
        <h1 className="text-xl font-cormorant font-semibold text-ink text-center mb-6">Финансы — вход</h1>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <input type="text" placeholder="Логин" value={login} onChange={(e) => onLoginChange(e.target.value)}
            className="border border-beige-dark rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage" />
          <input type="password" placeholder="Пароль" value={password} onChange={(e) => onPasswordChange(e.target.value)}
            className="border border-beige-dark rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage" />
          {authError && <p className="text-red-500 text-sm">{authError}</p>}
          <button type="submit" disabled={authLoading}
            className="bg-sage text-white rounded px-4 py-2 text-sm font-medium hover:bg-sage-dark transition-colors disabled:opacity-50">
            {authLoading ? "Вход..." : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}
