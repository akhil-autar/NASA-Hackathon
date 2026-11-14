import { useT, type Key } from "../i18n";
import { AvatarFigure } from "./AvatarFigure";
import {
  EXTRAS,
  EXTRA_LABEL,
  PATCHES,
  PATCH_LABEL,
  SUITS,
  SUIT_IDS,
  SUIT_LABEL,
  VISORS,
  VISOR_IDS,
  VISOR_LABEL,
  randomLook,
  type AvatarLook,
} from "./look";

interface Props {
  look: AvatarLook;
  onChange: (l: AvatarLook) => void;
}

/**
 * A console-style avatar creator: the astronaut in the middle, and one row per
 * part with left/right arrows and colour swatches.
 */
export function AvatarPicker({ look, onChange }: Props) {
  const t = useT();
  const set = (patch: Partial<AvatarLook>) => onChange({ ...look, ...patch });

  return (
    <section className="avatar-picker panel">
      <div className="avatar-stage">
        <AvatarFigure look={look} size={180} pose="wave" />
        <span className="avatar-name-tag">{look.name || t("avatar.defaultName")}</span>
      </div>

      <div className="avatar-rows">
        <label className="name-field avatar-name">
          <span>{t("avatar.name")}</span>
          <input
            type="text"
            value={look.name}
            maxLength={16}
            placeholder={t("avatar.defaultName")}
            onChange={(e) => set({ name: e.target.value })}
          />
        </label>

        <Row
          label={t("avatar.suit")}
          value={t(SUIT_LABEL[look.suit])}
          items={SUIT_IDS}
          current={look.suit}
          onPick={(suit) => set({ suit })}
          swatch={(id) => SUITS[id].color}
          labelOf={(id) => t(SUIT_LABEL[id])}
          prev={t("avatar.prev")}
          next={t("avatar.next")}
        />
        <Row
          label={t("avatar.visor")}
          value={t(VISOR_LABEL[look.visor])}
          items={VISOR_IDS}
          current={look.visor}
          onPick={(visor) => set({ visor })}
          swatch={(id) => VISORS[id]}
          labelOf={(id) => t(VISOR_LABEL[id])}
          prev={t("avatar.prev")}
          next={t("avatar.next")}
        />
        <Row
          label={t("avatar.extra")}
          value={t(EXTRA_LABEL[look.extra])}
          items={EXTRAS}
          current={look.extra}
          onPick={(extra) => set({ extra })}
          labelOf={(id) => t(EXTRA_LABEL[id] as Key)}
          prev={t("avatar.prev")}
          next={t("avatar.next")}
        />
        <Row
          label={t("avatar.patch")}
          value={t(PATCH_LABEL[look.patch])}
          items={PATCHES}
          current={look.patch}
          onPick={(patch) => set({ patch })}
          labelOf={(id) => t(PATCH_LABEL[id] as Key)}
          prev={t("avatar.prev")}
          next={t("avatar.next")}
        />

        <button
          type="button"
          className="btn btn-secondary avatar-random"
          onClick={() => onChange(randomLook(look.name))}
        >
          🎲 {t("avatar.random")}
        </button>
      </div>
    </section>
  );
}

function Row<I extends string>({
  label,
  value,
  items,
  current,
  onPick,
  swatch,
  labelOf,
  prev,
  next,
}: {
  label: string;
  value: string;
  items: readonly I[];
  current: I;
  onPick: (id: I) => void;
  swatch?: (id: I) => string;
  labelOf: (id: I) => string;
  prev: string;
  next: string;
}) {
  const i = Math.max(0, items.indexOf(current));
  const step = (d: number) => onPick(items[(i + d + items.length) % items.length]);
  return (
    <div className="avatar-row">
      <span className="avatar-row-label">{label}</span>
      <div className="avatar-row-control">
        <button type="button" className="avatar-arrow" aria-label={`${prev} ${label}`} onClick={() => step(-1)}>
          ‹
        </button>
        {swatch ? (
          <div className="avatar-swatches" role="radiogroup" aria-label={label}>
            {items.map((id) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={id === current}
                aria-label={labelOf(id)}
                title={labelOf(id)}
                className={id === current ? "avatar-swatch on" : "avatar-swatch"}
                style={{ background: swatch(id) }}
                onClick={() => onPick(id)}
              />
            ))}
          </div>
        ) : (
          <span className="avatar-row-value">{value}</span>
        )}
        <button type="button" className="avatar-arrow" aria-label={`${next} ${label}`} onClick={() => step(1)}>
          ›
        </button>
      </div>
    </div>
  );
}
