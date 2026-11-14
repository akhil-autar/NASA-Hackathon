import { useState } from "react";
import { AvatarPicker } from "../avatar/AvatarPicker";
import type { AvatarLook } from "../avatar/look";
import { Bolt } from "../components/Bolt";
import {
  BirthdayPicker,
  birthdayInfo,
  partsFrom,
  type BirthdayParts,
} from "../components/BirthdayPicker";
import { LANGS, useT } from "../i18n";
import type { Profile } from "../storage/profile";
import type { Settings } from "../storage/settings";
import { hasWebGL, load3DSetting, save3DSetting } from "../three/capability";

interface Props {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  profile: Profile;
  onProfile: (p: Profile) => void;
  onBack: () => void;
}

export function SettingsScreen({ settings, onChange, profile, onProfile, onBack }: Props) {
  const t = useT();
  const [graphics, setGraphics] = useState(load3DSetting);
  const [bday, setBday] = useState<BirthdayParts>(() => partsFrom(profile.birthday));
  const [look, setLook] = useState<AvatarLook>(profile.avatar);
  const [savedWhat, setSavedWhat] = useState<"bday" | "avatar" | null>(null);
  const { iso, isFuture } = birthdayInfo(bday);

  const flash = (what: "bday" | "avatar") => {
    setSavedWhat(what);
    window.setTimeout(() => setSavedWhat(null), 1800);
  };

  return (
    <div className="screen">
      <Bolt text={t("settings.bolt")} />

      <section className="panel settings-block">
        <h3>{t("settings.language")}</h3>
        <div className="lang-choice" role="radiogroup" aria-label={t("settings.language")}>
          {LANGS.map((l) => (
            <button
              key={l.id}
              type="button"
              role="radio"
              aria-checked={settings.lang === l.id}
              className={settings.lang === l.id ? "lang-option on" : "lang-option"}
              onClick={() => onChange({ lang: l.id })}
            >
              {l.name}
            </button>
          ))}
        </div>
      </section>

      <Toggle
        label={t("settings.sound")}
        on={settings.soundOn}
        onLabel={t("common.on")}
        offLabel={t("common.off")}
        onToggle={() => onChange({ soundOn: !settings.soundOn })}
      />
      <Toggle
        label={t("settings.numbers")}
        hint={t("settings.numbersHint")}
        on={settings.showNumbers}
        onLabel={t("common.on")}
        offLabel={t("common.off")}
        onToggle={() => onChange({ showNumbers: !settings.showNumbers })}
      />
      {hasWebGL() && (
        <Toggle
          label={t("settings.3d")}
          hint={t("settings.3dHint")}
          on={graphics}
          onLabel={t("common.on")}
          offLabel={t("common.off")}
          onToggle={() => {
            save3DSetting(!graphics);
            setGraphics(!graphics);
          }}
        />
      )}

      <section className="panel settings-block">
        <h3>{t("settings.birthday")}</h3>
        <p className="quiet">{t("settings.birthdayHint")}</p>
        <BirthdayPicker value={bday} onChange={setBday} />
        <button
          type="button"
          className="btn btn-secondary"
          disabled={isFuture}
          onClick={() => {
            onProfile({ ...profile, birthday: iso });
            flash("bday");
          }}
        >
          {savedWhat === "bday" ? t("common.saved") : t("settings.saveBirthday")}
        </button>
      </section>

      <section className="settings-block">
        <h3>{t("settings.avatar")}</h3>
        <AvatarPicker look={look} onChange={setLook} />
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            onProfile({ ...profile, avatar: look });
            flash("avatar");
          }}
        >
          {savedWhat === "avatar" ? t("common.saved") : t("settings.saveAvatar")}
        </button>
      </section>

      <button type="button" className="big-button" onClick={onBack}>
        {t("common.back")}
      </button>
    </div>
  );
}

function Toggle({
  label,
  hint,
  on,
  onLabel,
  offLabel,
  onToggle,
}: {
  label: string;
  hint?: string;
  on: boolean;
  onLabel: string;
  offLabel: string;
  onToggle: () => void;
}) {
  return (
    <button type="button" className="setting-toggle" onClick={onToggle} aria-pressed={on}>
      <span className="setting-text">
        <span>{label}</span>
        {hint && <span className="setting-hint">{hint}</span>}
      </span>
      <span className={on ? "switch on" : "switch"}>{on ? onLabel : offLabel}</span>
    </button>
  );
}
