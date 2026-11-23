const labels = {
  shutter: 'Glitch_Shutter',
  vDeploy: 'Glitch_V_Deploy',
  counterSlide: 'Glitch_Counter_Slide',
};

export function bindGlitch3D(gltf, AnimationMixer) {
  const mixer = new AnimationMixer(gltf.scene);
  const get = label => {
    const node = gltf.scene.getObjectByName(`Glitch_${label}`);
    if (!node) throw new Error(`Missing Glitch_${label}`);
    return node;
  };
  const root = get('Root');
  const actions = Object.fromEntries(Object.entries(labels).map(([id, name]) => {
    const clip = gltf.animations.find(item => item.name === name);
    if (!clip) throw new Error(`Missing ${name} clip`);
    return [id, mixer.clipAction(clip)];
  }));
  let active;

  // elapsedReferenceMs uses the original 2D timeline. Map a retimed game action first.
  function applyPose(id, elapsedReferenceMs = 0) {
    const action = id == null ? undefined : actions[id];
    if (id != null && !action) throw new RangeError(`Unknown Glitch clip ${id}`);
    if (active !== action) {
      active?.stop();
      active = action;
      active?.reset().play();
    }
    if (active) {
      active.paused = true;
      active.time = Math.max(0, Math.min(active.getClip().duration, elapsedReferenceMs / 1000));
    }
    mixer.update(0);
  }

  return {
    root,
    anchors: {primary: get('PrimaryMuzzle'), pulse: get('PulseMuzzle')},
    pulseAtReferenceMs: root.userData.pulseAtMs,
    applyPose,
  };
}
