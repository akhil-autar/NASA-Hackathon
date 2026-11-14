// Thin wrapper over the browser's speech synthesis, for Bolt's voice.
// Respects a sound on/off setting. Fails quietly if speech is not available.

let soundOn = true;

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
