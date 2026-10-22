# HANDS! Deep Research: From Working Expo Prototype to Top-Tier Mobile Game

## Executive verdict and diagnosis

**HANDS! already has the hard part that most prototypes never get:** a coherent fantasy, a deterministic simulation, data-driven content, replayability, automated balancing, restaurant-authentic vocabulary, and a core problem with genuine strategic potential. The current architecture is not the problem. The problem is that the simulation's interesting decisions are being expressed through the least satisfying possible interface: small text, small buttons, hidden timing, text comparison, slow health attrition, and weak positive feedback. The GDD correctly identifies synchronized completion as the game's strategic soul, while the decision log shows that the underlying systems are already capable of modifier-dependent cook times, coursing, station progress, 86s, interrupts, allergies, deterministic bot play, and presentation events. Do **not** rewrite that foundation. fileciteturn0file1 fileciteturn0file2

The research brief's diagnosis is therefore substantially correct. fileciteturn0file0 The major design pivot should be:

> **Turn HANDS! from a text-processing simulator into a tactile flow-management game in which the player visually reads the rail, shapes the kitchen's workload, catches visible plate discrepancies, and cashes out synchronized tables for explosive positive feedback.**

This aligns unusually well with lessons from *Overcooked*: Ghost Town explicitly simplified low-value mistakes, used simple controls and iconography, and changed a punishing life-loss model because players felt as though they were constantly failing rather than having fun. citeturn7search0turn6search0 It also matches Lucas Pope's mobile redesign of *Papers, Please*, where preserving the underlying checking problem required deliberately discarding desktop interaction patterns and smoothing repeated friction. citeturn13search3

### Highest-value changes

Ranked by expected **impact ÷ implementation effort** for the prototype that exists now. Impact and effort are on a five-point scale; ratios are directional rather than pretending game design is accounting.

| Rank | Change | Impact | Effort | Why it should happen |
|---|---|---:|---:|---|
| **1** | **Replace CHECK's text-diff card with a visual discrepancy check** | 5 | 2 | The current mandatory repeated action is a reading tax. Make ordered vs. made components spatially aligned icons; the player taps the discrepancy or approves the plate. This converts clerical friction into a repeatable skill. *Papers, Please* demonstrates that checking becomes engaging when comparison itself is an interaction rather than passive reading. citeturn13search3turn13search5 |
| **2** | **Rebuild the play screen around portrait/mobile touch targets** | 5 | 2 | The screenshots confirm a desktop rail, huge unused space, tiny ticket buttons and tiny text. Apple recommends touch targets around 44×44 points; WCAG 2.2's lower minimum is 24 CSS pixels, but HANDS! should exceed that under time pressure. citeturn2search7turn2search10turn2search2 |
| **3** | **Add a visible combo/multiplier economy around clean synced service** | 5 | 2 | Right now the player mostly hears about failures. A clean course should trigger sequential plate stamps, multiplier growth, ticket rip, score roll-up, escalating audio and a distinct HANDS! payoff. *Balatro* is an extreme example of making arithmetic pleasurable through responsive UI and layered score feedback. citeturn14search6 |
| **4** | **Replace uncapped lateness death spirals with recoverable Service Heat** | 5 | 2 | Multiple late tickets currently multiply continuous damage precisely when the player has fewer options. *Overcooked* abandoned a more punitive failure model after finding it made players feel continuously unsuccessful. citeturn7search0 |
| **5** | **Give stations real, visible capacity** | 5 | 3 | The strategic premise says "protect the line," but unlimited station capacity means load is mostly theater. Two visible cook slots per station plus queues creates an actual FIRE decision without adding spreadsheets. Real KDS systems explicitly schedule item firing from different prep times to achieve coordinated completion. citeturn17search3 |
| **6** | **Demote the door memory quiz; turn interruptions into live triage** | 4 | 2 | Looking away from the actual game to answer hidden-state multiple choice is cognitive taxation, not restaurant strategy. Keep server/bar/manager personalities, but make their requests change priorities, holds, runner availability or timing while the rail remains partially visible. Expo is fundamentally a communication hub, not a trivia station. citeturn17search5turn17search1 |
| **7** | **Make sync and a clean rail the primary emotional rewards** | 5 | 3 | Real expo skill centers on coordinated table completion, quality control, pacing and clearing the board. Those accomplishments deserve much more prominence than today's +3 health sync bonus. citeturn17search1turn18search2turn17search9 |
| **8** | **Add deterministic Daily Service + shareable shift receipt** | 4 | 2 | Your seeded simulation already solves most of the expensive engineering. Mini Motorways uses daily/weekly challenges and leaderboards; deterministic daily content creates a recurring reason to return without authoring a new level every day. citeturn12search4turn12search14 |
| **9** | **Add goals, contracts and unlockable restaurant/cuisine content before stat upgrades** | 4 | 3 | *PlateUp!*, *Cooking Fever*, *Good Pizza, Great Pizza*, and *Cook, Serve, Delicious!* all extend a simple service loop through changing challenges, locations, foods or progression rather than relying on one fixed shift forever. citeturn8search7turn10search0turn11search0turn9search0 |
| **10** | **Close the title-screen/gameplay visual-quality gap** | 4 | 3 | The supplied title screen promises a warm, atmospheric, physical restaurant world; the active game becomes mostly black rectangles and text. Preserve the title's heat-lamp mood but render gameplay with large plate silhouettes, ticket paper, visible pans, characters and physical movement. This is a product-presentation problem as much as an art problem. |

**Basis:** the first six are high-confidence design judgments supported by direct prototype inspection plus expert/developer evidence; retention systems are medium-to-high confidence because their exact lift depends on the eventual audience.

### Diagnosis of the eight stated problems

| Diagnosis | Verdict | Research conclusion |
|---|---|---|
| **Core action is small-text reading + small buttons** | **Strongly confirmed** | The attached gameplay shows information concentrated into tiny ticket cards while most of the screen is unused. This is almost the inverse of mobile interaction design. *Overcooked* specifically moved information toward icons and simpler actions to focus players on the intended coordination challenge. citeturn7search0 |
| **CHECK is a tedious text diff** | **Strongly confirmed** | The problem is not inspection itself. *Papers, Please* proves inspection can carry a game; its discrepancies are spatial comparisons that the player identifies and acts on. Pope's phone redesign further shows repeated friction must be ruthlessly smoothed. citeturn13search3turn13search5 |
| **Failure is slow attrition/death spiral** | **Strongly confirmed** | The existing −1 health/sec **per late course** means one overloaded moment reduces the player's future ability to recover. That is especially problematic on Nights 4–5, where average-bot failure is already roughly 40% and 55%. fileciteturn0file2 |
| **Success has almost no juice** | **Strongly confirmed** | Current rewards are numerically small and visually quiet. Classic game-feel demonstrations show that animation, sound, particles, shake and easing can radically alter perceived impact without changing the underlying mechanic. citeturn21search1turn21search14turn21search17 |
| **Optimal play trends toward doing everything ASAP** | **Confirmed, with nuance** | HOLD and modifier-dependent cook times already create some timing. But because stations have no true capacity and load only occasionally changes through station drag, FIRE lacks enough opportunity cost. The simulation contains the ingredients for strategy; it does not yet force the player to use them. fileciteturn0file1 |
| **Door is a memory quiz** | **Confirmed** | D-039 intentionally hides the rail while the player answers server status from memory. That is internally consistent but produces working-memory challenge rather than service-management choice. fileciteturn0file2 |
| **No replay reasons** | **Strongly confirmed** | Current persistence is next-night unlock plus best grade. By contrast, comparable games layer high scores, locations, challenges, procedural runs, achievements, upgrades or daily/weekly modes over their core loop. citeturn8search7turn12search4turn12search2 |
| **Desktop UI will not survive phone** | **Strongly confirmed** | The current rail/buttons are too small and horizontally dependent. Apple recommends 44-point targets and W3C additionally requires non-drag alternatives for drag interactions. citeturn2search7turn2search6 |

### Problems that are missing from the original diagnosis

**The biggest missing problem is that the simulation hides the thing it claims the player is mastering.** The GDD says synchronization is the core strategic idea, but station state is mostly presented as background progress and capacity is unlimited. Real expo coordination is explicitly about sequencing items of different prep times so they arrive together. Real commercial KDS systems even automate this exact scheduling problem from item and modifier prep times. citeturn17search3 **[Expert consensus + judgment]**

**The second is a reward-alignment problem.** Synchronized service is only +3 health, while the player is exposed to much larger negative values. That tells the player, emotionally and mathematically, that HANDS! is about avoiding punishment rather than orchestrating a great service. The game's scoring system should treat a synchronized table as the equivalent of clearing several lines in a puzzle game: a miniature jackpot. **[Judgment grounded in current GDD]** fileciteturn0file1

**The third is pass space.** The prototype has a visually huge pass but no important spatial constraint beyond plate age. A small number of physical plate slots would make congestion instantly visible and create readable Overcooked-style chaos without adding another meter. **[Judgment]**

**The fourth is the title-screen promise gap.** The supplied start screen is warm, tactile and cinematic; the play screen collapses into sparse developer-tool aesthetics. The first screen says "night in a restaurant"; the second says "KDS dashboard." The final game should deliberately meet in the middle: atmospheric environment, highly graphic interactive objects.

**The fifth is that random defects risk turning good plates into busywork.** If most plates are correct and every plate requires the same slow inspection, optimal play becomes compulsory bureaucracy. The answer is not to remove defects; it is to make each visual check take roughly one or two seconds once learned, with occasional difficult edge cases. *Papers, Please* works because inspection grows into pattern recognition rather than staying equally laborious forever. citeturn13search3

**The sixth is onboarding.** The current title screen explains FIRE, CHECK, REFIRE, HANDS!, HOLD, allergies and the door before play. Modern onboarding research emphasizes engaging players in the first minutes rather than front-loading instruction; GameAnalytics' 2025 dataset likewise shows a huge performance gap between mediocre and top-retaining games and explicitly identifies early clarity/engagement as critical. citeturn20search2turn20search3turn20search1

## What the best games and real expo work teach

### Competitive deconstruction

The transferable lesson is not "copy restaurant games." HANDS! sits at the intersection of **time management, visual inspection, logistics puzzle, and score attack**. The strongest version should borrow a little from each category.

| Game | Core verb and session | Pressure / readable failure | What HANDS! should steal |
|---|---|---|---|
| **Overcooked 1/2/AYCE** | Move, pick up, process, combine, deliver; short timed levels | Work exceeds available attention; layouts and disruptions force adaptation. Errors are physical and often slapstick. Ghost Town deliberately simplified finicky low-value errors and used simple controls. citeturn7search0turn6search0 | Simple verbs; escalating disruptions; **physicalized errors**; timed shifts where a mistake hurts score instead of inevitably killing the run. |
| **PlateUp!** | Operate restaurant through increasingly difficult procedural days; choose upgrades between shifts | Each run develops through procedural layouts and upgrade choices, creating adaptation rather than memorization. citeturn8search7turn8search0 | Seeded shift modifiers; meaningful between-shift choices; replay through different operating conditions rather than pure stat inflation. |
| **Cook, Serve, Delicious!** | Rapidly interpret orders and execute them correctly; dense campaign/levels | Complexity comes from menu breadth, rushes and execution accuracy. CSD3 advertises hundreds of levels and foods plus difficulty/accessibility options. citeturn9search0turn9search7 | Menu mastery, rush cadence, expanding vocabulary, modifiers that eventually become muscle memory. Do **not** copy its keyboard-like density onto touch. |
| **Diner Dash** | Seat, serve, clear and batch actions | Customer patience makes bottlenecks immediately visible; chaining compatible actions rewards planning. Contemporary guides emphasize chaining and adapting behavior between calm and rush periods. citeturn10search4turn10search11 | Reward **batching and clean sequences** rather than merely low ticket time. A four-plate synced HANDS! should be the expo equivalent of a chain. |
| **Cooking Fever** | Tap through service tasks across short levels | Speed, customer patience, star thresholds and location progression make goals concrete. Official materials describe more than 1,000 levels and many restaurant locations/upgrades. citeturn10search0turn10search1 | Immediately readable goals, 1–3 star mastery, lots of content built from a reusable service structure. Avoid its monetization pressure. |
| **Cooking Madness** | Rapid service/tap sequences | Extremely readable production → serve flow and short level goals; its scale demonstrates the reach of the mobile cooking/time-management category, though popularity does not prove its mechanics are right for HANDS!. | Big targets, high visual contrast, immediate positive confirmation. Do not turn expo into whack-a-mole. |
| **Good Pizza, Great Pizza** | Interpret a customer's request, construct an order, serve | The interesting friction is often decoding unusual requests rather than pure speed. The official press kit explicitly describes puzzle-solving and complicated-order interpretation alongside upgrades, quests and achievements. citeturn11search0turn11search5 | Restaurant humor, recurring characters, order interpretation, memorable special cases, a world outside the raw mechanics. |
| **Block Blast / 1010!** | Drag one object, place it, clear space; potentially endless score attack | Failure is visually obvious: the board fills. 1010!'s official description emphasizes simple placement, line clearing and high-score pursuit without a timer. citeturn12search18turn12search2 | One-thumb readability; every action changes the board; physical clearance feels good. **"Clear the rail" should feel like clearing the puzzle board.** |
| **Mini Metro / Mini Motorways** | Build and continuously revise a system under growing demand | Pressure appears as visible congestion rather than an abstract damage meter. Motorways uses dynamic growth, constrained upgrades, daily/weekly challenges, leaderboards and shareable maps. citeturn12search4turn12search14 | Pressure represented spatially; optimization over reflex; deterministic challenges; clean visual language; "I built this mess" failures. |
| **Papers, Please** | Compare evidence, identify discrepancies, approve/reject | Each discrepancy is a small detective task. Rules accumulate gradually; Pope's phone version reworked the desktop UI around carousel navigation and friction reduction. citeturn13search3turn13search5 | Make CHECK an **active discrepancy hunt**. Keep the rule set compact, spatially consistent and learnable. |
| **FTL** | Allocate attention/resources, pause, respond to compounding events | Interrupts become meaningful because each competes for scarce resources and threatens different systems. Subset's postmortem emphasizes designing toward the desired feeling rather than preserving predetermined mechanics. citeturn14search0turn14search7 | Interrupts should alter the plan, not quiz memory. A server/bar/manager request should force prioritization among already-visible work. |
| **Balatro** | Choose a hand, build synergies, watch scoring cascade | Score itself becomes spectacle: trigger order and multiplier escalation make causality exciting. LocalThunk specifically highlights the appeal of mechanical systems, pleasant UI and rewarding sound feedback. citeturn14search6 | Sequentially reveal *why* a service was great: `4 PLATES → SYNC → HOT → CLEAN → ×2.25`. Make the calculation the celebration. |

The broad pattern is striking: the best examples do **not** produce depth by making basic interaction cumbersome. They make the primitive action obvious, then create difficulty through combinations, constraints, pacing and prioritization. That is exactly the direction HANDS! needs. **[Expert consensus + judgment]** citeturn7search0turn13search3turn14search16

### What real expos are actually good at

Industry material is remarkably consistent about the role: the expediter manages incoming tickets, synchronizes production, performs final QC, controls pacing, communicates between FOH and BOH, handles modifications/allergies/86s, and gets whole tables out together. Current expo job listings repeat the same duties. citeturn17search5turn17search1turn17search6 Toast's documentation makes an especially useful game-design point: item and modifier prep times can determine staggered automatic fire times so differently timed dishes finish together. citeturn17search3

Likewise, "all day" is not decorative jargon: it is the current total needed across open tickets, used to help stations understand workload. citeturn17search9 "Clear the board/rail" refers to getting through the active ticket load. citeturn18search2turn18search1

That creates an unusually clean hierarchy of potential game mechanics:

| Real expo/logistics mechanic | Depth | Friction risk | HANDS! implementation |
|---|---:|---:|---|
| **Different cook times + synchronized landing** | **Very high** | Low | Already present. Make it visually forecastable and score it heavily. This should remain the heart of the game. |
| **Station capacity/load** | **Very high** | Low | **Add now.** Grill, sauté and pantry each get two visible active slots; excess FIREs queue. Station drag can temporarily remove a slot or lengthen that station's work. |
| **Coursing/pacing** | **Very high** | Low | Already present. Retain HOLD, server fire requests and bar delays. Improve visual readiness cues. |
| **Pass/window capacity** | **High** | Low | Add six physical plate spaces. Congestion becomes visible rather than another number. |
| **All-day counts** | **High** | Medium | Show three small station counters: `GRILL 4`, `SAUTÉ 3`, `PANTRY 2`, optionally expanded by holding a station. Later challenge mode can occasionally ask the player to call the count. |
| **Table priority / VIP / push** | **High** | Low | Already present; visualize priority on the ticket and create opportunity cost instead of merely doubling penalties. |
| **86 awareness** | **High** | Medium | Keep current resolve flow. Later add a pre-shift `LOW: 3 SALMON` notice rather than full inventory bookkeeping. |
| **Runner availability** | Medium-high | Medium | Add later as two small runner tokens that become occupied for several seconds after HANDS!. This creates "can I safely send right now?" without pathfinding. |
| **Predicting low product** | Medium | Medium-high | Use occasional LOW warnings, not numeric inventory. Full stock accounting is spreadsheet territory. |
| **Staff skill** | Medium | High | Better as per-shift traits/modifiers (`NEW GRILL COOK: +10% variance`) than permanent RPG numbers. |
| **Prep levels** | Low-medium | **High** | Do not make the player count mise en place. Use a pre-shift modifier such as `SHORT ON CHICKEN: long cook +2s` if needed. |
| **Permanent equipment upgrades** | Medium | High | Defer. If introduced, use **sidegrades**, not "buy +20% speed"; otherwise progression devalues player mastery. |
| **Detailed inventory** | Low for this fantasy | **Very high** | Exclude. The current "never" list is right. |

**Consensus:** syncing a table, pacing the line, QC and communication appear repeatedly in professional expo descriptions. citeturn17search5turn17search1turn17search9  
**Anecdote caveat:** I did not treat scattered restaurant-community anecdotes as statistical evidence. Search access produced too little clean thread-level r/KitchenConfidential material to justify calling it consensus; the recommendations above rest mainly on current restaurant job/training and operational documentation.

### The most important strategic change: capacity

At present, the player can see rough pan progress, but station capacity does not impose a real resource constraint. fileciteturn0file2 Replace this:

```text
FIRE → invisible independent timer
```

with:

```text
FIRE
  ↓
station has open slot? ── yes → COOKING
         │
         no
         ↓
      QUEUED
         ↓
first slot opens → COOKING
```

Default:

```ts
stationCapacity: {
  grill: 2,
  saute: 2,
  pantry: 2,
}
```

A five-top containing three grill items therefore creates a genuine decision. Fire everything and one item waits in queue, potentially destroying sync. Fire the long steak first, then the burgers later, and the whole table can land together.

That is real logistics translated into a tiny, visible puzzle. It also creates a reason for modifier cook-time deltas in D-053 to matter beyond flavor. fileciteturn0file2

## Recommended core loop and mobile UX

### Three candidate loops

#### Rail-to-Pass — recommended

**Fantasy:** "I am conducting service."

A 30-second slice:

```text
0s   Printer chatters. Table 18 snaps onto the rail:
     STRIP MW / SALMON / CHOP + CHICKEN.

3s   Grill shows one free burner, sauté has two.
     Strip is the long item. Tap T18 → FIRE STRIP.

7s   Another ticket arrives. Player holds it because grill is now loaded.

12s  Strip progress reaches its marked "catch-up" band.
     Tap T18 → FIRE SALMON + CHOP.

18s  Server bubble: "Bar's slow on 22 — hold them."
     Player taps HEARD; WAIT ON BAR stamp hits T22.

23s  Three plates hit nearly together: CLANK, CLANK, CLANK.
     Tap first plate. Ordered/Made pictograms align.
     Swipe approve.

27s  Second plate has FRIES where POTATO was ordered.
     Tap the mismatching side icon → grease-pencil circle → REFIRE.

30s  Third is correct. Player has saved the table without losing
     the sync streak; "SAVE! +75" pops and the refire begins.
```

**Session shape:** keep career shifts at **3–5 minutes**, with roughly `opening ramp → first wave → recovery beat → larger wave → final rush → clear rail`. That duration also fits the current mobile market well: GameAnalytics' 2025 dataset places median mobile session length only a little above three minutes, although HANDS!' natural multi-shift session can be longer. citeturn20search1

**Strategic decisions created:** which long item starts first; whether the station has capacity; which table deserves capacity; when to hold a course; whether to inspect/send now or leave a plate briefly; whether to respond to an interruption; how to preserve the combo through a bad plate.

**What stays:** deterministic sim, 20 Hz, tickets, menu data, cook-time tiers/deltas, HOLD, plate defects, refires, allergies, 86s, night scripting, bot, event bus, audio architecture. fileciteturn0file1turn0file2

**What changes:** station capacity becomes real; CHECK becomes visual; Service Health becomes Service Heat; sync becomes a major scoring event; the door becomes an overlay/character lane; mobile layout replaces desktop rail geometry.

**Risk:** too much information in portrait. Mitigation: the rail displays only 2–3 ticket summaries simultaneously and uses snap scrolling; station state is a compact strip rather than a second dashboard.

**Recommendation:** build this.

#### Plate-to-Ticket

Here, plates are the dominant objects. A plate lands; the player physically drags it upward onto the corresponding ticket/seat. Holding it over the ticket expands ordered-versus-made components. Drop onto REFIRE chute when wrong; drop onto the ticket when approved.

A 30-second slice is highly tactile: two plates clank onto the pass, the player drags burger T18/S2 toward T18, the target expands, recognizes the mismatch manually, sends it left into the bin, then drags salmon to T18/S3 and releases; the ticket shakes, the plate flies through the window, and the multiplier climbs.

**Advantages:** highest tactile satisfaction, excellent visual connection between plate and ticket, easy to market in video.

**Problems:** drag gestures have higher precision cost, can obscure information under the thumb, and require a single-tap alternative for accessibility. WCAG specifically requires functionality that uses dragging to be achievable without dragging unless essential. citeturn2search6 It also risks turning the game into object sorting rather than expo timing.

**Verdict:** use drag-to-ticket as an **optional accelerator**, not the base control scheme.

#### Call-the-Board

This version leans harder into strategy: the rail dominates the top half, stations visibly show two cook slots, and the player sequences individual items into station queues. Plate QC becomes fast and secondary.

Thirty seconds might involve firing a long chicken, holding two quick pantry dishes, checking an all-day count, responding to "How long on 31?", then releasing two quick items as the chicken approaches completion.

**Advantages:** richest expo simulation; best for restaurant veterans and later endless/expert mode.

**Problems:** pushes toward management software, weaker tactile payoff, worse onboarding for non-industry players.

**Verdict:** make this an **Expert/Saturday ruleset**, not the universal core loop.

### Portrait UX specification

The default control philosophy should be **tap to focus; large context button to commit; gestures as accelerators**. That is less flashy than gesture-only design, but much more dependable under pressure. Apple recommends roughly 44-point hit areas, and W3C's accessibility guidance reinforces large target and gesture alternatives. citeturn2search7turn2search2turn2search6

Normal play at approximately 375×812:

```text
┌─────────────────────────────────────┐
│ 7:42 PM        ×1.75        HEAT 31 │  48 px
├─────────────────────────────────────┤
│  T12      T18      T21        →     │
│ ┌──────┐ ┌──────┐ ┌──────┐         │
│ │ 2 TOP│ │ 4 TOP│ │ 3 TOP│         │
│ │ ● ●  │ │ ● ●  │ │ ● ●  │         │
│ │ HOLD │ │FIRING│ │ ALLGY│         │
│ └──────┘ └──────┘ └──────┘         │  ~210 px rail
├─────────────────────────────────────┤
│ GRILL 2/2     SAUTÉ 1/2    PAN 0/2 │
│ [■■ 73%]      [■ 44%]      [    ]   │  ~90 px
├─────────────────────────────────────┤
│              THE PASS               │
│                                     │
│    ( T12 )       ( T18 )            │
│     BURGER        SALMON             │
│                                     │
│    ( empty )      ( empty )         │
│                                     │
│              ♨ fresh                │  flexible
├─────────────────────────────────────┤
│ MAYA: "Fire 12?"             [HEARD]│  interruption tray
├─────────────────────────────────────┤
│       [ FIRE COURSE ]  [ DETAILS ]  │  64–72 px action dock
└─────────────────────────────────────┘
```

Plate-check state:

```text
┌─────────────────────────────────────┐
│ TABLE 12 · SEAT 1        7s FRESH   │
├─────────────────────────────────────┤
│            [ BURGER ART ]            │
│                                     │
│       ORDERED          MADE          │
│       ───────          ────          │
│       🍔 BURGER        🍔 BURGER      │
│       ◐ MEDIUM        ◐ MEDIUM       │
│       🍟 FRIES         🥔 POTATO      │
│       ⊘ ONION          ⊘ ONION       │
│                                     │
│  Tap anything that doesn't match.   │
│                                     │
│  [ REFIRE ]           [ ✓ GOOD ]    │
└─────────────────────────────────────┘
```

The icons above are conceptual rather than the actual art. Final assets should be house-specific silhouettes rather than emoji.

### Gesture map

| Action | Primary accessible input | Accelerator | Error protection |
|---|---|---|---|
| Select ticket | Tap anywhere on large ticket body | Horizontal rail swipe to another ticket | Selection does not itself commit anything |
| Fire whole course | 56–64 px bottom FIRE button | Swipe ticket upward/right | Brief 200 ms undo only before first station slot starts, on Nights 1–2 |
| Fire single item | Tap item → big `FIRE ITEM` button | Swipe item | No tiny inline button |
| Check plate | Tap 72–96 px plate | Drag plate upward slightly | Check opens without consequence |
| Mark discrepancy | Tap the mismatching icon | — | Large row hit area, not just icon |
| Approve plate | `GOOD` button | Swipe plate up | Cannot HANDS! incomplete table without a deliberate second confirmation |
| Refire | `REFIRE` button | Swipe plate left toward bin | Distinct direction and vibration |
| HANDS! course | Ticket/course `HANDS!` button when complete | Drag approved stack upward | Whole-table send remains an intentional commit |
| Answer interrupt | Tap character bubble → big choice | Swipe bubble into action when binary | Rail stays visible underneath |
| Navigate rail | Swipe horizontally / tap ticket | — | Snap positions; no free inertial fling |
| Accessibility | All gesture actions have tap/button equivalents | — | Required for motor accessibility. citeturn2search6 |

Recommended minimums:

| Element | Target |
|---|---:|
| Main action button | **56–64 CSS px high** |
| Secondary action | **48 px high** |
| Minimum interactive region | **44×44 px** |
| Plate | **72–96 px effective hit diameter** |
| Ticket tap body | **140+×120 px** |
| Rail modifiers | **15–17 px equivalent text** |
| Nonessential metadata | **13–14 px** |
| Edge padding | **16 px minimum** |

Apple's public guidance uses 44×44 points as the standard touch-target reference; HANDS! should generally exceed it because interaction is timed and the user's thumb will obscure part of the display. citeturn2search7turn2search10

### Visual CHECK design

The core rule should be:

> **Same information, less decoding.**

Every dish gets a canonical `PlateSchema`:

```ts
type PlateSchema = {
  dish: DishIcon
  doneness?: DonenessIcon
  side?: SideIcon
  removals: ModifierIcon[]
  additions: ModifierIcon[]
  sauce?: SauceIcon
  allergyPick?: AllergyPickIcon
}
```

Ordered and made use the **same slot locations**. That matters enormously. A medium burger with fries and no onion should not make the player search two differently laid-out cards. They should notice:

```text
ORDERED      MADE
MEDIUM       MEDIUM
FRIES        POTATO  ← visual discontinuity
NO ONION     NO ONION
```

The player taps `POTATO`, which receives a grease-pencil circle, `WRONG SIDE` appears for roughly half a second, and REFIRE becomes dominant.

For correctness and accessibility:

- dish type uses **shape + tiny label**;
- station identity uses symbol/pattern, not color alone;
- doneness uses a five-position notch/gauge plus abbreviation;
- removals use a crossed ingredient silhouette;
- additions use a `+` token;
- side substitutions show `→`;
- unfamiliar/new modifiers retain text beneath the icon until the player demonstrates mastery.

**Allergies remain procedural, never spot-the-difference.** D-009 is correct: ACK before firing → line protocol → marked plate → correct seat. The game must not teach that somebody can determine allergy safety merely by visually inspecting food. fileciteturn0file2

### First minute

The tutorial should disappear as a separate lecture.

| Time | What happens | What the player learns |
|---|---|---|
| **0–8 s** | Printer audibly spits one one-top ticket. Everything else is quiet. | Tickets appear here. |
| **8–18 s** | Ticket pulses subtly; only FIRE is active. Player fires burger. | "I control when cooking starts." |
| **18–30 s** | Grill visibly fills; plate clanks onto the pass. | Action → visible consequence. |
| **30–40 s** | First plate check is deliberately correct. GOOD → HANDS! → loud satisfying send. | Check and send. |
| **40–52 s** | Second plate has an obvious wrong side. Player taps mismatch and REFIRE. | Catching mistakes is good, not punishment. |
| **52–60 s** | Two-seat table prints; both items have different cook times. Small ghost landing markers suggest staggered firing. | "The real game is landing them together." |

No door status quiz, allergy, 86 or multi-course explanation belongs in the first minute. GDC onboarding material consistently emphasizes attracting attention and making the goal/effectiveness obvious early rather than dumping systems on a new player. citeturn20search2turn20search4

## Progression, difficulty, feel, and visual direction

### Scoring should celebrate expo mastery

Do **not** simply add points for speed. That would make the current "do everything ASAP" problem worse.

A course earns:

```ts
basePlatePoints = 100 * plateCount

syncQuality =
  clamp(1 - landingSpreadMs / 6000, 0, 1)

freshnessQuality =
  average(
    clamp(1 - plateAgeAtSendMs / plateDieMs, 0, 1)
  )

courseBase =
  basePlatePoints
  + 250 * syncQuality
  + 150 * freshnessQuality

courseScore =
  round(courseBase * cleanStreakMultiplier)
```

Recommended combo:

```ts
combo.start = 1.0
combo.step = 0.25
combo.max = 3.0

onCleanCompleteCourse:
  combo = min(3.0, combo + 0.25)

onPerfectSync:
  // bonus points, but don't double-increment combo
  perfectSyncBonus = 150

onCorrectlyCaughtBadPlate:
  // A defensive success should not destroy momentum
  saveBonus = 75
  combo unchanged

onEscapedBadPlate:
  combo = 1.0

onDeadPlate:
  combo = max(1.0, combo - 0.5)

onIncompleteSend:
  combo = 1.0

onCourseSeriouslyLate:
  combo = max(1.0, combo - 0.25)
```

Sequential scoring should visibly read:

```text
TABLE 18
4 PLATES                      +400
LANDED 1.8s APART  PERFECT    +221
HOT PASS                      +143
CLEAN SERVICE                    ×2
                                ────
                              1,528
                 PERFECT TABLE!
```

This is where the *Balatro* lesson matters: explain causality by letting bonuses trigger one after another instead of instantly replacing everything with one opaque number. citeturn14search6

**A caught kitchen error should be a positive play.** Today REFIRE is mostly the absence of punishment. Turn it into `SAVE!`, preserve the streak, circle the error and make the bin/refire motion satisfying. Expo exists precisely to stop that mistake reaching the guest.

### Progression systems

| System | Expected impact | Build cost | Recommendation |
|---|---:|---:|---|
| Clean-service multiplier | **Very high** | Low | Build immediately |
| 1–3 stars / letter grade | High | Low | Keep grade; add three clearly explained mastery thresholds |
| Per-shift optional goals | High | Low | Add `No Dead Plates`, `3 Perfect Tables`, `Never Fire Into Full Grill` |
| Daily seeded shift | **High** | Low | Build after core loop |
| Weekly modifiers | High | Low-medium | Same data system as nights |
| Shareable receipt | High virality potential | **Very low** | Build early |
| Career across restaurants/cuisines | **Very high long-term** | High | First major content expansion |
| Roguelite house rules | High | Medium | Strong fit for deterministic data |
| Collectible ticket stubs/regulars | Medium | Low-medium | Flavor/meta reward |
| Achievements | Medium | Low | Add after telemetry |
| Leaderboards | Medium-high | Medium | Daily only initially |
| Staff/equipment power upgrades | Low-medium | Medium-high | **Defer/reject stat inflation** |
| Equipment sidegrades | Medium | Medium | Later expert/career system |
| Paid boosters | Negative fit | — | **Do not build** |

*PlateUp!* demonstrates how procedural runs and upgrade choices can create replay from a service loop, while Mini Motorways' daily/weekly challenge structure is an especially clean fit for HANDS!' deterministic simulation. citeturn8search7turn12search4

### Economy

Keep the economy intentionally small.

| Resource | Sources | Sinks | Purpose |
|---|---|---|---|
| **Stars** | Up to 3 per career shift based on mastery thresholds | **None** | Non-spendable progression gate. Prevents grind/pay-to-win. |
| **Stamps** | First clear, optional contracts, Daily Service, achievements | Cosmetic ticket paper, pass decorations, title badges, alternate printer/plate cosmetic packs | Cosmetic collection |
| **Ticket Stubs** | Unique regular/event completion | **None** | Scrapbook/collection; story and restaurant-worker humor |
| **Score** | Every shift | **None** | Leaderboard/mastery comparison |

No ingredient currency. No energy system. No upgrade timers. No cook-speed monetization.

### First-week unlock pacing

These are **play-based milestones, not real-time gates**.

| Typical day | New toy |
|---|---|
| First session | Night 1 → Night 2, combo score, first ticket stub |
| Next return | Night 3, 86s/refires, first optional contract |
| Third return | Night 4, Daily Service unlocked |
| Fourth return | Night 5, Saturday score-attack unlocked |
| Fifth return | First alternate menu mini-pack / restaurant preview |
| Sixth return | Weekly Challenge and first cosmetic stamp purchase |
| Seventh return | Expert rules: tighter station capacity, all-day challenge, leaderboard tier |

A player who binge-plays can unlock these sooner. Do not manufacture retention by telling an enthusiastic player to come back tomorrow.

### Daily Service

The deterministic sim makes this almost embarrassingly cheap:

```ts
dailySeed = hash(
  `hands:daily:${utcDate}:${rulesetVersion}:${contentVersion}`
)
```

Everyone gets the same tickets, defects and interruptions.

A submitted score eventually contains:

```ts
{
  seed,
  rulesetVersion,
  contentVersion,
  actionLog,
  finalScore
}
```

Because the simulation is deterministic, a serverless function can later replay the action log and reject scores that do not reproduce the submitted result. That is much stronger leaderboard integrity than a normal client-only casual game and directly reuses the architecture you already paid for. **[Judgment based on current architecture]** fileciteturn0file2

### Share moments

The end screen should produce a vertical "receipt":

```text
╔══════════════════════════╗
║       HANDS!             ║
║   SATURDAY SERVICE       ║
║                          ║
║ TABLES SENT          14  ║
║ PERFECT TABLES        7  ║
║ PLATES SAVED          3  ║
║ WORST WEED        8:42PM ║
║ MAX RAIL              8  ║
║ COMBO              ×2.75 ║
║                          ║
║ CLEAN BOARD:        3x   ║
║                          ║
║ SCORE          18,420    ║
║ GRADE               A-   ║
║ DAILY RANK       #1,842  ║
║                          ║
║ "86 SALMON. HEARD."      ║
╚══════════════════════════╝
```

The Web Share API can support system sharing where available; a Capacitor build can use native sharing consistently. citeturn3search11turn22search0

### Retention benchmarks and what they actually mean

GameAnalytics' 2026 benchmark report covers more than 16,000 mobile games using 2025 data. Median mobile D1 retention sat around **22%**, median D7 just under **4%**, and D30 below 1% in the aggregate; roughly top-quartile games were around **30%+ D1, 6–7% D7 and roughly 1.6–1.8% D30**, while top-decile performance was dramatically stronger. North American medians were approximately 23.3% D1 and 5.0% D7. citeturn20search1

These are **not promises** for HANDS!: genre, acquisition source, premium vs. F2P and analytics definitions matter. They are useful as external reference bands.

My launch targets would be:

```text
D1     ≥ 30%
D7     ≥ 7%
D30    ≥ 2%
```

That aims roughly around or somewhat above top-quartile broad-market performance rather than pretending a small indie should launch at top-1% numbers. **[Data benchmark + judgment]** citeturn20search1

The best retention system, however, is not a streak calendar. It is "I want one more shift." The daily, collection and career layers should be built **after** the 3–5 minute shift generates that feeling.

### Replace Service Health with recoverable Service Heat

Keep one meter, but invert its meaning.

```text
0 = composed
100 = meltdown
```

For each late course:

```ts
lateSeverity =
  clamp(
    (courseAgeMs - graceMs) / lateRampMs,
    0,
    1
  )
```

Total lateness pressure:

```ts
lateHeatPerSec =
  min(
    tuning.heat.maxLateRate,
    tuning.heat.lateRate *
      Math.sqrt(
        sum(lateCourses.map(c => c.severity ** 2))
      )
  )
```

Suggested starting values:

```ts
heat: {
  initial: 10,

  lateRampMs: 12_000,
  lateRate: 1.25,
  maxLateRate: 3.0,

  passiveRecoveryPerSec: 0.30,
  recoveryPerCleanCourse: 4,
  recoveryPerPerfectSync: 3,
  recoveryPerCaughtDefect: 2,

  wrongModifier: 18,
  wrongDish: 25,
  unnecessaryRefire: 4,
  deadPlate: 12,
  incompleteSend: 10,
  earlyHeldLanding: 6,
  wrongInterrupt: 6,
  fired86: 12,
  allergyIncident: 70,

  criticalThreshold: 100,
  criticalRecoverBelow: 88,
  criticalGraceMs: 8_000,
}
```

Important behavior:

```ts
if (heat >= 100 && !critical) {
  critical = true
  criticalDeadline = now + 8000
}

if (critical && heat <= 88) {
  critical = false
}

if (critical && now >= criticalDeadline) {
  failShift()
}
```

So hitting 100 produces:

```text
MANAGER AT THE PASS
GET IT BACK UNDER CONTROL
8…7…6…
```

rather than immediate death.

A clean table, a caught bad plate or a rapid rail clear can pull the player back.

This creates **sharp mistakes but recoverable service**, addressing the current problem where several late courses continuously damage the meter until the run becomes mathematically unrecoverable. It also follows the lesson from Overcooked's development: punishment should create tension without making the player spend the rest of the round feeling like failure has already happened. citeturn7search0

Keep the Night 5 allergy failure exceptional. It is appropriate for the game to distinguish an allergy incident from a cold side of fries.

### Failure should create restaurant stories

| Event | Current feel | New presentation |
|---|---|---|
| Bad plate escaped | −15 | Server immediately returns: ticket slaps onto rail, `WRONG MOD — ON THE FLY`, multiplier shatters |
| Plate dies | −10 | Steam fades, food silhouette slumps, lamp flickers, `DIED IN THE WINDOW` stamp |
| Grill overload | Hidden | Queue physically stacks behind burners; cook barks "Grill's buried!" |
| Perfect synchronization | +3 health | Four plates land rhythmically; table flashes; `ALL UP!` → multiplier burst |
| Caught defect | Basically neutral | `SAVE! +75`, satisfying bin/refire |
| Clean board | Nothing major | Rail empties; printer silence; kitchen exhale; subtle zoom + `CLEAN BOARD` bonus |
| Shift loss | Health=0 | Manager hand enters frame, pulls ticket rail down: `YOU'RE OFF EXPO` |
| Retry | Summary/menu | `RUN IT BACK — SAME SEED` directly on failure card |

"Funny" should mean recognizable restaurant chaos, not treating allergens, burns or guests' safety as jokes.

### Juice checklist

The classic *Juice It or Lose It* and *Art of Screenshake* demonstrations are relevant because HANDS!'s actions currently have strong semantic meaning but little physical consequence. Layered response can create far more feel without changing simulation rules. citeturn21search1turn21search14turn21search17

| Item | Effect | Implementation | Cost | Priority |
|---|---|---|---:|---|
| Ticket button compression | Confirms every tap immediately | CSS scale `1 → .96 → 1`, 80–120ms | Tiny | **P0** |
| FIRE stamp | Turns command into physical act | CSS/SVG stamp + paper flex | Tiny | **P0** |
| Plate landing weight | Makes "food up" visceral | transform overshoot + clank + 1–2 px pass impulse | Low | **P0** |
| HANDS send | Major payoff | plate stack accelerates offscreen, ticket tears, score sequence starts | Low | **P0** |
| Combo pitch stepping | Success becomes audible | 4–6 SFX pitch/variant ladder | Low | **P0** |
| Sequential score pop | Shows causality | DOM number chips, transform/opacity | Low | **P0** |
| Grease-pencil error circle | Makes QC tactile | SVG path draw animation | Low | **P0** |
| Correct REFIRE bin | Turns defense into success | plate tilt/drop + scrape/clank | Low | **P0** |
| Clean-board beat | Emotional punctuation | 250ms ambient duck, rail glint, restrained camera ease | Low | **P1** |
| Local pseudo-hit-stop | Adds impact without freezing sim | freeze/send element for ~50–70ms; sim continues | Low | **P1** |
| Micro camera shake | Weight on significant events | shake **pass container only**, 1–4 px / <120ms | Low | **P1** |
| Canvas paper crumbs/steam | Ambient richness | one overlay canvas; pooled particles | Medium | P1 |
| Combo particles | Celebration | canvas burst, 15–30 pooled particles | Medium | P1 |
| Character reaction | Humor/causality | small CSS/SVG portrait animation | Medium | P1 |
| Rail-clear full celebration | Jackpot | sound layer + subtle zoom + ticket particles | Medium | P1 |
| Screen-wide shake | Often hurts legibility | Avoid except catastrophic event; reduced-motion disables | — | **Avoid** |
| DOM hundreds of particles | Expensive/GC-heavy | Use canvas instead | — | **Avoid** |

web.dev recommends sticking heavily to transform/opacity for animation because they avoid the expensive layout/paint work associated with many other CSS properties; at 60 Hz a complete frame has only about 16.7 ms. citeturn5search16

### Haptics

For the PWA, treat `navigator.vibrate()` as **best-effort only**: MDN marks the Vibration API as limited-availability and requires user activation in supported browsers. citeturn3search0turn3search3

Recommended native haptic language after Capacitor:

```text
select ticket        → none
FIRE                 → light impact
plate lands          → none/light only if player owns action
GOOD / approve       → soft impact
REFIRE correctly     → medium impact
wrong SEND           → error notification
PERFECT TABLE        → success notification
critical service     → warning notification
```

Do not vibrate on every printer event. The phone will feel like a malfunctioning pager.

### Visual direction

The supplied screenshots indicate the right **mood** but not the final gameplay language.

#### Graphic low-fi pass

**Pipeline:** CSS backgrounds + SVG objects + a small dish sprite set + textures/grain.

```text
Static illustrated kitchen background
→ SVG ticket/plate/pan assets
→ CSS/SVG light masks
→ tiny canvas particles
```

**Effort:** roughly 1–2 focused art/implementation phases.

**Strength:** fastest, crisp on every resolution, cheap to animate.

**Weakness:** risks retaining the current "dashboard" feeling if dishes stay abstract.

#### Pre-rendered night-shift diorama — recommended

Use one richly rendered static pass/environment, then overlay graphic interactive assets.

```text
Blender / illustration / manually-cleaned generative concept
        ↓
fixed-camera background
        ↓
dish renders at 3–5 viewing angles
        ↓
sprite atlas / WebP
        ↓
SVG modifier tokens + DOM tickets
```

Interactive objects are more saturated/brighter than scenery. The environment stays dark and amber; tickets and plates must never disappear into it.

**Effort:** roughly 3–6 weeks of iterative asset work for a strong first restaurant, much of it content creation rather than engineering.

**Why it wins:** it bridges the atmospheric title screen and readable mobile play without requiring a real-time 3D renderer.

#### Rich animated 2D/3D

Spine-style characters, extensive dish animation, real-time lighting/WebGL.

**Effort:** high.

**Recommendation:** not yet. For a one-owner team, this spends scarce production capacity where the core loop is not yet validated.

### Art rules

Use the title screen's **heat-lamp amber as environmental mood**, not UI color.

Interactive state should follow a separate accessibility-safe language:

```text
HELD       = outlined / hollow icon
COOKING    = moving progress texture
UP         = solid shape + upward notch
WAIT       = horizontal bar symbol
PRIORITY   = chevron
ALLERGY    = dedicated shield/pick symbol + text
86         = crossed-dish symbol
REFIRE     = circular-arrow stamp
```

Color can reinforce those states, but never carry them alone.

Dishes should read from silhouette at 80 px. A burger, steak, salmon, chicken, salad, burrata, calamari and fries should all remain distinguishable without their text labels. Modifiers are icon overlays, not tiny written paragraphs.

The visual objective is **"night-shift restaurant, arcade legibility"**, not "photoreal food sim."

## Technology, packaging, and audience

### Keep the deterministic sim exactly where it is

D-001/D-005 are unusually good decisions for this project: pure simulation, fixed timestep, seeded RNG and replayable action sequences are assets for bots, daily challenges, replay verification, debugging and potentially competitive scoring. fileciteturn0file2

Do not move gameplay state into Phaser. Do not put timers into CSS. Do not make haptic/animation callbacks authoritative.

The architecture should remain:

```text
          DATA / TUNING
                ↓
       DETERMINISTIC SIM
          20 Hz / seed
                ↓
        snapshots + events
         ↙             ↘
      UI                 AUDIO
   DOM + canvas           Howler
         ↓
 Capacitor-native services
```

### Rendering recommendation

**Stay DOM/CSS-first now. Add one canvas effects layer.**

Twenty or even several dozen animated interface objects do not inherently require a game renderer when most motion is transform/opacity and the interface itself is ticket/text/control heavy. web.dev's rendering guidance supports the current transform/opacity approach. citeturn5search16

Use:

```text
DOM/CSS/SVG:
tickets
ticket text
buttons
progress
plates as interactive hit targets
check overlay
menus
accessibility labels

Canvas:
steam
crumbs
sparks
paper confetti
large celebration particles
optional ambient light flicker
```

Profile on real phones before migrating anything.

Suggested migration trigger:

```text
p95 frame > 16.7ms
OR
>5% visibly dropped frames
under:
  8 tickets
  8 plates
  6 cooking items
  interrupt character
  30 particles
on your minimum target Android
```

If that fails after normal DOM optimization, migrate **only the pass/station visual field to PixiJS**.

Pixi v8 provides WebGL/WebGPU rendering and is fundamentally a rendering library; Phaser is a broader game framework with its own scene/game-loop abstractions. citeturn5search1turn5search3 Because HANDS! already possesses a deterministic simulation, runtime, event system and React UI, Pixi is the less invasive escalation path. **Phaser would duplicate machinery you already own.**

Migration cost estimate:

```text
DOM → hybrid Pixi pass field:   ~1–2 weeks
DOM → full Pixi game UI:        ~3–6+ weeks
DOM → Phaser rewrite:           not justified
```

### PWA first, Capacitor for stores

Capacitor v8 explicitly supports dropping into an existing modern web project and exposing native iOS/Android functionality while preserving the web codebase. citeturn22search0turn22search2

Recommended sequence:

```text
Today:
Vercel mobile web build
+ manifest
+ service worker
+ offline assets
+ installable PWA

After the mobile loop proves fun:
Capacitor
├── iOS
└── Android
    ├── native haptics
    ├── system share
    ├── safe-area handling
    └── store packaging
```

Apple's current review guideline 4.2 says apps need features, content and UI that elevate them beyond a repackaged website and provide lasting entertainment or utility. A real game with native haptics, offline behavior and a properly adapted UI is much better positioned than a literal website wrapper. citeturn22search4

For offline play, bundle menu/night/audio/art assets and run career/daily simulation locally. A daily seed can be generated offline. Only leaderboard submission needs connectivity.

### Audio latency

Keep Howler initially. Require the first explicit `START SHIFT` interaction to unlock/resume audio. Test on physical iPhones rather than assuming desktop-browser behavior predicts Safari/WebView behavior.

Only migrate latency-sensitive SFX to a native audio plugin if instrumented device testing shows an audible input-to-sound delay. The printer bed and ambience can remain streamed/HTML5-style as the current decision log already does. fileciteturn0file2

### Market size

The niche is considerably larger than "chefs on Reddit."

The National Restaurant Association reported in March 2026 that U.S. restaurant and foodservice employment was about **15.7 million**, including roughly 12.5 million jobs at eating/drinking places, and reported survey results in which **67% of U.S. adults said they had worked in restaurant/foodservice at some point**. The Association calls it the nation's second-largest private-sector employer. citeturn23search1 By September 2026, it continued to report a restaurant/foodservice workforce above 15.7 million. citeturn23search0

That 67% number is **industry-association survey data, not a BLS census**, so it should not be treated as exact population prevalence. But the broad conclusion is robust: restaurant experience is mainstream, not an ultra-niche cultural reference.

The addressable audience therefore has concentric rings:

```text
Core:
current/past expos, cooks, servers, bartenders, managers

Affinity:
anyone who has worked restaurant service

Genre:
time-management / cooking-game players

Strategy:
Mini Metro / puzzle optimization players

Spectator:
people who understand "restaurant chaos"
from work, media or creator content
```

The theme can therefore be restaurant-insider authentic **without requiring insider knowledge to understand the rules**.

### Content that should land

High-confidence restaurant-specific material:

```text
printer won't stop
"Where's my 31?"
86 salmon
"HEARD"
"ON THE FLY"
server standing in the window
birthday eight-top at the worst possible moment
bar asks you to hold food
manager suddenly says "VIP"
the one plate dying while waiting for one side
grill yelling for an all-day count
finally clearing the rail
printer immediately starts again
```

"Fire," "hands," "heard," "86," "on the fly," "pass/window" and related vocabulary are standard restaurant terms in current operational glossaries. citeturn17search18turn17search9

Avoid making FOH or BOH a permanent villain. Industry workers will recognize the archetypes more affectionately if everybody is occasionally competent and occasionally a disaster.

### Market gap

The restaurant-game market is crowded with **cooking**, **serving**, **restaurant-building**, and **order-assembly** games. The reviewed major comps do not center the entire game on being the expediter who determines **when food starts, whether it leaves, and how the kitchen/floor synchronize**. That is HANDS!' strongest positioning distinction. This is a **market-scan judgment, not proof that no expo game exists anywhere**.

The pitch should eventually become simpler than the GDD:

> **You're not the cook. You're the person trying to make the whole restaurant land at once.**

That is understandable to non-industry players and delightfully specific to industry players.

### Distribution strategy

For restaurant workers, the best creative is likely **recognition content**, not polished cinematic advertising:

```text
POV: grill says "two minutes" for the fourth time

POV: server asks "where's 31?"
while 31 is literally in their hands

THE PRINTER AFTER YOU FINALLY CLEAR THE RAIL

Can you run expo?
Daily Seed 10/15 — 18,420. Beat it.
```

Use short vertical game clips for TikTok/Reels/Shorts, restaurant humor creators, chef/server creators and communities such as KitchenConfidential/Serverlife **in ways consistent with their self-promotion rules**. This channel recommendation is judgment rather than a measured acquisition claim.

### Monetization

The category supports multiple models: 1010! is free with IAP; Cooking Fever uses a long-running F2P progression model; TapBlaze has publicly discussed using ads/live events in scaling *Good Pizza, Great Pizza*; premium titles such as *Cook, Serve, Delicious!* show that service games can also be sold conventionally. citeturn12search2turn10search0turn20search12turn9search0

**Recommended model: free demo + one-time premium unlock.**

Example:

```text
Free:
Night 1
Night 2
rotating demo Daily
local best scores

One-time $5–8 range, test exact price:
full five-night first restaurant
Saturday mode
Daily Service
future base-career content

Optional supporter cosmetics:
ticket paper
pass skins
title badges
sound/visual themes
```

No rewarded ad during a shift. No energy. No gems. No "faster grill for $4.99." No consumable second chances.

Restaurant workers are the game's evangelists; nickel-and-diming the people you're trying to make say "holy shit, this is my job" would be strategically stupid.

## Validation plan and build roadmap

### Instrument the game around decisions, not just outcomes

The current bot already reports failure, health, grades, times and mistakes. fileciteturn0file2 Add:

| Metric | Definition | Initial target |
|---|---|---:|
| **FTUE completion** | Started tutorial → first shift complete | **≥80% playtest** |
| **Time to first meaningful input** | launch shift → FIRE | **<15 s** |
| **Time to first successful HANDS!** | shift start → first sent course | **<45 s** |
| **Mis-tap rate** | action canceled/undo within 500ms or wrong UI target | **<2%** |
| **Visual check median time** | open CHECK → GOOD/REFIRE | **1.0–2.5 s after learning** |
| **Check accuracy** | correct classification | novice 85%+, experienced 95%+ |
| **Meaningful decisions/min** | FIRE/hold/prioritize/check/interrupt choices, excluding navigation | **8–14** judgment target |
| **Strategic FIRE rate** | courses where player deliberately staggers items when useful | **>25% by Night 3** |
| **Station overflow frequency** | queued fire events / course | 0.3–1.0 on later nights |
| **Pass congestion** | time at ≥75% pass capacity | 10–25% of difficult shift |
| **Perfect sync frequency** | eligible courses within perfect window | novice 20–30%, expert 60%+ |
| **Combo uptime** | time multiplier >1 | 35–65% successful shift |
| **Clean-board count** | times live ticket count reaches zero after rush | ≥1–3/shift |
| **Recovery success** | entered Heat critical → escaped | **30–50%** |
| **Death-spiral rate** | failure after continuous high pressure with no meaningful recovery window | **<15% of losses** |
| **Idle time** | no input while actionable problem exists | track by skill level |
| **Attention-switch cost** | mistakes within 5s of interruption | compare interrupt types |
| **Quit-before-result** | manual exit after shift start | **<10%** |
| **Retry rate after loss** | loss → immediate retry | **>40%** is promising |
| **Second-shift conversion** | first shift finished → another shift started | **>60% playtest goal** |

### Bot additions

For every seed, record a pressure trace:

```ts
{
  lateCourseCountByTick,
  heatByTick,
  stationQueueDepthByTick,
  passOccupancyByTick,
  comboByTick,
  playerActionByTick,
  opportunityStateByTick
}
```

Derive:

```text
deathSpiral =
  failed &&
  timeAboveHeat75 > 30s &&
  maxRecoveryDuringThatPeriod < 10

decisionDensity =
  meaningfulActions / activeMinutes

overfireRate =
  firesIntoFullStation / totalFires

avoidableQueueDelay =
  stationQueueDelay attributable to firing choice

syncOpportunityConversion =
  perfectSyncs / technicallyAchievablePerfectSyncs

passPanicRate =
  seconds(passOccupancy >= 5) / shiftSeconds

interruptDamageCorrelation =
  mistake within 5s after interrupt / interrupts

checkTax =
  totalCheckInteractionMs / totalActivePlayMs
```

This lets the bot tell you whether a balance change is genuinely creating strategy or merely increasing workload.

### Bot balance targets

Do not tune only around fail percentage.

Suggested average-bot career curve:

```text
Night 1:  0–5% fail
Night 2:  5–15%
Night 3: 15–25%
Night 4: 25–40%
Night 5: 35–50%
```

Your current `0 / 15 / 20.5 / 40.5 / 55` is already near that shape. fileciteturn0file2 The bigger target should be:

```text
expert fail <5%
BUT
expert cannot maximize score by simply firing everything immediately
```

That second condition is more important than shaving five percentage points off Night 5.

Run a strategy ablation:

```text
expert_normal
expert_fire_everything_ASAP
expert_never_item_stagger
expert_ignore_station_load
expert_ignore_sync
expert_never_check
```

A healthy design should produce:

```text
expert_normal > 20–30% score advantage
over naive ASAP play

while both may still technically survive
early nights
```

That proves strategy is being rewarded rather than merely described.

### Human playtest protocol

Use three cohorts:

```text
A: active/former restaurant workers
B: cooking/time-management players
C: neither
```

After each first shift ask only:

```text
"What were you trying to get better at?"

"What caused your biggest mistake?"

"What was your best moment?"

"What would you do differently next run?"
```

Good answers:

```text
"I fired the steak too late."
"I buried grill."
"I got the whole four-top up together."
"I shouldn't have sent that side."
"I should've held 18."
```

Bad answers:

```text
"I couldn't read the text."
"I couldn't find the button."
"I didn't know why health dropped."
"I guess I needed to click faster."
```

The verbal model players form is more diagnostic than asking, "Was it fun?"

### A/B tests after launch

| Test | A | B | Primary metric |
|---|---|---|---|
| CHECK | text card | visual aligned icons | check time, accuracy, D1 |
| FIRE control | inline buttons | ticket + bottom action dock | mis-taps, action latency |
| Gestures | buttons only | gestures + button fallback | actions/min, error rate |
| Failure | old Service Health | recoverable Heat | completion, retry-after-loss |
| Interrupt | separate door | overlay character tray | post-interrupt errors, subjective frustration |
| Success feedback | basic | full combo/juice stack | second-shift conversion |
| Strategy | infinite station capacity | visible 2-slot capacity | stagger use, replay score spread |
| FTUE | title instruction note | learn-by-doing first minute | tutorial completion |
| Daily entry | menu tile | post-result CTA | daily participation |
| Share | plain score | receipt image | share-sheet opens/completions |

Do not simultaneously A/B five mechanics on a small audience. Run tests that answer one design question.

### Build roadmap

Each phase assumes approximately one to two weeks for one owner using coding agents. Art-heavy phases may spill longer.

| Phase | Build order | Definition of done |
|---|---|---|
| **Mobile foundation** | Portrait shell, large hit areas, contextual action dock, snap rail, safe areas, responsive typography, telemetry events | Night 1 is fully playable at 360×800 with no horizontal page scroll; every gameplay action has ≥44 px target; mis-tap instrumentation works |
| **Tactile CHECK** | PlateSchema, ordered/made icon comparison, discrepancy tapping, GOOD/REFIRE motion, allergy exception | Every current modifier has icon + text fallback; check median <3 s in internal tests; no gameplay mechanic depends on color alone |
| **Strategic FIRE** | Two station slots, deterministic queues, queue visualization, sync-quality scoring, station-load bot logic | ASAP firing measurably underperforms staggered expert play on selected multi-item seeds |
| **Failure + scoring** | Service Heat model, combo multiplier, caught-defect reward, critical recovery, clean-board event | No common Night 3–5 failure is an unstoppable >30s drain; score replay remains deterministic |
| **Feel pass** | FIRE stamp, plate weight, HANDS! sequence, score cascade, audio pitch ladder, canvas particles, reduced-motion equivalents | Every core verb produces immediate audio/visual response; stable p95 frame time on minimum Android target |
| **Progression** | stars, contracts, stubs, Daily Service, receipt sharing, Saturday mode | Player has at least three reasons to replay a cleared night; Daily runs entirely offline except leaderboard |
| **Content + visual identity** | final first-restaurant environment, dish art, character portraits, server personality barks, menu expansion | Gameplay screenshot has comparable perceived finish to title screen; every dish identifiable by silhouette |
| **Native ship** | PWA offline pass, Capacitor iOS/Android, haptics/share, device QA, store metadata/accessibility | Cold launch offline works; audio/haptics tested on physical iPhone + low/mid Android; store build satisfies native packaging requirements. citeturn22search0turn22search4 |
| **Post-launch validation** | analytics cohorting, controlled A/B tests, verified replay leaderboard | D1/D7 measured; crash-free and performance targets met; changes driven by observed funnel rather than intuition |

The key sequencing decision is **do not build the large career meta before rebuilding CHECK/FIRE/failure**. GameAnalytics' current benchmarks reinforce how unforgiving the first session is; long-term progression cannot rescue a core interaction people dislike. citeturn20search1

## Machine-readable appendix and sources

### Recommendation array

```json
[
  {
    "id": "CORE-001",
    "title": "Adopt the Rail-to-Pass core loop",
    "area": "core-loop",
    "impact": 5,
    "effort": 3,
    "confidence": 5,
    "depends_on": [],
    "systems_touched": ["sim", "ui", "audio", "bot"],
    "summary": "Keep the receive/fire/check/send simulation but express it as a portrait flow-management game with visible station capacity, physical pass congestion, visual checking and large success payoffs.",
    "evidence": ["S01", "S02", "S03", "S05", "S14", "S16"]
  },
  {
    "id": "CORE-002",
    "title": "Make station capacity real",
    "area": "core-loop",
    "impact": 5,
    "effort": 3,
    "confidence": 5,
    "depends_on": ["CORE-001"],
    "systems_touched": ["sim", "tuning", "ui", "bot"],
    "summary": "Give grill, saute and pantry two active slots by default; excess fired items queue visibly instead of every item cooking independently.",
    "evidence": ["S02", "S03", "S17"]
  },
  {
    "id": "CORE-003",
    "title": "Add finite pass capacity",
    "area": "core-loop",
    "impact": 4,
    "effort": 2,
    "confidence": 4,
    "depends_on": ["CORE-001"],
    "systems_touched": ["sim", "tuning", "ui", "bot"],
    "summary": "Represent the pass as approximately six physical plate positions so congestion becomes visible and spatial rather than another hidden timer.",
    "evidence": ["S05", "S16"]
  },
  {
    "id": "CORE-004",
    "title": "Make synchronized landing the primary mastery goal",
    "area": "core-loop",
    "impact": 5,
    "effort": 2,
    "confidence": 5,
    "depends_on": ["CORE-002"],
    "systems_touched": ["sim", "tuning", "ui", "audio", "bot"],
    "summary": "Increase the scoring, audiovisual feedback and progression value of landing a whole course together; expose landing spread as a quality metric.",
    "evidence": ["S02", "S16", "S17"]
  },
  {
    "id": "UX-001",
    "title": "Replace CHECK text diff with visual discrepancy matching",
    "area": "mobile-ux",
    "impact": 5,
    "effort": 2,
    "confidence": 5,
    "depends_on": [],
    "systems_touched": ["data", "ui", "audio"],
    "summary": "Show ordered and made dish components in aligned visual slots and ask the player to tap the mismatch or approve the plate.",
    "evidence": ["S13"]
  },
  {
    "id": "UX-002",
    "title": "Keep allergy handling procedural",
    "area": "mobile-ux",
    "impact": 5,
    "effort": 1,
    "confidence": 5,
    "depends_on": ["UX-001"],
    "systems_touched": ["sim", "data", "ui"],
    "summary": "Do not imply that allergens can be visually verified; retain ACK before fire, kitchen protocol and marked allergy plate workflow.",
    "evidence": ["S03"]
  },
  {
    "id": "UX-003",
    "title": "Use a portrait snap rail",
    "area": "mobile-ux",
    "impact": 5,
    "effort": 2,
    "confidence": 5,
    "depends_on": ["CORE-001"],
    "systems_touched": ["ui"],
    "summary": "Display two to three compact ticket cards with horizontal snap navigation instead of shrinking the existing desktop rail.",
    "evidence": ["S13", "S20", "S21"]
  },
  {
    "id": "UX-004",
    "title": "Adopt context-sensitive bottom actions",
    "area": "mobile-ux",
    "impact": 5,
    "effort": 2,
    "confidence": 5,
    "depends_on": ["UX-003"],
    "systems_touched": ["ui"],
    "summary": "Remove tiny inline FIRE/HANDS controls; select a ticket or plate and expose 48-64px contextual actions near the thumb.",
    "evidence": ["S20", "S21"]
  },
  {
    "id": "UX-005",
    "title": "Offer gestures as accelerators, not requirements",
    "area": "mobile-ux",
    "impact": 3,
    "effort": 2,
    "confidence": 5,
    "depends_on": ["UX-004"],
    "systems_touched": ["ui"],
    "summary": "Support swipe-to-fire and drag-to-ticket for experienced players while retaining equivalent tap/button controls.",
    "evidence": ["S21", "S19"]
  },
  {
    "id": "UX-006",
    "title": "Replace the blocking door memory quiz",
    "area": "mobile-ux",
    "impact": 4,
    "effort": 2,
    "confidence": 4,
    "depends_on": ["CORE-001"],
    "systems_touched": ["sim", "data", "ui", "bot"],
    "summary": "Keep server, bar and manager interruptions but present them as a character tray over the live board and favor priority/hold/resource decisions over hidden-state trivia.",
    "evidence": ["S03", "S14", "S16"]
  },
  {
    "id": "DIFF-001",
    "title": "Replace Service Health with recoverable Service Heat",
    "area": "difficulty",
    "impact": 5,
    "effort": 2,
    "confidence": 5,
    "depends_on": [],
    "systems_touched": ["sim", "tuning", "ui", "audio", "bot"],
    "summary": "Invert the meter to 0-100 pressure, cap aggregate lateness accumulation, add passive and success-based recovery, and require sustained critical heat before shift failure.",
    "evidence": ["S02", "S03", "S05"]
  },
  {
    "id": "DIFF-002",
    "title": "Reward caught defects",
    "area": "difficulty",
    "impact": 4,
    "effort": 1,
    "confidence": 5,
    "depends_on": ["UX-001"],
    "systems_touched": ["sim", "tuning", "ui", "audio"],
    "summary": "A correct REFIRE should award a SAVE bonus, preserve the streak and reduce Service Heat rather than merely avoiding punishment.",
    "evidence": ["S16"]
  },
  {
    "id": "DIFF-003",
    "title": "Add a critical recovery window",
    "area": "difficulty",
    "impact": 4,
    "effort": 1,
    "confidence": 4,
    "depends_on": ["DIFF-001"],
    "systems_touched": ["sim", "tuning", "ui", "audio", "bot"],
    "summary": "At 100 Heat trigger an approximately eight-second manager warning; dropping below the recovery threshold cancels failure.",
    "evidence": ["S05"]
  },
  {
    "id": "PROG-001",
    "title": "Add a clean-service multiplier",
    "area": "progression",
    "impact": 5,
    "effort": 2,
    "confidence": 5,
    "depends_on": ["CORE-004"],
    "systems_touched": ["sim", "tuning", "ui", "audio", "bot"],
    "summary": "Grow a 1x-3x multiplier through clean courses and perfect service, breaking it on escaped plate errors and major service mistakes.",
    "evidence": ["S15"]
  },
  {
    "id": "PROG-002",
    "title": "Use sequential scoring feedback",
    "area": "progression",
    "impact": 4,
    "effort": 2,
    "confidence": 5,
    "depends_on": ["PROG-001"],
    "systems_touched": ["ui", "audio"],
    "summary": "Reveal plate, synchronization, freshness and multiplier contributions one after another instead of jumping directly to one opaque score.",
    "evidence": ["S15", "S26"]
  },
  {
    "id": "PROG-003",
    "title": "Add optional shift contracts",
    "area": "progression",
    "impact": 4,
    "effort": 2,
    "confidence": 4,
    "depends_on": ["PROG-001"],
    "systems_touched": ["data", "tuning", "ui"],
    "summary": "Attach two or three mastery goals such as no dead plates, three perfect tables or no station overfires to existing shifts.",
    "evidence": ["S06", "S08"]
  },
  {
    "id": "PROG-004",
    "title": "Ship deterministic Daily Service",
    "area": "progression",
    "impact": 4,
    "effort": 2,
    "confidence": 5,
    "depends_on": ["PROG-001"],
    "systems_touched": ["sim", "data", "ui", "bot"],
    "summary": "Generate one globally consistent shift from UTC date plus rules/content version, initially playable entirely offline.",
    "evidence": ["S03", "S12"]
  },
  {
    "id": "PROG-005",
    "title": "Use replay verification for leaderboards",
    "area": "progression",
    "impact": 3,
    "effort": 3,
    "confidence": 5,
    "depends_on": ["PROG-004"],
    "systems_touched": ["sim", "bot"],
    "summary": "Later submit seed and action log to a serverless validator that replays the deterministic sim before accepting a leaderboard score.",
    "evidence": ["S03"]
  },
  {
    "id": "PROG-006",
    "title": "Create shareable end-of-shift receipts",
    "area": "progression",
    "impact": 4,
    "effort": 1,
    "confidence": 4,
    "depends_on": ["PROG-001"],
    "systems_touched": ["ui"],
    "summary": "Render a vertical receipt showing perfect tables, saves, max rail, combo, grade and Daily rank for system sharing.",
    "evidence": ["S12"]
  },
  {
    "id": "PROG-007",
    "title": "Expand career through restaurants and cuisines",
    "area": "content",
    "impact": 5,
    "effort": 5,
    "confidence": 4,
    "depends_on": ["CORE-001", "PROG-001"],
    "systems_touched": ["data", "tuning", "ui", "audio", "bot"],
    "summary": "After the first restaurant is proven fun, reuse the simulation with distinct menus, modifiers, service rhythms, characters and house rules.",
    "evidence": ["S07", "S08", "S10"]
  },
  {
    "id": "PROG-008",
    "title": "Avoid permanent pay-to-win upgrades",
    "area": "progression",
    "impact": 4,
    "effort": 1,
    "confidence": 5,
    "depends_on": [],
    "systems_touched": ["data", "tuning"],
    "summary": "Prefer cosmetic progression and equipment sidegrades; do not sell or grind permanent cook-speed advantages that erase player skill.",
    "evidence": ["S01"]
  },
  {
    "id": "FEEL-001",
    "title": "Create a signature HANDS send sequence",
    "area": "feel",
    "impact": 5,
    "effort": 2,
    "confidence": 5,
    "depends_on": ["CORE-004"],
    "systems_touched": ["ui", "audio"],
    "summary": "Stack approved plates, accelerate them out of the pass, tear the ticket, call HANDS and trigger sequential score feedback.",
    "evidence": ["S26"]
  },
  {
    "id": "FEEL-002",
    "title": "Add audio pitch stepping to streaks",
    "area": "feel",
    "impact": 4,
    "effort": 1,
    "confidence": 5,
    "depends_on": ["PROG-001"],
    "systems_touched": ["audio"],
    "summary": "Use several escalating variants or small pitch changes so successive successful sends audibly build momentum.",
    "evidence": ["S15", "S26"]
  },
  {
    "id": "FEEL-003",
    "title": "Use local restrained screen shake",
    "area": "feel",
    "impact": 3,
    "effort": 1,
    "confidence": 5,
    "depends_on": [],
    "systems_touched": ["ui"],
    "summary": "Shake only the pass/environment by a few pixels for major events, never the ticket text, and disable under reduced motion.",
    "evidence": ["S26"]
  },
  {
    "id": "FEEL-004",
    "title": "Move particles to a pooled canvas overlay",
    "area": "feel",
    "impact": 3,
    "effort": 2,
    "confidence": 5,
    "depends_on": [],
    "systems_touched": ["ui"],
    "summary": "Keep interaction and text in DOM while using a small pooled canvas system for steam, crumbs, paper flecks and celebration particles.",
    "evidence": ["S23"]
  },
  {
    "id": "FEEL-005",
    "title": "Add native haptics after Capacitor",
    "area": "feel",
    "impact": 3,
    "effort": 2,
    "confidence": 5,
    "depends_on": ["TECH-003"],
    "systems_touched": ["ui", "audio"],
    "summary": "Use light FIRE feedback, medium correct-refire impact and success/error notification patterns; treat web vibration only as best effort.",
    "evidence": ["S22", "S27"]
  },
  {
    "id": "VIS-001",
    "title": "Adopt a pre-rendered night-shift diorama style",
    "area": "visual",
    "impact": 4,
    "effort": 3,
    "confidence": 4,
    "depends_on": ["CORE-001"],
    "systems_touched": ["ui"],
    "summary": "Use a fixed atmospheric kitchen background with crisp illustrated/pre-rendered interactive plates, tickets, stations and characters rather than either pure grey-box CSS or full real-time 3D.",
    "evidence": ["S01", "S03"]
  },
  {
    "id": "VIS-002",
    "title": "Make dishes readable by silhouette",
    "area": "visual",
    "impact": 5,
    "effort": 3,
    "confidence": 5,
    "depends_on": ["UX-001"],
    "systems_touched": ["data", "ui"],
    "summary": "Ensure each menu dish remains recognizable at roughly 80px and represent modifiers with redundant icon, shape and optional text.",
    "evidence": ["S05", "S20", "S21"]
  },
  {
    "id": "VIS-003",
    "title": "Close the title-to-gameplay fidelity gap",
    "area": "visual",
    "impact": 4,
    "effort": 3,
    "confidence": 5,
    "depends_on": ["VIS-001"],
    "systems_touched": ["ui"],
    "summary": "Carry the heat-lamp atmosphere and physical restaurant identity promised by the title screen into the playable pass while preserving high mobile contrast.",
    "evidence": ["S01"]
  },
  {
    "id": "TECH-001",
    "title": "Keep the deterministic simulation architecture",
    "area": "tech",
    "impact": 5,
    "effort": 1,
    "confidence": 5,
    "depends_on": [],
    "systems_touched": ["sim", "bot"],
    "summary": "Retain pure TypeScript simulation, fixed 20Hz stepping, seeded RNG and event-driven UI/audio separation.",
    "evidence": ["S02", "S03"]
  },
  {
    "id": "TECH-002",
    "title": "Keep DOM and CSS as the primary renderer",
    "area": "tech",
    "impact": 4,
    "effort": 1,
    "confidence": 5,
    "depends_on": ["TECH-001"],
    "systems_touched": ["ui"],
    "summary": "Continue rendering tickets, controls, check UI and accessible hit targets in DOM/SVG; profile before adopting a game renderer.",
    "evidence": ["S23"]
  },
  {
    "id": "TECH-003",
    "title": "Package proven mobile build with Capacitor",
    "area": "tech",
    "impact": 4,
    "effort": 2,
    "confidence": 5,
    "depends_on": ["UX-003", "TECH-002"],
    "systems_touched": ["ui", "audio"],
    "summary": "Ship PWA during iteration, then wrap the validated web build with Capacitor for native stores, haptics, sharing and native lifecycle integration.",
    "evidence": ["S27", "S28"]
  },
  {
    "id": "TECH-004",
    "title": "Use Pixi only after measured rendering failure",
    "area": "tech",
    "impact": 3,
    "effort": 2,
    "confidence": 5,
    "depends_on": ["TECH-002"],
    "systems_touched": ["ui"],
    "summary": "If physical-device profiling exceeds frame-budget targets after DOM optimization, migrate only pass/station visuals to Pixi; do not rewrite the sim in Phaser.",
    "evidence": ["S23", "S24"]
  },
  {
    "id": "CONTENT-001",
    "title": "Turn all-day counts into readable strategy",
    "area": "content",
    "impact": 4,
    "effort": 2,
    "confidence": 5,
    "depends_on": ["CORE-002"],
    "systems_touched": ["sim", "ui", "bot"],
    "summary": "Expose compact per-station all-day counts after early onboarding and optionally use call-the-board challenges in Expert mode.",
    "evidence": ["S18"]
  },
  {
    "id": "CONTENT-002",
    "title": "Use low-stock warnings instead of inventory simulation",
    "area": "content",
    "impact": 3,
    "effort": 2,
    "confidence": 4,
    "depends_on": [],
    "systems_touched": ["data", "sim", "ui"],
    "summary": "Create occasional LOW warnings that make later 86s predictable without introducing numerical stock management.",
    "evidence": ["S16", "S18"]
  },
  {
    "id": "CONTENT-003",
    "title": "Make staff and equipment traits sidegrade modifiers",
    "area": "content",
    "impact": 3,
    "effort": 3,
    "confidence": 3,
    "depends_on": ["PROG-007"],
    "systems_touched": ["data", "tuning", "sim", "bot"],
    "summary": "Represent staffing or equipment as transparent per-shift trade-offs rather than opaque permanent stat progression.",
    "evidence": ["S06"]
  },
  {
    "id": "AUD-001",
    "title": "Position HANDS as an expo game, not another cooking game",
    "area": "audience",
    "impact": 5,
    "effort": 1,
    "confidence": 5,
    "depends_on": [],
    "systems_touched": ["data", "ui"],
    "summary": "Lead marketing with the distinctive fantasy of controlling timing and quality at the pass: 'You're not the cook; you're making the whole restaurant land at once.'",
    "evidence": ["S16", "S29"]
  },
  {
    "id": "AUD-002",
    "title": "Use restaurant-recognition humor",
    "area": "audience",
    "impact": 4,
    "effort": 2,
    "confidence": 4,
    "depends_on": ["AUD-001"],
    "systems_touched": ["data", "audio", "ui"],
    "summary": "Build shareable incidents around printer panic, 86s, on-the-fly refires, server status requests, pushes, VIPs and clean-board relief while keeping safety issues serious.",
    "evidence": ["S18", "S29"]
  },
  {
    "id": "AUD-003",
    "title": "Monetize through premium unlock and optional cosmetics",
    "area": "audience",
    "impact": 4,
    "effort": 2,
    "confidence": 4,
    "depends_on": ["PROG-007"],
    "systems_touched": ["ui", "data"],
    "summary": "Offer a meaningful free demo and one-time full unlock, with optional supporter cosmetics; avoid ads during service, energy systems and gameplay boosters.",
    "evidence": ["S07", "S08", "S10", "S30"]
  }
]
```

### Sources and evidence quality

**S01 — HANDS! deep-research brief, supplied October 15, 2026.** Primary project requirement and owner's diagnosis. **Basis: primary project source.** fileciteturn0file0

**S02 — HANDS! Game Design Document, October 6, 2026.** Current source of truth for pitch, loop, verbs, scoring, nights and scope. **Basis: primary project source.** fileciteturn0file1

**S03 — HANDS! Decision Log, through October 15, 2026.** Current implementation and balance decisions including deterministic architecture, bot results, presentation, 86s, interrupts, cook-time modifiers and progress. **Basis: primary implementation source.** fileciteturn0file2

**S04 — GameAnalytics, 2026 Mobile & PC Gaming Benchmarks, published 2026 using 2025 data.** More than 16,000 mobile games; D1/D7/D30, session-length and geographic benchmark distributions. This is broad-market telemetry, not a HANDS!-specific forecast. **Basis: data; high confidence, applicability medium.** citeturn20search1

**S05 — Ghost Town Games / Phil Duncan, Overcooked development deep dive, 2016.** Documents simple controls, deliberately introduced coordination problems, icon simplification and replacement of a punitive life-loss model. **Basis: developer primary/expert retrospective; high confidence.** citeturn7search0

**S06 — PlateUp! official press material and product documentation, accessed October 2026.** Procedural runs, rapid interactions, random upgrades and meaningful between-session choices. **Basis: developer/publisher source.** citeturn8search7turn8search0

**S07 — Vertigo Gaming / Cook, Serve, Delicious! official materials, accessed October 2026.** Career mastery and CSD3's large level/food library and gameplay-affecting modules. **Basis: developer/product source.** citeturn9search7turn9search0

**S08 — Nordcurrent, Cooking Fever official materials, accessed October 2026.** Large location/level progression and timer/customer happiness structures. **Basis: publisher source.** citeturn10search0turn10search1

**S09 — Gamezebo Diner Dash guides, historical.** Chaining, patience and differing rush/calm strategies. Useful secondary analysis but not a primary developer source. **Basis: secondary expert/gameplay guide; medium confidence.** citeturn10search4turn10search11

**S10 — TapBlaze, Good Pizza, Great Pizza press material and current store presence, accessed October 2026.** Order-decoding, upgrades, quests, social/story features and large mobile reach. Some historical download/player numbers in the press kit date from 2023 and should not be treated as current. **Basis: publisher marketing + store data; medium-high confidence.** citeturn11search0turn11search13

**S11 — Zynga/Gram Games, 1010!, accessed October 2026.** Simple drag-and-place line clearing, high-score loop and modern Adventure/weekly content. **Basis: publisher/store source.** citeturn12search18turn12search2

**S12 — Dinosaur Polo Club, Mini Motorways official pages, accessed October 2026.** Dynamic network pressure, upgrades, colorblind modes, daily/weekly challenges, leaderboards and shareable layouts. **Basis: developer source; high confidence.** citeturn12search4turn12search14

**S13 — Lucas Pope, “Cramming Papers, Please Onto Phones,” 2022.** Primary account of redesigning document manipulation, inspection and navigation for smaller touchscreens and removing repeated friction. **Basis: developer primary source; very high confidence.** citeturn13search3

**S14 — Subset Games, FTL GDC postmortem, 2013.** Describes designing around the desired experience and iterating/abandoning mechanics accordingly. **Basis: developer primary source.** citeturn14search0turn14search7

**S15 — LocalThunk interview, The Washington Post, September 26, 2024.** Discusses Balatro's systems-first appeal, pleasant interface and satisfying audiovisual feedback. **Basis: creator interview through reputable press; high confidence.** citeturn14search6

**S16 — 7shifts expeditor guidance and current expo job descriptions, 2025–2026.** Ticket management, QC, coordinated table completion, 86s, allergy communication, FOH/BOH liaison and pacing. **Basis: industry training/job consensus; high confidence for role description.** citeturn17search5turn17search1turn17search6

**S17 — Toast platform documentation, accessed October 2026.** Item and modifier prep-time firing, course-specific schedules and expediter override demonstrate that staggered firing for synchronized completion is a real operational problem. **Basis: primary industry software documentation.** citeturn17search3

**S18 — Toast restaurant terminology / all-day guidance and kitchen-parlance sources, accessed 2026.** Supports standard use of all-day totals, fire, hands, heard, 86, on-the-fly, pass and related vocabulary. **Basis: industry documentation; high confidence on terminology.** citeturn17search9turn17search18turn18search2

**S19 — Lightspeed Kitchen touchscreen documentation, accessed October 2026.** Demonstrates touch KDS patterns such as tap, double tap and horizontal swiping through ticket pages. This is operational UI evidence, not a game-design prescription. **Basis: primary product documentation.** citeturn17search15

**S20 — Apple UI design guidance, accessed October 2026.** Recommends roughly 44×44-point touch targets and legible mobile presentation. **Basis: platform primary guidance.** citeturn2search7turn2search10

**S21 — W3C WCAG 2.2 target-size and dragging guidance.** Provides minimum target and alternative-to-drag accessibility requirements. **Basis: web standard; very high confidence.** citeturn2search2turn2search6

**S22 — MDN Vibration API documentation, accessed 2026.** Vibration is limited-availability and requires appropriate user activation; therefore it should not be treated as a universal web haptics layer. **Basis: authoritative technical reference.** citeturn3search0turn3search3

**S23 — web.dev animation performance guidance.** Transform/opacity are the preferred inexpensive animation path; a 60 Hz display gives roughly a 16.7 ms complete frame budget. **Basis: authoritative web-performance guidance.** citeturn5search16

**S24 — PixiJS and Phaser official documentation, current 2026 versions.** Pixi offers focused WebGL/WebGPU rendering while Phaser is a broader 2D game framework. **Basis: primary technical documentation.** citeturn5search1turn5search3

**S25 — Celia Hodent GDC onboarding/engagement material and Tencent's 2024 F2P onboarding talk.** Both emphasize first-minute engagement, clarity of goal and learning through effective early interaction. **Basis: expert/practitioner research; high confidence directionally.** citeturn20search2turn20search4

**S26 — Martin Jonasson & Petri Purho, “Juice It or Lose It,” 2012; Jan Willem Nijman, “The Art of Screenshake,” 2013.** Classic demonstrations of layered audiovisual feedback and responsive motion increasing perceived impact without requiring more mechanical complexity. **Basis: influential practitioner demonstrations, not controlled experiments.** citeturn21search1turn21search14turn21search17

**S27 — Capacitor v8 documentation, accessed October 2026.** Modern web projects can be packaged for iOS/Android while retaining web code and gaining native APIs. **Basis: primary framework documentation.** citeturn22search0turn22search2

**S28 — Apple App Review Guidelines, current 2026 revision.** Guideline 4.2 requires an app to offer features/content/UI beyond a repackaged website and provide meaningful utility or lasting entertainment. **Basis: primary platform policy; time-sensitive, verified October 2026.** citeturn22search4

**S29 — National Restaurant Association workforce data, March–October 2026.** Reports roughly 15.7 million U.S. restaurant/foodservice jobs and a survey in which 67% of adults reported having worked in the industry. The employment numbers are industry/BLS-grounded; the 67% figure is survey-based. **Basis: industry data, high confidence on employment, medium-high on survey generalization.** citeturn23search0turn23search1turn23search3

**S30 — TapBlaze/Kooapps/HyperBeard GDC F2P session, accessed 2026.** Discusses organic growth, retention, ads and live events behind large mobile titles including Good Pizza, Great Pizza. Useful for understanding prevailing F2P practice, not evidence that HANDS! should copy it. **Basis: practitioner business evidence; medium-high confidence.** citeturn20search12

The highest-confidence conclusion from the research is not that HANDS! needs more systems. It is almost the opposite. **The prototype already contains enough systems for a very good game. The next leap comes from making its existing intelligence visible, tactile and rewarding:** FIRE should feel like committing scarce kitchen capacity; CHECK should feel like spotting a discrepancy; HANDS! should feel like cashing in a plan; a clean board should feel fantastic; and getting buried should produce a recoverable, readable restaurant story rather than watching a health bar slowly finish you off.