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
    name: "RadLab data (NASA OSDR)",
    drives: "How fast the radiation badge fills. Values are a placeholder until real readings are copied in.",
    link: "https://visualization.osdr.nasa.gov/radlab/",
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

// The radiation constants that are still unverified, for the on-page flag.
const UNVERIFIED = [
  DOSE_RATE_UNSHIELDED,
  SHIELD_LEAKAGE_AT_FULL,
  DOSE_RATE_BACKGROUND,
].filter((c) => c.unverified);

export function DataScreen({ lastStorm, onBack }: Props) {
  const archive = getArchive();
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
        <h3>Unverified numbers</h3>
        <p className="quiet">
          These radiation numbers are placeholders until real RadLab readings
          are pulled in. Badge limit {RADIATION_BADGE_LIMIT.value} (game units).
        </p>
        <ul className="prose-list">
          {UNVERIFIED.map((c, i) => (
            <li key={i}>
              {c.value}
              {c.unit ? ` ${c.unit}` : ""} — UNVERIFIED
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
