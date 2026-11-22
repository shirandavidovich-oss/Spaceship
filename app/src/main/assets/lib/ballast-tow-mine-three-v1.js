import {
  EXTEND_MS, EXTENSION_TRAVEL, MINE_END_MS, sampleBallastMine, sampleBallastTow, clamp01,
} from './ballast-motion-v1.js';

export function bindBallastMechanisms(THREE, shipGltf, mineGltf) {
  const visual = shipGltf.scene.getObjectByName('Ballast_Visual');
  const socket = visual?.getObjectByName('Ballast_MineSocket');
  const exit = visual?.getObjectByName('Ballast_MineExit');
  const prototype = mineGltf.scene.getObjectByName('Ballast_Mine');
  if (!socket || !exit || !prototype) throw new Error('Load the fitted Ballast and mine GLBs.');

  function bindClip(name, count) {
    const clip = shipGltf.animations.find((item) => item.name === name);
    if (!clip || clip.tracks.length !== count) throw new Error(`Missing Ballast clip: ${name}`);
    return clip.tracks.map((track) => {
      const dot = track.name.lastIndexOf('.');
      const label = track.name.slice(0, dot);
      const key = track.name.slice(dot + 1);
      const n = visual.getObjectByName(label) ?? visual.getObjectByProperty('uuid', label);
      if (!n || !['position', 'quaternion'].includes(key)) throw new Error(`Missing Ballast track target: ${label}`);
      return { target: n[key], sample: track.createInterpolant(new Float32Array(track.getValueSize())) };
    });
  }

  const tow = bindClip('Ballast_Tow_Extend', 4);
  const bay = bindClip('Ballast_Mine_Bay', 4);
  const readyMine = prototype.clone(true);
  socket.add(readyMine);
  const out = new THREE.Vector3(0, 0, 1);

  function setExtension(amount) {
    const extension = Number.isFinite(amount) ? clamp01(amount) : 0;
    const bakedTime = EXTEND_MS * extension ** (1 / 1.45) / 1000;
    for (const item of tow) item.target.fromArray(item.sample.evaluate(bakedTime));
    return extension;
  }

  function tick({ towAgeMs = null, extension01, mineAgeMs = null } = {}) {
    const extension = setExtension(extension01 ?? sampleBallastTow(towAgeMs));
    const age = Number.isFinite(mineAgeMs) ? Math.min(MINE_END_MS, Math.max(0, mineAgeMs)) : 0;
    for (const item of bay) item.target.fromArray(item.sample.evaluate(age / 1000));
    const pose = sampleBallastMine(mineAgeMs);
    readyMine.visible = pose.attached;
    return { extension, travel: extension * EXTENSION_TRAVEL, ...pose };
  }

  // The exit is fixed at the exact handoff position on the moving weight.
  // A skipped render frame therefore cannot change the local launch point.
  function captureMineLaunch() {
    const quaternion = exit.getWorldQuaternion(new THREE.Quaternion());
    return {
      position: exit.getWorldPosition(new THREE.Vector3()),
      direction: out.clone().applyQuaternion(quaternion).normalize(),
      quaternion,
      scale: exit.getWorldScale(new THREE.Vector3()),
    };
  }

  tick();
  return {
    visual, socket, exit, tick, captureMineLaunch,
    createReleasedMine: () => prototype.clone(true),
    dispose: () => readyMine.removeFromParent(),
  };
}
