// Pure outcome helpers for the non-solar-storm missions. These keep the "no
// free choice" rule: each mission forces a trade-off with no always-win answer.

import type { TankAssignment } from "../components/WaterTanks";

// --- Water wall -----------------------------------------------------------
// Six tanks, three jobs. The crew needs enough drinking water AND enough air,
// and the shield wall needs water to hold back the storm. You cannot fully
// satisfy all three with six tanks, so something must give.
export interface WaterResult {
  stars: number;
  thirsty: boolean;
  airLow: boolean;
  shieldWeak: boolean;
  success: boolean;
}

export function scoreWaterWall(a: TankAssignment): WaterResult {
  const thirsty = a.drinking < 2;
  const airLow = a.airMaker < 2;
  const shieldWeak = a.shieldWall < 2;
  const problems = [thirsty, airLow, shieldWeak].filter(Boolean).length;
  const stars = Math.max(0, 3 - problems);
  return {
    stars,
    thirsty,
    airLow,
    shieldWeak,
    success: problems === 0,
  };
}

// --- Call to Earth (wait or act) -----------------------------------------
// A leak drains the air. Waiting for Earth's answer is safe but costs air; the
// message takes real time to arrive. Acting now is faster but a guess.
export interface CallResult {
  stars: number;
  airLeft: number; // 0..100
  success: boolean;
  guessedRight: boolean;
}

/**
 * @param waitedSeconds how long the child held the button (waiting for Earth)
 * @param answerSeconds how long Earth's answer really takes to arrive
 * @param actedGuessRight if they let go early, whether their fix guess was right
 */
export function scoreCall(
  waitedSeconds: number,
  answerSeconds: number,
  actedGuessRight: boolean,
): CallResult {
  const drainPerSecond = 9; // air lost per second of waiting
  const airLeft = Math.max(0, 100 - waitedSeconds * drainPerSecond);

  if (waitedSeconds >= answerSeconds) {
    // Earth's answer arrived; the fix is correct. Stars depend on air saved.
    const stars = airLeft > 40 ? 3 : airLeft > 15 ? 2 : 1;
    return { stars, airLeft, success: true, guessedRight: true };
  }
  // Acted on a guess before the answer came.
  if (actedGuessRight) {
    const stars = airLeft > 40 ? 3 : 2;
    return { stars, airLeft, success: true, guessedRight: true };
  }
  return { stars: airLeft > 0 ? 1 : 0, airLeft, success: false, guessedRight: false };
}
