import { useLang, useTx } from "../i18n";
import {
  GFZ_PAGE,
  KP_WINDOW_DAYS,
  KP_WORDS,
  NOAA_SCALES,
  auroraLatitude,
  kpLabel,
  kpLevel,
  kpWhole,
} from "../data/kp";
import { useKp } from "../data/useKp";
import type { Storm } from "../sim/types";
import { AudioButton } from "./AudioButton";

interface Props {
  storm: Storm;
  /** Show the exact Kp value and time (the "Show me the numbers" setting). */
  showNumbers?: boolean;
}

/**
 * Earth Impact: what the same storm did at home. The real Kp index for the
 * flare's day and the three days after, from GFZ Potsdam, turned into plain
 * words, with a drawing of how far from the pole the auroras reached.
 */
export function EarthImpactCard({ storm, showNumbers }: Props) {
  const tx = useTx();
  const lang = useLang();
  const i = lang === "ms" ? 1 : 0;
  const state = useKp(storm.peakTime);

  // If GFZ cannot be reached, fall back to NASA DONKI's own Kp for this storm
  // (when it has one), and say which source the number came from.
  const fallbackKp = state.status === "error" && storm.gst ? storm.gst.kp : null;
  const kp = state.status === "ok" ? state.reading.maxKp : fallbackKp;

  const heading = (
    <h3 className="card-title earth-title">{tx("Earth Impact", "Kesan pada Bumi")}</h3>
  );

  if (state.status === "loading") {
    return (
      <section className="card earth-card" aria-busy="true">
        {heading}
        <p className="card-body quiet">
          {tx("Asking scientists in Germany what Earth felt...", "Bertanya saintis di Jerman apa yang Bumi rasa...")}
        </p>
      </section>
    );
  }

  if (kp === null) {
    const notYet = state.status === "none";
    return (
      <section className="card earth-card">
        {heading}
        <p className="card-body">
          {notYet
            ? tx(
                "Earth's reading for these days is not ready yet. Scientists publish it after the storm. Try again tomorrow!",
                "Bacaan Bumi untuk hari-hari ini belum siap. Saintis menerbitkannya selepas ribut. Cuba lagi esok!",
              )
            : tx(
                "We could not reach the scientists in Germany just now. Try again in a little while.",
                "Kami tidak dapat menghubungi saintis di Jerman sekarang. Cuba lagi sebentar lagi.",
              )}
        </p>
      </section>
    );
  }

  const whole = kpWhole(kp);
  const { level, g } = kpLevel(kp);
  const words = KP_WORDS[level];
  const reading = state.status === "ok" ? state.reading : null;
  const lead = tx(
    `In the ${KP_WINDOW_DAYS} days after this flare, Earth's magnetic field reached Kp ${whole} out of 9.`,
    `Dalam ${KP_WINDOW_DAYS} hari selepas suar ini, medan magnet Bumi mencapai Kp ${whole} daripada 9.`,
  );
  const spoken = `${words.title[i]}. ${lead} ${words.words[i]}`;

  return (
    <section className={`card earth-card level-${level}`}>
      {heading}
      <div className="earth-layout">
        <EarthAurora kp={kp} />
        <div className="earth-text">
          <p className="earth-kp">
            <span className="earth-kp-number">Kp {whole}</span>
            <span className="earth-kp-title">{words.title[i]}</span>
          </p>
          <KpMeter kp={kp} />
          <p className="card-body">{lead}</p>
          <p className="card-body">{words.words[i]}</p>
          <AudioButton text={spoken} />
        </div>
      </div>

      <p className="earth-source quiet">
        {reading ? (
          <>
            {tx("Real reading from ", "Bacaan sebenar dari ")}
            <a href={GFZ_PAGE} target="_blank" rel="noreferrer noopener">
              GFZ Potsdam, Germany
            </a>
            {tx(" (the official Kp index).", " (indeks Kp rasmi).")}
            {reading.status !== "def" &&
              tx(" Early value: may change a little.", " Nilai awal: mungkin berubah sedikit.")}{" "}
            {showNumbers && (
              <>
                Kp {kpLabel(kp)} ({kp.toFixed(3)}){g > 0 ? `, NOAA G${g}` : ""},{" "}
                {reading.maxTime.replace("T", " ").replace(/:00Z$/, " UTC")}.{" "}
              </>
            )}
            <a href={reading.sourceUrl} target="_blank" rel="noreferrer noopener">
              {tx("Check the number", "Semak nombor")}
            </a>
            {" · "}
            <a href={NOAA_SCALES} target="_blank" rel="noreferrer noopener">
              {tx("What the levels mean (NOAA)", "Maksud tahap (NOAA)")}
            </a>
          </>
        ) : (
          tx(
            "GFZ could not be reached, so this number is NASA DONKI's record for this storm.",
            "GFZ tidak dapat dihubungi, jadi nombor ini ialah rekod NASA DONKI untuk ribut ini.",
          )
        )}
      </p>
      <p className="earth-source quiet">
        {tx(
          "Other activity on the Sun in those days may have added to it.",
          "Aktiviti lain pada Matahari pada hari-hari itu mungkin menambahnya.",
        )}
      </p>
    </section>
  );
}

/** Nine steps, filled up to the reading. Calm, then G1-G2, then G3 and up. */
function KpMeter({ kp }: { kp: number }) {
  const whole = kpWhole(kp);
  return (
    <div className="kp-meter" role="img" aria-label={`Kp ${whole} out of 9`}>
      {Array.from({ length: 9 }, (_, n) => {
        const step = n + 1;
        const tone = step >= 7 ? "high" : step >= 5 ? "mid" : "low";
        return (
          <span
            key={step}
            className={`kp-step ${tone}${step <= whole ? " on" : ""}`}
            style={{ animationDelay: `${n * 70}ms` }}
          >
            {step}
          </span>
        );
      })}
    </div>
  );
}

/**
 * Earth seen from the side, with the aurora ring around the North Pole. The
 * ring sits lower (farther from the pole) when Kp is higher. A drawing, not a
 * map: it shows the idea, not the exact places.
 */
function EarthAurora({ kp }: { kp: number }) {
  const r = 70;
  const cx = 90;
  const cy = 92;
  // Earth is tipped toward us so the North Pole shows. A circle of latitude
  // then looks like an oval around the pole.
  const tip = (35 * Math.PI) / 180;
  const ring = (latDeg: number) => {
    const lat = (latDeg * Math.PI) / 180;
    return {
      y: cy - r * Math.sin(lat) * Math.cos(tip),
      rx: r * Math.cos(lat),
      ry: r * Math.cos(lat) * Math.sin(tip),
    };
  };
  const now = ring(auroraLatitude(kp));
  const calm = ring(auroraLatitude(0));
  const pole = ring(90);
  return (
    <svg className="earth-svg" viewBox="0 0 180 180" role="img" aria-label="Earth with the aurora ring around the North Pole">
      <defs>
        <clipPath id="earth-clip">
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
        <radialGradient id="earth-shade" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#2a5a96" />
          <stop offset="100%" stopColor="#0f2547" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="url(#earth-shade)" />
      <g clipPath="url(#earth-clip)" fill="#3f7a46">
        <path d="M34 92 q14 -20 38 -12 q12 10 0 24 q-10 12 -4 28 q-22 6 -32 -14 q-6 -12 -2 -26z" />
        <path d="M104 86 q26 -8 42 10 q8 18 -10 24 q-12 4 -14 20 q-16 6 -22 -10 q-6 -16 6 -24 q-12 -8 -2 -20z" />
        <path d="M88 150 q14 -4 22 6 q-4 10 -16 10 q-12 -6 -6 -16z" />
      </g>
      {/* Ice at the North Pole */}
      <ellipse cx={cx} cy={pole.y} rx={18} ry={18 * Math.sin(tip)} fill="#e8eef2" opacity="0.9" />
      {/* Where the auroras sit on a calm day */}
      <ellipse
        cx={cx}
        cy={calm.y}
        rx={calm.rx}
        ry={calm.ry}
        fill="none"
        stroke="#f2efea"
        strokeOpacity="0.35"
        strokeDasharray="3 4"
      />
      {/* Where they reached in this storm */}
      <ellipse
        className="aurora-ring"
        cx={cx}
        cy={now.y}
        rx={now.rx}
        ry={now.ry}
        fill="none"
        stroke="#7ee0a1"
        strokeWidth={3 + kp * 0.7}
        strokeOpacity="0.85"
      />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f2efea" strokeOpacity="0.2" />
    </svg>
  );
}
