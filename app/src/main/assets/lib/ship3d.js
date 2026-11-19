// Orbit Break — the 3D view's ships (stage 1 of the 3D mode).
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

export const Ship3D = {
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
