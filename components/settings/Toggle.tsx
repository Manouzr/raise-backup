"use client";

// Petit interrupteur pill — copie exacte du prototype (36×21, knob 17px).
// Fond teal quand actif, gris sinon ; le knob glisse en .2s.

type ToggleProps = {
  on: boolean;
  onToggle: () => void;
  /** libellé accessible de la ligne contrôlée */
  label?: string;
};

export function Toggle({ on, onToggle, label }: ToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      onClick={onToggle}
      className="relative h-[21px] w-9 flex-none cursor-pointer rounded-full transition-colors duration-200"
      style={{ background: on ? "#1f6b47" : "#cfc9ba" }}
    >
      <span
        className="absolute top-[2px] h-[17px] w-[17px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.25)] transition-[left] duration-200"
        style={{ left: on ? 17 : 2 }}
      />
    </button>
  );
}
