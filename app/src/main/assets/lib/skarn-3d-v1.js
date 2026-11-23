/**
 * Three.js visual adapter. Feed it the pose from the game's Skarn controller.
 * The controller retains ownership of weapon events and stored rounds.
 */
export function bindSkarn3D(scene) {
  const get = suffix => {
    const node = scene.getObjectByName(`Skarn_${suffix}`);
    if (!node) throw new Error(`Missing Skarn asset node ${suffix}`);
    return node;
  };
  const part = label => {
    const node = get(label);
    return {node, rest: node.position.clone()};
  };
  const root = get('Root');
  const {travel, jawTravel, ribLift, recoil} = root.userData.motion;
  const visual = part('VisualRecoil');
  const jaws = ['JawUpper', 'JawLower'].map(part);
  const armor = [1, 2, 3].map(row => ['Left', 'Right'].map(side => part(`Rib_${row}_${side}`)));
  const locks = [1, 2, 3].map(row => part(`Lock_${row}`));
  const charge = [1, 2, 3, 4, 5].map(i => get(`Charge_${i}`));
  const names = ['MuzzleLeft', 'MuzzleRight', 'SpitMuzzle'];
  const flash = names.map(name => get(`${name}Flash`));
  const anchors = Object.fromEntries(names.map(name => [name, get(name)]));
  const radians = Math.PI / 180;
  const light = (node, value) => node.scale.setScalar(Math.max(.001, value));

  function applyPose(pose) {
    const motion = pose.siege ? travel.salvo : travel.primary;
    visual.node.position.x = visual.rest.x + pose.kick * recoil;
    jaws.forEach(({node, rest}, i) => {
      const [x, y, angle] = jawTravel[i];
      node.position.set(rest.x + x * pose.open, rest.y + y * pose.open, rest.z);
      node.rotation.z = angle * pose.open * radians;
    });
    armor.forEach((pair, row) => {
      const amount = pose.armor[row];
      const [advance, inward, angle] = motion[row];
      pair.forEach(({node, rest}, i) => {
        const side = i === 0 ? 1 : -1;
        node.position.set(rest.x - advance * amount, rest.y + ribLift[row] * amount, rest.z - side * inward * amount);
        node.rotation.y = side * angle * amount * radians;
      });
      const {node, rest} = locks[row];
      node.position.set(rest.x - advance * amount, rest.y + ribLift[row] * amount, rest.z);
      light(node, (amount - .80) / .20);
    });
    charge.forEach((node, i) => light(node, i < pose.stored ? 1 : 0));
    flash.forEach((node, i) => {
      const value = i === 2 ? pose.flash : pose.primaryFlash;
      node.scale.setScalar(Math.max(.001, value) * (i === 2 ? 1.26 : .98));
    });
  }

  return {root, anchors, applyPose};
}
