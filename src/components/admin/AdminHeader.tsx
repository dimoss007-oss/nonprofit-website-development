import { useState } from "react";
import Icon from "@/components/ui/icon";

export interface HeaderTab {
  id: string;
  label: string;
  icon: string;
}

interface Props {
  logo: string;
  fullName: string;
  isAdmin: boolean;
  tab: string;
  mainTabs: HeaderTab[];
  refTabs: HeaderTab[];
  settingsTabs: HeaderTab[];
  onSelect: (id: string) => void;
  onAi: () => void;
  onLogout: () => void;
  headerRef: React.RefObject<HTMLElement>;
}

const linkBase = "px-3 py-2 text-sm rounded-xl transition-colors flex items-center whitespace-nowrap";
const linkOn = "font-semibold text-brand-700 bg-brand-50";
const linkOff = "font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900";

function Dropdown({ label, tabs, tab, onSelect, icon, align = "left" }: { label?: string; tabs: HeaderTab[]; tab: string; onSelect: (id: string) => void; icon?: string; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const active = tabs.some(t => t.id === tab);
  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      {icon ? (
        <button onClick={() => setOpen(o => !o)} title={label} className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${active ? "bg-brand-50 text-brand-600" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"}`}>
          <Icon name={icon} size={16} />
        </button>
      ) : (
        <button onClick={() => setOpen(o => !o)} className={`${linkBase} ${active ? linkOn : linkOff}`}>
          {label}
          <Icon name="ChevronDown" size={12} className={`ml-1.5 transition-transform ${open ? "rotate-180 opacity-100" : "opacity-50"}`} />
        </button>
      )}
      <div className={`absolute ${align === "right" ? "right-0" : "left-0"} top-full pt-1 w-52 z-50 transition-all duration-200 ${open ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2"}`}>
        <div className="bg-white border border-slate-200 rounded-xl shadow-lg py-1.5">
          {tabs.map(t => (
            <button key={t.id} onClick={() => { onSelect(t.id); setOpen(false); }} className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-slate-50 hover:text-brand-600 ${tab === t.id ? "text-brand-600 font-semibold" : "text-slate-600"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminHeader({ logo, fullName, isAdmin, tab, mainTabs, refTabs, settingsTabs, onSelect, onAi, onLogout, headerRef }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const all = [...mainTabs, ...refTabs, ...settingsTabs];

  return (
    <header ref={headerRef} className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm font-inter">
      <div className="h-16 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center min-w-0">
          <button onClick={() => setMobileOpen(o => !o)} className="lg:hidden mr-4 text-slate-500 hover:text-slate-800 transition-colors" aria-label="Меню">
            <Icon name={mobileOpen ? "X" : "Menu"} size={22} />
          </button>

          <a href="/" className="flex items-center mr-8 flex-shrink-0">
            <img src={logo} alt="Спасение надежды" className="w-8 h-8 rounded-xl object-cover mr-2.5" />
            <div className="leading-tight hidden sm:block">
              <h2 className="font-bold text-slate-900 text-sm tracking-tight">АНО Спасение надежды</h2>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">CRM Система</p>
            </div>
          </a>

          <nav className="hidden lg:flex items-center space-x-1">
            {mainTabs.map(t => (
              <button key={t.id} onClick={() => onSelect(t.id)} className={`${linkBase} ${tab === t.id ? linkOn : linkOff}`}>{t.label}</button>
            ))}
            {refTabs.length > 0 && <Dropdown label="Справочник" tabs={refTabs} tab={tab} onSelect={onSelect} />}
          </nav>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-3 flex-shrink-0">
          {settingsTabs.length > 0 && <Dropdown label="Настройки" icon="Settings" tabs={settingsTabs} tab={tab} onSelect={onSelect} align="right" />}

          {isAdmin && (
            <>
              <button onClick={onAi} className="hidden sm:flex items-center px-4 py-1.5 bg-ai-600 hover:bg-ai-700 text-white text-sm font-medium rounded-xl shadow-sm transition-colors ml-1">
                <Icon name="Sparkles" size={14} className="mr-2" /> Спросить ИИ
              </button>
              <button onClick={onAi} className="sm:hidden w-9 h-9 rounded-xl bg-ai-50 text-ai-600 flex items-center justify-center ml-1" aria-label="Спросить ИИ">
                <Icon name="Sparkles" size={16} />
              </button>
            </>
          )}

          <div className="flex items-center pl-2 sm:pl-4 ml-1 sm:ml-2 border-l border-slate-200">
            <div className="hidden md:block mr-3 text-right">
              <p className="text-sm font-semibold text-slate-700 leading-none">{fullName}</p>
            </div>
            <button onClick={onLogout} title="Выйти" className="w-8 h-8 bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-colors">
              <Icon name="LogOut" size={14} />
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <nav className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 grid grid-cols-2 gap-1 max-h-[70vh] overflow-y-auto">
          {all.map(t => (
            <button key={t.id} onClick={() => { onSelect(t.id); setMobileOpen(false); }} className={`${linkBase} ${tab === t.id ? linkOn : linkOff}`}>
              <Icon name={t.icon} size={14} className="mr-2" />
              {t.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}
