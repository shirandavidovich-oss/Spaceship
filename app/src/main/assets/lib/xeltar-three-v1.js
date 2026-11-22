import { CLIPS, createXeltarPose, updateXeltarPose } from './xeltar-motion-v1.js';

// Pass a fresh GLTFLoader result or a SkeletonUtils.clone() of its scene.
// One controller owns the animation channels of one ship instance.
export function createXeltarVisual(THREE, gltf) {
  const visual = gltf.scene.getObjectByName('Xeltar_Visual');
  if (!visual) throw new Error('Use Xeltar-Rigged.glb or a clone of its scene.');

  const surface = visual.getObjectByName('Xeltar_Surface');
  if (surface?.isSkinnedMesh) {
    surface.computeBoundingSphere();
    surface.boundingSphere.radius += .27;
  }

  function bind(clipName, expectedTracks) {
    const clip = gltf.animations.find((item) => item.name === clipName);
    if (!clip || clip.tracks.length !== expectedTracks) {
      throw new Error(`Missing or incomplete Xeltar clip: ${clipName}`);
    }

    return new Map(clip.tracks.map((track) => {
      const dot = track.name.lastIndexOf('.');
      const name = track.name.slice(0, dot);
      const property = track.name.slice(dot + 1);
      const joint = visual.getObjectByName(name) ?? visual.getObjectByProperty('uuid', name);
      if (!joint || !['position', 'quaternion'].includes(property)) {
        throw new Error(`Xeltar rig binding missing for ${track.name}`);
      }
      const sampler = track.createInterpolant(new Float32Array(track.getValueSize()));
      return [track.name, { target: joint[property], sampler }];
    }));
  }

  const fins = [...bind(CLIPS.fins, 14).values()];
  const idle = bind(CLIPS.idle, 15);
  const swim = bind(CLIPS.swim, 15);
  const brace = bind(CLIPS.brace, 15);
  const stern = [...idle].map(([name, binding]) => {
    const stroke = swim.get(name);
    const charge = brace.get(name);
    if (!stroke || !charge) throw new Error(`Xeltar stern clips disagree on ${name}`);
    return {
      target: binding.target,
      resting: binding.sampler,
      stroke: stroke.sampler,
      closed: new THREE.Quaternion().fromArray(charge.sampler.evaluate(1)),
    };
  });

  const pose = createXeltarPose();
  const a = new THREE.Quaternion();
  const b = new THREE.Quaternion();

  function tick(deltaSeconds, flight) {
    updateXeltarPose(pose, deltaSeconds, flight);
    for (const { target, sampler } of fins) {
      target.fromArray(sampler.evaluate(pose.finTime));
    }
    for (const { target, resting, stroke, closed } of stern) {
      a.fromArray(resting.evaluate(pose.sternTime));
      b.fromArray(stroke.evaluate(pose.sternTime));
      target.copy(a).slerp(b, pose.swimMix).slerp(closed, pose.rearCharge);
    }
  }
  tick(0);
  return {
    visual,
    pose,
    tick,
    sockets: {
      nose: visual.getObjectByName('Xeltar_NoseSocket'),
      rearCrystal: visual.getObjectByName('Xeltar_RearCrystalSocket'),
      ink: visual.getObjectByName('Xeltar_InkSocket'),
    },
  };
}
