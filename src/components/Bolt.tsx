import { useEffect } from "react";
import { speak } from "../speech/speak";

interface Props {
  /** The line Bolt says. */
  text: string;
  /** Say it aloud automatically when it changes. */
  autoSpeak?: boolean;
  /** Optional rich content (e.g. tappable words) shown instead of plain text. */
  children?: React.ReactNode;
}

/** Bolt, the robot guide. Large and friendly; reads its line aloud. */
export function Bolt({ text, autoSpeak, children }: Props) {
  useEffect(() => {
    if (autoSpeak) speak(text);
  }, [text, autoSpeak]);

  return (
    <div className="bolt">
      <div className="bolt-face" aria-hidden="true">
        <div className="bolt-eyes">
          <span className="bolt-eye" />
          <span className="bolt-eye" />
        </div>
      </div>
      <div className="bolt-bubble">
        <p className="bolt-text">{children ?? text}</p>
        <button
          type="button"
          className="bolt-speak"
          onClick={() => speak(text)}
          aria-label="Hear Bolt say this"
        >
          🔊 Hear it
        </button>
      </div>
    </div>
  );
}
