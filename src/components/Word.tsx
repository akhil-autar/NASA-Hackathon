import { useState } from "react";
import glossary from "../content/glossary.json";
import { speak } from "../speech/speak";

type GlossaryKey = keyof typeof glossary;

interface Props {
  term: GlossaryKey;
  children: React.ReactNode;
}

/**
 * A tappable science word. Tapping shows its one-line meaning and reads it
 * aloud. Touch target is kept large for small fingers.
 */
export function Word({ term, children }: Props) {
  const [open, setOpen] = useState(false);
  const meaning = glossary[term];

  return (
    <span className="word">
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
