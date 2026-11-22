// Engine-neutral visual clocks. Throttle is an input, not a speed estimate.
export const FIN_PERIOD = 1.280;
export const STERN_PERIOD = 0.640;
export const THROTTLE_ATTACK = 0.150;
export const THROTTLE_RELEASE = 0.290;
export const CLIPS = {
  fins: 'Xeltar_Fins_And_Mantle',
  idle: 'Xeltar_Stern_Idle',
  swim: 'Xeltar_Stern_Swim',
  brace: 'Xeltar_Rear_Brace',
};

const clamp01 = (value) => Math.min(1, Math.max(0, value));

export function createXeltarPose() {
  return { finTime: 0, sternTime: 0, throttleLevel: 0, swimMix: 0, rearCharge: 0 };
}

export function updateXeltarPose(pose, deltaSeconds, {
  throttle01 = 0,
  rearCharge01 = 0,
  reducedMotion = false,
} = {}) {
  const dt = Math.max(0, deltaSeconds);
  pose.rearCharge = clamp01(rearCharge01);
  if (reducedMotion) {
    pose.throttleLevel = 0;
    pose.swimMix = 0;
    return pose;
  }

  const target = clamp01(throttle01);
  const current = pose.throttleLevel;
  const maxRise = dt / THROTTLE_ATTACK;
  const maxFall = dt / THROTTLE_RELEASE;
  pose.throttleLevel = Math.max(current - maxFall, Math.min(current + maxRise, target));
  const level = pose.throttleLevel;
  pose.swimMix = level * level * (3 - 2 * level);
  pose.finTime = (pose.finTime + dt) % FIN_PERIOD;
  pose.sternTime = (pose.sternTime + dt) % STERN_PERIOD;
  return pose;
}
