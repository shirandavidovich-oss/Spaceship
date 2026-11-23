/** Visual adapter for the existing PuffBurst.BurstMagic simulation. */
export function bindPuff3D(gltf, AnimationMixer, { setCompactWeight } = {}) {
  const mixer = new AnimationMixer(gltf.scene);
  const get = suffix => {
    const node = gltf.scene.getObjectByName(`Puff_${suffix}`);
    if (!node) throw new Error(`Missing Puff_${suffix}`);
    return node;
  };
  const names = ['Inflate', 'Reinflate', 'BurstCollapse'];
  const actions = Object.fromEntries(names.map(name => {
    const clip = gltf.animations.find(item => item.name === `Puff_${name}`);
    if (!clip) throw new Error(`Missing Puff_${name} clip`);
    return [name, mixer.clipAction(clip)];
  }));
  const proxy = get('CompactProxy');
  const root = get('Root');
  const spineAnchors = Array.from({length: 12}, (_, i) =>
    get(`Launch_${String(i + 1).padStart(2, '0')}`));
  if (setCompactWeight) proxy.visible = false;
  let active;
  function applyPose(pose) {
    let name;
    let elapsed = pose.age ?? 0;
    switch (pose.state) {
      case 'compact':
        break;
      case 'inflating':
        name = pose.wrinkled ? 'Reinflate' : 'Inflate';
        break;
      case 'inflated':
        name = 'Inflate';
        elapsed = 1500;
        break;
      case 'deflating':
        name = 'BurstCollapse';
        break;
      case 'crumpled':
        name = 'BurstCollapse';
        elapsed = 900;
        break;
      default:
        throw new RangeError(`Unknown Puff visual state ${pose.state}`);
    }

    const action = actions[name];
    if (action !== active) {
      active?.stop();
      active = action;
      active?.reset().play();
    }
    if (active) {
      active.paused = true;
      active.time = Math.max(0, Math.min(active.getClip().duration, elapsed / 1000));
    }
    mixer.update(0);

    if (setCompactWeight) {
      const amount = Math.max(0, Math.min(1, (elapsed - 406) / 118));
      const weight = !action ? 1 : name === 'Inflate' ? 1 - amount*amount*(3-2*amount) : 0;
      setCompactWeight(weight);
    }
  }

  return { root, spineAnchors, applyPose };
}
