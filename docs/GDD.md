# HANDS! — Game Design Document

> Working title. Status: Phase 0 draft, 2026-10-06. Source of truth for _what_ we build.
> Sources: `docs/research/02-dynamics.md` (primary), `03-aesthetic.md`, `01-stack.md`.
> Conflicts and gaps resolved here are logged in `docs/DECISIONS.md`.

---

## 1. Pitch

You work the expo window of a busy restaurant. Tickets chatter out of the printer, plates land under the heat lamps, and everyone (servers, the manager, the bar, the line) wants something from you right now. You never cook. You decide **when** food is made and **whether** it's allowed to leave.

Fixed first-person POV, a few switchable views, nostalgic low-fi indie presentation. FNAF-style _structure and mood_ (nights, a clock, a fixed post, sound as the main threat channel) with **no horror and no FNAF IP**. The threat is information overload.

**Design principle:** _The player loses because they lost the thread, not because they failed a twitch minigame._

## 2. Core loop

> **Read each incoming ticket, decide when to fire it, then approve or reject the finished food before mounting ticket times and a cluttered window turn the shift into a meltdown.**

```
RECEIVE ──▶ PARSE ──▶ FIRE ──▶ (kitchen cooks, unseen) ──▶ CHECK ──▶ SEND or REFIRE ──▶ CLEAR
   ▲  printer sound      read      commit to the line            plates hit       "HANDS!"
   └──────────────── interrupts arrive at any point and steal attention ────────────────┘
```

The strongest strategic idea is **synchronized completion, not raw speed**. A player who fires everything immediately should often do worse than one who holds and staggers so a table's plates land together.

## 3. Player verbs

| Verb                | What the player does                                             | Sim effect                                                                        | Phase |
| ------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------- | ----- |
| **LOOK**            | Switch view (Pass ⇄ Floor)                                       | Changes which panel is visible; costs a ~150 ms transition                        | 2     |
| **FIRE**            | Fire a whole course, or a single item, from a ticket on the rail | Item(s) go `HELD → COOKING` at their station                                      | 2     |
| **CHECK**           | Open a plate in the window to read its build card                | Reveals exactly what the kitchen made (item, doneness, mods, sides, allergy pick) | 2     |
| **SEND** ("HANDS!") | Send a table's course from the window                            | Plates leave; course `SENT`; ticket clears when all courses are sent              | 2     |
| **REFIRE**          | Reject a plate                                                   | Plate is binned; the item is remade _on the fly_ (shorter cook)                   | 2     |
| **ANSWER**          | Respond to an interrupt (pick a choice)                          | Resolves the interrupt; score effect depends on correctness and timing            | 2     |
| **ACK ALLERGY**     | Flag an allergy ticket to the line before firing                 | Kitchen follows protocol; allergy plates arrive marked                            | 3     |
| **RESOLVE 86**      | Substitute or void an item that got 86'd                         | Unblocks the ticket                                                               | 3     |

**HOLD is a state, not a button.** Every unfired course is held by default; the player holds by _not firing_. Tickets can print with `COURSE 2 - HOLD`, which means "don't fire until the table is ready" (server fire request or app cleared). Firing a held course early is legal but punished when its food lands before the table is ready. Logged as D-011.

### Controls (grey-box)

Mouse-first. Click a ticket to select it. On the selected ticket, click **FIRE** for a course, or click an item line to fire just that item. Click a plate to CHECK it. Then SEND or REFIRE from the build card. `A`/`D` or `←`/`→` switch views. `` ` `` toggles the debug overlay. Keyboard shortcuts for every verb are a Phase 4 nicety.

## 4. The space (views)

The player stands at the pass. MVP has **two views**; more come in v2.

| View               | Contents                                                                                                                                                                                               | Why it exists                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| **PASS** (default) | Ticket rail across the top (oldest left), the window/heat-lamp shelf in the center with plates, the printer at the side, and the 86 clipboard. A small wall clock shows service time (5:00 PM onward). | Where the core loop happens.                                                                |
| **FLOOR**          | The swing door to the dining room. Servers, the manager, and the bar back stand here waiting to talk to you.                                                                                           | Interrupts live here. While you're answering, you can't see the window. That's the tension. |

Interrupts announce themselves with sound plus a small edge indicator on the PASS view ("someone's at the door"). Looking away is the cost. No floating HUD beyond the clock and the Service Health indicator (D-013).

## 5. Simulation summary (what the player is managing)

- **Tickets** print on a schedule from shift data. A ticket has table, server, guest count, print time, 1–2 courses, items by seat with modifiers, optional note, optional allergy banner.
- **Stations:** GRILL, SAUTE, PANTRY. They're invisible timer producers. Each item has a cook tier (`quick` / `standard` / `long`) set in the menu data; tier durations live in the tuning file. Stations have no capacity limit in the MVP, but **station drag** (Phase 3) multiplies a station's cook times for a while.
- **Plates** arrive at the window when an item finishes. A plate is usually built correctly, but a per-night **defect rate** (plus scripted defects) produces a wrong mod, missing component, wrong doneness, or (rarely) the wrong dish.
- **Window age:** plates sitting too long **die** (−health, forced refire).
- **Ticket age:** a ticket that isn't fully sent by its grace time starts draining health every second.

## 6. Scoring and fail states

### Service Health (the one big meter)

Starts at **100**, capped at 100, shown as a single bar. All weights live in `src/config/tuning.ts`. These are the starting values from report 02; we'll tune them with the headless balancer.

| Event                                                                               | Health                             |
| ----------------------------------------------------------------------------------- | ---------------------------------- |
| Ticket late (per second past its grace time, per late ticket)                       | −1/s                               |
| Sent a plate with a wrong modifier, missing component, or wrong doneness            | −15                                |
| Sent the wrong dish                                                                 | −20                                |
| Rejected a bad plate (correct REFIRE)                                               | 0 health (the cost is time)        |
| Rejected a good plate (unnecessary REFIRE)                                          | −3                                 |
| Plate died in the window                                                            | −10 + forced on-the-fly refire     |
| Sent an incomplete course (some plates not up yet)                                  | −8                                 |
| Food landed before the table was ready (fired a held course early)                  | −5                                 |
| Completed a table (all courses sent, no escaped errors)                             | +5                                 |
| Synchronized course (all plates landed within the sync window)                      | +3                                 |
| Interrupt answered correctly / wrongly / ignored to timeout                         | 0 / −5 / −5                        |
| Fired an 86'd item (Phase 3)                                                        | −10                                |
| **Allergy incident**: sent an allergy-seat plate without its allergy pick (Phase 3) | −50; **ends the shift on Night 5** |

### Fail

**Service Health reaches 0:** "The manager pulls you off expo." The shift ends immediately.

### Win

Survive until the printer stops (end of the shift's printing window), then clear every live ticket. Overtime is capped (`tuning.shift.overtimeCapMs`). If the cap hits with tickets still live, each remaining ticket costs a flat penalty and the shift ends.

### End-of-shift summary

| Metric                  | Measures                                          |
| ----------------------- | ------------------------------------------------- |
| **Ticket Time**         | Average and worst print→sent time                 |
| **Accuracy**            | Bad plates caught vs. escaped                     |
| **Pass Control**        | Dead plates, incomplete sends, early-landed food  |
| **Interrupts**          | Answered correctly / wrongly / ignored            |
| **Final Service Score** | Weighted 0–100 → letter grade (weights in tuning) |

No kitchen morale, no per-table guest satisfaction, and no money in the MVP (report 02: invisible systems with no clean feedback).

## 7. Night progression (Nights 1–5)

Each night adds **one new mental obligation**. Harder nights attack working memory instead of just shrinking timers. Durations are printer time; tuning is final.

| Night | Name        | New obligation             | Content                                                                                                                                                     | Duration |
| ----- | ----------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **1** | The Window  | Read → fire → check → send | Single course, 5 mains, basic mods, scripted defects, one server status interrupt. Fully scripted timeline (report 02 timeline, compressed to 3:00, D-006). | 3:00     |
| **2** | Two Courses | Pacing                     | Apps + mains; `COURSE 2 - HOLD`; server **fire requests**; early-fire penalty; more seats per table. Scripted beats + procedural waves.                     | 3:30     |
| **3** | The Weeds   | Exceptions                 | Arrival waves, an **86**, **add-on** chits, kitchen **refire/on-the-fly** (dropped plate), higher defect rate.                                              | 4:00     |
| **4** | Saturday    | Protect attention          | **Allergy** tickets (ACK workflow), **station drag**, **bar delay**, more server interrupts (status + fire).                                                | 4:30     |
| **5** | Full House  | Everything                 | All of the above plus the **manager** (push a table, VIP), multiple refires, allergy incident ends the shift.                                               | 5:00     |

Nights unlock in order. Progress (highest night cleared, best grade per night, settings) saves to localStorage (Phase 3).

Pacing rule from report 02: **don't continuously increase pressure.** Every night has at least one quiet recovery beat before the final wave.

## 8. Interrupts (catalog)

Interrupts appear on the FLOOR view, have a patience timer, and should force the player to **make or remember a decision**. They aren't dialogs to dismiss. Defined in data (`src/data/interrupts.ts`).

| ID               | Source  | Line (example)                                    | Player response                                                                            | Consequence                                                                                      | Phase / Night |
| ---------------- | ------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ------------- |
| `server_status`  | Server  | "Where's my 31?"                                  | Pick the ticket's real status: NOT FIRED / COOKING / IN THE WINDOW / ALMOST (partially up) | Correct: 0. Wrong or timeout: −5                                                                 | Ph2 / N1+     |
| `server_fire`    | Server  | "Can I fire 21?"                                  | HEARD (acknowledge)                                                                        | The held course becomes ready; the late clock for course 2 starts                                | Ph3 / N2+     |
| `server_addon`   | Server  | "Seat 3 added fries on 18."                       | HEARD                                                                                      | A small add-on chit prints and attaches to the live ticket                                       | Ph3 / N3+     |
| `kitchen_86`     | Kitchen | "86 salmon!"                                      | (none; it's a bark)                                                                        | Unfired matching items are flagged; the player must RESOLVE 86 (sub or void). Firing it is −10   | Ph3 / N3+     |
| `kitchen_refire` | Kitchen | "Dropped the strip on 22, refiring!"              | (bark)                                                                                     | A plate or cooking item is lost; an on-the-fly refire starts automatically; a REFIRE chit prints | Ph3 / N3+     |
| `kitchen_drag`   | Kitchen | "Grill's dragging!"                               | (bark)                                                                                     | Station cook-time multiplier for N seconds                                                       | Ph3 / N4+     |
| `bar_delay`      | Bar     | "17's drinks are slow, hold their food a minute?" | HEARD                                                                                      | The table gets a not-before time; food sent before it is −5                                      | Ph3 / N4+     |
| `manager_push`   | Manager | "Push 14, they're complaining."                   | HEARD                                                                                      | That ticket's grace shrinks and its late drain doubles                                           | Ph3 / N5      |
| `manager_vip`    | Manager | "VIP on 8. Make it perfect."                      | HEARD                                                                                      | That ticket's error penalties double                                                             | Ph3 / N5      |

Kitchen barks don't block. Server, bar, and manager interrupts wait at the door until answered or timed out.

## 9. Menu (MVP content)

| ID           | Ticket name     | Course | Station | Cook tier | Doneness? | Default side |
| ------------ | --------------- | ------ | ------- | --------- | --------- | ------------ |
| `burger`     | HOUSE BURGER    | main   | grill   | standard  | yes       | FRIES        |
| `strip`      | NY STRIP        | main   | grill   | long      | yes       | POTATO       |
| `salmon`     | SALMON          | main   | saute   | standard  | no        | ASPARAGUS    |
| `chicken`    | HALF CHICKEN    | main   | saute   | long      | no        | POTATO       |
| `chop`       | CHOP SALAD      | main   | pantry  | quick     | no        | —            |
| `burrata`    | BURRATA         | app    | pantry  | quick     | no        | —            |
| `calamari`   | CRISPY CALAMARI | app    | saute   | quick     | no        | —            |
| `side_fries` | SIDE FRIES      | side   | pantry  | quick     | no        | —            |

Mod vocabulary: doneness (RARE, MED RARE, MEDIUM, MED WELL, WELL DONE), removals (NO ONION, NO PICKLE, NO CHEESE, NO BUTTER, NO TOMATO, NO POTATO), adds (CHEDDAR), sides (FRIES, POTATO, ASPARAGUS, BROCCOLI, SIDE SALAD, SUB …), and SAUCE ON SIDE. Each menu item lists which mods are legal.

Server names: MAYA, LUIS, JEN (fictional, from report 02's fixtures). No real POS or printer brand on tickets (D-015).

## 10. Scope contract

### MVP (Phases 1–3): this is the contract. Nothing outside this list gets built without approval.

**Phase 2 slice (Night 1 playable)**

- [ ] Fixed-timestep deterministic sim with seeded RNG; headless-capable
- [ ] Two views (PASS, FLOOR) with view switching
- [ ] Ticket rail: tickets print from shift data and hang in age order
- [ ] Verbs: FIRE (course and item), CHECK, SEND, REFIRE, ANSWER, LOOK
- [ ] Three invisible stations with cook timers; plates arrive at the window
- [ ] Plate defects (scripted + rate-based): wrong mod, missing component, wrong doneness, wrong dish
- [ ] Ticket age, window age, dead plates
- [ ] Service Health, fail state, win state, end-of-shift summary with grade
- [ ] One interrupt: `server_status`
- [ ] Placeholder audio through Howler: print beep, food-up beep
- [ ] Debug overlay (speed 0.5×–10×, pause, spawn ticket, trigger interrupt, jump to night, state view, seed)
- [ ] Night 1 scripted timeline (3:00)
- [ ] Unit tests: ticket lifecycle, scoring

**Phase 3 systems (Nights 1–5)**

- [ ] Two-course tickets, `COURSE 2 - HOLD`, early-fire penalty
- [ ] Interrupts: `server_fire`, `server_addon`, `kitchen_86` + RESOLVE 86, `kitchen_refire`, `kitchen_drag`, `bar_delay`, `manager_push`, `manager_vip`
- [ ] Expanded mods; allergy tickets with the ACK ALLERGY workflow and allergy-pick plates
- [ ] Nights 2–5 in data (scripted beats + procedural waves)
- [ ] Headless balancing script with a bot player; tuned config; metrics report
- [ ] Night unlocks, best grades, and settings saved to localStorage

**Phase 4 feel pass (after gameplay sign-off)**

- [ ] STYLE.md applied: printed-ticket look, print-in synced to printer audio, low-fi post-process, view framing
- [ ] Sourced audio (licensed and logged in ASSETS.md), ambient loop, layered SFX, voice barks
- [ ] 20+ tickets on screen at a stable frame rate
- [ ] Reduce-flicker/grain toggle and `prefers-reduced-motion`

### v2 (after the MVP proves fun)

- More views: printer close-up, dining-room camera/KDS monitor, walk-in clipboard
- Spatial rail interactions: drag to reorder, pin, tear
- "All day" callouts the player must answer ("How many salmon all day?")
- Station capacity/workload (overfiring slows a station)
- Runner interrupt: "Which seat gets this?"
- Keyboard-only play and rebinding
- Pre-shift voicemail/briefing (our own, not a soundalike)
- Pre-rendered Blender stills for every view (art pipeline)

### v3

- Endless "Saturday" procedural mode
- Distinct server personalities and behaviours
- Global leaderboards (Upstash Redis via a Vercel function, per report 01)
- Detailed post-shift stats (slowest table, best/worst ticket)
- Voice variants per character
- Multiple plate defects per plate; presentation/cleanliness defects

### Never (out of concept)

Cooking actions or recipes; inventory counts; money, comps, voids, or payments; reservations; pathfinding or animated characters walking; kitchen morale meters; jumpscares and horror; anything from FNAF; real POS or printer brands.
