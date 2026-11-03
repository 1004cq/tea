import LandingNav from "@/components/landing/LandingNav";
import Hero from "@/components/landing/Hero";
import OriginStory from "@/components/landing/OriginStory";
import Features from "@/components/landing/Features";
import BrewingGuide from "@/components/landing/BrewingGuide";
import Collection from "@/components/landing/Collection";
import Philosophy from "@/components/landing/Philosophy";
import LandingFooter from "@/components/landing/LandingFooter";

/**
 * Project structure (landing):
 * app/page.tsx
 * components/landing/
 *   LandingNav.tsx  Hero.tsx  OriginStory.tsx
 *   Features.tsx    BrewingGuide.tsx
 *   Collection.tsx  Philosophy.tsx  LandingFooter.tsx
 *   Motion.tsx
 */
export default function LandingPage() {
  return (
    <div className="landing-root bg-[#1A120B] text-[#F5EFE6]">
      <LandingNav />
      <main>
        <Hero />
        <OriginStory />
        <Features />
        <BrewingGuide />
        <Collection />
        <Philosophy />
      </main>
      <LandingFooter />
    </div>
  );
}
