# Spaceship

Every player has one spaceship. It arrives inside a surprise gift: tap the gift 3 times and it opens.
The ship is chosen by rarity (common 50%, rare 30%, epic 15%, legendary 5%) and kept on the phone.
Flying works like Star Control 2's Super Melee: space is 10 screens wide and 10 tall and wraps
around, with a planet in the middle that pulls the ship. Tilting the phone points the ship's nose
(all the way round, 360°); held at the usual angle (about 35° from flat) the nose stays where it is.
The round button for the left thumb fires the engine toward the nose, and it is also a joystick:
drag the thumb and the nose turns to point that way (the tilt steers when the thumb is not dragged). Its fuel runs out over the
ship's `fuel` seconds (30 for now): the button goes white → yellow → orange → red → purple → blue →
black, and then disappears. It fills back up by itself (`refill` seconds per ship, 15 for now)
and the button returns once the tank is 20% full.

**What is in the middle changes every round** (each time a new enemy arrives): one of 10 bodies, each with its own size,
gravity and look: a purple gas giant, a black hole (strongest pull, swirling disk), a neutron star (magnetic loops), a pulsar
(sweeping beams), a white dwarf, a red giant (huge, weak pull), a yellow sun (flares), a blue giant, a ringed ice planet and a
lava planet. The old one shrinks away as the new one grows, and its name shows with 5 dots for how hard it pulls.
Stars, the black hole and the lava planet burn a ship that touches them; planets just bounce it. In a duel both phones share one.
The list is `BODIES` in the game.

An enemy ship flies with you: it chases you, keeps a little distance and stays off the planet,
using the same flying rules as you. The view zooms out to keep both ships on screen.

**Weapons (right thumb):** button 1 and button 2 are the ship's own two weapons; hold to keep firing.
The ring around each button is its ammo, and it refills by itself. Shoot the enemy until its health bar
is empty and it explodes, leaving a crate with its weapon (laser, missiles or fan). Fly into the crate:
**button 3** appears with that weapon. It does not refill; when it is empty, button 3 goes away.
A new enemy arrives a few seconds later.

**Your health:** the bar with the heart at the top left. Crashing into the enemy hurts both ships (harder
crash = more damage). The screen edges flash red when you are hit, and the bar pulses under a quarter.
At zero your ship blows up and comes back 3 seconds later with full health (lives are unlimited).
The cannonball (button 2) fires with a deep boom and an echo, kicks the ship back, and shakes the screen.
On THUL it is the heavy cannon: the brass iris winds open with a rising crank, the chamber glows, and at 0.72 s
the flash and shock ring fire and a real cannonball drawing flies out; the hull kicks sideways and settles (1.56 s in all).
Button 2 waits for that to finish before the next shot.

**Magic (left thumb, above thrust):** each ship's magic button looks like the ship's style. The brass ship's
is a turning brass gear: tap it and thick smoke pours from the engines; for a few seconds the enemy
cannot see you and searches where it last saw you. Then the gear recharges (its brass fills back in).
On THUL the two orange vent covers slide open, the vents pulse, and at 0.45 s the thick smoke starts pouring out.
Tapped during a cannon shot, the smoke follows right after it.

**THUL**, the orange mechanical gunship, is the first ship with real drawings (`art/ships/thul/`: an idle
sprite and 5 twin-cannon frames, plus 23 heavy-cannon frames, 23 smoke-hatch frames and a cannonball;
512 × 512 hull, center pivot, nose up. The new frames are WebP: same pictures, about a tenth of the download). Button 1 plays the twin-cannon frames
and each shot leaves from the barrel that flashes; button 2 winds up the brass iris and the shot leaves at
the big flash. Frames are timed in milliseconds, so they run the same on any screen. It has a mechanical steam engine: a ragged flame, backfires, creaks and
squeaks, and now and then the fire goes out for a moment (no push, only smoke). 
**VEXAR**, the green hunting ship, is the second ship with real drawings (`art/ships/vexar/`).
Button 1 fires thorns from the two claws, taking turns. Button 2: the mandibles spread, the armor covers swing open
and an egg is laid; it drifts to a stop and pulses, then cracks and lets out 3 hunters that chase the enemy
(each hit takes 9 health; they fly about 4.5 s). Each egg is one of 4 kinds, picked at random: the green egg holds
one of each insect (an orange wasp, a turquoise beetle, a pink-violet moth); the orange, turquoise and magenta eggs hold 3 of one kind. The enemy can crush the egg by flying into it before it hatches: then no hunters.
Its magic button is a curled stinger tail: tap it and a long segmented tail (9.6 ship-lengths) grows out behind the ship and drags
and swings after it as you fly and turn. It is drawn from VEXAR's tail art: a mount, vertebrae that narrow toward the end, and a stinger. A ship touching it loses health (28 a second) while it touches. After it has
been all the way out it pulls back into the ship (about 3.3 s), and the button recharges (9 s).

**LYTH**, the mechanical ring duelist (`art/ships/lyth/`), with its own recorded sounds (`sfx/`).
Button 1: the pulse (the shutters slide apart and the emitter flashes). Button 2: the big ring around the hull unlatches
(amber lights), flies out spinning (the planet pulls it), turns back to wherever the ship is now and locks on again.
It hurts a ship it passes over, once on the way out and once on the way back. One ring at a time; the pulse still works meanwhile.
Its magic button is a toothed steel ring (it glows violet and shows its teeth when the enemy is close enough): tap it and a
tractor beam pulls the enemy in against the ring, the ring spins up, saw teeth slide out of its rim and shred it
(30 health a second for 1.8 s), then it is thrown off. Too far: a dull sound and a dashed circle shows the reach. In a duel the
other player's ship is really pulled in on their phone.

While testing, everyone flies one ship: `TRY_SHIP` at the top of the game (now `"lyth"`; `"vexar"` for VEXAR, `"brass"` for THUL,
`""` for the gift's surprise again).
Swipe up to offer a trade with a phone nearby; the swap happens only if both players say yes.

**Duel (two phones, one fight):** tap the crossed swords under the map on both phones (close to each other, Bluetooth on).
They find each other with no internet, count 3-2-1, and each player sees the other's own ship in the same space,
starting on opposite sides of the planet. Everything is seen on both phones: flying, firing frames, shots, eggs and
hunters, the tail, the smoke. Your weapons decide what they hit on your screen and send the damage to the other phone.
The score under your health bar: your wins (green) : theirs (red). Tap the swords again to leave; the computer enemy comes back.
On a computer: open the game in two windows of the same browser and press the swords in both.

## Install on the phone

Every push to `main` builds a new APK automatically (GitHub Actions, about 3–5 minutes):

**https://github.com/shirandavidovich-oss/Spaceship/releases/latest/download/Spaceship.apk**

After that, every launch fetches the newest `app/src/main/assets/index.html` from this repo,
so game changes arrive without reinstalling.

## Where things are

| What | File |
|---|---|
| The game (settings at the top; ship numbers in `SHIPS`) | `app/src/main/assets/index.html` |
| Rule checks (35° = still, tilt points the nose, fuel colors, gift odds, weapons) | `tests/ship.test.js` |
| Ship drawings: `app/src/main/assets/art/ships/<id>.png` (one drawing) or `art/ships/<name>/` (idle + firing frames), nose up, see-through background | |
| Android shell: full screen + tilt sensor | `app/src/main/java/com/shiran/spaceship/MainActivity.java` |
| Direct phone-to-phone link (Bluetooth / Wi-Fi) | `app/src/main/java/com/shiran/spaceship/PhoneLink.java` |
| Automatic APK build | `.github/workflows/build-apk.yml` |

On a computer: open `index.html` in a browser. Arrow keys tilt; space bar = thrust button; Z, X, C = fire buttons 1-3; V = magic; `?reset` gives a new gift;
`?fake` pretends another phone answered a trade.
