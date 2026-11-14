import { useTx } from "../i18n";
import { useState } from "react";
import { Bolt } from "../components/Bolt";
import featured from "../content/featured-storms.json";
import { nearestStorm, resolveFeatured, stormOnDate } from "../data/archive";
import type { ArchivedStorm } from "../data/archive-types";

interface Props {
  onPlay: (storm: ArchivedStorm) => void;
  onBack: () => void;
}

const now = new Date();
const TODAY = now.toISOString().slice(0, 10);

export function TimeMachineScreen({ onPlay, onBack }: Props) {
  const tx = useTx();
  const [date, setDate] = useState("2017-09-06");
  const [message, setMessage] = useState<string | null>(null);

  const featuredStorms = resolveFeatured(
    featured.slots.map((s) => s.stormId).filter(Boolean),
  );

  const pick = () => {
    const exact = stormOnDate(date);
    if (exact) {
      onPlay(exact);
      return;
    }
    const near = nearestStorm(date);
    if (!near) {
      setMessage(tx("No storm found. Try another date.", "Tiada ribut dijumpai. Cuba tarikh lain."));
      return;
    }
    if (near.daysAway === 0) {
      onPlay(near.storm);
      return;
    }
    setMessage(
      tx(
        `The Sun was calm that day. ${near.daysAway} day${near.daysAway === 1 ? "" : "s"} away, it did this.`,
        `Matahari tenang pada hari itu. ${near.daysAway} hari dari tarikh itu, inilah yang berlaku.`,
      ),
    );
    // Give the child a beat to read, then play the nearest storm.
    window.setTimeout(() => onPlay(near.storm), 1600);
  };

  return (
    <div className="screen">
      <Bolt autoSpeak text={tx("Pick any day. See what the Sun was doing.", "Pilih mana-mana hari. Lihat apa yang Matahari sedang buat.")} />

      {featuredStorms.length > 0 && (
        <div className="featured-row">
          {featuredStorms.map((s) => (
            <button
              key={s.id}
              type="button"
              className="featured-slot"
              onClick={() => onPlay(s)}
            >
              <strong>
                {s.flareClass}
                {s.magnitude}
              </strong>{" "}
              · {s.peakTime.slice(0, 10)}
            </button>
          ))}
        </div>
      )}


      <label className="date-pick">
        <span>{tx("Choose a date", "Pilih tarikh")}</span>
        <input
          type="date"
          value={date}
          min="2010-01-01"
          max={TODAY}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>

      {message && <p className="warn-text">{message}</p>}

      <button type="button" className="big-button go" onClick={pick}>
        {tx("Go to this day", "Pergi ke hari ini")}
      </button>
      <button type="button" className="big-button ghost" onClick={onBack}>
        {tx("Back", "Kembali")}
      </button>
    </div>
  );
}
