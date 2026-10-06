# Restaurant Expo Simulator: Real Service Research and Ruthlessly Scoped Game Design

## The design conclusion

The real expeditor is not primarily a cook, waiter, or ticket clerk. Expo is the **real-time traffic controller between the dining room and the line**: maintaining a coherent picture of every live table, deciding or communicating when food should move, keeping multiple stations synchronized, catching bad plates before they leave, and preventing front-of-house requests from turning directly into kitchen chaos. Current Square documentation describes its KDS “Expeditor” mode almost exactly this way: expo bridges FOH and BOH, finalizes orders, maintains high-level visibility over prep stations, and controls tickets across the kitchen. Toast's current support documentation likewise defines its expediter as the consolidated view of items spread over multiple prep stations, used to make sure an order is complete before it reaches the customer. citeturn17view1turn21search30

That leads to a very specific game design.

> **Core MVP loop, in one sentence:** **Read each incoming ticket, decide when to fire it, then approve or reject the finished food before mounting ticket time and kitchen congestion turn the shift into a disaster.**

Do **not** initially build a complete restaurant simulator. Do not simulate inventory, reservations, server sections, money, recipes, bartender production, individual cook AI, realistic cooking interactions, or every bit of restaurant slang. The interesting job is maintaining a mental model while the information stream gets increasingly hostile.

The five-minute MVP should therefore make the player repeatedly do four things:

**Ticket arrives → understand it → commit it to the kitchen → verify the result.**

Everything else should eventually exist to interrupt or complicate those four actions.

This is unusually faithful to the real role. Actual expo workflows revolve around ticket sequencing, course timing, coordinating stations, checking completed plates and controlling communication at the pass. Restaurant training material describes the position as the organizing point for service, while BOH workers consistently describe good expo as the person who sees the whole board and gets separate stations to land a table together. citeturn21search9turn9view0turn9view1

The best design principle for the project is therefore:

**The player should lose because they lost the thread, not because they failed a twitch minigame.**

That is where the FNAF comparison works. The threat is informational overload.

## What an expeditor actually does

### The real service cycle

There is no universal minute-by-minute expo SOP. Fine dining, casual dining, hotel restaurants, steak houses and high-volume chains may divide the job differently; some kitchens have a chef or sous-chef doing BOH expo plus a separate FOH expo/runner, while smaller restaurants combine responsibilities. BOH cooks discussing the role explicitly note this variation: in one house expo breaks tickets into courses and calls the line; elsewhere the entire order fires immediately and expo mainly synchronizes stations and the window. citeturn9view0

But the recurring service cycle is remarkably consistent.

| Moment | What expo is actually thinking about |
|---|---|
| Before service | What is 86'd? What specials or substitutions are active? Any VIPs, large parties, allergy notes or menu changes? Is the pass stocked and clean? |
| Ticket appears | What table/order is this? How many guests? Apps? Entrées? Mods? Allergies? Add-ons? Anything unusual? |
| Seconds later | Which stations need this information? Does anything fire immediately, or is a later course held? |
| While food cooks | What else is already working? Which station is dragging? What is “all day”? Which tables are approaching a problem? |
| At the pass | Is the whole course here? Is every dish for the right seat/table? Are modifiers and accompaniments right? Is presentation acceptable? |
| Before release | Is an allergy procedure satisfied? Is there a missing plate? Is one dish dying while another station drags? |
| Handoff | Call for hands/a runner, communicate table and positions, then clear or advance the ticket. |
| Immediately afterward | Recalculate the entire board because three more tickets just printed and a server wants Table 42's mains now. |

A restaurant-specific MINA Group service manual gives an unusually detailed example of this workflow: tickets with allergies, VIPs and special requests are identified; first courses and entrée states are tracked separately; the chef/expo inspects dishes; plates are organized by seat; tickets move through stages such as appetizers fired, entrée cooking and entrée fired; and completed courses are marked and moved as service progresses. That manual describes an 8–12 minute countdown in its own restaurants and firing entrées relative to the departure of appetizers, but those figures are **house-specific standards, not industry-wide timing rules**. citeturn9view2

A current training-manual guide similarly treats expo instruction as four central skills: sequencing tickets across tables, checking plates, timing courses, and handling two-way communication between servers and kitchen. citeturn21search9

So an authentic expo isn't spending sixty seconds doing Activity A and sixty seconds doing Activity B. The job is more like:

> read → call → listen → scan rail → scan window → answer FOH → scan rail → correct plate → call station → send food → read next ticket

…often inside thirty seconds.

That rhythm is excellent game material.

### How tickets actually reach the kitchen

A modern POS can route an order differently by category or prep station rather than simply printing one universal receipt. Square, for example, lets restaurants send particular categories to particular printers, explicitly using bar drinks as one example, while an expo printer profile can receive **all** categories. Square even documents a full-service layout with separate hot, cold and expo profiles. citeturn15search14turn17view2

Toast's current 2026 expediter setup works on the same conceptual model: individual items may be tagged to different prep stations while the expediter receives a consolidated whole-order view. citeturn21search30

That gives you a strong authentic abstraction for the game:

```text
SERVER POS
    |
    +--> GRILL
    |
    +--> SAUTE
    |
    +--> PANTRY
    |
    +--> BAR
    |
    `--> EXPO: COMPLETE TICKET
```

In a paper kitchen, the little printer going *brrr-brrr-brrr* is effectively materializing that routing information.

One correction to the common image of the restaurant ticket printer: **kitchen printers are not necessarily thermal printers.** Thermal printers absolutely are used in restaurant systems, and Square supports thermal-specific ticket formatting, but impact/dot-matrix machines remain purpose-built for kitchens. Epson's current TM-U220II, for example, is an impact kitchen/receipt printer specifically engineered for restaurant heat and humidity. citeturn17view2turn18search5

For your game, that is actually good news. A noisy impact-printer sound is much more dramatically useful than a polite thermal receipt whisper.

### What is on a ticket

There is no one mandated ticket layout. Fields vary with POS, configuration, service style and restaurant policy. Square's current documentation says an order ticket carries order details such as items, customizations or special instructions, plus the customer name or ticket number; it also supports seat-based sorting and course grouping. Item notes remain visible to kitchen staff even when they are hidden from customer receipts. citeturn17view2

Aloha Kitchen exposes a similarly configurable set of chit fields, including courses, guest count, customer/order names, special instructions, items and modifiers, order mode, promise time, terminal data and displayed times. Its kitchen system can also delay or activate items based on routing/cook-time rules. citeturn2view0turn2view2

For a full-service-game ticket, the believable information hierarchy is therefore:

```text
TABLE / ORDER ID
SERVER                     SENT TIME

COURSE

SEAT 1
  ITEM
    MODIFIER
    MODIFIER

SEAT 2
  ITEM
    MODIFIER

*** ALLERGY / IMPORTANT NOTE ***

GUEST COUNT / SERVICE NOTE
```

**Table, seats, server, course, send time, item names and modifiers are all believable.** But don't imply every Toast/Square/Aloha kitchen ticket prints every one of these by default. Configuration matters. In particular, an “ALLERGY” line may be implemented as a prominent modifier, note or restaurant-specific workflow rather than one standardized cross-POS field. Square currently lets modifier text be visually distinguished on KDS/printer workflows, while restaurant allergen programs often use conspicuous marking and explicit communication procedures. citeturn17view1turn19search2

There is also no meaningful universal answer to “how long is a ticket?” Physically, ticket length grows with items, modifications and notes, and POS systems can compact or group identical lines. Square supports compact printing, different text sizes, grouped identical items and even one-item-per-ticket workflows. Operationally, ticket-time targets are restaurant-defined: Square KDS lets the operator decide when a ticket's timer turns yellow and red rather than imposing one industry number. citeturn15search7turn17view1

**For the game, use long tickets deliberately.** A four-top containing eight modifier lines should be physically harder to parse than “TABLE 7 — BURGER.” That is authentic difficulty without inventing another system.

### Coursing and firing

Coursing is not a made-up chef ritual; contemporary POS software explicitly models **held** versus **fired** courses. Square's current full-service coursing workflow allows items to be grouped into courses, held so they are not sent to the kitchen, then fired later. When a course is fired, it can print to the kitchen/bar or appear on KDS. citeturn17view0

Aloha Kitchen has comparable concepts around suspended courses and delayed routing, including configurations that auto-fire the first course and keep subsequent courses suspended. citeturn3view1turn2view2

A simplified three-course table might therefore behave like:

```text
7:05   Server sends Table 21:
       APP: burrata
       MAIN: salmon + steak

7:05   APP fires
       MAINS held

7:12   Burrata leaves pass

7:15   Dining room says:
       "Fire 21."

7:15   Expo fires mains

       Grill knows steak ≈ longer path
       Saute knows salmon ≈ different path
       Kitchen/expo times work so both land together

7:27   Steak appears
7:27   Salmon appears
       Expo checks both
       "HANDS, 21!"
```

Modern KDS software can even formalize staggered preparation: Square currently allows individual prep times to determine when different items on one ticket appear so that they become ready together. citeturn17view1

That is essentially the computer doing part of what a skilled human expo does mentally.

### Why synchronized pickup matters

A table's entrées do not ideally leave the kitchen as a random stream whenever each cook happens to finish. Cooks describing expo repeatedly emphasize coordinating different stations so one dish does not sit deteriorating while the missing component finishes. A BOH discussion gives the example of holding faster stations when one station is behind, or refreshing/re-plating food that has waited too long. citeturn9view0

This means **your strongest strategic mechanic is not raw ticket speed. It is synchronized completion.**

A player who fires everything immediately should often perform worse than a player who exercises restraint.

That is the soul of the game.

## The language of the pass

Kitchen vocabulary is intensely regional and restaurant-specific. Even current discussions among cooks disagree about terms such as “walking in”; treat this as dialect, not military doctrine. citeturn13search0

The following are the terms I would confidently put in the game:

| Call | Practical meaning | When it is used |
|---|---|---|
| **Ordering / order in / walking in** | A new ticket/order is entering the kitchen or is about to be called. | Expo gets the line's attention before reading a new order. Depending on the house, “ordering” may mean acknowledge/stage rather than cook immediately. |
| **Fire** | Start cooking it **now**. | “Fire two salmon, one strip.” Also “Fire Table 14 mains.” |
| **Hold** | Do not start/release this item or course yet. | A later course, delayed guest, pacing issue, or temporarily paused table. |
| **All day** | Total quantity currently needed across live tickets. | “How many salmon all day?” → “Six all day.” |
| **Behind** | Safety warning: someone is moving immediately behind you. | Not an expo-order command; it prevents collisions/burns. |
| **86** | Item is unavailable / remove it from sale. | “86 halibut.” FOH must stop selling it; existing orders may need resolution. |
| **On the fly** | Make this immediately, at highest urgency. | Forgotten item, wrong dish, missing component, urgent remake. |
| **Refire** | Make a replacement dish. | A plate was wrong, damaged, overcooked, dropped, contaminated, etc. |
| **Misfire** | Something was incorrectly made/fired or otherwise wasted. | Wrong item/timing or production mistake. |
| **Dragging** | An item/ticket is taking too long. | “Grill, you're dragging steak on 32.” |
| **Hands** | Food is ready and expo needs runners now. | “Hands! Table 18!” |
| **Window / pass** | The handoff/staging area between kitchen production and service. | Plates arrive here for final organization/QC. |
| **Rail / board / wheel** | The physical system holding live paper tickets. | Tickets are ordered here as service progresses. |
| **Working** | A station has the item in progress. | Often an answer to a status call: “Working two salmon.” |
| **Pick up / pickup** | Finish/plate/send what is being called. | Usage varies by house, but usually signals the final push toward the window. |
| **In the weeds** | A person/station is overloaded and falling behind. | Describes operational condition rather than a specific ticket. |

“Fire,” “all day,” “86,” “refire,” “expo,” “hands,” “ticket” and “in the weeds” are all reflected in current Toast restaurant terminology; Lightspeed likewise defines fire, expo, hands, misfires and on-the-fly usage. citeturn12search0turn9view3 Chefs Resources' professional-kitchen vocabulary additionally documents “walking in/ordering,” dragging, pass/window, rail/board/wheel, all-day counts and on-the-fly urgency, while noting that what “ordering” implies operationally can vary by kitchen. citeturn14view2 A chef's explanation of call-backs similarly lists “walking in,” “ordering,” “next ticket” and “order in” as ways of announcing that a new order is about to be called. citeturn13search4

### The suspicious one: “rehash”

I could **not verify “rehash” as a broadly recognized contemporary restaurant-expo call** across the industry terminology, POS, training-manual and BOH sources I checked. It may exist as house/local jargon, but it is not in the same confidence class as *fire*, *86*, *all day*, *on the fly* or *refire*.

I would not teach the player “rehash” as universal kitchen language.

It may be something a particular restaurant uses for a **reheat/refresh/remake** concept, or it may be getting conflated with **refire**. Put it in only if you have a specific restaurant whose dialogue you are modeling.

### How the calls should sound in game

Don't have NPCs politely explain everything:

> “The grill station is currently preparing two New York strip steaks.”

Have the audio come in like:

> “THREE STRIPS ALL DAY!”

> “Heard!”

> *printer screams*

> “Walking in! Table twenty-four, two salmon, one steak medium rare—”

> “Expo, thirty-one wants to fire!”

> “Hold!”

> “I NEED HANDS!”

That overlap is not decoration. It is the gameplay pressure.

## Timing, the pass, and where service goes wrong

### What expo checks before food leaves

Expo is the last practical chance to stop a visible mistake from reaching the guest. Industry descriptions of the role consistently include comparison against the ticket, correct modifiers/special requests, plating/presentation, garnish, complete sides and accompaniments, and clean plates. The phrase “wipe and sell” itself appears in kitchen terminology for cleaning the edge before service. citeturn21search23turn14view2

A useful in-game check sequence is:

> **RIGHT DISH → RIGHT MOD → COMPLETE → PRESENTABLE → SAFE → SEND**

The actual human check is roughly:

| Check | Examples |
|---|---|
| Correct item | Salmon, not cod |
| Correct requested doneness/preparation | Steak medium rare |
| Correct modifiers | No onion; dressing side; sub fries |
| Complete plate | Missing sauce? Side? garnish? |
| Presentation | Correct plating; nothing visibly sloppy |
| Cleanliness | No sauce/fingerprints on rim |
| Appropriate temperature/condition | Hot item has not been dying in window |
| Allergy procedure | Correct flagged plate and required kitchen protocol confirmed |
| Whole table/course | Are the other plates that need to travel with it ready? |

An allergy order is the one place your game should **not imply that a visual plate check makes something safe**. National Restaurant Association guidance calls for actual cross-contact controls: handwashing and glove/apron changes where appropriate, sanitized or separate equipment and surfaces, special marking of the completed allergy meal, communication with FOH, and separate delivery practices. If cross-contact occurs, their guidance says not to serve the dish. citeturn19search2turn19search5 FARE's 2025 restaurant audit materials similarly call for defined allergy procedures, clean/dedicated tools where applicable, designated handling, labeling, and discarding/remaking an allergy meal if cross-contact has or may have occurred. citeturn19search16

So an allergy mechanic should be:

```text
PEANUT ALLERGY
      ↓
PLAYER MUST FLAG / ACKNOWLEDGE ALLERGY
      ↓
KITCHEN CONFIRMS ALLERGY PROTOCOL
      ↓
SPECIAL PLATE ARRIVES
      ↓
PLAYER MATCHES PLATE TO CORRECT SEAT
```

not:

```text
look at plate → "seems peanut-free" → send
```

### The ticket rail

A paper rail is not merely storage. It is the physical representation of the kitchen's shared future.

Restaurant training materials describe tickets being kept in execution sequence and moved or marked as stages are completed. The MINA service manual, for example, groups tickets by service state and uses ticket placement/marking to show where an order stands. citeturn9view2 Professional kitchen terminology defines the rail/board/wheel as the system holding tickets and notes that expo/chef arranges those tickets according to execution order. citeturn14view2

That is why your game's ticket rail should be **spatial**, not just a sorted HTML list.

The player should develop muscle memory:

```text
OLDER / URGENT                         NEWER / HELD
[ 12 ][ 18 ][ 7 ][ 31 ][ 24 ][ 42 ][ 9 ]
```

Then something breaks the order:

```text
                   [REFIRE 18]
                         ↓
[ 12 ][ 18 ][ 7 ][ 31 ][ 24 ][ 42 ][ 9 ]
```

That physical disruption carries more emotional weight than another red notification badge.

### The classic failure modes

The real tensions collapse into a small set of recurring problems.

**A station drags.** Sauté is ready but grill is three minutes behind. The wrong decision leaves one dish sitting under the heat lamp while another cooks. Experienced kitchen workers describe expo deliberately slowing one part of the line to bring the ticket together. citeturn9view0

**Tickets stack.** A wave enters faster than it can be cleared. Kitchen terminology explicitly calls out ticket stacking/sandbagging and being “in the weeds” as overload conditions. citeturn14view2turn12search0

**A modification gets missed.** The finished plate is visually plausible but wrong. Square's systems deliberately preserve notes and modifiers on kitchen tickets because this information matters operationally. citeturn17view2

**A dish needs a refire.** Now the replacement is both late and urgent, while the rest of its table may already be ready. “Refire” and “on the fly” are common terms precisely because these exceptions happen during service. citeturn12search0turn9view3

**Something is 86'd mid-service.** The menu and current ticket state are suddenly inconsistent. BOH training guidance specifically includes communicating an 86 before stock is exhausted. citeturn21search9

**FOH bypasses the system.** Servers each want information about *their* table, while expo needs to optimize the whole dining room. Cooks describe expo as the communication barrier/single voice between servers and line precisely so ten separate conversations do not hit ten cooks. citeturn9view0

**Food sits in the pass.** The kitchen has successfully made the food, but nobody takes it. That is why “hands” is such an urgent call. citeturn12search0turn9view3

### What about managers and the bar?

A manager can certainly intervene in service priorities, complaints, voids/comps or refires, but **comping itself is not an expo core mechanic**. Modern restaurant POS products treat comp/void/check-management as separate check functions. Square's current Restaurants support center, for example, lists comp/void operations alongside but separately from coursing. citeturn16search7

Likewise, bar production can be routed to a dedicated bar printer rather than through the kitchen line; Square explicitly gives sending drink categories directly to the bar as a printing example. citeturn17view2

Therefore: **manager and bartender interruptions are believable, but neither belongs in your five-minute MVP.**

They are pressure multipliers for later.

### What separates great expo from bad expo

A great expo is not simply loud.

The strongest pattern across training materials and working cooks is **situational awareness plus controlled communication**. Good expo knows the menu and plate standards, watches what is coming next, sees a dragging station before the entire kitchen notices it, rejects incorrect food before it hits a guest, keeps the window and ticket system coherent, and acts as the single authoritative communication channel. citeturn9view0turn9view1turn21search9

The contrast is useful for your game:

| Great expo | Bad expo |
|---|---|
| Sees the next collision coming | Reacts after it has happened |
| Controls when work enters the line | Fires everything indiscriminately |
| Knows what is all day | Has to reread every ticket |
| Calls clearly and once | Creates noise without information |
| Keeps tickets/pass organized | Loses the visible service state |
| Catches wrong mods | Sends plausible-looking bad plates |
| Protects cooks from FOH chatter | Lets servers independently harass stations |
| Knows when to hold | Confuses “fast” with “good” |
| Stays calm as volume increases | Makes chaos contagious |

That suggests something important about difficulty design:

**Harder nights should increasingly attack the player's working memory, not merely shorten every timer.**

## Turning the job into a game

### The expanded core loop

The basic five-step interaction is:

**Receive.** A printer sound tells the player something new entered the system. The ticket visibly feeds out and joins the rail.

**Parse.** The player scans table, course, items, modifiers and important warnings.

**Fire.** At the appropriate moment, the player sends/fires the order or active course. During Night 1 this can be almost immediate; later nights make the timing decision consequential.

**Inspect.** Plates emerge at the pass. The player compares them with the ticket and either sends them or rejects/refires the bad component.

**Clear.** Once the complete course leaves the pass, the ticket advances or closes and the player returns attention to the remaining board.

The interaction needs to become subconscious because later nights will inject interruptions *during* those steps.

### The simulation underneath it

You do not need an ECS-sized restaurant simulation.

Each ticket needs something approximately like:

```text
Ticket
 ├─ createdAt
 ├─ table
 ├─ server
 ├─ course[]
 │   ├─ status: HELD | FIRED | COOKING | PASS | SENT
 │   └─ item[]
 │       ├─ menuItem
 │       ├─ station
 │       ├─ modifiers[]
 │       ├─ cookDuration
 │       └─ generatedErrors[]
 ├─ priority
 └─ satisfaction
```

Stations can initially be invisible timer producers:

```text
GRILL
SAUTE
PANTRY
```

The player does **not** cook the steak.

They manage the consequences of having asked somebody else to cook the steak.

That distinction protects the concept from slowly becoming *Cook, Serve, Delicious!* instead of an expo game.

### Scoring

For the MVP, show **one large service-health score** and calculate the interesting detail underneath it.

Do not put six meters across the HUD.

At shift end, reveal:

| Metric | What it measures |
|---|---|
| **Ticket Time** | How quickly valid orders/courses were completed |
| **Accuracy** | Wrong plates or modifications that escaped |
| **Pass Control** | Food left sitting too long / incomplete table pickups |
| **Final Service Score** | Weighted result |

Suggested scoring:

```text
START SERVICE HEALTH: 100

Late course                       -1/sec after grace period
Wrong normal modification sent   -15
Wrong entrée/dish sent            -20
Plate rejected correctly           -2 time cost, no accuracy penalty
Food dies in window               -10 + forced refire
Successful complete table          +5
Excellent synchronization          +3
```

Why not **kitchen morale** yet? Because the player cannot clearly infer it from the core loop. It becomes another meter requiring another ruleset and another set of feedback. Leave it out.

Why not **guest satisfaction per table**? Same reason for the MVP. Use ticket timers as the proxy. Detailed per-table satisfaction can come later.

### Failure

For Nights 1–3:

> **Service Health reaches zero = kitchen meltdown / manager pulls you off expo.**

That is more forgiving and readable than making a single incorrect burger an immediate game over.

An allergy incident, once allergies appear in later content, can be treated much more severely because the real-world stakes are categorically different. Restaurant-industry allergy guidance stresses that cross-contact can provoke serious reactions and contaminated allergy food should not be served. citeturn19search2turn19search5

I would make it a huge score loss and shift-ending incident on the hardest mode, but **not include allergies at all in the first MVP build**. Build the mechanic properly rather than making a deadly food-safety issue a tutorial gimmick.

### The FNAF-style shift progression

The trick is to introduce **one new mental obligation at a time**.

| Shift | What changes | What the player learns |
|---|---|---|
| **Night 1 — The Window** | Single-course tickets, basic modifiers, occasional bad plate | Read → fire → inspect → send |
| **Night 2 — Two Courses** | Apps and entrées; HOLD/FIRE states | Pacing instead of “send everything” |
| **Night 3 — The Weeds** | Higher arrival waves, 86 item, add-on, first refire/on-the-fly | Exceptions destroy neat plans |
| **Night 4 — Saturday** | Allergy orders, station dragging, servers interrupting for status/course fires | Protect attention and reprioritize safely |
| **Night 5 — Full House** | Everything combined; manager/VIP push, multiple refires, station problems, maybe bar dependency | Maintain the entire service model under deliberate chaos |

This is better than:

```text
Night 1: tickets every 30 sec
Night 2: tickets every 25 sec
Night 3: tickets every 20 sec
Night 4: tickets every 15 sec
Night 5: tickets every 10 sec
```

That is not progression. That's a spreadsheet with anger issues.

### Interruptions

Interruptions should force the player to make or remember a decision; they should not be dialogue boxes the player mindlessly dismisses.

| Source | Example | Mechanical consequence |
|---|---|---|
| **Server** | “Can I fire Table 12?” | Held course becomes eligible to fire |
| **Server** | “Where's my 31?” | Player must identify current ticket/status quickly |
| **Server** | “Seat 3 added fries.” | Add-on chit joins existing table |
| **Kitchen** | “86 salmon!” | Future salmon orders invalid; existing ones require resolution |
| **Kitchen** | “Grill's dragging five.” | Estimated cook completion shifts |
| **Kitchen** | “I need a re-fire on 22.” | New urgent item is inserted |
| **Manager** | “Push 14, they're complaining.” | Priority/tolerance changes, but overreacting may hurt other tables |
| **Manager** | “VIP on 8.” | Higher penalty for mistakes/lateness |
| **Bartender** | “We're out of the cocktail for 17.” | Optional later cross-department guest issue |
| **Runner/server** | “Which seat gets this?” | Player identifies seat from ticket under time pressure |

Current restaurant systems already support some of the concepts behind these exceptions: tickets can be recalled on expo devices, items can be completed individually, courses can be fired independently, and printer routing can split bar and kitchen work. citeturn16search20turn17view0turn17view2

### What is authentic *and* fun

Keep:

| Real detail | Why it works |
|---|---|
| Physical ticket rail | Spatial memory under pressure |
| Printer bursts | Immediate auditory threat cue |
| Ticket aging | Constant low-level pressure |
| Modifier reading | Accuracy challenge |
| Hold/fire | Real strategic decision |
| Different cook durations | Synchronization puzzle |
| All-day awareness | Mental workload |
| Refires | Disrupt established priorities |
| 86s | Forces the plan to change |
| Station drag | Uncertainty |
| Plate QC | Satisfying final decision |
| “Hands” / window buildup | Second source of urgency |
| Server interruptions | Steals attention at exactly the wrong moment |
| Audio call-backs | Makes the kitchen feel alive without expensive animation |

Abstract or delete:

| Real detail | Why not simulate it |
|---|---|
| Manually tearing/marking every paper chit | Flavor once; busywork forever |
| Actual recipes and cooking actions | Different game |
| Inventory counts by ingredient | Management sim creep |
| Full POS payment/check workflow | Mostly irrelevant to expo |
| Actual restaurant-length waits | Boring in real time |
| Every server/table relationship | Too much state for too little gameplay |
| Full reservation book | Separate system |
| Realistic food-running pathfinding | No value in static first-person design |
| Complete bartender simulation | Separate department |
| Detailed comps/refunds | FOH accounting rather than expo |
| Twenty menu items in Night 1 | Memorization wall before the player learns the loop |
| Complex hygiene minigames | Wrong level of abstraction |
| Cook morale in MVP | Invisible system without clean feedback |

The simulation needs to be **emotionally realistic rather than temporally literal**.

A real entrée may take many minutes. Your virtual entrée can take twenty seconds. What matters is that steak A takes longer than salad B, one station starts dragging, and the player thinks:

> “Shit, I fired the salad too early.”

That's expo.

## The scoped build roadmap

### MVP: the five-minute playable shell

Build **one shift, one screen, one loop**.

The scene is a fixed expo position with:

```text
TOP:       physical ticket rail

CENTER:    kitchen/pass

SIDE:      printer

BOTTOM:    tiny controls / service-health indicator
```

The minimum content is:

| System | MVP scope |
|---|---|
| Shift length | ~5 minutes |
| Menu | 5 food items |
| Stations | 3 abstract stations: Grill, Sauté, Pantry |
| Ticket types | Entrée-only / one active course |
| Tickets per game | ~8–12 |
| Ticket content | Table, server, timestamp, seat/item, basic mods |
| Player verbs | FIRE, SEND, REFIRE |
| Plate outcomes | Correct; wrong mod; missing component/garnish |
| Timers | Ticket age + plate-in-window age |
| Audio | Printer, ambient kitchen, short station call-backs, hands |
| Difficulty | Increasing arrival density during the shift |
| Interruptions | **One** scripted server status interruption |
| Scoring | Service Health; final time/accuracy/pass report |
| Lose state | Service Health reaches zero |
| Win state | Survive five minutes and clear final live tickets |

That is enough.

Do **not** put apps/entrées, 86s, allergy handling, managers, bartender, POS screen, inventory, morale, character animation, branching dialogue or random restaurant disasters into the first playable.

The purpose of the MVP is to answer one question:

> **Is reading tickets while food independently appears at the window inherently stressful and satisfying?**

If yes, continue.

If no, none of the extra systems will save it.

### Version two: make it an expo game

Once the base loop feels good, add the mechanic that turns it from generic order fulfillment into **expediting**:

| Addition | Effect |
|---|---|
| Apps + entrées | Multi-stage table state |
| HOLD / FIRE course control | Player now controls pacing |
| Per-item cook duration | Deliberate synchronization |
| Station workload | Overfiring has consequences |
| 86 events | Menu state changes mid-shift |
| Add-on tickets | Existing table mutates |
| Refire / on-the-fly | Emergency reprioritization |
| Dragging station | Uncertain completion |
| Stronger ticket-rail interactions | Spatial organization becomes meaningful |
| Nights 1–3 | Actual campaign progression |
| More calls/audio | “All day,” “dragging,” “hands,” etc. |

Course holding/firing, staggered prep times and separate prep/expo states all have direct analogues in current commercial restaurant systems, so this expansion makes the simulation *more* authentic rather than merely more complicated. citeturn17view0turn17view1turn2view2

### Version three: weaponize interruptions

Only then add the restaurant personality layer:

| Addition | Gameplay use |
|---|---|
| Servers with distinct behavior | Status requests, premature fires, add-ons |
| Manager | VIPs, complaints, priority pushes |
| Allergy workflow | High-stakes procedural attention |
| Bartender | Cross-department delays/86s |
| Food runner | Hands/seat-number interruptions |
| Multiple plate defects | Doneness/presentation/side errors |
| More menu knowledge | Player becomes genuinely fluent |
| Nights 4–5 | Full-pressure scenarios |
| Endless Saturday mode | Procedural replayability |
| Post-shift stats | Slow tables, escaped errors, best/worst ticket |
| Voice variants | Character without costly animation |

The final game's difficulty curve then comes from **interruptions colliding with state**, not just more orders.

Example:

```text
PLAYER IS CHECKING TABLE 42:
    steak MR
    no dairy
    fries

PRINTER:
    BZZZT-BZZZT

SERVER:
    "Fire 18!"

GRILL:
    "86 STRIP AFTER THESE TWO!"

SAUTE:
    "EXPO, HOW MANY SALMON ALL DAY?"

PASS:
    Table 31's food has been sitting for eight seconds.

PLAYER:
    [quietly reconsidering career choices]
```

That is your game.

## Night One and test tickets

### Sample Night One timeline

This uses **compressed game time**, not a claim about literal restaurant cook times. Real ticket thresholds and cook standards are house-specific; modern KDS systems allow restaurants to configure warning times rather than enforcing a universal industry value. citeturn17view1

Night 1 should be predictable enough that a new player feels clever before you hurt them.

| Game time | Event | Design purpose |
|---:|---|---|
| **0:00** | Shift begins. Ambient kitchen only. | Let player orient |
| **0:12** | Ticket T12 prints: burger, fries | Tutorial ticket |
| **0:18** | Prompt: “Select ticket → FIRE” | Teach fire |
| **0:39** | Burger arrives correct | Teach plate comparison |
| **0:44** | Player sends T12 | First success |
| **0:52** | T8 prints: salmon, no butter | Introduce modifier |
| **1:10** | T15 prints: steak medium rare | Two live tickets |
| **1:20** | T8 plate arrives with correct mod | Reinforce reading |
| **1:34** | T15 steak arrives | Straight success |
| **1:42** | T21 prints, two seats | First multi-plate table |
| **1:58** | T26 prints before T21 completes | Rail starts building |
| **2:10** | One T21 plate arrives | Teach “don't send incomplete course” |
| **2:18** | Second T21 plate arrives with wrong side | First forced rejection |
| **2:21** | Player REFIREs side/item | Teach exception |
| **2:35** | T26 begins aging | Competing priorities |
| **2:47** | Re-fire for T21 returns | Resolve disruption |
| **3:00** | Two tickets print within ~5 sec | First mini-rush |
| **3:18** | Server interrupts: “How long on 30?” | First attention theft |
| **3:25** | Player checks rail/status | Teach situational awareness |
| **3:32** | Three plates reach pass close together | QC pressure |
| **3:55** | Brief quiet | Recovery beat |
| **4:02** | Three-ticket final wave | Climax |
| **4:20** | Deliberate wrong-mod plate | Test learned QC |
| **4:40** | Window begins filling | Force prioritization |
| **5:00** | Printer stops; finish live tickets | Relief |
| **End** | Accuracy / average ticket time / dead plates / grade | Feedback |

Do not continuously increase pressure. The quiet patch around 3:55 is important.

A rush feels like a rush because sometimes you are **not** in one.

### Synthetic test-ticket format

The following are original test fixtures, not reproductions of Toast, Square or Aloha proprietary ticket layouts. Their structure is based on fields and workflows that contemporary POS/KDS systems support: order identifiers, items, modifiers/notes, seats, courses, timestamps and expo-level aggregation. citeturn17view2turn17view0turn21search30turn2view0

#### Basic two-top

```text
********************************
TABLE 12             6:04 PM
SERVER: MAYA          2 GUESTS
********************************

ENTREE

S1  HOUSE BURGER
      MEDIUM
      CHEDDAR
      NO ONION
      FRIES

S2  SALMON
      ROASTED POTATO
      ASPARAGUS

********************************
ORDER #1042
********************************
```

Purpose: ordinary ticket parsing.

#### Multiple modifiers

```text
********************************
TABLE 8              6:07 PM
SERVER: LUIS          1 GUEST
********************************

ENTREE

S1  SALMON
      *** NO BUTTER ***
      SAUCE ON SIDE
      SUB BROCCOLI
      NO POTATO

********************************
ORDER #1046
********************************
```

Purpose: a dish that looks normal at a glance but has several failure opportunities.

#### Steak doneness

```text
********************************
TABLE 15             6:11 PM
SERVER: MAYA          2 GUESTS
********************************

ENTREE

S1  NY STRIP
      MED RARE
      FRIES
      AU POIVRE ON SIDE

S2  HOUSE BURGER
      WELL DONE
      NO CHEESE
      SIDE SALAD

********************************
ORDER #1051
********************************
```

Purpose: seat differentiation and doneness.

#### App followed by held entrées

```text
********************************
TABLE 21             6:15 PM
SERVER: JEN           2 GUESTS
********************************

COURSE 1 - FIRE
    BURRATA
      NO TOMATO

COURSE 2 - HOLD
S1  SALMON
      ASPARAGUS

S2  NY STRIP
      MEDIUM
      FRIES

********************************
ORDER #1058
********************************
```

Purpose: Version-two HOLD/FIRE tutorial. Real POS coursing systems explicitly distinguish held and fired courses. citeturn17view0

#### Seat-specific allergy

```text
********************************
TABLE 32             6:22 PM
SERVER: LUIS          3 GUESTS
********************************
*** ALLERGY: SHELLFISH - SEAT 2 ***
*** FOLLOW ALLERGY PROTOCOL      ***

ENTREE

S1  HOUSE BURGER
      MEDIUM
      FRIES

S2  NY STRIP
      MED RARE
      BROCCOLI

S3  SALMON
      POTATO

********************************
ORDER #1067
********************************
```

Purpose: the warning belongs to **one seat**, making plate identification essential.

This fixture should only be used once your game has a proper allergy-confirmation workflow. Actual cross-contact safety involves procedures beyond matching visible ingredients. citeturn19search2turn19search16

#### Shared appetizer plus three mains

```text
********************************
TABLE 40             6:28 PM
SERVER: JEN           3 GUESTS
********************************

COURSE 1 - FIRE
SHARE
    CRISPY CALAMARI
      LEMON AIOLI

COURSE 2 - HOLD

S1  SALMON
      NO ASPARAGUS
      SUB FRIES

S2  HOUSE BURGER
      MEDIUM
      NO PICKLE
      CHEDDAR

S3  NY STRIP
      MEDIUM WELL
      POTATO

********************************
ORDER #1073
********************************
```

Purpose: shared items versus seat-positioned entrées.

#### Mid-service add-on

```text
********************************
*** ADD ON ***
TABLE 18             6:34 PM
SERVER: MAYA
********************************

S2  SIDE FRIES

*** ADD TO OPEN ORDER #1075 ***

********************************
```

Purpose: a tiny new chit that is easy to overlook but belongs to an existing live ticket.

#### On-the-fly refire

```text
********************************
***** REFIRE - ON THE FLY *****
TABLE 27             6:41 PM
SERVER: LUIS
********************************

S3  HOUSE BURGER
      MEDIUM
      *** NO CHEESE ***
      FRIES

REASON:
ORIGINAL MADE WITH CHEESE

********************************
REFIRE #1084-R
********************************
```

Purpose: an urgent ticket whose original error is itself a clue about what must be checked.

“Refire” for a replacement and “on the fly” for an urgent make are well-established contemporary restaurant terms. citeturn12search0turn9view3

#### An 86 collision

```text
********************************
TABLE 44             6:48 PM
SERVER: JEN           2 GUESTS
********************************

ENTREE

S1  SALMON
      POTATO

S2  HOUSE BURGER
      MED RARE
      FRIES

********************************
ORDER #1091
********************************

SYSTEM / KITCHEN EVENT AT 6:49:
*** 86 SALMON ***
```

Purpose: the ticket was legitimate when entered, then reality changed. The game should require a resolution rather than silently deleting it.

#### Large modified table

```text
********************************
TABLE 51             7:03 PM
SERVER: MAYA          5 GUESTS
********************************

ENTREE

S1  NY STRIP
      RARE
      FRIES

S2  SALMON
      NO BUTTER
      BROCCOLI

S3  HOUSE BURGER
      MEDIUM
      NO ONION
      NO PICKLE
      CHEDDAR
      SIDE SALAD

S4  NY STRIP
      MED WELL
      POTATO
      SAUCE ON SIDE

S5  HOUSE BURGER
      WELL DONE
      NO CHEESE
      FRIES

NOTE:
BIRTHDAY - DESSERT AFTER MAINS

********************************
ORDER #1105
********************************
```

Purpose: **visual density**.

Notice that nothing individually exotic happens on this ticket. Its difficulty is that the player is trying to extract six or seven important facts from a long strip of paper while other things are happening.

That is arguably the most authentic kind of difficulty in the entire design.

### What I would treat as the authenticity target

The target experience is not “I learned to cook restaurant food.”

It is:

> “I know Table 21 is held on mains, 32 has the shellfish allergy on seat two, grill owes me the re-fire for 27, salmon just got 86'd, and if that server asks me where Table 18 is one more time I'm going to launch him into the dining room.”

That feeling is supported by the operational reality: expo sees a consolidated order picture across stations, controls or coordinates course progression, watches ticket time, keeps the pass moving and filters communication between the dining room and line. citeturn17view1turn21search30turn9view0

The **MVP should create that feeling with ten tickets and three buttons before you build anything else.**

### Verification notes

The strongest current-system evidence in this research is from **Square's live 2026 support documentation** and **Toast's expediter support page updated July 23, 2026**. Square currently documents expo/prep KDS roles, configurable ticket timers, staggered item prep, seat sorting, modifier display, printed tickets, course hold/fire behavior and printer routing. Toast currently documents consolidated expediter tickets across multiple prep stations. citeturn17view1turn17view0turn17view2turn21search30

For **Aloha**, I found NCR's publicly indexed **Aloha Kitchen v19.13 Reference Guide**, ©2024, covering expo chits, course/suspension behavior, delay routing and related kitchen functions. I could not independently establish that “v19.13” is the newest Aloha Kitchen version deployed anywhere as of October 6, 2026, so I would not represent that version number as the universally current Aloha release. The operational behaviors cited from it are directly documented in that guide. citeturn2view0turn2view1turn2view2turn3view1

The detailed **MINA Group** service material is restaurant-specific and was available through a third-party-hosted copy rather than a current official MINA training portal; I used it as an example of an actual fine-dining service system, **not** as proof that all restaurants use those exact countdowns or ticket stages. citeturn9view2

Reddit/KitchenConfidential material was used only for the lived-experience layer—especially the fact that houses divide expo duties differently and that working cooks think about station synchronization, the rail/window and controlling FOH communication differently from a generic job description. Those observations were cross-checked against current POS documentation and restaurant training sources rather than treated as authoritative by themselves. citeturn9view0turn9view1turn21search9

Finally, **“rehash” remains unverified as standard expo jargon**. I would omit it from the game's instructional vocabulary unless a specific chef or restaurant you are modeling confirms its local meaning.