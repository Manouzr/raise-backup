"use client";

// Scroll « beurre » à la Nexus/taap.it — Lenis interpole la molette pour un
// défilement fluide et lourd. Import dynamique + garde reduced-motion : si Lenis
// échoue ou si l'utilisateur refuse les animations, la page reste 100% utilisable.
import { useEffect } from "react";

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let lenis: { raf: (t: number) => void; destroy: () => void } | null = null;
    let raf = 0;

    import("lenis")
      .then(({ default: Lenis }) => {
        lenis = new Lenis({
          duration: 1.15,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
        });
        const loop = (time: number) => {
          lenis?.raf(time);
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
      })
      .catch(() => {
        /* pas de smooth scroll : le natif prend le relais, aucun impact fonctionnel */
      });

    return () => {
      cancelAnimationFrame(raf);
      lenis?.destroy();
    };
  }, []);

  return <>{children}</>;
}
