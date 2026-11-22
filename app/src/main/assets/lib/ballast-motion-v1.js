// The 2D tow reference starts extension at 710 ms and hits the stop at 1430 ms.
export const STOP_MS = 1430;
export const EXTEND_BEGIN_MS = 710;
export const EXTEND_MS = 720;
export const RETRACT_MS = 560;
export const MINE_RELEASE_MS = 420;
export const MINE_END_MS = 840;
export const EXTENSION_TRAVEL = .79;
export const MINE_START_Z = -.652;
export const MINE_EXIT_Z = -.919;

export const clamp01 = (t) => Math.max(0, Math.min(1, t));
function between(t, a, b) {
  const u = clamp01((t - a) / (b - a));
  return u * u * (3 - 2 * u);
}

export function sampleBallastTow(ageMs) {
  return Number.isFinite(ageMs) ? clamp01((ageMs - EXTEND_BEGIN_MS) / EXTEND_MS) ** 1.45 : 0;
}

export function sampleBallastRetract(ageMs, startFraction = 1) {
  const elapsed = Number.isFinite(ageMs) ? Math.max(0, ageMs) : 0;
  return clamp01(startFraction) * (1 - clamp01(elapsed / RETRACT_MS)) ** 1.45;
}

export function sampleBallastMine(ageMs) {
  const t = Number.isFinite(ageMs) ? Math.min(MINE_END_MS, Math.max(0, ageMs)) : 0;
  const push = between(t, 205, MINE_RELEASE_MS);
  return {
    doors: between(t, 20, 205) * (1 - between(t, 575, MINE_END_MS)),
    sled: push * (1 - between(t, 456, 638)),
    mineZ: MINE_START_Z + (MINE_EXIT_Z - MINE_START_Z) * push,
    attached: Number.isFinite(ageMs) && ageMs >= 0 && ageMs < MINE_RELEASE_MS,
  };
}
