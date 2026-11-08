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

An enemy ship flies with you (no weapons yet): it chases you, keeps a little distance and stays
off the planet, using the same flying rules as you. The view zooms out to keep both ships on screen.
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
| Rule checks (35° = still, tilt points the nose, fuel colors, gift odds) |
| Ship drawings (when they arrive): `art/ships/<id>.png`, nose up, see-through background | `tests/ship.test.js` |
| Android shell: full screen + tilt sensor | `app/src/main/java/com/shiran/spaceship/MainActivity.java` |
| Direct phone-to-phone link (Bluetooth / Wi-Fi) | `app/src/main/java/com/shiran/spaceship/PhoneLink.java` |
| Automatic APK build | `.github/workflows/build-apk.yml` |

On a computer: open `index.html` in a browser. Arrow keys tilt; space bar = thrust button; `?reset` gives a new gift;
`?fake` pretends another phone answered a trade.
