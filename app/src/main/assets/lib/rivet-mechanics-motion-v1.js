// Timing from the original Rivet 2D mechanics controller.
export const DURATIONS = Object.freeze({pin:320,rail:420,scatter:340,wave:400,magic:440});
export const CLIPS = Object.freeze({
  pin:'Rivet_Pin_Piston',
  rail:'Rivet_Rail_Feed',
  scatter:'Rivet_Scatter_Jaw',
  wave:'Rivet_Wave_Emitter',
  magic0:'Rivet_Flip_To_Crossarm',
  magic1:'Rivet_Flip_To_Spine',
});
const cap = (x) => Math.max(0,Math.min(1,x));
const ease = (x) => {const p=cap(x);return p*p*(3-2*p);};
const pulse = (t,up,hold,end) => ease(t/up)*(1-ease((t-hold)/(end-hold)));

export function sampleRivet(kind,ageMs,mode=0) {
  const t = Number.isFinite(ageMs) ? Math.max(0,ageMs) : 0;
  const p = kind==='magic' ? cap(t/440) : 0;
  const flip = kind==='magic' ? (mode ? 1-ease(p) : ease(p)) : mode;
  return {
    yaw:-Math.PI/2*flip,
    ram:kind==='pin'?pulse(t,45,92,310):kind==='magic'?.76*pulse(t,85,245,420):0,
    cover:kind==='magic'?pulse(t,98,302,440):kind==='rail'?pulse(t,65,190,420):0,
    jaw:kind==='scatter'?pulse(t,44,106,330):kind==='wave'?pulse(t,60,185,390):
      kind==='magic'?.68*pulse(t,100,260,440):0,
    clutch:kind==='magic'?pulse(t,95,335,440):0,
    active:kind==='magic' && p>=.51 ? 1-mode : mode,
  };
}
