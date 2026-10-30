import { useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { QRCodeSVG } from "qrcode.react";

const DONATE_URL = "https://спасениенадежды.рф/donate";
const DONATE_LINK_URL = "https://спасениенадежды.рф/donate-pay";
const LOGO_URL = "https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/4ca974da-fec3-4fd3-834d-c7dccc97fca9.jpg";

function QRCard({ url, label, filename, size }: { url: string; label: string; filename: string; size: number }) {
  const qrRef = useRef<SVGSVGElement>(null);

  const downloadPng = () => {
    const svg = qrRef.current;
    if (!svg) return;
    const padding = 40;
    const total = size + padding * 2;
    const canvas = document.createElement("canvas");
    canvas.width = total; canvas.height = total;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, total, total);
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, padding, padding, size, size);
      const a = document.createElement("a");
      a.download = filename;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center gap-3 shadow-sm">
        <QRCodeSVG
          ref={qrRef}
          value={url}
          size={size}
          level="M"
          includeMargin={false}
          imageSettings={{ src: LOGO_URL, height: 40, width: 40, excavate: true }}
        />
        <p className="text-slate-400 text-xs text-center max-w-[200px]">{label}</p>
      </div>
      <button onClick={downloadPng}
        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-100 transition-colors">
        <Icon name="Download" size={14} />
        Скачать PNG
      </button>
    </div>
  );
}

export function DonateQR() {
  const [size, setSize] = useState(260);

  return (
    <div className="space-y-8 py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-400">Размер:</span>
        <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1">
          {[200, 260, 360].map(s => (
            <button key={s} onClick={() => setSize(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${size === s ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-800"}`}>
              {s === 200 ? "S" : s === 260 ? "M" : "L"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div className="space-y-3">
          <h3 className="font-medium text-slate-800 text-sm flex items-center gap-2">
            <Icon name="Globe" size={15} /> Страница пожертвований
          </h3>
          <QRCard url={DONATE_URL} label="спасениенадежды.рф/donate" filename="qr-сайт-donate.png" size={size} />
        </div>

        <div className="space-y-3">
          <h3 className="font-medium text-slate-800 text-sm flex items-center gap-2">
            <Icon name="CreditCard" size={15} /> Прямая оплата ЮКасса
          </h3>
          <div className="flex flex-col items-center gap-3">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center gap-3 shadow-sm">
              <img
                src="https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/dc6bf240-210a-4de7-89eb-385cddae5a3c.png"
                alt="QR-код ЮКасса"
                style={{ width: size, height: size }}
                className="object-contain"
              />
              <p className="text-slate-400 text-xs text-center max-w-[200px]">Сразу открывает форму оплаты</p>
            </div>
            <a
              href="https://cdn.poehali.dev/projects/74d085df-c0f5-411a-8882-3301097b85ca/bucket/dc6bf240-210a-4de7-89eb-385cddae5a3c.png"
              download="qr-юкасса-donate.png"
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-100 transition-colors"
            >
              <Icon name="Download" size={14} />
              Скачать PNG
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DonateQR;
