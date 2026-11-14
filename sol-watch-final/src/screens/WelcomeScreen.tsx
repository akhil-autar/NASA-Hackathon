import { useState } from "react";
import { AvatarPicker } from "../avatar/AvatarPicker";
import { DEFAULT_LOOK, type AvatarLook } from "../avatar/look";
import { Bolt } from "../components/Bolt";
import {
  BirthdayPicker,
  birthdayInfo,
  partsFrom,
  type BirthdayParts,
} from "../components/BirthdayPicker";
import crew from "../content/crew.json";
import { useT, type Key } from "../i18n";
import type { CrewNames, Profile } from "../storage/profile";

interface Props {
  onDone: (p: Profile) => void;
  onSkip: () => void;
}

export function WelcomeScreen({ onDone, onSkip }: Props) {
  const t = useT();
  const [bday, setBday] = useState<BirthdayParts>(() => partsFrom(null));
  const [look, setLook] = useState<AvatarLook>(DEFAULT_LOOK);
  const [crewOpen, setCrewOpen] = useState(false);
  const [names, setNames] = useState<CrewNames>({
    doctor: crew.doctor.defaultName,
    engineer: crew.engineer.defaultName,
    scientist: crew.scientist.defaultName,
  });
  const { iso, isFuture } = birthdayInfo(bday);

  const finish = () =>
    onDone({ birthday: iso, crew: names, onboarded: true, avatar: look });

  return (
    <div className="screen welcome">
      <Bolt autoSpeak text={t("welcome.avatar")} />
      <AvatarPicker look={look} onChange={setLook} />

      <Bolt text={t("welcome.hello")} />
      <BirthdayPicker value={bday} onChange={setBday} />

      <button
        type="button"
        className="topbar-link crew-toggle"
        aria-expanded={crewOpen}
        onClick={() => setCrewOpen((o) => !o)}
      >
        {crewOpen ? "▾" : "▸"} {t("welcome.crewToggle")}
      </button>
      {crewOpen && (
        <>
          <p className="quiet">{t("welcome.crew")}</p>
          <div className="name-fields">
            {(["doctor", "engineer", "scientist"] as const).map((role) => (
              <label key={role} className="name-field">
                <span>{t(`role.${role}` as Key)}</span>
                <input
                  type="text"
                  value={names[role]}
                  maxLength={16}
                  onChange={(e) => setNames({ ...names, [role]: e.target.value })}
                />
              </label>
            ))}
          </div>
        </>
      )}

      <button type="button" className="big-button go" disabled={isFuture} onClick={finish}>
        {t("common.start")}
      </button>
      <button type="button" className="big-button ghost" onClick={onSkip}>
        {t("common.skip")}
      </button>

      <p className="parent-note">{t("welcome.privacy")}</p>
    </div>
  );
}
