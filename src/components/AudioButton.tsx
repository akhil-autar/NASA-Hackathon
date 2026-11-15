import { speak, stopSpeech, useSpeaking } from "../speech/speak";
import { useTx } from "../i18n";
import { Icon } from "./Icon";

interface Props {
  /** The words this button reads aloud. */
  text: string;
  className?: string;
}

/**
 * One button for every piece of spoken text: "Hear it" when Bolt is quiet,
 * "Stop" while Bolt is talking.
 */
export function AudioButton({ text, className }: Props) {
  const speaking = useSpeaking();
  const tx = useTx();
  return (
    <button
      type="button"
      className={`btn btn-secondary audio-button${speaking ? " is-speaking" : ""}${className ? ` ${className}` : ""}`}
      onClick={() => (speaking ? stopSpeech() : speak(text))}
      aria-label={
        speaking
          ? tx("Stop Bolt talking", "Hentikan Bolt bercakap")
          : tx("Hear Bolt say this", "Dengar Bolt sebut ini")
      }
    >
      <Icon name={speaking ? "stop" : "replay"} />
      {speaking ? tx("Stop", "Berhenti") : tx("Hear it", "Dengar")}
    </button>
  );
}
