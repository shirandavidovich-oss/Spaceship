// Timeline in seconds, from the existing 2D rear-crystal animation.
export const REAR_CRYSTAL_TIMING = Object.freeze({
  form: 0.260,
  release: 1.070,
  end: 1.540,
  braceIn: 0.465,
  braceOut: 0.430,
});
export const CRYSTAL_SCALE = 0.46;

function ease(value) {
  const p = Math.max(0, Math.min(1, value));
  return p * p * (3 - 2 * p);
}

export function sampleRearCrystal(ageSeconds) {
  const { form, release, end, braceIn, braceOut } = REAR_CRYSTAL_TIMING;
  if (!Number.isFinite(ageSeconds) || ageSeconds < 0 || ageSeconds >= end) {
    return { brace: 0, growth: 0, visible: false, spinRadians: 0 };
  }
  return {
    brace: ease(ageSeconds / braceIn) * (1 - ease((ageSeconds - release) / braceOut)),
    growth: ease((ageSeconds - form) / (release - form)),
    visible: ageSeconds > form && ageSeconds < release,
    spinRadians: .24 + Math.max(0, ageSeconds - form) * 2.1,
  };
}
