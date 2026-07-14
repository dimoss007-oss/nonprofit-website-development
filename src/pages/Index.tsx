import { useState } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import HomeHero from "@/components/home/HomeHero";
import HomeAbout from "@/components/home/HomeAbout";
import HomeNews from "@/components/home/HomeNews";
import HomeSupport from "@/components/home/HomeSupport";
import SiteFooter from "@/components/shared/SiteFooter";

export default function Index() {
  const [activeSection, setActiveSection] = useState("главная");

  const scrollTo = (id: string) => {
    if (id.startsWith("/")) { window.location.href = id; return; }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  usePageMeta({
    title: "АНО «Спасение надежды» — кризисный центр в Пензе",
    description: "Кризисный центр для семей, попавших в трудную жизненную ситуацию. Помощь, поддержка, реабилитация в Пензе.",
    ogTitle: "АНО «Спасение надежды» — кризисный центр в Пензе",
    ogDescription: "Кризисный центр для семей, попавших в трудную жизненную ситуацию. Помощь, поддержка, реабилитация в Пензе.",
    canonical: "https://spasenie58.ru",
  });

  return (
    <div className="min-h-screen bg-beige font-golos overflow-x-hidden">

      <HomeHero onScrollTo={scrollTo} activeSection={activeSection} setActiveSection={setActiveSection} />

      <main id="main-content" tabIndex={-1} aria-label="Основное содержимое">
        <HomeNews />
        <HomeAbout />
        <HomeSupport />
      </main>

      <SiteFooter />

    </div>
  );
}