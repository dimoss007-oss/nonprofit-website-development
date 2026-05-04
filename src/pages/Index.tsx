import { useState } from "react";
import { Helmet } from "react-helmet-async";
import HomeHero from "@/components/home/HomeHero";
import HomeAbout from "@/components/home/HomeAbout";
import HomeNews from "@/components/home/HomeNews";
import HomeSupport from "@/components/home/HomeSupport";

export default function Index() {
  const [activeSection, setActiveSection] = useState("главная");

  const scrollTo = (id: string) => {
    if (id.startsWith("/")) { window.location.href = id; return; }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-beige font-golos overflow-x-hidden">
      <Helmet>
        <title>АНО «Спасение надежды» — кризисный центр в Пензе</title>
        <meta name="description" content="Кризисный центр для семей, попавших в трудную жизненную ситуацию. Помощь, поддержка, реабилитация в Пензе." />
        <meta property="og:title" content="АНО «Спасение надежды» — кризисный центр в Пензе" />
        <meta property="og:description" content="Кризисный центр для семей, попавших в трудную жизненную ситуацию. Помощь, поддержка, реабилитация в Пензе." />
        <link rel="canonical" href="https://spasenie58.ru" />
      </Helmet>

      <HomeHero onScrollTo={scrollTo} activeSection={activeSection} setActiveSection={setActiveSection} />

      <HomeNews />

      <HomeAbout />

      <HomeSupport onScrollTo={scrollTo} />

    </div>
  );
}