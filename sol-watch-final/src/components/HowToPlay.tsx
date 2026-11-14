import { useEffect, useState } from "react";
import { useTx } from "../i18n";
import { speak } from "../speech/speak";

interface Props {
  onDone: () => void;
}

/** A 4-picture guide, read aloud by Bolt, before the first mission (and from the ? button). */
export function HowToPlay({ onDone }: Props) {
  const tx = useTx();
  const [i, setI] = useState(0);

  const cards = [
    {
      art: "☀️ 💥 ➡️ 🔴",
      title: tx("The Sun sends storms", "Matahari menghantar ribut"),
      text: tx(
        "Sometimes the Sun flashes and throws tiny, fast particles into space. These storms really happened. NASA wrote them down.",
        "Kadang-kadang Matahari berkilat dan melontarkan zarah kecil yang laju ke angkasa. Ribut ini benar-benar berlaku. NASA mencatatnya.",
      ),
    },
    {
      art: "🧑‍🚀 🏠 🔴",
      title: tx("You are the commander", "Kamu ialah komander"),
      text: tx(
        "You look after a base on Mars and three crew friends. A storm is coming. Get ready!",
        "Kamu menjaga sebuah pangkalan di Marikh dan tiga rakan kru. Ribut akan datang. Bersedia!",
      ),
    },
    {
      art: "⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡",
      title: tx("Share 10 power cubes", "Bahagikan 10 kiub kuasa"),
      text: tx(
        "🌱 Air & warmth keeps the crew warm. 🛡️ The shelter blocks the storm. 🔬 Science makes discoveries. More for one job means less for the others!",
        "🌱 Udara & kehangatan memastikan kru hangat. 🛡️ Tempat perlindungan menghalang ribut. 🔬 Sains membuat penemuan. Lebih untuk satu tugas bermaksud kurang untuk yang lain!",
      ),
    },
    {
      art: "🌡️ ☢️ 🔬 = ⭐⭐⭐",
      title: tx("How to get 3 stars", "Cara dapat 3 bintang"),
      text: tx(
        "Keep the crew warm, keep radiation under NASA's line, and finish the science. The Sun only charges the battery in the day, so save power for the night!",
        "Pastikan kru hangat, radiasi di bawah garisan NASA, dan siapkan sains. Matahari hanya mengecas bateri pada waktu siang, jadi simpan kuasa untuk malam!",
      ),
    },
  ];
  const card = cards[i];
  const last = i === cards.length - 1;

  useEffect(() => {
    speak(`${card.title}. ${card.text}`);
  }, [card.title, card.text]);

  return (
    <div className="howto" role="dialog" aria-modal="true" aria-labelledby="howto-title">
      <div className="howto-card panel">
        <div className="howto-art" aria-hidden="true">
          {card.art}
        </div>
        <h2 id="howto-title">{card.title}</h2>
        <p>{card.text}</p>
        <div className="howto-dots" aria-hidden="true">
          {cards.map((_, j) => (
            <span key={j} className={j === i ? "on" : ""} />
          ))}
        </div>
        <div className="button-row">
          {i > 0 && (
            <button type="button" className="btn btn-secondary" onClick={() => setI(i - 1)}>
              {tx("Back", "Kembali")}
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={() => (last ? onDone() : setI(i + 1))}
          >
            {last ? tx("Let's go! 🚀", "Jom mula! 🚀") : tx("Next", "Seterusnya")}
          </button>
          {!last && (
            <button type="button" className="topbar-link" onClick={onDone}>
              {tx("Skip", "Langkau")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const SEEN_KEY = "solwatch:howtoSeen";
export function howToSeen(): boolean {
  try {
    return window.localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}
export function markHowToSeen(): void {
  try {
    window.localStorage.setItem(SEEN_KEY, "1");
  } catch {
    // ignore
  }
}
