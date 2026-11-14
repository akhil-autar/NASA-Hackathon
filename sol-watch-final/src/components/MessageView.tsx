import { useTx } from "../i18n";
import { lazy } from "react";
import { SceneFrame } from "../three/SceneFrame";

const MessageCanvas = lazy(() => import("../three/MessageCanvas"));

interface Props {
  /** 0 = the message is at Earth, 1 = it has reached Mars. */
  progress?: number;
  /** Loop on its own instead of following `progress`. */
  loopSeconds?: number;
  className?: string;
}

/** A message travelling from Earth to Mars. */
export function MessageView({ progress, loopSeconds, className }: Props) {
  const tx = useTx();
  const pct = Math.round((progress ?? 0) * 100);
  return (
    <SceneFrame
      still="img/mars-backdrop.jpg"
      alt="Earth and Mars with a message travelling between them."
      description={
        loopSeconds
          ? "A message is travelling from Earth to Mars."
          : `The message from Earth is ${pct} percent of the way to Mars.`
      }
      className={className ? `message-view ${className}` : "message-view"}
      render={(active) => (
        <MessageCanvas progress={progress} loopSeconds={loopSeconds} active={active} />
      )}
    >
      <span className="message-end message-end-earth">{tx("Earth", "Bumi")}</span>
      <span className="message-end message-end-mars">{tx("Mars", "Marikh")}</span>
    </SceneFrame>
  );
}
