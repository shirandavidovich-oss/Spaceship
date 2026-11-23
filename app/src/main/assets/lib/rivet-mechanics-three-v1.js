import { CLIPS, DURATIONS } from './rivet-mechanics-motion-v1.js';

export function bindRivetMechanics(THREE, gltf) {
  const visual = gltf.scene.getObjectByName('Rivet_Visual');
  const pivot = visual?.getObjectByName('Rivet_ModePivot');
  if (!pivot) throw new Error('Load Rivet-Fitted-Mechanism.glb.');

  const tracks = Object.fromEntries(Object.entries(CLIPS).map(([kind,clipName]) => {
    const clip = gltf.animations.find((c)=>c.name===clipName);
    if (!clip) throw new Error(`Missing Rivet clip: ${clipName}`);
    const bindings = clip.tracks.map((track) => {
      const dot = track.name.lastIndexOf('.');
      const name = track.name.slice(0,dot);
      const property = track.name.slice(dot+1);
      const node = pivot.getObjectByName(name) ?? pivot.getObjectByProperty('uuid',name);
      if (!node || !['position','quaternion','scale'].includes(property)) {
        throw new Error(`Unbound Rivet track: ${track.name}`);
      }
      return { value:node[property], sample:track.createInterpolant(new Float32Array(track.getValueSize())) };
    });
    return [kind,bindings];
  }));

  const sockets = {
    spine: pivot.getObjectByName('Rivet_SpineMuzzle'),
    crossarm: pivot.getObjectByName('Rivet_CrossarmMuzzle'),
    rail: pivot.getObjectByName('Rivet_RailOutlet'),
  };
  if (Object.values(sockets).some((s)=>!s)) throw new Error('Missing a Rivet firing socket.');
  const forward = new THREE.Vector3(0,0,1);

  // During a flip, mode is the mode captured at the start of that action.
  // Otherwise mode is the active mode. The ship mount owns the world heading.
  function tick({ kind = null, ageMs = 0, mode = 0 } = {}) {
    const crossarm = mode===1;
    const age = Number.isFinite(ageMs) ? Math.max(0,ageMs) : 0;
    const usable = (crossarm && (kind==='scatter' || kind==='wave'))
      || (!crossarm && (kind==='pin' || kind==='rail'));
    const name = kind==='magic' ? (crossarm ? 'magic1':'magic0') :
      usable ? kind : (crossarm ? 'scatter':'pin');
    const time = kind==='magic' || usable ? Math.min(age,DURATIONS[kind])/1000 : 0;
    for (const track of tracks[name]) track.value.fromArray(track.sample.evaluate(time));
  }

  function captureSocket(name) {
    const socket = sockets[name];
    if (!socket) throw new RangeError(`Unknown Rivet socket: ${name}`);
    const quaternion = socket.getWorldQuaternion(new THREE.Quaternion());
    return {
      position:socket.getWorldPosition(new THREE.Vector3()),
      direction:forward.clone().applyQuaternion(quaternion).normalize(),
      quaternion,
    };
  }
  tick();
  return { visual, pivot, sockets, tick, captureSocket };
}
