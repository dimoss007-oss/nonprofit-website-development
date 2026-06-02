import { useEffect } from "react";

interface PageMeta {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  canonical?: string;
}

function setMeta(name: string, content: string, property = false) {
  const attr = property ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href: string) {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function usePageMeta({ title, description, ogTitle, ogDescription, canonical }: PageMeta) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) setMeta("description", description);
    if (ogTitle) setMeta("og:title", ogTitle, true);
    if (ogDescription) setMeta("og:description", ogDescription, true);
    if (canonical) setCanonical(canonical);
  }, [title, description, ogTitle, ogDescription, canonical]);
}
