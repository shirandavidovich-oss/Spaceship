/** Sample the two lock faces and firing pins using the existing game clock. */
export function bindVault3D(gltf, AnimationMixer) {
  const mixer = new AnimationMixer(gltf.scene);
  const channels = {
    door: ['Open', 'Close', 'SolarBreach', 'StarCapturePreview'],
    weapon: ['PrimaryFire', 'SecondaryPiston'],
  };
  const actions = new Map();
  const active = new Map();
  for (const key of Object.values(channels).flat()) {
    const clip = gltf.animations.find(item => item.name === `Vault_${key}`);
    if (!clip) throw new Error(`Missing Vault_${key}`);
    actions.set(key, mixer.clipAction(clip));
  }
  function get(label) {
    const node = gltf.scene.getObjectByName(`Vault_${label}`);
    if (!node) throw new Error(`Missing Vault_${label}`);
    return node;
  }

  function applyPose({door, weapon} = {}) {
    for (const [channel, state] of Object.entries({door, weapon})) {
      if (state && !channels[channel].includes(state.clip)) {
        throw new RangeError(`Unexpected Vault ${channel} clip ${state.clip}`);
      }
      const prior = active.get(channel);
      const action = state ? actions.get(state.clip) : undefined;
      if (prior !== action) {
        prior?.stop();
        action?.reset().play();
        active.set(channel, action);
      }
      if (!action) continue;
      const duration = action.getClip().duration;
      action.paused = true;
      action.time = Math.max(0, Math.min(duration, state.elapsedMs / 1000));
    }
    mixer.update(0);
  }

  return {
    root: get('Root'),
    anchors: {
      front: {mouth: get('Front_Mouth'), chamber: get('Front_Chamber')},
      rear: {mouth: get('Rear_Mouth'), chamber: get('Rear_Chamber')},
    },
    applyPose,
  };
}
