# Deep research brief: making HANDS! a top-tier mobile game

You are a senior game designer, mobile product strategist, and researcher. Do deep, cited research and give me a concrete, prioritized plan that turns an existing working prototype into a genuinely fun, replayable mobile game. I need specifics I can build, not general game-design advice. Wherever you recommend something, tie it to the systems I already have (described below) and say what changes.

---

## 1. What the game is meant to be

**HANDS!** is a restaurant **expo** game. You stand at the pass between the kitchen and the dining room. Tickets print, you decide when each dish gets cooked ("fire"), check plates before they leave, send food out ("HANDS!"), and handle interruptions from servers, the bar, the manager and the line.

The goals, in the owner's words:
- **Super fun for anyone in the restaurant industry**: they should recognize the job, the lingo and the chaos, and want to share it.
- **Also a strategic game**, with real logistics in it (timing, station load, coursing, 86s, allergies) that reward planning, not just fast tapping.
- **Mobile-first**, matching the top tier of mobile games in feel and polish. The two touchstones:
  - **Block Blast**: instant readability, one thumb, satisfying placement, combos, "one more go".
  - **Overcooked**: readable chaos, escalating pressure, spatial play, funny failure.
- **More gamified**, with **much better visuals and CSS**, but still as accurate as more advanced sim games.

Tone: a nostalgic low-fi indie mood inspired by fixed-camera "night shift" games. No horror, and nothing from any existing franchise. No real POS or printer brands.

## 2. What exists today (be honest about it, then build on it)

**Tech**
- Browser game: React 19 + TypeScript + Vite, rendered in DOM/CSS. Zustand mirrors state; Howler.js plays audio; hosted on Vercel's free tier.
- The game logic is a **pure, deterministic simulation**: fixed 20 Hz tick, seeded RNG, replayable, no DOM. The UI and audio subscribe to events it emits. Keep this architecture unless you have strong evidence against it.
- All content (menu, modifiers, tickets, nights, interrupts, dialogue) is typed data files. Every difficulty number lives in one tuning file.
- A **headless bot player** (novice / average / expert skill presets) can run hundreds of shifts in seconds and report fail rate, health, grades, ticket times and mistakes. Use it in your validation plan.

**Moment-to-moment play**
- Tickets print onto a horizontal **rail** as text cards: table, server, seats, dishes, modifiers like `NO ONION` or `MED RARE`, allergy banners.
- **FIRE** a whole course, or tap one line to fire a single item. Three hidden stations (grill, sauté, pantry) cook on timers. Cook time = item tier + modifier deltas (well-done steak takes longer; protein on a salad takes longer).
- Plates slide onto the **pass** under heat lamps. Some plates are wrong: missing modifier, wrong side, wrong temp, wrong dish.
- **CHECK** a plate: tap it, read an "as made" card, and compare that text against the ticket by eye. Then **REFIRE** (bin it and remake it fast) or **HANDS!** (send the whole course).
- Plates **die** after about 25 s on the pass. Each course has a grace window; when a course is late it **drains health 1 point per second**.
- A second view, **the door**: servers ask "where's my 31?" (pick the true status from four options, from memory), ask to fire held mains (HEARD), and the bar and manager bring news (hold this table's food, push this table, VIP).
- Other mechanics:
  - two-course tables with **HOLD** (mains wait for the server's fire request)
  - add-on chits
  - **86s** (substitute or void the item)
  - the line dropping a plate or a station falling behind
  - **allergies** (flag to the line before firing; the plate must come back with an allergy pick)

**Structure and scoring**
- **5 nights**, 3–5 minutes each, each adding one new obligation. Scripted teaching moments plus procedural waves, with a quiet beat before the final rush.
- **One meter, Service Health (0–100)**: lose at 0. End-of-shift grade A–F, built from health, average course time, accuracy and pass control.
- **Meta-progression**: beating a night unlocks the next, and the best grade is saved. No currency, upgrades, combos, daily content, characters, or social features.

**Presentation**
- Grey-box CSS: dark kitchen palette (heat-lamp amber, ticket paper, rush red), CSS-shape people, oval plates.
- Motion: tickets print in, plates slide on and off (sent / binned / wilted / dropped), people walk to the door, flame flicker on stations.
- Audio: real recordings of a dot-matrix printer, paper tear, plate clanks, and dining-room chatter.
- **Desktop-first, mouse-driven, text-dense.** Not designed for phones yet.

**Balance today** (bot fail rates for average players): Night 1 0%, Night 2 15%, Night 3 20%, Night 4 40%, Night 5 55%. Experts clear all nights.

**My diagnosis of why it isn't fun yet**. Confirm, refute or add to these with evidence:
1. The core action is reading small text and pressing small buttons. There's little tactile payoff.
2. CHECK is a tedious text diff, not a satisfying skill moment.
3. Failure is slow attrition: lateness snowballs into a death spiral rather than sharp, readable mistakes.
4. Success has almost no feedback, juice, combo or "nice!" moment. Only mistakes are loud.
5. Decisions are mostly "do everything as fast as possible". The real strategic layer (sync, pacing, station load, prediction) is thin or invisible.
6. The door view is a memory quiz that pulls you away, not an interesting choice.
7. There are no reasons to replay: no progression, goals, collection, variety, or social hooks.
8. The desktop layout, dense text and small targets won't survive a phone.

## 3. What I want you to research

Answer each area with evidence, then translate it into recommendations for HANDS! specifically.

**A. What makes this kind of game fun.** Deconstruct the core loops and moment-to-moment feel of:
- *Overcooked* 1/2/All You Can Eat, *PlateUp!*, *Cook, Serve, Delicious!* 1–3
- *Diner Dash* and its successors, *Cooking Fever*, *Cooking Madness*, *Good Pizza, Great Pizza*
- *Block Blast*, *1010!*, *Mini Metro* / *Mini Motorways*
- *Papers, Please* (document checking made engaging), *FTL* (managing interrupts)
- *Balatro* (score and multiplier juice)
- any restaurant or expo game I haven't named

For each: the core verb, the session shape, how pressure escalates, how mistakes are made readable and funny, and the 2–3 mechanics most transferable to an expo game. Use frameworks where they add something (MDA, flow, loop timing, variable rewards), but stay concrete.

**B. Turning expo's real skills into strategy.** What do experienced expos, chefs and line cooks say is hard, skillful or satisfying about running the pass ("calling a clean board", landing a whole table together, protecting the line from FOH)? Which real logistics could become meaningful, visible player decisions without becoming spreadsheet work? Candidates:
- station capacity and load
- "all day" counts
- firing order for synchronized landing
- coursing and pacing
- predicting and pre-empting 86s
- prep levels
- staffing and cook skill
- runner availability
- table priority and VIP triage

Tell me which add depth and which add only friction. Sources: industry interviews, training material, r/KitchenConfidential and similar communities, chef memoirs. Distinguish anecdote from consensus.

**C. Mobile interaction design.**
- One-thumb and two-thumb patterns from top time-management and puzzle games: drag-and-drop, swipe-to-act, tap economy, hit-target sizes, portrait vs. landscape for this genre.
- Propose 2–3 concrete gesture schemes for HANDS! (e.g. drag a plate onto its ticket to match and send, swipe a ticket to fire, pinch the rail). Evaluate each for speed, error rate, satisfaction and accessibility.
- How to make the plate check a **tactile visual-matching moment** (icons, color codes, ingredient silhouettes, side-by-side compare, "spot the difference") instead of reading text, while keeping it accurate to real modifiers.

**D. Gamification, progression and retention.**
- What drives D1/D7/D30 retention in casual and midcore mobile time-management games? Include benchmark numbers where they exist.
- Candidate systems for HANDS!:
  - scoring with combos and multipliers (e.g. clean streaks, synced tables, perfect boards)
  - star ratings, per-shift goals and contracts
  - daily or weekly shifts and challenges
  - a career mode across restaurants or cuisines
  - equipment and staff upgrades with trade-offs
  - roguelite shift modifiers
  - collectibles (ticket stubs, regulars, recipes)
  - achievements and leaderboards
  - shareable end-of-shift receipts ("post your rail")
- For each: expected impact, build cost, and how it fits the sim (deterministic, data-driven, seeded RNG makes daily seeds and fair leaderboards easy).
- Monetization: survey what the genre does and which models players and the industry audience will tolerate. Recommend one ethical option (premium, cosmetic-only, or ad-free with optional support) with reasoning. Don't push pay-to-win.

**E. Difficulty, onboarding and failure.**
- How top games teach a busy system in the first 60 seconds (FTUE).
- How they avoid death spirals (forgiveness, recovery mechanics, rubber-banding, "second wind").
- How they make failure funny and motivating rather than punishing.
- Concrete changes to the health-drain model and how the bot balancer would measure them.

**F. Game feel ("juice") within web tech.** A prioritized checklist of feedback techniques that can be built in DOM/CSS or a small canvas/WebGL layer:
- hit-stop, squash and stretch, particles, number pop-ups
- combo announcers, sound layering and pitch-stepping on combos
- mobile haptics (Vibration API limits on iOS vs. Android)
- camera shake rules, a satisfying "send" moment, rail-clear celebrations

Cite well-known talks and articles (e.g. "Juice it or lose it", "The Art of Screenshake", GDC talks on game feel), and note the performance cost of each on mid-range Android.

**G. Visual direction for mobile.**
- How top-grossing cooking games handle art style, readability, color coding and iconography at phone size.
- How to keep HANDS!'s identity (thermal ticket paper, heat-lamp amber, low-fi night-shift mood) while becoming as readable and inviting as the best mobile games.
- Concrete options from cheapest to richest (CSS/SVG, sprite sheets, pre-rendered 3D stills, AI-assisted art with manual cleanup), with the pipeline and a rough effort for each.
- How to represent dishes, modifiers and plate states visually so text becomes optional.

**H. Technology fit.**
- Is DOM/CSS rendering still right for a juicy mobile game with 20+ animated objects? Or should the play field move to PixiJS, Phaser or plain Canvas/WebGL while tickets and menus stay DOM?
- Shipping: PWA vs. Capacitor (or similar) wrapping for the iOS and Android stores. Haptics, audio latency on iOS Safari, offline play, store requirements.
- Evidence-based recommendation with migration cost, keeping the deterministic sim untouched.

**I. Audience and market.**
- How large and reachable is the restaurant-worker audience?
- What content and humor lands with them (lingo, archetypes like "the server who keeps asking", "the chef who 86s everything")?
- Where do they share games? Are there existing restaurant or expo games, and what gaps exist?
- What makes the game enjoyable for non-industry players too?

## 4. Constraints

- Small team: one owner plus AI coding agents. Prefer approaches that are cheap to build and iterate, data-driven, and testable headlessly.
- Free-tier hosting. No backend until it's justified; a simple leaderboard on a serverless KV store is acceptable later.
- Keep the deterministic sim / UI separation unless you show it blocks the goals.
- No FNAF or other franchise characters, names, art or sounds. No real POS or printer brands. Respect asset licensing.
- Accessibility matters: color-blind-safe coding, reduced motion, readable type, no reliance on audio alone.

## 5. What I want back

1. **Executive summary (1 page).** The 10 changes that would most improve fun and retention, ranked by impact ÷ effort, with one sentence each on why.
2. **Diagnosis.** My 8 problems, each confirmed or refuted with evidence, plus any I missed.
3. **2–3 redesigned core-loop proposals.** For each:
   - a 30-second moment-to-moment walkthrough
   - the session shape (minutes, waves, end condition)
   - the strategic decisions it creates
   - what stays and what changes in the current systems
   - risks
   
   Recommend one.
4. **Mobile UX spec for the recommended loop:**
   - portrait layout wireframes in ASCII
   - a gesture map
   - hit-target sizes
   - the information hierarchy (what's an icon, what's text, what's hidden)
   - the visual plate-check design
5. **Progression and gamification design:**
   - systems, an economy table (sources and sinks), unlock pacing for the first 7 days
   - daily or seeded content
   - scoring formula with combos and multipliers
   - share moments
6. **Difficulty and failure model:** a replacement or adjustment for health drain, with formulas I can drop into a tuning file.
7. **Juice checklist:** item, effect, technique, rough cost, priority.
8. **Visual direction:** 2–3 style options with references, pipelines and effort, and a recommendation.
9. **Tech recommendation:** rendering, packaging and haptics, with migration steps and cost.
10. **Validation plan:**
    - what to measure in playtests (with target numbers)
    - new metrics to add to the headless bot balancer (e.g. "decisions per minute", "idle time", "death-spiral rate", "combo frequency")
    - which A/B tests to run once live
11. **Roadmap.** Phases of 1–2 weeks each, each with a definition of done, in build order.
12. **Machine-readable appendix.** One JSON array of every recommendation:
    ```json
    { "id": "", "title": "", "area": "core-loop|mobile-ux|progression|feel|visual|tech|difficulty|content|audience",
      "impact": 1-5, "effort": 1-5, "confidence": 1-5, "depends_on": [], "systems_touched": ["sim","data","tuning","ui","audio","bot"],
      "summary": "", "evidence": ["citation ids"] }
    ```
13. **Sources.** Numbered citations with dates. For each major claim, say whether it rests on data, expert consensus, or your own judgment, and flag anything uncertain or possibly out of date.

**How to write it:**
- Be specific to HANDS! and name the existing system you'd change ("replace CHECK's text card with…", "add a combo multiplier to the scoring step…").
- Prefer primary sources: GDC talks, developer postmortems, published retention data, platform docs, mobile game deconstructions. Cite them.
- When sources disagree, say so and pick a side with reasoning.
- Don't pad. Tables and bullets beat prose.

I'll attach the current design doc, decision log, and screenshots of the pass, the door, and the summary screen. Use them as ground truth for "what exists".
