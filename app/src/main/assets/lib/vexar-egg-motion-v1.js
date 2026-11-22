// Weapon 2 timing from the original Vexar 2D action. Inputs are milliseconds.
export const VEXAR_RELEASE_MS = 1140;
export const VEXAR_END_MS = 1650;
export const VEXAR_PREVIEW_FLIGHT_MS = 460;
export const VEXAR_CLIP = 'Vexar_Weapon2_EggFormation';

const limit = (t) => Math.max(0, Math.min(1, t));
function between(age, start, end) {
  const t = limit((age - start) / (end - start));
  return t * t * (3 - 2 * t);
}

export function sampleVexarEgg(ageMs) {
  const age = Number.isFinite(ageMs) ? ageMs : -1;
  const opening = between(age, 0, 290);
  const squeeze = between(age, 315, 490) * (1 - between(age, 790, 1090));
  const flutter = Math.sin((age - 410) * .027) * between(age, 400, 490) * (1 - between(age, 890, 1090));
  const recovery = 1 - between(age, 1240, VEXAR_END_MS);
  const spread = (opening - .33 * squeeze + .065 * flutter) * recovery;
  const cap = (between(age, 60, 320) - .26 * squeeze + .05 * flutter) * recovery;
  const growth = .32 * between(age, 210, 430) + .36 * between(age, 450, 710)
    + .32 * between(age, 750, 1050);
  const alive = between(age, 225, 360) * (1 - between(age, 1030, VEXAR_RELEASE_MS));
  const wobble = Math.sin(age * .024) * alive;
  const flare = between(age, 1080, VEXAR_RELEASE_MS) * (1 - between(age, VEXAR_RELEASE_MS, 1310));
  const shell = between(age, 375, 890);
  const seed = between(age, 175, 290) * (1 - between(age, 660, 1020));
  const attached = age > 375 && age < VEXAR_RELEASE_MS;
  return {
    spread, cap, growth, wobble, flare, seed, attached,
    eggScale: (.105 + .333 * growth) * (.46 + .54 * shell),
    stretch: 1 + .13 * wobble,
    chamber: between(age, 110, 370) * (1 - between(age, 1250, 1540)),
    position: [.246 - .081 * growth, .112 + .11 * growth + .205 * between(age, 745, VEXAR_RELEASE_MS), -.020 * wobble],
    tilt: .14 * wobble,
  };
}

export function visualAge(ageMs) {
  return Number.isFinite(ageMs) ? Math.max(0, Math.min(VEXAR_END_MS, ageMs)) : 0;
}
