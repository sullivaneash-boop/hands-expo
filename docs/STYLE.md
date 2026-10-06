# HANDS! — Style Guide (visual + audio)

> Condensed from `docs/research/03-aesthetic.md`. Status: Phase 0, 2026-10-06.
> **Grey-box rule:** through Phase 3, the game uses placeholder rectangles, system monospace, and generated beeps. Apply this guide in Phase 4 only. The palette tokens are defined from Phase 1 so the grey-box already uses the right *colour roles*.

---

## 1. The feel in one line

A late-2010s indie job sim seen from a fixed post: pre-rendered stills, a limited warm-shifted palette, sound doing the work the visuals don't. **Busyness is the threat, not darkness.** No jumpscares.

What we keep from the FNAF *structure*: fixed POV, nights with a clock, a few switchable views, diegetic UI, sound as the main alarm channel.
What we never take: names, characters, art, sounds, the camera-map tablet flip-up, door/light button panels, power meters, a 6 AM chime, or a phone-guy soundalike. (See §7.)

Tonal references: *Papers, Please* (desk loop, documents as gameplay), *VA-11 Hall-A* (job sim about people), *Not For Broadcast* (CRT plus time pressure without horror), *Overcooked* (ticket readability only).

## 2. Palette (CSS tokens in `src/index.css` `@theme`)

| Token | Hex | Role |
|---|---|---|
| `--color-night` | `#0E1012` | Deepest shadows, letterbox |
| `--color-steel` | `#3A3F44` | Stainless, hood, shelving, panels |
| `--color-tile` | `#8FA39A` | Fluorescent wall tile (green-grey cast) |
| `--color-amber` | `#E8A33D` | Heat lamps, food ready. The **good** colour |
| `--color-paper` | `#F2EFE6` | Ticket paper. The **only** near-white on screen |
| `--color-ink` | `#2B2B2E` | Ticket text (never pure black) |
| `--color-phosphor` | `#8FD19E` | In-world monitor text (summary screen, clock) |
| `--color-rush` | `#C8423B` | Late, 86'd, danger. Appears **only** when something is wrong |

## 3. Typography

| Use | Font | License | Phase |
|---|---|---|---|
| Ticket body (impact look) | **Courier Prime** | SIL OFL 1.1 | 4 |
| Ticket alt / thermal FOH | IBM Plex Mono | SIL OFL 1.1 | 4 (optional) |
| Clock, summary "monitor" UI | **VT323** | SIL OFL 1.1 | 4 |
| Night title cards | Press Start 2P (sparingly) | SIL OFL 1.1 | 4 |
| Grey-box (Ph 1–3) | `ui-monospace, Menlo, monospace` | system | 1 |

Avoid **Merchant Copy** (personal-use) and skip **Fake Receipt** (its licence history conflicts; D-016). Self-host WOFF2 subset to Latin, and keep every `OFL.txt` in `public/assets/fonts/`.

## 4. The ticket (the hero object)

- **Width:** fixed, 32–42 characters per line (≈288 px at 1×), monospace, ALL CAPS.
- **Layout** (generic conventions only, never a vendor's layout):
  ```
  ********************************
  TABLE 12             6:04 PM
  SERVER: MAYA          2 GUESTS
  ********************************
  ENTREE
  S1  HOUSE BURGER
        MEDIUM
        *** NO ONION ***
  ********************************
  ORDER #1042
  ```
- **Paper:** `--color-paper` with a 1–3% darker vertical gradient at the edges and a 4–6% fibre texture. **Ink:** `--color-ink`, `text-shadow: 0 0 0.4px`, per-line opacity 0.85–1.0, and 1 px horizontal jitter per line (impact misregistration).
- **Curl:** `perspective: 600px`, `rotateX(4deg)` on the free end, gradient shadow band. Animate only `transform`.
- **Tear:** zigzag `clip-path` bottom with random 2–4 px teeth, regenerated per ticket.
- **Print-in (Phase 4):** grows out of an `overflow:hidden` slot **line by line** (stepped `translateY`), driven by audio clock time (`Howler.ctx.currentTime`), not `setTimeout`. Sound is printer **start → loop × lines → end**, then **tear**. A 22-line party ticket should *chatter*.
- **Emphasis:** emphasized mods and allergies print as `*** NO BUTTER ***`. Allergy banners sit at the top under the header. `--color-rush` appears on paper **only** as a late stamp or an 86 strike, never as decoration.
- **Ticket age in grey-box:** a thin bar under the ticket goes amber, then rush red. In Phase 4 this becomes a diegetic cue (a clip colour or a ticket shifting on the rail). Decided during the feel pass.

## 5. Visual pipeline (Phase 4)

1. Scene renders at an internal **960×540** (16:9), letterboxed in `--color-night`, upscaled with `image-rendering: pixelated`. No reflow for portrait; show a "rotate device" card instead.
2. **Backgrounds:** pre-rendered stills per view (Blender with baked lighting is the recommended source; art is an open question for the owner). AVIF with WebP fallback, 80–200 KB each. State overlays (plates, lamp glow, person in doorway) are tight-cropped WebP with alpha, 5–40 KB.
3. **One WebGL post-process pass** over the scene: grain (12–24 fps, 3–6%), vignette (corners ~25% darker). Chromatic offset of 0.5–1 px and scanlines (1 px every 2–3 px at 8–12%) apply **only** to in-world monitors and title cards. Cap the post pass at 30 fps.
4. **Fluorescent flicker:** 40–120 ms brightness dips of 3–8%, every 8–30 s. Never a strobe.
5. **Never:** animated `backdrop-filter`, full-screen `mix-blend-mode`, animated SVG `feTurbulence`, or per-pixel Canvas 2D noise. Bake textures; animate only `transform` and `opacity`.
6. **View switch:** ~150 ms whip blur or a "blip". Looking away is the tension mechanic.
7. **Accessibility:** a "Reduce flicker & grain" toggle; respect `prefers-reduced-motion` (no flicker, no whip, instant print-in).

### UI framing rules
- Everything diegetic: rail, printer, window, clipboard, door. The only floating HUD is the **clock** and the **Service Health** strip (GDD D-013).
- Text is printed or displayed, never hovering. Instructions arrive on tickets, a manager's sticky note, or the summary monitor.

## 6. Audio

### Format and engine
- **Howler 2.2.4**, one global `AudioManager` outside React. SFX go in **one sprite**: Opus-in-WebM (48–64 kbps mono, 48 kHz) plus an AAC `.m4a` fallback (`src: ['sprite.webm','sprite.m4a']`). **No MP3 for loops** (encoder padding clicks).
- **Ambience beds:** separate short loops (20–40 s). Hood and room tone are mono; dining murmur is stereo. Use Opus with an AAC fallback.
- Barks are mono Opus at 32–48 kbps. Randomize the take, never repeat a take back-to-back, and add ±2–4% pitch.
- **Memory:** decoded audio is float32. The whole decoded set must stay under ~30–40 MB.
- **Unlock and preload:** the "Clock In" button resumes the AudioContext and gates decoding. Never decode mid-rush.
- **Mix:** SFX normalized to about −1 dBFS and beds to about −18 to −20 dBFS. Barks are buried and distant ("from across the line"), not narrator-close.
- **Budget:** SFX sprite + 2 beds ≤ 800 KB. Total initial load ≤ 2.25 MB.

### MVP sound list

| # | Sound id(s) | Triggered by | Final source (Phase 4) | Licence |
|---|---|---|---|---|
| 1 | `print_start`, `print_loop`, `print_end` | `ticketPrinted` | Own recording of an impact printer (preferred), or Pixabay "old dot-matrix printer" (freesound_community) | Own / Pixabay CL |
| 2 | `tear` | ticket hangs on the rail | Freesound 392616 "Tearing paper" (CC0) or BigSoundBank "Torn Paper #1" (CC0) | CC0 |
| 3 | `amb_hood` (loop) | shift running | Freesound 214354 (edhutschek) + 205165 (justingregoire) layered | CC0 (verify badges) |
| 4 | `plate_1..4` | `plateUp`, `courseSent` | Freesound OwlStorm Kitchen Clatter 209007/209008/209009/209014, ±3% pitch | CC0 (verify) |
| 5 | `amb_dining` (loop) | FLOOR view (louder) / PASS (muffled) | Freesound 236931 (magnesium1) | CC0 |
| 6 | `bell` | `plateUp` (order up) | Freesound 173932 "Ding Ding Small Bell" (CC0) or Pixabay "Restaurant Bell" | CC0 / Pixabay CL |
| 7 | `ui_click`, `ui_confirm`, `ui_error`, `view_blip` | UI, `commandRejected`, view switch | Kenney UI Audio + Interface Sounds | CC0 |
| 8 | `foley_*` (pans, sizzle) | ambience variety | Sonniss GDC bundles (curate) | Sonniss GDC licence |
| 9 | `bark_*` | `bark`, `interruptArrived` | Owner + friends recording (see below); Kokoro-82M TTS for scratch only | Own / Apache-2.0 |

**Do not use:** HelterSkelter1114 "Restaurant kitchen ambience" (CC BY-NC), BBC Sound Effects (RemArc, non-commercial), any CC BY-NC sounds, OpenGameArt CC-BY-SA or GPL, DataJuggler "Crowd Murmur" (AI, unclear terms), XTTS v2, or F5-TTS weights.

**Bark list** (1–3 words, 4–6 takes each): "Behind!", "Corner!", "Hands!", "Heard!", "Walking in!", "Ordering!", "86 salmon!", "Where's my fire on 12?", "Dragging!", "Refire on the fly!", "Where's my {n}?".

Every asset gets a row in `docs/ASSETS.md` (file, source URL, author, licence, download date, modifications), **including CC0**. Rename any file whose name contains a brand.

### Placeholder strategy (Phases 1–3)

| Need | Placeholder | How |
|---|---|---|
| All SFX | Generated sine/square beeps | `scripts/gen-placeholder-audio.ts` writes 16-bit PCM WAVs plus a Howler sprite map to `public/assets/audio/placeholder/`. No ffmpeg, deterministic, committed. |
| Print | 880 Hz × 3 short blips | so it reads as "chatter" |
| Food up | 1320 Hz single ding | |
| Interrupt arrives (Ph 3) | 440 Hz double blip | |
| Error / rejected | 220 Hz buzz | |
| Ambience | none | silence is fine in grey-box |
| Visuals | flat Tailwind boxes in palette roles, system monospace | |

The `soundMap.ts` event→sound mapping is final from Phase 2. Phase 4 only swaps the sprite file and map, never the game code.

## 7. IP and brands (general information, not legal advice)

**Do:** fixed POV, nights with a clock, static rooms, CRT treatment on in-world screens, a pre-shift message as a device, and "inspired by late-2010s indie sims" in devlogs.
**Don't:** "Five Nights", "Freddy", "Fazbear", "FNAF" anywhere (title, tags, URL, marketing); mascots or animatronics; the tablet/camera-map flip-up; door/light buttons; power meters; ripped sprites or sounds; the 6 AM chime; a phone-guy soundalike; "FNAF but cooking" marketing.
**Brands:** never Toast, Square, Aloha, NCR, MICROS, Oracle, Epson, TM-T88, TM-U220, Star Micronics, or any other real POS/printer brand, model, logo, or trade dress. Tickets carry **no brand** in the MVP. If we add one, it's an invented name the owner USPTO-checks first (D-015).
**Recording in a real restaurant:** get the owner's permission and keep voices unintelligible.
