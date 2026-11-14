import { Bolt } from "../components/Bolt";
import { useT } from "../i18n";

export type MissionKind = "dust" | "water" | "call";

interface Props {
  onPick: (kind: MissionKind) => void;
  onBack: () => void;
}

export function MissionsMenuScreen({ onPick, onBack }: Props) {
  const t = useT();
  return (
    <div className="screen">
      <Bolt text={t("menu.bolt")} />
      <div className="dash-grid">
        <button type="button" className="dash-card" onClick={() => onPick("dust")}>{t("menu.dust")}
        </button>
        <button type="button" className="dash-card" onClick={() => onPick("water")}>{t("menu.water")}
        </button>
        <button type="button" className="dash-card" onClick={() => onPick("call")}>{t("menu.call")}
        </button>
      </div>
      <button type="button" className="big-button ghost" onClick={onBack}>
        {t("common.back")}
      </button>
    </div>
  );
}
