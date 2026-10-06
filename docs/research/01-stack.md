# **Technical Architecture Report: Browser-Based Restaurant Expo Simulator**

## **System Overview and Architectural Philosophy**

The development of a browser-based, first-person restaurant expo simulator introduces highly specific architectural constraints that deviate from traditional action-oriented web game development. The gameplay structure relies heavily on paradigms popularized by titles such as *Five Nights at Freddy's*, characterized by fixed, static viewpoints layered with dense, interactive user interfaces. The core mechanical loop does not require rigid body physics, collision detection, or sub-pixel camera tracking. Instead, the simulation relies on precise timer-driven state management, concurrent event scheduling, and overlapping auditory cues to build tension.  
Compounding these mechanical requirements are strict operational constraints. The application must be entirely free to build, host, and scale for hobby-tier traffic. Furthermore, the codebase will be primarily authored by artificial intelligence coding agents, specifically models such as Claude and Codex. This mandates the selection of a technology stack with an overwhelming presence in pre-2026 training data, an absence of recent breaking architectural changes, and a highly stable, well-documented API. The ensuing analysis dissects the optimal approach for rendering, audio playback, state management, and persistence, tailored specifically to maximize AI generation fidelity and minimize operational costs on the Vercel platform.

## **Rendering Infrastructure: The Intersection of Typography and AI Efficacy**

The primary visual components of the simulator—printed kitchen tickets, ticket rails, and Point-of-Sale (POS) screens—are inherently typographic and structural. Evaluating the rendering engine requires balancing the visual requirements of simulated thermal receipt paper against the AI's capacity to generate maintainable code.

### **The Limitations of HTML5 Canvas Frameworks**

Traditional 2D web game development relies on HTML5 \<canvas\> and WebGL renderers. Frameworks such as Phaser (v3) and PixiJS dominate this space1. Phaser provides a comprehensive suite of game-specific tools, including physics engines, scene management, and camera systems, making it the industry standard for traditional 2D browser games3. It boasts a massive community and excellent AI coding agent support due to its longevity and deep penetration into model training data4. PixiJS serves as a highly optimized, lightweight rendering layer, capable of pushing thousands of sprites at 60 frames per second by minimizing framework overhead1. Other options, such as Kaplay, offer component-based simplicity but suffer from severe AI hallucination rates, as models frequently conflate it with its deprecated predecessor, Kaboom.js4.  
Despite their performance, WebGL-based engines present significant hurdles for text-heavy, UI-centric applications. Rendering dynamic text within a \<canvas\> context is computationally expensive and visually inferior to native browser typography6. To achieve crisp text on high-resolution displays, developers must utilize bitmap fonts or complex Signed Distance Field (SDF) shaders. Furthermore, creating the specific aesthetic of a thermal receipt—involving jagged, torn edges and textured backgrounds—requires custom fragment shaders. AI coding agents often struggle to write performant, bug-free WebGL shaders from scratch, leading to extensive debugging cycles.

### **The Superiority of the DOM and React**

For a fixed-perspective simulator dominated by user interface elements, bypassing the \<canvas\> entirely in favor of the Document Object Model (DOM) is the most robust strategy. Modern web browsers are fundamentally optimized to render text, process CSS layouts, and handle event-driven interactions efficiently.  
React, paired with TypeScript and built via Vite, emerges as the optimal foundation. AI models possess an unparalleled understanding of React component architecture and Tailwind CSS utility classes, far exceeding their proficiency with Phaser's scene graphs. Generating a ticket component that mimics thermal paper is trivial in the DOM. Agents can utilize CSS box-shadow for depth, clip-path for the torn bottom edge of a receipt, and SVG filters for paper grain7.  
A pure DOM approach ensures that text remains sharp across all device pixel ratios without manual scaling logic6. Furthermore, React's component model maps perfectly to the game's entities: a Ticket component, a POSScreen component, and a TimerBar component can be generated, tested, and iterated upon in isolation by AI agents.

| Rendering Approach | Text Rendering Quality | AI Generation Reliability | UI Layout Complexity | Bundle Size (Core) |
| :---- | :---- | :---- | :---- | :---- |
| **React \+ DOM/CSS** | Excellent (Native) | Exceptional | Low (Flexbox/Grid) | \~140 KB |
| **Phaser 3 (WebGL)** | Moderate (Requires Bitmap) | High | High (Manual positioning) | \~274 KB1 |
| **PixiJS (WebGL)** | Moderate | Moderate | High (Manual positioning) | \~125 KB1 |
| **Kaplay** | Poor | Low (High Hallucination) | High | \~100 KB |

### **Recommendations for Rendering**

The primary recommendation is a strict React, TypeScript, Vite, and Tailwind CSS stack. The DOM easily outperforms the canvas when rendering dense arrays of styled text, and the AI's ability to scaffold complex CSS structures will drastically accelerate development.  
The runner-up is Phaser 3\. A pivot to Phaser should only occur if the mechanical scope of the game expands to include complex 2D spatial requirements. For example, if the player is required to physically throw plates across the kitchen using trajectory physics, or if the game introduces a scrolling, parallax-heavy environment, the DOM will begin to suffer performance bottlenecks. In such a scenario, a hybrid approach could be adopted, layering a transparent Phaser canvas over the React UI, though this introduces severe synchronization complexities between the React virtual DOM and the Phaser event loop.

## **Auditory Systems: Managing High-Density Soundscapes**

A restaurant expo simulation is defined by its auditory chaos. The ambient noise of a busy kitchen must underlay the sharp, overlapping bursts of dot-matrix ticket printers, the ringing of service bells, and the urgent voice lines of servers and managers. This requires an audio architecture capable of handling high concurrency with absolute minimal latency, while strictly adhering to modern browser autoplay policies.

### **Web Audio API Challenges**

The native browser Web Audio API offers powerful, frame-accurate scheduling and spatialization capabilities. However, its raw implementation is highly verbose. Furthermore, modern browsers (specifically Google Chrome and Apple Safari) aggressively block audio playback until the user explicitly interacts with the document9. Manually orchestrating the AudioContext to remain suspended upon page load, capturing the initial DOM touchend or click event, and subsequently unlocking the audio context across varying browser vendor implementations is notoriously fragile and difficult for AI agents to implement flawlessly without regressions9.

### **The Howler.js Abstraction**

Howler.js serves as the definitive solution for browser-based game audio. It defaults to the Web Audio API for zero-latency playback and gracefully falls back to HTML5 Audio for older environments9. Crucially, Howler.js automatically manages the mobile and desktop Safari/Chrome unlock sequence, silently playing an empty buffer on the first user interaction to unlock the global AudioContext without requiring manual event binding9.  
For the specific requirement of layered, overlapping sound effects (SFX), the architecture must utilize the Audio Sprite pattern. Loading individual .mp3 or .wav files for every bell ring or printer burst generates excessive HTTP requests and risks playback jitter as the browser attempts to decode multiple streams simultaneously. An Audio Sprite resolves this by concatenating all short audio assets into a single, contiguous file, accompanied by a JSON map detailing the start time and duration of each segment in milliseconds11.  
Using the Node-based audiosprite command-line interface, the raw audio assets are compiled into highly optimized .webm and .mp3 files, along with a strictly formatted JSON object that Howler natively understands13. During game initialization, Howler downloads this single file, decodes it into memory once, and allows the application to fire concurrent instances of any sound segment instantaneously15.

| Audio Library | Autoplay Unlock Handling | Audio Sprite Support | AI Implementation Success | Code Complexity |
| :---- | :---- | :---- | :---- | :---- |
| **Howler.js (Vanilla)** | Automatic & Reliable | Native via JSON map | High | Low |
| **Web Audio API** | Manual & Fragile | Manual Buffer Slicing | Moderate | High |
| **HTML5 \<audio\>** | Strict Restrictions | Highly Inefficient | High | Low |

The recommendation is to strictly utilize vanilla Howler.js (version 2.2.4). A significant AI pitfall must be noted here: AI coding agents will frequently attempt to install the react-howler wrapper package16. This package is fundamentally outdated, last updated in 2021, and does not comply with modern React 18+ strict mode rendering cycles16. The architecture must instantiate a single vanilla Howl object outside the React component tree to act as a global audio manager.

## **State Management and the Simulation Game Loop**

The mechanical core of the simulator revolves around timers and concurrency. Tickets spawn on a schedule, their associated patience meters decay over time, and random interruptions trigger based on probability thresholds. Managing this rapidly mutating state within a React application requires extreme care to prevent cascading re-renders that would paralyze the browser's main thread.

### **Evaluating State Architectures**

> 1. **Entity Component System (ECS):** An ECS architecture separates data (components) from logic (systems), offering massive performance benefits for games calculating collisions and physics for thousands of on-screen entities. However, for a UI-heavy simulation where the entities are merely data objects (a ticket with a timer), ECS introduces staggering architectural boilerplate. AI agents struggle to map React DOM updates to ECS system ticks, often resulting in highly fragmented, unmaintainable code.  
> 2. **Finite State Machines (XState):** XState provides mathematically sound, predictable state transitions, ideal for defining rigid game phases (e.g., MENU \-\> PLAYING \-\> GAME\_OVER). However, managing a highly concurrent system—where dozens of independent tickets have their own decaying lifecycles—within a single global state machine results in a massive, deeply nested configuration object. AI models frequently hallucinate XState syntax and struggle to safely refactor these complex objects as new features are added18.  
> 3. **Atomic Stores (Zustand):** Zustand is an unopinionated, hook-based state management library that has surpassed Redux in modern React development, boasting over 40 million weekly downloads19. It avoids the necessity of React Context Providers, keeping the component tree flat and highly readable.

### **The Transient Game Loop Pattern**

Zustand (specifically version 5\) is the optimal pattern for this simulator. To maintain 60 FPS without destroying DOM performance, the game loop must be completely decoupled from React's rendering cycle.  
The architecture dictates the creation of a centralized useGameStore. An external requestAnimationFrame loop runs continuously outside of the React tree, calculating the delta time and calling a tick(deltaTime) function exposed by the Zustand store21. This tick function decrements the patience values of active tickets and resolves spawning probabilities.  
React components then selectively subscribe only to the precise slice of state they require. A Ticket component subscribes only to its specific patience value using a Zustand selector. When the game loop updates the patience integer, only that specific DOM node updates. The rest of the application remains untouched. This pattern—transient state updates bypassing the React context—ensures the AI can write simple, readable components without sacrificing the performance required for a real-time simulator22.

## **Persistence and the Pathway to Global Leaderboards**

Game state persistence is necessary to track high scores, shift completion, and unlocked upgrades. The constraints require a zero-cost immediate solution, with a clear migration path to a free-tier leaderboard system in the future.

### **Immediate Persistence: Browser LocalStorage**

For the initial development and hobby-scale deployment, browser localStorage provides a frictionless solution. Zustand includes a robust persist middleware that automatically serializes designated state slices to JSON and saves them to localStorage23. Upon page reload, the state is seamlessly rehydrated. This requires merely three lines of configuration in the store definition, allowing AI agents to implement save functionality flawlessly with zero backend infrastructure.

### **Backend Migration: Navigating Free-Tier Limitations**

When the requirement expands to global leaderboards, a serverless database must be integrated. Evaluating the current market for free-tier databases reveals critical operational constraints.  
Supabase offers a highly popular PostgreSQL service with a generous allowance of 50,000 monthly active users24. However, Supabase enforces a draconian inactivity policy on free tiers: if the database cluster receives no queries for seven consecutive days, the project is completely paused25. The application will fail with connection errors until the developer manually logs into the dashboard and initiates a restoration process27. While workarounds exist—such as configuring a GitHub Actions workflow to execute a superficial query twice a week to reset the inactivity timer—this introduces brittle operational overhead28.  
The optimal alternative is Upstash Redis, natively integrated into Vercel as Vercel KV. Upstash provides a serverless Redis instance with a free tier of 500,000 commands per month, functioning over standard HTTP REST APIs30. This is architecturally perfect for Vercel Edge functions, as it avoids the latency and exhaustion associated with traditional TCP connection pooling in serverless environments32.  
Redis is uniquely tailored for leaderboards via its Sorted Set data structures (ZADD, ZRANGE)31. Inserting a new score and retrieving the top 100 players requires a single, sub-millisecond command, completely eliminating the need for complex SQL queries, schema migrations, and indexing. When the time comes to implement leaderboards, the AI agents can deploy a Vercel Serverless Function that receives a score, validates it, and pushes it to the Upstash Sorted Set seamlessly.

| Database Platform | Free Tier Limits | Inactivity Pausing | Leaderboard Query Efficiency | Protocol |
| :---- | :---- | :---- | :---- | :---- |
| **Vercel KV (Upstash)** | 500k commands / mo31 | None | Optimal (Sorted Sets)31 | HTTP/REST |
| **Supabase (Postgres)** | 50k MAU, 500MB storage28 | 7 Days26 | High (Requires Indexing) | TCP / PostgREST |
| **Firebase Firestore** | 50k reads / day | None | Moderate (Compound queries) | HTTP/gRPC |

## **Vercel Deployment Architecture and Static Asset Handling**

Deploying a Vite-compiled React application to Vercel is highly streamlined, but requires specific configurations to ensure the simulation functions correctly as a Single Page Application (SPA) and handles dense audio assets efficiently.

### **Routing Configuration**

Vite compiles the React application into a static bundle with a single index.html entry point. Because routing is handled entirely client-side, any attempt to refresh the browser on a sub-route (e.g., /settings) will bypass the React router and query the Vercel Content Delivery Network (CDN) directly for a settings.html file, resulting in a 404 error34. To mitigate this, a vercel.json configuration file must be placed at the project root. This file utilizes the rewrites directive to intercept all incoming traffic and forcefully route it to index.html, allowing the client-side router to mount and determine the correct view35.

### **Asset Caching Strategies**

The application will heavily rely on the audio sprite file (e.g., sprite.webm), which may approach 1 to 2 megabytes depending on the length of the ambient kitchen loops. Vercel's Edge CDN is highly efficient, but to minimize egress bandwidth and ensure the game initializes instantly on subsequent visits, the audio assets must be aggressively cached in the user's browser34.  
By default, Vercel applies sensible cache headers, but the vercel.json file allows for explicit Cache-Control header definitions targeting the /assets/audio/ path38. Setting an immutable, long-term max-age ensures the browser never attempts to re-validate the audio sprite over the network unless the filename changes (which Vite handles automatically via hash-busting during the build process)39.  
Vercel enforces a 4.5 MB payload limit and a 10-second execution limit on free-tier serverless functions41. However, because the game logic executes entirely within the client's browser, these backend compute limits are entirely bypassed until the leaderboard API is introduced, at which point inserting a score into Redis takes mere milliseconds.

## **Comprehensive Deliverables and Project Specifications**

The following details outline the exact packages, directory structures, and AI directives required to scaffold and execute the simulator successfully.

### **Recommended Technology Stack**

* **Core Recommendation:** React \+ DOM/CSS Rendering. It provides the highest AI generation fidelity, native text rendering for thermal receipts, and avoids the complexity of WebGL pipelines.  
* **Alternative Consideration:** Phaser 3\. Only switch to this framework if gameplay mechanics pivot to include physics, collision, or spatial movement.

| Layer | Package Name | Verified Version (2026) | Justification |
| :---- | :---- | :---- | :---- |
| **UI Framework** | react, react-dom | 19.x | Massive AI training data presence; robust functional component model. |
| **Build System** | vite | 6.x | Fast hot-module replacement; seamless SPA builds. |
| **Styling** | tailwindcss | 4.x | Allows AI to rapidly iterate on complex UI layouts using utility classes. |
| **Iconography** | lucide-react | 1.52.0 | Standardized UI icons; highly reliable in AI generation43. |
| **State Management** | zustand | 5.0.x | Boilerplate-free, performant transient state for the game loop19. |
| **Audio Engine** | howler | 2.2.4 | Abstracts Web Audio API complexities and autoplay unlocks10. |
| **Sprite Compiler** | audiosprite (Global CLI) | 0.9.x | Generates the audio sprite and JSON mapping from raw assets13. |

*(Note: While specific minor versions of Vite 6.x and Tailwind 4.x are projected based on current trajectories, the major version functionality remains stable and heavily documented for AI retrieval. All other versions are explicitly verified against current package registries.)*

### **Project Folder Structure**

AI coding agents suffer from context degradation when navigating deeply nested or sprawling directory structures. A flat, highly categorized architecture minimizes token usage and ensures the agent maintains a clear mental map of import paths.  
/restaurant-expo-sim  
├── .github/  
│ └── workflows/ \# Future CI/CD configurations  
├── public/  
│ ├── assets/  
│ │ ├── audio/ \# Contains sprite.mp3, sprite.webm  
│ │ ├── fonts/ \# Custom typography (e.g., thermal dot matrix)  
│ │ └── data/ \# Contains audiosprite JSON coordinate map  
│ └── favicon.ico  
├── src/  
│ ├── components/ \# Pure view layer; reads from/dispatches to Zustand  
│ │ ├── expo/ \# Components specific to the physical window view  
│ │ ├── pos/ \# Components specific to the digital POS screen  
│ │ └── ui/ \# Reusable atomic elements (Buttons, Panels)  
│ ├── core/  
│ │ ├── gameLoop.ts \# External RequestAnimationFrame loop driver  
│ │ ├── audio.ts \# Vanilla Howler.js singleton instantiation  
│ │ └── config.ts \# Centralized tuning variables (spawn rates, decay timers)  
│ ├── store/  
│ │ ├── useGameStore.ts \# Core game state (score, shift time, active phase)  
│ │ └── useTicketStore.ts \# Array of active tickets and historical queues  
│ ├── types/  
│ │ └── index.ts \# Centralized TypeScript interfaces for strict AI enforcement  
│ ├── App.tsx \# Root router managing game states (Title \-\> Play \-\> Score)  
│ ├── main.tsx \# React application entry point  
│ └── index.css \# Global CSS, Tailwind directives, and complex clip-paths  
├── AGENTS.md \# Immutable operating directives for AI models  
├── package.json  
├── tailwind.config.js  
├── vercel.json \# SPA routing and CDN caching configuration  
└── vite.config.ts

### **Immutable AI Operating Directives (AGENTS.md)**

AI models require strict boundary conditions to prevent them from hallucinating obsolete libraries or implementing anti-patterns. The following documentation must exist at the root of the repository.

# **AI Agent Operating Directives: Restaurant Expo Simulator**

## **1\. Architectural Mandate**

This application is a 2D browser-based management simulation. It relies heavily on static viewpoints and dense user interfaces.

* **NO CANVAS ENGINES.** Do not use Phaser, PixiJS, or Three.js. Render everything using standard DOM elements and React.  
* **NO PHYSICS.** There are no collisions, gravity, or platforming mechanics.  
* **STRICT TYPING.** All entities must be strictly typed in src/types/index.ts. Do not use any.

## **2\. State Management (Zustand v5)**

* All global state is managed by Zustand. Do not use Redux or React Context for game state.  
* **CRITICAL:** Use Zustand v5 syntax. Do not use default exports for the create function.  
* The simulation operates on a central requestAnimationFrame loop located in src/core/gameLoop.ts. This loop calls useGameStore.getState().tick(deltaTime).  
* **DO NOT** put setInterval or requestAnimationFrame inside a React useEffect hook. This will cause catastrophic re-rendering.  
* Components must subscribe ONLY to the specific slice of state they need (e.g., const patience \= useTicketStore((state) \=\> state.tickets\[id\].patience);).

## **3\. Audio Implementation (Howler.js)**

* Audio is handled exclusively by vanilla howler via an Audio Sprite.  
* **CRITICAL:** Do NOT import react-howler. It is deprecated.  
* Do NOT use HTML \<audio\> tags.  
* **To add a new sound:**  
  1. Add the raw audio file to the local processing folder.  
  2. Run the audiosprite CLI to regenerate sprite.webm, sprite.mp3, and sprite.json.  
  3. Move these files into public/assets/audio/.  
  4. Trigger the sound via the singleton: AudioManager.play('new\_sound\_key').

## **4\. Extending the Game (Adding an Interruption Event)**

To add a new server or manager interruption:

> 1. Define the event payload interface in src/types/index.ts (e.g., export interface Interruption { id: string, type: 'manager' | 'server', timeRemaining: number }).  
> 2. Add an array to hold active interruptions in useGameStore.ts.  
> 3. Add spawning logic inside the tick() function based on random probability and the current shift difficulty defined in src/core/config.ts.  
> 4. Create a React component in src/components/expo/ to render the interruption visually, ensuring it subscribes only to its specific data slice.

### **Known AI Generation Pitfalls to Monitor**

When operating this stack through AI coding assistants, several highly probable failure states must be anticipated and corrected immediately by the human operator.  
**1\. The react-howler Trap:** Because react-howler was extensively discussed in developer forums prior to 2022, AI agents will almost certainly attempt to install it to manage audio in a React environment16. This package is abandoned and will crash in modern React Strict Mode16. The developer must explicitly reject this and enforce the use of the vanilla Howl object instantiated in a separate typescript file outside the React component tree.  
**2\. The useEffect Game Loop:** AI models are heavily trained on simple web applications where basic timers are implemented via setInterval inside a useEffect hook. If an AI implements the core game tick this way, it will result in stale closures, memory leaks, and severe desynchronization as the React component unmounts and remounts. The human operator must enforce the external requestAnimationFrame pattern, manipulating the Zustand store directly21.  
**3\. Zustand v4 vs v5 Syntax Hallucinations:** Zustand recently underwent syntax deprecations transitioning to version 523. AI models may generate code utilizing deprecated imports (such as pulling createContext from zustand-utils or using import create from 'zustand' instead of import { create } from 'zustand')23. Adherence to the modern syntax must be verified to prevent build failures.  
**4\. Selector Inefficiency:**  
The most dangerous performance risk in this architecture is improper Zustand selector usage. AI agents will often write const state \= useGameStore();, which subscribes the component to the entire store. Because the game loop mutates the store sixty times a second, this error will force the entire application to re-render sixty times a second, crashing the browser tab. The developer must ensure the AI correctly scopes selectors: const activeTickets \= useGameStore((state) \=\> state.activeTickets);.

#### **Works cited**

> 1. Phaser vs PixiJS for making 2D games \- DEV Community, [https\://dev.to/ritza/phaser-vs-pixijs-for-making-2d-games-2j8c](https://dev.to/ritza/phaser-vs-pixijs-for-making-2d-games-2j8c)  
> 2. Comparison of WebGL Libraries for 2D Games \- Fgfactory, [https\://fgfactory.com/webgl-libraries-for-2d-games](https://fgfactory.com/webgl-libraries-for-2d-games)  
> 3. Phaser vs Pixi.js: Renderer vs Game Framework Comparison (2025), [https\://generalistprogrammer.com/tutorials/phaser-vs-pixijs-renderer-comparison](https://generalistprogrammer.com/tutorials/phaser-vs-pixijs-renderer-comparison)  
> 4. Phaser vs Kaplay vs Excalibur: Which 2D Web Game Framework, [https\://phaser.io/news/2026/04/phaser-vs-kaplay-vs-excalibur-2d-web-game-framework](https://phaser.io/news/2026/04/phaser-vs-kaplay-vs-excalibur-2d-web-game-framework)  
> 5. Performance comparison of Javascript rendering/game engines, [https\://github.com/Shirajuki/js-game-rendering-benchmark](https://github.com/Shirajuki/js-game-rendering-benchmark)  
> 6. Optimizing canvas \- Web APIs | MDN, [https\://developer.mozilla.org/en-US/docs/Web/API/Canvas\_API/Tutorial/Optimizing\_canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)  
> 7. 20+ CSS Paper Effect (Code \+ Demo) \- CodeWithRandom, [https\://www\.codewithrandom.com/2023/10/24/css-paper-effect/](https://www.codewithrandom.com/2023/10/24/css-paper-effect/)  
> 8. Torn Paper Edges Effect with CSS \- YouTube, [https\://www\.youtube.com/watch?v=nj0D1dJ\_XGw](https://www.youtube.com/watch?v=nj0D1dJ_XGw)  
> 9. howler.js \- Best of JS, [https\://bestofjs.org/projects/howlerjs](https://bestofjs.org/projects/howlerjs)  
> 10. howler \- NPM, [https\://www\.npmjs.com/package/howler](https://www.npmjs.com/package/howler)  
> 11. howler.js \- JavaScript audio library for the modern web, [https\://howlerjs.com/](https://howlerjs.com/)  
> 12. How to create AudioSprites to use with howler.js \- Medium, [https\://medium.com/game-development-stuff/how-to-create-audiosprites-to-use-with-howler-js-beed5d006ac1](https://medium.com/game-development-stuff/how-to-create-audiosprites-to-use-with-howler-js-beed5d006ac1)  
> 13. node.js ffmpeg wrapper to concat small audio files into one, [https\://portalzine.de/audiosprite-node-js-ffmpeg-wrapper-to-concat-small-audio-files-into-one/](https://portalzine.de/audiosprite-node-js-ffmpeg-wrapper-to-concat-small-audio-files-into-one/)  
> 14. Getting Started With Howler.js in React | by Madeline Higgins, [https\://medium.com/swlh/getting-started-with-howler-js-in-react-67d3a348854b](https://medium.com/swlh/getting-started-with-howler-js-in-react-67d3a348854b)  
> 15. goldfire/howler.js: Javascript audio library for the modern web. · GitHub, [https\://github.com/goldfire/howler.js/](https://github.com/goldfire/howler.js/)  
> 16. react-howler: downloads, bundle size, alternatives | JavaScripts.com, [https\://javascripts.com/packages/react-howler/](https://javascripts.com/packages/react-howler/)  
> 17. @types/react-howler \- npm, [https\://www\.npmjs.com/package/@types/react-howler](https://www.npmjs.com/package/@types/react-howler)  
> 18. state-management — Skill \- AIMarketly, [https\://www\.aimarketly.com/skill/asyrafhussin--agent-skills--state-management](https://www.aimarketly.com/skill/asyrafhussin--agent-skills--state-management)  
> 19. zustand: downloads, bundle size, alternatives | JavaScripts.com, [https\://javascripts.com/packages/zustand/](https://javascripts.com/packages/zustand/)  
> 20. React State Management in 2026: A Data-Driven Comparison, [https\://saschb2b.com/en/blog/react-state-management-2026](https://saschb2b.com/en/blog/react-state-management-2026)  
> 21. pmndrs/zustand: Bear necessities for state management in React, [https\://github.com/pmndrs/zustand](https://github.com/pmndrs/zustand)  
> 22. Zustand and React Context \- TkDodo's blog, [https\://tkdodo.eu/blog/zustand-and-react-context](https://tkdodo.eu/blog/zustand-and-react-context)  
> 23. Mastering Zustand — The Modern React State Manager (v4 & v5, [https\://dev.to/vishwark/mastering-zustand-the-modern-react-state-manager-v4-v5-guide-8mm](https://dev.to/vishwark/mastering-zustand-the-modern-react-state-manager-v4-v5-guide-8mm)  
> 24. Supabase Review 2026: Free Tier Catch and the \$599 Jump, [https\://www\.jetadmin.io/blog/supabase-review/](https://www.jetadmin.io/blog/supabase-review/)  
> 25. Supabase Free Tier Paused and Lost Data: What Happened, [https\://simplebackups.com/blog/supabase-free-tier-paused](https://simplebackups.com/blog/supabase-free-tier-paused)  
> 26. Project Pausing | Supabase Docs, [https\://supabase.com/docs/guides/platform/free-project-pausing](https://supabase.com/docs/guides/platform/free-project-pausing)  
> 27. Free-plan inactivity pausing: what counts as activity, and how can I, [https\://github.com/orgs/supabase/discussions/51126](https://github.com/orgs/supabase/discussions/51126)  
> 28. Keep Your Supabase Free Tier Project Live Past The Limit, [https\://aiagencyplus.com/keep-your-supabase-free-tier-project-live-past-the-limit/](https://aiagencyplus.com/keep-your-supabase-free-tier-project-live-past-the-limit/)  
> 29. How to Keep Supabase Free Tier Projects Active \- Medium, [https\://shadhujan.medium.com/how-to-keep-supabase-free-tier-projects-active-d60fd4a17263](https://shadhujan.medium.com/how-to-keep-supabase-free-tier-projects-active-d60fd4a17263)  
> 30. Upstash: Solution Overview, Pros/Cons, and Alternatives \- Dragonfly, [https\://www\.dragonflydb.io/guides/upstash-solution-overview-pros-cons-and-alternatives](https://www.dragonflydb.io/guides/upstash-solution-overview-pros-cons-and-alternatives)  
> 31. Upstash Redis on Vercel — The Tool I Didn't Know I Needed \- Medium, [https\://medium.com/@amarharolikar/upstash-redis-on-vercel-the-tool-i-didnt-know-i-needed-7ecfbb6e7a6e](https://medium.com/@amarharolikar/upstash-redis-on-vercel-the-tool-i-didnt-know-i-needed-7ecfbb6e7a6e)  
> 32. Upstash Redis for Serverless Caching in AI-Built Apps, [https\://blog.vibecoder.me/upstash-redis-serverless-caching](https://blog.vibecoder.me/upstash-redis-serverless-caching)  
> 33. Storage on Vercel Marketplace, [https\://vercel.com/docs/marketplace-storage](https://vercel.com/docs/marketplace-storage)  
> 34. Deploying React with Vercel | Vercel Knowledge Base, [https\://vercel.com/kb/guide/deploying-react-with-vercel](https://vercel.com/kb/guide/deploying-react-with-vercel)  
> 35. Static Configuration with vercel.json, [https\://vercel.com/docs/project-configuration/vercel-json](https://vercel.com/docs/project-configuration/vercel-json)  
> 36. Vite on Vercel, [https\://vercel.com/docs/frameworks/frontend/vite](https://vercel.com/docs/frameworks/frontend/vite)  
> 37. Vercel Storage overview, [https\://vercel.com/docs/storage](https://vercel.com/docs/storage)  
> 38. System Headers \- Vercel, [https\://vercel.com/docs/headers](https://vercel.com/docs/headers)  
> 39. Serving Static Files \- Vercel, [https\://vercel.com/docs/platforms/multi-tenant-platforms/serving-static-files](https://vercel.com/docs/platforms/multi-tenant-platforms/serving-static-files)  
> 40. Vercel CDN now respects Cache-Control headers from external, [https\://vercel.com/changelog/vercels-cdn-now-respects-cache-control-headers-from-external-origins-by-default](https://vercel.com/changelog/vercels-cdn-now-respects-cache-control-headers-from-external-origins-by-default)  
> 41. Vercel Functions Limits, [https\://vercel.com/docs/functions/limitations](https://vercel.com/docs/functions/limitations)  
> 42. Can you use Vercel for backend? What works and when ... \- Northflank, [https\://northflank.com/blog/vercel-backend-limitations](https://northflank.com/blog/vercel-backend-limitations)  
> 43. lucide-react \- NPM, [https\://www\.npmjs.com/package/lucide-react](https://www.npmjs.com/package/lucide-react)  
> 44. zustand-utils \- NPM, [https\://www\.npmjs.com/package/zustand-utils](https://www.npmjs.com/package/zustand-utils)