import { createContext, useContext, useMemo } from "react";
import { DICTS, type Key } from "./strings";

export type Lang = keyof typeof DICTS;
export type { Key };

/** Languages offered in the switcher, in order. */
export const LANGS: { id: Lang; short: string; name: string }[] = [
  { id: "en", short: "EN", name: "English" },
  { id: "ms", short: "BM", name: "Bahasa Melayu" },
];

/** Speech-synthesis voice language for each game language. */
export const SPEECH_LANG: Record<Lang, string> = { en: "en-US", ms: "ms-MY" };

export type T = (key: Key, vars?: Record<string, string | number>) => string;

export function makeT(lang: Lang): T {
  const dict = DICTS[lang] ?? DICTS.en;
  return (key, vars) => {
    let s: string = dict[key] ?? DICTS.en[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    }
    return s;
  };
}

export const LangContext = createContext<Lang>("en");

/** The current language's translate function. */
export function useT(): T {
  const lang = useContext(LangContext);
  return useMemo(() => makeT(lang), [lang]);
}

export function useLang(): Lang {
  return useContext(LangContext);
}

/**
 * For short one-off lines on the smaller screens: pick the text for the
 * current language inline, e.g. tx("Back", "Kembali").
 */
export function useTx(): (en: string, ms: string) => string {
  const lang = useContext(LangContext);
  return (en, ms) => (lang === "ms" ? ms : en);
}
