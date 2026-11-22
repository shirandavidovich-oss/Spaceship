// The original underwater entry sequence was 30 frames at 100 ms.
export const DEPLOY_SECONDS = 3.0;
export const RETRACT_SECONDS = 2.15;
export const CLIPS = Object.freeze({
  deploy: 'Boiler_Propulsor_Deploy',
  retract: 'Boiler_Propulsor_Retract',
  spin: 'Boiler_Propulsor_Spin',
});

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const between = (t, start, end) => {
  const u = clamp01((t - start) / (end - start));
  return u * u * (3 - 2 * u);
};

export function sampleDeployment(seconds) {
  const t = Math.max(0, Math.min(DEPLOY_SECONDS, seconds));
  return {
    doors: between(t, .08, .80),
    locks: between(t, .04, .34),
    shaft: between(t, .79, 2.39),
    unfold: between(t, 2.02, 2.64),
    rotorReady: between(t, 2.68, 3),
  };
}

export function createPropulsorState() {
  return { progress: 0, rotorRadians: 0, rpm: 0, wake: 0 };
}

export function updatePropulsor(state, dtSeconds, { submerged = false, throttle01 = 0 } = {}) {
  const dt = Number.isFinite(dtSeconds) ? Math.max(0, dtSeconds) : 0;
  state.progress = clamp01(state.progress + (submerged ? dt / DEPLOY_SECONDS : -dt / RETRACT_SECONDS));
  const pose = sampleDeployment(state.progress * DEPLOY_SECONDS);
  const throttle = Number.isFinite(throttle01) ? clamp01(throttle01) : 0;
  const target = pose.rotorReady * (32 + 168 * throttle);
  state.rpm += (target - state.rpm) * -Math.expm1(-dt / (target > state.rpm ? .19 : .075));
  if (pose.unfold < .999 || state.rpm < .01) state.rpm = 0;
  state.rotorRadians = (state.rotorRadians + dt * state.rpm * Math.PI / 30) % (Math.PI * 2);
  state.wake = submerged ? pose.rotorReady * (.16 + .84 * throttle) : 0;
  return pose;
}
