# Cosmic Evolution

Cosmic Evolution is an original HTML5 Canvas gravity game prototype built as a public portfolio project by Rusu Florin Teodor / TeoGame&3D.

It is not a clone of any commercial game. The project uses a familiar cosmic sandbox idea - mass growth, gravity, orbiting bodies, hazards and a final universe cycle - as a small, inspectable browser-game case study.

## Why This Project Exists

This project is meant to demonstrate junior-level engineering signals in a visual, interactive form:

- JavaScript game loop structure
- HTML5 Canvas rendering
- procedural asteroid and planet generation
- simplified orbital gravity
- collision, damage and fragment systems
- animated absorption states instead of instant object removal
- mobile and desktop input handling
- localStorage leaderboard
- debug state that can be inspected from the browser console

The career goal behind the project is practical: build a stable Python / QA foundation now, while developing a longer-term game-development direction through small, reviewable projects.

## Gameplay Systems

- Start as a vulnerable Big Bang particle.
- Absorb smaller bodies to gain XP and mass.
- Larger bodies can damage the player and fracture into smaller pieces.
- Captured bodies can orbit temporarily before being absorbed.
- Advanced stages add stronger gravity and black-hole style visual absorption.
- A complete run enters Cosmic Collapse and Universal Rebirth.

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

This returns score, stage, bodies, orbiting objects, captured objects, absorbing objects, health, fragments, quality mode, FPS and other runtime signals.

## Portfolio Context

- Live portfolio case study: https://teogame3d-site.pages.dev/programming.html
- GitHub profile: https://github.com/teogame3d-alt
- 3D portfolio: https://teogame3d-site.pages.dev/

## Roadmap

- Add mission objectives and survival targets.
- Add optional Web Audio feedback.
- Add a backend leaderboard.
- Improve spatial partitioning for larger simulations.
- Build a small C++ / Unreal learning prototype using the same design idea.

## License

Code is released under the MIT License. Visual identity text and TeoGame&3D branding remain associated with the author.
