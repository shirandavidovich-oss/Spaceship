import { PREP_SECONDS, SLOTS, samplePart } from './frankenstein-motion-v1.js';

export function bindFrankensteinWorkshop(creatorGltf) {
  const creator = creatorGltf.scene.getObjectByName('Frankenstein_Creator');
  const clip = creatorGltf.animations.find((anim) => anim.name === 'Frankenstein_Surgery_Prepare');
  if (!creator || !clip) throw new Error('Load Frankenstein-Workshop-Rigged.glb.');
  const tracks = clip.tracks.map((track) => {
    const dot = track.name.lastIndexOf('.');
    const name = track.name.slice(0, dot);
    const property = track.name.slice(dot + 1);
    const node = creator.getObjectByName(name) ?? creator.getObjectByProperty('uuid', name);
    if (!node || !['position','quaternion','scale'].includes(property)) {
      throw new Error(`Missing Frankenstein track target: ${track.name}`);
    }
    return { target:node[property], sample:track.createInterpolant(new Float32Array(track.getValueSize())) };
  });
  const sockets = {
    work: creator.getObjectByName('Frankenstein_WorkSocket'),
    saw: creator.getObjectByName('Frankenstein_SawContactSocket'),
    hands: ['Right','Left'].map((s)=>creator.getObjectByName(`Frankenstein_${s}GripSocket`)),
    hammers: ['Right','Left'].map((s)=>creator.getObjectByName(`Frankenstein_${s}HammerStrikeSocket`)),
  };

  function tick(prepAgeSeconds) {
    const age = Number.isFinite(prepAgeSeconds) ? Math.max(0, Math.min(PREP_SECONDS, prepAgeSeconds)) : 0;
    for (const track of tracks) track.target.fromArray(track.sample.evaluate(age));
  }
  tick(null);
  return { creator, sockets, tick };
}

// Use a separate instance for each work point or active companion. The host
// supplies per-part progress and owns the summons, timing, and entity state.
export function bindFrankensteinCreature(creatureGltf) {
  const creature = creatureGltf.scene.getObjectByName('Frankenstein_Creature');
  if (!creature) throw new Error('Load Frankenstein-Creature-Assembly.glb.');
  const parts = SLOTS.map((slot) => creature.getObjectByName(`Creature_${slot.id}`));
  const brackets = creature.getObjectByName('Creature_SpliceBrackets');
  if (parts.some((part) => !part) || !brackets) throw new Error('Missing Frankenstein creature component.');

  function setProgress(progress = []) {
    let complete = true;
    for (let i=0; i<parts.length; i++) {
      const amount = progress[i] ?? 0;
      const pose = samplePart(i, amount);
      const part = parts[i];
      part.visible = pose.visible;
      part.position.fromArray(pose.translation);
      part.rotation.set(0,pose.yaw,0);
      part.scale.setScalar(pose.scale);
      complete &&= amount >= 1;
    }
    brackets.visible = complete;
    return complete;
  }
  setProgress();
  return {
    creature, parts, setProgress,
    showAssembled: () => setProgress([1,1,1,1]),
  };
}
