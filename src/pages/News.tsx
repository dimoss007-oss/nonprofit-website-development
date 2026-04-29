import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const VK_NEWS_URL = "https://functions.poehali.dev/10c0920b-0be7-4834-809e-a140a3e3bd74";
const VK_GROUP_URL = "https://vk.com/spasenienadezhdi";
const POSTS_PER_PAGE = 9;

interface Post {
  id: number;
  text: string;
  full_text: string;
  date: string;
  timestamp: number;
  photo: string | null;
  likes: number;
  reposts: number;
  views: number;
  url: string;
}

function PostCard({ post }: { post: Post }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = post.full_text.length > 300;
  const displayText = expanded ? post.full_text : post.text.slice(0, 300) + (isLong ? "..." : "");

  return (
    <article className="group bg-cream flex flex-col hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {post.photo && (
        <div className="overflow-hidden aspect-video">
          <img
            src={post.photo}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-1 rounded-full bg-gold" />
          <span className="text-muted-foreground text-xs font-golos">{post.date}</span>
        </div>

        <p className="text-foreground/80 text-sm leading-relaxed flex-1 whitespace-pre-line">
          {displayText}
        </p>

        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 text-gold text-xs font-semibold hover:text-forest transition-colors self-start"
          >
            {expanded ? "Свернуть ↑" : "Читать полностью →"}
          </button>
        )}

        <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-4 text-muted-foreground text-xs">
            <span className="flex items-center gap-1">
              <Icon name="Heart" size={12} /> {post.likes}
            </span>
            <span className="flex items-center gap-1">
              <Icon name="Repeat2" size={12} /> {post.reposts}
            </span>
            {post.views > 0 && (
              <span className="flex items-center gap-1">
                <Icon name="Eye" size={12} /> {post.views.toLocaleString()}
              </span>
            )}
          </div>
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-forest/60 hover:text-gold transition-colors"
          >
            ВКонтакте <Icon name="ExternalLink" size={11} />
          </a>
        </div>
      </div>
    </article>
  );
}

export default function News() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPosts = async (currentOffset: number, append = false) => {
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      const res = await fetch(`${VK_NEWS_URL}/?count=${POSTS_PER_PAGE}&offset=${currentOffset}`);
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      setPosts((prev) => append ? [...prev, ...data.posts] : data.posts);
      setTotal(data.total);
      setOffset(currentOffset + data.posts.length);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPosts(0);
  }, []);

  const hasMore = offset < total;

  return (
    <div className="min-h-screen bg-cream font-golos">
      {/* Header */}
      <div className="bg-forest relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full border border-cream" />
          <div className="absolute bottom-0 right-20 w-96 h-96 rounded-full border border-cream" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 pt-28">
          <a href="/" className="inline-flex items-center gap-2 text-cream/50 hover:text-cream text-sm mb-8 transition-colors">
            <Icon name="ArrowLeft" size={14} /> На главную
          </a>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-gold/50" />
            <span className="text-gold text-xs tracking-[0.2em] uppercase font-golos">Новости</span>
          </div>
          <h1 className="font-cormorant text-cream text-5xl md:text-7xl font-light leading-tight mb-6">
            Лента<br/><em className="text-gold not-italic font-semibold">ВКонтакте</em>
          </h1>
          <p className="text-cream/60 max-w-md leading-relaxed">
            Актуальные публикации нашей группы{" "}
            <a href={VK_GROUP_URL} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
              vk.com/spasenienadezhdi
            </a>
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-16">

        {loading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-cream-dark animate-pulse">
                <div className="aspect-video bg-forest/10" />
                <div className="p-6 space-y-3">
                  <div className="h-3 bg-forest/10 rounded w-1/4" />
                  <div className="h-4 bg-forest/10 rounded" />
                  <div className="h-4 bg-forest/10 rounded w-4/5" />
                  <div className="h-4 bg-forest/10 rounded w-3/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">🌿</div>
            <p className="font-cormorant text-ink text-2xl mb-2">Не удалось загрузить новости</p>
            <p className="text-muted-foreground text-sm mb-6">{error}</p>
            <button
              onClick={() => fetchPosts(0)}
              className="px-6 py-3 bg-forest text-cream text-sm font-golos uppercase tracking-wide hover:bg-forest-mid transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-20">
            <p className="font-cormorant text-ink text-2xl">Публикаций пока нет</p>
          </div>
        )}

        {!loading && posts.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-8">
              <p className="text-muted-foreground text-sm">{total} публикаций в группе</p>
              <a
                href={VK_GROUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-forest hover:text-gold transition-colors"
              >
                Открыть группу <Icon name="ExternalLink" size={14} />
              </a>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {hasMore && (
              <div className="mt-12 text-center">
                <button
                  onClick={() => fetchPosts(offset, true)}
                  disabled={loadingMore}
                  className="px-10 py-4 bg-forest text-cream font-golos font-semibold text-sm tracking-wide uppercase hover:bg-forest-mid transition-all duration-300 disabled:opacity-50"
                >
                  {loadingMore ? "Загружаю..." : "Загрузить ещё"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
