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
vm.runInNewContext(settings + logic + "\nObject.assign(box,{HOLD_ANGLE,DEAD_ZONE,SHIPS,RARITY,chooseShip,tiltOf,controlFromTilt,shipById,headingTarget,turnToward,wrapAngle,wrapDelta,gravityAt,shipStats,fuelColor,fuelStep,enemyControl,UNLOCK,WEAPONS,LOOT,MAGIC,lootOf,weaponsOf,gunsOf,rotatePt,ammoStep,pelletAngles,steerShot,enemySees,seqFrame,seqLength,cueTime,ramDamage,SHIP_HP,RAM_DAMAGE,stickHeading,tailOut,ringPhase,pulseGlow,SFX,tailPieces,grindPhase,BODIES,nextBody});", { box, Math, Object, parseInt });
const { HOLD_ANGLE, SHIPS, RARITY, chooseShip, tiltOf, controlFromTilt, shipById, headingTarget, turnToward, wrapAngle, wrapDelta, gravityAt, shipStats, fuelColor, fuelStep, enemyControl, UNLOCK, WEAPONS, LOOT, MAGIC, lootOf, weaponsOf, gunsOf, rotatePt, ammoStep, pelletAngles, steerShot, enemySees, seqFrame, seqLength, cueTime, ramDamage, SHIP_HP, RAM_DAMAGE, stickHeading, tailOut, ringPhase, pulseGlow, SFX, tailPieces, grindPhase, BODIES, nextBody } = box;
const rad = (d) => d * Math.PI / 180;
// gravity sensor values for a phone tipped `pitch` degrees up from flat and `roll` degrees right-edge-down
const g = (pitch, roll = 0) => [-Math.sin(rad(roll)) * 9.81, Math.cos(rad(roll)) * Math.sin(rad(pitch)) * 9.81, Math.cos(rad(roll)) * Math.cos(rad(pitch)) * 9.81];
const ctl = (pitch, roll) => controlFromTilt(tiltOf(...g(pitch, roll)));

let n = 0;
const ok = (name, fn) => { fn(); n++; console.log("ok -", name); };

ok("thirteen ships, unique ids", () => {
  assert.strictEqual(SHIPS.length, 13);
  assert.strictEqual(new Set(SHIPS.map((s) => s.id)).size, 13);
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
ok("gift odds follow rarity", () => {
  let seed = 1; const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const count = {}; const N = 40000;
  for (let i = 0; i < N; i++) { const r = shipById(chooseShip(rand)).rarity; count[r] = (count[r] || 0) + 1; }
  for (const r in RARITY) assert(Math.abs(count[r] / N * 100 - RARITY[r].odds) < 1.5, r + " " + count[r]);
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
ok("VEXAR (vexar-animation.json): thorns at 63 and 189 ms, the egg at 448 ms, hunters at 180 ms into the hatch", () => {
  const A = SHIPS.find((s) => s.id === "vexar").anim;
  assert.strictEqual(seqLength(A.primary), 315); assert.strictEqual(cueTime(A.primary, "left"), 63); assert.strictEqual(cueTime(A.primary, "right"), 189);
  assert.strictEqual(seqLength(A.secondary), 960); assert.strictEqual(cueTime(A.secondary, "fire"), 448);
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
  assert.deepStrictEqual([px(l[0]), px(l[1]), px(r[0]), px(r[1]), px(e[0]), px(e[1])], [166, 97, 347, 97, 256, 321]);
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
  assert(M.cool > M.out + M.hold + M.back, "it can only be used again after it is back in");
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
console.log(n + " checks passed");
