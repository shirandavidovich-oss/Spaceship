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
vm.runInNewContext(settings + logic + "\nObject.assign(box,{HOLD_ANGLE,DEAD_ZONE,SHIPS,RARITY,chooseShip,tiltOf,controlFromTilt,shipById,headingTarget,turnToward,wrapAngle,wrapDelta,gravityAt,shipStats,fuelColor,fuelStep,enemyControl,UNLOCK});", { box, Math, Object, parseInt });
const { HOLD_ANGLE, SHIPS, RARITY, chooseShip, tiltOf, controlFromTilt, shipById, headingTarget, turnToward, wrapAngle, wrapDelta, gravityAt, shipStats, fuelColor, fuelStep, enemyControl, UNLOCK } = box;
const rad = (d) => d * Math.PI / 180;
// gravity sensor values for a phone tipped `pitch` degrees up from flat and `roll` degrees right-edge-down
const g = (pitch, roll = 0) => [-Math.sin(rad(roll)) * 9.81, Math.cos(rad(roll)) * Math.sin(rad(pitch)) * 9.81, Math.cos(rad(roll)) * Math.cos(rad(pitch)) * 9.81];
const ctl = (pitch, roll) => controlFromTilt(tiltOf(...g(pitch, roll)));

let n = 0;
const ok = (name, fn) => { fn(); n++; console.log("ok -", name); };

ok("ten ships, unique ids", () => {
  assert.strictEqual(SHIPS.length, 10);
  assert.strictEqual(new Set(SHIPS.map((s) => s.id)).size, 10);
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
console.log(n + " checks passed");
