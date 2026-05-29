// Логотип организации (круглый золотой)
const LOGO_URL =
  "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/e1a21cad-59e2-4468-8f77-22423d76f129.jpg";

// Фоновая текстура — пергамент
const BG_URL =
  "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/files/3828e527-08fc-4d51-967f-a11ab292fdf9.jpg";

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

// SVG-орнамент угла (барочный завиток)
function CornerOrnament({ rotate }: { rotate: number }) {
  return (
    <svg
      width="64" height="64" viewBox="0 0 64 64" fill="none"
      style={{ transform: `rotate(${rotate}deg)`, display: "block" }}
    >
      <g opacity="0.85">
        {/* Внешний L-образный угол */}
        <path d="M4 4 L4 28 Q4 4 28 4 Z" stroke="#C8952A" strokeWidth="1.5" fill="none"/>
        <path d="M4 4 L4 28" stroke="#C8952A" strokeWidth="2" strokeLinecap="round"/>
        <path d="M4 4 L28 4" stroke="#C8952A" strokeWidth="2" strokeLinecap="round"/>
        {/* Завитки */}
        <path d="M10 4 Q10 10 16 10 Q10 10 10 16" stroke="#C8952A" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
        <path d="M4 10 Q10 10 10 16 Q10 10 16 10" stroke="#C8952A" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
        {/* Листик */}
        <ellipse cx="22" cy="8" rx="4" ry="2.5" fill="#C8952A" opacity="0.7" transform="rotate(-30 22 8)"/>
        <ellipse cx="8" cy="22" rx="2.5" ry="4" fill="#C8952A" opacity="0.7" transform="rotate(-30 8 22)"/>
        {/* Маленький ромб в углу */}
        <rect x="2" y="2" width="5" height="5" rx="0.5" fill="#C8952A" opacity="0.6" transform="rotate(45 4.5 4.5)"/>
        {/* Цветочек */}
        <circle cx="20" cy="20" r="2.5" fill="#C8952A" opacity="0.5"/>
        <circle cx="20" cy="20" r="1" fill="#C8952A" opacity="0.9"/>
        <circle cx="20" cy="16" r="1.2" fill="#C8952A" opacity="0.4"/>
        <circle cx="20" cy="24" r="1.2" fill="#C8952A" opacity="0.4"/>
        <circle cx="16" cy="20" r="1.2" fill="#C8952A" opacity="0.4"/>
        <circle cx="24" cy="20" r="1.2" fill="#C8952A" opacity="0.4"/>
      </g>
    </svg>
  );
}

// Горизонтальный орнаментальный разделитель
function GoldDivider({ wide = false }: { wide?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", width: wide ? "72%" : "55%" }}>
      <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, transparent, #C8952A)" }} />
      <span style={{ color: "#C8952A", fontSize: "14px", padding: "0 6px", lineHeight: 1 }}>❧</span>
      <span style={{ color: "#C8952A", fontSize: "10px", padding: "0 3px", lineHeight: 1 }}>✦</span>
      <span style={{ color: "#C8952A", fontSize: "14px", padding: "0 6px", lineHeight: 1 }}>❧</span>
      <div style={{ flex: 1, height: "1px", background: "linear-gradient(to left, transparent, #C8952A)" }} />
    </div>
  );
}

function GratitudeSheet({ name, role }: { name: string; role: string }) {
  return (
    <div
      className="gratitude-page"
      style={{
        width: "210mm",
        height: "297mm",
        margin: "0 auto",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#ede8dc",
        backgroundImage: `url(${BG_URL})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        boxSizing: "border-box",
        pageBreakAfter: "always",
        breakAfter: "page",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Мерцающие блики на фоне */}
      {[
        { top: "8%", left: "12%", size: 6, opacity: 0.4 },
        { top: "15%", right: "10%", size: 4, opacity: 0.3 },
        { top: "45%", left: "5%", size: 5, opacity: 0.25 },
        { top: "60%", right: "8%", size: 7, opacity: 0.35 },
        { top: "75%", left: "20%", size: 4, opacity: 0.2 },
        { top: "30%", right: "15%", size: 5, opacity: 0.3 },
      ].map((star, i) => (
        <div key={i} style={{
          position: "absolute",
          top: star.top,
          left: (star as { left?: string }).left,
          right: (star as { right?: string }).right,
          width: star.size, height: star.size,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,220,0.9) 0%, transparent 70%)",
          opacity: star.opacity,
          pointerEvents: "none",
        }} />
      ))}

      {/* Внешняя рамка */}
      <div style={{
        position: "absolute", inset: "5mm",
        border: "2px solid #C8952A",
        pointerEvents: "none",
        zIndex: 2,
      }} />
      {/* Внутренняя рамка */}
      <div style={{
        position: "absolute", inset: "8mm",
        border: "1px solid rgba(200,149,42,0.45)",
        pointerEvents: "none",
        zIndex: 2,
      }} />

      {/* Угловые орнаменты */}
      <div style={{ position: "absolute", top: "3.5mm", left: "3.5mm", zIndex: 3 }}><CornerOrnament rotate={0} /></div>
      <div style={{ position: "absolute", top: "3.5mm", right: "3.5mm", zIndex: 3 }}><CornerOrnament rotate={90} /></div>
      <div style={{ position: "absolute", bottom: "3.5mm", right: "3.5mm", zIndex: 3 }}><CornerOrnament rotate={180} /></div>
      <div style={{ position: "absolute", bottom: "3.5mm", left: "3.5mm", zIndex: 3 }}><CornerOrnament rotate={270} /></div>

      {/* Контент */}
      <div style={{
        position: "relative", zIndex: 4,
        width: "100%", height: "100%",
        padding: "16mm 18mm 12mm",
        boxSizing: "border-box",
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 0,
        fontFamily: "'Times New Roman', Georgia, serif",
      }}>

        {/* Заголовок */}
        <h1 style={{
          fontSize: "52pt",
          fontStyle: "italic",
          fontWeight: 700,
          color: "#8B6010",
          margin: "0 0 2mm",
          lineHeight: 1,
          textAlign: "center",
          fontFamily: "'Palatino Linotype', Palatino, Georgia, serif",
          textShadow: "0 1px 0 rgba(255,220,100,0.3)",
          letterSpacing: "-0.01em",
        }}>
          Благодарность
        </h1>

        {/* Верхний орнамент под заголовком */}
        <div style={{ marginBottom: "3mm" }}>
          <GoldDivider wide />
        </div>
        <div style={{ color: "#C8952A", fontSize: "11px", letterSpacing: "10px", marginBottom: "3.5mm", opacity: 0.8 }}>
          ✦ ✦ ✦
        </div>

        {/* Кому */}
        <p style={{ fontSize: "11pt", color: "#5a4520", margin: "0 0 1.5mm", textAlign: "center", lineHeight: 1.5 }}>
          Сотрудникам кризисного центра «Спасение Надежды»
        </p>
        <p style={{ fontSize: "14.5pt", color: "#3d2c0e", fontWeight: 700, margin: "0 0 4mm", textAlign: "center", lineHeight: 1.4 }}>
          {name}
        </p>

        {/* Разделитель */}
        <div style={{ marginBottom: "4mm", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "2mm" }}>
          <GoldDivider wide />
          <div style={{ color: "#C8952A", fontSize: "12px", letterSpacing: "6px", opacity: 0.7 }}>✦ ✦ ✦</div>
          <GoldDivider wide />
        </div>

        {/* Основной текст */}
        <div style={{
          fontSize: "11.5pt",
          color: "#3d2c0e",
          lineHeight: 1.9,
          textAlign: "center",
          maxWidth: "82%",
          marginBottom: "4mm",
          fontFamily: "'Times New Roman', Georgia, serif",
        }}>
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
            где профессиональная помощь сочетается<br />
            с сердечным теплом команды, создавая надёжный фундамент<br />
            для восстановления, поддержки и обретения безопасности.
          </p>
        </div>

        {/* Девиз */}
        <p style={{
          fontSize: "11pt",
          color: "#8B6010",
          fontWeight: 700,
          letterSpacing: "3px",
          margin: "0 0 4mm",
          textAlign: "center",
          fontFamily: "'Times New Roman', Georgia, serif",
        }}>
          СИЛА ЕДИНСТВА И ПУТЬ К НАДЕЖДЕ
        </p>

        {/* Разделитель перед логотипом */}
        <div style={{ marginBottom: "4mm", width: "100%", display: "flex", justifyContent: "center" }}>
          <GoldDivider wide />
        </div>

        {/* Логотип */}
        <img
          src={LOGO_URL}
          alt="Спасение Надежды"
          style={{
            width: "30mm", height: "30mm",
            objectFit: "contain",
            marginBottom: "4mm",
            filter: "sepia(0.2) saturate(1.1)",
          }}
        />

        {/* Подпись */}
        <p style={{ fontSize: "10pt", color: "#5a4520", margin: "0 0 1.5mm", textAlign: "center" }}>
          С уважением к Вам,<br />
          учредитель АНО «Спасение Надежды»
        </p>
        <p style={{ fontSize: "13pt", color: "#3d2c0e", fontWeight: 700, margin: "0 0 1mm", textAlign: "center", fontStyle: "italic" }}>
          {SIGN_FOUNDER}
        </p>
        <p style={{ fontSize: "10pt", color: "#5a4520", margin: "0 0 1mm", textAlign: "center" }}>
          генеральный директор
        </p>
        <p style={{ fontSize: "13pt", color: "#3d2c0e", fontWeight: 700, margin: 0, textAlign: "center", fontStyle: "italic" }}>
          {SIGN_DIRECTOR}
        </p>

      </div>
    </div>
  );
}

export default function Gratitude() {
  return (
    <div style={{ background: "#b0a898", minHeight: "100vh", padding: "32px 16px" }}>
      {/* Кнопка печати */}
      <div className="print:hidden" style={{ textAlign: "center", marginBottom: "32px" }}>
        <button
          onClick={() => window.print()}
          style={{
            background: "linear-gradient(135deg, #C8952A, #8B6010)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "14px 44px",
            fontSize: "16px",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
            fontFamily: "'Golos Text', sans-serif",
            letterSpacing: "0.5px",
          }}
        >
          Распечатать / Сохранить PDF
        </button>
        <p style={{ color: "#444", fontSize: "13px", marginTop: "10px", fontFamily: "'Golos Text', sans-serif" }}>
          В диалоге печати выберите «Сохранить как PDF» — получите все {teamMembers.length} грамоты одним файлом
        </p>
      </div>

      {/* Листы */}
      <div style={{ display: "flex", flexDirection: "column", gap: "32px", alignItems: "center" }}>
        {teamMembers.map((m) => (
          <GratitudeSheet key={m.name} name={m.name} role={m.role} />
        ))}
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { margin: 0; background: white !important; }
          body > * { visibility: hidden; }
          #root { visibility: hidden; }
          .gratitude-page {
            visibility: visible !important;
            position: relative !important;
            box-shadow: none !important;
          }
          .gratitude-page * { visibility: visible !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}