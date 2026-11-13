# Spaceship

## Orbit Break (the near-final version)

**Two apps** (Android product flavors, one release has both): `OrbitBreak.apk` for players (no test hangar,
id com.shiran.orbitbreak) and `OrbitBreak-DEV.apk` ("Orbit Break DEV", with the test hangar, the old id, installs over
the earlier builds). Both load the same game from GitHub; the page asks the app `ShipNative.release()`.

The app is called **Orbit Break** now (VEXAR is its icon). It opens on a **title screen** (tap to start); each player's
own 3 ships are switched off for now (`THREE_SHIPS = false`: no sign-up, no "my ships", no trading): against the
computer the hangar's ships are split into two random fleets, as before.

- **Music** (`audio/music/`, from the Orbit Break audio pack): one loop per screen, crossfaded: the title, the hangar and
  the ship picker, and in the arena one per body in the middle (`BODY_MUSIC`). **Two dials** in the top row after CONNECT (on the title:
  at the bottom; the % shows while one is turned): pink = effects, mint = music. Drag right for louder (160 px = the whole way); kept on the phone.
- **Against another phone (CONNECT)** the fleets are split the same way: half each (`duelSplit`, worked out on both phones from
  the numbers they swap on connecting), a lost ship is out, and losing them all is GAME OVER for one and YOU WIN for the other.
- **CONNECT** (`art/ui/connect*.webp`), in the top row at the end of my fleet's icons (the hangar button is under the map): joins another player (the old duel button); pressed while
  looking and while connected.
- **YOU WIN / GAME OVER** (`RESULT_ART`, `art/ui/result/`): YOU WIN when the computer's whole fleet is beaten, GAME OVER
  when yours is. The letters float and tilt, W / V open in two; each new press of the gas kicks one letter up and round
  (for fun). TRY AGAIN: after a win the next level, after a loss a new game. EXIT: back to the title. Their fanfares
  play at the music volume, the gas at the effects volume.


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

**Playing alone = playing the computer, fleet against fleet.** All the ships with real drawings (the hangar's 20) are
split at random: half yours, half the computer's. You pick one of yours to start. A ship that blows up is out for good;
you pick the next from the ones you have left (the row of icons under the health bar: the one you fly in gold, lost ones
crossed out). Beat the computer's whole fleet (the count next to the health bar: ☠ ships left / all of them; the level number is not shown there) and the next level starts: all its
ships come back, stronger (more damage, more armour, better aim, heavier weapons and magic more often; `levelStats`).
It goes on until your whole fleet is gone, then "new game" splits the fleet again.

The computer is this same game running a second time, hidden inside the page (THE COMPUTER PLAYER in `index.html`).
It plays a duel with you exactly as another phone would, over an internal pipe instead of Bluetooth, so it has every
weapon and magic of its ship; an automatic player steers it like a thumb on the joystick and presses the same keys a
person would on a computer (space, Z, X, C, V, B). It draws nothing, makes no sound and saves nothing.
Only ships with real drawings are used anywhere in the game (the gift too).

**Weapons (right thumb):** button 1 and button 2 are the ship's own two weapons; hold to keep firing.
The ring around each button is its ammo, and it refills by itself. Shoot the enemy until its health bar
is empty and it explodes, leaving a crate with its weapon (laser, missiles or fan). Fly into the crate:
**button 3** appears with that weapon. It does not refill; when it is empty, button 3 goes away.
A new enemy arrives a few seconds later.

**Your health:** the bar with the heart at the top left. Crashing into the enemy hurts both ships (harder
crash = more damage). The screen edges flash red when you are hit, and the bar pulses under a quarter.
Beside the bar are 5 spare tanks (`TANKS`): when health reaches zero, a tank empties (it flashes) and fills the
bar again, so a ship lasts six bars. The enemy's tanks are the dots under its bar.
At zero with all the tanks empty your ship blows up and comes back 3 seconds later with full health and full tanks
(lives are unlimited).
The cannonball (button 2) fires with a deep boom and an echo, kicks the ship back, and shakes the screen.
On THUL it is the heavy cannon: the brass iris winds open with a rising crank, the chamber glows, and at 0.72 s
the flash and shock ring fire and a real cannonball drawing flies out; the hull kicks sideways and settles (1.56 s in all).
Button 2 waits for that to finish before the next shot.

**The battle buttons (Orbit Break kit):** each ship has its own five buttons, a metal octagon plate with a glowing icon
in the ship's colours (`art/hud/<ship>/`: thrust, primary = button 1, secondary = button 2, pickup = button 3, magic;
RIVET also has `-crossarm` weapon buttons for its other corner). The ring round a button is its ammo (thrust: the fuel,
white -> black as before; magic: its recharge, with a dark sweep). Button 3 shows the weapon it carries. A few magics have
a corner mark: ORIAN's charges, TALUS's layers, VANTA's colour, DRAKON's "!" while its bomb is out. When a magic goes off,
the kit's 16-frame effect (`fx/`, 50 ms a frame) plays over the ship (TALUS: when it grows), on the other phone too.
The kit's SVGs were turned into WebP (the app serves WebP already). `HUD_KIT = false` brings back the old drawn buttons.
The buttons show their state only as a glowing outline round the plate's octagon (bright along the charged part, clockwise
from the top: ammo, fuel for thrust, recharge for magic), nothing over the picture.

**Language (עב | EN):** the pill in the top-left corner of the title screen and the ship-choice screen (not in the test hangar)
switches every text the game draws between Hebrew and English, and is remembered (`orbit-break.language`, the kit's key).
The texts are in `STR` in `index.html` (`tr(key)`); magic, body and rarity names have English lists next to it. The
sign-up form is still Hebrew only.

**The thumb buttons:** thrust (left) and fire button 1 (right) in the two bottom corners, mirror images, 20% smaller
than before (`PAD_SIZE`); the magic diagonally up-right of thrust and the heavy weapon (button 2) diagonally up-left of
button 1, on an arc (`ARC`); button 3 (a weapon from a crate) straight above button 1, against the right edge.

**Magic (left thumb, diagonal from thrust):** each ship's magic button looks like the ship's style. The brass ship's
is a turning brass gear: tap it and thick smoke pours from the engines; for a few seconds the enemy
cannot see you and searches where it last saw you. Then the gear recharges (its brass fills back in).
On THUL the two orange vent covers slide open, the vents pulse, and at 0.45 s the thick smoke starts pouring out.
Tapped during a cannon shot, the smoke follows right after it.
THUL's smoke is three times as thick as before, in bigger, nearly solid puffs: a real smoke screen that hides the ship.

**Kit buttons for BALLAST, STRATA, KILN and FRANKENSTEIN** (`art/hud/<id>/`, whole faces like LARIAT's): drawn in the kit's
style (dark octagon, grid, coloured corners, a neon icon for each button) by a small script; BLOOM's are as they were.

**Zombie forms for BALLAST, STRATA, KILN and FRANKENSTEIN** (from the BLOOM-Four-Zombie-Ships package: `art/bloom/zombie-<id>-top.webp` and their motion atlases in `art/bloom/fx/`, drawn by the same fleet renderer; `scale` in `ZOMBIE_ART` makes each the size of the ship itself). FRANKENSTEIN has one zombie form; its creature never becomes a zombie.

**Explosion films (`video/`, 720p, `FILMS`: THUL, SKARN, XELTAR, ORIAN, CANTOR, MIRAGE, LARIAT):** one a game, as a
surprise. A new game picks one of those ships at random (`filmNewGame`); the first time it blows up (yours or the
computer's) its film plays full screen, full length, and the game waits (a tap skips it). Only that film is loaded.
Not in a game against another phone. The app serves .mp4 as video/mp4.

**Every ship flies its own way** (`HANDLING`, next to `SHIPS`): multipliers for its size (drawn and as a target),
top speed, engine push and turning. Small ones are quick (ZORIAN is 40% smaller and the fastest; PUFF, VANTA and
ORIAN 20% smaller and faster), heavy ones slow (PALISADE, THUL, REPRISE, TALUS). Every engine still beats the black
hole's pull (the tests check it). **A win fills one spare health tank** again (it flashes).

**BLOOM**, the flower ship (`art/ships/bloom/`, `art/bloom/`): its petals flutter and its eight stamens stream back as
it flies (the art package's `BloomMotion`). Button 1: flower shots. Button 2: a bouquet, five petals in a fan.
Magic: a **pollen cloud** round it (moves with it, reaches 3 ship-lengths, lasts 6 s, recharges in 20 s; `MAGIC.pollen`).
An enemy that stays in the cloud for 0.9 s becomes a **zombie** until that ship blows up: its weapons fire at 60% of the rate, only 40% fewer shots (and refill at 60%, `ZOMBIE.rate`) and hit at 50%
(`ZOMBIE.dmg`), its magic button is dead, a pink line at the top says so, and it is drawn with its zombie art
(`ZOMBIE_ART`: a still drawing and a moving renderer per ship from the BLOOM package; THUL has the hand in the cannon,
VEXAR and LYTH their own growth, the rest roots and lights). So the enemy has to keep away and fight it from afar,
and the computer player does just that. BLOOM itself never turns. In a duel BLOOM's phone decides the infection
(message `zb`); each phone sends whether it is a zombie (`zb`) and its pollen (`pn`). Its five round flower
buttons and its magic burst are in `art/hud/bloom/` (`KIT.bloom`, `round`: the state glow is a circle).

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
Magic (once a life): DRAKON comes apart along its seam. The front piece with the crystal stays where it was as a bomb, and
the ship flies on as its rear piece. The next tap, whenever you like, blows the bomb up: a huge blast (up to 75 at its
middle, 15 at 4.5 ship-lengths) that throws enemies back and never hurts DRAKON. Then the magic is used up until the
next life.

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
hold to land it on the enemy. The point is fixed when the bolts leave. Its magic (a hammer): a fast dash the way the nose
points (it does not aim for you: you aim it), and a blow with the hammer-head (30 damage) that knocks the enemy away.

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

**CANTOR**, the resonance ship (`art/ships/cantor/`, own recorded notes). Five grooves, each with its own note and colour.
Button 1: the middle groove sounds one note, a pulse straight ahead (8). Button 2: a chord. While it charges, each groove
lights in turn, plays its note and takes the heading the nose has then (a dashed line shows it); then all five bolts leave
together (9 each), each on its own line. Hold still for five parallel bolts, turn while it charges to fan them out.
Its magic, a resonance blast: rings of sound waves with notes riding on them spread out (to 5 ship-lengths). A ship they
reach is scrambled for a whole minute: its steering is reversed and its shots fly off the wrong way.

**RIVET**, the L-shaped ship (`art/ships/rivet/`, own recorded sounds). Its magic turns the whole hull a quarter round
(and back on the next tap), keeping its heading and speed; the other corner then leads, with two other weapons. Nothing
fires during the 0.44 s turn. Spine: button 1 a fast pin (12); button 2 eight coloured magnet balls that scatter all
round and are pulled into the planet (7 each). Crossarm: button 1 five short-range pellets (4 each); button 2 a fan of
four nails that fly a little way, stop and stay as mines for 14 s (14, and a shove, when a ship touches one). Each weapon
keeps its own ammo and cooldown while it is put away. (The rail and the arc wave are still in the code, unused.)

**GLITCH**, the shutter ship (`art/ships/glitch/`: a core and two shutter panels, put together in code). Button 1: a
three-round neon burst from the left of the nose (5 each). Button 2: the shutters slide open, the cyan core charges and a
hack pulse leaves (10). A ship it hits is hacked for 2 s: its next firing goes off a quarter turn clockwise (all of it,
once). Two magics on a split button (keyboard: V and B), from the package's other two shutter motions. Left, the
V shield: the panels swing forward into a V; while it is open, enemy shots reaching its front are batted back the way
they came (and can hit their owner). Right, the glitch slip: the panels slide past each other and the ship jumps 2.6
ship-lengths sideways, leaving a flickering decoy for 2.5 s that the enemy goes after.

**NIMBUS**, the stormfront ship (`art/ships/nimbus/`, own recorded sounds). At rest its cloud banks billow (a 32-frame loop). Wisps of mist keep rising off its banks, swelling and thinning into nothing (a soft trail of cloud as it flies); during the rainbow magic they glow in pastel rainbow colours. Button 1: lightning charges along the spine,
then a flickering bolt (14). Button 2: the cloud banks swell and a storm is let go ahead of the ship; it drifts on by
itself and grows, its wind swirls other ships round it, and three marked lightning strikes hit where the warnings show
(18 each). Then it stays on as a slowly turning thundercloud for about 3 minutes: a ship that comes near gets a
lightning bolt from it (10, at most every 1.4 s). NIMBUS itself near its own thundercloud gets golden bolts that charge it instead (every 1.2 s: +8 health, a third of each weapon's ammo, 40% of the tank). Then it clears into a rainbow (only a picture). Up to 3 at a time. Magic: the cloud banks lift and a rainbow arc flies out (20,
and NIMBUS gets back 10 health).

**REPRISE**, the modular orbital archive (`art/ships/reprise/`: four building modules put together in code). Button 1:
light climbs the tall tower and an amber bolt leaves its top (14). Button 2: the three other buildings fire one purple
shot each, in turn (5 each). Magic: the buildings let go, turn and lock into the next shape (archive steps, crossbar,
mirror spire; three times round brings it home), which changes where the shots leave from; and the other ship is sent
back in time: it flies backward along its last 3 s in slow motion (half speed), and its shots in the air fly back into
its guns, while a clock ticks and a clock face spins backward over it. It cannot steer or shoot meanwhile, so it is an
easy target. Nothing fires from REPRISE while it rebuilds.

**PUFF**, the puffer-fish ship (`art/ships/puff/`: 89 inflation frames). Button 1: three copper needles in a narrow fan
(6 each). Button 2: a slow pressure bubble that swells as it floats and pops on a ship (16 and a shove). Both are drawn in
code (the package only names them). Magic: it puffs up in three pressure pulses and 12 spines spring out; while they are
out a ship that touches it is stabbed (15, at most every 0.6 s) and thrown off, and PUFF turns slower; then it vents and
shrinks back (4.4 s).
Magic (puff-burst.js): it puffs up (1.5 s, 12 spines out) and STAYS puffed up (a ship touching it is stabbed) until the
next fresh press of a fire button: all 12 spines fly off at once (12 each), and the hull, losing its air, shoots off a
random way like a let-go balloon (1.1 s, up to 3x its top speed, wobbling). A ship it hits on that flight is blown up.
It stays crumpled until it puffs up again (6 s recharge, counted from the spines).

Button 2 (puff-bubble.js) is held: a bubble is blown on a nozzle in five pushes of air (2.45 s to full size) and leaves
when the button is let go: the bigger, the slower, and the harder it hits (8 to 30) and shoves. The soap film catches the
star's colour on the side facing it.

**TALUS** just grown: a dim glow hugging its outline, slowly running through the colours as it fades (`talusGlow`).

**THUL's smoke** is a green chemical haze: an enemy inside it loses 12 health a second (`MAGIC.smoke.chem.dps`).

**CINDER**, the blockade runner (`art/ships/cinder/`: a hull and two engines on swivel joints, put together in code).
Button 1: red bolts taking turns from the two front blasters (8). Button 2: an amber concussion torpedo; it blows up on a
ship or after 0.95 s, and the blast hurts (up to 22) and throws back every enemy near it. Magic, split into left and right
(each side its own recharge, 3.4 s; keyboard V and B): both engines swivel to that side and the ship is kicked sideways; it keeps
facing the same way and keeps its speed, and it can fire all the while.

**BORER**, the star miner (`art/ships/borer/idle.webp`; the weapons are drawn in code). Button 1: a fan of five metal
shards from the drill tip (5 each). Button 2: a drilling mine out of the back; it stops, arms, and when an enemy comes
within 1.6 ship-lengths it spins up and bores into it (22 and a shove). Magic, star mine: only close to the body in the
middle (a dashed ring shows how close if you are too far). The drill turns to it, bores in, leaves a bomb inside and backs
out the same way (1.78 s; no steering, no firing, no burn meanwhile). The bomb has no timer: the next time an enemy ship
touches the body it is shattered. One bomb at a time; it stays through BORER's death and goes when the body changes.
In a duel the other phone is told the bomb is there (not shown to them), sees its own touch, and sends `smx` back.
While it bores, the drill turns (24 frames, `spin_01..24.webp`): it spins up, drills, and turns back coming out.
Before it bores, four legs (drawn in code) unfold from its sides and grip the surface (450 ms, `legs`); they fold away as
the hull goes in and kick out once as it backs out. The bomb inside beats like a heart, with green cracks of light running
out through the star.

**RIVET's moving parts** (rivet-mechanics, `art/ships/rivet/pin_*, rail_*, scatter_*, wave_*, magic_*`): each shot moves
its part (the pin's barrel piston, the feed cover for the magnet balls, the crossarm jaw for the pellets, the emitter for
the nails), and the flip opens the cover, turns the clutch and shifts the jaw while the hull turns (backwards to turn back).
The quarter turn is drawn into those frames, so the game does not turn them again (`bakedTurn`).

**Stars that do not burn:** a ship with `starProof: true` (BORER, ORIAN) only bounces off a star, black hole or lava world.

**Moving armour (art updates):** SKARN's six ribs close in a cascade for its shards (17 frames, lock at 76 ms) and
climb forward for the return salvo (20 frames, lock at 135 ms). CINDER fires through recoil frames (a blaster's barrel
slides back and the hull kicks; the torpedo doors open, it kicks back, the doors shut), except during a side slip, when
the swivelling engines are drawn instead. BORER's thrust armour: pushing, its side plates slide out, the pistons and
cooling bays light up and the rear nozzles reach out with a purple exhaust (open 420 ms, held loop, close 320 ms;
`borerThrust`, turning back mid-way from where it is). Its 640 px frames keep the 512 px scale (`anim.base`).

ZORIAN's blue stripe is an energy channel: firing, a pulse runs up it to the nose (14 frames); laying a thread it runs
backwards to the projector in pulses (42 frames). KRAAL's gun pods slide forward and recoil on their rails (14 frames); for
the crossing shot the middle plate lifts on the hot core and the pods turn inward before they fire (26 frames).

KRAAL's crossing shot meets BEHIND it, against the way it is flying (hold to push the point farther back): it hits what
chases it while it gets away. Hardly moving, the point is behind its tail (`crossPoint`).

VEXAR's egg forms in the open (vexar-egg-deploy): the wings swing out, the chamber covers peel away, a glowing seed
swells in three pulses into the egg (its kind is picked at the press), which wobbles up and springs out at 1,140 ms
(55 frames, 1,650 ms); outside it settles and incubates as before.

VEXAR's tail is one tap now: it grows out, stays out 8 s, and pulls back in by itself (`MAGIC.tail.hold`).

TALUS forges its boulder (talus-forge): the fissures light red, 20 fragments tear off the hull and spiral into a point
ahead of the nose, the rock grows in four steps with a flash after each, and at 1,430 ms it leaves at the size it was
formed; in flight its glowing cracks cool (hot -> warm -> cool). TALUS keeps its own colored layers meanwhile (the
package's flipbook frames are of the plain hull, so the forging is drawn in code with the package's rock and chip art).

MIRAGE's false stars now stay 5 minutes (up to 10 of them; a new one takes the oldest's place), and every two of them
are joined by a beam of light: a web. An enemy touching a beam loses 14 health a second (`MAGIC.lens.webDps`). The
more false stars, the thicker the web. When either ship is destroyed, all the false stars go out.

**PALISADE**, the fortress (`art/ships/palisade/`). Button 1: a ricochet bolt that banks once off its own wall (off
the face it strikes, at the same speed, changing colour). Button 2: deploy a wall: the three roof plates slide back,
two arms rise from the bay, grab the wall and fly it forward from where the ship was at 0.56 s (turning after that
moves only the ship), set it down at 1.04 s and let go; the roof shuts. The wall stays 7.8 s or four enemy shots (four
lamps), stops enemy shots, lets its own pass; ships fly through it. One wall at a time. Magic, ceramic shatter: only
with the wall up; 0.36 s later it breaks into seven shards fanned out the way it faces (if it was knocked down
meanwhile, nothing). In a duel the wall is sent to the other phone (`pw`), which stops its own shots on it and tells
the owner (`pwh`) to put out a lamp.

**GIMBAL**, the gyroscope fighter (`art/ships/gimbal/`, the pack's `gimbal.js` rules and `gyro-clockwork.js` layers).
Drawn in moving layers: a brass cage (it keeps still), three toothed rings (brass, titanium, ivory) spinning in turn one
way and the other, four pinions, and the cockpit spine through the middle. GIMBAL does not steer: its hull turns by itself
all the time like a clock, a 30° tick every 410 ms (`gimbalTurn`, a full turn in 4.9 s). Pressing thrust pushes it the way
the nose pointed at that moment, and keeps pushing that way while held, even as the nose turns on (the plume shows it). Button 1, rim blades: two
curved blades from both sides of the bow, 8.3° out to each side (8 each). Button 2, quarter gate: 0.31 s after the press a
disk is set ahead of the ship; for 3.2 s it turns enemy shots that cross it a quarter round clockwise (the same speed,
marked with a gold ring), three times at most (three bright ring segments, one per use left). It stays where it was set;
your own shots pass. One gate at a time. Magic, momentum flip: 0.24 s after the press the way the ship moves turns right
round, at the same speed, while the nose stays where it points; it only works while moving (from rest the button is dim
and does nothing). In a duel each phone shows the other's gate and turns its own shots on it (`gt`, `gth`, `gfx`).

**LARIAT**, the orbital salvage tug (`art/ships/lariat/`, the pack's `lariat.js` rules and `winch.js`). Button 1: an ion
rivet from the right mount (9). Button 2, star harpoon: 0.16 s after the press a hook flies from the boom the way the nose
points; if it reaches the body in the middle while the ship is near enough, it bites in and the ship is on a cable: the
winch reels it in (the drum on the hull turns), and a taut cable pulls it toward the body, so it swings round it. The
cable lets go by itself after 5.2 s, or if the ship gets too far or too close. One hook or cable at a time. Magic, tug
ram (`clutch` in `MAGIC`, every 12 s): only while the rope is round the enemy or the star (the button stays dark
without it); the rope lets go, and the tug flies fast straight into the enemy (it keeps turning
toward it, up to 0.9 s); on contact it takes 50% of a full ship's health (no crash damage on top), knocks the enemy away
and bounces back. If the hook hits an enemy ship first, it winds round it (four loops) and holds it on a rope (`ELASSO`):
for 30 s the caught ship turns at half its speed (turning takes twice as long) and its guns reload at half their rate,
and it is dragged along behind the tug (a taut rope pulls it hard, the tug only a little; each phone pulls its own).
Damage does not free it: the rope lets go after 30 s, when a ship is gone, or when the tug rams. On the body, the hook does not stick in: the rope winds round the body, four
loops one after another (0.55 s), and holds it tight, cinched round its waist; the body is squeezed a little into an oval
(narrower across the loops, longer along the pull, more while the cable is taut). The loops turn with the ship as it
swings (`LASSO` in the game). Our bodies are much
bigger than the pack's practice star, so the reach (306 units) and the slack (64) are measured from the body's surface.
In a duel the other phone sees the hook and the cable (`lh`, `lt`, `lfx`).

**BALLAST**, the asteroid tug (`art/ships/ballast/`: hull, wing, weight and asteroid from the BALLAST-Asteroid-Magic
package, drawn from its parts by `drawBallastRig` so they move; `idle.webp` is the folded pose for the hangar and icons).
Heavy and slow (`HANDLING`). Button 1: a rail slug from the nose (8). Button 2: a ballast sinker from the weight (24),
slow, and the body in the middle pulls it, so it curves. Magic, asteroid tow (`tow` in `MAGIC`, `updateTow`): **hold** the
button. The cable wing opens, three cables fire 100 ms apart off the screen to the right and latch onto a big asteroid out
there (1.43 s, the package's timeline in `towRig`); the weight slides out on its rail and hits its stop with a jolt to the
left. Let go before the cables latch and nothing happens (2 s recharge). Still holding, the asteroid is reeled in to the
ship's right side and swings round with it as it turns, so turn your right side to the enemy. **Let go**: the cables drop,
the ship is flung one way and the asteroid flies the opposite way; after 5 s it blows up (sooner if the enemy comes near
it, or if it flies into the body in the middle): 70 health at its middle down to 30 at 3.2 ship-lengths, and a big shove.
A warning ring shows its reach and its cracks glow hotter as the fuse runs down. Held 14 s it lets go by itself; 12 s
recharge after the let-go. The computer holds it, turns its right side to you and lets go when the asteroid lines up.
In a duel the other phone sees the asteroid and the cables (`bt`) and the blast (`btx`).

**STRATA**, the vertical-shift ship (`art/ships/strata/`: two views, top and bank, each a body and two fork wings on one
shared canvas, from the STRATA-Vertical-Shift package; drawn by `drawStrata`, a port of its renderer). The wings slide
forward in little pulses with the thrust. Button 1: fork bolts, one from each fork tip at once (6 each). Button 2: a rift
seeker, a slow orb that turns after the enemy (16). Magic, vertical shift (`vshift` in `MAGIC`, `updateShift`, 18 s
recharge): it tips its nose, the front engine fires a jet down, and it rises into the upper dimension: drawn high above
its grey shadow, which stays on the arena where the ship really is. Up there nothing touches it (shots pass under, no
crashes, no star) and it cannot fire, but it still flies. Keep the middle of its shadow on the enemy for a quarter of a
second (within 0.6 ship-lengths of its middle; counted only once it is all the way up; slipping out unwinds the lock
twice as fast as it wound) and the sight closes and a laser fires straight down: the enemy loses one whole tank of power
(with no spare tank left, that is its ship; `tank`, or set it false for `dmg` instead). Then it comes down; with no lock
by 7.55 s it comes down anyway (about 5.9 s up there, twice as long as before). The shadow hides while a ship is over it. Caught on a LARIAT's
rope, the shift slips the rope off and STRATA gets away (`lsf`); a LARIAT's hook cannot catch it while it is up. The
computer uses it when close, and flies its shadow onto you (braking as it gets there). In a duel the other phone sees it
all (`sv`); the laser's tank is sent as `tank`.

**KILN**, the furnace ship (`art/ships/kiln/`: hull, shutters, gear and mine from the KILN-Reverse-Gravity package, drawn
by `drawKilnRig`). Button 1: slag shot from the furnace grille (7). Button 2: three mines in a fan (`kmine`); they slow to
a stop, arm after 0.6 s, wait 25 s (at most 9 of yours) and blow up once on an enemy that comes near (22 and a shove).
Magic, reverse gravity (`reverse` in `MAGIC`, 16 s recharge): the shutters slide apart and the gear spins up; at full
power, for 4 s, the body in the middle pushes the ENEMY away and round instead of pulling it (KILN keeps the normal
pull), wavering a little, so the enemy is flung round in a widening circle, into the mines, and swings back after. Full
strength within 1.5 screens of the body, none past 3. The body glows cold blue with rings going out while it lasts.
Each phone moves its own ship, so the push is worked out on the pushed ship's phone from a seed both share (`rg`); the
gear is shown with `kl`. The computer lays its mines first and only then uses the magic.

**FRANKENSTEIN**, the white surgeon (`art/ships/frankenstein/`: the surgeon, arms, forceps, saw, the four creature parts and
the scrap shots from the FRANKENSTEIN-Surgery package; drawn by `drawSurgeonShip` and `drawCreature`). Quick, since it is
the one that has to stand still to work. Button 1: scalpel, a fast thin cut (6). Button 2: three electric sutures in a
fan (5 each). Magic, surgery (`surgery` in `MAGIC`, `updateSurgery`): the first press marks a work spot just ahead of
the nose and starts 5 s of surgery: it cannot move or steer (the forceps reach out, a roof hatch opens and the saw spins
and cuts), so choose a spot far from the enemy. After that the spot stays where it is, even when FRANKENSTEIN flies off,
and each new press starts the next part there, in turn: STRATA's chassis, VEXAR's wing, BALLAST's shoulder, KILN's engine.
Each takes 3 s to make, and only while FRANKENSTEIN is inside the work zone round the spot (the ring, 7 ship-lengths, about two screens;
a press from outside does nothing and the ring flashes red; leaving halfway stops the making until it comes back). While
a part is made: fire, colourful lightning and bubbles passing lightning between them, growing as it is made, with a ghost
of the part flickering in; when it is there the bubbles fly apart and pop, then it all starts again for the next part
(a fifth press makes nothing; the count shows by the spot and on the button). With the fourth on, the effects die down and the creature lifts
off: it flies by itself round the enemy and fires a bolt, a spring and a nut in turn (every 0.75 s, within 2.2 screens).
It is nobody's ship to pick or fly. It has two tanks' worth of power (200) and does not wear out by itself: it has to
be shot down. A power bar over it has a notch at each quarter; each quarter lost knocks a part off (KILN's engine, then
BALLAST's shoulder, then VEXAR's wing) so it looks less and less built, and the last quarter blows it up with STRATA's
chassis. The other phone decides its hits and sends them (`chit`; its end: `cx`), and the computer shoots it first when it
is nearer than FRANKENSTEIN. It also falls apart when FRANKENSTEIN blows up; then 20 s to recharge.
The computer operates when you are far off, stays in the zone and starts each part as soon as it can. In a duel the other phone sees
the surgery, the spot, the parts and the creature (`fk`); the creature's shots go as ordinary shots.

**LABYRINTH**, the iron foundry (`art/ships/labyrinth/`: the LABYRINTH package's atlases cut into 512 px frames: a
24-frame flight loop, the rivet burst, the slag fan and the soldering-iron melt; `crown.webp` is the Iron Crown spire;
its buttons are in `art/hud/labyrinth/`, its BLOOM zombie in `art/bloom/zombie-labyrinth-top.webp`). Heavy and slow.
Button 1: a steady stream of rivets while held (about 8 a second), the two arms taking turns.
Button 2, the forge ball: a big iron ball that hunts the enemy (`homing`), bounces off the maze walls (up to 20 times),
and blows up when it gets near it (`prox`; a blast of 24 at its middle and a shove) or at the end of its 5 s flight. Magic, Starforge (`starforge` in `MAGIC`,
`updateMaze`): an iron crown rises round the star for 4.5 s (the star still burns and pulls), then its jaws close and the
star goes out (no pull, no heat, nothing to hit): the light dips, and iron walls spread out from it as an outline
(0.65 s), then turn solid. The whole arena is a maze for **60 s** (a countdown at the top), then the walls dissolve and
the same star comes back (a ship sitting where it will be is moved out first). The maze wraps round like the arena:
cells half a screen wide (`cell`: narrow corridors, hard to fly without hitting the walls), walls drawn as solid
iron plates with rivets (no glow), every corridor joined, a fifth of the extra walls opened for loops, open round the
star. In the maze:
- **LABYRINTH flies through the walls**: its soldering iron heats and reaches out, the wall glows white-hot and opens a
  passage with a cyan seam just for it, which closes behind it.
- **Its shots bounce off the walls** (the same speed, mirror-like, so the angle decides where they go; rivets up to 6
  bounces, the ball 20, each giving 0.35 s more flight), so they can find the other ship round corners.
- **The other ship's shots are stopped by the walls** (they splash on the iron), and the other ship is stopped by them
  too: flying into a wall bounces it lightly, it slides along, and it loses 4 health (at most every 0.5 s).
  A STRATA up in its vertical shift passes over them.
The computer flies the corridors (`mazeWaypoint`), slows before turns and holds its fire when a wall is in the way.
Destroying LABYRINTH while the crown is still rising calls it off. In a duel the owner's phone sends the maze's seed and
clock (`mz`), and the other phone builds the same one; if both press at once the lower seed wins.

**BOILER**, the copper diving bell (`art/ships/boiler/`: the BOILER Flood Hunt package's 384 px frames, re-centred on
its pivot: a 32-frame idle (water churning in the glass, the gauge, the piston collars), a 32-frame high-pressure loop
while the water fills, and the launch flash; buttons in `art/hud/boiler/`, its BLOOM zombie in
`art/bloom/zombie-boiler-top.webp`). Button 1: a pressure torpedo (12, 0.8 s apart, 4 s): straight under water
(bubbles behind it), a crown splash where it crosses the surface, and out of the water it turns after the enemy, slowly
(`homing` 1.2, `dry`): a ship far from the water has to turn hard to shake it off. Button 2: a floating can, let out
underneath: it rises through the water trailing bubbles and blows up as it reaches the surface (26 at its middle, a
1.4 ship-length blast), so it hits the ship riding the surface; out of water it drifts and blows up near the enemy or
after 6 s. (Its button picture is still the old steam one.) Magic, **Flood Hunt** (`flood` in `MAGIC`, `updateFlood`): water rises from
the bottom of the arena up to the star's middle in 2 s, stays for a **60 s** hunt (a countdown at the top), then drains
in 1 s. While it is up:
- Under water BOILER (and its torpedoes and cans) passes through the star's lower half.
- BOILER is drawn down under the water and kept there; the enemy is pushed up and kept above it (the arena does not
  wrap top to bottom then). **In the water there is no gravity**, and the water drags (`drag`).
- **The enemy cannot hurt BOILER**: its shots splash on the surface, and any other damage only splashes. BOILER's
  torpedoes fly up through the surface and hit it. The star does not burn BOILER.
- **XELTAR swims**: it may go into the water, and then the two fight with their plain weapons (neither has magic;
  BOILER is not shielded from it). XELTAR has the edge: in the water it is faster and turns quicker, and it hardly drags.
- **LYTH's ring** can be thrown into the water: if it passes over BOILER, BOILER blows up.
- **LARIAT's harpoon** can catch BOILER (near the surface: the hook's reach) and reel it in; pulled out of the water,
  BOILER blows up.
- **BALLAST's asteroid** sinks in the water toward BOILER (its fuse waits), and one flying over BOILER drops straight
  down onto it; reaching it, it blows BOILER up.
- BLOOM: BOILER's magic still works as a zombie, and the water washes it clean, every time (an infection under water
  is washed off at once). The health it lost stays lost.
The flood ends at once if BOILER is destroyed. LABYRINTH's walls stay in the water, and the flood never relights a
star the maze put out. In a duel the owner's phone sends its clock (`fd`); a blow-up is sent as `wk`.

**FLIPPER**, the pinball ship (`art/ships/flipper/`: the FLIPPER package's atlases cut into 512 px frames; its buttons in
`art/hud/flipper/`, its BLOOM zombie, its 3D picture). **Sold only in the station's shop** (`shopOnly`: never drawn into
the random fleets against the computer or a phone; it is in the test hangar, and always first among the shop's ships).
Button 1: a steel ball from the nose rail that bounces once off the star. Button 2: the spring plunger, a short punch
straight ahead that shoves. Magic, **pinballs** (`pinballs` in `MAGIC`): three pinballs are let loose round the other
ship, in a pinball table (a red dashed frame with bumpers, 2.4 screens square) that drifts after that ship more slowly
than a ship flies. For a minute the balls bounce off its edges at slightly random angles; each one that reaches the
ship takes half a health tank (shields help) and is gone. A ship that sits still is hit by all three about 3 times in 4;
dodging, or flying off before the table catches up, saves it. The other ship's phone runs the balls (so hits go by
where that ship really is) and sends them in its state (`pb`) for FLIPPER's phone to show.

**COURIER**, the pneumatic mail ship (`art/ships/courier/`: the COURIER package's atlases cut into 512 px frames; its
buttons, its BLOOM zombie, its 3D picture). Sold only in the shop (`shopOnly`), and in the test hangar. Button 1: a brass
burst, two rounds at once from the nose ports. Button 2: a mail capsule from its tube that the star's gravity bends round
(blinking orange, a fading trail; one at a time). Magic, the **orbit mine** (`orbitmine` in `MAGIC`): each press puts one
more spiked mine on a circle round the star, at the ship's own distance from it, going round the way the ship is going.
A mine keeps going round until it reaches an enemy ship, then it blows up and takes 1.5 health tanks (a whole tank and
half another). It does not stop when the magic is over, nor when COURIER is destroyed (only when the match ends). Its
circle shows faintly (red for the other side's, so the danger can be seen coming), and the radar shows the mines. The
owner's phone sends each new mine (`om`); the phone of the ship it reaches decides the hit (`omk`).

**FRESNEL**, the lighthouse ship (`art/ships/fresnel/`: the FRESNEL package's atlases cut into 512 px frames; its
buttons, its BLOOM zombie, its 3D picture). Sold only in the shop (`shopOnly`), and in the test hangar. Button 1: a
focused golden flash from the lens. Button 2: two coloured light shards from the side shutters, aimed to cross 2
ship-lengths ahead (`aimAt`), then on. Magic, the **light snake** (`snake` in `MAGIC`): a beam throws a triangle of light
ahead of the ship; it opens a portal, and a snake comes out of it: one smooth glowing body, its colours running through the rainbow. It chases the
other ship, growing the whole time, to three times its first length (its body is a wall in the way); near it, it circles round it, closing it in its body, and the ring tightens: sitting
still gets the ship squeezed (first touch after ~7 s), flying out through a gap saves it. A touch takes 1.5 health tanks,
and then it flees back through a portal at its head, as when its time is up; it is harmless while coming out and going back. After 30 s a portal opens at its head
and it is drawn back into it, its tail last. The other ship's phone runs the snake (FRESNEL's phone sends `sn`; the snake
comes back in that phone's state, `sn`, to be shown).

**VAULT**, the art-deco safe (`art/ships/vault/`: the VAULT package's top-down drawing, the cube 384 px in the 512
canvas, and its two doors cut from it, `door-up` / `door-dn`; its buttons, its BLOOM zombie, its 3D picture). Sold
only in the shop (`shopOnly`), and in the test hangar. Button 1: a brass burst from both ports. Button 2: the spring
piston, a short heavy brass punch that shoves (`knock`). Magic, the **star in the vault** (`vault` in `MAGIC`): the
doors slide open (the wheel door up, the lights door down, drawn in code: `drawVaultDoors`), the star flies into the
mouth shrinking, and the doors close on it, light leaking from the seams, a 30 s countdown over the ship. Meanwhile the
middle of space is empty (nothing to hit or bounce off), and the star's gravity comes from VAULT instead (`starPull`):
full within 0.55 screens, gone by 1.5, below every engine's push, so the other ship can always fly out, but it has to.
Every 2.5 s a radiation wave goes out 0.8 screens, and each wave takes 10 health from the other ship inside it (its own
phone decides). Button 2 is then **solar fire**: the doors open and a spray of flame leaves the mouth, with an aurora of
turquoise, green and violet (only a picture); the button glows amber with a turquoise edge. When the star is taken,
COURIER's orbit mines round it are flung out of the screen. After 30 s, or when VAULT is destroyed, the star flies back
to the middle. One held star at a time, never with LABYRINTH's maze. VAULT's phone sends the state as `vt`.

**CORSAIR**, the pirate ship (`art/ships/corsair/`: the CORSAIR package's 512 px frames; `h_*` the same frames over
its ghost-ship drawing, made by laying each frame's flashes on it; `fireL` the left side's volley, mirrored; the
package's three ghost sheets, `ghost-*.webp`). Sold only in the shop, and in the test hangar. **Button 1 is an aiming
stick**, like the thrust button: drag the thumb the way the cannons should point; the side nearer that way fires its
five cannons bow to stern (68 ms apart), each ball where the stick points, as far as the cannons swing (40° either side
of straight out); a tap without dragging aims at the enemy, and dotted lines show the aim while the thumb is down.
Button 2: chain shot, two iron balls on a chain spinning round each other, falling round the star. Magic, the **ghost
ship** (`haunt` in `MAGIC`): teal light runs through it (its frames), and for 12 s its shots are ghost shots that turn
after the enemy (`ghostshot`, `ghostchain`); then it changes back. **Every hit** of its shots raises a ghost over the
ship hit, on both phones: a skull for a ball, the skeleton in a bandana for the chain, the captain in his hat for a
ghost ship's shot (one every 0.3 s at most per ship); and gives CORSAIR health, half the damage (all of it from a
ghost ship's shot). Health past full fills a spare tank, up to two more than usual. The state goes as `ht`, ghosts
as `gh`.

**The station and its shop** (the Orbit Break Docking package: `art/station/`, `art/ui/shop/`, the alien seller in
`art/ui/shop/alien/`). A docking station floats in the arena, one of `STATION_LOOKS` picked at random (one picture so far;
up to five, each with its own solid parts and bay as boxes in its picture), somewhere around the star. Both phones have
it in the same place (its seed travels in the duel's `hi`). Only its ring is solid (ships bounce off it, shots stop on
it); the bay between its arms is open and faces down. Fly into the bay slowly and a ⚓ dock button shows; docked, the
shop opens over everything, and the ship is safe there. **Exit** sends it out through the bay's mouth (safe for 1 s).
- **Money:** every ship has its own wallet (`bank` on the phone, `spaceship.bank`): a win pays the winning ship
  `killReward` (against the computer `SHOP.computerPay` = 40% of it), and a ship gets 300 the first time it docks. The
  total (Σ) is the sum of all wallets; a ship spends only its own. Rare-earth minerals (◆) and metals (⬢) are counted
  for things still to come. The money shows under the fleet row (this ship's, and the total).
- **The shop page** (on the canvas, like the other pages; it fits the tall phone and the open Fold): the ship, its
  money, the total, minerals and metals at the top; the alien seller (waves when you come in, then talks: a speech
  bubble with the words appearing, his mouth moving, pausing at spaces; he reaches toward the goods while one is
  chosen); the docked ship turning on a hologram stand (to be swapped for its 3D art); five goods on a shelf; the
  chosen one's options; **Buy** (it checks the money first, and waits a moment after paying so one press never pays
  twice) and **Exit**.
- **The goods** (prices in `SHOP`): a spare health tank (+1, up to the 5); a full ammo refill; a **passive shield**
  (absorbs 15 / 25 / 40 of the hits, refills 6 a second 3 s after the last hit) and an **active shield** (its own
  button right of the thrust button: nothing gets through for 2.5 / 3.5 / 4.5 s, then 16 / 14 / 12 s to recharge),
  3 levels each, bought one level at a time; an **extra weapon** from other ships (4 on offer each visit; button 4,
  left of fire button 1; it refills by itself), and **ships** for this game's fleet (6 on offer, a lost one can be
  bought back; priced by rarity). Shields and the extra weapon stay with the ship that bought them.
- **In a duel, while one player is docked** the other fights practice ships: three computer ships that circle and
  shoot but cannot hurt it (no health lost at all then), 20 for each one shot down, and its weapons refill three times
  faster, until the other comes out.

**The shop's looks on the ships** (the Orbit Break Fleet Upgrades package: `art/upgrades/<ship>/`). A ship with a shield
from the shop (passive or active) shows its own shield layer behind it, and with an extra weapon its own extra cannon on
top; button 4 fires from that cannon's muzzle. The other phone sees them too (`gr` in the state). `UPGRADE_FIT` places
each package canvas on the ship (worked out once from the package reference body against the ship's own picture,
matched by length; LABYRINTH's reference is two views, the top one is used; GLITCH's hull is its core and wings
together; REPRISE, built of moving buildings, gets no layers). In the shop the shield options show the ship's own shield
button and the weapon card its own cannon button.
**3D pictures** (the Orbit Break Fleet 3D archive, `art/ships3d/`, 640 px): the shop's showcase shows the docked ship's
3D picture in a hologram frame, with the ship from above and its looks in a corner; choosing a ship to buy shows that
ship. (Ships without a 3D picture turn on the hologram stand as before.)
**Buying ships**: three ways (`SHIP_BUY`, times the ship's price by rarity): for this game only (×1), rented for a week
(×2.5; renting again adds a week) or for good (×8). Rented and owned ships join the player's fleet in every game (against
the computer and against a phone). They are kept on the phone for now (`bank.owned`, `bank.rent`). The ships still being
made (CORSAIR, COURIER, FLIPPER, FRESNEL, GRAVITY SAIL, KNUCKLE, LINK, VAULT) are shown as "coming soon" with their
pictures, not for sale yet. The ship list has pages when it is long.

**Resource comets** (the Orbit Break Resource Comets package: `art/comets/`, the tail atlases at half size, 24 frames,
25 fps; `COMET` and `MINERALS` hold every number). About once a minute (at random: some sooner, some later, so a longer
fight sees more of them; the first not before 20 s) a comet crosses near the fight, 15% faster than an average ship,
nose along its way and its tail behind, throwing coloured sparks, its value written over it, and a thin health bar.
It burns out after 24 s; the radar and the screen's edge show where it is. Shoot it down (36 damage) for what it carries:
- **a gold comet** (4 in 5): coins for the ship that shot it down, 100 to 1000 in steps of 50, the high values rare
  (about 1 in 6 is 700 or more);
- **a crystal comet** (1 in 5): 1 to 5 of one rare-earth mineral (fewer more often): Neodymium (50% of them, worth 60
  each), Dysprosium (30%, 150), Terbium (15%, 350), Promethium (5%, 900). They are kept on the phone (`bank.res`) and
  counted in the shop's header, each in its colour.
Both phones see the same comets: the bottom player's phone makes them (`cm`), every hit is sent (`cmh`) so both count
the same damage, and the phone whose hit finishes it gets the reward and tells the other (`cmk`).

**App icon:** `app/src/main/res/mipmap-*/` (a rounded-square and a round one, and an adaptive icon: the picture in
`ic_launcher_foreground.png` on the dark `ic_launcher_background` colour).

**MIRAGE**, the prism ship (`art/ships/mirage/`). Every button charges first: light runs up the prism to the nose (12 frames)
and the shot leaves at the end. Button 1: a focused pulse, one narrow fast amber shot (280 ms charge, 15). Button 2: a
violet seed (390 ms); 0.46 s after it leaves it splits into three shards (8 each) fanned round where it is going then.
Magic, false star (480 ms charge, 9 s recharge): a lens opens 1.5 ship-lengths ahead for 3.1 s and pulls every shot that
passes near it, anyone's, toward its middle: bend your shots round to the enemy, or pull theirs off you. Ships and the
real star are not touched. In a duel it is sent to the other phone (`fs`) so their shots bend there too.

**Test hangar (for now):** under the duel swords there is a hangar button. It opens a screen with every ship that has
real drawings (THUL, VEXAR, LYTH, TALUS, ORIAN, SKARN, DRAKON, XELTAR, KRAAL, ZORIAN), with its weapons and magic; tap one to fly it right away.
It is only for trying them: the choice is not saved, and in the real game each player has the one ship from the gift,
changed only by trading. To turn the hangar off: `HANGAR = false` at the top of the game. `TRY_SHIP` (a ship id) still
makes everyone fly one ship; `""` is the gift's surprise.

**Duel (two phones, one fight):** tap the crossed swords under the map on both phones (it leaves the computer match) (close to each other, Bluetooth on).
They find each other with no internet, count 3-2-1, and each player sees the other's own ship in the same space,
starting on opposite sides of the planet. Everything is seen on both phones: flying, firing frames, shots, eggs and
hunters, the tail, the smoke. Your weapons decide what they hit on your screen and send the damage to the other phone.
The score under your health bar: your wins (green) : theirs (red). When your ship blows up you pick the next one (any
hangar ship; the other phone sees it). Tap the swords again to leave; the computer match comes back.
On a computer: open the game in two windows of the same browser and press the swords in both.

## My ships, kills and money

The first time the game opens it asks for an email. The email decides the player's 3 ships (drawn by the rarity odds
from the ships with real drawings): the same email always draws the same 3, even after reinstalling. The "My ships" page
(the button with three cards, under the hangar) shows them from the front (the concept pictures in `art/fronts/`; the
top-down drawing for a ship without one). Tap a ship to fly it. To trade: drag a ship down into the trade box; the game
looks for another phone that is also offering a ship, both see the two ships, and the swap happens only if both say yes.
(Trading is no longer done by swiping up in flight.)

Coins are off for now (`COINS = false`; the fleet row is shown instead). When on: under the health bar, kills and coins. Every kill counts; coins only for beating another player (a duel): 100 for the
kill, up to 120 for doing it quickly (nothing after 90 s), up to 60 for health left, 0 / 30 / 60 / 100 by the beaten
ship's rarity, all times a streak bonus (kills without dying: x1.2, x1.4 ... up to x2). The numbers are at the top of
the kills-and-money part of `index.html` (`KILL_PAY` ...).

The server is Supabase (`SERVER_URL`, `SERVER_KEY` at the top of `index.html`; `server/supabase.sql` makes the table).
Signing in: the email gets a 6-digit code (the Supabase email templates must show `{{ .Token }}`). Signed in, the
profile (ships, kills, coins) is kept on the server and wins over the phone's copy at start, so a new phone with the same
email gets the traded ships and the coins back. Trades and duels then meet over the internet (Supabase Realtime rooms,
one for duels and one for trades; the ship's state is sent 12 times a second online). Without signing in ("go on
without an account") everything stays on the phone, and trades and duels are with a nearby phone, as before.

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
