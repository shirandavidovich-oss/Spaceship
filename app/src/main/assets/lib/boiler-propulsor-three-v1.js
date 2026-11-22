import {
  CLIPS, DEPLOY_SECONDS, createPropulsorState, updatePropulsor,
} from './boiler-propulsor-motion-v1.js';

// Uses the baked deployment positions and independently powers the rotor.
export function bindBoilerPropulsor(THREE, gltf) {
  const visual = gltf.scene.getObjectByName('Boiler_Visual');
  const rotor = visual?.getObjectByName('Boiler_Rotor');
  const wakeSocket = visual?.getObjectByName('Boiler_WakeSocket');
  const deployment = gltf.animations.find((clip) => clip.name === CLIPS.deploy);
  if (!rotor || !wakeSocket || !deployment) throw new Error('Load Boiler-Fitted-Propulsor.glb.');
  const tracks = deployment.tracks.map((track) => {
    const dot = track.name.lastIndexOf('.');
    const name = track.name.slice(0, dot);
    const property = track.name.slice(dot + 1);
    const node = visual.getObjectByName(name) ?? visual.getObjectByProperty('uuid', name);
    if (!node || !['position', 'quaternion'].includes(property)) {
      throw new Error(`Boiler propulsor track could not bind: ${track.name}`);
    }
    return { node, property, sampler: track.createInterpolant(new Float32Array(track.getValueSize())) };
  });
  const state = createPropulsorState();
  const axis = new THREE.Vector3(0, 0, 1);

  function tick(dtSeconds, input) {
    const pose = updatePropulsor(state, dtSeconds, input);
    const seconds = state.progress * DEPLOY_SECONDS;
    for (const { node, property, sampler } of tracks) {
      node[property].fromArray(sampler.evaluate(seconds));
    }
    rotor.quaternion.setFromAxisAngle(axis, state.rotorRadians);
    return pose;
  }

  function captureWake() {
    const orientation = wakeSocket.getWorldQuaternion(new THREE.Quaternion());
    return {
      position: wakeSocket.getWorldPosition(new THREE.Vector3()),
      direction: axis.clone().applyQuaternion(orientation).normalize(),
      intensity: state.wake,
    };
  }

  tick(0);
  return { visual, state, wakeSocket, tick, captureWake };
}
