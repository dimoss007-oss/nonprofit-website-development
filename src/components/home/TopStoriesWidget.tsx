import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import Icon from "@/components/ui/icon";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CABINET_URL } from "@/components/cabinet/cabinet.shared";

export type Story = { campaign_id: number; title: string; photo_url: string | null; preview: string; full_text: string };

export async function fetchStories(archive = false, tag = ""): Promise<Story[]> {
  const r = await fetch(`${CABINET_URL}?view=top_stories${archive ? "&archive=1" : ""}${tag ? `&tag=${tag}` : ""}`);
  const d = await r.json();
  return d.stories || [];
}

export function StoryCard({ story, onOpen }: { story: Story; onOpen: () => void }) {
  return (
    <article className="bg-white rounded-2xl overflow-hidden border border-beige-dark/60 flex flex-col">
      <div className="aspect-[4/3] bg-beige-mid">
        {story.photo_url && <img src={story.photo_url} alt={story.title} loading="lazy" className="w-full h-full object-cover" />}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-cormorant text-xl font-semibold text-ink mb-2 leading-snug">{story.title}</h3>
        <p className="text-sm text-ink/70 leading-relaxed flex-1">{story.preview}</p>
        <button onClick={onOpen} className="mt-4 self-start inline-flex items-center gap-1.5 text-sm font-medium text-ink hover:underline">
          Читать историю полностью <Icon name="ArrowRight" size={14} />
        </button>
      </div>
    </article>
  );
}

export function StoryModal({ story, onClose, src = "" }: { story: Story | null; onClose: () => void; src?: string }) {
  const paragraphs = story ? story.full_text.split("\n\n").filter(p => p.trim()) : [];
  return (
    <Dialog open={!!story} onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {story && (
          <>
            <DialogHeader>
              <DialogTitle className="font-cormorant text-2xl">{story.title}</DialogTitle>
              <DialogDescription className="sr-only">История помощи</DialogDescription>
            </DialogHeader>
            {story.photo_url && <img src={story.photo_url} alt="" className="w-full rounded-xl max-h-80 object-cover" />}
            <div className="space-y-3 text-sm text-ink/80 leading-relaxed">
              {paragraphs.map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}
            </div>
            <Link
              to="/donate"
              search={{ src: src || `story-${story.campaign_id}` } as never}
              className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-ink text-beige font-semibold py-3.5 hover:opacity-90 transition-opacity"
            >
              <Icon name="HeartHandshake" size={18} /> Помочь другим семьям
            </Link>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function TopStoriesWidget({ tag = "", title = "Благодаря вам", subtitle = "5 историй добра за месяц", donateSrc = "" }: { tag?: string; title?: string; subtitle?: string; donateSrc?: string }) {
  const [stories, setStories] = useState<Story[]>([]);
  const [open, setOpen] = useState<Story | null>(null);

  useEffect(() => { fetchStories(false, tag).then(setStories).catch(() => {}); }, []);

  if (stories.length === 0) return null;

  return (
    <section className="py-16 px-4 bg-beige-mid" aria-labelledby="top-stories-title">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 id="top-stories-title" className="font-cormorant text-4xl font-semibold text-ink">{title}</h2>
          <p className="text-ink/60 mt-2">{subtitle}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map(s => <StoryCard key={s.campaign_id} story={s} onOpen={() => setOpen(s)} />)}
        </div>
        <div className="text-center mt-8">
          {!tag && <Link to="/stories" className="text-sm font-medium text-ink hover:underline">Все истории</Link>}
        </div>
      </div>
      <StoryModal story={open} src={donateSrc} onClose={() => setOpen(null)} />
    </section>
  );
}
