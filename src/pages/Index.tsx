import { useState } from "react";
import HomeHero from "@/components/home/HomeHero";
import HomeAbout from "@/components/home/HomeAbout";
import HomeSupport from "@/components/home/HomeSupport";

export default function Index() {
  const [activeSection, setActiveSection] = useState("главная");

  const scrollTo = (id: string) => {
    if (id.startsWith("/")) { window.location.href = id; return; }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-beige font-golos overflow-x-hidden">

      <HomeHero onScrollTo={scrollTo} activeSection={activeSection} setActiveSection={setActiveSection} />

      <HomeAbout />

      <HomeSupport onScrollTo={scrollTo} />

    </div>
  );
}
