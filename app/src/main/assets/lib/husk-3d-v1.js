/** Connect the model clips to game-owned tank, arm and cannon state. */
export function bindHusk3D(gltf, AnimationMixer) {
  const mixer = new AnimationMixer(gltf.scene);
  const names = {
    tank: ['TankOpen', 'TankClose'],
    arm: ['ArmExtend', 'ArmRetract', 'ArmSway', 'ArmThrust', 'ArmBite'],
    left: ['GunLeft'],
    right: ['GunRight'],
  };
  const actions = new Map();
  const active = new Map();
  for (const name of Object.values(names).flat()) {
    const clip = gltf.animations.find(item => item.name === `Husk_${name}`);
    if (!clip) throw new Error(`Missing Husk_${name} clip`);
    actions.set(name, mixer.clipAction(clip));
  }
  function applyPose({tank, arm, left, right}) {
    for (const [channel, state] of Object.entries({tank, arm, left, right})) {
      if (state && !names[channel].includes(state.clip)) {
        throw new Error(`Invalid Husk ${channel} clip ${state.clip}`);
      }
      const prior = active.get(channel);
      const action = state ? actions.get(state.clip) : undefined;
      if (action !== prior) {
        prior?.stop();
        action?.reset().play();
        active.set(channel, action);
      }
      if (!action) continue;
      const duration = action.getClip().duration;
      const elapsed = state.elapsedMs * .001;
      action.paused = true;
      action.time = state.clip === 'ArmSway'
        ? ((elapsed % duration) + duration) % duration
        : Math.max(0, Math.min(duration, elapsed));
    }
    mixer.update(0);
  }
  function node(suffix) {
    const object = gltf.scene.getObjectByName(`Husk_${suffix}`);
    if (!object) throw new Error(`Missing Husk_${suffix} anchor`);
    return object;
  }
  return {
    root: node('Root'),
    anchors: {
      armTip: node('ArmTip'),
      muzzleLeft: node('MuzzleLeft'),
      muzzleRight: node('MuzzleRight'),
    },
    applyPose,
  };
}
