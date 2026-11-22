// Keep the original five-second preparation and four accepted placements.
export const PREP_SECONDS = 5;
export const PART_SECONDS = .62;
const clamp = (p) => Math.min(1, Math.max(0, p));
const fade = (t,a,b) => {
  const p = clamp((t-a)/(b-a));
  return p*p*(3-2*p);
};

export function sampleSurgery(ageSeconds) {
  const t = Number.isFinite(ageSeconds) ? Math.max(0, Math.min(PREP_SECONDS, ageSeconds)) : 0;
  const arms = fade(t,0,.56)*(1-fade(t,4.43,5));
  const roof = fade(t,1.31,1.76)*(1-fade(t,4.60,4.96));
  const saw = fade(t,1.55,2.05)*(1-fade(t,4.07,4.64));
  const cutting = fade(t,2.05,2.31)*(1-fade(t,3.88,4.13));
  const hammers = fade(t,2.54,2.90)*(1-fade(t,3.93,4.37));
  return {
    t, arms, roof, saw, cutting, hammers, sawTravel: Math.sin(t*7.1)*cutting,
    handPhases: [0,1.7].map((phase)=>t*8.8+phase),
    hammerStrokes: [.2,2.65].map((phase)=>hammers*Math.max(0,Math.sin(t*13.1+phase))**4),
  };
}

export const SLOTS = Object.freeze([
  Object.freeze({ id:'Chassis', donor:'STRATA', x:3, y:-23, width:126, angle:-.035, depth:.36, lift:.01 }),
  Object.freeze({ id:'LeftWing', donor:'VEXAR', x:-80, y:-8, width:106, angle:-.15, depth:.24, lift:-.03 }),
  Object.freeze({ id:'RightShoulder', donor:'BALLAST', x:73, y:-9, width:104, angle:.17, depth:.31, lift:-.025 }),
  Object.freeze({ id:'Engine', donor:'KILN', x:-9, y:83, width:114, angle:-.10, depth:.46, lift:-.075 }),
]);
export const PART_SCALE = .0103;

export function samplePart(index, progress) {
  const slot = SLOTS[index];
  const p = clamp(Number.isFinite(progress) ? progress : 0);
  const blend = p*p*(3-2*p);
  const w = 1-blend;
  const sign = index===1 ? -1 : 1;
  return {
    visible:p>0,
    translation:[
      (slot.y-w*(index===3 ? -55:46))*PART_SCALE,
      slot.lift+w*.30,
      -(slot.x+w*sign*49)*PART_SCALE,
    ],
    yaw:-(slot.angle + w*sign*.43),
    scale:.73+.27*blend,
  };
}
