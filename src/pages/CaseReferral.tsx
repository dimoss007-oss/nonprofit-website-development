import { useState } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import SiteNav from "@/components/shared/SiteNav";
import SiteFooter from "@/components/shared/SiteFooter";
import Icon from "@/components/ui/icon";

const API_URL = "https://functions.poehali.dev/81a085eb-a1a8-4aa9-bf8f-22e62b80018e";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 10;

const inputCls = "w-full bg-white border border-beige-dark text-ink placeholder-muted-foreground px-4 py-3 focus:outline-none focus:border-sage text-sm rounded-lg transition-colors";
const labelCls = "block text-ink text-sm font-golos font-medium mb-1.5";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] || "");
    };
    reader.readAsDataURL(file);
  });
}

export default function CaseReferral() {
  usePageMeta({
    title: "Для обращений — АНО «Спасение надежды»",
    description: "Форма для обращений от организаций и специалистов о семьях и людях, нуждающихся в помощи.",
    ogTitle: "Для обращений — АНО «Спасение надежды»",
    ogDescription: "Сообщите о случае, требующем помощи кризисного центра.",
    canonical: "https://spasenie58.ru/case-referral",
  });

  const [organization, setOrganization] = useState("");
  const [district, setDistrict] = useState("");
  const [responsibleName, setResponsibleName] = useState("");
  const [responsiblePhone, setResponsiblePhone] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [beneficiaryPhone, setBeneficiaryPhone] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list);
    const tooBig = incoming.find(f => f.size > MAX_FILE_SIZE);
    if (tooBig) {
      setError(`Файл «${tooBig.name}» больше 10 МБ`);
      return;
    }
    setError("");
    setFiles(prev => [...prev, ...incoming].slice(0, MAX_FILES));
  };

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const resetForm = () => {
    setOrganization(""); setDistrict(""); setResponsibleName(""); setResponsiblePhone("");
    setBeneficiaryName(""); setBeneficiaryPhone(""); setDescription(""); setFiles([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const encodedFiles = await Promise.all(
        files.map(async f => ({
          filename: f.name,
          content_type: f.type || "application/octet-stream",
          data: await fileToBase64(f),
        }))
      );

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organization, district,
          responsible_name: responsibleName, responsible_phone: responsiblePhone,
          beneficiary_name: beneficiaryName, beneficiary_phone: beneficiaryPhone,
          description, files: encodedFiles,
        }),
      });

      if (res.ok) {
        setSent(true);
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Не удалось отправить. Попробуйте позже.");
      }
    } catch {
      setError("Ошибка соединения. Попробуйте позже.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-beige font-golos">
      <SiteNav />

      <main id="main-content" tabIndex={-1} className="pt-28 pb-24 max-w-3xl mx-auto px-6">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px w-8 bg-sage" />
            <span className="text-sage text-xs tracking-[0.2em] uppercase font-golos">Для специалистов и организаций</span>
          </div>
          <h1 className="font-cormorant text-ink text-4xl sm:text-5xl font-light leading-tight mb-5">
            Обращение <span className="text-sage font-semibold">по случаю</span>
          </h1>
          <p className="text-foreground/65 leading-relaxed max-w-xl">
            Если вам известно о семье или человеке, которым нужна наша помощь, заполните форму —
            мы свяжемся с вами и рассмотрим случай в кратчайшие сроки.
          </p>
        </div>

        {sent ? (
          <div className="space-y-4 bg-white rounded-2xl p-10 flex flex-col items-center justify-center min-h-[300px] shadow-sm border border-beige-dark/40">
            <div className="text-4xl mb-2">💚</div>
            <h3 className="font-cormorant text-ink text-2xl font-semibold">Обращение отправлено!</h3>
            <p className="text-foreground/60 text-sm text-center max-w-sm">
              Спасибо за неравнодушие. Мы рассмотрим случай и свяжемся с ответственным лицом в ближайшее время.
            </p>
            <button onClick={() => { setSent(false); resetForm(); }} className="text-sage text-sm underline mt-2">
              Отправить ещё одно обращение
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-beige-dark/40 space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Организация</label>
                <input type="text" value={organization} onChange={e => setOrganization(e.target.value)} placeholder="Название организации" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Район</label>
                <input type="text" value={district} onChange={e => setDistrict(e.target.value)} placeholder="Район проживания" className={inputCls} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>ФИО ответственного лица *</label>
                <input required type="text" value={responsibleName} onChange={e => setResponsibleName(e.target.value)} placeholder="Иванова Мария Петровна" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Телефон ответственного лица</label>
                <input type="tel" value={responsiblePhone} onChange={e => setResponsiblePhone(e.target.value)} placeholder="+7 900 000-00-00" className={inputCls} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>ФИО благополучателя</label>
                <input type="text" value={beneficiaryName} onChange={e => setBeneficiaryName(e.target.value)} placeholder="ФИО человека, которому нужна помощь" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Телефон благополучателя</label>
                <input type="tel" value={beneficiaryPhone} onChange={e => setBeneficiaryPhone(e.target.value)} placeholder="+7 900 000-00-00" className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Описание случая *</label>
              <textarea
                required
                rows={6}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Опишите ситуацию, в которой находится семья или человек, и какая помощь требуется..."
                className={`${inputCls} resize-none`}
              />
            </div>

            <div>
              <label className={labelCls}>Прикрепить документы</label>
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-beige-dark rounded-lg py-8 cursor-pointer hover:border-sage transition-colors bg-beige/30"
              >
                <Icon name="Paperclip" size={22} className="text-sage" />
                <span className="text-sm text-ink/60">Нажмите, чтобы прикрепить файлы</span>
                <span className="text-xs text-ink/40">до 10 файлов, не более 10 МБ каждый</span>
              </label>
              <input id="file-upload" type="file" multiple className="hidden" onChange={e => addFiles(e.target.files)} />

              {files.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {files.map((f, idx) => (
                    <li key={idx} className="flex items-center justify-between gap-3 bg-beige/50 rounded-lg px-3 py-2">
                      <span className="flex items-center gap-2 text-sm text-ink/70 min-w-0">
                        <Icon name="FileText" size={14} className="flex-shrink-0" />
                        <span className="truncate">{f.name}</span>
                      </span>
                      <button type="button" onClick={() => removeFile(idx)} className="text-ink/30 hover:text-red-500 transition-colors flex-shrink-0">
                        <Icon name="X" size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sage text-beige py-3.5 font-golos font-semibold text-sm tracking-wide uppercase rounded-xl hover:bg-sage-dark transition-colors duration-300 disabled:opacity-60"
            >
              {loading ? "Отправка..." : "Отправить обращение"}
            </button>
          </form>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
