import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CABINET_URL, cabinetGet } from "@/components/cabinet/cabinet.shared";

export type GratitudePost = {
  id: number;
  post_type: "drawing" | "card" | "letter";
  media_url: string | null;
  caption: string;
  letter_text: string | null;
  goal_id: number | null;
};

const TYPE_LABEL: Record<string, string> = { drawing: "Рисунок", card: "Открытка", letter: "Письмо" };

function Tile({ post, onOpen }: { post: GratitudePost; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="group relative block w-full mb-4 break-inside-avoid overflow-hidden rounded-2xl bg-white border border-beige-dark/60 text-left">
      {post.media_url && <img src={post.media_url} alt={post.caption || TYPE_LABEL[post.post_type]} loading="lazy" className="w-full h-auto block" />}
      {!post.media_url && post.letter_text && (
        <div className="p-5 bg-beige">
          <Icon name="Mail" size={18} className="text-ink/40 mb-2" />
          <p className="font-cormorant text-lg italic text-ink leading-snug line-clamp-8">{post.letter_text}</p>
        </div>
      )}
      {post.caption && (
        <div className="absolute inset-x-0 bottom-0 p-4 pt-10 bg-gradient-to-t from-black/75 to-transparent text-white text-sm leading-snug opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 group-focus-visible:opacity-100 transition-all duration-300">
          {post.caption}
        </div>
      )}
    </button>
  );
}

export function GratitudeMasonry({ posts }: { posts: GratitudePost[] }) {
  const [open, setOpen] = useState<GratitudePost | null>(null);
  return (
    <>
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
        {posts.map(p => <Tile key={p.id} post={p} onOpen={() => setOpen(p)} />)}
      </div>
      <Dialog open={!!open} onOpenChange={o => { if (!o) setOpen(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="font-cormorant text-2xl">{TYPE_LABEL[open.post_type]}</DialogTitle>
                <DialogDescription className="sr-only">Благодарность от наших подопечных</DialogDescription>
              </DialogHeader>
              {open.media_url && <img src={open.media_url} alt={open.caption} className="w-full rounded-xl" />}
              {open.caption && <p className="font-cormorant text-xl italic text-ink">«{open.caption}»</p>}
              {open.letter_text && <p className="text-sm text-ink/80 leading-relaxed whitespace-pre-line">{open.letter_text}</p>}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function GratitudeGallery({ goalId, mine = false, limit, title = "Спасибо вам от наших подопечных" }: { goalId?: number; mine?: boolean; limit?: number; title?: string }) {
  const [posts, setPosts] = useState<GratitudePost[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = mine
      ? cabinetGet<{ posts: GratitudePost[] }>("gratitude_mine")
      : fetch(`${CABINET_URL}?view=gratitude${goalId ? `&goal_id=${goalId}` : ""}`).then(r => r.json());
    load.then(d => setPosts(d.posts || [])).catch(() => {}).finally(() => setLoaded(true));
  }, [goalId, mine]);

  const shown = limit ? posts.slice(0, limit) : posts;
  if (loaded && shown.length === 0) return mine ? <p className="text-sm text-ink/60">Здесь появятся рисунки и письма от тех проектов, которые вы поддержали.</p> : null;
  if (!loaded) return null;

  return (
    <section className={mine ? "" : "py-16 px-4 bg-beige"} aria-label={title}>
      <div className="max-w-6xl mx-auto">
        {!mine && <h2 className="font-cormorant text-4xl font-semibold text-ink text-center mb-10">{title}</h2>}
        <GratitudeMasonry posts={shown} />
      </div>
    </section>
  );
}
