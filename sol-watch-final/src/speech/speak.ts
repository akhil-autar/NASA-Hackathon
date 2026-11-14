// Thin wrapper over the browser's speech synthesis, for Bolt's voice.
// Respects a sound on/off setting. Fails quietly if speech is not available.

let soundOn = true;
let voiceLang = "en-US";

/** Set the language Bolt speaks in (e.g. "en-US", "ms-MY"). */
export function setSpeechLang(lang: string): void {
  voiceLang = lang;
}

/** True while Bolt is talking. */
export function isSpeaking(): boolean {
  try {
    return !!window.speechSynthesis?.speaking;
  } catch {
    return false;
  }
}

export function setSoundOn(on: boolean): void {
  soundOn = on;
  if (!on) cancelSpeech();
}

export function isSoundOn(): boolean {
  return soundOn;
}

export function speak(text: string): void {
  if (!soundOn) return;
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = voiceLang;
    const voice = synth
      .getVoices()
      .find((v) => v.lang.replace("_", "-").toLowerCase().startsWith(voiceLang.slice(0, 2).toLowerCase()));
    if (voice) u.voice = voice;
    u.rate = 0.95;
    u.pitch = 1.1;
    synth.speak(u);
  } catch {
    // Speech is a nice-to-have; never let it break the game.
  }
}

export function cancelSpeech(): void {
  try {
    window.speechSynthesis?.cancel();
  } catch {
    // ignore
  }
}
