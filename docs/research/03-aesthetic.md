# Expo Line: Style, Sound, and IP Guide for a Lo-Fi Restaurant Expo Simulator

You can get the FNAF feel without horror. Use static, pre-rendered first-person rooms. Run them through one cheap WebGL post-process pass (scanlines, grain, vignette, slight flicker). Build the ticket as a DOM element whose print-in is timed to an Opus audio sprite. Get almost all your audio from CC0 sources: Kenney, Freesound filtered to CC0, the Sonniss GDC bundles, or your own phone recordings. Keep every FNAF name, character, and UI layout out of the game, and print invented POS and printer brands on your tickets.

## TL;DR

- **Look:** The FNAF feel comes from five things: a fixed POV, pre-rendered stills, a limited palette, monitor framing, and sound that does the work the visuals don't. All five carry over to a kitchen. What you drop is darkness-as-threat and the jumpscare. Render low (640x360 or 960x540), upscale with `image-rendering: pixelated`, and do every CRT effect in one WebGL fragment shader or with pre-baked overlays. Never animate `backdrop-filter`, and never put a full-screen `mix-blend-mode` on mobile.
- **Sound:** Safe for commercial use with no credit: Kenney (CC0), Freesound CC0 sounds, the Sonniss #GameAudioGDC bundles (royalty-free, no attribution), and Pixabay (Content License, no attribution, no standalone redistribution). Not safe: BBC Sound Effects (RemArc licence covers personal, educational, and research use only), Freesound CC BY-NC sounds, and anything from OpenGameArt under CC-BY-SA or GPL unless you're willing to open-source the game. Ship Opus (WebM or Ogg) with an AAC/M4A fallback. Ogg Opus only plays natively from Safari 18.4 onward.
- **IP:** Borrow mood and structure: shifts or "nights," a fixed desk view, monitor UI, timers. Don't take names, characters, art, sounds, or the camera-map/tablet layout. "Five Nights at Freddy's" is a registered US trademark owned by Scott Cawthon. Invent your POS and printer brands. Expressive use of real brands has some protection under the Rogers test, but that's a defense you'd raise after being sued, not permission, and it doesn't apply once a mark works as your own branding.

## Key Findings

1. **What actually makes the FNAF feel is constraint.** FNAF was built in Clickteam Fusion 2.5. Scott Cawthon told Clickteam's Indie Game Creators site that "because I used Fusion and pre-rendered images, it gave my game a unique look," and that he used 3ds Max for the graphics; movement is faked by swapping stills. The constraint is the aesthetic: you can't move, so every change in sound or light means something. A restaurant expo station is already a fixed post, which makes it a perfect fit.
2. **The ticket printer is your signature sound, and it's probably an impact printer, not thermal.** Long kitchen tickets that "chatter" are usually dot-matrix impact printers, because thermal paper darkens near a hot line. Thermal printers make a smooth whir. If your memory is the chatter, source impact or dot-matrix recordings for the kitchen printer, and use thermal only for front-of-house receipts. Star Micronics, a printer maker, says thermal paper "can darken when exposed to high temperatures" while impact paper stays readable in hot kitchens, so "many restaurants rely on impact printers"; trust your own ears from the line.
3. **Decoded audio costs memory, not just download size.** `decodeAudioData` expands files to 32-bit float PCM. One minute of 48 kHz stereo is roughly 23 MB in RAM no matter how small the Opus file is. Keep ambience loops short and mono, and put SFX in a sprite.
4. **Most of the "free" audio traps are licensing, not quality.** The single most realistic free restaurant-kitchen recording found ("Restaurant kitchen ambience.wav" by HelterSkelter1114 on Freesound) is CC BY-NC 4.0, so you can't use it in a commercial game.\[1\]
5. **Real brands are a lawsuit risk you don't need.** US courts have protected realistic depictions of real products in games under the Rogers test. In *E.S.S. Entertainment 2000 v. Rock Star Videos* (9th Cir. 2008), the Pig Pen strip club in *GTA: San Andreas* was protected. In *AM General v. Activision Blizzard* (S.D.N.Y. 2020), Judge George Daniels granted Activision summary judgment over Humvees in *Call of Duty*, writing that "if realism is an artistic goal," real military vehicles "undoubtedly further" it. But in *Electronic Arts v. Textron* (N.D. Cal. 2012), Judge William Alsup refused to dismiss Bell/Textron's claims over helicopters in *Battlefield 3*, finding it "plausible that consumers could think Textron provided expertise and knowledge to the game"; the parties settled in 2013. In *Jack Daniel's v. VIP Products* (2023), the Supreme Court held that Rogers doesn't apply when a mark is used as a source identifier.\[2\]\[3\] A fake POS brand costs you nothing.

## 1. Visual Language

### What creates the FNAF feel, and what translates

| Element | What it does in FNAF | Keep for a restaurant? | How to translate |
|---|---|---|---|
| Fixed camera / fixed POV | Removes agency over movement; tension comes from attention | **Yes, core** | You stand at the pass. Left/right pans to: the window (heat lamps, plates), the ticket rail, the dining room door, the printer. |
| Pre-rendered 3D stills | Dense lighting at zero runtime cost; slightly "off" CG look reads as 2014 indie | **Yes** | Low-poly Blender scenes with baked lighting, rendered to stills. State changes (plate appears, light on) are layered PNG/WebP sprites. |
| Limited, desaturated color | Mood, cohesion, hides render flaws | **Yes, shifted warm** | Fluorescent green-gray kitchen, amber heat lamps, warm-white ticket paper as the brightest thing on screen. |
| Darkness as threat | Horror engine | **No** | Replace with *busyness* as threat: ticket rail filling up, plates dying under the lamp, timers going red. |
| Scanlines, static, flicker | "You are looking through a cheap camera/monitor" | **Partially** | Put CRT treatment *only* on in-world screens (KDS monitor, dining room camera feed, end-of-shift report). Use subtle grain and occasional fluorescent flicker on the main view. |
| UI framing (monitor, tablet flip-up) | Diegetic UI; info costs time | **Yes, but your own** | Diegetic ticket rail, a bump-bar KDS screen, a clipboard for 86'd items. Never a flip-up tablet with a room map. |
| Night/shift structure + clock | Progression and dread of the clock | **Yes** | "Shifts": Lunch, Friday Dinner, Brunch, Mother's Day. A clock running from 5:00 PM to close. |
| Sound as primary channel | Footsteps, breathing, the fan | **Yes, core** | The printer starting is your "something is coming." Hood fans are your bed. A "BEHIND!" is your audio jolt. |

### Reference games beyond FNAF

- **Papers, Please (2013):** single-desk station loop, documents as gameplay, muted palette, stamp *thunk* as the satisfying action. Closest structural match to expo.
- **VA-11 Hall-A (2016):** fixed-POV bartending sim, late-2010s indie mood, a job sim that's about people. Strong tonal reference.
- **Not For Broadcast (2020):** a non-horror job sim built around CRT monitors and time pressure. Proves the monitor look works without fear.
- **Do Not Feed the Monkeys (2018):** camera-feed monitoring that isn't horror.
- **Cook, Serve, Delicious! series:** real ticket-management pressure. Good for systems, less for mood.
- **Overcooked (2016):** the ticket rail at the top of the screen, with timer bars draining on each order card. Steal the *readability*, not the cartoon look.
- **Return of the Obra Dinn (2018):** proof that a strict palette and dither treatment becomes the identity.
- **Coffee Talk (2020) / Unpacking (2021):** cozy single-location sims. Reference for warmth and pacing between rushes.

## 2. Achieving the Look Cheaply in a Browser

### Technique ranking

| Technique | Cost | Verdict |
|---|---|---|
| Pre-rendered stills (Blender, baked lighting) | Zero runtime; only download size | **Use.** This is how FNAF did it. |
| Rendering at low internal res + `image-rendering: pixelated` upscale | Reduces fill cost; looks PS1/2010s | **Use.** 640x360 or 960x540 canvas scaled to viewport. |
| Pre-baked tiling noise PNG/WebP, animated via `transform`/`opacity` only | Compositor-only, near free | **Use** for grain. Shift background-position by steps, or swap 3 to 4 noise frames. |
| Static CSS `filter` (contrast, sepia, saturate) on a still | Cheap if not animated | **Use** sparingly; Smashing Magazine's tests put CSS filter render around 12.9 ms and paint around 4.3 ms on an image, similar to blend modes.\[4\] |
| Single-pass WebGL fragment shader (scanlines, vignette, barrel, chroma offset, grain) | One full-screen pass on GPU; cheap on any device made after 2016 | **Use** as your one "CRT" layer. Libraries are optional; a 40-line shader is enough. |
| `mix-blend-mode` on large/full-screen layers | Extra compositing; full-screen blends can drop below 60 fps on older mobile GPUs\[5\] | **Avoid full-screen.** Fine on small elements. |
| `backdrop-filter` | Snapshots and re-filters what's behind the element; transitioning blur reruns every frame and scales with area\[6\] | **Avoid animating.** Never on the main view. |
| Animated SVG `feTurbulence` noise | Re-rasterized on change; expensive | **Avoid animating.** Bake it to a PNG once. |
| Canvas 2D per-pixel noise every frame at full res | CPU `getImageData`/`putImageData` per frame | **Avoid.** Use the shader or baked frames. |
| AI-generated backgrounds | Free-ish, fast | **Use as a base only**, then paint over or re-render. Purely AI-generated imagery may not be copyrightable in the US, and generators drift in perspective between rooms. Consistency across 6 to 10 static views is easier in Blender. |

**Rule:** one shader pass, baked everything else, no animated filters on large surfaces. Cap the post-process at 30 fps if you want even more "low-fi"; flicker reads better choppy.

## 3. The Printed Ticket in Code

### Construction (DOM, not canvas)

- **Width:** kitchen printers use 80 mm or 58 mm paper. Model the ticket at a fixed width (for example 288 px at 1x) and render text in a monospace face at a size that gives 32 to 42 characters per line, matching real Font A/Font B line lengths.
- **Paper:** background `#F2EFE6`, a faint vertical linear-gradient (1 to 3% darker at edges), plus a tiny tiling paper-fiber texture at 4 to 6% opacity.
- **Ink:** thermal print is never pure black. Use `#2B2B2E`, add `text-shadow: 0 0 0.4px` for slight bleed, and randomize per-line opacity between 0.85 and 1.0 so it looks like uneven head heat. For impact-printer kitchen tickets, use a dot-matrix face and slightly misregistered lines (1 px horizontal jitter per line).
- **Curl:** wrap the ticket in a container with `perspective: 600px`. Apply `transform: rotateX(4deg)` to the bottom portion plus a gradient shadow band near the free end. The paper curls toward the printer side because it came off a roll. Animate the curl only with `transform`.
- **Tear:** a zigzag bottom edge via `clip-path: polygon(...)` generated in JS with randomized tooth heights (2 to 4 px), regenerated per ticket so no two tears match. On tear, split the element, rotate the torn piece 2 to 6 degrees, and drop the stub.
- **Print-in animation:** the ticket grows out of a slot element with `overflow: hidden`. Reveal line by line (`translateY` in steps), not smoothly; real printers advance in line feeds. Drive the reveal from `AudioContext.currentTime`, not `setTimeout`, so visuals stay locked to sound.
- **Sound sync pattern:** structure the printer audio as three sprite regions: **print-start**, a seamless **print-loop** (looped for as many lines as the ticket has), and **print-end/feed**, followed by a separate **tear**. This is the same structure commercial receipt-printer packs use (print, loop, loop end, tear).\[7\] A 4-item ticket and a 22-item party ticket then both sound right, and the long ticket gives you the "long ticket chattering out" moment for free.

### Fonts for tickets and UI

| Font | Use | License | Notes |
|---|---|---|---|
| **VT323** (Peter Hull) | KDS screen, CRT UI, clock | SIL OFL 1.1 | Built from DEC VT320 terminal glyphs; on Google Fonts.\[8\] |
| **Fake Receipt** (Ray Larabie / Typodermic) | Ticket header, totals | CC0 in current readme; **conflicting** older listings | Recent readme text says CC0 ("Whatever you want to do with these fonts, the answer will be yes"), but older versions shipped with a desktop-only license that excluded web embedding.\[9\]\[10\]\[11\]\[12\] Download the current version and keep the readme with your project. Caps-only.\[13\] |
| **IBM Plex Mono** | Ticket body (thermal look) | SIL OFL 1.1 | Clean monospace; add bleed via text-shadow. Verify the OFL.txt in the download. |
| **Courier Prime** | Ticket body (impact look) | SIL OFL 1.1 | Typewriter feel suits impact printers. Verify the OFL.txt in the download. |
| **Press Start 2P** | Shift title cards | SIL OFL 1.1 | Use sparingly; it's very recognizable. |
| ~~Merchant Copy~~ | Avoid | Personal-use listings | Popular receipt font, but listed as personal use on several sites.\[14\] Skip it. |

OFL lets you embed and subset fonts in a commercial web game. It forbids selling the font on its own, and renamed modifications must stay under OFL.\[15\]\[16\] Self-host the WOFF2 files and keep each font's license file in your repo.

## 4. Style Guide (Short)

### Palette

| Name | Hex | Use |
|---|---|---|
| Walk-in Night | `#0E1012` | Deepest shadows, letterbox |
| Hood Steel | `#3A3F44` | Stainless, hood, shelving |
| Fluoro Tile | `#8FA39A` | Wall tile under fluorescent light (green-gray cast) |
| Heat Lamp Amber | `#E8A33D` | Lamps, warm highlights, plates under the window |
| Ticket White | `#F2EFE6` | Paper; brightest element on screen |
| Thermal Ink | `#2B2B2E` | Ticket text |
| KDS Phosphor | `#8FD19E` | In-world monitor text |
| Rush Red | `#C8423B` | Late tickets, 86'd items, timers in danger |

Rules: Ticket White is the only near-white. Rush Red appears only when something is going wrong. Heat Lamp Amber is the "good" color (food ready).

### Filters (in order)

1. Render the scene at 960x540 (or 640x360 for a harder PS1 feel).
2. One WebGL pass: grain (animated at 12 to 24 fps, 3 to 6% strength), vignette (corners about 25% darker), mild chromatic offset (0.5 to 1 px) **only** on in-world monitors.
3. Scanlines (1 px dark line every 2 to 3 px at 8 to 12% opacity) **only** on monitors and title cards, not on the main kitchen view.
4. Fluorescent flicker: random 40 to 120 ms brightness dips of 3 to 8%, every 8 to 30 seconds. Never a strobe.
5. Upscale with `image-rendering: pixelated`.

### UI framing rules

- Everything diegetic: the rail, the printer, the KDS screen, the clipboard. No floating HUD except a small clock.
- One view at a time; switching views costs about 150 ms with a short whip-pan blur or a "monitor switch" blip. Time spent looking away is your tension mechanic.
- Text is printed or displayed, never hovering. Instructions come on tickets, a manager's sticky note, or the KDS.
- Fixed 16:9 frame with letterboxing; don't reflow the scene for portrait phones. Show a "rotate device" card instead.
- Accessibility: provide a "reduce flicker/grain" toggle and respect `prefers-reduced-motion`.

### 3 to 5 references per element

| Element | References |
|---|---|
| Palette | Papers, Please (muted ochres and grays); Return of the Obra Dinn (strict palette as identity); VA-11 Hall-A (warm neon against dark); FNAF 1 office (green-gray fluorescent cast) |
| Fonts/type | DEC VT320 terminal (VT323 source); real kitchen impact tickets (photograph your own); Not For Broadcast screen text; Papers, Please document type |
| Filters | FNAF camera feeds (static, scanline); Not For Broadcast CRT monitors; PS1-style indie low-res rendering; late-2010s VHS-filter indie trailers |
| UI framing | Overcooked ticket rail; Papers, Please desk; Do Not Feed the Monkeys monitor feeds; Cook, Serve, Delicious! order queue |

## 5. Audio Sourcing

### Source libraries and exact terms

| Source | License | Commercial? | Attribution? | Gotchas |
|---|---|---|---|---|
| **Kenney** (kenney.nl): UI Audio (50 files), Interface Sounds, Impact Sounds, Digital Audio | CC0 | Yes | No\[17\]\[18\] | Great for KDS beeps, clicks, UI. No kitchen ambience. |
| **Freesound** (freesound.org), filter by license "Creative Commons 0" | CC0 / CC BY 4.0 / CC BY-NC 4.0 per sound | CC0 and CC BY: yes. **CC BY-NC: no** | CC0: no. CC BY: yes | License is per sound; check the badge on each page at download and log it. The site generates an attribution list for your downloads.\[19\] |
| **Sonniss #GameAudioGDC bundles** (gdc.sonniss.com) | Sonniss GDC bundle license (v2.0 effective 27 August 2026)\[20\] | Yes | No | "Use and modify ... for personal and commercial projects without attribution." Can't resell the sounds standalone. AI/ML training prohibited. The 2026 bundle is 7.47 GB / 347 WAV files; past bundles total over 200 GB.\[20\]\[21\]\[22\] |
| **Pixabay** (pixabay.com/sound-effects) | Pixabay Content License | Yes | No | No standalone redistribution. Pixabay disclaims rights in trademarks, identifiable people, or "audio samples" inside content.\[23\]\[24\] Many uploads are re-hosted Freesound CC0 files ("freesound_community").\[25\] |
| **OpenGameArt** | CC0, CC-BY, OGA-BY, CC-BY-SA, GPL | All allow commercial use | BY/SA/GPL: yes | **CC-BY-SA and GPL are share-alike.** OGA's own FAQ advises closed-source commercial devs to seek legal counsel before using them.\[26\]\[27\] Filter to CC0, CC-BY, or OGA-BY. |
| **BBC Sound Effects** | RemArc Licence | **No** | n/a | Personal, educational, or research use only. Commercial use requires a paid license.\[28\]\[29\] **Not safe.** |
| **BigSoundBank** | CC0 (per page) | Yes | No | Small but clean library. |

### MVP sound list

| # | Sound | Primary pick | License | Backup / note |
|---|---|---|---|---|
| 1 | Kitchen ticket printer (chatter) | Record your own impact printer, or Pixabay "old dot-matrix printer" (freesound_community) | Pixabay Content License | Pixabay "082499_Thermal Receipt Print & Cut" for a thermal version. Cut into start / loop / end. Rename files that carry brand names. |
| 2 | Ticket tear | Freesound "Tearing paper" by Poligonstudio (freesound.org/people/ScreamStudio/sounds/392616/) | CC0\[30\] | BigSoundBank "Torn Paper #1" by Joseph Sardin, CC0.\[31\] Avoid blouhond "PAPER TEAR variations" (CC BY-NC).\[32\] |
| 3 | Hood fan bed | Freesound "Operate the extractor hood" by edhutschek (sounds/214354) | CC0 (verify badge)\[33\] | Domestic hood; trim the steady middle into a 20 to 30 s loop. Layer under "KITCHEN_AMBIENCE_ROOMTONE_01.wav" by justingregoire (sounds/205165), CC0.\[34\] No free commercial-kitchen hood loop was found; record one if you can. |
| 4 | Plates hitting the window | Freesound OwlStorm "Kitchen Clatter" pack: Dinner Plate Impact 1 (209007), Impact 2 (209008), Kitchen Dish Clank (209009), Ceramic Tink (209014)\[35\] | CC0 (uploader states all sounds are CC0; verify badge)\[36\] | Pitch-randomize ±3% and vary volume so repeats don't stack. |
| 5 | Dining room murmur | Freesound "Hip Mediterranean Restaurant Ambience" by magnesium1 (sounds/236931) | CC0\[37\] | SpliceSound "Crowd Murmur" pack (small/medium/large group);\[38\] license unconfirmed, check. "Restaurant Crowd Walla" by Cell31_Sound_Productions is CC BY 4.0 (credit required).\[39\] |
| 6 | Service / order-up bell | Pixabay "Restaurant Bell" by Diego25 | Pixabay Content License\[40\] | Freesound "Ding Ding Small Bell" by JohnsonBrandEditing (173932), CC0; trim.\[41\] Natty23 "Bell Ding" is CC BY 4.0.\[42\] |
| 7 | KDS beeps, bump-bar clicks, UI | Kenney UI Audio + Interface Sounds | CC0 | |
| 8 | Heavier kitchen foley (pans, drawers, sizzle) | Sonniss GDC bundles (search the track lists for "kitchen," "restaurant," "foley") | Sonniss GDC license | Big downloads; grab once, curate. |
| 9 | Voice barks | Your own voice or friends (see section 6) | Yours | Kokoro TTS for placeholders. |

**Do not use:** "Restaurant kitchen ambience.wav" by HelterSkelter1114 (CC BY-NC 4.0), anything from BBC Sound Effects, AI-generated "free SFX" sites without clear terms, and "Crowd Murmur" by DataJuggler (AI-generated, license not visible).\[43\]

### Recording your own with a phone

The best kitchen sounds will be the ones you record. You know which printer, which fan, which plates.

- **Permission:** get the owner's OK before recording in a working restaurant. Keep voices in walla unintelligible so no identifiable person ends up in your game.
- **Phone setup:** airplane mode (no notification pings or radio interference). Use the highest-quality or lossless setting your recorder offers, saving WAV or ALAC rather than compressed AAC where possible. Turn off any "enhance" or noise-suppression option, since it pumps on fans.
- **Levels:** peaks around −12 to −6 dB, leaving headroom for slams.\[44\]
- **Technique:** hold the phone still 30 to 60 cm from the source, not pointed at the hood. Record 10 seconds of room tone before every take. Record the printer with long and short tickets so you get natural start/stop.
- **Cleanup in Audacity (free):** select room tone → Effect → Noise Reduction → Get Noise Profile → select all → apply. Audacity's manual lists the defaults as 6 dB reduction (range 0 to 48), Sensitivity 6, and the Audacity team suggests starting at 12 dB / 6 / 3 smoothing.\[45\]\[46\] Raise in small steps; too much gives the "underwater" sound.\[47\]\[48\] **Don't denoise the hood fan bed:** the fan is the content.
- **Then:** high-pass at 60 to 80 Hz (cuts handling rumble), trim silence, short fades (5 to 10 ms) to kill clicks, normalize SFX to about −1 dBFS and beds to about −18 to −20 dBFS so they sit under everything. Export 48 kHz WAV masters, then encode (see section 8).

## 6. Voice Barks

**What sounds less cheesy:**
- **Real humans, short, imperfect.** Barks of 1 to 3 words: "Behind!", "Corner!", "Hands!", "Heard!", "Walking in!", "Ordering!", "86 the salmon!", "Where's my fire on 12?". Record 4 to 6 takes of each, with different energy and distance. Distance from the mic sells it more than acting does.
- **Bury them in the mix.** Barks should sound like they come from across the line, not like a narrator.
- **Never repeat the same take back to back.** Randomize take selection plus ±2 to 4% pitch.

**Processing chain for your own voice (Audacity, free):** high-pass 120 Hz → EQ dip around 200 to 300 Hz (removes the "bedroom" boxiness) → light compression (Audacity's voice starting point: threshold −18 dB, ratio 4:1)\[44\] → short room reverb (small, under 0.6 s) → mix in kitchen room tone underneath → for anything coming through an intercom or headset, band-pass to roughly 300 to 3,400 Hz (telephone bandwidth).\[48\]

**TTS options:**

| Tool | License | Verdict |
|---|---|---|
| **Kokoro-82M** (hexgrad) | Apache 2.0 | Best free commercial-safe option. 54 voices, 8 languages, runs on CPU or even in-browser. No cloning.\[49\] Good for placeholders and calm lines (manager notes, PA).\[50\] |
| **Piper** | Original MIT; the active fork is GPL-3.0; individual voice models vary (some CC-BY) | Usable, robotic. Check each voice's model card before shipping.\[51\]\[52\] |
| **XTTS v2 (Coqui)** | Coqui Public Model License | **Not commercial-safe.** Avoid.\[50\] |
| **F5-TTS weights** | CC-BY-NC | **Not commercial-safe.** Avoid.\[50\] |

**Blunt take:** TTS can't shout. "BEHIND!" from TTS sounds like a GPS unit. Use TTS only for scratch audio and maybe a deadpan manager voicemail, which, if you lean into it, makes a legitimately FNAF-adjacent structural nod (a pre-shift message) without copying anything. Record yourself and two friends for the barks. Never clone a real person's voice without written consent.

## 7. IP Boundaries (General Information, Not Legal Advice)

You're not a lawyer and neither is this report. For anything you plan to sell or crowdfund, a one-hour consult with a trademark/IP attorney is cheap insurance.

**Background facts:** Scott Cawthon owns US trademark registrations for FIVE NIGHTS AT FREDDY'S (Reg. No. 4,755,325 and Reg. No. 4,855,473, the latter covering computer game software).\[53\] ScottGames, LLC enforces these marks. Fan games exist at the rights holder's discretion; the Fazbear Fanverse program is an official license for select fan games, not a general permission.\[54\]

### FNAF: do / don't

| Do (ideas, structure, genre conventions) | Don't (expression, marks, assets) |
|---|---|
| Fixed first-person POV at one station | Any FNAF names: "Five Nights," "Freddy," "Fazbear," character names, "FNAF" in title, tags, URL, or logo |
| Shift/night progression with a clock (e.g., 5 PM to close) | Animatronics or mascot characters that resemble theirs |
| Static rooms, pre-rendered 3D look | The camera-map tablet flip-up layout, door/light button panel, battery/power meter presentation |
| Monitor/CRT treatment, static, flicker | Ripped sprites, static overlays, or sounds (the Spriters Resource hosts FNAF rips; using them is copyright infringement)\[55\]\[56\] |
| Pre-shift voicemail as a storytelling device | A "phone guy" soundalike, the 6 AM chime, the jumpscare scream, or the FNAF music box tune |
| Saying "inspired by late-2010s indie sims" in a devlog | Marketing it as "FNAF but cooking" in the store title, capsule art, or ads |

### POS and printer brands: do / don't

| Do | Don't |
|---|---|
| Invent brands (e.g., a POS called "LINEWAVE" printing "LW-80" on the ticket footer); search USPTO's trademark database for your invented name before committing | Print "Toast," "Square," "Aloha," "NCR," "MICROS," "Oracle," "Epson," "TM-T88," "TM-U220," or "Star Micronics" on tickets, the printer model, or UI |
| Copy *generic* ticket conventions: table/seat numbers, server name, check #, timestamps, mods in caps, "*** RUSH ***", "SEND FIRST" | Recreate a specific vendor's ticket layout, logo, or KDS screen design pixel for pixel |
| Model the printer as a generic beige/black box | Model a recognizable trade dress (a specific Epson or Star chassis) with its badge |
| Rename audio files that carry brand names (e.g., "057941_epson receipt printer5") | Market the game with any real POS/printer brand ("powered by," "featuring") |

**Why bother:** Courts have let games depict real marks under the Rogers test (artistic relevance and not explicitly misleading).\[57\]\[58\] Rockstar won over the Pig Pen strip club in *E.S.S. Entertainment 2000 v. Rock Star Videos* (9th Cir. 2008), and Activision won summary judgment over the Humvee in *AM General v. Activision Blizzard* (S.D.N.Y. 2020). But in *Electronic Arts v. Textron* (N.D. Cal. 2012), Judge William Alsup let Bell/Textron's helicopter claims over *Battlefield 3* survive a motion to dismiss because consumers could plausibly think Textron "provided expertise and knowledge to the game"; the case settled in 2013. *Jack Daniel's v. VIP Products* (2023) made Rogers unavailable whenever the mark functions as your own source identifier.\[59\] Winning a Rogers defense still means being sued. Fake brands are also funnier and become part of your world.

## 8. Formats, Sizes, and Payload Budget

### Audio

| Item | Format | Settings | Why |
|---|---|---|---|
| SFX sprite (printer start/loop/end, tear, plates, bell, UI) | **Opus in WebM** (`.webm`) primary + **AAC in M4A** fallback | Opus 48 to 64 kbps mono, 48 kHz | One file, one decode, sample-accurate offsets. |
| Ambience beds (hood, roomtone, dining murmur) | Opus in WebM/Ogg + AAC fallback | 64 to 96 kbps; **mono for hood/roomtone**, stereo only for dining murmur; 20 to 40 s seamless loops | Keeps decoded RAM sane. |
| Voice barks | Opus mono | 32 to 48 kbps | Speech is Opus's strength. |
| Music (if any) | Stream via HTML5 audio (howler `html5: true`) | Opus 96 kbps or AAC 128 kbps | Avoids decoding minutes of PCM into memory. |
| Masters | WAV 48 kHz / 24-bit | Keep in repo (Git LFS) or cloud, never ship | |

**Compatibility notes:**
- **Safari/iOS:** Safari 18.4 (macOS 15.4, iOS/iPadOS 18.4, March 2025) added Ogg container playback for Opus and Vorbis. Before that, Safari couldn't play Ogg at all, and roughly iOS 15.4 to 17.3 refused WebM-with-Opus through media elements.\[60\]\[61\] By October 2026 most iPhones are past 18.4, but ship the AAC fallback anyway. Howler's `src: ['sfx.webm', 'sfx.m4a']` picks the first playable format.
- **MP3:** universally supported but adds encoder padding at the start, which makes loops click. Don't use MP3 for loops. Opus/AAC with Web Audio `loopStart`/`loopEnd` is cleaner.
- **Decode cost:** a measured benchmark on an iPadOS 17 iPad decoded one minute of stereo 160 kbps Opus in 336 ms with Safari's native WebM decoder, versus 398 ms with a WebAssembly decoder in a worker.\[62\] Decode at load time behind your "Clock In" screen, never mid-rush.
- **Memory:** decoded audio is 32-bit float, so bytes = seconds × sample rate × channels × 4. One minute at 48 kHz stereo ≈ 23 MB. Your whole decoded SFX set should stay under about 30 to 40 MB total for mobile safety.
- **Unlock:** browsers (iOS especially) start `AudioContext` suspended. Make the "Clock In" button call `ctx.resume()` (howler auto-attempts unlock). That button is also your preload gate.
- **Library:** **howler.js** (about 7 KB gzipped, MIT, defaults to Web Audio with HTML5 fallback, built-in sprites) is the pragmatic choice.\[63\]\[64\] Raw Web Audio is fine if you want control; you'll need a scheduler anyway for printer/ticket sync.
- **Latency:** Web Audio buffer sources start within a few ms once decoded. HTML5 audio elements don't, so never use HTML5 audio for the printer or plate hits.

### Images

| Asset | Format | Size target |
|---|---|---|
| Room backgrounds (pre-rendered stills) | **AVIF** primary with **WebP** fallback via `<picture>` or CSS `image-set()` | 1920x1080 max master; ship 1280x720 (or exactly your internal render res x2). Aim for 80 to 200 KB each. |
| State overlays (lamp on, plate present, person in doorway) | WebP with alpha (AVIF alpha also works) | Crop tight to the changed region, not full-frame. 5 to 40 KB each. |
| Ticket paper texture, noise frames | WebP or PNG, small tiling (256x256) | Under 20 KB each; 3 to 4 noise frames. |
| Fonts | WOFF2, subset to Latin | 15 to 40 KB each. |

AVIF usually beats WebP on size at matched quality for photographic, noisy renders like yours, but encodes slower and decodes somewhat slower. For a dozen backgrounds that's irrelevant. Bake grain *into* nothing: keep backgrounds clean and add grain in the shader, because noise destroys compression.

### Payload budget (initial load, before "Clock In" completes)

| Bucket | Budget |
|---|---|
| JS (game + howler) | ≤ 150 KB gzipped |
| Fonts | ≤ 80 KB |
| First shift's rooms + overlays | ≤ 1.2 MB |
| SFX sprite + 2 ambience beds | ≤ 800 KB |
| **Total** | **≤ 2.25 MB**, playable on 4G in a few seconds |

Lazy-load later shifts' art and barks in the background during play. On Vercel, set long-cache immutable headers on hashed asset filenames.

## Recommendations (Order of Work)

1. **Record first.** Go to a kitchen with your phone this week: printer (long and short tickets), hood, plates on the pass, tear, room tone. It's your highest-value, most original asset, and it decides the impact-vs-thermal question.
2. Download Kenney UI Audio and Interface Sounds, the OwlStorm plate pack, magnesium1's restaurant ambience, and Poligonstudio's paper tear. Log each license in a `CREDITS.md` with URL, author, license, and download date, even for CC0.
3. Block out 4 views in Blender (pass, rail, printer, dining door), bake lighting, render at 960x540.
4. Build the ticket component with the start/loop/end/tear sprite and `currentTime`-driven reveal before anything else. If printing a 20-item ticket feels good, the game works.
5. Add the single WebGL post pass last, with a reduce-effects toggle.
6. Pick and USPTO-check your fake POS/printer brand names before they end up in art.

## Caveats

- **License checks:** several Freesound licenses above were read from search-result text, not a fully loaded page (edhutschek hood, OwlStorm plates, SpliceSound murmur). Confirm the badge on each page at download time. Freesound licenses are per sound and can't be assumed per pack.
- **Fake Receipt font:** listings conflict between CC0 (current readme) and a desktop-only license (older versions). Use the current download and keep its readme, or use an OFL monospace instead.
- **Piper voices:** licensing differs per voice model. Don't assume MIT.
- **Sonniss terms:** Sonniss states the governing license is always the one currently published at sonniss.com/gdc-bundle-license; re-read it when you download a bundle.\[20\]
- **Impact-vs-thermal claim:** this rests on Star Micronics' statement that "many restaurants rely on impact printers" because thermal paper darkens in kitchen heat. That's a printer vendor talking, not market-share data.
- **Image size targets** are working estimates, not benchmarks; measure your own renders with Squoosh or `avifenc`.
- **AI-generated art:** copyrightability and generator terms of service vary and are evolving; treat AI images as reference or base layers you substantially rework.
- **IP:** this is general information about US law as of October 2026, not legal advice. Trademark law varies by country, and the Rogers test's scope narrowed after *Jack Daniel's v. VIP Products* (2023).

## Sources

1. [Freesound - Restaurant kitchen ambience.wav by HelterSkelter1114](https://freesound.org/people/HelterSkelter1114/sounds/409035/)
2. [Jack Daniel%27s Properties, Inc. v. VIP Products LLC](https://en.wikipedia.org/wiki/Jack_Daniel%27s_Properties,_Inc._v._VIP_Products_LLC)
3. [A Win for Trademark Owners: The Supreme Court’s Ruling in Jack Daniel’s Properties Inc. v. VIP Products](https://www.morganlewis.com/pubs/2023/06/a-win-for-trademark-owners-the-supreme-courts-ruling-in-jack-daniels-properties-inc-v-vip-products)
4. [Web Image Effects Performance Showdown — Smashing Magazine](https://www.smashingmagazine.com/2016/05/web-image-effects-performance-showdown/)
5. [CSS mix-blend-mode: Blend Text, Images & Colors Like Photoshop — W3Tweaks](https://www.w3tweaks.com/css/css-mix-blend-mode-explained/)
6. [Backdrop Filter Transitions and Their Cost — Free CSS Code & Live Demo](https://codefronts.com/motion/css-transition-designs/glassmorphism-hover-transition/)
7. [Receipt Printer, Sound](https://audiojungle.net/item/receipt-printer/12254663)
8. [VT323 Font](https://fontpair.co/fonts/google/vt323)
9. [Fake Receipt Font Download - Fonts4Free](https://www.fonts4free.net/fake-receipt-font.html)
10. [Fake Receipt Font Free Download - FontMagic](https://www.fontmagic.com/fake-receipt.font)
11. [Fake Receipt Font](https://www.dafont.com/fake-receipt.font)
12. [Fake Receipt Font FREE Download & Similar Fonts](https://www.fontget.com/font/fake-receipt/)
13. [Fake Receipt Font Free Download](https://resourceboy.com/fonts/fake-receipt-font/)
14. [Free Receipt Fonts (.ttf .otf)- FontsAddict](https://www.fontsaddict.com/font/search/receipt)
15. [@expo-google-fonts/vt323 - npm](https://www.npmjs.com/@expo-google-fonts/vt323)
16. [SIL Open Font License](https://en.wikipedia.org/wiki/SIL_Open_Font_License)
17. [UI Audio · Kenney](https://kenney.nl/assets/ui-audio)
18. [Kenney CC0 Audio License Explained + Free SFX Guide](https://gtstu.com/free-sound-effects-indie-game/)
19. [Freesound](https://en.wikipedia.org/wiki/Freesound)
20. [The License](https://sonniss.com/gdc-bundle-license/)
21. [Sonniss - GDC 2023 Game Audio Bundle](https://gdc.sonniss.com/gdc-game-audio-bundle/)
22. [GDC GAME AUDIO BUNDLE 2026 - SONNISS](https://gdc.sonniss.com/)
23. [Free and high quality sound effects for video editing - Pixabay](https://pixabay.com/blog/posts/free-and-high-quality-sound-effects-for-video-edit-453/)
24. [pixabay-content - ScanCode LicenseDB](https://scancode-licensedb.aboutcode.org/pixabay-content.html)
25. [Free Thermal-Printer Sound Effects Download - Pixabay](https://pixabay.com/sound-effects/search/thermal-printer/)
26. [Site FAQ/Submission Guidelines Updates/Changes - PART 1](https://opengameart.org/forumtopic/site-faqsubmission-guidelines-updateschanges-part-1?page=1)
27. [Licensing a game](https://opengameart.org/forumtopic/licensing-a-game)
28. [You can now download over 33,000 sound effects from the BBC archive](https://djmag.com/news/you-can-now-download-over-33000-sound-effects-bbc-archive)
29. [BBC expands sound effect library to 33,000+ free samples - Electronic Groove](https://electronicgroove.com/bbc-expands-sound-effect-library-to-33000-free-samples/)
30. [Freesound - Tearing paper by Poligonstudio](https://freesound.org/people/ScreamStudio/sounds/392616/)
31. [Torn Paper #1 — Free Sound Effect Download](https://bigsoundbank.com/torn-paper-s0018.html)
32. [Freesound - PAPER TEAR variations on tearing a sheet of paper by blouhond](https://freesound.org/people/blouhond/sounds/322213/)
33. [Freesound - "Operate the extractor hood" by edhutschek](https://freesound.org/people/edhutschek/sounds/214354/)
34. [Freesound - KITCHEN\_AMBIENCE\_ROOMTONE\_01.wav by justingregoire](https://freesound.org/people/justingregoire/sounds/205165/)
35. [Freesound - Kitchen Clatter by OwlStorm](https://freesound.org/people/OwlStorm/packs/13283/)
36. [Freesound - Pots and Pans Clatter 1 by OwlStorm](https://freesound.org/people/OwlStorm/sounds/209002/)
37. [Freesound - Hip Mediterranean Restaurant Ambience by magnesium1](https://freesound.org/people/magnesium1/sounds/236931/)
38. [Freesound - Crowd Murmur by SpliceSound](https://freesound.org/people/SpliceSound/packs/15946/)
39. [Freesound - Restaurant Crowd Walla (1).wav by Cell31\_Sound\_Productions](https://freesound.org/people/Cell31_Sound_Productions/sounds/649182/)
40. [Restaurant Bell](https://pixabay.com/sound-effects/restaurant-bell-101396/)
41. [Freesound - Ding Ding Small Bell by JohnsonBrandEditing](https://freesound.org/people/JohnsonBrandEditing/sounds/173932/)
42. [Freesound - Bell Ding by Natty23](https://freesound.org/people/Natty23/sounds/411749/)
43. [Freesound - Crowd Murmur by DataJuggler](https://freesound.org/people/DataJuggler/sounds/750151/)
44. [Audacity Settings for Recording Voice Overs - The DIY Voice Over Website Template Builder - VoiceActor.com](https://voiceactor.com/articles/audacity-settings-for-recording-voice-overs)
45. [Free Noise Reduction Tool](https://www.audacityteam.org/features/noise-reduction/)
46. [Noise Reduction](https://www.audacityteam.org/manual/effects/noise-removal-and-repair/noise-reduction/)
47. [How to Remove Background Noise in Audacity (3 Steps)](https://www.buzzsprout.com/blog/remove-background-noise-audacity)
48. [How to Remove Background Noise in Audacity (Step-by-Step)](https://recapmycalls.com/audacity-noise-removal-tutorial/)
49. [Kokoro TTS Review: Hands-On With the 82M Open-Source Voice Model — VisionStory](https://www.visionstory.ai/open-source/kokoro-tts)
50. [Best Local TTS Models 2026: 8 Open-Source Voices Tested](https://localaimaster.com/blog/best-local-tts-models)
51. [Best Free TTS Voices in 2026: An Honest Ranking - Quick TTS](https://quick-tts.com/blog/best-free-tts-voices.html)
52. [Kokoro TTS Local Setup (2026): Tiny 82M Open Voice Model](https://localaimaster.com/blog/kokoro-tts-local-setup)
53. [WIPO Domain Name Decision: DCO2020-0009](https://www.wipo.int/amc/en/domains/decisions/text/2020/dco2020-0009.html)
54. [Who Owns FNAF After the Creator’s Retirement? - LegalClarity](https://legalclarity.org/who-owns-fnaf-after-the-creators-retirement/)
55. [Static - Five Nights at Freddy's - PC / Computer - The Spriters Resource](https://www.spriters-resource.com/pc_computer/fivenightsatfreddys/asset/88201/)
56. [Five Nights at Freddy's - PC / Computer - The Spriters Resource](https://www.spriters-resource.com/pc_computer/fivenightsatfreddys/)
57. [Evolving case law on the fair use of famous trademarks in video games - Lexology](https://www.lexology.com/library/detail.aspx?g=1024b3be-91b0-464f-82d9-a063fae0a8b0)
58. [Tamera H. Bennett](https://www.tbennettlaw.com/blog/2016/2/2/real-trademarks-in-virtual-game-worlds-virag-8gejm)
59. [Ninth Circuit Pulls Back Rogers Test in Light of Jack Daniels Decision - Weintraub Tobin](https://www.weintraub.com/2024/02/ninth-circuit-pulls-back-rogers-test-in-light-of-jack-daniels-decision/)
60. [MediaRecorder: Browser Support, Codecs, Limitations](https://www.testmuai.com/learning-hub/mediarecorder-browser-support/)
61. [Opus Audio Codec: Browser Support, Features, Containers](https://www.testmuai.com/learning-hub/opus-audio-codec-browser-support/)
62. [Play Ogg Opus on Safari before 18.4: a WebAssembly decoder as a fallback · Issue #185 · bricedupuy/Songverse](https://github.com/bricedupuy/Songverse/issues/185)
63. [howler.js - Modern Web Audio Javascript Library - GoldFire Studios](https://goldfirestudios.com/howler-js-modern-web-audio-javascript-library)
64. [howler.js - JavaScript audio library for the modern web](https://howlerjs.com/)
