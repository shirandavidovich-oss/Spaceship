# Spaceship

Every player has one spaceship. It arrives inside a surprise gift: tap the gift 3 times and it opens.
The ship is chosen by rarity (common 50%, rare 30%, epic 15%, legendary 5%) and kept on the phone.
Fly it by tilting the phone. Held at the usual angle (about 35° from flat) it hovers still.
Swipe up to offer a trade with a phone nearby; the swap happens only if both players say yes.

## Install on the phone

Every push to `main` builds a new APK automatically (GitHub Actions, about 3–5 minutes):

**https://github.com/shirandavidovich-oss/Spaceship/releases/latest/download/Spaceship.apk**

After that, every launch fetches the newest `app/src/main/assets/index.html` from this repo,
so game changes arrive without reinstalling.

## Where things are

| What | File |
|---|---|
| The game (settings at the top) | `app/src/main/assets/index.html` |
| Rule checks (35° = still, gift odds) | `tests/ship.test.js` |
| Android shell: full screen + tilt sensor | `app/src/main/java/com/shiran/spaceship/MainActivity.java` |
| Direct phone-to-phone link (Bluetooth / Wi-Fi) | `app/src/main/java/com/shiran/spaceship/PhoneLink.java` |
| Automatic APK build | `.github/workflows/build-apk.yml` |

On a computer: open `index.html` in a browser. Arrow keys tilt; `?reset` gives a new gift;
`?fake` pretends another phone answered a trade.
