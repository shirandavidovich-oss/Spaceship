import { CRYSTAL_SCALE, REAR_CRYSTAL_TIMING, sampleRearCrystal } from './xeltar-rear-crystal-v1.js';

// The existing attack controller owns the launch event. This helper only
// draws the forming crystal and captures a world pose for the projectile.
export function createXeltarRearCrystal(THREE, xeltar, gltf, {
  crystalScale = CRYSTAL_SCALE,
} = {}) {
  const socket = xeltar.sockets.rearCrystal;
  const mesh = gltf.scene.getObjectByName('Xeltar_RearCrystal');
  if (!socket || !mesh) throw new Error('Load the Xeltar rig and Xeltar-Rear-Crystal.glb.');
  const bearing = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
  const aft = new THREE.Vector3(1, 0, 0);

  const growing = new THREE.Group();
  growing.name = 'Xeltar_FormingRearCrystal';
  growing.quaternion.copy(bearing);
  const core = mesh.clone(true);
  growing.add(core);
  growing.visible = false;
  socket.add(growing);

  function tick(ageSeconds) {
    const pose = sampleRearCrystal(ageSeconds);
    growing.visible = pose.visible;
    if (pose.visible) {
      growing.scale.setScalar(crystalScale * pose.growth);
      core.rotation.z = pose.spinRadians;
    }
    return pose;
  }

  function captureLaunch() {
    const shipOrientation = socket.getWorldQuaternion(new THREE.Quaternion());
    return {
      position: socket.getWorldPosition(new THREE.Vector3()),
      direction: aft.clone().applyQuaternion(shipOrientation).normalize(),
      orientation: shipOrientation.clone().multiply(bearing),
      scale: socket.getWorldScale(new THREE.Vector3()).multiplyScalar(crystalScale),
    };
  }

  // Parent this to the existing projectile's visual mount. Match the mount's
  // local +Z with its travel direction, or set a world-level mount from
  // captureLaunch(). All clones share the source material and geometry.
  function createProjectileVisual() {
    const projectile = mesh.clone(true);
    projectile.rotation.z = sampleRearCrystal(REAR_CRYSTAL_TIMING.release).spinRadians;
    return projectile;
  }

  return {
    tick,
    captureLaunch,
    createProjectileVisual,
    dispose() {
      growing.removeFromParent();
    },
  };
}
