const LOGO_URL =
  "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/4ca974da-fec3-4fd3-834d-c7dccc97fca9.jpg";

const SIGN_FOUNDER = "Сайфуллин Василий Валерьевич";
const SIGN_DIRECTOR = "Чуйкин Дмитрий Юрьевич";

const teamMembers = [
  { name: "Хайдарова Назира", role: "Заместитель директора по социальной работе" },
  { name: "Тузкова Евгения Юрьевна", role: "Психолог" },
  { name: "Мартынова Анастасия Георгиевна", role: "Социальный педагог" },
  { name: "Зимина Надежда Васильевна", role: "Руководитель отдела фандрайзинга" },
  { name: "Мамаев Рамазан Агитович", role: "Специалист по работе с химической зависимостью" },
  { name: "Домнин Дмитрий Михайлович", role: "Специалист по работе с химической зависимостью" },
  { name: "Скородумова Софья Константиновна", role: "Специалист по работе с химической зависимостью" },
];

function GratitudeSheet({ name, role }: { name: string; role: string }) {
  return (
    <div
      className="gratitude-page"
      style={{
        width: "210mm",
        minHeight: "297mm",
        margin: "0 auto",
        padding: "14mm 16mm 12mm",
        background: "#fdfaf4",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        fontFamily: "'Cormorant', 'Palatino Linotype', serif",
        pageBreakAfter: "always",
        breakAfter: "page",
      }}
    >
      {/* Outer border */}
      <div style={{
        position: "absolute", inset: "6mm",
        border: "2.5px solid #D4A843",
        borderRadius: "2px",
        pointerEvents: "none",
      }} />
      {/* Inner border */}
      <div style={{
        position: "absolute", inset: "9mm",
        border: "1px solid #D4A843",
        borderRadius: "1px",
        opacity: 0.5,
        pointerEvents: "none",
      }} />

      {/* Corner ornaments */}
      {["top-left", "top-right", "bottom-left", "bottom-right"].map((pos) => {
        const isTop = pos.includes("top");
        const isLeft = pos.includes("left");
        return (
          <div key={pos} style={{
            position: "absolute",
            top: isTop ? "5mm" : undefined,
            bottom: !isTop ? "5mm" : undefined,
            left: isLeft ? "5mm" : undefined,
            right: !isLeft ? "5mm" : undefined,
            width: "18mm", height: "18mm",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#D4A843",
            fontSize: "22px",
            transform: `rotate(${isTop && isLeft ? 0 : isTop && !isLeft ? 90 : !isTop && isLeft ? 270 : 180}deg)`,
            opacity: 0.7,
          }}>
            ❧
          </div>
        );
      })}

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "0" }}>

        {/* Logo */}
        <img
          src={LOGO_URL}
          alt="Спасение Надежды"
          style={{ width: "22mm", height: "22mm", objectFit: "contain", marginBottom: "4mm", marginTop: "4mm" }}
        />

        {/* Title */}
        <h1 style={{
          fontFamily: "'Cormorant', 'Palatino Linotype', serif",
          fontSize: "38pt",
          color: "#c0860a",
          fontStyle: "italic",
          fontWeight: 700,
          margin: "0 0 3mm",
          lineHeight: 1.1,
          textAlign: "center",
          letterSpacing: "0.01em",
        }}>
          Благодарность
        </h1>

        {/* Ornament divider */}
        <div style={{ color: "#D4A843", fontSize: "14pt", letterSpacing: "8px", marginBottom: "4mm" }}>
          · ✦ · ✦ · ✦ ·
        </div>

        {/* Organisation name */}
        <p style={{ fontSize: "10pt", color: "#7a6030", textTransform: "uppercase", letterSpacing: "2px", margin: "0 0 4mm", textAlign: "center" }}>
          АНО «Спасение Надежды»
        </p>

        {/* Horizontal line */}
        <div style={{ width: "65%", height: "1px", background: "linear-gradient(to right, transparent, #D4A843 30%, #D4A843 70%, transparent)", marginBottom: "5mm" }} />

        {/* Recipient */}
        <p style={{ fontSize: "11pt", color: "#4a3a18", margin: "0 0 2mm", textAlign: "center" }}>
          выражает искреннюю благодарность
        </p>
        <p style={{
          fontSize: "19pt",
          color: "#2d2210",
          fontWeight: 700,
          margin: "0 0 1.5mm",
          textAlign: "center",
          fontStyle: "italic",
        }}>
          {name}
        </p>
        <p style={{ fontSize: "11pt", color: "#7a6030", margin: "0 0 5mm", textAlign: "center", fontStyle: "italic" }}>
          {role}
        </p>

        {/* Horizontal line */}
        <div style={{ width: "65%", height: "1px", background: "linear-gradient(to right, transparent, #D4A843 30%, #D4A843 70%, transparent)", marginBottom: "5mm" }} />

        {/* Main text */}
        <div style={{ fontSize: "11.5pt", color: "#3a2e10", lineHeight: 1.85, textAlign: "center", maxWidth: "78%", marginBottom: "5mm" }}>
          <p style={{ margin: "0 0 3mm" }}>
            За Вашу самоотдачу и глубокое мужество<br />
            в ежедневной работе с матерями,<br />
            оказавшимися в сложной жизненной ситуации.
          </p>
          <p style={{ margin: "0 0 3mm" }}>
            Ваше сострадание и профессионализм<br />
            возвращают веру в будущее.
          </p>
          <p style={{ margin: 0 }}>
            Кризисный центр — это уникальный социальный оплот,<br />
            где профессиональная помощь сливается<br />
            с сердечным теплом команды, создавая мощный фундамент<br />
            для восстановления духа и обретения безопасности.
          </p>
        </div>

        {/* Motto */}
        <p style={{
          fontSize: "11pt",
          color: "#c0860a",
          fontWeight: 700,
          letterSpacing: "2.5px",
          textTransform: "uppercase",
          margin: "0 0 5mm",
          textAlign: "center",
        }}>
          Сила единства и путь к надежде
        </p>

        {/* Horizontal line */}
        <div style={{ width: "65%", height: "1px", background: "linear-gradient(to right, transparent, #D4A843 30%, #D4A843 70%, transparent)", marginBottom: "5mm" }} />

        {/* Signatures */}
        <div style={{ display: "flex", justifyContent: "space-between", width: "85%", gap: "8mm" }}>
          <div style={{ textAlign: "center", flex: 1 }}>
            <p style={{ fontSize: "9.5pt", color: "#7a6030", margin: "0 0 1mm" }}>Учредитель АНО</p>
            <p style={{ fontSize: "11pt", color: "#2d2210", fontWeight: 700, margin: 0, fontStyle: "italic" }}>{SIGN_FOUNDER}</p>
            <div style={{ width: "80%", height: "1px", background: "#D4A843", margin: "3mm auto 0", opacity: 0.5 }} />
            <p style={{ fontSize: "8pt", color: "#a08840", margin: "1mm 0 0", letterSpacing: "1px" }}>подпись / дата</p>
          </div>
          <div style={{ textAlign: "center", flex: 1 }}>
            <p style={{ fontSize: "9.5pt", color: "#7a6030", margin: "0 0 1mm" }}>Генеральный директор</p>
            <p style={{ fontSize: "11pt", color: "#2d2210", fontWeight: 700, margin: 0, fontStyle: "italic" }}>{SIGN_DIRECTOR}</p>
            <div style={{ width: "80%", height: "1px", background: "#D4A843", margin: "3mm auto 0", opacity: 0.5 }} />
            <p style={{ fontSize: "8pt", color: "#a08840", margin: "1mm 0 0", letterSpacing: "1px" }}>подпись / дата</p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function Gratitude() {
  return (
    <div style={{ background: "#d1d5db", padding: "32px 16px" }}>
      {/* Print button */}
      <div className="print:hidden" style={{ textAlign: "center", marginBottom: "32px" }}>
        <button
          onClick={() => window.print()}
          style={{
            background: "#c0860a",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "12px 36px",
            fontSize: "16px",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
            fontFamily: "'Golos Text', sans-serif",
          }}
        >
          Распечатать / Сохранить PDF
        </button>
        <p style={{ color: "#555", fontSize: "13px", marginTop: "8px", fontFamily: "'Golos Text', sans-serif" }}>
          В диалоге печати выберите «Сохранить как PDF» — получите все {teamMembers.length} грамоты
        </p>
      </div>

      {/* Sheets */}
      <div style={{ display: "flex", flexDirection: "column", gap: "32px", alignItems: "center" }}>
        {teamMembers.map((m) => (
          <GratitudeSheet key={m.name} name={m.name} role={m.role} />
        ))}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,400;0,700;1,400;1,700&display=swap');

        @media print {
          @page { size: A4 portrait; margin: 0; }
          body > * { display: none !important; }
          #root > * { display: none !important; }
          .gratitude-page {
            display: flex !important;
            visibility: visible !important;
          }
          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}
