import { useEffect, useRef, useState } from "react";
import glossary from "../content/glossary.json";
import { speak } from "../speech/speak";
import { useLang } from "../i18n";

// Bahasa Melayu meanings for the tappable science words.
const GLOSSARY_MS: Record<keyof typeof glossary, string> = {
  radiation:
    "Zarah kecil yang laju dari Matahari dan angkasa. Sedikit tidak mengapa. Terlalu banyak tidak baik untuk badan.",
  dose: "Berapa banyak radiasi yang sudah dikumpul oleh badan kamu.",
  sol: "Satu hari di Marikh. Ia lebih panjang sedikit daripada sehari di Bumi.",
  flare: "Kilatan gergasi pada Matahari.",
  lifeSupport: "Udara, air, kehangatan dan tanaman yang memastikan kru terus hidup.",
  shielding: "Dinding tebal dan tempat perlindungan ribut yang menghalang radiasi.",
  science: "Rover dan makmal yang membuat penemuan.",
};

type GlossaryKey = keyof typeof glossary;

interface Props {
  term: GlossaryKey;
  children: React.ReactNode;
}

/**
 * A tappable science word. Tapping opens a small panel beside it with the
 * one-line meaning (read aloud too). Closes on Escape or a tap outside.
 */
export function Word({ term, children }: Props) {
  const [open, setOpen] = useState(false);
  const lang = useLang();
  const meaning = lang === "ms" ? GLOSSARY_MS[term] : glossary[term];
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onClick);
    };
  }, [open]);

  return (
    <span className="word" ref={ref}>
      <button
        type="button"
        className="word-button"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) speak(meaning);
        }}
        aria-expanded={open}
      >
        {children}
      </button>
      {open && (
        <span className="word-meaning" role="note">
          {meaning}
        </span>
      )}
    </span>
  );
}
