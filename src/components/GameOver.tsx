import { useEffect } from "react";
import { AvatarFigure } from "../avatar/AvatarFigure";
import type { AvatarLook } from "../avatar/look";
import { useT } from "../i18n";
import type { Explanation } from "../sim/explain";
import { speak } from "../speech/speak";
import { AudioButton } from "./AudioButton";
import { say } from "./ResultCards";

interface Props {
  explanation: Explanation;
  look: AvatarLook;
  onTryAgain: () => void;
  onDetails: () => void;
}

/** Big "GAME OVER" card: the astronaut down, and the one reason why. */
export function GameOver({ explanation: x, look, onTryAgain, onDetails }: Props) {
  const t = useT();
  const name = look.name || t("avatar.defaultName");
  const causeKey =
    x.cause === "caught"
      ? "go.caught"
      : x.cause === "battery"
        ? "go.battery"
        : x.cause === "cold"
          ? "go.cold"
          : "go.radiation";
  const cause = t(causeKey, { name });
  const radiationCause = x.cause === "radiation" || x.cause === "caught";

  useEffect(() => {
    speak(`${t("go.title")}. ${cause}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="game-over" role="alertdialog" aria-labelledby="go-title">
      <div className={radiationCause ? "game-over-card radiation" : "game-over-card cold"}>
        <div className="game-over-figure">
          <AvatarFigure look={look} size={110} pose="down" />
          <span className="game-over-zap" aria-hidden="true" />
        </div>
        <h2 id="go-title" className="game-over-title">
          {t("go.title")}
        </h2>
        <h3>{t("go.how")}</h3>
        <p className="game-over-cause">{cause}</p>
        <AudioButton text={`${t("go.title")}. ${cause}`} />
        <p className="quiet">{say(t, x.why)}</p>
        {radiationCause && (
          <p className="game-over-dose">{t("go.dose", { dose: x.dose, limit: x.limit })}</p>
        )}
        <p>
          <strong>{t("r.tip")}:</strong> {say(t, x.tip)}
        </p>
        <div className="button-row">
          <button type="button" className="btn btn-primary btn-lg" onClick={onTryAgain}>
            {t("go.tryAgain")}
          </button>
          <button type="button" className="btn btn-secondary btn-lg" onClick={onDetails}>
            {t("go.details")}
          </button>
        </div>
      </div>
    </div>
  );
}
