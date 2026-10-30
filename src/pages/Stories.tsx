import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import SiteFooter from "@/components/shared/SiteFooter";
import { Story, StoryCard, StoryModal, fetchStories } from "@/components/home/TopStoriesWidget";

export default function Stories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState<Story | null>(null);

  useEffect(() => {
    Promise.all([fetchStories(false), fetchStories(true)])
      .then(([top, old]) => setStories([...top, ...old]))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  return (
    <div className="min-h-screen bg-beige font-golos">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <Link to="/" className="text-sm text-ink/60 hover:underline">На главную</Link>
        <h1 className="font-cormorant text-4xl font-semibold text-ink mt-3 mb-8">Благодаря вам: все истории</h1>
        {loaded && stories.length === 0 && <p className="text-ink/60">Истории скоро появятся.</p>}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map(s => <StoryCard key={s.campaign_id} story={s} onOpen={() => setOpen(s)} />)}
        </div>
      </div>
      <StoryModal story={open} onClose={() => setOpen(null)} />
      <SiteFooter />
    </div>
  );
}
