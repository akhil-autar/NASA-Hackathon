import { useTx } from "../i18n";
import { Bolt } from "../components/Bolt";
import type { ArchivedStorm } from "../data/archive-types";
import { useToday } from "../data/useToday";

interface Props {
  onPlay: (storm: ArchivedStorm, live: boolean) => void;
  onBack: () => void;
}

export function TodayScreen({ onPlay, onBack }: Props) {
  const tx = useTx();
  const { data, status } = useToday();

  // Loading: still waiting for NASA's answer.
  if (status === "loading" || !data) {
    return (
      <div className="screen">
        <Bolt text={tx("Asking NASA what the Sun is doing...", "Sedang bertanya NASA apa yang Matahari sedang buat...")} />
        <p className="quiet" role="status">
          {tx("Loading today's storm.", "Memuatkan ribut hari ini.")}
        </p>
      </div>
    );
  }

  // Offline / error, and no storm at all to fall back to.
  if (!data.storm) {
    return (
      <div className="screen">
        <Bolt text={tx("No storm to show right now. Try the Time Machine.", "Tiada ribut untuk ditunjukkan sekarang. Cuba Mesin Masa.")} />
        {status === "error" && (
          <p className="quiet offline-note" role="status">
            {tx("NASA's data could not be reached. Showing an archived storm.", "Data NASA tidak dapat dicapai. Menunjukkan ribut daripada arkib.")}
          </p>
        )}
        <button type="button" className="big-button" onClick={onBack}>
          {tx("Back", "Kembali")}
        </button>
      </div>
    );
  }

  const s = data.storm;
  let line: string;
  if (data.live && data.daysAgo === 0) {
    line = tx("This is today's real storm from the Sun.", "Inilah ribut sebenar dari Matahari hari ini.");
  } else if (data.quiet) {
    line = tx(
      `The Sun is quiet today. Here is the last real storm, ${data.daysAgo} day${data.daysAgo === 1 ? "" : "s"} ago.`,
      `Matahari tenang hari ini. Inilah ribut sebenar yang terakhir, ${data.daysAgo} hari yang lalu.`,
    );
  } else {
    line = tx(
      `The newest real storm, ${data.daysAgo} day${data.daysAgo === 1 ? "" : "s"} ago.`,
      `Ribut sebenar yang terbaru, ${data.daysAgo} hari yang lalu.`,
    );
  }

  return (
    <div className="screen">
      <Bolt autoSpeak text={line} />

      {status === "error" && (
        <p className="quiet offline-note" role="status">
          {tx("NASA's data could not be reached. Showing an archived storm.", "Data NASA tidak dapat dicapai. Menunjukkan ribut daripada arkib.")}
        </p>
      )}

      <section className="card">
        <h3 className="card-title">
          {s.flareClass}
          {s.magnitude} {tx("flare", "nyalaan")} {!data.live && <span className="archived-tag">{tx("archived", "arkib")}</span>}
        </h3>
        <p className="card-body">
          {s.peakTime.slice(0, 10)}
          {s.gst ? tx(` · hit Earth at Kp ${Math.round(s.gst.kp)}`, ` · melanda Bumi pada Kp ${Math.round(s.gst.kp)}`) : ""}
        </p>
        <p className="card-body source-note">{data.source}</p>
      </section>

      <button
        type="button"
        className="big-button go"
        onClick={() => onPlay(s, data.live)}
      >
        {tx("Fly this mission", "Terbangkan misi ini")}
      </button>
      <button type="button" className="big-button ghost" onClick={onBack}>
        {tx("Back", "Kembali")}
      </button>
    </div>
  );
}
