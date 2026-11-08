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
using the same flying rules as you. It shoots at you when its nose points your way and you are close enough, with its own
ship's plain weapon (others use the twin cannon), slower and weaker than a player (`ENEMY_FIRE`, `ENEMY_DMG`; `ENEMY_GUNS = false` = it only flies). The view zooms out to keep both ships on screen.

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
Its magic button is a tail with a spiked iron ball: hold it and a long segmented tail (9.6 ship-lengths) grows out behind
the ship, with a spiked ball at its tip, and stays out while you hold; it drags and swings after the ship as you fly and turn. It is drawn from VEXAR's tail art (a mount, vertebrae that narrow toward the end), the ball drawn in code. The ball
hits a ship it touches for 20 (at most every 0.6 s) and knocks it away. Let go and the tail pulls back in and the ship flies on.

**LYTH**, the mechanical ring duelist (`art/ships/lyth/`), with its own recorded sounds (`sfx/`).
Button 1: the pulse (the shutters slide apart and the emitter flashes). Button 2: the big ring around the hull unlatches
(amber lights), flies out spinning (the planet pulls it), turns back to wherever the ship is now and locks on again.
It hurts a ship it passes over, once on the way out and once on the way back. One ring at a time; the pulse still works meanwhile.
Its magic button is a toothed steel ring (it glows violet and shows its teeth when the enemy is close enough): tap it and a
tractor beam pulls the enemy in against the ring, the ring spins up, saw teeth slide out of its rim and shred it
(30 health a second for 1.8 s), then it is thrown off. Too far: a dull sound and a dashed circle shows the reach. In a duel the
other player's ship is really pulled in on their phone.

**TALUS**, the mineral ship that builds itself (`art/ships/talus/`). It starts as a small seed. Crash into the body in the
middle: rock chips fly off it and fuse into the hull, which grows a stage (5 at most), and each new layer takes the color
of that body. After each growth a ring of light around it runs white → black like the thrust button; until it is gone the next
crash adds nothing (it has to leave and come back, too). Hot bodies do not burn it. Weapons (drawn in code): button 1 stone
shards, button 2 a heavy boulder that the body pulls. Its magic (a cracked stone with a dot per layer): it bursts into the
pieces it has built (3 per layer), which fly off in all directions and blow up after 1-2 s, hurting a ship inside the blast.
Then it is a seed again and has to build up from the bodies once more. It loses its layers when it blows up, too.

**ORIAN**, the solar fan ship (`art/ships/orian/`, own recorded sounds). Button 1: a light bolt from the lens.
Button 2: five gold mirrors fan open behind the pod one after another (a click at each hinge), and rays of light run from
the body in the middle to each mirror and on to the lens, in that body's own color (red from a red giant, cyan from a pulsar...).
At 1.1 s the lens fires a solar beam straight ahead (2.6 screens long, 30 damage to a ship it touches), then the mirrors fold.
Nothing else fires while the fan is busy.
Its magic button is a sun with 6 charge marks. **Hold it**: the mirrors open and drink thick light from the body in the
middle, the ship is hard to steer, and it glows hotter and hotter (gold, then orange-red, then white-hot). Every 1.6 s of holding
is one charge. At 3 charges it is twice as fast (with a full tank) until the tank runs dry, then normal again and the charges are
gone. Keep charging instead of using the speed: at 6 the button blazes white, and a **tap** lets out a blast of light over the
whole screen that shakes both ships and takes 35 health from the enemy wherever it is (then 10 s to recharge).

**SKARN**, the fossil intake ship (`art/ships/skarn/`, own recorded sounds). Button 1: bone shards from both side muzzles.
Button 2 opens its jaw: for 1.5 s, enemy shots flying into its mouth are caught (side and back shots are not), up to 5;
it slams shut when full, when time is up, or on a second tap. Loaded, the mouth glows by how many it holds (dots on the button),
and the next tap spits them all back as a fanned salvo of hot fossils (14 each). In a duel the shooter's phone sees its shot
fly into the open mouth and tells the other phone. Every shot it catches also powers up its shards (+35% damage a level, up to 5, ember dots under button 1, for 15 s after the
last catch; the shards grow and burn). Its magic (a jaw with a chain): the jaw shoots out on chains at an enemy within 4.5
ship-lengths, opens wide, clamps on and bites it 3 times (10 each), holding it still, then reels back in. In a duel the bitten
ship is held on its own phone too.

**DRAKON**, the rift return ship (`art/ships/drakon/`, own recorded sounds). Button 1: a double pulse, two pink bolts
from one press. Button 2, the rift: the first press marks the spot where the ship is (a turning pink diamond that stays put
for 8 s; off screen, a pink arrow at the edge points to it). Fly off; the second press opens the glowing seam in the hull and
the ship jumps back to the mark, keeping its heading and speed, with pink bursts at both ends. No magic yet.

**XELTAR**, the frozen squid (`art/ships/xeltar/`, own recorded sounds). Button 1: three small ice shards from the nose.
Button 2: its four arms curl round a growing ice crystal and launch it **backward** out of the stern; to hit something,
turn your nose away from it. Its magic (a swirl of ink): the body swells and an ink cloud bursts from the stern; the cloud
stays where it was let out and spreads for 3.4 s, and the enemy loses sight of you for 4 s. A ship that touches the cloud
is covered in black ink: it loses 15 health and for 20 s it cannot steer, thrust or shoot; it drifts on the way it was going,
at the speed it had (only the planet bounces it). In a duel the inked player's own phone does that to their ship. No engine flame: it swims.

**KRAAL**, the crimson hammerhead (`art/ships/kraal/`, own recorded sounds). Button 1: two parallel bolts from the two ends
of the hammer. Button 2 is **held**: lines of light run out to the two muzzles, and the longer you hold the farther ahead the bolts
will meet (0.7 to 5 ship-lengths over 1.6 s; a faint aiming mark shows it, `CROSS_GUIDE`). Let go and each muzzle sends a bolt
to that point; they meet there together and blow up (32 damage). Only what is at that point is hit, so you learn how long to
hold to land it on the enemy. The point is fixed when the bolts leave. Its magic (a hammer): a fast dash at an enemy within
2.2 screens (or straight ahead), and a blow with the hammer-head (30 damage) that knocks the enemy away.

**ZORIAN**, the light-thread ship (`art/ships/zorian/`, own recorded sounds). Button 1: a blue needle bolt. Button 2:
the projector at the stern draws a thread of light behind the ship as it flies (for about 1.2 s; standing still draws nothing,
so fly a curve around the enemy). The thread stays where it was laid, blinks a warning, then arms: an enemy that crosses it
takes 25, once. It fades 2.4 s later and a new one can be laid. A jump or a wrap across the arena starts a new piece. Enemy shots cannot pass through a thread. Its magic (an anchor): one tap and the
ship stops and spins in place by itself for 3.5 s (a second tap lets it go; then 6 s to recharge). Lay the thread while it
spins and the thread is laid as a ring round the ship: a shield that stops every shot until it fades. (A spiked-ball-on-a-chain weapon is in the code, unused.)

**VANTA**, the liquid-weapon ship (`art/ships/vanta/`, own recorded sounds). A ribbon of lime liquid waves in its glass
chamber. Button 1: a marking drop (6): the ship it hits glows with a lime stain for 1.75 s, seen even through smoke and ink.
Button 2: the ribbon squeezes together and one heavy drop leaves on a fixed line (20). Fired into the planet it slips inside,
a pulsing mark shows where it will come out just before it does (time to dodge), and it comes out bigger and stronger (42).
It leaves with a bang (a kick, a shock ring, a shake), trails glowing sparks, and bursts with rings when it hits.
Its magic changes the liquid's colour, one step a tap (every 4 s): lime, blue (x1.4), red (x1.9), glowing white with
flames round the drop (x2.6). The next heavy drop does that much more damage and uses the colour up (back to lime).
Both drops swell as they fly, rounding into a ball that grows (up to 2.4x / 3x) and gets thinner and see-through: easier to
hit with, but weaker (down to 60% / 55% of the damage).

**Test hangar (for now):** under the duel swords there is a hangar button. It opens a screen with every ship that has
real drawings (THUL, VEXAR, LYTH, TALUS, ORIAN, SKARN, DRAKON, XELTAR, KRAAL, ZORIAN), with its weapons and magic; tap one to fly it right away.
It is only for trying them: the choice is not saved, and in the real game each player has the one ship from the gift,
changed only by trading. To turn the hangar off: `HANGAR = false` at the top of the game. `TRY_SHIP` (a ship id) still
makes everyone fly one ship; `""` is the gift's surprise.

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
