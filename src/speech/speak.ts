// Bolt's voice: a small speech queue over the browser's speech synthesis.
//
// Fixes for the problems the team found:
//  - Emojis and symbols are never read aloud (they are stripped before speaking).
//  - Lines are split into sentences and spoken one after another. Chrome stops
//    long lines part-way through, and short pieces avoid that.
//  - Two kinds of line:
//      speak(text)        a new screen or something the child tapped. It
//                         replaces whatever is playing.
//      speakQueued(text)  a background update. It waits for the current line
//                         to finish, so it never cuts Bolt off. Only the newest
//                         waiting line is kept, so Bolt never falls far behind.
//  - holdSpeech(): while a pop-up (how to play, quick question) is open, other
//    screens' lines are held back so they cannot talk over it.
//  - stopSpeech() stops everything; useSpeaking() lets any screen show a Stop
//    button while Bolt is talking.
//
// Respects the sound on/off setting. Fails quietly if speech is unavailable.

import { useSyncExternalStore } from "react";

let soundOn = true;
let voiceLang = "en-US";

/** Sentences still to say for the current line. */
let queue: string[] = [];
/** A background line waiting for the current one to finish. */
let pending: string | null = null;
/** True when the waiting line belongs to the open pop-up, so a hold lets it through. */
let pendingOverHold = false;
/** The full text of the line being spoken (to skip exact repeats). */
let currentLine: string | null = null;
/** Keep a reference so the browser does not drop the utterance mid-line. */
const keepAlive: SpeechSynthesisUtterance[] = [];
let startTimer: number | null = null;
let watchdog: number | null = null;
let generation = 0;
let holds = 0;

// --- Who is listening (for Stop buttons and Bolt's moving mouth) ---
let active = false;
const listeners = new Set<() => void>();
function setActive(on: boolean) {
  if (active === on) return;
  active = on;
  listeners.forEach((l) => l());
}

function synth(): SpeechSynthesis | null {
  try {
    return typeof window !== "undefined" ? (window.speechSynthesis ?? null) : null;
  } catch {
    return null;
  }
}

// Emoji, pictographs, arrows and the joiners that glue them together.
const EMOJI =
  /[\p{Extended_Pictographic}\p{Regional_Indicator}\u{FE0F}\u{FE0E}\u{200D}\u{20E3}\u{1F3FB}-\u{1F3FF}\u{2190}-\u{21FF}\u{2B05}-\u{2B07}\u{25A0}-\u{25FF}]/gu;

/** The words Bolt will actually say: no emojis or symbols, tidy spacing. */
export function cleanForSpeech(text: string): string {
  return text
    .replace(EMOJI, " ")
    .replace(/&/g, " and ")
    .replace(/\s+([.,!?;:])/g, "$1")
    .replace(/([.!?])\s*[.!?]+/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Split into sentences, and break any very long sentence at a comma. */
export function splitForSpeech(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) ?? [text];
  const out: string[] = [];
  for (const raw of sentences) {
    const s = raw.trim();
    if (!s) continue;
    if (s.length <= 180) {
      out.push(s);
      continue;
    }
    let rest = s;
    while (rest.length > 180) {
      const cut = rest.lastIndexOf(",", 180);
      const at = cut > 40 ? cut + 1 : 180;
      out.push(rest.slice(0, at).trim());
      rest = rest.slice(at).trim();
    }
    if (rest) out.push(rest);
  }
  return out;
}

function pickVoice(s: SpeechSynthesis): SpeechSynthesisVoice | undefined {
  const want = voiceLang.slice(0, 2).toLowerCase();
  return s
    .getVoices()
    .find((v) => v.lang.replace("_", "-").toLowerCase().startsWith(want));
}

function clearTimers() {
  if (startTimer !== null) window.clearTimeout(startTimer);
  if (watchdog !== null) window.clearInterval(watchdog);
  startTimer = null;
  watchdog = null;
}

/** Say the next sentence, or move on to the waiting line, or finish. */
function next(gen: number) {
  if (gen !== generation) return;
  const s = synth();
  if (!s) return finish();
  const part = queue.shift();
  if (part === undefined) {
    if (pending !== null && (holds === 0 || pendingOverHold)) {
      const line = pending;
      pending = null;
      pendingOverHold = false;
      return start(line);
    }
    return finish();
  }
  try {
    const u = new SpeechSynthesisUtterance(part);
    u.lang = voiceLang;
    const v = pickVoice(s);
    if (v) u.voice = v;
    u.rate = 0.95;
    u.pitch = 1.1;
    let done = false;
    const advance = () => {
      if (done) return;
      done = true;
      next(gen);
    };
    u.onend = advance;
    u.onerror = advance;
    keepAlive.splice(0, keepAlive.length, u);
    s.speak(u);
    // Some browsers forget to fire "end". If the voice has gone quiet, move on.
    const startedAt = Date.now();
    if (watchdog !== null) window.clearInterval(watchdog);
    watchdog = window.setInterval(() => {
      if (gen !== generation) return;
      const quiet = !s.speaking && !s.pending;
      if (quiet && Date.now() - startedAt > 400) {
        window.clearInterval(watchdog!);
        watchdog = null;
        advance();
      }
    }, 250);
  } catch {
    finish();
  }
}

function finish() {
  clearTimers();
  queue = [];
  currentLine = null;
  keepAlive.length = 0;
  setActive(false);
}

function start(line: string) {
  const s = synth();
  if (!s) return;
  const gen = ++generation;
  clearTimers();
  queue = splitForSpeech(line);
  currentLine = line;
  setActive(true);
  const wasBusy = s.speaking || s.pending;
  try {
    s.cancel();
  } catch {
    // ignore
  }
  // Chrome can drop a line spoken in the same moment as cancel(); wait a beat.
  startTimer = window.setTimeout(() => next(gen), wasBusy ? 80 : 0);
}

/** Set the language Bolt speaks in (e.g. "en-US", "ms-MY"). */
export function setSpeechLang(lang: string): void {
  voiceLang = lang;
}

/** True while Bolt is talking (or about to). */
export function isSpeaking(): boolean {
  return active;
}

export function setSoundOn(on: boolean): void {
  soundOn = on;
  if (!on) stopSpeech();
}

export function isSoundOn(): boolean {
  return soundOn;
}

/**
 * Say a line now, replacing whatever is playing. Use for a new screen or card,
 * or anything the child tapped.
 */
export function speak(text: string): void {
  if (!soundOn) return;
  const line = cleanForSpeech(text);
  if (!line) return;
  pending = null;
  pendingOverHold = false;
  start(line);
}

/**
 * Say a line after the current one finishes. Use for background updates that
 * should never cut Bolt off. Repeats of the current line are skipped.
 */
export function speakQueued(text: string, opts: { overHold?: boolean } = {}): void {
  if (!soundOn) return;
  const line = cleanForSpeech(text);
  if (!line || line === currentLine) return;
  const blocked = holds > 0 && !opts.overHold;
  if (active || blocked) {
    pending = line;
    pendingOverHold = !!opts.overHold;
    return;
  }
  start(line);
}

/** Stop talking and forget anything waiting. */
export function stopSpeech(): void {
  generation++;
  pending = null;
  pendingOverHold = false;
  finish();
  try {
    synth()?.cancel();
  } catch {
    // ignore
  }
}

/** Kept for older callers. Same as stopSpeech(). */
export const cancelSpeech = stopSpeech;

/**
 * While a pop-up is open, hold back other screens' lines so they cannot talk
 * over it. Returns a function that releases the hold.
 */
export function holdSpeech(): () => void {
  holds++;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    holds = Math.max(0, holds - 1);
    // A line that was held back plays now, if Bolt is quiet.
    if (holds === 0 && pending !== null && !active) {
      const line = pending;
      pending = null;
      pendingOverHold = false;
      start(line);
    }
  };
}

/** True while a pop-up is holding other lines back. */
export function speechHeld(): boolean {
  return holds > 0;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** React hook: true while Bolt is talking. */
export function useSpeaking(): boolean {
  return useSyncExternalStore(subscribe, () => active, () => false);
}
