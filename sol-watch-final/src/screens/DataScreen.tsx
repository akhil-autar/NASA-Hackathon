import {
  DOSE_RATE_BACKGROUND,
  DOSE_RATE_UNSHIELDED,
  RADIATION_BADGE_LIMIT,
  SHIELD_LEAKAGE_AT_FULL,
} from "../data/constants";
import { getArchive } from "../data/archive";
import type { ArchivedStorm } from "../data/archive-types";
import imageCredits from "../content/image-credits.json";
import { TextPage } from "../components/TextPage";
import { TEXTURES } from "../three/assets";

interface Props {
  lastStorm?: ArchivedStorm | null;
  onBack: () => void;
}

const DATASETS = [
  {
    name: "DONKI (NASA space weather database)",
    drives: "Every storm in the game — the real flares, particle events and geomagnetic storms.",
    link: "https://ccmc.gsfc.nasa.gov/DONKI/",
  },
  {
    name: "Curiosity rover radiation detector (RAD)",
    drives: "The everyday radiation on Mars that slowly fills the badge: 0.64 mSv per day, measured at Gale Crater.",
    link: "https://doi.org/10.1126/science.1244797",
  },
  {
    name: "NASA crew radiation standard (NASA-STD-3001)",
    drives: "When the radiation badge is full: NASA's 250 mSv limit for one solar storm.",
    link: "https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf",
  },
  {
    name: "OSDR",
    drives: "'Real astronauts' facts, written by the team with study links.",
    link: "https://osdr.nasa.gov/",
  },
  {
    name: "Mars Trek",
    drives: "The picture of the base site.",
    link: "https://trek.nasa.gov/mars/",
  },
];

// The radiation numbers behind the badge, each with where it comes from.
const RADIATION = [
  { label: "Badge full at", c: RADIATION_BADGE_LIMIT },
  { label: "Everyday dose on Mars", c: DOSE_RATE_BACKGROUND },
  { label: "Storm dose with no shield", c: DOSE_RATE_UNSHIELDED },
  { label: "Let through a full shelter", c: SHIELD_LEAKAGE_AT_FULL },
];

export function DataScreen({ lastStorm, onBack }: Props) {
  const archive = getArchive();

  // Any real textures the team has wired into the 3D scenes (null = the
  // built-in drawing is used). Credits for them live in image-credits.json
  // under a "textures/" file path; show whichever are present.
  const usesTexture = Object.values(TEXTURES).some((t) => t !== null);
  const textureCredits = imageCredits.images.filter((img) =>
    img.file.startsWith("textures/"),
  );

  return (
    <TextPage
      title="Our NASA data"
      headerImage="img/base-site-map.jpg"
      headerAlt="Jezero Crater on Mars, seen from orbit."
      onBack={onBack}
    >
      <p className="quiet">Real NASA research data, not an official forecast.</p>
      <p>The storms are real events NASA recorded. The Mars base is make-believe.</p>

      <ul className="dataset-list">
        {DATASETS.map((d) => (
          <li key={d.name} className="panel">
            <strong>{d.name}</strong>
            <span className="quiet">{d.drives}</span>
            <a href={d.link} target="_blank" rel="noreferrer noopener">
              Data from NASA
            </a>
          </li>
        ))}
      </ul>

      <section className="panel">
        <h3>The 3D scenes</h3>
        <p>
          The Sun, the Mars outpost and the Earth-to-Mars message are drawings
          we made for the game, not photos. We shape and colour them from the
          real storm data so you can see what is happening.
        </p>
        {usesTexture && textureCredits.length > 0 && (
          <>
            <p className="quiet">Some scenes use real NASA images as textures:</p>
            <ul className="prose-list">
              {textureCredits.map((img) => (
                <li key={img.file}>
                  <a href={img.link} target="_blank" rel="noreferrer noopener">
                    {img.title}
                  </a>{" "}
                  — {img.credit}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {lastStorm && (
        <section className="panel">
          <h3>The storm you just played</h3>
          <p>
            {lastStorm.flareClass}
            {lastStorm.magnitude} flare, {lastStorm.peakTime.slice(0, 10)}.
            <br />
            Event id: {lastStorm.id}
            <br />
            <a href={lastStorm.link} target="_blank" rel="noreferrer noopener">
              DONKI record
            </a>
          </p>
        </section>
      )}

      <section className="panel panel-raised">
        <h3>The radiation numbers</h3>
        <p className="quiet">
          The radiation badge counts real units (mSv). Real NASA numbers are
          linked; the rest are game estimates and say so.
        </p>
        <ul className="prose-list">
          {RADIATION.map(({ label, c }) => (
            <li key={label}>
              {label}: {c.unit === undefined ? `${Math.round(c.value * 100)}%` : `${c.value} ${c.unit}`}
              {" — "}
              {c.source.startsWith("http") ? (
                <a href={c.source} target="_blank" rel="noreferrer noopener">
                  NASA source
                </a>
              ) : (
                "game estimate"
              )}
              {c.note ? <span className="quiet"> ({c.note})</span> : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h3>Image credits</h3>
        <ul className="prose-list">
          {imageCredits.images.map((img) => (
            <li key={img.nasaId}>
              <a href={img.link} target="_blank" rel="noreferrer noopener">
                {img.title}
              </a>{" "}
              — {img.credit}
            </li>
          ))}
        </ul>
      </section>

      <p className="quiet">
        Storm archive: {archive.storms.length} real flares, {archive.from} to{" "}
        {archive.to}. No NASA logo is used.
      </p>
    </TextPage>
  );
}
