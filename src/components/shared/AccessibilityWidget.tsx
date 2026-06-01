import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

type FontSize = "normal" | "large" | "xlarge";
type Contrast = "normal" | "high" | "inverted";

interface A11ySettings {
  fontSize: FontSize;
  contrast: Contrast;
  lineHeight: boolean;
  hideImages: boolean;
}

const STORAGE_KEY = "a11y-settings";

const defaults: A11ySettings = {
  fontSize: "normal",
  contrast: "normal",
  lineHeight: false,
  hideImages: false,
};

function loadSettings(): A11ySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch {
    return defaults;
  }
}

function applySettings(s: A11ySettings) {
  const root = document.documentElement;

  // Font size
  const fontMap: Record<FontSize, string> = { normal: "100%", large: "120%", xlarge: "140%" };
  root.style.fontSize = fontMap[s.fontSize];

  // Contrast
  root.setAttribute("data-contrast", s.contrast);

  // Line height
  root.setAttribute("data-lineheight", s.lineHeight ? "wide" : "normal");

  // Images
  root.setAttribute("data-hideimages", s.hideImages ? "true" : "false");
}

export default function AccessibilityWidget() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<A11ySettings>(loadSettings);

  useEffect(() => {
    applySettings(settings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  function update(patch: Partial<A11ySettings>) {
    setSettings((prev) => ({ ...prev, ...patch }));
  }

  function reset() {
    setSettings(defaults);
  }

  return (
    <>
      {/* Глобальные стили доступности */}
      <style>{`
        [data-contrast="high"] {
          filter: none !important;
        }
        [data-contrast="high"] body,
        [data-contrast="high"] * {
          background-color: #000 !important;
          color: #ff0 !important;
          border-color: #ff0 !important;
          text-shadow: none !important;
          box-shadow: none !important;
        }
        [data-contrast="high"] a { color: #0ff !important; }
        [data-contrast="high"] button { background: #000 !important; color: #ff0 !important; border: 1px solid #ff0 !important; }
        [data-contrast="high"] img { filter: grayscale(100%) contrast(1.5) !important; }
        [data-contrast="high"] .a11y-widget-panel,
        [data-contrast="high"] .a11y-widget-panel * { background-color: #111 !important; color: #ff0 !important; }

        [data-contrast="inverted"] body { filter: invert(1) hue-rotate(180deg); }
        [data-contrast="inverted"] img { filter: invert(1) hue-rotate(180deg); }

        [data-lineheight="wide"] * { line-height: 1.8 !important; letter-spacing: 0.05em !important; }

        [data-hideimages="true"] img:not([data-a11y-keep]) { opacity: 0 !important; }
        [data-hideimages="true"] [style*="background-image"] { background-image: none !important; }

        /* Скрыть декоративные изображения от скринридеров */
        .deco-img { pointer-events: none; }

        /* Фокус-кольцо для всех интерактивных элементов */
        :focus-visible {
          outline: 3px solid #005fcc !important;
          outline-offset: 2px !important;
        }
      `}</style>

      {/* Кнопка открытия */}
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="Версия для слабовидящих — открыть панель доступности"
        title="Версия для слабовидящих"
        style={{
          position: "fixed",
          top: "50%",
          right: 0,
          transform: "translateY(-50%)",
          zIndex: 9999,
          background: "#005fcc",
          color: "#fff",
          border: "none",
          borderRadius: "8px 0 0 8px",
          padding: "10px 8px",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "6px",
          boxShadow: "-2px 0 12px rgba(0,0,0,0.2)",
          writingMode: "vertical-rl",
          fontSize: "11px",
          fontWeight: 600,
          fontFamily: "sans-serif",
          letterSpacing: "0.5px",
          lineHeight: 1.2,
        }}
      >
        <Icon name="Eye" size={18} />
        <span style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: "10px" }}>
          Для слабовидящих
        </span>
      </button>

      {/* Панель */}
      {open && (
        <div
          className="a11y-widget-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Панель доступности"
          style={{
            position: "fixed",
            top: "50%",
            right: "48px",
            transform: "translateY(-50%)",
            zIndex: 9998,
            background: "#fff",
            border: "2px solid #005fcc",
            borderRadius: "12px",
            padding: "20px",
            width: "280px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            fontFamily: "sans-serif",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#111" }}>
              Доступность
            </h2>
            <button
              onClick={() => setOpen(false)}
              aria-label="Закрыть панель доступности"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#555", padding: "4px" }}
            >
              <Icon name="X" size={18} />
            </button>
          </div>

          {/* Размер шрифта */}
          <fieldset style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "12px", marginBottom: "12px" }}>
            <legend style={{ fontSize: "12px", color: "#555", padding: "0 4px", fontWeight: 600 }}>Размер шрифта</legend>
            <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
              {(["normal", "large", "xlarge"] as FontSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => update({ fontSize: size })}
                  aria-pressed={settings.fontSize === size}
                  style={{
                    flex: 1,
                    padding: "8px 4px",
                    border: settings.fontSize === size ? "2px solid #005fcc" : "1px solid #ccc",
                    borderRadius: "6px",
                    background: settings.fontSize === size ? "#e8f0fe" : "#fff",
                    cursor: "pointer",
                    fontWeight: settings.fontSize === size ? 700 : 400,
                    fontSize: size === "normal" ? "12px" : size === "large" ? "14px" : "17px",
                    color: "#111",
                  }}
                >
                  {size === "normal" ? "А" : size === "large" ? "А+" : "А++"}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Контрастность */}
          <fieldset style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "12px", marginBottom: "12px" }}>
            <legend style={{ fontSize: "12px", color: "#555", padding: "0 4px", fontWeight: 600 }}>Контрастность</legend>
            <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
              {([
                { value: "normal", label: "Обычный", bg: "#fff", color: "#111" },
                { value: "high", label: "Чёрно-жёлтый", bg: "#000", color: "#ff0" },
                { value: "inverted", label: "Инверсия", bg: "#222", color: "#eee" },
              ] as { value: Contrast; label: string; bg: string; color: string }[]).map(({ value, label, bg, color }) => (
                <button
                  key={value}
                  onClick={() => update({ contrast: value })}
                  aria-pressed={settings.contrast === value}
                  title={label}
                  style={{
                    flex: 1,
                    padding: "8px 4px",
                    border: settings.contrast === value ? "2px solid #005fcc" : "1px solid #ccc",
                    borderRadius: "6px",
                    background: bg,
                    color,
                    cursor: "pointer",
                    fontSize: "11px",
                    fontWeight: 600,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Дополнительные опции */}
          <fieldset style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
            <legend style={{ fontSize: "12px", color: "#555", padding: "0 4px", fontWeight: 600 }}>Дополнительно</legend>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px", cursor: "pointer", fontSize: "13px", color: "#111" }}>
              <input
                type="checkbox"
                checked={settings.lineHeight}
                onChange={(e) => update({ lineHeight: e.target.checked })}
                style={{ width: "18px", height: "18px", cursor: "pointer" }}
              />
              Увеличить межстрочный интервал
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px", cursor: "pointer", fontSize: "13px", color: "#111" }}>
              <input
                type="checkbox"
                checked={settings.hideImages}
                onChange={(e) => update({ hideImages: e.target.checked })}
                style={{ width: "18px", height: "18px", cursor: "pointer" }}
              />
              Скрыть декоративные изображения
            </label>
          </fieldset>

          {/* Сброс */}
          <button
            onClick={reset}
            style={{
              width: "100%",
              padding: "10px",
              background: "#f5f5f5",
              border: "1px solid #ccc",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "13px",
              color: "#333",
              fontWeight: 600,
            }}
          >
            Сбросить настройки
          </button>
        </div>
      )}
    </>
  );
}
