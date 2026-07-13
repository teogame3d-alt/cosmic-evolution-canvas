# Cosmic Evolution

Cosmic Evolution is an original HTML5 Canvas gravity game prototype built as a public portfolio project by Rusu Florin Teodor / TeoGame&3D.

It is not a clone of any commercial game. The project uses a familiar cosmic sandbox idea - mass growth, gravity, orbiting bodies, hazards and a final universe cycle - as a small, inspectable browser-game case study.

## Portfolio Demo & Authorship Note

This repository is public on purpose: recruiters and technical reviewers can inspect the implementation, run the game locally, and compare it with the live portfolio deployment.

The code is released for learning and review under the repository license. The TeoGame&3D branding, personal portfolio presentation, authorship context and visual identity remain associated with Rusu Florin Teodor and should not be reused to impersonate this portfolio or present the project as someone else's original career work.

## Why This Project Exists

This project is meant to demonstrate junior-level engineering signals in a visual, interactive form:

- JavaScript game loop structure
- HTML5 Canvas rendering
- procedural asteroid and planet generation
- simplified orbital gravity
- secondary body-to-body gravity for small orbital interactions
- collision, damage, fragment and asteroid-persistence tuning systems
- gravity-well hazards, asteroid shrapnel, entropy pressure and edge pressure
- animated absorption states instead of instant object removal
- gravity-safe cleanup so captured bodies are not removed while inside the influence field
- run objectives that expose the technical goals during play
- mobile and desktop input handling
- localStorage leaderboard
- debug state that can be inspected from the browser console
- a small C++ rules prototype for future native/WASM validation experiments

The career goal behind the project is practical: build a stable Python / QA foundation now, while developing a longer-term game-development direction through small, reviewable projects.

## Gameplay Systems

- Start as a vulnerable Big Bang particle.
- The run opens with a small Big Bang birth animation.
- Absorb smaller bodies to gain XP and mass.
- Only larger bodies damage the player; small meteorites cannot destroy bodies many times larger than themselves.
- Captured bodies can orbit temporarily before being absorbed.
- A small objective panel tracks orbital capture, clean absorption, integrity and stage progress.
- Advanced stages add stronger gravity and black-hole style visual absorption.
- Larger hazardous bodies can pull the player and sling smaller asteroids through their own gravity wells.
- Asteroid-to-asteroid impacts can create shrapnel, making the field more dangerous without artificial warning circles.
- A complete run enters Cosmic Collapse, compresses into a tiny final singularity, then triggers a universe explosion and Universal Rebirth.

## Controls

Desktop:

- Mouse movement: steer toward pointer
- WASD / arrow keys: steer
- Space: brake
- Click: supernova pulse
- P: pause
- R: restart

Mobile:

- Virtual joystick: steer
- Pulse button: supernova
- Pause / Restart buttons
- Drag or tap inside the canvas also works

## Run Locally

No build step is required.

```bash
python -m http.server 8125
```

Then open:

```text
http://127.0.0.1:8125/
```

## Debugging

In the browser console:

```js
window.__tg3dGameDebug()
```

This returns score, stage, bodies, orbiting objects, maximum orbiting count, captured objects, absorbing objects, health, fragments, quality mode, FPS and other runtime signals.

## C++ Rules Prototype

The browser game runs in JavaScript because the portfolio site is static. The `cpp/cosmic_rules.cpp` file is a small C++17 reference module for collision, absorption and gravity-radius rules. It is included to show how the gameplay rules could later be moved toward a native module, WebAssembly experiment, Unreal prototype or backend score validation service.

## Portfolio Context

- Live portfolio case study: https://teogame3d-site.pages.dev/programming.html
- GitHub profile: https://github.com/teogame3d-alt
- 3D portfolio: https://teogame3d-site.pages.dev/

## Roadmap

- Tune mission objectives and survival targets after more playtesting.
- Improve realistic black-hole, meteorite and planet rendering.
- Add optional Web Audio feedback.
- Add a backend leaderboard.
- Improve spatial partitioning for larger simulations.
- Expand the C++ rules prototype into a small native / Unreal learning prototype using the same design idea.

## License

Code is released under the MIT License. Visual identity text and TeoGame&3D branding remain associated with the author.
