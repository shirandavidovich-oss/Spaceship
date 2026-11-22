// Geometry and fit live in the GLBs. The host action owns projectile timing.
export const IRIS_TIMINGS = Object.freeze({
  Courier: Object.freeze({ openMs: 320, holdMs: 340, closeMs: 380 }),
  Thul: Object.freeze({ openMs: 185, holdMs: 170, closeMs: 235 }),
});

function smooth(unit) {
  const p = Math.max(0, Math.min(1, unit));
  return p * p * (3 - 2 * p);
}

// One visual cycle. Retiming a ship's accepted action can use setOpen directly.
export function sampleIrisCycle(ageMs, { openMs, holdMs, closeMs }) {
  if (!Number.isFinite(ageMs) || ageMs <= 0) return 0;
  if (ageMs < openMs) return smooth(ageMs / openMs);
  if (ageMs < openMs + holdMs) return 1;
  return 1 - smooth((ageMs - openMs - holdMs) / closeMs);
}

export function bindFittedIris(THREE, gltf, ship) {
  const spec = IRIS_TIMINGS[ship];
  if (!spec) throw new Error(`Unknown fitted iris ship: ${ship}`);
  const visual = gltf.scene.getObjectByName(`${ship}_Visual`);
  const iris = visual?.getObjectByName(`${ship}_Iris`);
  const socket = iris?.getObjectByName(`${ship}_MuzzleSocket`);
  const blades = [];
  iris?.traverse((node) => {
    if (node.name.startsWith(`${ship}_IrisBlade_`) && node.morphTargetInfluences?.length === 2) {
      blades.push(node);
    }
  });
  const expected = ship === 'Courier' ? 8 : 5;
  if (!socket || blades.length !== expected) throw new Error(`Incomplete fitted iris asset for ${ship}.`);

  function setOpen(openness) {
    const amount = Number.isFinite(openness) ? Math.max(0, Math.min(1, openness)) : 0;
    const halfWeight = amount <= .5 ? 2 * amount : 2 * (1 - amount);
    const openWeight = amount <= .5 ? 0 : 2 * amount - 1;
    for (const blade of blades) {
      blade.morphTargetInfluences[0] = halfWeight;
      blade.morphTargetInfluences[1] = openWeight;
    }
    return amount;
  }

  function captureMuzzle() {
    const quaternion = socket.getWorldQuaternion(new THREE.Quaternion());
    return {
      position: socket.getWorldPosition(new THREE.Vector3()),
      direction: new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion).normalize(),
      quaternion,
    };
  }

  setOpen(0);
  return {
    visual,
    socket,
    setOpen,
    captureMuzzle,
    tick(ageMs, timings = spec) {
      return setOpen(sampleIrisCycle(ageMs, timings));
    },
  };
}
