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
let R = null, scene, cam, key, rim, root;
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

function want(id) {
  const M = SHIP_MODELS[id]; if (!M) return null;
  let E = models[id];
  if (!E) {
    E = models[id] = { state: "loading", obj: null };
    loader.load(M.file, (g) => { E.raw = g.scene; E.obj = fit(g.scene, M); E.state = "ready"; }, undefined, (e) => { E.state = "fail"; console.warn("ship3d", id, e); });
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
  floor.rotation.x = -Math.PI / 2; sc.add(floor);
  // the stars all round (far off, not in the fog)
  const n = 1500, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const u = Math.random() * 2 - 1, t = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u); pos.set([r * Math.cos(t) * 60, u * 60, r * Math.sin(t) * 60], i * 3); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.8 }));
  sc.add(stars);
  const sun = new THREE.DirectionalLight(0xffffff, 2.4); sun.position.set(-3, 6, -2); sc.add(sun, new THREE.AmbientLight(0xffffff, 0.3));
  const ship = new THREE.Group(); sc.add(ship);
  C = { R: R2, sc, cam, tex, floor, stars, ship, q: new THREE.Quaternion(), pos: new THREE.Vector3(), first: true };
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
  G3.turn.quaternion.set(q[0], q[1], q[2], q[3]);
  R.toneMapping = THREE.NeutralToneMapping;
  R.render(G3.sc, G3.cam);
  ctx.drawImage(R.domElement, x - r, y - r, r * 2, r * 2);
  return true;
}

export const Ship3D = {
  gauge,
  version: 10,   // (index.html checks it; the file's name carries it too — lib/ship3d-v10.js — so the app never mixes a new
                // game with an old copy of this file it saved earlier: change the name with every change here)
  chase,
  chaseReset() { if (C) C.first = true; },
  on: false,
  has(id) { return !!SHIP_MODELS[id]; },
  ready(id) { const E = want(id); return !!E && E.state === "ready"; },
  preload(ids) { for (const id of ids) want(id); },
  _reset(id) { const E = models[id]; if (E && E.raw) E.obj = fit(E.raw, SHIP_MODELS[id]); },
  // draw ship `id` into the 2D context, whose origin is the ship's middle and whose units are the 2D drawing's (the
  // ship already turned to its heading `ang` there). roll, pitch: rad (roll: right wing away from you; pitch: nose away, into the screen)
  draw(ctx, id, ang, roll = 0, pitch = 0) {
    if (!init()) return false;
    const E = want(id); if (!E || E.state !== "ready") return false;
    const M = SHIP_MODELS[id];
    root.clear(); root.add(E.obj);
    E.obj.rotation.set(-pitch, 0, -roll, "YXZ");   // (pitch > 0: the nose away from the camera, into the screen; then rolled round the nose)
    // the light fixed in space: the picture gets turned by `ang` on the screen, so the light here turns the other way
    const lx = -0.55, lz = -0.6, ca = Math.cos(-ang), sa = Math.sin(-ang);
    key.position.set(lx * ca - lz * sa, 1.1, lx * sa + lz * ca);
    rim.position.set(-(lx * ca - lz * sa), 0.4, -(lx * sa + lz * ca));
    R.render(scene, cam);
    const L = (M.len || 1) * PAD;
    ctx.drawImage(R.domElement, -L / 2, -L / 2, L, L);
    return true;
  },
};
window.Ship3D = Ship3D;
