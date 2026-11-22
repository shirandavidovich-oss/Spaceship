import {
  VEXAR_CLIP, VEXAR_RELEASE_MS, sampleVexarEgg, visualAge,
} from './vexar-egg-motion-v1.js';

const BROODS = ['mixed', 'ember', 'azure', 'prism'];

export function createVexarWeapon2(THREE, shipGltf, eggGltfs) {
  const visual = shipGltf.scene.getObjectByName('Vexar_Visual');
  const socket = visual?.getObjectByName('Vexar_EggSocket');
  const clip = shipGltf.animations.find((item) => item.name === VEXAR_CLIP);
  if (!socket || !clip) throw new Error('Load Vexar-Weapon2-Rigged.glb with its egg socket and clip.');

  const tracks = clip.tracks.map((track) => {
    const dot = track.name.lastIndexOf('.');
    const name = track.name.slice(0, dot);
    const property = track.name.slice(dot + 1);
    const node = visual.getObjectByName(name) ?? visual.getObjectByProperty('uuid', name);
    if (!node || (property !== 'position' && property !== 'quaternion')) {
      throw new Error(`Vexar track could not bind: ${track.name}`);
    }
    return { node, property, sampler: track.createInterpolant(new Float32Array(track.getValueSize())) };
  });
  const socketTranslation = tracks.find((item) => item.node === socket && item.property === 'position');
  const socketRotation = tracks.find((item) => item.node === socket && item.property === 'quaternion');
  if (!socketTranslation || !socketRotation) throw new Error('Vexar release tracks are missing.');
  const release = sampleVexarEgg(VEXAR_RELEASE_MS);
  const releaseTime = VEXAR_RELEASE_MS / 1000;
  const releaseCenter = new THREE.Vector3().fromArray(socketTranslation.sampler.evaluate(releaseTime));
  const releaseRotation = new THREE.Quaternion().fromArray(socketRotation.sampler.evaluate(releaseTime));
  const forward = new THREE.Vector3(-1, 0, 0);

  const roots = new Map(BROODS.map((id) => {
    const egg = eggGltfs[id]?.scene.getObjectByName('Vexar_Egg');
    if (!egg) throw new Error(`Load the Vexar egg GLB for ${id}.`);
    return [id, egg];
  }));
  const chamberEggs = new Map([...roots].map(([id, root]) => {
    const egg = root.clone(true);
    egg.visible = false;
    socket.add(egg);
    return [id, egg];
  }));

  const seed = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0xc6ff70, transparent: true, depthWrite: false }));
  seed.name = 'Vexar_EmbryoSeed';
  socket.add(seed);
  let activeEgg;

  const surface = visual.getObjectByName('Vexar_Surface');
  if (surface?.isSkinnedMesh) {
    surface.computeBoundingSphere();
    surface.boundingSphere.radius += .32;
  }

  function tick(ageMs, broodId = 'mixed') {
    const seconds = visualAge(ageMs) / 1000;
    for (const { node, property, sampler } of tracks) {
      node[property].fromArray(sampler.evaluate(seconds));
    }

    const pose = sampleVexarEgg(ageMs);
    if (activeEgg) activeEgg.visible = false;
    activeEgg = chamberEggs.get(broodId) ?? chamberEggs.get('mixed');
    activeEgg.visible = pose.attached;
    if (pose.attached) {
      const across = pose.eggScale / Math.sqrt(pose.stretch);
      activeEgg.scale.set(pose.eggScale * pose.stretch, across, across);
    }
    seed.visible = pose.seed > .005;
    seed.scale.setScalar(.015 + .063 * pose.seed);
    seed.material.opacity = .68 * pose.seed;
    return pose;
  }

  // Sample the exact release key, including when a render frame passes it.
  // The host owns the one-shot projectile event and its subsequent physics.
  function captureLaunch() {
    const facing = visual.getWorldQuaternion(new THREE.Quaternion());
    return {
      position: visual.localToWorld(releaseCenter.clone()),
      quaternion: facing.clone().multiply(releaseRotation),
      direction: forward.clone().applyQuaternion(facing).normalize(),
      scale: visual.getWorldScale(new THREE.Vector3()).multiplyScalar(release.eggScale),
    };
  }

  function createReleasedEgg(broodId = 'mixed') {
    return (roots.get(broodId) ?? roots.get('mixed')).clone(true);
  }

  tick(null);
  return {
    visual, socket, tick, captureLaunch, createReleasedEgg,
    dispose() {
      for (const egg of chamberEggs.values()) egg.removeFromParent();
      seed.removeFromParent();
      seed.geometry.dispose();
      seed.material.dispose();
    },
  };
}
