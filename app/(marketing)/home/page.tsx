// Landing BidEdge — surcouche « nuit » (style Nexus, couleurs & copy BidEdge).
// Fond presque noir, scroll fluide (Lenis), sections révélées au scroll, et le
// clou du spectacle : un mockup radar vivant survolé par un CURSEUR FANTÔME qui
// se balade tout seul, comme si un humain passait par là (surcouche taap.it).
import { SmoothScroll } from "@/components/landing/nexus/SmoothScroll";
import { Nav } from "@/components/landing/nexus/Nav";
import { Hero } from "@/components/landing/nexus/Hero";
import { Marquee } from "@/components/landing/nexus/Marquee";
import { Bento } from "@/components/landing/nexus/Bento";
import { Cote } from "@/components/landing/nexus/Cote";
import { Pricing } from "@/components/landing/nexus/Pricing";
import { Faq } from "@/components/landing/nexus/Faq";
import { FinalCta } from "@/components/landing/nexus/FinalCta";
import { Footer } from "@/components/landing/nexus/Footer";

export default function LandingPage() {
  return (
    <SmoothScroll>
      {/* grain fin posé au-dessus de toute la page */}
      <div className="noise-overlay" aria-hidden />
      <main className="min-h-screen bg-night font-sans text-white antialiased">
        <Nav />
        <Hero />
        <Marquee />
        <Bento />
        <Cote />
        <Pricing />
        <Faq />
        <FinalCta />
        <Footer />
      </main>
    </SmoothScroll>
  );
}
