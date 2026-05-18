# Day n Night — background audio bed

Drop two looping tracks here to power the immersive scene's audio:

- **`daytime.mp3`** — country track. Plays during Opening + Cookout (scene
  progress 0.00 → ~0.45). Fades out through the sunset zone and returns
  during the dawn lift (0.94 → 1.0).
- **`nighttime.mp3`** — hiphop track. Plays during Dress + Night +
  Closing (scene progress ~0.5 → 0.92). Crossfades into and out of the
  country track through the sunset and dawn zones.

Both files are looped (`<audio loop>`) and run through a per-track
low-pass filter that closes in the transition zones (sunset, dawn) so
the genre swap reads as "muffled out" rather than a hard cut.

## Format / encoding

- **Container:** `.mp3` (broadest browser support; no licensing tax)
- **Recommended:** 128–192 kbps CBR, stereo, 44.1 kHz
- **Length:** anything from 90 s up. The component loops cleanly, so
  shorter loops are fine as long as the join points don't pop.
- **Loudness:** match RMS levels between the two tracks. The component
  applies a fixed `BASE_VOL = 0.55` ceiling — anything mastered hot will
  dominate when the other track is at full gain.

## Where this is wired up

- Component:
  [`src/components/sections/DayNNight/Immersive/DayNightAudio.tsx`](../../../src/components/sections/DayNNight/Immersive/DayNightAudio.tsx)
- Toggle chrome: top-right of the immersive view, one row below the
  view-mode pill. Reads "♪ SOUND" with a strike-through when off,
  cleared when on.
- Decoupled from the site's main Radio (Howler-based). This bed is part
  of the event scene; it never leaves the Day n Night page.

## If a file is missing

Both files must load cleanly (`canplaythrough` / `loadeddata`). If
either fails (404, decode error, blocked by autoplay policy after a
failed `ctx.resume()`), the toggle quietly disappears and the rest of
the page is unaffected. Drop the files in and the toggle returns on the
next page load.
