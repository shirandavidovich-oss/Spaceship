import {
  CLIP_NAMES, STRAND_COUNT, STRAND_COLORS, createBloomState, updateBloom,
  createFilament, sampleFilament, sampleCurve,
} from './bloom-motion-v1.js';

const SPANS = 16;
const SIDES = 5;
const SOCKET_ORIGIN = [0, 0, 0];

export function createBloomVisual(THREE, gltf) {
  const visual = gltf.scene.getObjectByName('Bloom_Visual');
  const socket = visual?.getObjectByName('Bloom_PollenSocket');
  if (!socket) throw new Error('Use the supplied Bloom-Rigged.glb with its named rig and pollen socket.');

  const clips = CLIP_NAMES.map((name) => {
    const clip = gltf.animations.find((candidate) => candidate.name === name);
    if (!clip || clip.tracks.length !== 14) throw new Error(`Missing or incomplete Bloom clip: ${name}`);
    return new Map(clip.tracks.map((track) => [track.name, track.createInterpolant(new Float32Array(4))]));
  });
  const joints = [...clips[0].keys()].map((trackPath) => {
    const boundNode = trackPath.replace(/\.quaternion$/, '');
    const bone = visual.getObjectByName(boundNode) ?? visual.getObjectByProperty('uuid', boundNode);
    if (!bone || !clips.every((clip) => clip.has(trackPath))) {
      throw new Error(`Bloom rig binding missing for ${trackPath}`);
    }
    return { bone, poses: clips.map((clip) => clip.get(trackPath)) };
  });

  const surface = visual.getObjectByName("Bloom_Surface");
  if (surface?.isSkinnedMesh) {
    surface.computeBoundingSphere();
    surface.boundingSphere.radius += .22;
  }

  const state = createBloomState();
  const group = new THREE.Group();
  group.name = 'Bloom_PollenFX';
  socket.add(group);
  const geometry = new THREE.BufferGeometry();
  const verticesPerStrand = (SPANS + 1) * SIDES;
  const positions = new THREE.BufferAttribute(new Float32Array(STRAND_COUNT * verticesPerStrand * 3), 3);
  const colors = new THREE.BufferAttribute(new Float32Array(positions.array.length), 3);
  positions.setUsage(THREE.DynamicDrawUsage);
  colors.setUsage(THREE.DynamicDrawUsage);
  const indices = [];
  for (let i = 0; i < STRAND_COUNT; i++) {
    for (let span = 0; span < SPANS; span++) {
      for (let side = 0; side < SIDES; side++) {
        const ring = i * verticesPerStrand + span * SIDES;
        const a = ring + side;
        const b = ring + (side + 1) % SIDES;
        indices.push(a, b, a + SIDES, b, b + SIDES, a + SIDES);
      }
    }
  }

  geometry.setAttribute('position', positions);
  geometry.setAttribute('color', colors);
  geometry.setIndex(indices);
  const material = new THREE.MeshBasicMaterial({
    vertexColors: true, transparent: true, opacity: .82, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide, forceSinglePass: true, toneMapped: false,
  });
  const filaments = new THREE.Mesh(geometry, material);
  filaments.frustumCulled = false;
  group.add(filaments);

  const texture = createGlowTexture(THREE);
  const strands = STRAND_COLORS.map((hex) => {
    const color = new THREE.Color(hex);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: texture, color, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, toneMapped: false,
    }));
    const core = new THREE.Sprite(new THREE.SpriteMaterial({
      map: texture, color: 0xfff8e1, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, toneMapped: false,
    }));
    group.add(halo, core);
    return { curve: createFilament(), color, halo, core };
  });
  const a = new THREE.Quaternion();
  const b = new THREE.Quaternion();
  const point = [];
  const next = [];
  const direction = new THREE.Vector3();
  const across = new THREE.Vector3();
  const up = new THREE.Vector3();
  const deck = new THREE.Vector3(0, 0, 1);
  const reference = new THREE.Vector3(1, 0, 0);

  function tick(dtSeconds, flight) {
    updateBloom(state, dtSeconds, flight);
    const tier = state.flow * (CLIP_NAMES.length - 1);
    const low = Math.floor(tier);
    const high = Math.min(low + 1, CLIP_NAMES.length - 1);
    for (const { bone, poses } of joints) {
      a.fromArray(poses[low].evaluate(state.phase));
      b.fromArray(poses[high].evaluate(state.phase));
      bone.quaternion.copy(a).slerp(b, tier - low);
    }

    for (let i = 0; i < strands.length; i++) {
      const { curve, color, halo, core } = strands[i];
      sampleFilament(state, i, curve, SOCKET_ORIGIN);
      halo.position.fromArray(curve.tip);
      core.position.copy(halo.position);
      halo.scale.set(curve.size * 1.55, curve.size * 1.55, 1);
      core.scale.set(curve.size * .53, curve.size * .53, 1);
      halo.material.opacity = .78 * curve.light;
      core.material.opacity = curve.light;

      for (let span = 0; span <= SPANS; span++) {
        const t = span / SPANS;
        sampleCurve(point, curve, t);
        sampleCurve(next, curve, t + (span === SPANS ? -.02 : .02));
        direction.set(next[0] - point[0], next[1] - point[1], next[2] - point[2]).normalize();
        if (span === SPANS) direction.negate();
        across.crossVectors(direction, Math.abs(direction.z) > .92 ? reference : deck).normalize();
        up.crossVectors(direction, across);
        const radius = .0042 * (.65 + .35 * Math.sin(Math.PI * t)) + state.flow * .00075;
        const light = (.12 + .77 * t) * curve.light;
        for (let side = 0; side < SIDES; side++) {
          const angle = side * 2 * Math.PI / SIDES;
          const u = radius * Math.cos(angle);
          const v = radius * Math.sin(angle);
          const vertex = i * verticesPerStrand + span * SIDES + side;
          positions.setXYZ(vertex, point[0] + across.x * u + up.x * v,
            point[1] + across.y * u + up.y * v, point[2] + across.z * u + up.z * v);
          colors.setXYZ(vertex, color.r * light, color.g * light, color.b * light);
        }
      }
    }
    positions.needsUpdate = true;
    colors.needsUpdate = true;
  }

  tick(0);
  return {
    visual, effects: group, state, tick,
    dispose() {
      group.removeFromParent();
      geometry.dispose();
      material.dispose();
      texture.dispose();
      for (const { halo, core } of strands) {
        halo.material.dispose();
        core.material.dispose();
      }
    },
  };
}

function createGlowTexture(THREE) {
  const side = 32;
  const pixels = new Uint8Array(side * side * 4);
  for (let y = 0; y < side; y++) {
    for (let x = 0; x < side; x++) {
      const pos = 4 * (y * side + x);
      const radius = Math.min(1, Math.hypot((x + .5) / side * 2 - 1, (y + .5) / side * 2 - 1));
      pixels.set([255, 255, 255, Math.round(255 * (1 - radius) ** 3)], pos);
    }
  }
  const map = new THREE.DataTexture(pixels, side, side, THREE.RGBAFormat);
  map.minFilter = THREE.LinearFilter;
  map.magFilter = THREE.LinearFilter;
  map.needsUpdate = true;
  return map;
}
