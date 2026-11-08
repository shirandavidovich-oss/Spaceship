# Spaceship

Every player has one spaceship. It arrives inside a surprise gift: tap the gift 3 times and it opens.
The ship is chosen by rarity (common 50%, rare 30%, epic 15%, legendary 5%) and kept on the phone.
Flying works like Star Control 2's Super Melee: space is 10 screens wide and 10 tall and wraps
around, with a planet in the middle that pulls the ship. Tilting the phone points the ship's nose
(all the way round, 360°); held at the usual angle (about 35° from flat) the nose stays where it is.
The round button for the left thumb fires the engine toward the nose. Its fuel runs out over the
ship's `fuel` seconds (30 for now): the button goes white → yellow → orange → red → purple → blue →
black, and then disappears. It fills back up by itself (`refill` seconds per ship, 15 for now)
and the button returns once the tank is 20% full.

An enemy ship flies with you: it chases you, keeps a little distance and stays off the planet,
using the same flying rules as you. The view zooms out to keep both ships on screen.

**Weapons (right thumb):** button 1 and button 2 are the ship's own two weapons; hold to keep firing.
The ring around each button is its ammo, and it refills by itself. Shoot the enemy until its health bar
is empty and it explodes, leaving a crate with its weapon (laser, missiles or fan). Fly into the crate:
**button 3** appears with that weapon. It does not refill; when it is empty, button 3 goes away.
A new enemy arrives a few seconds later.

**Magic (left thumb, above thrust):** each ship's magic button looks like the ship's style. The brass ship's
is a turning brass gear: tap it and thick smoke pours from the engines; for a few seconds the enemy
cannot see you and searches where it last saw you. Then the gear recharges (its brass fills back in).

**THUL**, the orange mechanical gunship, is the first ship with real drawings (`art/ships/thul/`: an idle
sprite and 5 firing frames per weapon, 512 × 512, center pivot, nose up). Button 1 plays the twin-cannon frames
and each shot leaves from the barrel that flashes; button 2 winds up the brass iris and the shot leaves at
the big flash. Frames are timed in milliseconds, so they run the same on any screen. It has a mechanical steam engine: a ragged flame, backfires, creaks and
squeaks, and now and then the fire goes out for a moment (no push, only smoke). While testing, everyone
flies it (`TRY_SHIP` at the top of the game; set it to `""` for the gift's surprise again).
Swipe up to offer a trade with a phone nearby; the swap happens only if both players say yes.

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
