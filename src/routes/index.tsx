import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/site/Nav";
import { Hero } from "@/components/site/Hero";
import { Stats } from "@/components/site/Stats";
import { WhoWeAre } from "@/components/site/WhoWeAre";
import { MissionVision } from "@/components/site/MissionVision";
import { WhatWeDo } from "@/components/site/WhatWeDo";
import { Impact } from "@/components/site/Impact";
import { Testimonials } from "@/components/site/Testimonials";
import { Programs } from "@/components/site/Programs";
import { Community } from "@/components/site/Community";
import { FinalCTA } from "@/components/site/FinalCTA";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <main className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Nav />
      <Hero />
      <Stats />
      <WhoWeAre />
      <MissionVision />
      <WhatWeDo />
      <Impact />
      <Testimonials />
      <Programs />
      <Community />
      <FinalCTA />
      <Footer />
    </main>
  );
}
