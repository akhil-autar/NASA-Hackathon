import { useTx } from "../i18n";
import { useEffect, useRef, useState } from "react";
import { Bolt } from "../components/Bolt";
import { MessageView } from "../components/MessageView";
import { Stars } from "../components/Stars";
import { scoreCall, type CallResult } from "../sim/other-missions";

interface Props {
  onBack: () => void;
}

// Earth's answer takes this long to arrive (seconds), standing in for the real
// message delay the game shortens.
const ANSWER_SECONDS = 6;

export function CallToEarthScreen({ onBack }: Props) {
  const tx = useTx();
  const [holding, setHolding] = useState(false);
  const [waited, setWaited] = useState(0);
  const [result, setResult] = useState<CallResult | null>(null);
  const tick = useRef<number | null>(null);

  // Air drains while holding.
  useEffect(() => {
    if (!holding) return;
    tick.current = window.setInterval(() => {
      setWaited((w) => {
        const next = w + 0.2;
        if (next >= ANSWER_SECONDS) {
          if (tick.current) window.clearInterval(tick.current);
          setHolding(false);
          setResult(scoreCall(next, ANSWER_SECONDS, true));
        }
        return next;
      });
    }, 200);
    return () => {
      if (tick.current) window.clearInterval(tick.current);
    };
  }, [holding]);

  const letGo = () => {
    if (result) return;
    setHolding(false);
    if (tick.current) window.clearInterval(tick.current);
    // Acting now is a 50/50 guess, seeded by when they let go.
    const guessRight = Math.floor(waited * 10) % 2 === 0;
    setResult(scoreCall(waited, ANSWER_SECONDS, guessRight));
  };

  if (result) {
    return (
      <div className="screen">
        <Stars count={result.stars} />
        <section className="card">
          <h3 className="card-title">
            {result.success ? tx("Leak fixed!", "Kebocoran sudah dibaiki!") : tx("The fix didn't hold", "Pembaikan tidak bertahan")}
          </h3>
          <p className="card-body">
            {tx("Air left", "Udara tinggal")}: {Math.round(result.airLeft)}%.{" "}
            {result.guessedRight
              ? tx("You chose well.", "Pilihan kamu bagus.")
              : tx("The guess was wrong, but everyone is safe.", "Tekaan itu salah, tetapi semua orang selamat.")}
          </p>
        </section>
        <button type="button" className="big-button" onClick={onBack}>
          {tx("Back", "Kembali")}
        </button>
      </div>
    );
  }

  const airLeft = Math.max(0, 100 - waited * 9);

  return (
    <div className="screen">
      <Bolt
        autoSpeak
        text={tx(
          "The air is leaking! Hold the button to wait for Earth's answer, or let go to fix it now on a guess.",
          "Udara sedang bocor! Tekan dan tahan butang untuk menunggu jawapan dari Bumi, atau lepaskan untuk membaikinya sekarang dengan meneka.",
        )}
      />
      <MessageView progress={waited / ANSWER_SECONDS} className="call-scene" />
      <div className="gauge">
        <span className="gauge-label">{tx("Air", "Udara")} — {Math.round(airLeft)}%</span>
        <span className="gauge-bar">
          <span
            className="gauge-fill warn"
            style={{ width: `${airLeft}%` }}
          />
        </span>
      </div>
      <button
        type="button"
        className="big-button go hold-button"
        onPointerDown={() => setHolding(true)}
        onPointerUp={letGo}
        onPointerLeave={() => holding && letGo()}
      >
        {holding ? tx("Waiting for Earth...", "Menunggu Bumi...") : tx("Hold to wait for Earth", "Tahan untuk menunggu Bumi")}
      </button>
      <p className="source-note">
        {tx("Let go any time to fix it yourself — but that's a guess.", "Lepaskan bila-bila masa untuk membaikinya sendiri — tetapi itu satu tekaan.")}
      </p>
      <button type="button" className="big-button ghost" onClick={onBack}>
        {tx("Back", "Kembali")}
      </button>
    </div>
  );
}
