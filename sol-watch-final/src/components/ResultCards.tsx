import { useT, type T } from "../i18n";
import { DICTS } from "../i18n/strings";
import type { Explanation, Line } from "../sim/explain";

interface Props {
  explanation: Explanation;
}

/** Fill a line, translating any value that is itself a word key. */
export function say(t: T, line: Line): string {
  const vars: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(line.vars ?? {})) {
    vars[k] = typeof v === "string" && v in DICTS.en ? t(v as keyof typeof DICTS.en) : v;
  }
  return t(line.key, vars);
}

/**
 * The result panels — "What happened", "Why", "What it cost", "Next time" —
 * written from what really happened in this mission, plus one real
 * astronaut fact with its NASA source.
 */
export function ResultCards({ explanation: x }: Props) {
  const t = useT();
  return (
    <>
      <div className="result-panels">
        <Card title={t("r.whatHappened")}>{say(t, x.happened)}</Card>
        <Card title={t("r.why")}>{say(t, x.why)}</Card>
        <Card title={t("r.cost")}>{say(t, x.cost)}</Card>
      </div>
      <section className={x.kind === "win" ? "panel result-tip" : "panel result-tip warn"}>
        <h3>{t("r.tip")}</h3>
        <p>{say(t, x.tip)}</p>
      </section>

      <section className="panel panel-raised">
        <h3>{t("r.real")}</h3>
        <p>{t(x.fact.key)}</p>
        <p className="quiet">
          <a href={x.fact.link} target="_blank" rel="noreferrer noopener">
            {t("r.realLink")}
          </a>
        </p>
      </section>
    </>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel result-panel">
      <h3>{title}</h3>
      <p>{children}</p>
    </section>
  );
}
