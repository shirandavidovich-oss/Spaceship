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
// (BLOOM's rigged petals and pollen, the Bloom 3D Motion package: loaded only when BLOOM is, and on its own — if it ever
// fails, only BLOOM goes without its motion; the rest of the 3D ships are not held up by it)
const ZAX = new THREE.Vector3(0, 0, 1);
const SKARN_REST = { armor: [0, 0, 0], siege: false, open: 0, kick: 0, flash: 0, primaryFlash: 0, stored: 0 };
let bloomLib = null, xelLib = null, vexLib = null, irisLib = null, propLib = null, balLib = null, frankLib = null, rivetLib = null, skarnLib = null, huskLib = null, glitchLib = null, puffLib = null, vaultLib = null;   // (balLib: BALLAST's counterweight cylinder and mine bay)   // (propLib: BOILER's underwater propulsor)   // (irisLib: the fitted iris hatches of THUL and COURIER)   // (XELTAR's the same way: the Xeltar 3D Motion package)

// per ship: its file; which way its nose points in the file (fwd: "+x" | "-x" | "+z" | "-z"); turn: an extra turn
// round its up axis (rad) to line it up with the 2D drawing; len: its length on screen, in the 2D drawing's units
// (the 2D ship is about 1 long; with fit: "max", its widest way across); up: which way is its top in the file ("+y", or "-y" if it came upside down)
export const SHIP_MODELS = {
  fresnel: { file: "models/fresnel.glb", fwd: "+x", len: 0.68 },
  boiler: { file: "models/boiler-prop.glb", fwd: "+z", len: 0.8, prop: true },   // (its underwater propulsor, the BOILER package: doors, locks, piston, folding propeller — opt.prop)
  brass: { file: "models/thul-iris.glb", fitIris: "Thul", fwd: "-x", len: 0.85, gears: [   // (THUL's moving gears: makeGears — measured off the model's own gears, in the file's units)
    { c: [0.012, 0.008], r: 0.212, z: [-0.122, -0.045], teeth: 36, dir: 1, spokes: 7 },    // the big wheel, right of the spine
    { c: [-0.04, -0.085], r: 0.1, z: [0.128, 0.19], teeth: 16, dir: -1, spokes: 5 },     // left of the spine, the outer pair
    { c: [0.088, 0.03], r: 0.085, z: [0.128, 0.19], teeth: 14, dir: 1, spokes: 5 },
    { c: [0.15, 0.015], r: 0.1, z: [0.078, 0.128], teeth: 18, dir: -1, spokes: 6 },     // under them, toward the tail
    { c: [-0.065, -0.056], r: 0.068, z: [-0.235, -0.13], teeth: 12, dir: -1, spokes: 4 }, // the small one by the right pod
    { axis: "x", c: [0.01, 0.58], r: 0.2, z: [-0.02, 0.08], teeth: 30, dir: 1, spokes: 6, drive: "cannon" },   // the heavy cannon's ring gear, round its barrel
  ],   // (its cannon's iris is in the model now: the Thul fitted iris package — fitIris)
    slide: { box: [[-1.0, -0.5, -0.76], [-0.715, 0.5, -0.46]], dir: [1, 0, 0], dist: 0.05 } },   // (its machine gun's barrels: splitSlide — kicked back toward the tail as it fires)   // (the heavy cannon's iris, its face at x; back: as deep as the bore)
  puff: { file: "models/puff.glb", fwd: "-x", len: 0.8 },
  // PUFF puffed up (the PUFF package): its membrane swelling into twelve lobes, canopy and twelve copper spines riding it;
  // the burst and crumple; puffing up again from crumpled — opt.puff. unit: 0.00755 a sprite px, as the 2D drawing's
  // 2.0 ship-lengths a 560 px canvas
  puffbig: { file: "models/puff-anim.glb", fwd: "-x", len: 1.0, unit: 0.473, origin: true, pad: 2.3, puffRig: true },
  xeltar: { file: "models/xeltar-rigged.glb", fwd: "-x", len: 0.95, xelRig: true, pad: 1.5 },
  xcrystal: { file: "models/xeltar-crystal.glb", fwd: "+z", len: 1, fit: "max" },   // (XELTAR's rear crystal flying: the same cut ice, its own model)   // (the rigged squid from the Xeltar 3D Motion package: fins always beating, its five rear arms swimming with the gas and gathering for the crystal)
  strata: { file: "models/strata.glb", fwd: "-x", len: 0.95 },
  skarn: { file: "models/skarn-anim.glb", fwd: "-x", len: 0.95, fit: "max", skarnRig: true },   // (the SKARN package: its jaws, six armour ribs, locks, stored-charge lights and muzzle flashes — opt.skarn, the 2D controller's pose)
  glitch: { file: "models/glitch-angular.glb", fwd: "-x", len: 1.0, unit: 0.5026, origin: true, pad: 1.7, glitchRig: true },   // (the GLITCH package, rebuilt from its sprites: the shutter plates and links move — opt.glitch; unit: 0.0068 a sprite px, as the 2D drawing's 1.75 ship-lengths a 512 px canvas)
  borer: { file: "models/borer-drill.glb", fwd: "-x", len: 1.0, drill: true },   // (its spiral drill on its own bearing, the BORER package: turned by opt.drill, radians)
  corsair: { file: "models/corsair.glb", fwd: "-x", len: 0.85, ghost: true },
  // CORSAIR's oars (the Corsair 3D oars package): one textured oar, its pivot at the oarlock and its blade tip one unit
  // out along +x — drawn once pointing up, then laid along each oar (corsairOars3d); and the ghost ship's teal one
  corsairoar: { file: "models/corsair-oar.glb", fwd: "+x", len: 1, unit: 1, origin: true, pad: 2.6, strip: ["Corsair_Oarlock"] },
  corsairoarh: { file: "models/corsair-oar-haunted.glb", fwd: "+x", len: 1, unit: 1, origin: true, pad: 2.6, strip: ["Corsair_Oarlock"] },
  // CINDER: its complete combat rig (the package's hull, its two motor pods on swivels, carriages and CV axles, the two
  // bumper hatches cut from its own bumper) — cinderRig: opt.dash { side: "L"|"R", ms } plays that slip's clip;
  // opt.launch { L, R: seconds into that hatch's clip; loadL/R: a missile seated in the bay; slideL/R: 0..1 of its way out
  // along the bay's rail, stow socket to clear socket }
  cinder: { file: "models/cinder-rig.glb", fwd: "-z", len: 0.98, upright: 1, cinderRig: true, strip: ["Cinder_Missile_Demo_Only"] },
  // its missile flying (the package's fitted missile, in the ship's file frame and scale): whole, then the upper stage
  // alone with its engine lit (opt.ignite: seconds into its ignition clip), and the spent booster tumbling away
  cindermissile: { file: "models/cinder-missile.glb", fwd: "-z", len: 0.98, upright: 1, unit: 0.5157, origin: true, pad: 1.6 },
  cinderstage2: { file: "models/cinder-missile.glb", fwd: "-z", len: 0.98, upright: 1, unit: 0.5157, origin: true, pad: 1.6, strip: ["Cinder_Stage1_Booster"], ignite: true },
  cinderbooster: { file: "models/cinder-missile.glb", fwd: "-z", len: 0.98, upright: 1, unit: 0.5157, origin: true, pad: 1.6, strip: ["Cinder_Stage2"] },
  lyth: { file: "models/lyth.glb", fwd: "-z", len: 1.03, fit: "max", split: 0.37 },
  lariat: { file: "models/lariat.glb", fwd: "+z", len: 1.03, upright: -1,
    drum: { c: [-0.205, -0.13], r: 0.128, x: [-0.13, 0.13], fl: 0.175, hide: 0.18 },   // (its cable drum, round the file's x: makeDrum)
    claw: [[0.08, 0.745, -0.4], [0.5, 1.0, 0.4]] },   // (the claw at the boom's tip, hidden while it is out on the cable)
  // LARIAT's claw flying on its cable (the Lariat original 3D grapple package: the hull's own two worn jaws, cut free,
  // each turning on its hinge — opt.jaw, degrees each side). Its root is the cable's coupling; +y forward and +z up in its
  // file (upright); the hull's own file units, 0.5418 ship-lengths each
  lariatclaw: { file: "models/lariat-claw.glb", fwd: "-z", upright: 1, len: 0.3, unit: 0.5418, origin: true, lariatClaw: true },
  palisade: { file: "models/palisade.glb", fwd: "-z", len: 1.05, fit: "max", upright: 1 },
  courier: { file: "models/courier-clean.glb", fwd: "-x", len: 0.855, fitIris: "Courier" },   // (the eight-blade iris in its package tube: the Courier fitted iris package — fitIris)
  kiln: { file: "models/kiln.glb", fwd: "+x", len: 1.03, wheel: { c: [0.494, 0.127, 0], tilt: 0.26, r: 0.185, h: [-0.03, 0.06] },
    grille: { x: [0.695, 0.8], y: [-0.105, 0.055], z: [-0.265, 0.265], n: 12 } },   // (its furnace grille at the nose: makeGrille)   // (the valve wheel on its sloping deck: splitWheel)
  // DRAKON (the Drakon pipe split package): its two pieces modelled apart along the channel between its pipes, the cut
  // faces closed and the pipe ends capped — the front piece the big canopy, the back one the twin exhausts
  drakon: { file: "models/drakon-split.glb", fwd: "+x", len: 0.95, pieces: { front: "Drakon_Cockpit", back: "Drakon_TwinExhaust" },
    beacon: { material: "Rift coupling indicators", at: "Drakon_TwinExhaust_SeamFX", out: [0.08, 0.04, 0.06], reach: 0.6, power: 0.5 } },   // (its broken pipes' warning light: makeBeacon; out: just outside the pipe cluster, file units)
  vault: { file: "models/vault-lock.glb", fwd: "-z", upright: 1, len: 0.94, pad: 2.0, scale3: [1, 1.08, 0.752], vaultRig: true, strip: ["Vault_PreviewStar"] },   // (the VAULT dual-lock package: its lock face up, as the 2D drawing's — each face's six bolts, wheel and two flaps, its firing pins and piston, opt.vault; the cube 0.94 ship-lengths across)
  orian: { file: "models/orian.glb", fwd: "-x", len: 0.9, fan: { back: -0.055, hinge: [0, -0.085, -0.07], normal: [0, 0.94, -0.34], cuts: [-46, -15, 15, 46], round: [144, 72, 0, -72, -144], cone: 9, narrow: 0.45, shorten: 0.72 } },   // (shut: narrower across, and shorter — the sheath of the 2D drawing)
  vanta: { file: "models/vanta.glb", fwd: "-x", len: 0.98, erase: true },   // (its painted ribbon wiped: the game's own liquid goes in the chamber)
  mirage: { file: "models/mirage.glb", fwd: "-x", len: 1.0 },
  gimbal: { file: "models/gimbal.glb", fwd: "-z", len: 1.03, upright: 1, gyro: { cz: 0.0513, spine: 0.045, bar: 0.045, rings: [[0.14, 0.245], [0.245, 0.31], [0.31, 0.4]] } },
  talus: { file: "models/talus.glb", fwd: "-z", len: 0.89, upright: 1, bands: true },
  reprise: { file: "models/reprise.glb", fwd: "+z", len: 0.787, upright: -1, blocks: [0.375, 0.02, -0.30], pad: 2.9 },   // (its four buildings, tallest first)
  ballast: { file: "models/ballast-wing.glb", wingRig: true, mirror: true, towMine: true, pad: 2.0, fwd: "-x", len: 0.95, bumper: { x: -0.951, y: -0.168, z: [-0.355, 0.275], slope: 0.27, d: 0.075 } },   // (its front bumper: the nose's front edge, makeBumper)
  zorian: { file: "models/zorian.glb", fwd: "-x", len: 0.9 },
  cantor: { file: "models/cantor.glb", fwd: "+z", len: 0.95 },
  frankenstein: { file: "models/frankenstein-rig.glb", fwd: "-x", len: 1.0, frankRig: true },   // (its workshop tools, the FRANKENSTEIN package: forceps arms, roof flaps, saw, hammers — opt.prep, seconds into the surgery)
  // FRANKENSTEIN's creature, the four donor parts (opt.parts: how far each has come in, 0..1); kept on its native origin
  // (the 2D slots' middle) at `unit` ship-lengths a model unit
  frankcreature: { file: "models/frankenstein-creature.glb", fwd: "-x", len: 1.3, unit: 0.505, origin: true, creature: true },
  vexar: { file: "models/vexar-rigged.glb", fwd: "-x", len: 0.95, vexRig: true, pad: 1.5 },   // (the rigged hull from the Vexar 3D Weapon 2 package: claws, rear covers and stern forks open, the egg grows in its chamber)
  vegg_mixed: { file: "models/vexar-egg-mixed.glb", fwd: "-x", len: 1, fit: "max" }, vegg_ember: { file: "models/vexar-egg-ember.glb", fwd: "-x", len: 1, fit: "max" },   // (its laid eggs, one per brood)
  vegg_azure: { file: "models/vexar-egg-azure.glb", fwd: "-x", len: 1, fit: "max" }, vegg_prism: { file: "models/vexar-egg-prism.glb", fwd: "-x", len: 1, fit: "max" },
  labyrinth: { file: "models/labyrinth.glb", fwd: "-x", len: 0.95 },
  kraal: { file: "models/kraal.glb", fwd: "+x", len: 0.75 },
  flipper: { file: "models/flipper.glb", fwd: "+x", len: 0.9, paddles: [   // (its two paddles: splitPaddles — hub to tip, in the file's units)
    { hub: [0.533, 0.21, 0.389], tip: [0.6, 0.38, 0.93], r: 0.13 },
    { hub: [0.511, 0.21, -0.444], tip: [0.78, 0.09, -0.91], r: 0.12 },
  ] },
  rivet: { file: "models/rivet-mech.glb", fwd: "-x", len: 0.82, origin: true, rivetRig: true },   // (the RIVET package: its pin piston, rail cover, jaws, emitter and clutch, and its whole hull turning on the 2D pivot — opt.rivet; origin: its own pivot, the 2D drawing's)
  nimbus: { file: "models/nimbus.glb", fwd: "-x", len: 0.95, cloud: true, pad: 2.2 },   // (the bare ship: its cloud is ours, makeCloud)
  husk: { file: "models/husk-arm.glb", fwd: "-x", len: 1.05, huskRig: true },   // (the HUSK package: its tank lids, the long arm with its jaws, the two barrels — opt.husk, each channel a clip and its ms)
  bloom: { file: "models/bloom-rigged.glb", fwd: "-z", len: 0.8, fit: "max", upright: 1, bloomRig: true, pollen: 1.4, pad: 2.0 },   // (the rigged flower: its petals bend with the airflow, pollen filaments trail; pollen: their size, bigger than the package's for more motion)
};

const PX = 512, PAD = 1.3;   // the off-screen picture's size (px), and its room round the ship (for rolling and tilting)
// a ship big on the screen (close to the camera) is drawn at twice that, so it stays sharp: PX_BIG once its picture would
// be more than BIG_AT px across on the screen (most of the time ships are far smaller: the usual PX, no extra work)
const PX_BIG = 1024, BIG_AT = 560;
// render `sc` through `cm` into the top-left `res` x `res` of the off-screen canvas (the rest untouched)
function renderAt(sc, cm, res) {
  R.setViewport(0, PX_BIG - res, res, res); R.setScissor(0, PX_BIG - res, res, res); R.setScissorTest(true);
  R.render(sc, cm); R.setScissorTest(false);
}
let R = null, scene, cam, key, rim, root, lamps = null;
const models = {};
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);

function init() {
  if (R) return true;
  try {
    const cv = document.createElement("canvas"); cv.width = cv.height = PX_BIG;
    R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true, powerPreference: "high-performance" });
  } catch (e) { R = null; return false; }
  R.setPixelRatio(1); R.setSize(PX_BIG, PX_BIG, false); R.setClearColor(0x000000, 0);
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
function store(id, key, res = PX) {
  const A = poseCache[id] || (poseCache[id] = []);
  let c = A.length < 2 ? null : A.sort((a, b) => a.t - b.t)[0];   // (two per ship: the same ship on both sides)
  if (!c) { const cv = document.createElement("canvas"); c = { cv, cx: cv.getContext("2d") }; A.push(c); }
  if (c.cv.width !== res) { c.cv.width = c.cv.height = res; }   // (a picture of the size this one was drawn at)
  c.key = key; c.cx.clearRect(0, 0, res, res); c.cx.drawImage(R.domElement, 0, 0, res, res, 0, 0, res, res); return c;
}
// fit a loaded model: centred, nose to -z (the screen's up), top to +y, 1 long
function fit(obj, M) {
  obj.removeFromParent(); obj.position.set(0, 0, 0); obj.rotation.set(M.upright ? -Math.PI / 2 * M.upright : 0, 0, 0); if (M.scale3) obj.scale.set(...M.scale3); obj.updateMatrixWorld(true);   // (scale3: stretched along its own file axes — VAULT made a true cube)   // (upright: a model standing up, facing +z (1) or -z (-1): laid down, its face up)
  const box = new THREE.Box3().setFromObject(obj), c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3());
  const along = M.fit === "max" ? Math.max(s.x, s.z) : M.fwd[1] === "x" ? s.x : s.z;   // (fit "max": its widest way across, for a ship wider than it is long)
  const inner = new THREE.Group(); if (!M.origin) obj.position.sub(c); inner.add(obj);   // (origin: kept where its file has it)
  const turn = { "-z": 0, "+z": Math.PI, "-x": -Math.PI / 2, "+x": Math.PI / 2 }[M.fwd] + (M.turn || 0);
  inner.rotation.y = turn; if (M.up === "-y") inner.rotation.z = Math.PI; if (M.squash) inner.scale.y = M.squash;   // (squash: a model much deeper than it is wide, made flatter, so it does not swing about as it tilts)
  const outer = new THREE.Group(); outer.add(inner); outer.scale.setScalar(M.unit ? M.unit / (M.len || 1) : 1 / along); if (M.mirror) outer.scale.x = -outer.scale.y;   // (unit: a fixed size, ship-lengths a model unit)   // (mirror: a model made the other way round from the 2D drawing, turned to match it — BALLAST: its tow wing on the right, its weight on the left)
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
  // each cut's two faces: what of each block lies right against the cut (in the file's units), to close it with a wall
  const sides = M.blocks.map(() => [new THREE.Box3(), new THREE.Box3()]);   // ([the block on its high side, on its low side])
  meshes.forEach((m, mi) => {
    const g = m.geometry, P = g.attributes.position, idx = g.index ? g.index.array : null, cnt = idx ? idx.length : P.count;
    const toFile = new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld), fx = new Float32Array(P.count);
    for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); w.copy(v).applyMatrix4(toFile); fx[i] = w.x; }
    for (let t = 0; t < cnt; t += 3) {
      const a = idx ? idx[t] : t, b = idx ? idx[t + 1] : t + 1, c = idx ? idx[t + 2] : t + 2, x = (fx[a] + fx[b] + fx[c]) / 3;
      let k = 0; while (k < M.blocks.length && x <= M.blocks[k]) k++;
      lists[mi][k].push(a, b, c);
      for (const q of [a, b, c]) {   // (corners within reach of a cut: they show how big that cut face is)
        w.fromBufferAttribute(P, q).applyMatrix4(toFile);
        M.blocks.forEach((cx, j) => { if (Math.abs(w.x - cx) < 0.03) sides[j][w.x > cx ? 0 : 1].expandByPoint(w); });
      }
      for (const q of [a, b, c]) boxes[k].expandByPoint(v.fromBufferAttribute(P, q).applyMatrix4(m.matrixWorld));
    }
  });
  E.parts = boxes.map((B) => { const c = B.getCenter(new THREE.Vector3()), z = B.getSize(new THREE.Vector3()); const pivot = new THREE.Group(); outer.add(pivot); pivot.position.set(c.x / s, 0, c.z / s); return { pivot, cx: c.x, cz: c.z, w: z.x, h: z.z }; });
  outer.updateMatrixWorld(true);
  // the walls closing the cuts: a panel of the hull's dark metal, its own rows of lit windows, on each block's cut side
  // (the model has nothing there: the buildings stood against each other)
  const cv = document.createElement("canvas"); cv.width = cv.height = 128; const c2 = cv.getContext("2d");
  c2.fillStyle = "#2e3038"; c2.fillRect(0, 0, 128, 128); c2.strokeStyle = "#1a1b21"; c2.lineWidth = 2;
  for (let i = 0; i <= 4; i++) { c2.beginPath(); c2.moveTo(0, i * 32); c2.lineTo(128, i * 32); c2.stroke(); c2.beginPath(); c2.moveTo(i * 32, 0); c2.lineTo(i * 32, 128); c2.stroke(); }
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if ((x * 7 + y * 3) % 5 < 3) { c2.fillStyle = (x + y) % 3 ? "#c9a25a" : "#e9d79a"; c2.fillRect(x * 32 + 10, y * 32 + 12, 12, 8); }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  const wallMat = new THREE.MeshStandardMaterial({ map: tex, metalness: 0.55, roughness: 0.6, emissive: 0x2a2010, emissiveMap: tex, emissiveIntensity: 0.5, side: THREE.DoubleSide });
  M.blocks.forEach((cx, j) => [0, 1].forEach((side) => {
    // (the face they shared: where both blocks reach the cut — the walls are as big as that, not more)
    const A0 = sides[j][0], A1 = sides[j][1]; if (A0.isEmpty() || A1.isEmpty()) return;
    const B = new THREE.Box3(new THREE.Vector3(cx, Math.max(A0.min.y, A1.min.y), Math.max(A0.min.z, A1.min.z)), new THREE.Vector3(cx, Math.min(A0.max.y, A1.max.y), Math.min(A0.max.z, A1.max.z)));   // (only up and across: they meet at the cut)
    if (B.max.y <= B.min.y || B.max.z <= B.min.z) return;
    const k = j + (side ? 1 : 0), sz = B.getSize(new THREE.Vector3()), mid = B.getCenter(new THREE.Vector3());
    const t = tex.clone(); t.needsUpdate = true; t.repeat.set(Math.max(1, sz.z / 0.3), Math.max(1, sz.y / 0.3));
    const mat = wallMat.clone(); mat.map = t; mat.emissiveMap = t;
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(sz.z * 0.98, sz.y * 0.98), mat); wall.frustumCulled = false;
    wall.rotation.y = side ? -Math.PI / 2 : Math.PI / 2;   // (facing out of its block, across the cut)
    wall.position.set(cx + (side ? -0.003 : 0.003), mid.y, mid.z); raw.add(wall); wall.updateMatrixWorld(true);
    E.parts[k].pivot.attach(wall);
  }));
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
// a model with a liquid painted into its texture (VANTA: `erase`, the green ribbon in its chamber): wiped out of the
// pictures in the shader (the painted liquid (green: its own shape in the model) is cut away, what is left of its edge turned to the glass round it), so the
// game can pour its own moving, coloured liquid in there
function eraseGreen(E) {
  E.obj.traverse((m) => {
    if (!m.isMesh) return;
    const mat = m.material.clone(); m.material = mat;
    mat.onBeforeCompile = (sh) => {
      sh.fragmentShader = sh.fragmentShader.replace("#include <map_fragment>", "#include <map_fragment>\nfloat grn = smoothstep(0.0, 0.018, diffuseColor.g - max(diffuseColor.r, diffuseColor.b));\nif (grn > 0.5) discard;\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.16, 0.16, 0.19), grn);")
        .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance *= 1.0 - grn;");
    };
    mat.customProgramCacheKey = () => "erase";
  });
}
// a ship that turns into a ghost (CORSAIR's haunting: `ghost`): uG 0..1 how far. The hull goes pale and sea-green and
// glows; the red sails (told by their colour) go thin, glowing green and torn — holes in them, flickering, the edges of
// the holes eaten away as the time runs (uT). Mixed in the shader, so the same model serves both
function ghostShader(E) {
  const U = { uG: { value: 0 }, uT: { value: 0 } };
  E.obj.traverse((m) => {
    if (!m.isMesh) return;
    const mat = m.material.clone(); m.material = mat;
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = "varying vec3 vGP;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvGP = position;");
      sh.fragmentShader = "varying vec3 vGP;\nuniform float uG;\nuniform float uT;\nfloat ghN(vec3 p) { return fract(sin(dot(floor(p), vec3(12.9898, 78.233, 37.719))) * 43758.5453); }\n" +
        sh.fragmentShader.replace("#include <map_fragment>", `#include <map_fragment>
float sail = smoothstep(0.015, 0.06, diffuseColor.r - max(diffuseColor.g, diffuseColor.b) * 1.35);
vec3 gp = vGP * 26.0; float tear = ghN(gp + vec3(0.0, floor(uT * 2.0), 0.0)) * 0.6 + ghN(gp * 0.37) * 0.4;
if (uG > 0.3 && sail > 0.5 && tear > 1.0 - 0.38 * uG) discard;
float lum = dot(diffuseColor.rgb, vec3(0.3, 0.55, 0.15));
vec3 ghostHull = vec3(lum) * vec3(0.55, 1.25, 1.05) + vec3(0.01, 0.04, 0.035);
vec3 ghostSail = vec3(0.12, 0.65, 0.48) * (0.6 + 0.4 * sin(uT * 4.0 + vGP.z * 30.0));
diffuseColor.rgb = mix(diffuseColor.rgb, mix(ghostHull, ghostSail, sail), uG);`)
        .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
totalEmissiveRadiance += vec3(0.1, 0.75, 0.55) * uG * (0.18 + sail * (0.55 + 0.35 * sin(uT * 5.0 + vGP.x * 40.0)));`);
    };
    mat.customProgramCacheKey = () => "ghost";
  });
  E.ghost = U;
}
// a ship that comes apart in two (DRAKON: `seam` [c, slope], the line z = c + slope x in the fitted model's units
// seen from above; the front piece, with the crystal, is the side toward the nose): cut along it at load, so either
// piece can be drawn alone (opt.half: "front" or "back") — the bomb left behind, and the ship flying on
function splitSeam(E, M) {
  const outer = E.obj; outer.updateMatrixWorld(true);
  const meshes = []; outer.traverse((o) => { if (o.isMesh) meshes.push(o); });
  const [c0, sl] = M.seam, v = new THREE.Vector3();
  E.halves = { front: [], back: [] };
  for (const m of meshes) {
    const g = m.geometry, P = g.attributes.position, idx = g.index ? g.index.array : null, n = idx ? idx.length : P.count;
    const X = new Float32Array(P.count), Z = new Float32Array(P.count);
    for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld); X[i] = v.x; Z[i] = v.z; }
    const fr = [], bk = [];
    for (let t = 0; t < n; t += 3) {
      const a = idx ? idx[t] : t, b = idx ? idx[t + 1] : t + 1, d = idx ? idx[t + 2] : t + 2;
      ((Z[a] + Z[b] + Z[d]) / 3 < c0 + sl * (X[a] + X[b] + X[d]) / 3 ? fr : bk).push(a, b, d);
    }
    for (const [L, key] of [[fr, "front"], [bk, "back"]]) {
      const G = new THREE.BufferGeometry(); for (const k in g.attributes) G.setAttribute(k, g.attributes[k]); G.setIndex(L);
      const Xm = new THREE.Mesh(G, m.material); Xm.frustumCulled = false;
      m.parent.add(Xm); Xm.position.copy(m.position); Xm.quaternion.copy(m.quaternion); Xm.scale.copy(m.scale);
      E.halves[key].push(Xm);
    }
    m.visible = false;
  }
}
// DRAKON's emergency beacon (`beacon`): the twin-exhaust piece's own copy of the pipe-end dots' material (theirs alone
// change colour) and a small, short-reach light just outside its pipe cluster (at its seam mark), for the blue and red
// to sweep over the black metal round the pipes. opt.beacon: "blue", "red", "dark" (between flashes), or none: as made
function makeBeacon(E, M) {
  const piece = E.obj.getObjectByName(M.pieces.back), mark = E.obj.getObjectByName(M.beacon.at);
  if (!piece) return;
  const mats = [];
  piece.traverse((o) => { if (o.isMesh && o.material && o.material.name === M.beacon.material) { o.material = o.material.clone(); mats.push(o.material); } });
  const light = new THREE.PointLight(0xffffff, 0, M.beacon.reach, 2);
  if (mark) { mark.add(light); light.position.set(...M.beacon.out); } else piece.add(light);
  E.beacon = { mats, base: mats.map((m) => ({ e: m.emissive.clone(), i: m.emissiveIntensity, c: m.color.clone() })), light };
}
const BEACON = { blue: [0.15, 0.45, 1], red: [1, 0.08, 0.06] };
function setBeacon(E, c) {
  const B = E.beacon;
  B.mats.forEach((m, i) => {
    if (!c) { m.emissive.copy(B.base[i].e); m.emissiveIntensity = B.base[i].i; m.color.copy(B.base[i].c); return; }
    const k = BEACON[c]; if (k) { m.emissive.setRGB(...k); m.emissiveIntensity = 4; m.color.setRGB(...k); } else { m.emissive.setRGB(0, 0, 0); m.color.setRGB(0.05, 0.05, 0.06); }
  });
  const k = c && BEACON[c]; B.light.intensity = k ? E.M.beacon.power : 0; if (k) B.light.color.setRGB(...k);
}
// CINDER's combat rig (`cinderRig`): its clips ready to be sampled (each slip's clip, each hatch's), and a fitted
// missile seated at each bay's stow socket
function makeCinderRig(E, g) {
  const mx = new THREE.AnimationMixer(g.scene), act = {};
  for (const n of ["Magic_Dash_L", "Magic_Dash_R", "Hatch_L_Fire", "Hatch_R_Fire"]) {
    const c = g.animations.find((a) => a.name === "Cinder_" + n); if (c) { act[n] = mx.clipAction(c); act[n].play(); act[n].paused = true; }
  }
  E.launch = { mx, act, stow: {}, path: {} };
  new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).load("models/cinder-missile.glb", (m) => {
    for (const s of ["L", "R"]) {
      const at = g.scene.getObjectByName("Cinder_Missile_Stow_" + s), to = g.scene.getObjectByName("Cinder_Missile_Clear_" + s); if (!at) continue;
      const c = m.scene.clone(true); at.add(c); c.traverse((o) => { if (o.isMesh) o.frustumCulled = false; }); E.launch.stow[s] = c;
      E.launch.path[s] = to ? to.position.clone().sub(at.position) : new THREE.Vector3(0, 0.346, 0);
    }
    delete poseCache[E.id];
  });
}
// NIMBUS's cloud (`cloud`): the model is the bare ship; its cloud is ours — soft puffs (sprites of a drawn puff) in two
// banks along its sides and a few hugging its spine, each turning slowly round its own place. opt.cloud: { t, power
// (the gas: the puffs churn faster and wider), boost (0..1: the banks drag away from the hull, back and out, thinning,
// so the ship shows), flash (0..1: lightning lighting them from inside) }
let puffTex = null;
function puffTexture() {
  if (puffTex) return puffTex;
  const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d");
  for (let i = 0; i < 22; i++) {   // a puff: many soft blobs, a cauliflower edge
    const a = Math.random() * Math.PI * 2, d = Math.pow(Math.random(), 0.7) * 34, cx = 64 + Math.cos(a) * d, cy = 64 + Math.sin(a) * d, r = 12 + Math.random() * 18;
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, "rgba(255,255,255,0.5)"); g.addColorStop(0.55, "rgba(255,255,255,0.22)"); g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  }
  // its volume: lit from the upper left, shadowed toward the lower right (multiplied over the white)
  x.globalCompositeOperation = "source-atop";
  const sh = x.createLinearGradient(30, 30, 110, 110); sh.addColorStop(0, "rgba(255,255,255,0)"); sh.addColorStop(0.55, "rgba(120,140,175,0.25)"); sh.addColorStop(1, "rgba(70,85,120,0.55)");
  x.fillStyle = sh; x.fillRect(0, 0, 128, 128);
  puffTex = new THREE.CanvasTexture(c); puffTex.colorSpace = THREE.SRGBColorSpace; return puffTex;
}
function makeCloud(E) {
  const outer = E.obj, G = new THREE.Group(); G.scale.setScalar(1 / outer.scale.x); outer.add(G);
  const puffs = [], rnd = (a, b) => a + Math.random() * (b - a);
  for (let i = 0; i < 120; i++) {
    const spine = i >= 104, side = i % 2 ? 1 : -1, z = spine ? rnd(-0.3, 0.4) : rnd(-0.22, 0.46), w = 0.1 + 0.32 * clampN((z + 0.22) / 0.68);   // (the banks widen toward the back)
    const ax = spine ? side * rnd(0.045, 0.08) : side * rnd(0.09, 0.09 + w), ay = spine ? rnd(-0.05, 0.06) : rnd(-0.07, 0.07), size = spine ? rnd(0.07, 0.12) : rnd(0.1, 0.23);
    const mat = new THREE.SpriteMaterial({ map: puffTexture(), transparent: true, depthWrite: false, color: 0xc4d6ee, opacity: 0.85, rotation: rnd(-0.4, 0.4) });
    const sp = new THREE.Sprite(mat); sp.scale.setScalar(size); sp.position.set(ax, ay, z); sp.renderOrder = 2; G.add(sp);
    puffs.push({ sp, mat, ax, ay, az: z, size, ph: Math.random() * 6.3, sp0: rnd(0.4, 1.0) * (Math.random() < 0.5 ? -1 : 1), side, spine, tone: new THREE.Color().setHSL(0.6, rnd(0.15, 0.35), rnd(0.72, 0.92)) });
  }
  E.cloud = { G, puffs };
}
function clampN(v) { return Math.max(0, Math.min(1, v)); }
function moveCloud(E, C) {
  const t = C.t || 0, pw = C.power || 0, bs = C.boost || 0, fl = C.flash || 0, hot = new THREE.Color(0xf4fbff);
  for (const P of E.cloud.puffs) {
    const sp = P.sp0 * (0.5 + 2.6 * pw), a = P.ph + t * sp, rr = 0.015 + 0.05 * pw;
    const out = P.spine ? 0.3 : 1;   // (the boost drags the banks out and back: the hull shows)
    P.sp.position.set(P.ax + Math.cos(a) * rr + P.side * bs * 0.22 * out, P.ay + Math.sin(a * 1.3) * rr * 0.6, P.az + Math.sin(a) * rr + bs * 0.18 * out);
    P.mat.rotation = 0.3 * Math.sin(P.ph + t * sp * 0.35);   // (rocking, keeping its lit side up)
    P.sp.scale.setScalar(P.size * (1 + 0.12 * Math.sin(t * 1.7 + P.ph) + 0.2 * pw) * (1 - 0.25 * bs));
    P.mat.opacity = (0.8 - 0.4 * bs * out) * (P.spine ? 0.75 : 1);
    P.mat.color.copy(P.tone).lerp(hot, clampN(fl * (0.6 + 0.4 * Math.sin(P.ph * 7 + t * 40))));
  }
}
// a ship's own gears made to turn (THUL: `gears`, in the model file's units; each { c: [x, y] its middle, r: to the tips of its
// teeth, z: [from, to] its thickness, teeth, dir: which way it turns, spokes }). The model is one piece, so at load its
// gears are cut out of the picture where they stand (a mask in its shader: nothing of the hull drawn inside each gear's
// round slab) and new brass gears put there, each on its own axle: E.gears. Turned by opt.gears (the drive's angle, rad:
// each gear turns by it times 14 / its teeth, its own way) and pushed back a little by opt.recoil (0..1) as a shot goes
function makeGears(E, M) {
  const raw = E.raw, list = M.gears, N = list.length;
  const brass = new THREE.MeshStandardMaterial({ color: 0xa47634, metalness: 0.8, roughness: 0.46, envMapIntensity: 0.9 });   // (the model's own worn brass)
  const dark = new THREE.MeshStandardMaterial({ color: 0x4a3a28, metalness: 0.7, roughness: 0.5, envMapIntensity: 1 });
  const rig = new THREE.Group(); raw.add(rig);   // (in the file's own units, as the gears were measured)
  const cannon = new THREE.Group(); rig.add(cannon);   // (the heavy cannon's parts: its ring gear and its iris, kicked back together)
  E.gears = { rig, cannon, list: [] };
  for (const G of list) {
    const r = G.r, root = r * 0.86, n = G.teeth, sh = new THREE.Shape();
    for (let i = 0; i < n; i++) {   // the teeth: a flat top, sloping sides
      const a = (i / n) * Math.PI * 2, w = (Math.PI * 2) / n;
      const pts = [[root, a], [r, a + w * 0.18], [r, a + w * 0.42], [root, a + w * 0.6]];
      pts.forEach(([rr, aa], k) => { const x = Math.cos(aa) * rr, y = Math.sin(aa) * rr; if (i === 0 && k === 0) sh.moveTo(x, y); else sh.lineTo(x, y); });
    }
    sh.closePath();
    const ns = G.spokes || 5, rimIn = root * 0.78, hub = r * 0.26;
    for (let k = 0; k < ns; k++) {   // the windows between the spokes
      const a0 = (k / ns) * Math.PI * 2 + 0.16, a1 = ((k + 1) / ns) * Math.PI * 2 - 0.16, h = new THREE.Path();
      h.absarc(0, 0, rimIn, a0, a1, false); h.absarc(0, 0, hub, a1, a0, true); h.closePath(); sh.holes.push(h);
    }
    const th = G.z[1] - G.z[0], bev = Math.min(th * 0.18, r * 0.04);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: th - bev * 2, bevelEnabled: true, bevelThickness: bev, bevelSize: bev * 0.8, bevelSegments: 1, curveSegments: 6 });
    geo.translate(0, 0, G.z[0] + bev);
    const ax = G.axis === "x", axle = new THREE.Group(); rig.add(axle);
    if (ax) { axle.position.set(0, G.c[0], G.c[1]); axle.rotation.y = Math.PI / 2; } else axle.position.set(G.c[0], G.c[1], 0);   // (round x: its z along the file's x)
    if (G.drive === "cannon") { rig.remove(axle); E.gears.cannon.add(axle); }   // (on the cannon: kicked back with it)
    const wheel = new THREE.Mesh(geo, brass); wheel.frustumCulled = false; axle.add(wheel);
    const boss = new THREE.Mesh(new THREE.CylinderGeometry(hub * 0.75, hub * 0.75, th * 1.25, 6), dark);   // the hub: a hex nut on the axle
    boss.rotation.x = Math.PI / 2; boss.position.z = (G.z[0] + G.z[1]) / 2; boss.frustumCulled = false; axle.add(boss);
    E.gears.list.push({ axle: wheel, boss, k: (14 / n) * (G.dir || 1), drive: G.drive || "" });
  }
  if (M.iris) makeIris(E, M.iris, brass, dark);
  // the mask: the hull's own gears not drawn (each gear's round slab, a little inside its teeth' tips)
  const holes = list.map((G) => ({ c: G.c, r: G.r * 0.97, z: [G.z[0] - 0.004, G.z[1] + 0.004], ax: G.axis === "x" ? 1 : 0 }));
  if (M.iris) holes.push({ c: M.iris.c, r: M.iris.r * (M.iris.hole || 1), z: [M.iris.x - 0.02, M.iris.maskBack != null ? M.iris.maskBack : M.iris.back], ax: 1 });   // (maskBack, hole: only so deep and so wide — just the model's own blades, the tube round them kept)   // (the iris's own blades and what is behind them)
  const N2 = holes.length, uG = { value: holes.map((H) => new THREE.Vector4(H.c[0], H.c[1], H.r, H.ax)) }, uZ = { value: holes.map((H) => new THREE.Vector2(H.z[0], H.z[1])) };
  raw.traverse((o) => {
    if (!o.isMesh || o.parent === rig || rig.getObjectById(o.id) || inIris(o)) return;
    const uM = { value: o.matrix.clone() };   // (its quantized units to the file's)
    const mat = o.material = o.material.clone();
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uGearC = uG; sh.uniforms.uGearZ = uZ; sh.uniforms.uToFile = uM;
      sh.vertexShader = "uniform mat4 uToFile;\nvarying vec3 vFile;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvFile = (uToFile * vec4(transformed, 1.0)).xyz;");
      sh.fragmentShader = `uniform vec4 uGearC[${N2}];\nuniform vec2 uGearZ[${N2}];\nvarying vec3 vFile;\n` + sh.fragmentShader.replace("void main() {", `void main() {\n  for (int i = 0; i < ${N2}; i++) { bool ax = uGearC[i].w > 0.5; float w = ax ? vFile.x : vFile.z; vec2 q = ax ? vFile.yz : vFile.xy; if (w > uGearZ[i].x && w < uGearZ[i].y && distance(q, uGearC[i].xy) < uGearC[i].z) discard; }`);
    };
    mat.customProgramCacheKey = () => "gears" + N2;
  });
}
// the heavy cannon's iris (THUL: `iris`; c: [y, z] its middle, x: its face, r: the blades' reach, back: the bore's depth,
// blades): its blades each on a pivot at the rim, swung out to open it (E.iris.open 0..1); behind them the dark bore with
// the cannonball, glowing as it charges (E.iris.glow)
function makeIris(E, I, brass, dark) {
  const g = new THREE.Group(); g.position.set(I.x, I.c[0], I.c[1]); g.rotation.y = Math.PI / 2; E.gears.cannon.add(g);   // (its z along the file's x: into the ship)
  const n = I.blades, R = I.r, w = (Math.PI * 2) / n, blades = [];
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x9a6c2e, metalness: 0.85, roughness: 0.42, envMapIntensity: 0.9, side: THREE.DoubleSide });
  const bladeMat2 = new THREE.MeshStandardMaterial({ color: 0x7a5424, metalness: 0.85, roughness: 0.5, envMapIntensity: 0.9, side: THREE.DoubleSide });
  for (let k = 0; k < n; k++) {
    // a blade: a curved wedge from the rim to the middle (built at the rim, pointing in along -x); opened, it draws back
    // toward the rim (squashed along its length from its rim end) as all of them twist round together — never past the rim
    const half = w * 0.62, sh = new THREE.Shape(), rim = (a) => [Math.cos(a) * R - R, Math.sin(a) * R];
    const p0 = rim(-half), p1 = rim(half); sh.moveTo(p0[0], p0[1]);
    for (let i = 1; i <= 6; i++) { const q = rim(-half + (2 * half * i) / 6); sh.lineTo(q[0], q[1]); }
    sh.quadraticCurveTo(-R * 0.45, R * 0.42, -R, 0.0); sh.quadraticCurveTo(-R * 0.55, -R * 0.05, p0[0], p0[1]);   // (curved like a swirl)
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.005, bevelEnabled: false, curveSegments: 6 });
    const turn = new THREE.Group(); turn.rotation.z = k * w; turn.position.z = k * 0.0016; g.add(turn);
    const m = new THREE.Mesh(geo, k % 2 ? bladeMat2 : bladeMat); m.position.x = R; m.rotation.x = 0.1; m.frustumCulled = false; turn.add(m); blades.push({ turn, m, a0: k * w });   // (tipped a little, every other one darker: the vanes read as overlapping)
  }
  const boreMat = new THREE.MeshStandardMaterial({ color: 0x120c08, metalness: 0.3, roughness: 0.8, emissive: 0xff4a00, emissiveIntensity: 0 });
  const bore = new THREE.Mesh(new THREE.CylinderGeometry(R * (I.boreR || 1.02), R * (I.boreR || 1.02), I.back - I.x - 0.03, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0x1a120c, metalness: 0.5, roughness: 0.7, side: THREE.BackSide }));
  bore.rotation.x = Math.PI / 2; bore.position.z = (I.back - I.x + 0.03) / 2; bore.frustumCulled = false; g.add(bore);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(R * (I.boreR || 1.02), 24), boreMat); floor.position.z = I.back - I.x; floor.rotation.y = Math.PI; floor.frustumCulled = false; g.add(floor);   // (facing out of the bore)
  const ballMat = new THREE.MeshStandardMaterial({ color: 0x7a4a22, metalness: 0.75, roughness: 0.35, emissive: 0xff6a10, emissiveIntensity: 0 });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(R * 0.42, 20, 14), ballMat); ball.position.z = 0.07; ball.frustumCulled = false; g.add(ball);
  E.iris = { blades, boreMat, ballMat, ball, open: 0 };
}
// a wheel lying on the hull, cut off at load onto an axle of its own so it can turn (KILN: `wheel`, in the model file's
// units: c — its middle; tilt — how far its axis leans toward the file's +x from straight up (the deck slopes); r — its
// reach with the toothed ring; h — from how far below to how far above its middle, along the axis). Kept with its own
// look (the same triangles and picture, just moved). E.wheel: { axle, base } — turned by opt.wheel (rad, screen-clockwise
// seen from above); opt.glow 0..1: the furnace light under it
function splitWheel(E, M) {
  const Wd = M.wheel, raw = E.raw; raw.updateMatrixWorld(true);
  const n = new THREE.Vector3(Math.sin(Wd.tilt), Math.cos(Wd.tilt), 0), C = new THREE.Vector3(...Wd.c);
  const axle = new THREE.Group(); axle.position.copy(C); axle.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n); raw.add(axle); axle.updateMatrixWorld(true);
  const base = axle.quaternion.clone(), meshes = [], v = new THREE.Vector3(), d = new THREE.Vector3();
  raw.traverse((o) => { if (o.isMesh) meshes.push(o); });
  for (const m of meshes) {
    const g = m.geometry, P = g.attributes.position, idx = g.index ? g.index.array : null, cnt = idx ? idx.length : P.count;
    const F = new Float32Array(P.count * 3);
    for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(m.matrix); F[i * 3] = v.x; F[i * 3 + 1] = v.y; F[i * 3 + 2] = v.z; }   // (in the file's units)
    const keep = [], turn = [];
    for (let t = 0; t < cnt; t += 3) {
      const a = idx ? idx[t] : t, b = idx ? idx[t + 1] : t + 1, c = idx ? idx[t + 2] : t + 2;
      d.set((F[a * 3] + F[b * 3] + F[c * 3]) / 3, (F[a * 3 + 1] + F[b * 3 + 1] + F[c * 3 + 1]) / 3, (F[a * 3 + 2] + F[b * 3 + 2] + F[c * 3 + 2]) / 3).sub(C);
      const h = d.dot(n), rad = d.addScaledVector(n, -h).length();
      (rad < Wd.r && h > Wd.h[0] && h < Wd.h[1] ? turn : keep).push(a, b, c);
    }
    if (!turn.length) continue;
    const part = (L) => { const G = new THREE.BufferGeometry(); for (const k in g.attributes) G.setAttribute(k, g.attributes[k]); G.setIndex(L); const X = new THREE.Mesh(G, m.material); X.frustumCulled = false; m.parent.add(X); X.position.copy(m.position); X.quaternion.copy(m.quaternion); X.scale.copy(m.scale); X.updateMatrixWorld(true); return X; };
    part(keep); axle.attach(part(turn)); m.visible = false;
  }
  const glow = new THREE.PointLight(0xff9a40, 0, 0.32, 2); glow.position.set(0, 0.05, 0); axle.add(glow);
  E.wheel = { axle, base, glow };
}
// a grille of flaps that open (KILN: `grille`, a box in the model file's units — x: from the furnace's back wall out to the
// grille's face; y, z: its opening — and n flaps across it). The model's own grille is hidden there (a mask in its shader:
// nothing drawn inside the box) and n vertical flaps put in its place, each turning on its own upright axle like a blind:
// shut, flat across the opening; open (opt.flaps 1), edge-on, the furnace glowing through (opt.glow brightens it too)
function makeGrille(E, M) {
  const Gd = M.grille, raw = E.raw, g = new THREE.Group(); raw.add(g);
  const pitch = (Gd.z[1] - Gd.z[0]) / Gd.n, h = Gd.y[1] - Gd.y[0], cx = (Gd.x[0] + Gd.x[1]) / 2 + 0.02, cy = (Gd.y[0] + Gd.y[1]) / 2;
  const mat = new THREE.MeshStandardMaterial({ color: 0x55331f, metalness: 0.65, roughness: 0.6, envMapIntensity: 0.8 });
  const edge = new THREE.MeshStandardMaterial({ color: 0xb06a42, metalness: 0.7, roughness: 0.4, envMapIntensity: 0.9 });
  const flaps = [];
  for (let i = 0; i < Gd.n; i++) {
    const pv = new THREE.Group(); pv.position.set(cx, cy, Gd.z[0] + pitch * (i + 0.5)); g.add(pv);
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.008, h - 0.004, pitch * 1.12), mat); f.frustumCulled = false; pv.add(f);
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.012, h - 0.004, 0.006), edge); rib.position.z = pitch * 0.5; rib.frustumCulled = false; pv.add(rib);   // (a brighter lip on its edge)
    flaps.push(pv);
  }
  const glowMat = new THREE.MeshStandardMaterial({ color: 0x1a0c06, emissive: 0xff7a22, emissiveIntensity: 0.5, roughness: 0.9 });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(Gd.z[1] - Gd.z[0], h), glowMat); back.rotation.y = Math.PI / 2; back.position.set(Gd.x[0] + 0.002, cy, (Gd.z[0] + Gd.z[1]) / 2); back.frustumCulled = false; g.add(back);   // (the furnace's back wall, facing out of the nose)
  E.grille = { flaps, glowMat };
  // the mask: the model's own grille not drawn (inside the box)
  const B0 = { value: new THREE.Vector3(Gd.x[0], Gd.y[0], Gd.z[0]) }, B1 = { value: new THREE.Vector3(Gd.x[1], Gd.y[1], Gd.z[1]) };
  raw.traverse((o) => {
    if (!o.isMesh || g.getObjectById(o.id)) return;
    const uM = { value: o.matrix.clone() }, prev = o.material.onBeforeCompile;
    const m = o.material = o.material.clone();
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uB0 = B0; sh.uniforms.uB1 = B1; sh.uniforms.uToFile2 = uM;
      sh.vertexShader = "uniform mat4 uToFile2;\nvarying vec3 vFile2;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvFile2 = (uToFile2 * vec4(transformed, 1.0)).xyz;");
      sh.fragmentShader = "uniform vec3 uB0;\nuniform vec3 uB1;\nvarying vec3 vFile2;\n" + sh.fragmentShader.replace("void main() {", "void main() {\n  if (all(greaterThan(vFile2, uB0)) && all(lessThan(vFile2, uB1))) discard;");
    };
    m.customProgramCacheKey = () => "grille";
  });
}
// a ship's paddles cut off at load, each onto a hinge of its own at its hub (FLIPPER: `paddles`, in the model file's units:
// hub, tip — the paddle's line; r — how far from that line its blade reaches). A triangle is the paddle's if its middle is
// within r of the line from just behind the hub to past the tip, and not below the hub (the solenoids and springs under
// it stay). Kept with their own look. E.paddles: [{ hinge, base, s }] — swung by opt.paddles ([rad, rad], + = the tip
// toward the nose; s turns it the right way round for its side), round the upright through its hub
function splitPaddles(E, M) {
  const raw = E.raw; raw.updateMatrixWorld(true);
  const list = M.paddles.map((Pd) => {
    const H = new THREE.Vector3(...Pd.hub), D = new THREE.Vector3(...Pd.tip).sub(H), L = D.length(); D.normalize();
    const hinge = new THREE.Group(); hinge.position.copy(H); raw.add(hinge); hinge.updateMatrixWorld(true);
    return { Pd, H, D, L, hinge, s: Pd.tip[2] > 0 ? 1 : -1 };
  });
  const meshes = [], v = new THREE.Vector3(); raw.traverse((o) => { if (o.isMesh) meshes.push(o); });
  for (const m of meshes) {
    const g = m.geometry, P = g.attributes.position, idx = g.index ? g.index.array : null, cnt = idx ? idx.length : P.count;
    const F = new Float32Array(P.count * 3);
    for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(m.matrix); F[i * 3] = v.x; F[i * 3 + 1] = v.y; F[i * 3 + 2] = v.z; }
    const lists = list.map(() => []), keep = [];
    // the pieces of the mesh (triangles joined by shared corners): a piece lying mostly on a paddle goes with it whole, so no
    // edge or underside of a blade is left behind; a piece shared with the hull is split corner by corner
    const up = new Int32Array(P.count); for (let i = 0; i < P.count; i++) up[i] = i;
    const root = (i) => { while (up[i] !== i) { up[i] = up[up[i]]; i = up[i]; } return i; };
    for (let t = 0; t < cnt; t += 3) { const a = root(idx ? idx[t] : t), b = root(idx ? idx[t + 1] : t + 1), c = root(idx ? idx[t + 2] : t + 2); up[b] = a; up[root(c)] = a; }
    const on = (q, Q, wide) => { v.set(F[q * 3], F[q * 3 + 1], F[q * 3 + 2]).sub(Q.H); const along = v.dot(Q.D), u = along / Q.L, y = F[q * 3 + 1];
      if (u < -0.12 || u > 1.15 + (wide ? 0.1 : 0) || (u < 0.22 && y < Q.H.y - 0.12)) return false;   // (by the hub, only what is level with it or above: the springs under it stay)
      return v.addScaledVector(Q.D, -along).length() < Q.Pd.r * 1.3 * (wide ? 1.35 : 1); };   // (out along the blade, its whole rim)
    const tri = []; const vote = new Map();   // (per piece: how many of its triangles are on each paddle, and how many in all)
    for (let t = 0; t < cnt; t += 3) {
      const a = idx ? idx[t] : t, b = idx ? idx[t + 1] : t + 1, c = idx ? idx[t + 2] : t + 2, R0 = root(a);
      let k = -1; list.forEach((Q, jj) => { if (k < 0 && on(a, Q, true) && on(b, Q, true) && on(c, Q, true)) k = jj; });
      let V = vote.get(R0); if (!V) { V = { n: 0, k: list.map(() => 0) }; vote.set(R0, V); }
      V.n++; if (k >= 0) V.k[k]++;
      tri.push(a, b, c, R0);
    }
    for (let t = 0; t < tri.length; t += 4) {
      const a = tri[t], b = tri[t + 1], c = tri[t + 2], V = vote.get(tri[t + 3]);
      let k = V.k.findIndex((n) => n >= V.n * 0.75);   // (a piece three-quarters on a paddle: all of it)
      if (k < 0) list.forEach((Q, jj) => { if (k < 0 && on(a, Q) && on(b, Q) && on(c, Q)) k = jj; });   // (else corner by corner)
      (k >= 0 ? lists[k] : keep).push(a, b, c);
    }
    if (!lists.some((L) => L.length)) continue;
    const part = (L) => { const G = new THREE.BufferGeometry(); for (const key in g.attributes) G.setAttribute(key, g.attributes[key]); G.setIndex(L); const X = new THREE.Mesh(G, m.material); X.frustumCulled = false; m.parent.add(X); X.position.copy(m.position); X.quaternion.copy(m.quaternion); X.scale.copy(m.scale); X.updateMatrixWorld(true); return X; };
    part(keep); lists.forEach((L, j) => { if (L.length) list[j].hinge.attach(part(L)); }); m.visible = false;
  }
  E.paddles = list.map((Q) => ({ hinge: Q.hinge, s: Q.s }));
}
// a cable drum made to roll (LARIAT: `drum`, in the model file's units — round the file's x through c: [y, z]; r: the
// wound cable's radius, x: its length, fl: the gold wheels' radius at its ends, hide: how far round the model's own drum is
// hidden). The model only has the half of its drum that faces up, so it cannot just be turned: the drum is hidden there (a
// mask in its shader) and a whole one made in its place — the wound cable (grooves along it, as in the 2D drawing) between
// two gold wheels with spokes — turned by opt.drum (rad). `claw`: a box round the claw at the boom's tip, hidden while
// opt.clawOut (the claw is away on the cable)
function makeDrum(E, M) {
  const Dm = M.drum, raw = E.raw, len = Dm.x[1] - Dm.x[0];
  const cv = document.createElement("canvas"); cv.width = 256; cv.height = 64; const c2 = cv.getContext("2d");
  c2.fillStyle = "#1e2023"; c2.fillRect(0, 0, 256, 64);
  for (let i = 0; i < 48; i++) {   // the cable's turns: dark grooves with a bright edge, along the drum
    const x = (i + 0.5) * 256 / 48, g = c2.createLinearGradient(x - 2.7, 0, x + 2.7, 0);
    g.addColorStop(0, "#0e0f12"); g.addColorStop(0.45, "#4a4e54"); g.addColorStop(0.6, "#767b82"); g.addColorStop(1, "#16181b");
    c2.fillStyle = g; c2.fillRect(x - 2.7, 0, 5.4, 64);
  }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = THREE.RepeatWrapping;
  const axle = new THREE.Group(); axle.position.set((Dm.x[0] + Dm.x[1]) / 2, Dm.c[0], Dm.c[1]); raw.add(axle);
  const spin = new THREE.Group(); axle.add(spin);   // (turned round x)
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(Dm.r, Dm.r, len, 40, 1, false), new THREE.MeshStandardMaterial({ map: tex, metalness: 0.75, roughness: 0.42, envMapIntensity: 0.9 }));
  cable.rotation.z = Math.PI / 2; cable.frustumCulled = false; spin.add(cable);
  const gold = new THREE.MeshStandardMaterial({ color: 0xb08a3c, metalness: 0.85, roughness: 0.38, envMapIntensity: 1 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x3a3026, metalness: 0.6, roughness: 0.55 });
  for (const side of [-1, 1]) {   // the gold wheels at its ends: a rim, spokes, a hub
    const sh = new THREE.Shape(); sh.absarc(0, 0, Dm.fl, 0, Math.PI * 2, false);
    for (let k = 0; k < 6; k++) { const a0 = k * Math.PI / 3 + 0.17, a1 = (k + 1) * Math.PI / 3 - 0.17, h = new THREE.Path(); h.absarc(0, 0, Dm.fl * 0.8, a0, a1, false); h.absarc(0, 0, Dm.fl * 0.32, a1, a0, true); h.closePath(); sh.holes.push(h); }
    const w = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.022, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 1, curveSegments: 18 }), gold);
    w.rotation.y = Math.PI / 2; w.position.x = side * len / 2 - (side > 0 ? 0 : 0.022); w.frustumCulled = false; spin.add(w);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(Dm.fl * 0.22, Dm.fl * 0.22, 0.04, 6), dark); hub.rotation.z = Math.PI / 2; hub.position.x = side * (len / 2 + 0.012); hub.frustumCulled = false; spin.add(hub);
  }
  // the mask: the model's own drum (round x, within `hide` of the axis, along the drum and its wheels), and the claw when out
  const uC = { value: new THREE.Vector4(Dm.c[0], Dm.c[1], Dm.hide, 0) }, uX = { value: new THREE.Vector2(Dm.x[0] - 0.035, Dm.x[1] + 0.035) };
  const uK0 = { value: new THREE.Vector3(...M.claw[0]) }, uK1 = { value: new THREE.Vector3(...M.claw[1]) }, uKon = { value: 0 };
  raw.traverse((o) => {
    if (!o.isMesh || axle.getObjectById(o.id)) return;
    const uM = { value: o.matrix.clone() }, m = o.material = o.material.clone();
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, { uDrC: uC, uDrX: uX, uK0, uK1, uKon, uToFile3: uM });
      sh.vertexShader = "uniform mat4 uToFile3;\nvarying vec3 vFile3;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvFile3 = (uToFile3 * vec4(transformed, 1.0)).xyz;");
      sh.fragmentShader = "uniform vec4 uDrC;\nuniform vec2 uDrX;\nuniform vec3 uK0;\nuniform vec3 uK1;\nuniform float uKon;\nvarying vec3 vFile3;\n" + sh.fragmentShader.replace("void main() {", "void main() {\n  if (vFile3.x > uDrX.x && vFile3.x < uDrX.y && distance(vFile3.yz, uDrC.xy) < uDrC.z) discard;\n  if (uKon > 0.5 && all(greaterThan(vFile3, uK0)) && all(lessThan(vFile3, uK1))) discard;");
    };
    m.customProgramCacheKey = () => "drum";
  });
  E.drum = { spin, uKon };
}
// a bumper that lights up (BALLAST: `bumper`, the front edge of its wedge-shaped nose, in the model file's units — x, y:
// the edge; z: from side to side; slope: how steeply the nose's top rises back from it (rad); d: how far back the glow
// reaches). A glowing strip laid on the nose along the edge, and a light just ahead of it that washes it in the same
// colour; opt.bumper: { c: "#rrggbb", k: 0..1 }
function makeBumper(E, M) {
  const B = M.bumper, raw = E.raw, w = B.z[1] - B.z[0];
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const cv = document.createElement("canvas"); cv.width = 128; cv.height = 32; const c2 = cv.getContext("2d");   // (bright in the middle, soft at its ends and edges)
  const g = c2.createLinearGradient(0, 0, 128, 0); g.addColorStop(0, "rgba(255,255,255,0.1)"); g.addColorStop(0.2, "rgba(255,255,255,0.85)"); g.addColorStop(0.8, "rgba(255,255,255,0.85)"); g.addColorStop(1, "rgba(255,255,255,0.1)");
  c2.fillStyle = g; c2.fillRect(0, 4, 128, 24); c2.fillStyle = "rgba(255,255,255,0.9)"; c2.fillRect(8, 13, 112, 6);
  mat.map = new THREE.CanvasTexture(cv);
  const tilt = new THREE.Group(); tilt.position.set(B.x, B.y + 0.004, (B.z[0] + B.z[1]) / 2); tilt.rotation.z = B.slope; raw.add(tilt);   // (along the rising top)
  const bar = new THREE.Mesh(new THREE.PlaneGeometry(B.d, w), mat); bar.rotation.x = -Math.PI / 2; bar.position.x = B.d / 2; bar.frustumCulled = false; tilt.add(bar);   // (its canvas's length across the nose)
  bar.geometry.rotateZ(Math.PI / 2); bar.geometry.scale(B.d / w, w / B.d, 1);   // (the canvas's long way along z)
  const lamp = new THREE.PointLight(0xffffff, 0, 0.9, 1.6); lamp.position.set(B.x - 0.1, B.y + 0.06, (B.z[0] + B.z[1]) / 2); raw.add(lamp);
  E.bumper = { mat, lamp };
}
// a part cut off at load onto a slide of its own (THUL: `slide`, its machine gun — every triangle wholly inside `box`, in
// the file's units), pushed along `dir` by `dist` times opt.slide (0..1): the barrels' recoil. Kept with its own look
// is this part of a fitted iris (its blades and collar: kept out of the hull's cuts and masks)?
function inIris(o) { for (let p = o; p; p = p.parent) if (/_Iris$/.test(p.name || "")) return true; return false; }
function splitSlide(E, M) {
  const Sd = M.slide, raw = E.raw; raw.updateMatrixWorld(true);
  const B = new THREE.Box3(new THREE.Vector3(...Sd.box[0]), new THREE.Vector3(...Sd.box[1])), g = new THREE.Group(); raw.add(g); g.updateMatrixWorld(true);
  const meshes = [], v = new THREE.Vector3(); raw.traverse((o) => { if (o.isMesh && !inIris(o)) meshes.push(o); });
  for (const m of meshes) {
    const gm = m.geometry, P = gm.attributes.position, idx = gm.index ? gm.index.array : null, cnt = idx ? idx.length : P.count;
    const inB = new Uint8Array(P.count); for (let i = 0; i < P.count; i++) inB[i] = B.containsPoint(v.fromBufferAttribute(P, i).applyMatrix4(m.matrix)) ? 1 : 0;
    const keep = [], move = [];
    for (let t = 0; t < cnt; t += 3) { const a = idx ? idx[t] : t, b = idx ? idx[t + 1] : t + 1, c = idx ? idx[t + 2] : t + 2; (inB[a] && inB[b] && inB[c] ? move : keep).push(a, b, c); }
    if (!move.length) continue;
    const part = (L) => { const G = new THREE.BufferGeometry(); for (const k in gm.attributes) G.setAttribute(k, gm.attributes[k]); G.setIndex(L); const X = new THREE.Mesh(G, m.material); X.frustumCulled = false; m.parent.add(X); X.position.copy(m.position); X.quaternion.copy(m.quaternion); X.scale.copy(m.scale); X.updateMatrixWorld(true); return X; };
    part(keep); g.attach(part(move)); m.visible = false;
  }
  E.slide = { g, dir: new THREE.Vector3(...Sd.dir).multiplyScalar(Sd.dist) };
}
function want(id) {
  const M = SHIP_MODELS[id]; if (!M) return null;
  let E = models[id];
  if (E) E.used = performance.now();
  if (!E) {
    E = models[id] = { state: "loading", obj: null, M, id };
    if (M.vexRig && !vexLib) vexLib = import("./vexar-weapon2-three-v1.js").catch((err) => { console.warn("vexar rig", err); return null; });
    if (M.xelRig && !xelLib) xelLib = import("./xeltar-three-v1.js").catch((err) => { console.warn("xeltar rig", err); return null; });
    if (M.bloomRig && !bloomLib) bloomLib = import("./bloom-three-v1.js").catch((err) => { console.warn("bloom rig", err); return null; });
    if ((M.frankRig || M.creature) && !frankLib) frankLib = import("./frankenstein-three-v1.js").catch((err) => { console.warn("frankenstein rig", err); return null; });
    if (M.vaultRig && !vaultLib) vaultLib = import("./vault-3d-v1.js").catch((err) => { console.warn("vault rig", err); return null; });
    if (M.glitchRig && !glitchLib) glitchLib = import("./glitch-3d-v1.js").catch((err) => { console.warn("glitch rig", err); return null; });
    if (M.huskRig && !huskLib) huskLib = import("./husk-3d-v1.js").catch((err) => { console.warn("husk rig", err); return null; });
    if (M.skarnRig && !skarnLib) skarnLib = import("./skarn-3d-v1.js").catch((err) => { console.warn("skarn rig", err); return null; });
    if (M.rivetRig && !rivetLib) rivetLib = import("./rivet-mechanics-three-v1.js").catch((err) => { console.warn("rivet rig", err); return null; });
    if (M.towMine && !balLib) balLib = import("./ballast-tow-mine-three-v1.js").catch((err) => { console.warn("ballast rig", err); return null; });
    if (M.prop && !propLib) propLib = import("./boiler-propulsor-three-v1.js").catch((err) => { console.warn("boiler propulsor", err); return null; });
    if (M.fitIris && !irisLib) irisLib = import("./fitted-iris-three-v1.js").catch((err) => { console.warn("fitted iris", err); return null; });
    loader.load(M.file, (g) => { E.raw = g.scene; for (const n of M.strip || []) { const x = g.scene.getObjectByName(n); if (x) x.removeFromParent(); }   // (strip: demonstration parts left out, before it is sized)
      E.obj = fit(g.scene, M);
      if (M.lariatClaw) E.jaws = [g.scene.getObjectByName("Lariat_JawLeft"), g.scene.getObjectByName("Lariat_JawRight")];
      if (M.drill) E.drillRotor = g.scene.getObjectByName("Borer_DrillRotor") || null;   // (turns on its bearing's +z)
      if (M.frankRig) frankLib.then((F) => { try { if (F) E.fw = F.bindFrankensteinWorkshop(g); } catch (err) { console.warn("frankenstein rig", err); } });
      if (M.creature) frankLib.then((F) => { try { if (F) E.fc = F.bindFrankensteinCreature(g); } catch (err) { console.warn("frankenstein creature", err); } });
      if (M.vaultRig) vaultLib.then((F) => { try { if (F) { E.vt = F.bindVault3D(g, THREE.AnimationMixer); E.vt.applyPose({}); } } catch (err) { console.warn("vault rig", err); } });   // (its demonstration star hidden: the game draws its own)
      if (M.puffRig) {   // (its clips sampled at the game's own clock — opt.puff: { clip, ms }; one model serves both ships, so no timers
        // of its own. Its stand-in compact hull hidden: the game's own PUFF model is shown)
        const mx = new THREE.AnimationMixer(g.scene), acts = {};
        for (const c of g.animations) acts[c.name.replace(/^Puff_/, "")] = mx.clipAction(c);
        const px = g.scene.getObjectByName("Puff_CompactProxy"); if (px) px.visible = false;
        let on = null;
        E.pf = { applyPose(P) {
          const a = acts[P.clip] || acts.Inflate; if (a !== on) { if (on) on.stop(); on = a; a.reset().play(); }
          a.paused = true; a.time = Math.max(0, Math.min(a.getClip().duration, (P.clip in acts ? P.ms : 1500) / 1000)); mx.update(0);
        } };
        E.pf.applyPose({ clip: "Inflate", ms: 1500 });
      }
      if (M.glitchRig) glitchLib.then((F) => { try { if (F) { E.gl = F.bindGlitch3D(g, THREE.AnimationMixer); E.gl.applyPose(null); } } catch (err) { console.warn("glitch rig", err); } });
      if (M.huskRig) huskLib.then((F) => { try { if (F) { E.hk = F.bindHusk3D(g, THREE.AnimationMixer); E.hk.applyPose({}); } } catch (err) { console.warn("husk rig", err); } });
      if (M.skarnRig) skarnLib.then((F) => { try { if (F) E.sk = F.bindSkarn3D(g.scene); } catch (err) { console.warn("skarn rig", err); } });
      if (M.rivetRig) rivetLib.then((F) => { try { if (F) E.rv = F.bindRivetMechanics(THREE, g); } catch (err) { console.warn("rivet rig", err); } });
      if (M.cinderRig) makeCinderRig(E, g);
      if (M.ignite) { const c = g.animations.find((a) => a.name === "Cinder_Stage2_Ignite"); if (c) { const mx = new THREE.AnimationMixer(g.scene), a = mx.clipAction(c); a.play(); a.paused = true; E.ign = { mx, a, dur: c.duration }; } }
      if (M.wingRig) {   // (BALLAST's white doubled wing, the wing rig package merged in: its two panels part 30° each — opt.tow.wing3, 0..1 of its opening)
        const c = g.animations.find((a) => a.name === "Ballast_Wing_Open");
        if (c) { const mx = new THREE.AnimationMixer(g.scene), a = mx.clipAction(c); a.play(); a.paused = true; E.wing = { mx, a, dur: c.duration }; }
      }
      if (M.towMine) balLib.then((F) => F && new Promise((ok, no) => loader.load("models/ballast-mine.glb", ok, undefined, no)).then((mg) => { E.bal = F.bindBallastMechanisms(THREE, g, mg);
        const cyl = g.scene.getObjectByName("Ballast_TowCylinder");   // (its piston: a dark graphite grey, near the weight's own)
        if (cyl) cyl.traverse((m) => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.setRGB(0.3, 0.31, 0.33); m.material.metalness = Math.min(0.8, (m.material.metalness || 0) + 0.2); } }); })).catch((err) => console.warn("ballast rig", err));   // (set by opt.tow: the weight out, the bay's doors and sled)
      if (M.prop) propLib.then((F) => { try { if (F) E.prop = F.bindBoilerPropulsor(THREE, g); } catch (err) { console.warn("boiler propulsor", err); } });   // (set by opt.prop: how far out, 0..1, and the rotor's turn)
      if (M.fitIris) irisLib.then((F) => { try { if (F) E.fiter = F.bindFittedIris(THREE, g, M.fitIris); } catch (err) { console.warn("fitted iris", err); } });   // (its blades: morphs set by opt.cannon.open)
      if (M.vexRig) { E.state = "rig"; vexLib.then(async (V) => {
      try {   // (its four brood eggs, for the one growing in its chamber)
        if (V) { const ks = ["mixed", "ember", "azure", "prism"], eg = await Promise.all(ks.map((k) => new Promise((ok, no) => loader.load("models/vexar-egg-" + k + ".glb", ok, undefined, no))));
          E.vex = V.createVexarWeapon2(THREE, g, Object.fromEntries(ks.map((k, i) => [k, eg[i]]))); }
      } catch (err) { console.warn("vexar rig", err); }
      E.state = "ready"; E.used = performance.now(); evict(); }); return; }
    if (M.xelRig) { E.state = "rig"; xelLib.then(async (X) => {
      try { if (X) E.xel = X.createXeltarVisual(THREE, g); } catch (err) { console.warn("xeltar rig", err); }
      try {   // (the crystal growing between its arms: the package's rear crystal, on the rig's own socket)
        if (E.xel) { const [C, cg] = await Promise.all([import("./xeltar-rear-crystal-three-v1.js"), new Promise((ok, no) => loader.load("models/xeltar-crystal.glb", ok, undefined, no))]); E.xcr = C.createXeltarRearCrystal(THREE, E.xel, cg); }
      } catch (err) { console.warn("xeltar crystal", err); }
      E.state = "ready"; E.used = performance.now(); evict(); }); return; } if (M.bloomRig) { E.state = "rig"; bloomLib.then((B) => { try { if (B) { E.bloom = B.createBloomVisual(THREE, g); E.bloom.effects.scale.setScalar(M.pollen || 1); } } catch (err) { console.warn("bloom rig", err); } E.state = "ready"; E.used = performance.now(); evict(); }); return; } if (M.split) splitRing(E, M); if (M.blocks) splitBlocks(E, M); if (M.bands) bandShader(E); if (M.gyro) splitGyro(E, M); if (M.fan) splitFan(E, M); if (M.erase) eraseGreen(E); if (M.ghost) ghostShader(E); if (M.seam) splitSeam(E, M); if (M.pieces) { E.halves = { front: [E.obj.getObjectByName(M.pieces.front)].filter(Boolean), back: [E.obj.getObjectByName(M.pieces.back)].filter(Boolean) }; if (M.beacon) makeBeacon(E, M); } if (M.cloud) makeCloud(E); if (M.slide) splitSlide(E, M); if (M.gears) makeGears(E, M); if (M.bumper) makeBumper(E, M); if (M.drum) makeDrum(E, M); if (M.paddles) splitPaddles(E, M); if (M.grille) makeGrille(E, M); if (M.wheel) splitWheel(E, M); E.state = "ready"; E.used = performance.now(); evict(); }, undefined, (e) => { E.state = "fail"; console.warn("ship3d", id, e); });
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
    renderAt(G3.sc, G3.cam, PX);
    if (!G3.cv) { G3.cv = document.createElement("canvas"); G3.cv.width = G3.cv.height = 256; G3.cx = G3.cv.getContext("2d"); }
    G3.cx.clearRect(0, 0, 256, 256); G3.cx.drawImage(R.domElement, 0, 0, PX, PX, 0, 0, 256, 256); G3.key = key;
  }
  ctx.drawImage(G3.cv, x - r, y - r, r * 2, r * 2);
  return true;
}

export const Ship3D = {
  gauge,
  version: 74,   // (index.html checks it; the file's name carries it too — lib/ship3d-vNN.js — so the app never mixes a new
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
    let pk = Math.round(ang * 200) + "|" + Math.round(roll * 200) + "|" + Math.round(pitch * 200) + part + "|" + Math.round(sp * 200) + "|" + pp + (opt && opt.lights ? "|L" + opt.lights.map((q) => q.color + Math.round(q.z * 100) + "," + Math.round(q.i * 10)).join(",") : "") + (E.cloud && opt && opt.cloud ? "|C" + Math.round((opt.cloud.t || 0) * 60) + "," + Math.round((opt.cloud.power || 0) * 20) + "," + Math.round((opt.cloud.boost || 0) * 20) + "," + Math.round((opt.cloud.flash || 0) * 20) : "") + (E.halves && opt && opt.half ? "|H" + opt.half : "") + (E.ghost && opt && opt.ghost ? "|G" + Math.round(opt.ghost * 50) + "," + Math.round((opt.t || 0) * 30) : "") + (E.fan ? "|" + ((opt && opt.open) || []).map((a) => Math.round(a * 100)).join(",") : "") + (E.turns && opt && opt.turns ? "|" + opt.turns.map((a) => Math.round(a * 200)).join(",") : "") + (E.bands && opt && opt.bands ? "|" + opt.bands.map((b) => b.c + Math.round(b.lo * 100)).join(",") : "") + (E.vex ? "|V" + (opt && opt.vex && opt.vex.age != null ? Math.round(opt.vex.age / 15) + opt.vex.brood : "-") : "") + (E.xel && opt && opt.xel ? "|X" + Math.round(opt.xel.finTime * 50) + "," + Math.round(opt.xel.sternTime * 50) + "," + Math.round(opt.xel.swimMix * 30) + "," + Math.round(opt.xel.rearCharge * 30) + "," + (opt.xel.crystalAge != null ? Math.round(opt.xel.crystalAge * 40) : "-") : "") + (E.bloom && opt && opt.bloom ? "|B" + Math.round(opt.bloom.flow * 50) + "," + Math.round(opt.bloom.side * 30) + "," + Math.round(opt.bloom.phase * 90) + "," + Math.round(opt.bloom.filamentTime * 40) : "") + (E.bumper && opt && opt.bumper ? "|b" + opt.bumper.c + Math.round(opt.bumper.k * 30) : "") + (E.drum && opt ? "|d" + Math.round((opt.drum || 0) * 40) + (opt.clawOut ? "c" : "") : "") + (E.paddles && opt && opt.paddles ? "|p" + opt.paddles.map((a) => Math.round(a * 100)).join(",") : "") + (E.wheel && opt ? "|w" + Math.round((opt.wheel || 0) * 60) + "," + Math.round((opt.glow || 0) * 20) + "," + Math.round((opt.flaps || 0) * 40) : "") + (E.vt && opt && opt.vault ? "|v" + ["door", "weapon"].map((k) => opt.vault[k] ? opt.vault[k].clip + Math.round(opt.vault[k].elapsedMs / 15) : "-").join(",") : "") + (E.pf && opt && opt.puff ? "|f" + opt.puff.clip + Math.round((opt.puff.ms || 0) / 20) : "") + (E.gl && opt && opt.glitch ? "|g" + opt.glitch.clip + Math.round(opt.glitch.ms / 20) : "") + (E.hk && opt && opt.husk ? "|h" + ["tank", "arm", "left", "right"].map((k) => opt.husk[k] ? opt.husk[k].clip + Math.round(opt.husk[k].elapsedMs / 20) : "-").join(",") : "") + (E.sk && opt && opt.skarn ? "|k" + [opt.skarn.open, ...opt.skarn.armor, opt.skarn.kick / 17, opt.skarn.flash, opt.skarn.primaryFlash].map((v) => Math.round((v || 0) * 30)).join(",") + (opt.skarn.siege ? "s" : "") + opt.skarn.stored : "") + (E.rv && opt && opt.rivet ? "|v" + (opt.rivet.kind || "-") + (opt.rivet.mode || 0) + "," + (opt.rivet.kind ? Math.round(Math.min(opt.rivet.age || 0, 460) / 12) : 0) : "") + (E.fw && opt && opt.prep != null ? "|f" + Math.round(opt.prep * 30) : "") + (E.fc && opt && opt.parts ? "|c" + opt.parts.map((v) => Math.round(v * 40)).join(",") : "") + (E.beacon && opt && opt.beacon ? "|b" + opt.beacon : "") + (E.jaws && opt && opt.jaw != null ? "|j" + Math.round(opt.jaw) : "") + (E.drillRotor && opt && opt.drill ? "|r" + Math.round(((opt.drill % 6.2832) + 6.2832) % 6.2832 / 6.2832 * 48) % 48 : "") + (E.launch && opt && opt.launch ? "|c" + ["L", "R"].map((k) => Math.round((opt.launch[k] || 0) * 50) + "," + Math.round((opt.launch["slide" + k] || 0) * 40) + (opt.launch["load" + k] === false ? "x" : "")).join(",") : "") + (E.launch && opt && opt.dash ? "|d" + opt.dash.side + Math.round(opt.dash.ms / 15) : "") + (E.ign && opt && opt.ignite != null ? "|g" + Math.round(opt.ignite * 100) : "") + (E.bal && opt && opt.tow ? "|t" + Math.round((opt.tow.wing3 || 0) * 40) + "," + Math.round((opt.tow.ext || 0) * 60) + "," + (opt.tow.mine != null ? Math.round(opt.tow.mine / 15) : "-") : "") + (E.prop && opt && opt.prop ? "|p" + Math.round((opt.prop.p || 0) * 60) + "," + Math.round(((opt.prop.rot || 0) % (Math.PI / 2)) / (Math.PI / 2) * 10) % 10 : "") + (E.fiter && opt && opt.cannon ? "|i" + Math.round((opt.cannon.open || 0) * 40) : "") + (E.slide && opt ? "|s" + Math.round((opt.slide || 0) * 20) : "") + (E.gears && opt ? "|g" + Math.round((opt.gears || 0) * 60) + "," + Math.round((opt.recoil || 0) * 20) + (opt.cannon ? "," + ["ring", "kick", "open", "glow"].map((k) => Math.round((opt.cannon[k] || 0) * 40)).join(",") + (opt.cannon.ball === false ? "x" : "") : "") : "");   // (a new picture only when it has turned a quarter of a degree)
    // opt.lights: up to 3 coloured lights inside the ship ({ x, y, z } in the fitted model's units, before it is tilted;
    // color; i: how bright) — MIRAGE's light running up its prism
    if (!lamps) { lamps = [0, 1, 2].map(() => { const L = new THREE.PointLight(0xffffff, 0, 1.2, 1.6); scene.add(L); return L; }); }
    const LS = (opt && opt.lights) || [];
    lamps.forEach((L, i) => { const q = LS[i]; L.visible = !!q; if (q) { L.color.set(q.color); L.intensity = q.i; L.position.set(q.x, q.y, q.z).applyEuler(new THREE.Euler(-pitch, 0, -roll, "YXZ")); } });
    if (E.cloud) { if (opt && opt.cloud) { E.cloud.G.visible = true; moveCloud(E, opt.cloud); } else E.cloud.G.visible = false; }
    if (E.beacon) setBeacon(E, opt && opt.beacon);   // (DRAKON's twin-exhaust piece cut loose: its pipe ends flashing)
    if (E.halves) { const h = opt && opt.half; for (const X of E.halves.front) X.visible = !h || h === "front"; for (const X of E.halves.back) X.visible = !h || h !== "front"; }   // (any other half: the rear piece)
    if (E.ghost) { E.ghost.uG.value = (opt && opt.ghost) || 0; E.ghost.uT.value = (opt && opt.t) || 0; }
    if (E.fan) { const O = (opt && opt.open) || [], nw = M.fan.narrow || 1; E.fan.forEach((P, i) => { const k = O[i] || 0; P.pivot.quaternion.identity().slerp(P.shut, 1 - k); const sl = M.fan.shorten || 1; P.squash.scale.set(sl + (1 - sl) * k, nw + (1 - nw) * k, 1); }); }   // (opt.open: how open each panel is, 0 shut .. 1 as modelled)
    if (E.vex) E.vex.tick(opt && opt.vex ? opt.vex.age : null, (opt && opt.vex && opt.vex.brood) || "mixed");   // (opt.vex: { age: ms since button 2, or null; brood } — the egg forming, by the package's clip)
    if (E.xel && opt && opt.xel) { const P = opt.xel; let rc = P.rearCharge; if (E.xcr) rc = E.xcr.tick(P.crystalAge != null ? P.crystalAge : null).brace || 0; Object.assign(E.xel.pose, P); E.xel.tick(0, { throttle01: P.throttleLevel, rearCharge01: rc }); }   // (opt.xel.crystalAge: s since button 2 — the crystal forming and the arms gathering, by the package's own curves)   // (opt.xel: its pose now — the fins' and arms' clocks, the swim blend and the rear charge — kept by the game for each ship)
    if (E.bloom) { Object.assign(E.bloom.state, (opt && opt.bloom) || {}); E.bloom.tick(0, {}); }   // (opt.bloom: the flower's airflow state, { phase, flow, side, filamentTime } — kept by the game for each ship: the pose of its petals and pollen now)
    if (E.bumper) { const Bp = (opt && opt.bumper) || { k: 0 }; E.bumper.mat.opacity = Bp.k; E.bumper.lamp.intensity = 2.5 * Bp.k; if (Bp.c) { E.bumper.mat.color.set(Bp.c); E.bumper.lamp.color.set(Bp.c); } }
    if (E.drum) { E.drum.spin.rotation.x = (opt && opt.drum) || 0; E.drum.uKon.value = opt && opt.clawOut ? 1 : 0; }   // (opt.drum: its turn, rad; opt.clawOut: the boom's claw away)
    if (E.paddles) { const A = (opt && opt.paddles) || [0, 0]; E.paddles.forEach((P, i) => { P.hinge.rotation.y = P.s * (A[i] || 0); }); }   // (opt.paddles: each paddle's swing from the model's own pose, rad, + = toward the nose)
    if (E.grille) { const k = (opt && opt.flaps) || 0; for (const f of E.grille.flaps) f.rotation.y = 1.3 * k; E.grille.glowMat.emissiveIntensity = 0.5 + 1.6 * Math.max(k, (opt && opt.glow) || 0); }   // (opt.flaps: 0 shut .. 1 open)
    if (E.wheel) { const Wh = E.wheel; Wh.axle.quaternion.copy(Wh.base).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -((opt && opt.wheel) || 0))); Wh.glow.intensity = 0.8 * ((opt && opt.glow) || 0); }
    if (E.vt) E.vt.applyPose(opt && opt.vault ? opt.vault : {});   // (VAULT: both faces' locks, its pins)
    if (E.pf) E.pf.applyPose(opt && opt.puff ? opt.puff : { clip: "Inflate", ms: 1500 });   // (PUFF: puffing up, held, bursting, drawing back to its compact self)
    if (E.gl) E.gl.applyPose(opt && opt.glitch ? opt.glitch.clip : null, opt && opt.glitch ? opt.glitch.ms : 0);   // (GLITCH: its shutters, on the 2D reference clock)
    if (E.hk) E.hk.applyPose(opt && opt.husk ? opt.husk : {});   // (HUSK: the tank, the arm and each barrel, as the game has them)
    if (E.sk) E.sk.applyPose(opt && opt.skarn ? opt.skarn : SKARN_REST);   // (SKARN: the pose its game controller gives, as the 2D frames)
    if (E.rv) { const V = opt && opt.rivet; E.rv.tick(V ? { kind: V.kind || null, ageMs: V.age || 0, mode: V.mode || 0 } : {}); }   // (RIVET: its hull turned by its own mode pivot, the part that fires moving)
    if (E.fw) E.fw.tick(opt && opt.prep != null ? opt.prep : null);   // (FRANKENSTEIN's tools at that moment of the surgery; none: put away)
    if (E.fc) E.fc.setProgress(opt && opt.parts ? opt.parts : [1, 1, 1, 1]);   // (its creature: each part's way in)
    if (E.jaws) { const a = ((opt && opt.jaw != null ? opt.jaw : 46) * Math.PI) / 180; if (E.jaws[0]) E.jaws[0].rotation.z = a; if (E.jaws[1]) E.jaws[1].rotation.z = -a; }   // (LARIAT's claw: its jaws spread or shut)
    if (E.drillRotor) E.drillRotor.quaternion.setFromAxisAngle(ZAX, opt && opt.drill ? opt.drill : 0);   // (BORER's drill turned)
    if (E.launch) {   // (CINDER: each hatch where its clip has it, shut at rest; each bay's missile in, on its way out or gone; the slip's clip, or both pods at rest)
      const Lo = (opt && opt.launch) || {}, D = opt && opt.dash, A = E.launch.act;
      for (const s of ["L", "R"]) {
        const a = A["Hatch_" + s + "_Fire"]; if (a) a.time = Math.max(0, Math.min(a.getClip().duration, Lo[s] || 0));
        const m = E.launch.stow[s]; if (m) { m.visible = Lo["load" + s] !== false; m.position.copy(E.launch.path[s]).multiplyScalar(Lo["slide" + s] || 0); }
        const d = A["Magic_Dash_" + s]; if (d) { const on = D ? D.side === s : s === "L"; d.enabled = on; if (on) { d.setEffectiveWeight(1); d.time = D ? Math.max(0, Math.min(d.getClip().duration, D.ms / 1000)) : 0; } }
      }
      E.launch.mx.update(0);
    }
    if (E.ign) { E.ign.a.time = Math.max(0, Math.min(E.ign.dur, (opt && opt.ignite) || 0)); E.ign.mx.update(0); }
    if (E.wing) { E.wing.a.time = ((opt && opt.tow && opt.tow.wing3) || 0) * E.wing.dur; E.wing.mx.update(0); }
    if (E.bal) { const T = opt && opt.tow; E.bal.tick({ extension01: T ? T.ext || 0 : 0, mineAgeMs: T && T.mine != null ? T.mine : null }); E.bal.socket.traverse((m) => { if (m !== E.bal.socket) m.visible = false; }); }   // (BALLAST: the weight out on its cylinder; the bay opening, the sled pushing, closing — the mine itself is the game's shot)
    if (E.prop) { const P = opt && opt.prop; E.prop.state.progress = P ? P.p || 0 : 0; E.prop.state.rotorRadians = P ? P.rot || 0 : 0; E.prop.tick(0, { submerged: false, throttle01: 0 }); }   // (BOILER's propulsor posed: the deploy clip sampled at p, its rotor at rot)
    if (E.fiter) E.fiter.setOpen(opt && opt.cannon ? opt.cannon.open || 0 : 0);   // (the fitted iris: how open, 0..1 — the ship's action drives it)
    if (E.slide) E.slide.g.position.copy(E.slide.dir).multiplyScalar((opt && opt.slide) || 0);
    if (E.gears) {   // (recoil: toward the tail, +x in THUL's file)
      const a = (opt && opt.gears) || 0, C = (opt && opt.cannon) || {};
      for (const g of E.gears.list) { g.axle.rotation.z = (g.drive === "cannon" ? C.ring || 0 : a) * g.k; g.boss.rotation.y = g.axle.rotation.z; }
      E.gears.rig.position.x = 0.015 * ((opt && opt.recoil) || 0); E.gears.cannon.position.x = 0.035 * (C.kick || 0);
      if (E.iris) {   // (opt.cannon: open 0..1 — the blades swung out; glow 0..1 — the charge; ball — it is in the bore)
        const I = E.iris, op = C.open || 0; for (const b of I.blades) { b.turn.rotation.z = b.a0 + 0.9 * op; b.m.scale.x = 1 - 0.78 * op; }   // (twisting open, each blade drawn back to the rim)
        I.boreMat.emissiveIntensity = 0.9 * (C.glow || 0); I.ballMat.emissiveIntensity = 0.8 * (C.glow || 0); I.ball.visible = C.ball !== false;
      }
    }
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
    const T2 = ctx.getTransform(), res = Math.hypot(T2.a, T2.b) * L > BIG_AT ? PX_BIG : PX;   // (how big it is on the screen: close up, the sharper picture)
    pk += "|r" + res;
    let c = cached(id, pk);
    if (c) { c.t = performance.now(); ctx.drawImage(c.cv, -L / 2, -L / 2, L, L); return true; }
    root.clear(); root.add(E.obj);
    E.obj.rotation.set(-pitch, 0, -roll, "YXZ");   // (pitch > 0: the nose away from the camera, into the screen; then rolled round the nose)
    // the light fixed in space: the picture gets turned by `ang` on the screen, so the light here turns the other way
    const lx = -0.55, lz = -0.6, ca = Math.cos(-ang), sa = Math.sin(-ang);
    key.position.set(lx * ca - lz * sa, 1.1, lx * sa + lz * ca);
    rim.position.set(-(lx * ca - lz * sa), 0.4, -(lx * sa + lz * ca));
    if (cam.right !== pad / 2) { cam.left = cam.bottom = -pad / 2; cam.right = cam.top = pad / 2; cam.updateProjectionMatrix(); }
    renderAt(scene, cam, res);
    c = store(id, pk, res); c.t = performance.now();
    ctx.drawImage(c.cv, -L / 2, -L / 2, L, L);
    return true;
  },
};
window.Ship3D = Ship3D;
