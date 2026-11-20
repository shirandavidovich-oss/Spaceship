// Orbit Break — the 3D view's ships, and the chase camera. (Its name has its version: change both with every change.)
// The game itself stays 2D: in the 3D view, a ship that has a model (SHIP_MODELS) is rendered by three.js from the
// same top-down view the 2D game shows, into a small off-screen WebGL canvas, and that picture is drawn in place of
// its 2D drawing (so everything else — shots, effects, the order things are drawn in — stays exactly as it is).
// The model is turned in 3D: banking (roll) as it turns, and tilting (pitch) — the light stays fixed in space, so
// the hull catches it differently as the ship turns, rolls and tilts.
// Models: models/<id>.glb, made from the Meshy exports with gltfpack (simplified to ~40k triangles, meshopt-compressed,
// 1024 px textures).
import * as THREE from "three";
import { GLTFLoader } from "./three/GLTFLoader.js";
import { MeshoptDecoder } from "./three/meshopt_decoder.module.js";
import { RoomEnvironment } from "./three/RoomEnvironment.js";

// per ship: its file; which way its nose points in the file (fwd: "+x" | "-x" | "+z" | "-z"); turn: an extra turn
// round its up axis (rad) to line it up with the 2D drawing; len: its length on screen, in the 2D drawing's units
// (the 2D ship is about 1 long; with fit: "max", its widest way across); up: which way is its top in the file ("+y", or "-y" if it came upside down)
export const SHIP_MODELS = {
  fresnel: { file: "models/fresnel.glb", fwd: "+x", len: 0.68 },
  boiler: { file: "models/boiler.glb", fwd: "+z", len: 0.8 },
  brass: { file: "models/thul.glb", fwd: "-x", len: 0.85 },
  puff: { file: "models/puff.glb", fwd: "-x", len: 0.8 },
  xeltar: { file: "models/xeltar.glb", fwd: "-x", len: 0.95 },
  strata: { file: "models/strata.glb", fwd: "-x", len: 0.95 },
  skarn: { file: "models/skarn.glb", fwd: "-x", len: 0.95, fit: "max" },
  glitch: { file: "models/glitch.glb", fwd: "-x", len: 0.95, fit: "max" },
  borer: { file: "models/borer.glb", fwd: "-x", len: 1.0 },
  corsair: { file: "models/corsair.glb", fwd: "-x", len: 0.85 },
  cinder: { file: "models/cinder.glb", fwd: "-z", len: 0.98, upright: 1 },
  lyth: { file: "models/lyth.glb", fwd: "-z", len: 1.03, fit: "max", split: 0.37 },
  lariat: { file: "models/lariat.glb", fwd: "+z", len: 1.03, upright: -1 },
  palisade: { file: "models/palisade.glb", fwd: "-z", len: 1.05, fit: "max", upright: 1 },
  courier: { file: "models/courier.glb", fwd: "-x", len: 0.855 },
  kiln: { file: "models/kiln.glb", fwd: "+x", len: 1.03 },
  vault: { file: "models/vault.glb", fwd: "-z", len: 0.8, upright: 1 },   // (its mouth face is the top seen from above)
  orian: { file: "models/orian.glb", fwd: "-x", len: 0.9, fan: { back: -0.055, hinge: [0, -0.085, -0.07], normal: [0, 0.94, -0.34], cuts: [-46, -15, 15, 46], round: [144, 72, 0, -72, -144], cone: 9, narrow: 0.45, shorten: 0.72 } },   // (shut: narrower across, and shorter — the sheath of the 2D drawing)
  mirage: { file: "models/mirage.glb", fwd: "-x", len: 1.0 },
  gimbal: { file: "models/gimbal.glb", fwd: "-z", len: 1.03, upright: 1, gyro: { cz: 0.0513, spine: 0.045, bar: 0.045, rings: [[0.14, 0.245], [0.245, 0.31], [0.31, 0.4]] } },
  talus: { file: "models/talus.glb", fwd: "-z", len: 0.89, upright: 1, bands: true },
  reprise: { file: "models/reprise.glb", fwd: "+z", len: 0.787, upright: -1, blocks: [0.375, 0.02, -0.30], pad: 2.9 },   // (its four buildings, tallest first)
  ballast: { file: "models/ballast.glb", fwd: "-x", len: 0.95 },
  zorian: { file: "models/zorian.glb", fwd: "-x", len: 0.9 },
  cantor: { file: "models/cantor.glb", fwd: "+z", len: 0.95 },
  frankenstein: { file: "models/frankenstein.glb", fwd: "-x", len: 1.0 },
  vexar: { file: "models/vexar.glb", fwd: "-x", len: 0.95 },
  labyrinth: { file: "models/labyrinth.glb", fwd: "-x", len: 0.95 },
  kraal: { file: "models/kraal.glb", fwd: "+x", len: 0.75 },
  flipper: { file: "models/flipper.glb", fwd: "+x", len: 0.9 },
  rivet: { file: "models/rivet.glb", fwd: "-x", len: 0.82 },
  nimbus: { file: "models/nimbus.glb", fwd: "-x", len: 1.0 },
  husk: { file: "models/husk.glb", fwd: "-x", len: 1.05 },
  bloom: { file: "models/bloom.glb", fwd: "-z", len: 0.8, fit: "max", upright: 1 },
};

const PX = 512, PAD = 1.3;   // the off-screen picture's size (px), and its room round the ship (for rolling and tilting)
let R = null, scene, cam, key, rim, root, lamps = null;
const models = {};
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);

function init() {
  if (R) return true;
  try {
    const cv = document.createElement("canvas"); cv.width = cv.height = PX;
    R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true, powerPreference: "high-performance" });
  } catch (e) { R = null; return false; }
  R.setPixelRatio(1); R.setSize(PX, PX, false); R.setClearColor(0x000000, 0);
  R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.NeutralToneMapping; R.toneMappingExposure = 1.0;
  scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(R); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose();
  scene.environmentIntensity = 0.55;
  // the camera: straight down from above, the screen's up being the world's -z (as the 2D game sees it)
  const h = PAD / 2; cam = new THREE.OrthographicCamera(-h, h, h, -h, -10, 10);
  cam.position.set(0, 5, 0); cam.up.set(0, 0, -1); cam.lookAt(0, 0, 0);
  key = new THREE.DirectionalLight(0xffffff, 2.4); scene.add(key, key.target);   // the star's light, fixed in space
  rim = new THREE.DirectionalLight(0x9fc4ff, 0.8); scene.add(rim, rim.target);
  scene.add(new THREE.AmbientLight(0xffffff, 0.25));
  root = new THREE.Group(); scene.add(root);
  return true;
}

// the last pictures made of each ship (2D canvases), by pose: a ship flying straight on is not drawn again every frame,
// its picture is reused (copying a WebGL picture onto the game's canvas makes the phone wait for its graphics chip)
const poseCache = {};
function cached(id, key) {
  const A = poseCache[id] || (poseCache[id] = []);
  return A.find((c) => c.key === key) || null;
}
function store(id, key) {
  const A = poseCache[id] || (poseCache[id] = []);
  let c = A.length < 2 ? null : A.sort((a, b) => a.t - b.t)[0];   // (two per ship: the same ship on both sides)
  if (!c) { const cv = document.createElement("canvas"); cv.width = cv.height = PX; c = { cv, cx: cv.getContext("2d") }; A.push(c); }
  c.key = key; c.cx.clearRect(0, 0, PX, PX); c.cx.drawImage(R.domElement, 0, 0); return c;
}
// fit a loaded model: centred, nose to -z (the screen's up), top to +y, 1 long
function fit(obj, M) {
  obj.removeFromParent(); obj.position.set(0, 0, 0); obj.rotation.set(M.upright ? -Math.PI / 2 * M.upright : 0, 0, 0); obj.updateMatrixWorld(true);   // (upright: a model standing up, facing +z (1) or -z (-1): laid down, its face up)
  const box = new THREE.Box3().setFromObject(obj), c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3());
  const along = M.fit === "max" ? Math.max(s.x, s.z) : M.fwd[1] === "x" ? s.x : s.z;   // (fit "max": its widest way across, for a ship wider than it is long)
  const inner = new THREE.Group(); obj.position.sub(c); inner.add(obj);
  const turn = { "-z": 0, "+z": Math.PI, "-x": -Math.PI / 2, "+x": Math.PI / 2 }[M.fwd] + (M.turn || 0);
  inner.rotation.y = turn; if (M.up === "-y") inner.rotation.z = Math.PI;
  const outer = new THREE.Group(); outer.add(inner); outer.scale.setScalar(1 / along);
  obj.traverse((o) => { if (o.isMesh) { o.frustumCulled = false; if (o.material) o.material.envMapIntensity = 1; } });
  return outer;
}

// at most KEEP models held on the graphics chip at once: past that, the one drawn longest ago is let go (its meshes and
// pictures freed; loaded again if it comes back). Each holds a few 1024 px pictures: dozens of them fill a phone's memory
const KEEP = 6;
function evict() {
  const held = Object.keys(models).filter((k) => models[k].state === "ready");
  if (held.length <= KEEP) return;
  held.sort((a, b) => (models[a].used || 0) - (models[b].used || 0));
  for (const k of held.slice(0, held.length - KEEP)) {
    const E = models[k]; if (performance.now() - (E.used || 0) < 2000) continue;   // (never one drawn just now)
    E.obj.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); const ms = Array.isArray(o.material) ? o.material : [o.material]; for (const m of ms) { for (const v of Object.values(m)) if (v && v.isTexture) v.dispose(); m.dispose(); } } });
    delete models[k]; delete poseCache[k];
  }
}
// a model in one piece with a ring round it (LYTH: `split`, the radius in ship-lengths past which a triangle is the
// ring's): cut in two at load — the hull, and the ring on a turntable of its own (E.spin) that can spin, or be hidden
// while the ring flies away (or drawn alone, where it flies). The original meshes stay, hidden
function splitRing(E, M) {
  const outer = E.obj; outer.updateMatrixWorld(true);
  const spin = new THREE.Group(); outer.add(spin); spin.updateMatrixWorld(true);
  const meshes = []; outer.traverse((o) => { if (o.isMesh) meshes.push(o); });
  const v = new THREE.Vector3(); E.hull = [];
  for (const m of meshes) {
    const g = m.geometry, P = g.attributes.position, idx = g.index ? g.index.array : null, n = idx ? idx.length : P.count;
    const rad = new Float32Array(P.count);
    for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld); rad[i] = Math.hypot(v.x, v.z); }
    const ia = [], ib = [];
    for (let t = 0; t < n; t += 3) {
      const a = idx ? idx[t] : t, b = idx ? idx[t + 1] : t + 1, c = idx ? idx[t + 2] : t + 2;
      ((rad[a] + rad[b] + rad[c]) / 3 > M.split ? ib : ia).push(a, b, c);
    }
    const make = (list) => { const G = new THREE.BufferGeometry(); for (const k in g.attributes) G.setAttribute(k, g.attributes[k]); G.setIndex(list); const X = new THREE.Mesh(G, m.material); X.frustumCulled = false; return X; };
    const H = make(ia), Rg = make(ib);
    m.parent.add(H); H.position.copy(m.position); H.quaternion.copy(m.quaternion); H.scale.copy(m.scale);
    m.parent.add(Rg); Rg.position.copy(m.position); Rg.quaternion.copy(m.quaternion); Rg.scale.copy(m.scale); spin.attach(Rg);
    m.visible = false; E.hull.push(H);
  }
  E.spin = spin;
}
// a model of separate buildings standing side by side (REPRISE: `blocks`, the file's x where one ends and the next
// begins, from the right): cut at load into parts, each on a pivot of its own at its middle, so each can be moved and
// turned on its own (the time-reverse magic takes them apart and puts them back in another shape). E.parts: [{ pivot,
// cx, cz, w, h }] in the fitted model's units (x to the right, z down the screen; w across, h along)
function splitBlocks(E, M) {
  const outer = E.obj, raw = E.raw; outer.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(raw.matrixWorld).invert(), s = outer.scale.x;
  const meshes = []; raw.traverse((o) => { if (o.isMesh) meshes.push(o); });
  const n = M.blocks.length + 1, lists = meshes.map(() => Array.from({ length: n }, () => []));
  const boxes = Array.from({ length: n }, () => new THREE.Box3());
  const v = new THREE.Vector3(), w = new THREE.Vector3();
  meshes.forEach((m, mi) => {
    const g = m.geometry, P = g.attributes.position, idx = g.index ? g.index.array : null, cnt = idx ? idx.length : P.count;
    const toFile = new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld), fx = new Float32Array(P.count);
    for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); w.copy(v).applyMatrix4(toFile); fx[i] = w.x; }
    for (let t = 0; t < cnt; t += 3) {
      const a = idx ? idx[t] : t, b = idx ? idx[t + 1] : t + 1, c = idx ? idx[t + 2] : t + 2, x = (fx[a] + fx[b] + fx[c]) / 3;
      let k = 0; while (k < M.blocks.length && x <= M.blocks[k]) k++;
      lists[mi][k].push(a, b, c);
      for (const q of [a, b, c]) boxes[k].expandByPoint(v.fromBufferAttribute(P, q).applyMatrix4(m.matrixWorld));
    }
  });
  E.parts = boxes.map((B) => { const c = B.getCenter(new THREE.Vector3()), z = B.getSize(new THREE.Vector3()); const pivot = new THREE.Group(); outer.add(pivot); pivot.position.set(c.x / s, 0, c.z / s); return { pivot, cx: c.x, cz: c.z, w: z.x, h: z.z }; });
  outer.updateMatrixWorld(true);
  meshes.forEach((m, mi) => {
    for (let k = 0; k < n; k++) {
      if (!lists[mi][k].length) continue;
      const G = new THREE.BufferGeometry(); for (const key in m.geometry.attributes) G.setAttribute(key, m.geometry.attributes[key]); G.setIndex(lists[mi][k]);
      const X = new THREE.Mesh(G, m.material); X.frustumCulled = false;
      m.parent.add(X); X.position.copy(m.position); X.quaternion.copy(m.quaternion); X.scale.copy(m.scale); X.updateMatrixWorld(true);
      E.parts[k].pivot.attach(X);
    }
    m.visible = false;
  });
}
// a ship that grows in layers (TALUS: `bands`): each layer it has grown is tinted the colour of the body it came from,
// like the 2D drawing's — there the layers are copies of its outline, each a size bigger; here each vertex knows how far
// out it is (aR: 0 in the middle, 1 at the edge, measured across its outline's ellipse) and the shader multiplies the
// colour of the layer that distance falls in (85%, as the 2D multiply). E.bands: the uniforms, set at each draw
function bandShader(E) {
  const outer = E.obj; outer.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(outer), hx = (box.max.x - box.min.x) / 2, hz = (box.max.z - box.min.z) / 2, v = new THREE.Vector3();
  const U = { uN: { value: 0 }, uLo: { value: new Array(5).fill(0) }, uHi: { value: new Array(5).fill(0) }, uC: { value: Array.from({ length: 5 }, () => new THREE.Color(1, 1, 1)) } };
  // its outline seen from above: how far out it reaches in each of NB directions (so a layer follows the outline's shape,
  // as the 2D layers do, and not a circle)
  const NB = 96, Rm = new Float32Array(NB), bin = (x, z) => Math.floor(((Math.atan2(z, x) / (2 * Math.PI)) + 1) % 1 * NB) % NB;
  outer.traverse((m) => { if (!m.isMesh) return; const P = m.geometry.attributes.position; for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld); const b = bin(v.x, v.z); Rm[b] = Math.max(Rm[b], Math.hypot(v.x, v.z)); } });
  const Rs = Rm.map((_, i) => Math.max(Rm[(i + NB - 1) % NB], Rm[i], Rm[(i + 1) % NB]) || Math.max(hx, hz));   // (a little smoothed)
  outer.traverse((m) => {
    if (!m.isMesh) return;
    const P = m.geometry.attributes.position, aR = new Float32Array(P.count);
    for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld); aR[i] = Math.hypot(v.x, v.z) / Rs[bin(v.x, v.z)]; }
    m.geometry.setAttribute("aR", new THREE.BufferAttribute(aR, 1));
    const mat = m.material.clone(); m.material = mat;
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = "attribute float aR;\nvarying float vR;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvR = aR;");
      sh.fragmentShader = "varying float vR;\nuniform int uN;\nuniform float uLo[5];\nuniform float uHi[5];\nuniform vec3 uC[5];\n" + sh.fragmentShader.replace("#include <map_fragment>",
        "#include <map_fragment>\nfor (int j = 0; j < 5; j++) { if (j < uN && vR >= uLo[j] && vR < uHi[j]) diffuseColor.rgb *= mix(vec3(1.0), uC[j], 0.85); }");
    };
    mat.customProgramCacheKey = () => "bands";
  });
  E.bands = U;
}
// a gyroscope (GIMBAL: `gyro`): the spine through the middle stays where it is (it turns with the heading, as drawn);
// the cage (the crossbar and the hub) and the rings round it are cut off at load, each onto a turntable of its own at the
// middle: E.turns[0] the cage, then the rings from the inside out. In the fitted model's units: spine — the spine's
// half-width; bar — the crossbar's half-height; rings — [inner, outer] radius of each ring
function splitGyro(E, M) {
  const outer = E.obj, G = M.gyro; outer.updateMatrixWorld(true);
  const meshes = []; outer.traverse((o) => { if (o.isMesh) meshes.push(o); });
  const n = 1 + G.rings.length, v = new THREE.Vector3();
  E.turns = Array.from({ length: n }, () => { const t = new THREE.Group(); outer.add(t); t.position.set(0, 0, (G.cz || 0) / outer.scale.x); return t; });   // (at the rings' own middle: cz)
  outer.updateMatrixWorld(true);
  // (a ring has no pieces of its own under the spine and the crossbar — the model has nothing there: those stay put,
  // and the rings turn in quarter turns, so at rest their gaps are back under the spine and the bar)
  const which = (x, z) => {
    const r = Math.hypot(x, z);
    if (Math.abs(x) < G.spine || Math.abs(z) < G.bar) return [-1];
    for (let k = 0; k < G.rings.length; k++) if (r >= G.rings[k][0] && r < G.rings[k][1]) return [1 + k];
    return [-1];
  };
  for (const m of meshes) {
    const g = m.geometry, P = g.attributes.position, idx = g.index ? g.index.array : null, cnt = idx ? idx.length : P.count;
    const px = new Float32Array(P.count), pz = new Float32Array(P.count);
    for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld); px[i] = v.x; pz[i] = v.z; }
    const lists = Array.from({ length: n + 1 }, () => []);
    for (let t = 0; t < cnt; t += 3) {
      const a = idx ? idx[t] : t, b = idx ? idx[t + 1] : t + 1, c = idx ? idx[t + 2] : t + 2;
      for (const k of which((px[a] + px[b] + px[c]) / 3, (pz[a] + pz[b] + pz[c]) / 3 - (G.cz || 0))) lists[k + 1].push(a, b, c);
    }
    lists.forEach((L, k) => {
      if (!L.length) return;
      const Gm = new THREE.BufferGeometry(); for (const key in g.attributes) Gm.setAttribute(key, g.attributes[key]); Gm.setIndex(L);
      const X = new THREE.Mesh(Gm, m.material); X.frustumCulled = false;
      m.parent.add(X); X.position.copy(m.position); X.quaternion.copy(m.quaternion); X.scale.copy(m.scale); X.updateMatrixWorld(true);
      if (k > 0) E.turns[k - 1].attach(X);
    });
    m.visible = false;
  }
}
// a ship whose model came with its fan of panels open (ORIAN: `fan`) — folded shut by us: the panels (all that lies
// behind `back`) are cut off at load into groups by their angle round the hinge seen from above (`cuts`, degrees, 0 =
// straight back), each on a pivot at the hinge H. Shut, each panel is turned rigidly so it lies along the tail, tipped
// out by `cone` degrees, at its own place round the tail (`round`, degrees from the top toward the right), its golden face
// outward: together a closed, round, tapering sheath behind the pod. E.fan: [{ pivot, shut (a quaternion) }]
function splitFan(E, M) {
  const F = M.fan, outer = E.obj; outer.updateMatrixWorld(true);
  const meshes = []; outer.traverse((o) => { if (o.isMesh) meshes.push(o); });
  const H = new THREE.Vector3(...F.hinge), n = F.cuts.length + 1, v = new THREE.Vector3(), s = outer.scale.x;
  const sums = Array.from({ length: n }, () => new THREE.Vector3()), cnt = new Array(n).fill(0);
  const group = (x, z) => { const a = Math.atan2(-x, z - H.z) * 180 / Math.PI; let k = 0; while (k < F.cuts.length && a > F.cuts[k]) k++; return k; };
  const plan = meshes.map((m) => {
    const g = m.geometry, P = g.attributes.position, idx = g.index ? g.index.array : null, c = idx ? idx.length : P.count;
    const X = new Float32Array(P.count), Y = new Float32Array(P.count), Z = new Float32Array(P.count);
    for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld); X[i] = v.x; Y[i] = v.y; Z[i] = v.z; }
    const lists = Array.from({ length: n + 1 }, () => []);
    for (let t = 0; t < c; t += 3) {
      const a = idx ? idx[t] : t, b = idx ? idx[t + 1] : t + 1, d = idx ? idx[t + 2] : t + 2, cx = (X[a] + X[b] + X[d]) / 3, cy = (Y[a] + Y[b] + Y[d]) / 3, cz = (Z[a] + Z[b] + Z[d]) / 3;
      if (cz <= F.back) { lists[0].push(a, b, d); continue; }   // the pod
      const k = group(cx, cz); lists[k + 1].push(a, b, d); sums[k].add(v.set(cx, cy, cz)); cnt[k]++;
    }
    return lists;
  });
  // each panel's way out from the hinge, and the fan's face (its normal), open and shut
  const N0 = new THREE.Vector3(...F.normal).normalize(), back = new THREE.Vector3(0, 0, 1), m3 = new THREE.Matrix4(), m4 = new THREE.Matrix4();
  E.fan = sums.map((S, k) => {
    const d = S.divideScalar(Math.max(1, cnt[k])).sub(H).normalize(), nO = N0.clone().sub(d.clone().multiplyScalar(N0.dot(d))).normalize(), wO = new THREE.Vector3().crossVectors(nO, d);
    const phi = F.round[k] * Math.PI / 180, r = new THREE.Vector3(Math.sin(phi), Math.cos(phi), 0);
    const d2 = back.clone().add(r.clone().multiplyScalar(Math.tan(F.cone * Math.PI / 180))).normalize(), n2 = r.clone().sub(d2.clone().multiplyScalar(r.dot(d2))).normalize(), w2 = new THREE.Vector3().crossVectors(n2, d2);
    m3.makeBasis(d, wO, nO); m4.makeBasis(d2, w2, n2);
    const shut = new THREE.Quaternion().setFromRotationMatrix(m4.multiply(m3.clone().transpose()));
    const pivot = new THREE.Group(); outer.add(pivot); pivot.position.copy(H).divideScalar(s);
    // (inside it, a group lined up with the panel's own axes — along it, across it, its face — so the panel can be
    // narrowed across as it shuts, `narrow`: folded panels overlap less and the sheath stays slim; and drawn in, `shorten`)
    const Qo = new THREE.Quaternion().setFromRotationMatrix(m3), squash = new THREE.Group(), unrot = new THREE.Group();
    squash.quaternion.copy(Qo); unrot.quaternion.copy(Qo).invert(); pivot.add(squash); squash.add(unrot);
    return { pivot, shut, squash, unrot };
  });
  outer.updateMatrixWorld(true);
  meshes.forEach((m, mi) => {
    plan[mi].forEach((L, k) => {
      if (!L.length) return;
      const G = new THREE.BufferGeometry(); for (const key in m.geometry.attributes) G.setAttribute(key, m.geometry.attributes[key]); G.setIndex(L);
      const X = new THREE.Mesh(G, m.material); X.frustumCulled = false;
      m.parent.add(X); X.position.copy(m.position); X.quaternion.copy(m.quaternion); X.scale.copy(m.scale); X.updateMatrixWorld(true);
      if (k > 0) E.fan[k - 1].unrot.attach(X);
    });
    m.visible = false;
  });
}
function want(id) {
  const M = SHIP_MODELS[id]; if (!M) return null;
  let E = models[id];
  if (E) E.used = performance.now();
  if (!E) {
    E = models[id] = { state: "loading", obj: null };
    loader.load(M.file, (g) => { E.raw = g.scene; E.obj = fit(g.scene, M); if (M.split) splitRing(E, M); if (M.blocks) splitBlocks(E, M); if (M.bands) bandShader(E); if (M.gyro) splitGyro(E, M); if (M.fan) splitFan(E, M); E.state = "ready"; E.used = performance.now(); evict(); }, undefined, (e) => { E.state = "fail"; console.warn("ship3d", id, e); });
  }
  return E;
}

// ---- the chase camera: the game's own top-down picture of space (everything but the buttons, drawn as always, round
// my ship in the middle) laid flat as the floor of a 3D scene, my ship's model above it at its depth, and a camera
// following behind it, a little above, easing after its turns. Space round it: a sphere of stars ----
let C = null;
function chaseInit() {
  if (C) return true;
  let R2;
  try { R2 = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" }); } catch (e) { return false; }
  R2.setPixelRatio(1); R2.outputColorSpace = THREE.SRGBColorSpace; R2.toneMapping = THREE.NeutralToneMapping;
  const sc = new THREE.Scene(); sc.background = new THREE.Color(0x05060f); sc.fog = new THREE.Fog(0x05060f, 6, 16);
  const pm = new THREE.PMREMGenerator(R2); sc.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose(); sc.environmentIntensity = 0.55;
  const cam = new THREE.PerspectiveCamera(62, 1, 0.02, 80);
  const tex = new THREE.Texture(); tex.colorSpace = THREE.SRGBColorSpace; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, fog: true, side: THREE.DoubleSide }));
  floor.rotation.x = -Math.PI / 2; floor.renderOrder = -1; floor.material.depthWrite = false; sc.add(floor);   // (drawn first, never hiding what stands in it: the body's ball whole, above and below the plane)
  // the stars all round (far off, not in the fog)
  const n = 1500, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const u = Math.random() * 2 - 1, t = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u); pos.set([r * Math.cos(t) * 60, u * 60, r * Math.sin(t) * 60], i * 3); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.8 }));
  sc.add(stars);
  const sun = new THREE.DirectionalLight(0xffffff, 2.4); sun.position.set(-3, 6, -2); sc.add(sun, new THREE.AmbientLight(0xffffff, 0.3));
  const ship = new THREE.Group(); sc.add(ship);
  // the body in the middle: a ball in the scene (a lit sphere; a star glowing; a picture body a billboard of its picture)
  const ballMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, metalness: 0, fog: false });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), ballMat); sc.add(ball);
  const gcv = document.createElement("canvas"); gcv.width = gcv.height = 128;
  { const g = gcv.getContext("2d"), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.35, "rgba(255,255,255,0.45)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(gcv), blending: THREE.AdditiveBlending, depthWrite: false, fog: false, transparent: true })); sc.add(glow);
  const pic = new THREE.Sprite(new THREE.SpriteMaterial({ fog: false, transparent: true })); sc.add(pic);
  C = { ball, ballMat, glow, pic, picImg: null, R: R2, sc, cam, tex, floor, stars, ship, q: new THREE.Quaternion(), pos: new THREE.Vector3(), first: true };
  return true;
}
const _e = new THREE.Euler(), _q = new THREE.Quaternion(), _v = new THREE.Vector3();
// o: { src (the game's canvas), w, h (its size, px), fw, fh (the floor's size, in U), id (my ship: its model, or none),
//      ang, pitch, roll, depth (z3, in U), len (the ship's length, in U), dt, follow (how fast the camera eases) }
// -> the canvas with the picture, or null
function chase(o) {
  if (!chaseInit()) return null;
  const { R: R2, sc, cam, tex, floor, ship } = C;
  if (R2.domElement.width !== o.w || R2.domElement.height !== o.h) { R2.setSize(o.w, o.h, false); cam.aspect = o.w / o.h; cam.updateProjectionMatrix(); }
  if (tex.image !== o.src) tex.image = o.src;
  tex.needsUpdate = true;
  floor.scale.set(o.fw, o.fh, 1); floor.position.y = -o.depth;   // (the plane of the game: below or above my ship by its depth)
  // the body: where it is from my ship, in the plane of the game; you can fly in front of it and behind it
  const B = o.body, { ball, ballMat, glow, pic } = C;
  ball.visible = glow.visible = pic.visible = false;
  if (B) {
    const pos = new THREE.Vector3(B.dx, -o.depth, B.dz);
    if (B.kind === "image" && B.img) {
      if (C.picImg !== B.img) { const t = new THREE.Texture(B.img); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; if (pic.material.map) pic.material.map.dispose(); pic.material.map = t; pic.material.needsUpdate = true; C.picImg = B.img; }
      pic.visible = true; pic.position.copy(pos); pic.scale.setScalar(B.r * 2 * 1.04);
    } else {
      ball.visible = true; ball.position.copy(pos); ball.scale.setScalar(B.r);
      const col = new THREE.Color(B.color || "#ffcc66"), star = B.kind === "star" || B.kind === "compact", hole = B.kind === "hole";
      ballMat.color.copy(hole ? new THREE.Color(0x000000) : col); ballMat.emissive.copy(star ? col : new THREE.Color(0x000000)); ballMat.emissiveIntensity = star ? 1.4 : 0;
      if (star || hole) { glow.visible = true; glow.position.copy(pos); glow.scale.setScalar(B.r * (hole ? 3.2 : 4)); glow.material.color.copy(hole ? new THREE.Color(0xff8a30) : col); }
    }
  }
  sc.fog.near = Math.min(o.fw, o.fh) * 0.3; sc.fog.far = Math.max(o.fw, o.fh) * 0.5;   // (the floor's edges fading into the dark)
  // my ship: its model, turned (yaw, then tilt, then roll round its length), at the middle
  ship.clear();
  const E = o.id ? want(o.id) : null;
  if (E && E.state === "ready") { ship.add(E.obj); E.obj.rotation.set(0, 0, 0); ship.scale.setScalar(o.len); }
  ship.rotation.set(-o.pitch, -o.ang, -o.roll, "YXZ");
  // the camera: behind and a little above, along the ship's heading and tilt (not its roll), easing after it
  _e.set(-o.pitch, -o.ang, 0, "YXZ"); _q.setFromEuler(_e);
  if (C.first) { C.q.copy(_q); C.first = false; } else C.q.slerp(_q, 1 - Math.exp(-o.dt * o.follow));
  _v.set(0, o.len * 1.1, o.len * 3.6).applyQuaternion(C.q);
  cam.position.copy(_v); cam.quaternion.copy(C.q);
  cam.rotateX(-0.2);   // (looking a little down, past the ship, ahead)
  R2.render(sc, cam);
  return R2.domElement;
}

// ---- the attitude gauge (in the RESET button): the orientation pyramid (models/orientation.glb: its apex along +y,
// yellow along +x, blue along -z, rotated round its root) turned as my ship is, seen from above as the game sees it,
// fitted (axis tips and all) inside the button's grey window whichever way it turns ----
let G3 = null;
function gaugeInit() {
  if (G3) return G3.state === "ready";
  if (!init()) return false;
  G3 = { state: "loading" };
  const sc = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(R); sc.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose(); sc.environmentIntensity = 0.9;
  sc.add(new THREE.HemisphereLight(0xffffff, 0x8890a0, 1.4));
  const sun = new THREE.DirectionalLight(0xffffff, 1.8); sun.position.set(-1.5, 3, -1); sc.add(sun);
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10); cam.position.set(0, 5, 0); cam.up.set(0, 0, -1); cam.lookAt(0, 0, 0);
  const turn = new THREE.Group(), calib = new THREE.Group(); calib.rotation.x = -Math.PI / 2;   // (the apex, +y, to the ship's nose, -z; the pyramid's +z to its top)
  turn.add(calib); sc.add(turn);
  Object.assign(G3, { sc, cam, turn, calib });
  loader.load("models/orientation.glb", (g) => {
    calib.add(g.scene);
    let r = 0; g.scene.updateMatrixWorld(true);
    const v = new THREE.Vector3();
    g.scene.traverse((o) => {   // (its farthest point from its root, axis tips and all: as big as it can be and still never leave the window)
      const P = o.isMesh && o.geometry.attributes.position; if (!P) return;
      for (let i = 0; i < P.count; i++) r = Math.max(r, v.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld).length());
    });
    cam.left = cam.bottom = -r * 1.02; cam.right = cam.top = r * 1.02; cam.updateProjectionMatrix();   // (fits in every turn: the farthest point from its root)
    G3.state = "ready";
  }, undefined, () => { G3.state = "fail"; });
  return false;
}
// draw it, turned by q ([x, y, z, w], the ship's orientation), into a circle of radius `r` round (x, y) of the 2D context
function gauge(ctx, q, x, y, r) {
  if (!gaugeInit()) return false;
  const key = q.map((v) => Math.round(v * 300)).join("|");   // (drawn again only when the ship has turned: else its last picture)
  if (G3.key !== key) {
    G3.turn.quaternion.set(q[0], q[1], q[2], q[3]);
    R.toneMapping = THREE.NeutralToneMapping;
    R.render(G3.sc, G3.cam);
    if (!G3.cv) { G3.cv = document.createElement("canvas"); G3.cv.width = G3.cv.height = 256; G3.cx = G3.cv.getContext("2d"); }
    G3.cx.clearRect(0, 0, 256, 256); G3.cx.drawImage(R.domElement, 0, 0, 256, 256); G3.key = key;
  }
  ctx.drawImage(G3.cv, x - r, y - r, r * 2, r * 2);
  return true;
}

export const Ship3D = {
  gauge,
  version: 32,   // (index.html checks it; the file's name carries it too — lib/ship3d-v32.js — so the app never mixes a new
                // game with an old copy of this file it saved earlier: change the name with every change here)
  chase,
  chaseReset() { if (C) C.first = true; },
  on: false,
  has(id) { return !!SHIP_MODELS[id]; },
  // a ship cut into parts (`blocks`): each part's middle and size in the fitted model's units, and `len` (one fitted unit
  // is `len` ship-lengths on screen)
  parts(id) { const E = want(id); return E && E.state === "ready" && E.parts ? { len: SHIP_MODELS[id].len || 1, list: E.parts.map((B) => ({ cx: B.cx, cz: B.cz, w: B.w, h: B.h })) } : null; },
  ready(id) { const E = want(id); return !!E && E.state === "ready"; },
  preload(ids) { for (const id of ids) want(id); },
  _reset(id) { const E = models[id]; delete poseCache[id]; if (E && E.raw) E.obj = fit(E.raw, SHIP_MODELS[id]); },
  // draw ship `id` into the 2D context, whose origin is the ship's middle and whose units are the 2D drawing's (the
  // ship already turned to its heading `ang` there). roll, pitch: rad (roll: right wing away from you; pitch: nose away, into the screen)
  // opt (a ship with a ring, `split`): part — "hull" (the ring away) or "ring" (only the ring, where it flies), else the
  // whole ship; spin — the ring's turn on its turntable (rad)
  draw(ctx, id, ang, roll = 0, pitch = 0, opt) {
    if (!init()) return false;
    const E = want(id); if (!E || E.state !== "ready") return false;
    const M = SHIP_MODELS[id], pad = M.pad || PAD, L = (M.len || 1) * pad;   // (pad: a bigger picture round it, for parts that move far out)
    const part = E.spin && opt ? opt.part || "" : "", sp = E.spin && opt ? opt.spin || 0 : 0;
    const pp = E.parts && opt && opt.parts ? opt.parts.map((q) => Math.round(q.x * 500) + "," + Math.round(q.z * 500) + "," + Math.round(q.a * 200)).join(";") : "";
    const pk = Math.round(ang * 200) + "|" + Math.round(roll * 200) + "|" + Math.round(pitch * 200) + part + "|" + Math.round(sp * 200) + "|" + pp + (opt && opt.lights ? "|L" + opt.lights.map((q) => q.color + Math.round(q.z * 100) + "," + Math.round(q.i * 10)).join(",") : "") + (E.fan ? "|" + ((opt && opt.open) || []).map((a) => Math.round(a * 100)).join(",") : "") + (E.turns && opt && opt.turns ? "|" + opt.turns.map((a) => Math.round(a * 200)).join(",") : "") + (E.bands && opt && opt.bands ? "|" + opt.bands.map((b) => b.c + Math.round(b.lo * 100)).join(",") : "");   // (a new picture only when it has turned a quarter of a degree)
    // opt.lights: up to 3 coloured lights inside the ship ({ x, y, z } in the fitted model's units, before it is tilted;
    // color; i: how bright) — MIRAGE's light running up its prism
    if (!lamps) { lamps = [0, 1, 2].map(() => { const L = new THREE.PointLight(0xffffff, 0, 1.2, 1.6); scene.add(L); return L; }); }
    const LS = (opt && opt.lights) || [];
    lamps.forEach((L, i) => { const q = LS[i]; L.visible = !!q; if (q) { L.color.set(q.color); L.intensity = q.i; L.position.set(q.x, q.y, q.z).applyEuler(new THREE.Euler(-pitch, 0, -roll, "YXZ")); } });
    if (E.fan) { const O = (opt && opt.open) || [], nw = M.fan.narrow || 1; E.fan.forEach((P, i) => { const k = O[i] || 0; P.pivot.quaternion.identity().slerp(P.shut, 1 - k); const sl = M.fan.shorten || 1; P.squash.scale.set(sl + (1 - sl) * k, nw + (1 - nw) * k, 1); }); }   // (opt.open: how open each panel is, 0 shut .. 1 as modelled)
    if (E.turns) { const T = (opt && opt.turns) || []; E.turns.forEach((g, i) => g.rotation.set(0, -(T[i] || 0), 0)); }   // (opt.turns: the cage's and each ring's turn, screen-clockwise rad)
    if (E.bands) {   // (opt.bands: [{ lo, hi, c: "#rrggbb" }], the layers grown, from the middle out)
      const Bd = (opt && opt.bands) || []; E.bands.uN.value = Math.min(5, Bd.length);
      Bd.slice(0, 5).forEach((b, j) => { E.bands.uLo.value[j] = b.lo; E.bands.uHi.value[j] = b.hi; E.bands.uC.value[j].set(b.c); });
    }
    if (E.parts) {   // (opt.parts: where each part's middle is, and its turn — screen-clockwise rad; else as in the file)
      const s = E.obj.scale.x, Q = opt && opt.parts;
      E.parts.forEach((B, i) => { const q = Q && Q[i]; B.pivot.position.set((q ? q.x : B.cx) / s, 0, (q ? q.z : B.cz) / s); B.pivot.rotation.set(0, q ? -q.a : 0, 0); });
    }
    if (E.spin) { E.spin.visible = part !== "hull"; E.spin.rotation.y = -sp; for (const H of E.hull) H.visible = part !== "ring"; }
    let c = cached(id, pk);
    if (c) { c.t = performance.now(); ctx.drawImage(c.cv, -L / 2, -L / 2, L, L); return true; }
    root.clear(); root.add(E.obj);
    E.obj.rotation.set(-pitch, 0, -roll, "YXZ");   // (pitch > 0: the nose away from the camera, into the screen; then rolled round the nose)
    // the light fixed in space: the picture gets turned by `ang` on the screen, so the light here turns the other way
    const lx = -0.55, lz = -0.6, ca = Math.cos(-ang), sa = Math.sin(-ang);
    key.position.set(lx * ca - lz * sa, 1.1, lx * sa + lz * ca);
    rim.position.set(-(lx * ca - lz * sa), 0.4, -(lx * sa + lz * ca));
    if (cam.right !== pad / 2) { cam.left = cam.bottom = -pad / 2; cam.right = cam.top = pad / 2; cam.updateProjectionMatrix(); }
    R.render(scene, cam);
    c = store(id, pk); c.t = performance.now();
    ctx.drawImage(c.cv, -L / 2, -L / 2, L, L);
    return true;
  },
};
window.Ship3D = Ship3D;
