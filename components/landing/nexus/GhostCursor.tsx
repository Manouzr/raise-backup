"use client";

// LA SURCOUCHE « taap.it » — un curseur fantôme qui se balade dans le mockup
// comme si un humain était en train de l'utiliser : il glisse d'un élément à
// l'autre, s'arrête, clique (anneau qui se propage), et une étiquette narre son
// geste (« il cherche… », « il repère… », « il tape ! »).
//
// Composant purement visuel : le Hero pilote la position (x, y), l'état de clic
// et la légende via une timeline. `pointer-events:none` pour ne jamais bloquer
// une vraie interaction de l'utilisateur.
import { AnimatePresence, motion } from "motion/react";

export type GhostCursorProps = {
  x: number;
  y: number;
  clicking: boolean;
  caption?: string | null;
  /** clé qui change à chaque clic → relance l'anneau de propagation */
  clickKey?: number;
};

export function GhostCursor({ x, y, clicking, caption, clickKey = 0 }: GhostCursorProps) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute left-0 top-0 z-40 hidden md:block"
      animate={{ x, y, scale: clicking ? 0.82 : 1 }}
      transition={{
        x: { type: "spring", stiffness: 120, damping: 18, mass: 0.9 },
        y: { type: "spring", stiffness: 120, damping: 18, mass: 0.9 },
        scale: { duration: 0.18, ease: "easeOut" },
      }}
      style={{ filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.4))" }}
    >
      {/* anneau de clic qui se propage */}
      <AnimatePresence>
        {clicking && (
          <motion.span
            key={clickKey}
            className="absolute -left-1 -top-1 h-8 w-8 rounded-full"
            style={{ border: "2px solid var(--color-accent-dark)" }}
            initial={{ scale: 0.3, opacity: 0.9 }}
            animate={{ scale: 2.4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>

      {/* flèche du curseur (pointe en haut-gauche) */}
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M5 3l14 7.5-6.1 1.9-2.4 6.2L5 3z"
          fill="#ffffff"
          stroke="#0a0a0c"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>

      {/* étiquette « présence humaine » qui suit le curseur */}
      <AnimatePresence mode="wait">
        {caption && (
          <motion.div
            key={caption}
            initial={{ opacity: 0, y: 4, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.94 }}
            transition={{ duration: 0.22 }}
            className="absolute left-4 top-5 whitespace-nowrap rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-white shadow-[0_6px_18px_rgba(29,167,87,0.45)]"
          >
            {caption}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
