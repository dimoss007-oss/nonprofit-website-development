import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import Icon from "@/components/ui/icon";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const YOOKASSA_URL = "https://functions.poehali.dev/96a24ba0-1990-499e-97df-59219cdda4af";
const QUICK_AMOUNTS = [300, 500, 1000];

interface TargetDonationModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  currentAmount: number;
  targetAmount: number;
}

type Stage = "form" | "qr" | "paid";

const fmt = (n: number) => `${Math.round(n).toLocaleString("ru")} ₽`;

export default function TargetDonationModal({ open, onClose, title, currentAmount, targetAmount }: TargetDonationModalProps) {
  const [amount, setAmount] = useState<number>(500);
  const [custom, setCustom] = useState("");
  const [stage, setStage] = useState<Stage>("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [qrData, setQrData] = useState("");
  const [paymentUrl, setPaymentUrl] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const finalAmount = custom ? Number(custom) : amount;
  const pct = targetAmount > 0 ? Math.min(100, Math.round((currentAmount / targetAmount) * 100)) : 0;

  const stopPolling = () => {
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
  };

  useEffect(() => {
    if (!open) {
      stopPolling();
      setStage("form"); setError(""); setQrData(""); setPaymentUrl(""); setPaymentId(""); setCustom(""); setAmount(500);
    }
  }, [open]);

  useEffect(() => {
    stopPolling();
    if (stage !== "qr" || !paymentId) return;
    timer.current = setInterval(async () => {
      try {
        const r = await fetch(`${YOOKASSA_URL}?payment_id=${paymentId}`);
        const d = await r.json();
        if (d.status === "succeeded") { stopPolling(); setStage("paid"); }
        if (d.status === "canceled") { stopPolling(); setStage("form"); setError("Платёж не прошёл. Попробуйте ещё раз."); }
      } catch { /* повторим на следующем тике */ }
    }, 3000);
    return stopPolling;
  }, [stage, paymentId]);

  const pay = async () => {
    if (!finalAmount || finalAmount < 1) { setError("Укажите сумму от 1 ₽"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(YOOKASSA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          goal_title: title,
          payment_method: "sbp_qr",
          success_url: `${window.location.origin}/donate`,
        }),
      });
      const data = await res.json();
      if (data.qr_data) {
        setQrData(data.qr_data); setPaymentUrl(data.payment_url || ""); setPaymentId(data.payment_id); setStage("qr");
      } else if (data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        setError(data.error || "Не удалось создать платёж");
      }
    } catch {
      setError("Ошибка соединения. Попробуйте снова.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="font-cormorant text-ink text-2xl">{title}</DialogTitle>
          <DialogDescription className="text-ink/50">Целевое пожертвование</DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-ink/60">Собрано {fmt(currentAmount)} из {fmt(targetAmount)}</span>
            <span className="text-ink font-medium">{pct}%</span>
          </div>
          <div className="h-2.5 bg-beige-mid rounded-full overflow-hidden">
            <div className="h-full bg-sage rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {stage === "form" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {QUICK_AMOUNTS.map((a) => (
                <button key={a} onClick={() => { setAmount(a); setCustom(""); }}
                  className={`py-2.5 rounded-lg border text-sm font-semibold transition-colors ${!custom && amount === a ? "bg-sage text-white border-sage" : "bg-white text-ink border-sage/30 hover:border-sage"}`}>
                  {a} ₽
                </button>
              ))}
            </div>
            <input type="number" min={1} placeholder="Другая сумма, ₽" value={custom}
              onChange={(e) => setCustom(e.target.value)}
              className="w-full border border-sage/20 text-ink placeholder-foreground/40 px-3 py-2.5 rounded-lg focus:outline-none focus:border-sage text-sm" />
            {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <button onClick={pay} disabled={loading || !finalAmount || finalAmount < 1}
              className="w-full bg-sage text-white py-3 rounded-lg font-semibold text-sm hover:bg-sage-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              <Icon name="QrCode" size={16} />
              {loading ? "Создаём QR-код..." : `Оплатить по QR-коду (СБП)${finalAmount ? ` ${fmt(finalAmount)}` : ""}`}
            </button>
            <p className="text-xs text-ink/40 text-center">Оплата через ЮКасса и Систему быстрых платежей</p>
          </div>
        )}

        {stage === "qr" && (
          <div className="space-y-4 text-center">
            <div className="inline-block bg-white p-4 rounded-xl border border-beige-dark">
              <QRCodeSVG value={qrData} size={220} />
            </div>
            <p className="text-sm text-ink/70">Откройте приложение банка, наведите камеру на QR-код и подтвердите платёж {fmt(finalAmount)}</p>
            <p className="text-xs text-ink/40 flex items-center justify-center gap-1.5">
              <span className="w-3 h-3 border-2 border-sage border-t-transparent rounded-full animate-spin" />Ждём подтверждения оплаты
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              {paymentUrl && <a href={paymentUrl} className="text-sm text-sage underline">Оплатить с телефона по ссылке</a>}
              <button onClick={() => setStage("form")} className="text-sm text-ink/50 underline">Изменить сумму</button>
            </div>
          </div>
        )}

        {stage === "paid" && (
          <div className="text-center space-y-3 py-4">
            <div className="w-14 h-14 rounded-full bg-sage/15 mx-auto flex items-center justify-center"><Icon name="HeartHandshake" size={28} className="text-sage" /></div>
            <p className="font-cormorant text-ink text-2xl font-semibold">Спасибо за помощь!</p>
            <p className="text-sm text-ink/60">Пожертвование {fmt(finalAmount)} на «{title}» получено.</p>
            <button onClick={onClose} className="px-5 py-2.5 rounded-lg bg-sage text-white text-sm font-semibold hover:bg-sage-dark transition-colors">Закрыть</button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
