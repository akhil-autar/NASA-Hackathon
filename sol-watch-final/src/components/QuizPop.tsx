import { useEffect, useState } from "react";
import type { QuizQuestion } from "../content/quiz";
import { useLang, useTx } from "../i18n";
import { speak } from "../speech/speak";

interface Props {
  question: QuizQuestion;
  onDone: (correct: boolean) => void;
}

/** Bolt's quick question during a calm moment. The clock waits while it is open. */
export function QuizPop({ question, onDone }: Props) {
  const lang = useLang();
  const tx = useTx();
  const [picked, setPicked] = useState<number | null>(null);
  const right = picked === question.answer;

  useEffect(() => {
    speak(`${tx("Quick question!", "Soalan pantas!")} ${question.q[lang]}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const ok = i === question.answer;
    speak(`${ok ? tx("Yes! Brain star!", "Ya! Bintang otak!") : tx("Good try!", "Cubaan yang bagus!")} ${question.why[lang]}`);
  };

  return (
    <div className="quiz-pop panel" role="dialog" aria-labelledby="quiz-q">
      <span className="quiz-pop-tag">🤖 {tx("Bolt's quick question", "Soalan pantas Bolt")}</span>
      <h3 id="quiz-q">{question.q[lang]}</h3>
      <div className="quiz-options">
        {question.options.map((o, i) => {
          const state =
            picked === null ? "" : i === question.answer ? " right" : i === picked ? " wrong" : " dim";
          return (
            <button
              key={i}
              type="button"
              className={`quiz-option${state}`}
              onClick={() => pick(i)}
              disabled={picked !== null}
            >
              <span className="quiz-icon" aria-hidden="true">
                {o.icon}
              </span>
              {o.text[lang]}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <>
          <p className={right ? "quiz-verdict right" : "quiz-verdict"}>
            {right ? tx("🧠 Yes! You earned a brain star!", "🧠 Ya! Kamu dapat bintang otak!") : tx("Good try!", "Cubaan yang bagus!")}{" "}
            {question.why[lang]}
          </p>
          <button type="button" className="btn btn-primary" onClick={() => onDone(right)}>
            {tx("Back to the mission", "Kembali ke misi")}
          </button>
        </>
      )}
    </div>
  );
}
