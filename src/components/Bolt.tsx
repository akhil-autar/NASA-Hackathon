import { useEffect, useRef, useState } from "react";
import { speak, speakQueued, useSpeaking } from "../speech/speak";
import { AudioButton } from "./AudioButton";

export type BoltExpression = "happy" | "thinking" | "worried" | "asleep";

interface Props {
  /** The line Bolt says. */
  text: string;
  /** Say it aloud automatically when it changes. */
  autoSpeak?: boolean;
  /**
   * Wait for Bolt to finish the current line instead of cutting it off.
   * Use for background updates (the mission clock), not for new screens.
   */
  queue?: boolean;
  /** Bolt's face state. */
  expression?: BoltExpression;
  /** Optional rich content (e.g. tappable words) shown instead of plain text. */
  children?: React.ReactNode;
}

/** Bolt, the robot guide: an SVG face that blinks, speaks, and has moods. */
export function Bolt({
  text,
  autoSpeak,
  queue,
  expression = "happy",
  children,
}: Props) {
  const [blink, setBlink] = useState(false);
  const speaking = useSpeaking();
  const [mouthOpen, setMouthOpen] = useState(false);
  const asleep = expression === "asleep";

  // Speak the line when it changes.
  useEffect(() => {
    if (!autoSpeak || asleep) return;
    if (queue) speakQueued(text);
    else speak(text);
  }, [text, autoSpeak, asleep, queue]);

  // Blink on an interval (not while asleep).
  useEffect(() => {
    if (asleep) return;
    const id = window.setInterval(() => {
      setBlink(true);
      window.setTimeout(() => setBlink(false), 140);
    }, 3800);
    return () => window.clearInterval(id);
  }, [asleep]);

  // The mouth moves while Bolt talks.
  const mouthTimer = useRef<number | null>(null);
  useEffect(() => {
    if (!speaking) {
      setMouthOpen(false);
      if (mouthTimer.current) window.clearInterval(mouthTimer.current);
      return;
    }
    mouthTimer.current = window.setInterval(() => setMouthOpen((o) => !o), 180);
    return () => {
      if (mouthTimer.current) window.clearInterval(mouthTimer.current);
    };
  }, [speaking]);

  return (
    <div className="bolt">
      <BoltFace
        expression={expression}
        blink={blink}
        mouthOpen={mouthOpen && !asleep}
      />
      <div className="bolt-bubble">
        <p className="bolt-text">{children ?? text}</p>
        {!asleep && <AudioButton text={text} className="bolt-speak" />}
      </div>
    </div>
  );
}

function BoltFace({
  expression,
  blink,
  mouthOpen,
}: {
  expression: BoltExpression;
  blink: boolean;
  mouthOpen: boolean;
}) {
  const eyeRy = blink || expression === "asleep" ? 0.8 : 6;

  // Brow / mouth shapes per expression.
  const mouth =
    expression === "asleep"
      ? "M26 45 h12"
      : expression === "worried"
        ? "M26 48 q6 -6 12 0"
        : expression === "thinking"
          ? "M27 46 h10"
          : mouthOpen
            ? "M26 43 q6 8 12 0 q-6 4 -12 0"
            : "M26 44 q6 6 12 0"; // happy closed smile

  return (
    <svg
      className="bolt-face-svg"
      viewBox="0 0 64 64"
      role="img"
      aria-label={`Bolt looks ${expression}`}
    >
      {/* head */}
      <rect x="6" y="8" width="52" height="48" rx="14" fill="var(--surface-raised)" />
      <rect
        x="6"
        y="8"
        width="52"
        height="48"
        rx="14"
        fill="none"
        stroke="var(--shielding)"
        strokeWidth="2"
      />
      {/* antenna */}
      <line x1="32" y1="8" x2="32" y2="2" stroke="var(--shielding)" strokeWidth="2" />
      <circle cx="32" cy="2" r="2" fill="var(--accent)" />
      {/* eyes */}
      <ellipse cx="24" cy="28" rx="5" ry={eyeRy} fill="var(--ink)" />
      <ellipse cx="40" cy="28" rx="5" ry={eyeRy} fill="var(--ink)" />
      {/* thinking brow */}
      {expression === "thinking" && (
        <line x1="36" y1="20" x2="44" y2="18" stroke="var(--ink)" strokeWidth="2" />
      )}
      {expression === "worried" && (
        <>
          <line x1="20" y1="20" x2="27" y2="22" stroke="var(--ink)" strokeWidth="2" />
          <line x1="44" y1="20" x2="37" y2="22" stroke="var(--ink)" strokeWidth="2" />
        </>
      )}
      {/* asleep "z" */}
      {expression === "asleep" && (
        <text x="46" y="20" fontSize="10" fill="var(--ink-quiet)">
          z
        </text>
      )}
      {/* mouth */}
      <path d={mouth} fill="none" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
