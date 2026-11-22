// Engine-independent motion for the original Bloom model in glTF space.
export const PERIOD_SECONDS = 0.880;
export const CLIP_NAMES = ['Bloom_Idle', 'Bloom_Light', 'Bloom_Cruise', 'Bloom_FullThrust'];
export const STRAND_COUNT = 8;
export const STRAND_COLORS = Array.from({ length: STRAND_COUNT }, (_, i) =>
  i % 3 === 0 ? 0xb9fff2 : 0xffe5a6);
export const POLLEN_SOCKET = [0, -0.218, 0.075];

const ART_UNITS_PER_PIXEL = 0.0088;
const clamp = (x, min, max) => Math.min(max, Math.max(min, x));

export function createBloomState() {
  return { phase: 0, flow: 0, side: 0, filamentTime: 0 };
}

export function updateBloom(state, dtSeconds, {
  forwardSpeed = 0,
  rightSpeed = 0,
  throttle01 = 0,
  referenceSpeed = 250,
  throttleAssist = 0.35,
  reducedMotion = false,
} = {}) {
  const dt = Math.max(0, dtSeconds);
  const speed = Math.max(1e-6, referenceSpeed);
  if (reducedMotion) {
    Object.assign(state, createBloomState());
    return state;
  }
  const target = Math.max(clamp(forwardSpeed / speed, 0, 1),
    clamp(throttle01, 0, 1) * clamp(throttleAssist, 0, 1));
  const flowTau = target > state.flow ? 0.130 : 0.245;
  state.flow += (target - state.flow) * -Math.expm1(-dt / flowTau);
  state.side += (-clamp(rightSpeed / speed, -1, 1) - state.side) * -Math.expm1(-dt / 0.175);
  state.phase = (state.phase + dt) % PERIOD_SECONDS;
  state.filamentTime += dt;
  return state;
}

export function createFilament() {
  return { start: [0, 0, 0], c1: [0, 0, 0], c2: [0, 0, 0],
    tip: [0, 0, 0], light: 0, size: 0 };
}

export function sampleFilament(state, i, out, socket = POLLEN_SOCKET) {
  const { flow, side, filamentTime } = state;
  const x = (i - 3.5) * 6.1;
  const phase = filamentTime * 12 + i * 1.45;
  const endX = x * (1.5 + flow * .37) + Math.sin(phase) * (3 + 10 * flow) + side * 21 * flow;
  const endY = 16 + (i % 3) * 7 + flow * (57 + (i % 4) * 8) + Math.cos(phase * .73) * 4;

  const set = (p, px, py, z) => {
    p[0] = socket[0] + px * ART_UNITS_PER_PIXEL;
    p[1] = socket[1] - py * ART_UNITS_PER_PIXEL;
    p[2] = socket[2] + z;
  };
  set(out.start, x * .56, 1 + Math.abs(x) * .14, .007 + Math.abs(x) * .002);
  set(out.c1, x * 1.05 + Math.sin(phase * .9) * 4, 9 + flow * 12, .300 + (i % 3) * .015);
  set(out.c2, endX - side * 4 + Math.sin(phase + 1) * 8, endY - 11 - flow * 10,
    .366 + Math.sin(phase * .62) * .038);
  set(out.tip, endX, endY, .285 + (i % 3) * .018 + Math.cos(phase * .5) * .035 - flow * .047);
  out.light = .62 + .34 * (.5 + .5 * Math.sin(phase * 1.48));
  out.size = (.085 + flow * .018) * (.83 + .17 * out.light);
  return out;
}

export function sampleCurve(out, strand, t) {
  const rest = 1 - t;
  for (let i = 0; i < 3; i++) {
    out[i] = rest ** 3 * strand.start[i] + 3 * rest * rest * t * strand.c1[i]
      + 3 * rest * t * t * strand.c2[i] + t ** 3 * strand.tip[i];
  }
  return out;
}
