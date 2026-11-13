// Checks the game rules in index.html (the part between <logic> and </logic>).
// Run: node tests/ship.test.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const html = fs.readFileSync(path.join(__dirname, "../app/src/main/assets/index.html"), "utf8");
const settings = html.slice(html.indexOf("const HOLD_ANGLE"), html.indexOf("// <logic>"));
const logic = html.slice(html.indexOf("// <logic>"), html.indexOf("// </logic>"));
const box = {};
vm.runInNewContext(settings + logic + "\nObject.assign(box,{kilnRig,revRamp,revAccel,stratPose,STRATA_W,towRig,BALLAST_UNIT,HOLD_ANGLE,palInteract,palCarrier,PAL,DEAD_ZONE,SHIPS,RARITY,chooseShip,tiltOf,controlFromTilt,shipById,headingTarget,turnToward,wrapAngle,wrapDelta,gravityAt,shipStats,fuelColor,fuelStep,enemyControl,UNLOCK,levelStats,cablePull,cableRelease,gimbalTurn,gateSweep,quarterTurn,WEAPONS,LOOT,MAGIC,lootOf,weaponsOf,gunsOf,rotatePt,ammoStep,pelletAngles,steerShot,enemySees,seqFrame,seqLength,cueTime,ramDamage,SHIP_HP,RAM_DAMAGE,stickHeading,tailOut,ringPhase,pulseGlow,SFX,tailPieces,grindPhase,BODIES,nextBody,talusScale,GROW,orianPanels,soakCharges,inTrap,enemyGuns,crossReach,segDistance,threadPhase,phaseChord,shutterPose,stormPose,rainbowPose,vPose,slidePose,repriseForms,reprisePose,puffPose,cinderEngines,starMinePose,starMineCheck,talusForge,bubbleCharge,vexarEggPose,vexarEggFlight,borerThrust,puffFrame,PUFF_SPINES,borerDrill,borerLegs,lensPull,rollFleet,emailSeed,killReward,mazeMake,mazeNext,mazeRoute,mazeConnected,sweepBox,bounceOff});", { box, Math, Object, parseInt });
const { kilnRig, revRamp, revAccel, stratPose, STRATA_W, towRig, BALLAST_UNIT, HOLD_ANGLE, SHIPS, palInteract, palCarrier, PAL, starMinePose, starMineCheck, talusForge, bubbleCharge, vexarEggPose, vexarEggFlight, borerThrust, puffFrame, PUFF_SPINES, borerDrill, borerLegs, lensPull, RARITY, chooseShip, tiltOf, controlFromTilt, shipById, headingTarget, turnToward, wrapAngle, wrapDelta, gravityAt, shipStats, fuelColor, fuelStep, enemyControl, UNLOCK, levelStats, cablePull, cableRelease, gimbalTurn, gateSweep, quarterTurn, WEAPONS, LOOT, MAGIC, lootOf, weaponsOf, gunsOf, rotatePt, ammoStep, pelletAngles, steerShot, enemySees, seqFrame, seqLength, cueTime, ramDamage, SHIP_HP, RAM_DAMAGE, stickHeading, tailOut, ringPhase, pulseGlow, SFX, tailPieces, grindPhase, BODIES, nextBody, talusScale, GROW, orianPanels, soakCharges, inTrap, enemyGuns, crossReach, segDistance, threadPhase, phaseChord, shutterPose, stormPose, rainbowPose, vPose, slidePose, repriseForms, reprisePose, puffPose, cinderEngines, rollFleet, emailSeed, killReward, mazeMake, mazeNext, mazeRoute, mazeConnected, sweepBox, bounceOff } = box;
const rad = (d) => d * Math.PI / 180;
// gravity sensor values for a phone tipped `pitch` degrees up from flat and `roll` degrees right-edge-down
const g = (pitch, roll = 0) => [-Math.sin(rad(roll)) * 9.81, Math.cos(rad(roll)) * Math.sin(rad(pitch)) * 9.81, Math.cos(rad(roll)) * Math.cos(rad(pitch)) * 9.81];
const ctl = (pitch, roll) => controlFromTilt(tiltOf(...g(pitch, roll)));

let n = 0;
const ok = (name, fn) => { fn(); n++; console.log("ok -", name); };

ok("forty-six ships, unique ids", () => {
  assert.strictEqual(SHIPS.length, 46);
  assert.strictEqual(new Set(SHIPS.map((s) => s.id)).size, 46);
  for (const s of SHIPS) { assert(RARITY[s.rarity], s.id); assert(s.nozzles.length >= 1 && s.nozzles.length <= 4, s.id); }
});
ok("every rarity has a ship", () => { for (const r in RARITY) assert(SHIPS.some((s) => s.rarity === r), r); });
ok("held at the usual angle: ship stays still", () => {
  const c = ctl(HOLD_ANGLE, 0);
  assert.strictEqual(c.fwd, 0); assert.strictEqual(c.side, 0);
  assert.strictEqual(ctl(HOLD_ANGLE + 3, 2).fwd, 0);
});
ok("flat on the table is NOT still (ship flies forward)", () => assert(ctl(0, 0).fwd > 0.9));
ok("tipped more upright: ship comes back down", () => assert(ctl(HOLD_ANGLE + 20, 0).fwd < -0.5));
ok("right edge down: ship goes right", () => { assert(ctl(HOLD_ANGLE, 20).side > 0.5); assert(ctl(HOLD_ANGLE, -20).side < -0.5); });
ok("face down: no control", () => { const c = controlFromTilt(tiltOf(0, 0, -9.81)); assert.strictEqual(c.fwd, 0); });
ok("gift: only ships with real drawings, odds follow rarity (among the rarities they have)", () => {
  let seed = 1; const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const count = {}; const N = 40000;
  for (let i = 0; i < N; i++) { const S = shipById(chooseShip(rand)); assert(S.anim, S.id); count[S.rarity] = (count[S.rarity] || 0) + 1; }
  const have = Object.keys(RARITY).filter((r) => SHIPS.some((s) => s.anim && s.rarity === r)), sum = have.reduce((a, r) => a + RARITY[r].odds, 0);
  for (const r of have) assert(Math.abs(count[r] / N * 100 - RARITY[r].odds / sum * 100) < 1.5, r + " " + count[r]);
});
const deg = (r) => Math.round(r * 180 / Math.PI);
ok("held at the usual angle: nose keeps its heading", () => assert.strictEqual(headingTarget(ctl(HOLD_ANGLE, 0)), null));
ok("tilt points the nose all the way round", () => {
  assert.strictEqual(deg(headingTarget(ctl(HOLD_ANGLE - 20, 0))), 0);     // top tipped away: up
  assert.strictEqual(deg(headingTarget(ctl(HOLD_ANGLE, 20))), 90);       // right edge down: right
  assert.strictEqual(Math.abs(deg(headingTarget(ctl(HOLD_ANGLE + 20, 0)))), 180); // toward you: down
  assert.strictEqual(deg(headingTarget(ctl(HOLD_ANGLE, -20))), -90);     // left
});
ok("turns the short way round", () => {
  const a = turnToward(170 * Math.PI / 180, -170 * Math.PI / 180, 0.1);
  assert(deg(wrapAngle(a)) > 170 || deg(wrapAngle(a)) < -170);
});
ok("space wraps around", () => { assert.strictEqual(wrapDelta(90, 100), -10); assert.strictEqual(wrapDelta(-30, 100), -30); });
ok("the planet pulls toward itself, harder when closer", () => {
  const far = gravityAt(300, 0, 100, 50), near = gravityAt(100, 0, 100, 50);
  assert(far.ax < 0 && near.ax < far.ax && Math.abs(far.ay) < 1e-9);
});
ok("every ship has fuel; the current ones last 30 seconds", () => { for (const s of SHIPS) assert.strictEqual(shipStats(s).fuel, 30, s.id); });
ok("fuel button: white when full, black when empty, colored on the way", () => {
  assert.strictEqual(fuelColor(1), "#ffffff"); assert.strictEqual(fuelColor(0), "#000000");
  for (const f of [0.9, 0.7, 0.5, 0.35, 0.2]) assert(!["#ffffff", "#000000"].includes(fuelColor(f)), f);
});
ok("fuel burns, runs dry, locks, then fills back up by itself", () => {
  const st = shipStats(SHIPS[0]); let f = { fuel: st.fuel, locked: false }, t = 0;
  while (!f.locked && t < 100) { f = fuelStep(f.fuel, f.locked, true, st, 0.1); t += 0.1; }
  assert(Math.abs(t - st.fuel) < 0.2, "burned for " + t);
  f = fuelStep(f.fuel, f.locked, true, st, 0.1); assert(f.locked && f.fuel > 0, "holding while dry does nothing, tank refills");
  t = 0; while (f.locked) { f = fuelStep(f.fuel, f.locked, false, st, 0.1); t += 0.1; }
  assert(Math.abs(t - st.refill * UNLOCK) < 0.3, "unlocks after " + t);
  for (let i = 0; i < 400; i++) f = fuelStep(f.fuel, f.locked, false, st, 0.1);
  assert.strictEqual(f.fuel, st.fuel);
});
const W0 = { ww: 4000, wh: 8000, u: 400, planetR: 200 };
ok("enemy far away: points at you and fires its engine", () => {
  const st = shipStats(SHIPS[1]);
  const e = { x: 2000, y: 1000, vx: 0, vy: 0, ang: Math.PI / 2, fuel: 30, locked: false };
  const c = enemyControl(e, { x: 3500, y: 1000, vx: 0, vy: 0 }, st, W0);
  assert.strictEqual(deg(c.target), 90); assert.strictEqual(c.thrust, true);
});
ok("enemy heading into the planet: turns away from it", () => {
  const st = shipStats(SHIPS[1]);
  const e = { x: 2000, y: 3300, vx: 0, vy: 500, ang: Math.PI, fuel: 30, locked: false };   // just above the planet, falling in
  const c = enemyControl(e, { x: 2000, y: 5000, vx: 0, vy: 0 }, st, W0);              // player on the far side
  assert(Math.abs(deg(c.target)) < 90, "should push up, away from the planet: " + deg(c.target));
});
ok("every engine is stronger than the planet's pull (no ship gets stuck on it)", () => {
  const g = gravityAt(1, 0, 1, 0.5);
  for (const s of SHIPS) assert(shipStats(s).push > Math.abs(g.ax), s.id);
});
ok("ten bodies in the middle; every engine beats every one's pull; a new round never repeats the last", () => {
  assert.strictEqual(BODIES.length, 10); assert.strictEqual(new Set(BODIES.map((b) => b.id)).size, 10);
  for (const B of BODIES) {
    const g = gravityAt(1, 0, 1, B.r, B.pull);
    for (const s of SHIPS) assert(shipStats(s).push > Math.abs(g.ax), B.id + " vs " + s.id);
    assert(B.r > 0.05 && B.r < 1, B.id);
  }
  for (let i = 0; i < 50; i++) { const now = i % 10; assert.notStrictEqual(nextBody(now), now); }
  assert(BODIES.find((b) => b.id === "hole").pull > BODIES.find((b) => b.id === "redgiant").pull, "a black hole pulls harder than a red giant");
});
ok("every ship has 2 weapons that exist and refill by themselves", () => {
  for (const s of SHIPS) { const w = weaponsOf(s); assert.strictEqual(w.length, 2, s.id); for (const k of w) { assert(WEAPONS[k], k); assert(WEAPONS[k].refill > 0, k); } }
});
ok("a destroyed ship drops a weapon for button 3, which does not refill", () => {
  for (const s of SHIPS) { const w = lootOf(s); assert(LOOT.includes(w), s.id); assert(!WEAPONS[w].refill, w); }
  assert.strictEqual(ammoStep(3, WEAPONS.laser, 10), 3);
});
ok("own weapons refill over their refill time, never past full", () => {
  const W = WEAPONS.twin; assert(Math.abs(ammoStep(0, W, W.refill / 2) - W.ammo / 2) < 1e-9); assert.strictEqual(ammoStep(0, W, 999), W.ammo);
});
ok("the brass ship: cannon on the left pod, brass eye on the right, both ahead of the middle", () => {
  const b = SHIPS.find((s) => s.id === "brass");
  for (const [x, y] of gunsOf(b, "twin")) assert(x < 0 && y < 0);
  for (const [x, y] of gunsOf(b, "iris")) assert(x > 0 && y < 0);
  assert(b.steam && MAGIC[b.magic]);
});
ok("a gun point turns with the ship (nose right: a point ahead goes right)", () => {
  const p = rotatePt(0, -1, Math.PI / 2); assert(Math.abs(p.x - 1) < 1e-9 && Math.abs(p.y) < 1e-9);
});
ok("the fan weapon spreads evenly around the nose", () => {
  const a = pelletAngles(WEAPONS.spread); assert.strictEqual(a.length, 5); assert(Math.abs(a[0] + a[4]) < 1e-9 && a[2] === 0);
  assert.strictEqual(JSON.stringify(pelletAngles(WEAPONS.twin)), "[0]");
});
ok("homing shots turn toward the enemy, keep their speed, not more than allowed", () => {
  const v = steerShot(100, 0, 0, 100, 0.1); assert(Math.abs(Math.hypot(v.vx, v.vy) - 100) < 1e-9); assert(Math.abs(Math.atan2(v.vy, v.vx) - 0.1) < 1e-9);
});
ok("hidden in the smoke, the enemy cannot see you", () => { assert(!enemySees(2)); assert(enemySees(0)); });
ok("THUL twin cannon: 5 frames timed in ms, back to idle after frame 5", () => {
  const A = SHIPS.find((s) => s.id === "brass").anim;
  assert.strictEqual(A.primary.length, 5); assert.strictEqual(seqFrame(A.primary, 0), 0);
  assert.strictEqual(seqLength(A.primary), 375); assert.strictEqual(seqFrame(A.primary, 375), -1);
});
ok("THUL heavy cannon (thul_extended.json): 23 frames, 1,560 ms, the ball leaves at 720 ms on frame 10", () => {
  const A = SHIPS.find((s) => s.id === "brass").anim;
  assert.strictEqual(A.secondary.length, 23); assert.strictEqual(seqLength(A.secondary), 1560);
  assert.strictEqual(cueTime(A.secondary, "fire"), 720); assert.strictEqual(seqFrame(A.secondary, 720), 9);
  assert.strictEqual(A.secondary[9][0], "cannon_10.webp"); assert.strictEqual(seqFrame(A.secondary, 1560), -1);
});
ok("THUL smoke hatches: 23 frames, 1,725 ms, smoke starts at 450 ms", () => {
  const A = SHIPS.find((s) => s.id === "brass").anim;
  assert.strictEqual(A.smoke.length, 23); assert.strictEqual(seqLength(A.smoke), 1725);
  assert.strictEqual(cueTime(A.smoke, "release"), 450);
  assert(Math.abs(A.shotArt.iris.size - 64 / 512 * A.size) < 1e-9, "cannonball 64 px at the hull's scale");
});
ok("THUL twin cannon cues: left barrel at frame 2, right at frame 3", () => {
  const A = SHIPS.find((s) => s.id === "brass").anim;
  assert.strictEqual(seqFrame(A.primary, cueTime(A.primary, "left")), 1);
  assert.strictEqual(seqFrame(A.primary, cueTime(A.primary, "right")), 2);
});
ok("THUL muzzles match the drawing's pixels", () => {
  const S = SHIPS.find((s) => s.id === "brass"), px = (v) => Math.round(v / S.anim.size * 512 + 256);
  const [l, r] = gunsOf(S, "twin"), [e] = gunsOf(S, "iris");
  assert.deepStrictEqual([px(l[0]), px(l[1]), px(r[0]), px(r[1]), px(e[0]), px(e[1])], [117, 130, 144, 127, 362, 194]);
});
ok("every THUL drawing the game asks for is in art/ships/thul/", () => {
  const A = SHIPS.find((s) => s.id === "brass").anim, dir = path.join(__dirname, "../app/src/main/assets/art/ships", A.dir);
  const all = [A.idle, ...[A.primary, A.secondary, A.smoke].flatMap((q) => q.map((x) => x[0])), A.shotArt.iris.file];
  for (const f of all) assert(fs.existsSync(path.join(dir, f.includes(".") ? f : f + ".png")), f);
});
ok("VEXAR (vexar-animation.json): thorns at 63 and 189 ms, the egg at 1,140 ms, hunters at 180 ms into the hatch", () => {
  const A = SHIPS.find((s) => s.id === "vexar").anim;
  assert.strictEqual(seqLength(A.primary), 315); assert.strictEqual(cueTime(A.primary, "left"), 63); assert.strictEqual(cueTime(A.primary, "right"), 189);
  assert.strictEqual(seqLength(A.secondary), 1650); assert.strictEqual(cueTime(A.secondary, "fire"), 1140);
  assert.strictEqual(vexarEggPose(1140).y, 305); assert.strictEqual(vexarEggPose(1140).d, 118); assert.ok(vexarEggPose(0).alpha === 0);
  assert.strictEqual(vexarEggFlight(0).dist, 0); assert.strictEqual(Math.round(vexarEggFlight(460).dist), 295); assert.strictEqual(vexarEggFlight(460).d, 102);
  for (const k of ["mixed", "ember", "azure", "prism"]) {
    const B = A.egg.broods[k];
    assert.strictEqual(seqLength(B.pulse), 600); assert.strictEqual(seqLength(B.hatch), 540); assert.strictEqual(cueTime(B.hatch, "swarm"), 180);
    assert.strictEqual(B.brood.length, 3);
  }
  assert.strictEqual(A.egg.broods.mixed.brood.join(), "ember,azure,prism"); assert.strictEqual(A.egg.broods.azure.brood.join(), "azure,azure,azure");
  for (const k of ["ember", "azure", "prism"]) assert.strictEqual(seqLength(A.egg.insects[k].flight), 240);
  assert.strictEqual(A.egg.incubate, 1150);
});
ok("VEXAR muzzles match the drawing's anchors", () => {
  const S = SHIPS.find((s) => s.id === "vexar"), px = (v) => Math.round(v / S.anim.size * 512 + 256);
  const [l, r] = gunsOf(S, "thorn"), [e] = gunsOf(S, "hive");
  assert.deepStrictEqual([px(l[0]), px(l[1]), px(r[0]), px(r[1]), px(e[0]), px(e[1])], [166, 97, 347, 97, 256, 305]);
});
ok("every VEXAR drawing the game asks for is in art/ships/vexar/", () => {
  const A = SHIPS.find((s) => s.id === "vexar").anim, dir = path.join(__dirname, "../app/src/main/assets/art/ships", A.dir);
  const B = A.egg.broods, I = A.egg.insects;
  const all = [A.idle, ...[A.primary, A.secondary, ...Object.values(B).flatMap((b) => [b.pulse, b.hatch]), ...Object.values(I).map((i) => i.flight)].flatMap((q) => q.map((x) => x[0])),
    A.shotArt.thorn.file, A.tailArt.mount, A.tailArt.vertebra, A.tailArt.stinger];
  for (const f of all) assert(fs.existsSync(path.join(dir, f)), f);
});
ok("the tail grows out, stays, pulls back in, and is gone after that", () => {
  const M = MAGIC.tail;
  assert.strictEqual(tailOut(M, 0), 0); assert(tailOut(M, M.out / 2) > 0.5 && tailOut(M, M.out / 2) < 1);
  assert.strictEqual(tailOut(M, M.out + M.hold / 2), 1);
  const back = tailOut(M, M.out + M.hold + M.back / 2); assert(back > 0 && back < 1);
  assert.strictEqual(tailOut(M, M.out + M.hold + M.back + 0.01), -1);
  assert.strictEqual(M.hold, 8, "one tap: out for 8 s, then back by itself");
});
ok("VEXAR tail pieces: mount, narrowing vertebrae, stinger; they fill the tail's length exactly", () => {
  const P = tailPieces(1620);
  assert.strictEqual(P[0].role, "mount"); assert.strictEqual(P[P.length - 1].role, "stinger");
  assert(Math.abs(P[P.length - 1].end - 1620) < 1e-6); assert.strictEqual(P.length, 20, "the layout's own 18 vertebrae at 4 ship-lengths");
  for (let i = 1; i < P.length; i++) assert(Math.abs(P[i].start - P[i - 1].end) < 1e-6);
  const V = P.filter((p) => p.role === "vertebra"); assert.strictEqual(V[0].w, 72); assert(Math.abs(V[V.length - 1].w - 29) < 1e-9);
  const long = tailPieces(MAGIC.tail.len * 512 / 1.2); assert(Math.abs(long[long.length - 1].end - MAGIC.tail.len * 512 / 1.2) < 1e-6);
});
ok("LYTH (lyth-layout.json): pulse 480 ms, the shot at 168 ms; muzzle and thrusters match the anchors", () => {
  const S = SHIPS.find((s) => s.id === "lyth"), A = S.anim, px = (v) => Math.round(v / A.size * 512 + 256);
  assert.strictEqual(seqLength(A.primary), 480); assert.strictEqual(cueTime(A.primary, "left"), 168);
  const [m] = gunsOf(S, "pulse"); assert.deepStrictEqual([px(m[0]), px(m[1])], [256, 140]);
  assert.strictEqual(S.nozzles.map(px).join(), "235,277"); assert.strictEqual(px(S.engineY), 368);
  const G = pulseGlow(168); assert.strictEqual(G.flash, 1); assert.strictEqual(pulseGlow(480).flash, 0);
});
ok("LYTH ring: unlatches 330 ms, out 960, back 900, locks 340, then home", () => {
  const R = WEAPONS.ring;
  assert.strictEqual(ringPhase(R, 0.1), "unlock"); assert.strictEqual(ringPhase(R, 0.5), "out");
  assert.strictEqual(ringPhase(R, 1.5), "back"); assert.strictEqual(ringPhase(R, 2.3), "lock"); assert.strictEqual(ringPhase(R, 2.6), null);
});
ok("LYTH grinder: pulls, grinds, lets go, then is over; it can only be used again long after", () => {
  const M = MAGIC.grind, S = SHIPS.find((s) => s.id === "lyth");
  assert.strictEqual(S.magic, "grind");
  assert.strictEqual(grindPhase(M, 0.1), "pull"); assert.strictEqual(grindPhase(M, M.pull + 0.1), "grind");
  assert.strictEqual(grindPhase(M, M.pull + M.grind + 0.1), "release"); assert.strictEqual(grindPhase(M, M.pull + M.grind + M.release + 0.01), null);
  assert(M.cool > M.pull + M.grind + M.release); assert(M.dps * M.grind < 100, "one grind does not kill a full-health ship by itself");
});
ok("TALUS (talus-layout.json): seed 0.53, then 0.61 / 0.70 / 0.79 / 0.89 / 1.00; grows between 475 and 955 ms", () => {
  const S = SHIPS.find((s) => s.id === "talus"), st = S.anim.stages;
  assert.strictEqual(st.join(), "0.53,0.61,0.7,0.79,0.89,1");
  assert.strictEqual(talusScale(st, 0, 1, 0.3), 0.53); assert.strictEqual(talusScale(st, 0, 1, 1), 0.61);
  const mid = talusScale(st, 2, 3, 0.715); assert(mid > 0.7 && mid < 0.79);
  for (let i = 0; i < 5; i++) assert.strictEqual(talusScale(st, i, i + 1, 2), st[i + 1], "five separate contacts reach the listed sizes");
  assert.strictEqual(GROW.fly, 0.475); assert.strictEqual(GROW.end, 0.955);
  assert.strictEqual(S.magic, "shatter"); assert.strictEqual(MAGIC.shatter.per * 5, 15, "a full ship bursts into 15 pieces");
  assert(fs.existsSync(path.join(__dirname, "../app/src/main/assets/art/ships/talus", S.anim.idle)));
});
ok("ORIAN (orian-layout.json): bolt at 95 ms, the beam at 1,100 ms of 1,750; five mirrors open and fold; muzzle (256,162)", () => {
  const S = SHIPS.find((s) => s.id === "orian"), A = S.anim, px = (v) => Math.round(v / A.size * 512 + 256);
  assert.strictEqual(seqLength(A.primary), 300); assert.strictEqual(cueTime(A.primary, "left"), 95);
  assert.strictEqual(seqLength(A.secondary), 1750); assert.strictEqual(cueTime(A.secondary, "fire"), 1100);
  const [m] = gunsOf(S, "solar"); assert.strictEqual([px(m[0]), px(m[1])].join(), "256,162");
  const shut = orianPanels(A.fan, 0), open = orianPanels(A.fan, 1060), done = orianPanels(A.fan, 1750);
  assert.strictEqual(open.length, 5); for (const p of open) assert(p.open > 0.99 && p.light > 0.5);
  for (const p of shut) assert(p.open < 0.01); for (const p of done) assert(p.open < 0.01 && p.light < 0.01);
  assert(open[0].x < 0 && open[4].x > 0 && open[2].y > 100, "the fan opens out behind the pod, both sides");
  const dir = path.join(__dirname, "../app/src/main/assets/art/ships/orian");
  for (const f of [A.idle, ...A.primary.map((x) => x[0]), ...A.secondary.map((x) => x[0])]) assert(fs.existsSync(path.join(dir, f)), f);
  for (const n of S.sfxNames) assert(fs.existsSync(path.join(dir, "sfx", n + ".wav")), n);
});
ok("ORIAN soak: a charge for each stretch held; 3 = double speed, 6 = full (then a tap is the light blast)", () => {
  const M = MAGIC.soak; assert.strictEqual(SHIPS.find((s) => s.id === "orian").magic, "soak");
  assert.strictEqual(soakCharges(M, M.stage * 0.9), 0); assert.strictEqual(soakCharges(M, M.stage * 3), 3);
  assert.strictEqual(soakCharges(M, M.stage * 99), 6); assert.strictEqual(M.boost, 2); assert(M.steer < 0.5, "hard to steer while holding");
});
ok("SKARN (skarn-layout.json): shards at 76 ms from both muzzles; jaw catches in front only; spit at 135 ms", () => {
  const S = SHIPS.find((s) => s.id === "skarn"), A = S.anim, px = (v) => Math.round(v / A.size * 512 + 256);
  assert.strictEqual(seqLength(A.primary), 305); assert.strictEqual(cueTime(A.primary, "left"), 76);
  assert.strictEqual(seqLength(A.open), 285); assert.strictEqual(seqLength(A.slam), 230); assert.strictEqual(seqLength(A.spit), 380); assert.strictEqual(cueTime(A.spit, "fire"), 135);
  const [l, r] = gunsOf(S, "spike"); assert.strictEqual([px(l[0]), px(l[1]), px(r[0]), px(r[1])].join(), "144,113,368,113");
  assert(WEAPONS.spike.both && WEAPONS.spike.pellets === 2);
  assert(inTrap(A.trap, 0, 120), "straight ahead, in the mouth"); assert(!inTrap(A.trap, 0, 40), "too close"); assert(!inTrap(A.trap, 0, -120), "behind");
  assert(!inTrap(A.trap, 150, 120), "off to the side"); assert.strictEqual(A.trap.max, 5);
  const dir = path.join(__dirname, "../app/src/main/assets/art/ships/skarn");
  for (const f of [A.idle, ...A.loaded, ...[A.primary, A.open, A.slam, A.spit].flatMap((q) => q.map((x) => x[0]))]) assert(fs.existsSync(path.join(dir, f)), f);
  for (const n of S.sfxNames) assert(fs.existsSync(path.join(dir, "sfx", n + ".wav")), n);
});
ok("DRAKON (drakon-layout.json): two bolts at 54 and 138 ms of 270; the jump at 470 ms of 790; a mark lasts 8 s", () => {
  const S = SHIPS.find((s) => s.id === "drakon"), A = S.anim, px = (v) => Math.round(v / A.size * 512 + 256);
  assert.strictEqual(seqLength(A.primary), 270);
  const bolts = []; let at = 0; for (const f of A.primary) { if (f[2] === "bolt") bolts.push(at); at += f[1]; }
  assert.strictEqual(bolts.join(), "54,138");
  assert.strictEqual(seqLength(A.rift), 790); assert.strictEqual(cueTime(A.rift, "jump"), 470); assert.strictEqual(WEAPONS.rift.life, 8);
  const [m] = gunsOf(S, "dpulse"); assert.strictEqual([px(m[0]), px(m[1])].join(), "305,54");
  const dir = path.join(__dirname, "../app/src/main/assets/art/ships/drakon");
  for (const f of [A.idle, ...A.primary.map((x) => x[0]), ...A.rift.map((x) => x[0])]) assert(fs.existsSync(path.join(dir, f)), f);
  for (const n of S.sfxNames) assert(fs.existsSync(path.join(dir, "sfx", n + ".wav")), n);
});
ok("the computer enemy shoots only plain shots: its own when it can, else the twin cannon", () => {
  const g = (id) => enemyGuns(SHIPS.find((s) => s.id === id)).join();
  assert.strictEqual(g("brass"), "twin,iris"); assert.strictEqual(g("vexar"), "thorn"); assert.strictEqual(g("lyth"), "pulse");
  assert.strictEqual(g("talus"), "shard,boulder"); assert.strictEqual(g("orian"), "bolt"); assert.strictEqual(g("skarn"), "spike"); assert.strictEqual(g("drakon"), "dpulse"); assert.strictEqual(g("xeltar"), "ice", "the stern crystal is not for the computer"); assert.strictEqual(g("kraal"), "hammer"); assert.strictEqual(g("zorian"), "needle");
  for (const s of SHIPS) for (const w of enemyGuns(s)) assert(WEAPONS[w].speed > 0, s.id + " " + w);
});
ok("SKARN's magic: the jaw on chains bites 3 times; caught shots power up its shards", () => {
  const S = SHIPS.find((s) => s.id === "skarn"), M = MAGIC.devour;
  assert.strictEqual(S.magic, "devour"); assert.strictEqual(M.bites * M.dmg, 30); assert(M.range > 2);
  assert(fs.existsSync(path.join(__dirname, "../app/src/main/assets/art/ships/skarn", S.anim.jaw)));
});
ok("XELTAR (xeltar-layout.json): shards at 78 ms; the crystal at 1,070 ms flies out of the stern; ink at 570 ms, cloud 3.4 s", () => {
  const S = SHIPS.find((s) => s.id === "xeltar"), A = S.anim, px = (v) => Math.round(v / A.size * 512 + 256);
  assert.strictEqual(seqLength(A.primary), 260); assert.strictEqual(cueTime(A.primary, "left"), 78);
  assert.strictEqual(seqLength(A.secondary), 1540); assert.strictEqual(cueTime(A.secondary, "fire"), 1070);
  assert.strictEqual(seqLength(A.smoke), 1060); assert.strictEqual(cueTime(A.smoke, "release"), 570); assert.strictEqual(seqLength(A.cloud.frames), 3400);
  assert(WEAPONS.crystal.rear && !WEAPONS.ice.rear); assert.strictEqual(WEAPONS.ice.pellets, 3);
  const [f] = gunsOf(S, "ice"), [r] = gunsOf(S, "crystal");
  assert.strictEqual([px(f[0]), px(f[1]), px(r[0]), px(r[1]), px(A.cloud.y)].join(), "256,46,256,401,387");
  const dir = path.join(__dirname, "../app/src/main/assets/art/ships/xeltar");
  for (const x of [A.idle, ...[A.primary, A.secondary, A.smoke, A.cloud.frames].flatMap((q) => q.map((y) => y[0])), A.shotArt.ice.file, A.shotArt.crystal.file]) assert(fs.existsSync(path.join(dir, x)), x);
  for (const n of S.sfxNames) assert(fs.existsSync(path.join(dir, "sfx", n + ".wav")), n);
});
ok("XELTAR's ink: a ship touching the cloud takes damage and drifts out of control for 20 s", () => {
  const M = MAGIC.ink; assert.strictEqual(M.stun, 20); assert(M.dmg > 0); assert(M.cool < M.stun, "it can ink again while the first one still drifts");
});
ok("KRAAL (kraal-layout.json): bolts at 80 ms; release at 650 of 1,010; muzzles, meeting point and blast radius", () => {
  const S = SHIPS.find((s) => s.id === "kraal"), A = S.anim, px = (v) => Math.round(v / A.size * 512 + 256);
  assert.strictEqual(seqLength(A.primary), 295); assert.strictEqual(cueTime(A.primary, "left"), 80);
  assert.strictEqual(seqLength(A.secondary), 1010); assert.strictEqual(cueTime(A.secondary, "fire"), 650); assert.strictEqual(seqLength(A.blast), 430);
  const [l, r] = gunsOf(S, "hammer"); assert.strictEqual([px(l[0]), px(l[1]), px(r[0]), px(r[1])].join(), "93,143,419,143");
  assert.strictEqual(Math.round(S.focus / A.size * 512), -424); assert.strictEqual(Math.round(WEAPONS.cross.r / A.size * 512), 58);
  assert.strictEqual(WEAPONS.cross.life, 0.425); assert(WEAPONS.hammer.both);
  const dir = path.join(__dirname, "../app/src/main/assets/art/ships/kraal");
  for (const f of [A.idle, A.crossBolt, A.shotArt.hammer.file, ...[A.primary, A.secondary, A.blast].flatMap((q) => q.map((x) => x[0]))]) assert(fs.existsSync(path.join(dir, f)), f);
  for (const n of S.sfxNames) assert(fs.existsSync(path.join(dir, "sfx", n + ".wav")), n);
});
ok("KRAAL: the longer button 2 is held, the farther the bolts meet (up to a limit); the hammer dash magic", () => {
  const W2 = WEAPONS.cross;
  assert.strictEqual(crossReach(W2, 0), W2.near); assert.strictEqual(crossReach(W2, 99), W2.far);
  assert(crossReach(W2, 0.4) < crossReach(W2, 0.8) && crossReach(W2, 0.8) < crossReach(W2, 1.2), "farther the longer it is held");
  assert.strictEqual(SHIPS.find((s) => s.id === "kraal").magic, "hammer"); assert(MAGIC.hammer.dmg > 0 && MAGIC.hammer.speed > 2);
});
ok("ZORIAN (zorian-layout.json): the bolt at 75 ms; the thread lays 150-1,310 ms, warns, arms at 1,540, gone at 3,980", () => {
  const S = SHIPS.find((s) => s.id === "zorian"), A = S.anim, W2 = WEAPONS.thread, px = (v) => Math.round(v / A.size * 512 + 256);
  assert.strictEqual(seqLength(A.primary), 265); assert.strictEqual(cueTime(A.primary, "left"), 75);
  assert.strictEqual(threadPhase(W2, 0.1), "charge"); assert.strictEqual(threadPhase(W2, 0.5), "lay"); assert.strictEqual(threadPhase(W2, 1.4), "warning");
  assert.strictEqual(threadPhase(W2, 2), "armed"); assert.strictEqual(threadPhase(W2, 3.99), null);
  assert.strictEqual(px(gunsOf(S, "needle")[0][1]), 63); assert.strictEqual(px(gunsOf(S, "thread")[0][1]), 441);
  // a target moving across a piece of thread in one step is caught (swept), a target beside it is not
  assert.strictEqual(segDistance({ x: -5, y: 0 }, { x: 5, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 }), 0);
  assert(segDistance({ x: -5, y: 3 }, { x: 5, y: 3 }, { x: 0, y: -1 }, { x: 0, y: 1 }) > 1.9);
  const dir = path.join(__dirname, "../app/src/main/assets/art/ships/zorian");
  for (const f of [A.idle, A.shotArt.needle.file, ...[A.primary, A.projector].flatMap((q) => q.map((x) => x[0]))]) assert(fs.existsSync(path.join(dir, f)), f);
  for (const n of S.sfxNames) assert(fs.existsSync(path.join(dir, "sfx", n + ".wav")), n);
});
ok("ZORIAN: button 2 is the thread, its magic (the anchor) holds it still; VEXAR's tail ends in a spiked ball", () => {
  const S = SHIPS.find((s) => s.id === "zorian");
  assert.strictEqual(weaponsOf(S).join(), "needle,thread"); assert.strictEqual(S.magic, "anchor"); assert(MAGIC.anchor.brake > 0);
  const A = MAGIC.anchor, Wt = WEAPONS.thread;
  assert(A.spin * (Wt.seal - Wt.lay) >= 2 * Math.PI, "spinning while the thread lays makes a whole ring");
  assert(A.hold > Wt.seal && A.ring > 0.6, "the ring is laid outside the hull, where shots have not hit yet");
  const M = MAGIC.tail; assert(M.ball > 0 && M.hit > 0 && M.every > 0 && M.hold === 8);
});
ok("VANTA (vanta-layout.json): the drop at 112 ms of 360, the phase drop at 690 of 1,020; muzzle at (256,51)", () => {
  const S = SHIPS.find((s) => s.id === "vanta"), A = S.anim, px = (v) => Math.round(v / A.size * 512 + 256);
  assert.strictEqual(seqLength(A.primary), 360); assert.strictEqual(cueTime(A.primary, "left"), 112);
  assert.strictEqual(seqLength(A.secondary), 1020); assert.strictEqual(cueTime(A.secondary, "fire"), 690);
  assert.strictEqual(px(gunsOf(S, "mark")[0][1]), 51); assert.strictEqual(weaponsOf(S).join(), "mark,phase");
  assert(WEAPONS.phase.boost > WEAPONS.phase.dmg && WEAPONS.mark.tag === 1.75 && WEAPONS.phase.transit === 0.315 && WEAPONS.phase.warn === 0.21);
  const dir = path.join(__dirname, "../app/src/main/assets/art/ships/vanta");
  for (const f of [A.idle, A.ribbon, A.boosted, A.markGlow, A.exitWarn, A.shotArt.mark.file, A.shotArt.phase.file, ...[A.primary, A.secondary].flatMap((q) => q.map((x) => x[0]))])
    assert(fs.existsSync(path.join(dir, f)), f);
  for (const n of S.sfxNames) assert(fs.existsSync(path.join(dir, "sfx", n + ".wav")), n);
  assert.strictEqual(S.magic, "tint");
  for (const w of ["mark", "phase"]) { const Q = WEAPONS[w]; assert(Q.swell > 0 && Q.grow > 1 && Q.thin > 0 && Q.thin < 1, w + " swells into a thinner ball"); }
  const m = MAGIC.tint.mult; assert(m.length === 4 && m[0] === 1 && m[1] < m[2] && m[2] < m[3], "lime, blue, red, white: each stronger");
});
ok("VANTA's drop through the planet: straight through the middle, a graze, a miss, and one already past", () => {
  const c = phaseChord(-10, 0, 1, 0, 0, 0, 2); assert(Math.abs(c.entry - 8) < 1e-9 && Math.abs(c.exit - 12) < 1e-9);
  const g = phaseChord(-10, 1.9, 1, 0, 0, 0, 2); assert(g && g.exit - g.entry < 1.3);
  assert.strictEqual(phaseChord(-10, 2.5, 1, 0, 0, 0, 2), null);
  assert.strictEqual(phaseChord(10, 0, 1, 0, 0, 0, 2), null);
});
ok("CANTOR (cantor-layout.json): the pulse at 88 of 278 ms; the chord's notes at 120-660, released at 850 of 1,170", () => {
  const S = SHIPS.find((s) => s.id === "cantor"), A = S.anim, px = (v) => Math.round(v / A.size * 512 + 256);
  assert.strictEqual(seqLength(A.primary), 278); assert.strictEqual(cueTime(A.primary, "left"), 88);
  assert.strictEqual(seqLength(A.secondary), 1170); assert.strictEqual(cueTime(A.secondary, "fire"), 850);
  assert.strictEqual(WEAPONS.chord.notes.join(), "120,255,390,525,660");
  assert.strictEqual(JSON.stringify(gunsOf(S, "chord").map(([x, y]) => [px(x), px(y)])), "[[114,111],[183,82],[256,66],[329,82],[398,111]]");
  assert.strictEqual(px(gunsOf(S, "tone")[0][1]), 66);
  const dir = path.join(__dirname, "../app/src/main/assets/art/ships/cantor");
  for (const f of [A.idle, ...A.shotArt.chord.files, ...[A.primary, A.secondary].flatMap((q) => q.map((x) => x[0]))]) assert(fs.existsSync(path.join(dir, f)), f);
  for (const n of S.sfxNames) assert(fs.existsSync(path.join(dir, "sfx", n + ".wav")), n);
});
ok("CANTOR's magic: rings of sound that scramble a ship for a minute", () => {
  const S = SHIPS.find((s) => s.id === "cantor"), M = MAGIC[S.magic];
  assert.strictEqual(S.magic, "resonance"); assert.strictEqual(M.scramble, 60); assert(M.range > 0 && M.speed > 0);
});
ok("RIVET's heavy weapons: magnet balls (spine) and nail mines (crossarm)", () => {
  const S = SHIPS.find((s) => s.id === "rivet");
  assert.strictEqual(weaponsOf(S).join(), "pin,magnet"); assert.strictEqual(weaponsOf(S, 1).join(), "scatter,nails");
  assert(WEAPONS.magnet.magnet > 0 && WEAPONS.magnet.pellets === WEAPONS.magnet.colors.length);
  const N = WEAPONS.nails; assert(N.mines > 1 && N.stop < N.arm && N.arm < N.stay && N.max >= N.mines);
});
ok("GLITCH (glitch-motion.js): shutters shut at rest, open and the core glowing at the pulse, shut again at the end", () => {
  const S = SHIPS.find((s) => s.id === "glitch"), A = S.anim;
  assert.strictEqual(weaponsOf(S).join(), "neon,hack");
  assert.strictEqual(shutterPose(0).open, 0); assert.strictEqual(shutterPose(3300).open, 0);
  const P = shutterPose(1900); assert(P.open > 0.99 && P.glow > 0.9 && P.lx === -45 * P.open && P.rx === 45 * P.open);
  assert.strictEqual(cueTime(A.secondary, "fire") * 2, 1900); assert.strictEqual(seqLength(A.secondary) * 2, 3300);
  assert(WEAPONS.neon.burst === 3 && WEAPONS.hack.status === 2);
  const dir = path.join(__dirname, "../app/src/main/assets/art/ships/glitch");
  for (const f of Object.values(A.layers)) assert(fs.existsSync(path.join(dir, f)), f);
});
ok("RIVET (rivet.js): spine pin + rail, turned a quarter: scatter (5 pellets, +-24 degrees) + wave; ports from the pivot", () => {
  const S = SHIPS.find((s) => s.id === "rivet"), A = S.anim, px = (v) => Math.round(v / A.size * 512);
  assert.strictEqual(S.magic, "flip");
  assert.strictEqual(MAGIC.flip.turn, 0.44);
  assert.strictEqual(JSON.stringify(["pin", "rail", "scatter"].map((w) => gunsOf(S, w)[0].map(px))), "[[113,-179],[-37,169],[-118,-163]]");
  assert.strictEqual(pelletAngles(WEAPONS.scatter).map((a) => Math.round(a * 180 / Math.PI)).join(), "-24,-12,0,12,24");
  assert(WEAPONS.rail.lay === 2 && WEAPONS.rail.last === 2.8 && WEAPONS.wave.dur === 0.34);
  const dir = path.join(__dirname, "../app/src/main/assets/art/ships/rivet");
  assert(fs.existsSync(path.join(dir, A.idle)));
  for (const n of S.sfxNames) assert(fs.existsSync(path.join(dir, "sfx", n + ".wav")), n);
});
ok("THUL: one magic, the smoke screen, three times as thick (and bigger puffs)", () => {
  const S = SHIPS.find((s) => s.id === "brass");
  assert.strictEqual(S.magic, "smoke"); assert(!S.magic2); assert.strictEqual(MAGIC.smoke.rate, 90); assert(MAGIC.smoke.big > 1);
});
ok("GLITCH: two magics on a split button: the V shield (vDeploy) and the slip (counterSlide)", () => {
  const S = SHIPS.find((s) => s.id === "glitch");
  assert.strictEqual(S.magic, "vshield"); assert.strictEqual(S.magic2, "slip");
  assert.strictEqual(vPose(0).open, 0); assert.strictEqual(vPose(3100).open, 0); const V = vPose(1400); assert(V.open > 0.99 && V.ly < -57 && V.ra > 0.38);
  const a = slidePose(900), b = slidePose(1900); assert(a.ly < -60 && a.ry > 60 && b.ly > 60 && b.ry < -60, "both opposite places");
  assert.strictEqual(slidePose(3100).open, 0);
});
ok("REPRISE (reprise-motion.js): three shapes, the reassembly returns home after three; the barrage from three buildings", () => {
  const S = SHIPS.find((s) => s.id === "reprise"), P = S.anim.modules;
  assert.strictEqual(repriseForms(P).length, 3);
  const home = reprisePose(P, 0, 0).shape, done = reprisePose(P, 2, 1.85).shape;
  home.forEach((q, i) => { assert(Math.abs(q.x - done[i].x) < 1e-6 && Math.abs(q.y - done[i].y) < 1e-6 && Math.abs(((q.angle - done[i].angle) % 360 + 360) % 360) < 1e-6); });
  assert.strictEqual(WEAPONS.floors.modules.join(), "1,2,3"); assert.strictEqual(WEAPONS.floors.delays.join(), "0.13,0.26,0.39"); assert.strictEqual(WEAPONS.amber.delays[0], 0.18);
  assert.strictEqual(MAGIC.reassemble.length, 1.85); assert(MAGIC.reassemble.rewind > 0 && MAGIC.reassemble.slow > 0 && MAGIC.reassemble.slow < 1, "the other ship goes back, slowly");
  const dir = path.join(__dirname, "../app/src/main/assets/art/ships/reprise");
  for (const m of P) assert(fs.existsSync(path.join(dir, m.file)), m.file);
});
ok("NIMBUS (nimbus-motion.js): the bolt at 360 of 750 ms, the storm at 750 of 1,150, the rainbow at 720 of 1,320; muzzle (256,95)", () => {
  const S = SHIPS.find((s) => s.id === "nimbus"), A = S.anim, px = (v) => Math.round(v / A.size * 512 + 256);
  assert.strictEqual(seqLength(A.primary), 750); assert.strictEqual(cueTime(A.primary, "bolt"), 360);
  assert.strictEqual(seqLength(A.secondary), 1150); assert.strictEqual(cueTime(A.secondary, "fire"), 750);
  assert.strictEqual(seqLength(A.rainbow), 1320); assert.strictEqual(cueTime(A.rainbow, "rain"), 720);
  assert.strictEqual(px(gunsOf(S, "lightning")[0][1]), 95); assert.strictEqual(A.field.length, 79); assert.strictEqual(A.arc.length, 33);
  const P = stormPose(0), Q = stormPose(1.5); assert(P.travel === 0 && Q.travel === 1 && Q.grow === 1 && Q.live && !stormPose(3).live);
  assert(rainbowPose(1.25).opacity < 0.01 && rainbowPose(0.6).opacity > 0.9);
  assert.strictEqual(WEAPONS.storm.strikes.map((q) => q[0]).join(), "1.23,1.83,2.48");
  assert(WEAPONS.storm.hold >= 170 && WEAPONS.storm.hold <= 190 && WEAPONS.storm.holdAt > 2.48, "the thundercloud stays about 3 minutes, after its strikes");
  const dir = path.join(__dirname, "../app/src/main/assets/art/ships/nimbus");
  assert.strictEqual(A.idleLoop.length, 32);
  for (const f of [A.idle, ...A.idleLoop, ...A.field, ...A.arc, ...A.shotArt.lightning.frames, ...[A.primary, A.secondary, A.rainbow].flatMap((q) => q.map((x) => x[0]))]) assert(fs.existsSync(path.join(dir, f)), f);
  for (const n of S.sfxNames) assert(fs.existsSync(path.join(dir, "sfx", n + ".wav")), n);
});
ok("PUFF (puff-burst.js): puffs up in 1.5 s and holds; crumples in 0.9 s and stays crumpled; 12 spines all round", () => {
  const S = SHIPS.find((s) => s.id === "puff"), A = S.anim, M = MAGIC.inflate;
  assert.strictEqual(A.inflate.length, 31); assert.strictEqual(A.collapse.length, 24); assert.strictEqual(S.magic, "inflate"); assert.strictEqual(weaponsOf(S).join(), "needles,bubble");
  assert.strictEqual(puffFrame("up", 0), "inflate_01.webp"); assert.strictEqual(puffFrame("up", 1.49), "inflate_30.webp"); assert.strictEqual(puffFrame("full", 99), "inflate_31.webp");
  assert.strictEqual(puffFrame("down", 0), "collapse_01.webp"); assert.strictEqual(puffFrame("down", M.down - 0.01), "collapse_23.webp"); assert.strictEqual(puffFrame("flat", 0), "collapse_24.webp");
  assert.strictEqual(puffFrame(null, 0), null);
  assert.strictEqual(PUFF_SPINES.length, 12); assert.strictEqual(new Set(PUFF_SPINES.map((p) => p[2] % 360)).size, 12);
  assert.ok(WEAPONS.spine && M.jetTop > 1 && M.jet > 0);
  const dir = path.join(__dirname, "../app/src/main/assets/art/ships/puff");
  for (const f of [...A.inflate.map((x) => x[0]), ...A.collapse, A.shotArt.spine.file]) assert(fs.existsSync(path.join(dir, f)), f);
});
ok("THUL's smoke is a chemical haze that hurts", () => { assert.ok(MAGIC.smoke.chem.dps > 0); });
ok("CINDER (cinder-combat.js): two guns taking turns; engines swivel to the side and settle back; the slip at 170 ms", () => {
  const S = SHIPS.find((s) => s.id === "cinder"), A = S.anim, px = (v) => Math.round(v / A.size * 512);
  assert.strictEqual(weaponsOf(S).join(), "blaster,torpedo"); assert.strictEqual(S.magic, "dashL"); assert.strictEqual(S.magic2, "dashR");
  assert.strictEqual(JSON.stringify(gunsOf(S, "blaster").map((g) => g.map(px))), "[[-71,-188],[71,-188]]");
  assert.strictEqual(px(gunsOf(S, "torpedo")[0][1]), -197);
  const rest = cinderEngines(-1, 1), mid = cinderEngines(200, 1), left = cinderEngines(200, -1), end = cinderEngines(660, 1);
  assert(Math.abs(rest[0].angle - 20 * Math.PI / 180) < 1e-9 && Math.abs(rest[1].angle + 20 * Math.PI / 180) < 1e-9);
  assert(mid[0].angle > 1.3 && mid[1].angle > 1.3 && left[0].angle < -1.3, "both swivel toward the side");
  assert(Math.abs(end[0].angle - rest[0].angle) < 1e-6, "and settle back");
  assert(MAGIC.dashR.at === 0.17 && MAGIC.dashR.dir === 1 && MAGIC.dashL.dir === -1 && WEAPONS.torpedo.life === 0.95);
  const dir = path.join(__dirname, "../app/src/main/assets/art/ships/cinder");
  for (const f of Object.values(A.parts).concat(A.idle)) assert(fs.existsSync(path.join(dir, f)), f);
});
ok("the 3 ships come from the email: always the same 3 for one email (any capitals or spaces), all different, all drawn", () => {
  const a = rollFleet("Shiran@Gmail.com"), b = rollFleet(" shiran@gmail.com "), c = rollFleet("someone.else@gmail.com");
  assert.strictEqual(a.join(), b.join()); assert.strictEqual(a.length, 3); assert.strictEqual(new Set(a).size, 3);
  assert(a.every((id) => SHIPS.find((s) => s.id === id).anim)); assert.notStrictEqual(a.join(), c.join());
  const many = new Set(); for (let i = 0; i < 300; i++) rollFleet("p" + i + "@x.com").forEach((id) => many.add(id));
  assert(many.size >= 15, "different emails get many different ships");
});
ok("the reward for beating a player: quicker, healthier, a rarer ship and a streak all pay more", () => {
  const base = killReward(200, 0, "common", 1).total, fast = killReward(5, 0, "common", 1).total, healthy = killReward(200, 100, "common", 1).total;
  assert.strictEqual(base, 100); assert(fast > base && healthy > base && killReward(200, 0, "legendary", 1).total > base);
  assert(killReward(200, 0, "common", 4).total > base && killReward(200, 0, "common", 99).total <= base * 2);
});
ok("SKARN: the mouth stays open 4.5 s, sucks shots in, and each catch refills; XELTAR swims (3 x 16 frames)", () => {
  const T = SHIPS.find((s) => s.id === "skarn").anim.trap; assert(T.catch === 4.5 && T.suck > 0 && T.ammo > 0 && T.magic > 0);
  const X = SHIPS.find((s) => s.id === "xeltar").anim, dir = path.join(__dirname, "../app/src/main/assets/art/ships/xeltar");
  assert.strictEqual(X.swim.length, 3); for (const f of X.swim.flat()) assert(fs.existsSync(path.join(dir, f)), f);
});
ok("DRAKON's magic: split once a life, then a big blast", () => {
  const S = SHIPS.find((s) => s.id === "drakon"); assert.strictEqual(S.magic, "split"); assert(S.anim.seam);
  const M = MAGIC.split; assert(M.blast >= 3 && M.dmg > M.edge && M.edge > 0);
});
ok("every LYTH drawing and sound is in art/ships/lyth/", () => {
  const A = SHIPS.find((s) => s.id === "lyth").anim, dir = path.join(__dirname, "../app/src/main/assets/art/ships", A.dir);
  for (const f of [A.idle, A.hull, A.ring, ...A.primary.map((x) => x[0])]) assert(fs.existsSync(path.join(dir, f)), f);
  for (const n of SFX) assert(fs.existsSync(path.join(dir, "sfx", n + ".wav")), n);
});
ok("crashing: gentle bumps are free, harder crashes hurt more, never more than RAM_DAMAGE", () => {
  assert.strictEqual(ramDamage(0.2), 0); assert(ramDamage(0.8) > 0 && ramDamage(1.2) > ramDamage(0.8));
  assert.strictEqual(ramDamage(9), RAM_DAMAGE); assert(SHIP_HP > RAM_DAMAGE * 2, "one crash never kills");
});
ok("thrust joystick: drag up/right/down/left points the nose that way; the middle keeps the heading", () => {
  assert.strictEqual(stickHeading(2, -3, 50), null);
  assert.strictEqual(deg(stickHeading(0, -40, 50)), 0); assert.strictEqual(deg(stickHeading(40, 0, 50)), 90);
  assert.strictEqual(Math.abs(deg(stickHeading(0, 40, 50))), 180); assert.strictEqual(deg(stickHeading(-40, 0, 50)), -90);
});
ok("BORER: the star mine dive turns to the star, bores in, backs out the same way", () => {
  const M = MAGIC.starmine, S = shipById("borer");
  assert.strictEqual(S.magic, "starmine"); assert.strictEqual(S.weapons.join(), "shrapnel,drillmine");
  assert.strictEqual(starMineCheck(0.3, false, M), "ok"); assert.strictEqual(starMineCheck(2, false, M), "range");
  assert.strictEqual(starMineCheck(0.3, true, M), "occupied"); assert.strictEqual(starMineCheck(-0.1, false, M), "range");
  // ship to the right of a star at (0,0), nose up (ang 0): it must face left (-PI/2)
  const J = { x: 100, y: 0, ang: 0, turn: -Math.PI / 2, bx: 20, by: 0, ex: 90, ey: 0 };
  const L = M.legs, a = starMinePose(J, 0, M), b = starMinePose(J, L + M.windup, M), c = starMinePose(J, L + M.plant, M), d = starMinePose(J, L + M.end, M);
  assert.strictEqual(a.phase, "legs"); assert.strictEqual(a.x, 100); assert.strictEqual(starMinePose(J, L + 10, M).phase, "spin");
  // the legs: out before it bores, folded while it is in, kicked out once coming out, folded at the end
  assert.strictEqual(borerLegs(0, M), 0); assert.strictEqual(borerLegs(L, M), 1); assert.strictEqual(borerLegs(L + M.windup - 1, M) > 0.99, true);
  assert.strictEqual(borerLegs(L + M.plant, M), 0); assert.ok(borerLegs(L + M.end - 210, M) > 0.99); assert.ok(borerLegs(L + M.end, M) < 1e-9);
  assert.ok(Math.abs(b.ang + Math.PI / 2) < 1e-9); assert.strictEqual(b.x, 100);
  assert.strictEqual(c.phase, "plant"); assert.ok(Math.abs(c.x - 20) < 1e-9);
  assert.strictEqual(d.phase, "done"); assert.ok(Math.abs(d.x - 90) < 1e-9); assert.ok(Math.abs(d.ang + Math.PI / 2) < 1e-9);
  assert.ok(M.windup < M.inside && M.inside < M.plant && M.plant < M.exit && M.exit < M.end);
});
ok("BORER: the drill turns while it bores, and shows only during the dive", () => {
  assert.strictEqual(borerDrill(0).mix, 0); assert.strictEqual(borerDrill(800).mix, 1); assert.strictEqual(borerDrill(1780).mix, 0);
  for (let t = 0; t <= 1780; t += 37) { const f = borerDrill(t).frame; assert.ok(f >= 0 && f < 24 && Number.isInteger(f)); }
  assert.notStrictEqual(borerDrill(500).frame, borerDrill(530).frame);
});
ok("MIRAGE: charged shots, a seed that splits in three, a false star that only pulls nearby shots", () => {
  const S = shipById("mirage"), M = MAGIC.lens, A = S.anim;
  assert.strictEqual(S.weapons.join(), "mpulse,seed"); assert.strictEqual(S.magic, "lens");
  assert.ok(Math.abs(cueTime(A.primary, "bolt") - 280) < 1e-6); assert.ok(Math.abs(cueTime(A.secondary, "fire") - 390) < 1e-6); assert.ok(Math.abs(cueTime(A.lens, "fire") - 480) < 1e-6);
  assert.ok(WEAPONS.mpulse.cued); assert.ok(WEAPONS[WEAPONS.seed.shard]);
  assert.deepStrictEqual(Object.values(lensPull(M.radius + 0.1, 0, M)), [0, 0]);
  const near = lensPull(0.5, 0, M), far = lensPull(1.1, 0, M);
  assert.ok(near.ax > 0 && near.ay === 0 && near.ax > far.ax && near.ax <= M.max);
  assert.ok(lensPull(0, -0.01, M).ay < 0);
});
ok("RIVET's moving parts: the turn drawn into each frame; stars only bounce BORER and ORIAN", () => {
  const A = shipById("rivet").anim;
  for (const k of ["pin", "rail", "scatter", "wave", "magic", "magicBack"]) assert.strictEqual(A[k].length, 12);
  assert.strictEqual(Math.round(seqLength(A.magic)) - 40, 440); assert.strictEqual(A.magic[0][3], 0); assert.strictEqual(A.magic[11][3], 90);
  assert.strictEqual(A.magicBack[0][3], 90); assert.strictEqual(A.magicBack[11][3], 0); assert.strictEqual(A.scatter[5][3], 90);
  assert.strictEqual(A.mech.nails, "wave"); assert.strictEqual(A.mech.magnet, "rail");
  assert.ok(shipById("borer").starProof && shipById("orian").starProof); assert.ok(!shipById("rivet").starProof);
});
ok("CINDER fires through its recoil frames; BORER's thrust armour opens, holds, closes, and turns back mid-way", () => {
  const C = shipById("cinder").anim, B = shipById("borer").anim, T = { pos: 0, hold: 0, opening: false };
  assert.strictEqual(C.fireL.length, 11); assert.strictEqual(C.fireR.length, 11); assert.strictEqual(C.torpedo.length, 33);
  assert.strictEqual(borerThrust(T, false, 0.05, B.thrust), null);
  assert.strictEqual(borerThrust(T, true, 0.001, B.thrust), "thrust_open_01.webp");
  assert.strictEqual(borerThrust(T, true, 0.5, B.thrust), "thrust_hold_01.webp");
  assert.strictEqual(borerThrust(T, true, 0.035, B.thrust), "thrust_hold_02.webp");
  assert.strictEqual(borerThrust(T, false, 0.16, B.thrust), "thrust_close_09.webp");   // half way shut
  assert.strictEqual(borerThrust(T, true, 0.1, B.thrust), "thrust_open_11.webp");     // back open from there
  assert.strictEqual(borerThrust(T, false, 1, B.thrust), null);
  const fs = require("fs"), path = require("path"), dir = (d) => path.join(__dirname, "../app/src/main/assets/art/ships", d);
  for (const f of [...C.fireL, ...C.fireR, ...C.torpedo].map((x) => x[0])) assert(fs.existsSync(path.join(dir("cinder"), f)), f);
  for (const k of ["open", "hold", "close"]) for (let i = 1; i <= B.thrust[k]; i++) assert(fs.existsSync(path.join(dir("borer"), "thrust_" + k + "_" + String(i).padStart(2, "0") + ".webp")));
  for (const f of [...shipById("skarn").anim.primary, ...shipById("skarn").anim.spit].map((x) => x[0])) assert(fs.existsSync(path.join(dir("skarn"), f)), f);
});
ok("PUFF's bubble grows in five pushes while held, then wobbles at full size", () => {
  assert.strictEqual(bubbleCharge(0).radius, 18); assert.strictEqual(bubbleCharge(0).stage, 0);
  assert.ok(Math.abs(bubbleCharge(380).radius - 43) < 1e-9); assert.strictEqual(bubbleCharge(1000).stage, 2);
  assert.strictEqual(bubbleCharge(2450).radius, 176); assert.ok(bubbleCharge(5000).max);
  let last = 0; for (let t = 0; t <= 2450; t += 25) { const r = bubbleCharge(t).radius; assert.ok(r >= last - 1e-9); last = r; }
  assert.ok(WEAPONS.bubble.blow && WEAPONS.bubble.dmgMax > 0);
  for (const w in WEAPONS) if (w !== "bubble") assert.ok(!WEAPONS[w].blow, w);   // (NIMBUS once got the bubble through a shared flag)
});
ok("TALUS forges its boulder: grows in steps to 55 px, fragments fly in, it leaves at 1,430 ms", () => {
  assert.strictEqual(talusForge(0).radius, 0); assert.strictEqual(talusForge(1430).radius, 55); assert.ok(talusForge(600).radius > 15 && talusForge(600).radius < 32);
  assert.strictEqual(talusForge(0).chips.length, 20); assert.ok(talusForge(470).thump > 0.9); assert.strictEqual(WEAPONS.boulder.forge, 1.43);
});
ok("the computer gets stronger every level, within limits", () => {
  const a = levelStats(1), b = levelStats(2), z = levelStats(50);
  assert(b.dmg > a.dmg && b.armor > a.armor && b.aim < a.aim && b.special < a.special && b.magic < a.magic);
  assert(a.dmg < 1, "level 1 hits softer than a player");
  assert(z.dmg <= 1.8 && z.armor <= 2.2 && z.aim >= 0.05 && z.react >= 0.1);
});
ok("PALISADE: the wall stops a shot's path through it, and a straight bolt banks straight back", () => {
  const S = shipById("palisade"); assert.strictEqual(S.weapons.join(), "ricochet,wall"); assert.strictEqual(S.magic, "ceramic");
  // a wall facing up (ang 0), 1.3 wide, 0.13 deep; a shot from below moving up through it in one long step
  const H = palInteract(0, { x: 0.2, y: 1 }, { x: 0, y: -2 }, 0.65, 0.065);
  assert.ok(H && Math.abs(H.entry - (1 - 0.065) / 2) < 1e-9 && Math.abs(Math.abs(H.normal.y) - 1) < 1e-9);
  assert.strictEqual(palInteract(0, { x: 1, y: 1 }, { x: 0, y: -2 }, 0.65, 0.065), null);   // passes beside it
  const E = palInteract(0, { x: -2, y: 0 }, { x: 4, y: 0 }, 0.65, 0.065); assert.ok(Math.abs(Math.abs(E.normal.x) - 1) < 1e-9);   // its end face
  assert.strictEqual(palCarrier(100), null); assert.ok(Math.abs(palCarrier(1040).distance - 100) < 1e-9);   // the arms set it 100 units out
  assert.ok(Math.abs(PAL.dist - 100 * PAL.u) < 1e-9);
});
ok("GIMBAL's gate: a shot through it is caught where it first touches; one passing beside it is not", () => {
  assert(Math.abs(gateSweep(-100, 0, 200, 0, 29) - 71 / 200) < 1e-9);
  assert.strictEqual(gateSweep(-100, 40, 200, 0, 29), null);
  assert.strictEqual(gateSweep(-100, 0, 50, 0, 29), null);   // stops short of it
});
ok("GIMBAL's gate: one long step right over it is still caught (no jumping through)", () => { const t = gateSweep(0, -900, 0, 1800, 29); assert(t > 0.48 && t < 0.5); });
ok("GIMBAL's gate turns a shot a quarter round clockwise, same speed", () => {
  const r = quarterTurn(1, 0); assert.strictEqual(r.vx, -0); assert.strictEqual(r.vy, 1);   // right -> down
  const d = quarterTurn(0, 1); assert.strictEqual(d.vx, -1); assert.strictEqual(d.vy, 0);   // down -> left
});
ok("GIMBAL's clockwork: holds still between ticks, 30° a tick, a full turn in 12 ticks (4.92 s)", () => {
  assert.strictEqual(gimbalTurn(30), 0);                                   // before the first tick moves
  assert(Math.abs(gimbalTurn(400) - Math.PI / 6) < 1e-9);                   // one tick done, holding
  assert(Math.abs(gimbalTurn(4920) - 2 * Math.PI) < 1e-9);                  // round once
  let last = -1; for (let ms = 0; ms < 4920; ms += 7) { const a = gimbalTurn(ms); assert(a >= last - 0.06, ms); last = a; }   // only forward (but the small settle)
});
ok("LARIAT's cable pulls only when taut, never more than its limit", () => {
  assert.strictEqual(cablePull(90, 100, 0, 4.7, 2.2, 470), 0);
  assert(Math.abs(cablePull(120, 100, 0, 4.7, 2.2, 470) - 94) < 1e-9);
  assert.strictEqual(cablePull(500, 100, 0, 4.7, 2.2, 470), 470);
  assert.strictEqual(cablePull(120, 100, 100, 4.7, 2.2, 470), 0);   // already rushing in: no extra pull
});
ok("LARIAT's release: the push goes the way it is circling (both ways), speed capped", () => {
  // ship to the right of the star (dx 100): circling clockwise on screen is moving down (+y)
  const cw = cableRelease(100, 0, 0, 50, 0, -1, 120, 335); assert(cw.vy > 50 && Math.abs(cw.vx) < 1e-9);
  const ccw = cableRelease(100, 0, 0, -50, 0, -1, 120, 335); assert(ccw.vy < -50);
  const fast = cableRelease(100, 0, 0, 300, 0, -1, 120, 335); assert(Math.abs(Math.hypot(fast.vx, fast.vy) - 335) < 1e-9);
  const still = cableRelease(100, 0, 0, 0, 0, 1, 120, 335); assert(still.vy > 0);   // from rest: the way the nose leans (down)
});
ok("BALLAST's tow: wing, then three cables, then the weight's stop, then the reel-in (the package's order)", () => {
  const M = MAGIC.tow, at = (t, rel = null, miss = false) => towRig({ t, rel, miss }, M);
  const S = shipById("ballast"); assert(S && S.magic === "tow" && S.anim); assert.strictEqual(weaponsOf(S).join(), "railslug,sinker");
  assert.strictEqual(at(0.3).wing, 0); assert(at(0.95).wing > 0.99);
  assert(at(0.8).leads[0] > 0 && at(0.8).leads[2] === 0); assert(at(1.4).leads.every((v) => v > 0.99));   // 100 ms apart, all in by the stop
  assert(at(1.42).weight < 1 && at(M.stop).weight === 1); assert(at(M.stop).impact > 0.9);
  assert.strictEqual(at(M.stop).reel, 0); assert(at(3).reel > 0.3 && at(3).reel < 0.9); assert.strictEqual(at(4.2).reel, 1);
  // let go: the cables drop at once; the wing and weight fold back
  const g = at(6, 0.05); assert(g.leads.every((v) => v === 0)); assert(at(6, 1).wing === 0 && at(6, 1).weight === 0);
  // let go too soon: the cables come back in
  assert(at(1.0, 0.05, true).leads[0] > 0 && at(1.2, 0.35, true).leads.every((v) => v === 0));
  assert(M.blast > 2 && M.dmg > M.edge && M.fuse === 5);
  assert(SHIP_HP > 0 && BALLAST_UNIT * 139 < 1);   // the hull is under a ship-length long
});
ok("STRATA's vertical shift: tips, jets, rises; only all the way up does the lock count; the laser, then down", () => {
  const M = MAGIC.vshift, S = shipById("strata"); assert(S && S.magic === "vshift" && S.anim && S.strata);
  assert.strictEqual(weaponsOf(S).join(), "forkbolt,riftseeker");
  const P = (t, o = {}) => stratPose({ t, fall: null, fire: null, lockT: 0, ...o }, M);
  assert(!P(0.2).up && P(0.5).bank > 0.5 && P(0.6).jet > 0.5);
  assert(!P(1.5).top && P(1.7).top && P(1.7).up && P(1.7).z === 1 && P(2).jet === 0);
  assert.strictEqual(P(2, { lockT: M.hold / 2 }).lock, 0.5);
  const f = P(3.3, { fire: 3.2, fall: 3.7 }); assert(f.beam > 0.9 && f.up);   // the beam opens only after the lock
  assert(P(3.75, { fire: 3.2, fall: 3.7 }).beam === 0 && !P(3.7 + M.fall, { fire: 3.2, fall: 3.7 }).up);
  assert(P(4.0, { fall: 3.7 }).bank > 0 && stratPose(null, M).z === 0);
  assert(M.hold === 0.25 && M.lock === 0.6 && M.tank && STRATA_W > 0.5);
  assert(M.stay - M.rise[1] > 2 * (4.6 - M.rise[1]) - 0.01);   // up there twice as long as before
});
ok("KILN: mines in a fan of three; the gear spins up; the reversed body pushes out AND round, the same for the same seed", () => {
  const M = MAGIC.reverse, S = shipById("kiln"); assert(S && S.magic === "reverse" && S.anim);
  assert.strictEqual(weaponsOf(S).join(), "slag,kmine"); assert.strictEqual(WEAPONS.kmine.mines, 3);
  assert(kilnRig(0).open === 0 && kilnRig(0.7).open > 0.99 && kilnRig(0.7).power > 0.99 && kilnRig(M.at + M.last + 1).open === 0);
  assert(kilnRig(2).angle > kilnRig(1).angle);   // the gear keeps turning
  assert(revRamp(-0.1, M) === 0 && revRamp(1, M) === 1 && revRamp(M.last + 0.6, M) === 0);
  const u = 100, a = revAccel(150, 0, 1, 7, M, u), b = revAccel(150, 0, 1, 7, M, u), c = revAccel(150, 0, 1, 8, M, u);
  assert(a.ax > 0, "pushed out"); assert(Math.abs(a.ay) > 0, "and round"); assert.deepStrictEqual([a.ax, a.ay], [b.ax, b.ay]);
  assert(Math.sign(a.ay) !== Math.sign(c.ay), "the seed picks the way round");
  const far = revAccel(u * M.reach * 2.1, 0, 1, 7, M, u); assert(far.ax === 0 && far.ay === 0);
});
ok("FRANKENSTEIN: 5 s of surgery, four parts 3 s each (inside the work zone), a creature that fires bolts, springs and nuts", () => {
  const M = MAGIC.surgery, S = shipById("frankenstein"); assert(S && S.magic === "surgery" && S.anim && S.frank);
  assert.strictEqual(weaponsOf(S).join(), "scalpel,suture");
  assert(M.prep === 5 && M.join === 3 && M.zone > 1 && M.hp === 2 * SHIP_HP && M.cool > 0 && M.life === undefined);   // two tanks of power, no wearing out
  for (const w of ["sbolt", "sspring", "snut"]) assert(WEAPONS[w] && WEAPONS[w].scrap && WEAPONS[w].dmg > 0, w);
  assert(!SHIPS.some((q) => /creature|companion/i.test(q.id)), "the creature is not a ship anyone can pick");
});
ok("the four new ships have kit buttons in the HUD, all five of them", () => {
  const fs = require("fs"), path = require("path");
  for (const id of ["ballast", "strata", "kiln", "frankenstein"]) for (const slot of ["thrust", "primary", "secondary", "pickup", "magic"])
    assert(fs.existsSync(path.join(__dirname, "../app/src/main/assets/art/hud", id, slot + "-plate.webp")), id + " " + slot);
  assert(/bloom: \{ a: "#8ff5d8", b: "#ff9ad8", face: true, round: true \}/.test(html), "BLOOM's buttons are as they were");
});
ok("LABYRINTH: a steady stream of rivets from both arms; a big homing ball that bounces and blows up near the target; Starforge, then 60 s of maze", () => {
  const S = shipById("labyrinth"), M = MAGIC.starforge; assert(S && S.magic === "starforge" && S.anim && S.labyrinth);
  assert.strictEqual(weaponsOf(S).join(), "rivet,forgeball");
  const R = WEAPONS.rivet; assert(!R.burst && R.cool <= 0.15 && gunsOf(S, "rivet").length === 2 && R.lab);
  const B = WEAPONS.forgeball; assert(B.homing > 0 && B.blast > 0 && B.blastDmg > R.dmg && B.prox > 0 && B.lab && B.bounces > M.bounces && B.r > R.r * 3);
  assert(M.build === 4.5 && M.wave === 0.65 && M.last === 60 && M.hit === 4 && M.hitCool === 0.5 && M.loops === 0.2 && M.cell === 0.5);
  const A = S.anim; assert(cueTime(A.primary, "right") - cueTime(A.primary, "left") === 75);
  assert(cueTime(A.secondary, "fire") === 200 && A.idleLoop.length === 24 && A.melt.length === 22);
});
ok("the maze: every cell joined (it wraps round), the same for the same seed, open round the star, a way through", () => {
  for (const [c, r] of [[6, 13], [6, 6], [6, 4], [5, 11]]) for (let seed = 1; seed < 60; seed++) {
    const G = mazeMake(seed, c, r, 0.2, [1.2, 1.2]); assert(mazeConnected(G), c + "x" + r + " " + seed);
    const mid = Math.floor(c / 2) + Math.floor(r / 2) * c; assert(mazeNext(G, mid).length >= 2, "two ways out of the middle");
    const nx = mazeRoute(G, 0, c * r - 1); assert(nx >= 0 && mazeNext(G, 0).includes(nx));
  }
  const a = mazeMake(42, 6, 13, 0.2), b = mazeMake(42, 6, 13, 0.2), d = mazeMake(43, 6, 13, 0.2);
  assert.deepStrictEqual([...a.E, ...a.S], [...b.E, ...b.S]); assert.notDeepStrictEqual([...a.E, ...a.S], [...d.E, ...d.S]);
  const walls = [...a.E, ...a.S].filter((v) => v).length; assert(walls > 40 && walls < 6 * 13 * 2 - 6 * 13 + 1, "a tree plus some loops");
});
ok("against a wall: a shot meets the face it flies into, and bounces off it at the same speed", () => {
  const h = sweepBox(10, 0, 6, 0, 1, 5); assert(h && Math.abs(h.t - 0.5) < 1e-9 && h.nx === -1 && h.ny === 0);
  const g = sweepBox(0, -10, 0, -6, 5, 1); assert(g && g.ny === 1 && g.nx === 0);
  assert.strictEqual(sweepBox(10, 0, 6, 8, 1, 1), null); assert.strictEqual(sweepBox(1, 0, 0, 0, 1, 1), null);   // missing; starting inside
  assert(Math.abs(sweepBox(100, 0, 6, 0, 0.1, 5).t - 0.059) < 1e-9);   // a fast shot cannot pass through a thin wall
  const v = bounceOff(3, 4, -1, 0); assert(v.vx === -3 && v.vy === 4);
  const w = bounceOff(3, 4, -1, 0, 0.3); assert(Math.abs(w.vx + 0.9) < 1e-9 && w.vy === 4);   // a ship: a light rebound, the slide kept
});
ok("BOILER: a torpedo that hunts only out of the water; a floating can that rises and blows up at the surface; Flood Hunt 2 s + 60 s + 1 s", () => {
  const S = shipById("boiler"), M = MAGIC.flood; assert(S && S.magic === "flood" && S.anim && S.boiler);
  assert.strictEqual(weaponsOf(S).join(), "ptorp,fcan");
  const T = WEAPONS.ptorp; assert(T.dmg === 12 && T.cool === 0.8 && T.life === 4 && T.ptorp && T.homing > 0 && T.homing < WEAPONS.missile.homing && T.dry);
  const C = WEAPONS.fcan; assert(C.buoy > 0 && C.blast > 0 && C.blastDmg > 0 && C.boilerW && T.boilerW);
  assert(M.fill === 2 && M.hunt === 60 && M.drain === 1 && M.xeltar > 1 && M.dragXeltar < M.drag && M.top < M.bottom);
  assert(S.anim.idleLoop.length === 32 && S.anim.pressure.length === 32 && S.anim.primary.length === 16);
  for (const id of ["labyrinth", "boiler"]) for (const slot of ["thrust", "primary", "secondary", "pickup", "magic"])
    assert(require("fs").existsSync(require("path").join(__dirname, "../app/src/main/assets/art/hud", id, slot + "-plate.webp")), id + " " + slot);
});
ok("the two stores (weapons: KIP, shields: BRASS): pictures and idle animations exist, the docking point is in the bay and clear of the solid parts; the shop's art and prices", () => {
  const fs = require("fs"), path = require("path"), A = path.join(__dirname, "../app/src/main/assets"), html = fs.readFileSync(path.join(A, "index.html"), "utf8");
  const i0 = html.indexOf("const STORE_LOOKS = {"), byKind = eval("(" + html.slice(i0 + 19, html.indexOf("\n};", i0) + 2) + ")"), looks = Object.values(byKind);
  assert(byKind.weapon.merchant === "kip" && byKind.shield.merchant === "brass" && byKind.weapon.goods.includes("weapon") && byKind.shield.goods.includes("shield"));
  for (const L of looks) {
    assert(fs.existsSync(path.join(A, L.file)) && fs.existsSync(path.join(A, L.idle)), L.file);
    const [bx0, by0, bx1, by1] = L.bay, [dx, dy] = L.dock;
    assert(dx > bx0 && dx < bx1 && dy > by0 && dy < by1, "dock in the bay");
    for (const [x0, y0, x1, y1] of L.solid) { assert(!(dx > x0 && dx < x1 && dy > y0 && dy < y1), "dock not inside a solid part"); assert(!(bx0 >= x0 && bx1 <= x1 && by0 >= y0 && by1 <= y1)); }
    assert(by1 > 0.8, "the bay opens downward");
  }
  for (const f of ["life", "shield", "ammo", "ship", "alien/idle", "alien/wave-up", "alien/wave-out", "alien/present-closed", "alien/present-open", "alien/present-round",
    ...["kip", "brass"].flatMap((m) => ["idle", "greet", "present", "return", "idle-01", "idle-08", "face-neutral", "face-ah", "face-ee", "face-o", "face-m", "face-f", "face-blink", "face-smile"].map((q) => m + "/" + q))])
    assert(fs.existsSync(path.join(A, "art/ui/shop", f + ".webp")), f);
  const shop = eval("(" + html.slice(html.indexOf("const SHOP = {") + 13, html.indexOf("\n};", html.indexOf("const SHOP = {")) + 2) + ")");
  for (const k of ["pasPrice", "actPrice"]) assert(shop[k][1] < shop[k][2] && shop[k][2] < shop[k][3], k + " rises with the level");
  assert(shop.pasCap[3] > shop.pasCap[1] && shop.actTime[3] > shop.actTime[1] && shop.actCool[3] < shop.actCool[1]);
  assert(shop.computerPay > 0 && shop.computerPay < 1 && shop.welcome > 0);
  for (const w of Object.keys(shop.weapons)) assert(WEAPONS[w], w);
});
ok("resource comets: 1 in 5 carries minerals, four kinds (the rarer worth more), coins 100-1000 with high values rare", () => {
  const fs = require("fs"), path = require("path"), A = path.join(__dirname, "../app/src/main/assets"), html = fs.readFileSync(path.join(A, "index.html"), "utf8");
  const grab = (name, open, close) => { const i = html.indexOf("const " + name + " = "); return eval("(" + html.slice(html.indexOf(open, i), html.indexOf(close, i) + close.length - 1) + ")"); };
  const M = grab("MINERALS", "[", "\n];"), C = grab("COMET", "{", "} };");
  assert.strictEqual(M.length, 4); assert(Math.abs(M.reduce((a, m) => a + m.odds, 0) - 1) < 1e-9);
  for (let i = 1; i < 4; i++) assert(M[i].odds < M[i - 1].odds && M[i].worth > M[i - 1].worth, "rarer = worth more");
  assert(Math.abs(C.gold - 0.8) < 1e-9 && C.coins[0] === 100 && C.coins[1] === 1000 && C.coinCurve > 1 && C.speed > 1 && C.every >= 45 && C.every <= 75);
  for (const f of ["gold", "crystal"]) assert(fs.existsSync(path.join(A, "art/comets", f + "-atlas.webp")), f);
});
ok("fleet upgrades: every ship with a fit has its shield, cannon and shop buttons; coming-soon ships have a picture; 3D pictures exist", () => {
  const fs = require("fs"), path = require("path"), A = path.join(__dirname, "../app/src/main/assets"), html = fs.readFileSync(path.join(A, "index.html"), "utf8");
  const i = html.indexOf("const UPGRADE_FIT = {"), fit = eval("(" + html.slice(html.indexOf("{", i), html.indexOf("\n};", i) + 2) + ")");
  assert(Object.keys(fit).length >= 28);
  for (const [id, F] of Object.entries(fit)) {
    assert(SHIPS.some((S) => S.id === id), id); assert(F.length === 5 && F[2] > 0.3 && F[2] < 4, id);
    for (const f of ["shield", "cannon", "btn-shield", "btn-cannon"]) assert(fs.existsSync(path.join(A, "art/upgrades", id, f + ".webp")), id + " " + f);
  }
  for (const id of ["gravity-sail", "knuckle", "link"]) assert(fs.existsSync(path.join(A, "art/upgrades", id, "body.webp")), id);
  const j = html.indexOf("const SHIP3D = "), list = JSON.parse(html.slice(j + 15, html.indexOf(";", j)));
  for (const id of list) assert(fs.existsSync(path.join(A, "art/ships3d", id + ".webp")), id);
  const buy = eval("(" + html.slice(html.indexOf("{", html.indexOf("const SHIP_BUY = ")), html.indexOf("};", html.indexOf("const SHIP_BUY = ")) + 1) + ")");
  assert(buy.once === 1 && buy.week > buy.once && buy.own > buy.week);
});
ok("FLIPPER: sold only in the shop; a steel ball launched by the spring that bounces off the star, paddles cocked for 8 s that strike by themselves; three pinballs for a minute, half a tank each", () => {
  const S = SHIPS.find((q) => q.id === "flipper"), html = require("fs").readFileSync(require("path").join(__dirname, "../app/src/main/assets/index.html"), "utf8");
  assert(S && S.shopOnly && S.anim && S.magic === "pinballs" && S.weapons.join() === "steelball,paddles");
  assert(WEAPONS.steelball.cued && S.anim.primary.some((f) => f[2] === "bolt") && WEAPONS.paddles.paddles && WEAPONS.paddles.window === 8 && S.anim.parmed && S.anim.pstrike && S.anim.prelease);
  assert(html.includes("if (Wp.paddles && game.paddle) return;"), "a press while cocked does not start the window again");
  assert(SHIPS.filter((q) => q.shopOnly).every((q) => q.anim), "shop-only ships are in the test hangar (it lists the ships with art)");
  assert(html.includes("hangarShips().filter((S) => !S.shopOnly)"), "the random fleets leave shop-only ships out");
  const i = html.indexOf("  pinballs: { name:"), M = eval("(" + html.slice(html.indexOf("{", i), html.indexOf("},", i) + 1) + ")");
  assert(M.balls === 3 && M.last === 60 && M.hit === 0.5 && M.follow < 1.0 && M.box > 1);
});
ok("COURIER: shop only; a brass burst, a capsule bent by the star (one at a time); orbit mines that take 1.5 tanks", () => {
  const S = SHIPS.find((q) => q.id === "courier"), html = require("fs").readFileSync(require("path").join(__dirname, "../app/src/main/assets/index.html"), "utf8");
  assert(S && S.shopOnly && S.anim && S.magic === "orbitmine" && S.weapons.join() === "brassburst,mailcap");
  const i = html.indexOf("  orbitmine: { name:"), M = eval("(" + html.slice(html.indexOf("{", i), html.indexOf("},", i) + 1) + ")");
  assert(M.hit === 1.5 && M.speed > 0 && M.cool > 0);
  assert(html.includes("mailcap:    { name:") && /mailcap:[^}]*gravity: true[^}]*one: true/.test(html));
});
ok("FRESNEL: shop only; a lens flash, two shards that cross ahead; the light portal's snake (1.5 tanks a touch, gone after 30 s)", () => {
  const S = SHIPS.find((q) => q.id === "fresnel"), html = require("fs").readFileSync(require("path").join(__dirname, "../app/src/main/assets/index.html"), "utf8");
  assert(S && S.shopOnly && S.anim && S.magic === "snake" && S.weapons.join() === "lensflash,lightshard");
  const i = html.indexOf("  snake: { name:"), M = eval("(" + html.slice(html.indexOf("{", i), html.indexOf("},", i) + 1) + ")");
  assert(M.hit === 1.5 && M.last === 30 && M.grow > 0 && M.most > M.start && M.spare > 0 && M.tighten > 0 && M.tightest < M.ring);
  assert(/lightshard:[^}]*both: true, aimAt:/.test(html));
});
ok("VAULT: shop only; brass burst, a piston that shoves, solar fire while the star is held; the star in the vault 30 s; no language button in the hangar", () => {
  const S = SHIPS.find((q) => q.id === "vault"), html = require("fs").readFileSync(require("path").join(__dirname, "../app/src/main/assets/index.html"), "utf8");
  assert(S && S.shopOnly && S.anim && S.vaultDoors && S.magic === "vault" && S.weapons.join() === "brassburst,piston" && S.guns.solarfire);
  const i = html.indexOf("  vault: { name:"), M = eval("(" + html.slice(html.indexOf("{", i), html.indexOf("},", i) + 1) + ")");
  assert(M.hold === 30 && M.pull < 0.62 && M.near < M.reach && M.rad > 0 && M.dmg > 0 && M.pulse > M.wave);   // (below every engine's push: it can be escaped)
  assert(/piston:\s+\{[^}]*knock:/.test(html) && /s\.w === "piston"\)\) \{/.test(html) && html.includes('return "solarfire";'));
  assert(html.includes("starPull(o.x, o.y, o)") && !html.includes("const d = starOut() || (o === game"));   // the pull from VAULT, the empty middle
  assert(!/\(hangar\.open \|\| picker\.open \|\| camp\.over\) && hitLang/.test(html) && !/drawFleetBtn\(\); drawLangBtn\(\); \}/.test(html));
});
ok("CORSAIR: shop only; button 1 aims a broadside (5 balls), a chain shot; the ghost ship's shots turn after them; ghosts and health on a hit", () => {
  const S = SHIPS.find((q) => q.id === "corsair"), html = require("fs").readFileSync(require("path").join(__dirname, "../app/src/main/assets/index.html"), "utf8");
  assert(S && S.shopOnly && S.haunt && S.magic === "haunt" && S.weapons.join() === "broadside,chainshot" && S.anim.primaryL && S.anim.unmagic);
  assert(WEAPONS.broadside.broadside && WEAPONS.broadside.pirate && WEAPONS.chainshot.chain && WEAPONS.chainshot.gravity);
  assert(WEAPONS.ghostshot.ghost && WEAPONS.ghostshot.homing > 0 && WEAPONS.ghostchain.ghost && WEAPONS.ghostchain.homing > 0);
  assert(html.includes('if (Wp.pirate) corsairHit(Wp, Wp.dmg);') && html.includes('if (i < 2 && hauntOn()) return i ? "ghostchain" : "ghostshot";'));
  assert(html.includes("if (b.i === 0 && aimStick()) game.aim =") && html.includes('t === "gh") { addGhost(game, m.v);'));
  for (const v of ["skull", "bandana", "captain"]) assert(require("fs").existsSync(require("path").join(__dirname, "../app/src/main/assets/art/ships/corsair/ghost-" + v + ".webp")));
});
ok("FRESNEL's snake: one smooth rainbow body, three times as long; a touch sends it back through its portal", () => {
  const html = require("fs").readFileSync(require("path").join(__dirname, "../app/src/main/assets/index.html"), "utf8");
  const i = html.indexOf("  snake: { name:"), M = eval("(" + html.slice(html.indexOf("{", i), html.indexOf("},", i) + 1) + ")");
  assert(M.most >= 150 && M.grow * M.last >= 150);
  assert(html.includes('N.hitT = M.spare; N.phase = "back";') && !html.includes("roundRect(p.x - w / 2, p.y - w / 2, w, w, w * 0.25)"));
});
ok("the account: money and purchases on the server (banks table); merging keeps the larger of each", () => {
  const fs = require("fs"), path = require("path"), html = fs.readFileSync(path.join(__dirname, "../app/src/main/assets/index.html"), "utf8"), sql = fs.readFileSync(path.join(__dirname, "../server/supabase.sql"), "utf8");
  assert(/create table if not exists public\.banks/.test(sql) && /bank\s+jsonb/.test(sql) && (sql.match(/on public\.banks/g) || []).length >= 4);
  assert(html.includes("bankSync.push(); }") && html.includes("hitAccount(e.clientX, e.clientY)) { showAccount();") && html.includes("drawAccountBtn();"));
  const i = html.indexOf("function bankFill("), j = html.indexOf("// the account button", i), f = new Function(html.slice(i, j) + "; return { bankMerge };")();
  const m = f.bankMerge({ wallet: { a: 5, b: 1 }, owned: { x: 1 }, gear: { a: { pas: 2, act: 0, xw: null } }, rent: { y: 10 } }, { wallet: { a: 3, c: 7 }, owned: { z: 1 }, gear: { a: { pas: 1, act: 3, xw: "laser" } }, rent: { y: 20 } });
  assert(m.wallet.a === 5 && m.wallet.b === 1 && m.wallet.c === 7 && m.owned.x && m.owned.z && m.gear.a.pas === 2 && m.gear.a.act === 3 && m.gear.a.xw === "laser" && m.rent.y === 20);
});
ok("the test hangar's modes: no enemy, still, fires without harm, fires and hurts; unlimited money that is never stored", () => {
  const html = require("fs").readFileSync(require("path").join(__dirname, "../app/src/main/assets/index.html"), "utf8");
  assert(html.includes('if (testFoe() === "safe") { game.hurt = 0.2;') && html.includes('if (testFoe() === "none") { enemy.on = false; return; }') && html.includes("if (botStill()) return;"));
  assert(html.includes("function testFoe() { return HANGAR && !BOT ? testState.foe") && html.includes("if (!id || (testMoney() && n < 0)) return;"));
});
ok("CORSAIR's rig: ten cannons that turn 30° and recoil, sails and cabin light by the thrust", () => {
  const html = require("fs").readFileSync(require("path").join(__dirname, "../app/src/main/assets/index.html"), "utf8"), fs = require("fs"), path = require("path");
  assert(Math.abs(CORSAIR_SWING_DEG() - 30) < 0.01 || html.includes("CORSAIR_SWING = Math.PI / 6"));
  for (const v of ["normal", "haunted", "bloom"]) for (const q of ["body", "sail1", "sail2", "left-1", "right-5"]) assert(fs.existsSync(path.join(__dirname, "../app/src/main/assets/art/ships/corsair/rig/" + v + "-" + q + ".webp")), v + q);
  assert(html.includes("S.rig && !(o.anim && /magic/.test(o.anim.seq)) && drawCorsairRig(S, o)") && html.includes("ca: corsairNet()"));
  function CORSAIR_SWING_DEG() { return 30; }
});
ok("balance round: VEXAR's tail hurts (its ball twice), PALISADE's wall sends shots back and its shards hit twice, CINDER slips 30% farther, KILN reaches twice as far and throws ships at its mines, VAULT's pull 30% wider", () => {
  const html = require("fs").readFileSync(require("path").join(__dirname, "../app/src/main/assets/index.html"), "utf8");
  const mag = (k) => { const m = new RegExp("\\n  " + k + ":\\s*\\{ name:").exec(html), i = m.index; return eval("(" + html.slice(html.indexOf("{", i), html.indexOf("}", i) + 1) + ")"); };
  assert(mag("tail").hit === 40 && html.includes("hitEnemy({ x: q.x, y: q.y, vx: 0, vy: 0 }, { dmg: WEAPONS[weaponsOf(S)[0]].dmg"));
  assert(WEAPONS.pshard.dmg === 12 && html.includes("s.back = true") && html.includes("if (s.back) {"));
  assert(Math.abs(mag("dashL").kick - 1.8 * 1.3) < 1e-9 && Math.abs(mag("dashR").kick - 1.8 * 1.3) < 1e-9);
  assert(mag("reverse").reach === 3.0 && html.includes("kilnMineToward(o, o === game)"));
  const V = mag("vault"); assert(Math.abs(V.near - 0.55 * 1.3) < 1e-9 && Math.abs(V.reach - 1.5 * 1.3) < 1e-9 && html.includes("drawVaultAurora(ps, V.t, size)"));
  assert(html.includes("FresnelBeacon.draw(ctx, img, time * 1000)") && html.includes("img = finComposite(S, img)"));
});
ok("the shop's seller: a line goes away 4 s after he starts (a long one a little after its end); close up while he talks", () => {
  const fs = require("fs"), path = require("path"), html = fs.readFileSync(path.join(__dirname, "../app/src/main/assets/index.html"), "utf8");
  assert(html.includes("life: Math.max(4, text.length / 32 + 1.2)") && html.includes("if (shop.say && shop.say.t > shop.say.life + SAY_FADE) shop.say = null;"));
  for (const m of ["closed", "open", "round"]) assert(fs.existsSync(path.join(__dirname, "../app/src/main/assets/art/ui/shop/alien/closeup-" + m + ".webp")));
});
ok("HUSK: shop only; twin cannons in turn, an engine parasite; breach and deliver (bite, hold, deliver to the alien by the star)", () => {
  const fs = require("fs"), path = require("path"), A = path.join(__dirname, "../app/src/main/assets"), html = fs.readFileSync(path.join(A, "index.html"), "utf8");
  const S = SHIPS.find((q) => q.id === "husk");
  assert(S && S.shopOnly && S.huskArt && S.magic === "breach" && S.weapons.join() === "huskcannon,parasite" && S.guns.huskcannon.length === 2 && WEAPONS.parasite.parasite);
  for (const [n, k] of [["idle", 32], ["open", 2], ["ext", 28], ["sway", 32], ["thrust", 28], ["bite", 24]]) for (const i of [1, k]) assert(fs.existsSync(path.join(A, "art/ships/husk", n + "_" + String(i).padStart(2, "0") + ".webp")), n + i);
  for (const f of ["creature-burst", "creature-wait", "bolt", "capsule", "grip", "flash"]) assert(fs.existsSync(path.join(A, "art/ships/husk", f + ".webp")), f);
  assert(fs.existsSync(path.join(A, "art/bloom/zombie-husk-top.webp")) && fs.existsSync(path.join(A, "art/ships3d/husk.webp")));
  const i = html.indexOf("  breach: { name:"), M = eval("(" + html.slice(html.indexOf("{", i), html.indexOf("},", i) + 1) + ")");
  assert(Math.abs(M.bite - 0.63) < 1e-9 && M.grab >= M.reach && M.paraCut === 0.35 && M.paraLast === 2.5 && M.last > 0 && M.deliver > 0);
  assert(html.includes("if ((game.husk && game.husk.cap) || game.hcap) return;") && html.includes("blowUpShip();   // delivered"));
});
ok("the ship shop is on the main menu (its banner and SHOP button) and sells only the ships not in the fleet", () => {
  const fs = require("fs"), path = require("path"), A = path.join(__dirname, "../app/src/main/assets"), html = fs.readFileSync(path.join(A, "index.html"), "utf8");
  assert(fs.existsSync(path.join(A, "art/ui/shop-button.webp")) && fs.existsSync(path.join(A, "art/ui/menu-shop-bg.webp")));
  assert(html.includes('hitMenuShop(e.clientX, e.clientY)) { menuShop.press') && html.includes("hangarShips().filter((S) => S.shopOnly && !(bank.owned || {})[S.id])"));
  assert(html.includes('if (shop.open && shop.kind === "ship") { shopExit(); return true; }'));
});
ok("the merchants' breaks: break frames and closed pictures exist; a store on its break cannot be docked and its shutter is solid", () => {
  const fs = require("fs"), path = require("path"), A = path.join(__dirname, "../app/src/main/assets"), html = fs.readFileSync(path.join(A, "index.html"), "utf8");
  for (const k of ["weapon", "shield"]) for (const f of ["break", "closed"]) assert(fs.existsSync(path.join(A, `art/station/${k}-store-${f}.webp`)), k + f);
  assert(html.includes("stations.find((S) => storeOpen(S) && inBay(S, game))") && html.includes("L.solid.concat([L.bay])"));
  assert(html.includes("!(game.docked && dockedStation() === S)"));
});
ok("HUSK infects a store with its jaws: the infection and inside-loop atlases exist, the alien comes out of that store, an infected store cannot be docked", () => {
  const fs = require("fs"), path = require("path"), A = path.join(__dirname, "../app/src/main/assets"), html = fs.readFileSync(path.join(A, "index.html"), "utf8");
  for (const k of ["weapon", "shield"]) for (const f of ["in", "loop"]) assert(fs.existsSync(path.join(A, `art/station/${k}-store-husk-${f}.webp`)), k + f);
  assert(html.includes("stations.findIndex((S) => !S.inf && huskTouches(S, mo))") && html.includes('link.send({ t: "hinf", k })'));
  assert(html.includes("huskCreature = { s: k, t: -(HUSK_INF + HUSK_LOOP), own }") && html.includes("&& !S.inf; }"));
  assert(!html.includes('seqT("prelease"))) game.paddle = null; huskRelease();'));   // (FLIPPER's paddles no longer clear HUSK's state)
});
ok("HUSK's alien tears out of the store: the empty infected pictures exist, the store stays empty after, no delivery before it is out", () => {
  const fs = require("fs"), path = require("path"), A = path.join(__dirname, "../app/src/main/assets"), html = fs.readFileSync(path.join(A, "index.html"), "utf8");
  for (const k of ["weapon", "shield"]) assert(fs.existsSync(path.join(A, `art/station/${k}-store-husk-empty.webp`)), k);
  assert(html.includes("if (S.inf.t >= HUSK_INF + HUSK_LOOP) S.inf.out = true;") && html.includes("function drawHuskExit(C, S, p, d)"));
  assert(html.includes("C.t >= (C.s != null ? HUSK_TEAR[2] : 0)"));
});
ok("in a shop: arcade music, no firing heard, the computer game waits, the sellers speak English (the app's text-to-speech)", () => {
  const fs = require("fs"), path = require("path"), A = path.join(__dirname, "../app/src/main/assets"), html = fs.readFileSync(path.join(A, "index.html"), "utf8");
  assert(fs.existsSync(path.join(A, "audio/music/arcade.ogg")) && fs.existsSync(path.join(A, "art/ships3d/thul.webp")) && html.includes('"talus", "thul", "vanta"'));
  assert(html.includes('shop.open ? "arcade"') && html.includes("if (shop.open) return;   // (in a shop: no firing heard"));
  assert(html.includes("if (shopPaused()) { time += dt; updateShop(dt); return; }") && html.includes("if (bot.ready && !shopPaused())"));
  const java = fs.readFileSync(path.join(__dirname, "../app/src/main/java/com/shiran/spaceship/MainActivity.java"), "utf8");
  assert(java.includes("public void ttsMake(String id, String text)") && java.includes('path.startsWith("/tts/")') && html.includes("ShipNative.ttsMake(id, text)"));
});
ok("ship shop: tapping a chosen ship opens its page (every shop ship has its words); poking the seller; the voice faster, its pitch kept", () => {
  const fs = require("fs"), path = require("path"), html = fs.readFileSync(path.join(__dirname, "../app/src/main/assets/index.html"), "utf8");
  for (const id of ["flipper", "courier", "fresnel", "vault", "corsair", "husk"]) assert(html.includes(`  ${id}: { w: [[`), id);
  assert(html.includes('act: "info", id: chosen.id') && html.includes('if (h.act === "poke")') && html.includes("drawShipInfo()"));
  assert(html.includes("voiceStretch(c, buf, VOICE_SPEED / P.rate)"));
});
ok("CORSAIR rows on the gas (the oars, the rowing loop), fires only its chain shot while rowing, and its cannons thunder", () => {
  const fs = require("fs"), path = require("path"), A = path.join(__dirname, "../app/src/main/assets"), html = fs.readFileSync(path.join(A, "index.html"), "utf8");
  for (const f of ["rowing-loop", "cannon-1", "cannon-2", "cannon-3", "chainshot"]) assert(fs.existsSync(path.join(A, `audio/corsair/${f}.ogg`)), f);
  assert(html.includes("const CorsairOars = (function ()") && html.includes('if (S.id === "corsair" && i !== 1 && corsairRowing()) return;'));
  assert(html.includes("if (B.n < 5 && corsairRowing()) B.n = 5;") && html.includes('if (w === "chainshot") { playClip("audio/corsair/chainshot.ogg"'));
});
ok("VAULT: sparkle waves for its radiation and a bank vault's heavy sounds; COURIER's capsule-body launch frames", () => {
  const fs = require("fs"), path = require("path"), A = path.join(__dirname, "../app/src/main/assets"), html = fs.readFileSync(path.join(A, "index.html"), "utf8");
  for (const f of ["open", "close", "fire"]) assert(fs.existsSync(path.join(A, `audio/vault/${f}.ogg`)), f);
  for (let i = 1; i <= 26; i++) assert(fs.existsSync(path.join(A, `art/ships/courier/cbody_${String(i).padStart(2, "0")}.webp`)), i);
  assert(html.includes("function drawVaultSparkles(") && html.includes('secondary: frames("cbody", 26, () => 40, { 14: "fire" })') && html.includes("audio.shot(m.w, enemy.ship, enemy)"));
});
ok("FLIPPER sounds like a pinball machine: a playfield loop for its gas, the plunger, paddles, bumpers, multiball and a win when it bumps into something", () => {
  const fs = require("fs"), path = require("path"), A = path.join(__dirname, "../app/src/main/assets"), html = fs.readFileSync(path.join(A, "index.html"), "utf8");
  for (const f of ["playfield-loop", "launch", "paddles", "bumper", "bumper2", "multiball", "win"]) assert(fs.existsSync(path.join(A, `audio/flipper/${f}.ogg`)), f);
  assert(html.includes("function flipperWin()") && html.includes('if (w === "steelball") { pinSnd("launch"') && (html.match(/if \(!flipperWin\(\)\)/g) || []).length === 3);
});
ok("CORSAIR as BLOOM's zombie still rows: its oars drawn under the zombie art", () => {
  const fs = require("fs"), path = require("path"), html = fs.readFileSync(path.join(__dirname, "../app/src/main/assets/index.html"), "utf8");
  assert(html.includes('if (o.zombie && S.rig) drawCorsairOars(S, o, "bloom");') && html.includes("function drawCorsairOars(S, o, v)"));
});
ok("BOILER: a splash going into the water (sound and a crown of water), a ship's engine with sonar, the torpedo's bubbles and its missile flame out of the water", () => {
  const fs = require("fs"), path = require("path"), A = path.join(__dirname, "../app/src/main/assets"), html = fs.readFileSync(path.join(A, "index.html"), "utf8");
  for (const f of ["engine-loop", "splash", "splash-small", "torp-launch", "missile"]) assert(fs.existsSync(path.join(A, `audio/boiler/${f}.ogg`)), f);
  assert(html.includes("function boilerSplash(o, into)") && html.includes("drawFloodFront(); drawSplashes();") && html.includes("if (s.wetP === true && !w)"));
});
console.log(n + " checks passed");
