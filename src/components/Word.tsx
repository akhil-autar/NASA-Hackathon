import { useEffect, useRef, useState } from "react";
import glossary from "../content/glossary.json";
import { speak } from "../speech/speak";

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
  const meaning = glossary[term];
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
