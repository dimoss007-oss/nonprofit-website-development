import { useRef } from "react";

const LOGO_URL = "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/a2ebb70f-f4e9-427c-8622-b5e69e101dc8.jpg";

export default function Gratitude() {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-200 flex flex-col items-center py-10 gap-6">
      <button
        onClick={handlePrint}
        className="print:hidden bg-amber-700 hover:bg-amber-800 text-white font-semibold px-8 py-3 rounded-lg shadow-lg text-lg transition-colors"
      >
        Скачать / Распечатать
      </button>

      {/* A4 sheet */}
      <div
        ref={printRef}
        id="gratitude-sheet"
        className="gratitude-sheet bg-[#f0ebe0] shadow-2xl relative flex flex-col items-center justify-between"
        style={{
          width: "210mm",
          minHeight: "297mm",
          padding: "18mm 16mm",
          fontFamily: "'Times New Roman', Times, serif",
          backgroundImage: `url(${LOGO_URL})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-[#f5f0e8]/80 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center w-full h-full text-center">
          {/* Title */}
          <h1
            style={{
              fontFamily: "'Palatino Linotype', Palatino, serif",
              fontSize: "52pt",
              color: "#8B6914",
              fontStyle: "italic",
              fontWeight: "bold",
              marginBottom: "6mm",
              lineHeight: 1.1,
              textShadow: "0 1px 2px rgba(139,105,20,0.15)",
            }}
          >
            Благодарность
          </h1>

          {/* Divider ornament */}
          <div style={{ color: "#B8860B", fontSize: "18pt", marginBottom: "4mm", letterSpacing: "6px" }}>
            ❧ ✦ ❧
          </div>

          {/* Recipient */}
          <p style={{ fontSize: "13pt", color: "#4a3a1a", marginBottom: "2mm", lineHeight: 1.5 }}>
            Сотрудникам кризисного центра «Спасение Надежды»
          </p>
          <p style={{ fontSize: "15pt", color: "#4a3a1a", fontWeight: "bold", marginBottom: "6mm", lineHeight: 1.5 }}>
            Мартыновой Анастасии Георгиевне
          </p>

          {/* Divider line */}
          <div style={{ width: "60%", height: "1px", background: "linear-gradient(to right, transparent, #B8860B, transparent)", marginBottom: "7mm" }} />

          {/* Main text */}
          <div style={{ fontSize: "12pt", color: "#3a2e10", lineHeight: 1.9, marginBottom: "6mm", maxWidth: "80%" }}>
            <p style={{ marginBottom: "4mm" }}>
              За Вашу самоотдачу и глубокое мужество<br />
              в ежедневной работе с матерями,<br />
              оказавшимися в сложной жизненной ситуации.
            </p>
            <p style={{ marginBottom: "4mm" }}>
              Ваше сострадание и профессионализм<br />
              возвращают веру в будущее.
            </p>
            <p>
              Кризисный центр — это уникальный социальный оплот,<br />
              где профессиональная помощь сливается<br />
              с сердечным теплом команды, создавая мощный фундамент<br />
              для восстановления духа и обретения безопасности.
            </p>
          </div>

          {/* Motto */}
          <p style={{ fontSize: "13pt", color: "#8B6914", fontWeight: "bold", letterSpacing: "2px", marginBottom: "7mm" }}>
            СИЛА ЕДИНСТВА И ПУТЬ К НАДЕЖДЕ
          </p>

          {/* Divider line */}
          <div style={{ width: "60%", height: "1px", background: "linear-gradient(to right, transparent, #B8860B, transparent)", marginBottom: "7mm" }} />

          {/* Logo */}
          <img
            src="https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/logo.png"
            alt="Логотип"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            style={{ width: "28mm", height: "28mm", objectFit: "contain", marginBottom: "6mm" }}
          />

          {/* Signatures */}
          <p style={{ fontSize: "11pt", color: "#4a3a1a", marginBottom: "2mm" }}>
            С уважением к Вам,<br />
            учредитель АНО «Спасение Надежды»
          </p>
          <p style={{ fontSize: "13pt", color: "#4a3a1a", fontWeight: "bold", marginBottom: "1mm" }}>
            Сайфуллин Василий Валерьевич
          </p>
          <p style={{ fontSize: "11pt", color: "#4a3a1a", marginBottom: "2mm" }}>
            генеральный директор
          </p>
          <p style={{ fontSize: "13pt", color: "#4a3a1a", fontWeight: "bold" }}>
            Чуйкин Дмитрий Юрьевич
          </p>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body * {
            visibility: hidden;
          }
          #gratitude-sheet, #gratitude-sheet * {
            visibility: visible;
          }
          #gratitude-sheet {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 18mm 16mm !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
