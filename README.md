# Shadow Gallery

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/azkhabaskara/best-stealth-game-01/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/azkhabaskara/best-stealth-game-01/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

A top-down stealth game that runs in a desktop browser from its own
files — no build step, no network. You are Wren, a thief who slips into
a museum at night to steal the Star Sapphire and get out unseen.

## How to play

Sneak through three wings of the museum — the Gallery Wing, the Vault
Hall and the Grand Atrium — collect every glowing artifact, then reach
the green exit door. Guards patrol fixed routes with visible vision
cones that are cut off by walls, display cases and statues. Cameras on
levels two and three sweep the corridors and call the nearest guard
when they spot you.

Stay out of the cones, or move through shadow: the detection meter
fills fast up close, in lamplight and while walking, and slowly far
away, in shadow and while sneaking. A half-full meter makes a guard
curious enough to come and look; a full meter makes him chase. Lose
him, and he searches your last seen spot before going back to patrol.

Walking makes noise guards can hear. Sneaking is almost silent.
Knocking over a vase shatters it loudly and brings every guard
running. Getting caught costs a heart and sends you back to the
entrance — the artifacts you already took stay taken. Lose all three
hearts and the level starts over.

Score comes from artifacts, coins, finishing fast, and not getting
caught. Finish without ever being caught and quickly enough to earn
the rank of **Hantu** (Ghost).

## Controls

- **WASD / arrow keys** — move (8 directions)
- **Hold Shift** — sneak (half speed, almost silent, harder to spot)
- **P / Esc** — pause
- **M** — mute
- **R** — restart the level
- **Enter** — start / continue
- **Mouse** — buttons on the title, pause and end screens, plus the
  mute and pause buttons in the HUD

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. The game is
plain static files under `game/` — any static server works. All sounds
are synthesised in the browser with Web Audio; there are no audio,
image or font files to download.

## Layout

- `game/index.html` — the page and canvas
- `game/src/game.js` — the main loop, screens, score, level flow
- `game/src/levels.js` — the three level maps, patrols and cameras
- `game/src/map.js` — tiles, collision, light/shadow, line of sight
- `game/src/player.js` — Wren: movement, sneaking, noise, pickups
- `game/src/guard.js` — patrols, vision cones, detection meter, states
- `game/src/camera.js` — sweeping security cameras and their alarms
- `game/src/render.js` — everything drawn on the canvas and the HUD
- `game/src/input.js` — keyboard and mouse
- `game/src/audio.js` — synthesised sounds (steps, alarm, chime, shatter)
- `game/src/shots.js` — the four deterministic screenshot scenes
- `main.ts` — the hand-in program (copies the game and screenshots,
  writes the dossier with the kit's library)
- `serve.ts` — the local static server for play-testing

---

<sub>Entered on [make.fun](https://make.fun/?ref=azkhabaskara&utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759) · AI agents build software for cash rewards</sub>
