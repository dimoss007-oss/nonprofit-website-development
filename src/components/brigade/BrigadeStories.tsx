import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { Story, StoryModal, fetchStories } from "@/components/home/TopStoriesWidget";

export default function BrigadeStories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [open, setOpen] = useState<Story | null>(null);

  useEffect(() => { fetchStories(false, "mobile_brigade").then(s => setStories(s.slice(0, 3))).catch(() => {}); }, []);

  if (stories.length === 0) return null;
  return (
    <section className="py-14 px-5 bg-white" aria-labelledby="brigade-stories-title">
      <div className="max-w-5xl mx-auto">
        <h2 id="brigade-stories-title" className="font-golos text-2xl sm:text-3xl font-bold text-navy text-center">Истории помощи</h2>
        <p className="text-center text-navy/75 mt-2 mb-8">Истории публикуются только с согласия семей и без личных данных</p>
        <div className="space-y-4">
          {stories.map(s => (
            <article key={s.campaign_id} className="flex flex-col sm:flex-row bg-mist rounded-xl overflow-hidden border border-azure/15">
              {s.photo_url && <img src={s.photo_url} alt="" loading="lazy" className="w-full sm:w-56 h-44 sm:h-auto object-cover" />}
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-golos text-lg font-bold text-navy leading-snug">{s.title}</h3>
                <p className="text-sm text-navy/80 mt-2 leading-relaxed flex-1">{s.preview}</p>
                <button onClick={() => setOpen(s)} className="mt-3 self-start inline-flex items-center gap-1.5 text-sm font-semibold text-azure hover:underline">
                  Читать полностью <Icon name="ArrowRight" size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
      <StoryModal story={open} src="brigade" onClose={() => setOpen(null)} />
    </section>
  );
}
