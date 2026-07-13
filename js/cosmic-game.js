(() => {
  const canvas = document.getElementById("cosmicGameCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const BUILD_VERSION = "2026.07.13d";
  const SCORE_KEY = "tg3d-cosmic-evolution-scores";

  const ui = {
    start: document.getElementById("startGame"),
    pause: document.getElementById("pauseGame"),
    restart: document.getElementById("restartGame"),
    overlay: document.getElementById("gameOverlay"),
    complete: document.getElementById("gameComplete"),
    score: document.getElementById("scoreValue"),
    xp: document.getElementById("xpValue"),
    level: document.getElementById("levelValue"),
    mass: document.getElementById("massValue"),
    health: document.getElementById("healthValue"),
    xpBar: document.getElementById("xpBar"),
    healthBar: document.getElementById("healthBar"),
    stage: document.getElementById("stageLabel"),
    status: document.getElementById("gameStateLabel"),
    debugToggle: document.getElementById("debugToggle"),
    debugPanel: document.getElementById("gameDebugPanel"),
    debugFps: document.getElementById("debugFps"),
    debugMass: document.getElementById("debugMass"),
    debugGravity: document.getElementById("debugGravity"),
    debugOrbiting: document.getElementById("debugOrbiting"),
    debugAbsorbed: document.getElementById("debugAbsorbed"),
    debugHealth: document.getElementById("debugHealth"),
    debugShield: document.getElementById("debugShield"),
    debugQuality: document.getElementById("debugQuality"),
    debugStage: document.getElementById("debugStage"),
    debugXp: document.getElementById("debugXp"),
    debugBuild: document.getElementById("debugBuild"),
    missionOrbit: document.getElementById("missionOrbit"),
    missionAbsorb: document.getElementById("missionAbsorb"),
    missionIntegrity: document.getElementById("missionIntegrity"),
    missionStage: document.getElementById("missionStage"),
    completeTitle: document.getElementById("completeTitle"),
    finalScore: document.getElementById("finalScore"),
    finalMass: document.getElementById("finalMass"),
    finalTime: document.getElementById("finalTime"),
    finalAbsorbed: document.getElementById("finalAbsorbed"),
    finalStage: document.getElementById("finalStage"),
    playerName: document.getElementById("playerName"),
    saveScore: document.getElementById("saveScore"),
    restartUniverse: document.getElementById("restartUniverse"),
    leaderboard: document.getElementById("leaderboardList"),
    clearScores: document.getElementById("clearScores"),
    joystick: document.getElementById("virtualJoystick"),
    joystickKnob: document.getElementById("joystickKnob"),
    mobilePulse: document.getElementById("mobilePulse"),
    mobilePause: document.getElementById("mobilePause"),
    mobileRestart: document.getElementById("mobileRestart"),
  };

  const stages = [
    { name: "Big Bang Particle", xp: 0, radius: 12, mass: 0.62, color: "#c7f6ff", glow: "#55d7ff", gravity: 0.2, type: "particle", arms: 0 },
    { name: "Meteorite", xp: 95, radius: 18, mass: 1, color: "#d49a55", glow: "#ffc66a", gravity: 0.24, type: "rock", arms: 0 },
    { name: "Natural Satellite", xp: 240, radius: 24, mass: 1.55, color: "#c7d2df", glow: "#8edaff", gravity: 0.31, type: "moon", arms: 1 },
    { name: "Planet", xp: 480, radius: 31, mass: 2.25, color: "#4dd6ff", glow: "#68f0d1", gravity: 0.42, type: "planet", arms: 2 },
    { name: "Star", xp: 860, radius: 40, mass: 3.3, color: "#ffe17d", glow: "#ffd86a", gravity: 0.58, type: "star", arms: 5 },
    { name: "Black Hole", xp: 1380, radius: 51, mass: 5.4, color: "#070a11", glow: "#7adfff", gravity: 0.82, type: "black-hole", arms: 8 },
    { name: "Binary Singularity", xp: 2050, radius: 61, mass: 7.3, color: "#050711", glow: "#ffd86a", gravity: 1.02, type: "binary", arms: 10 },
    { name: "Supermassive Black Hole", xp: 2860, radius: 72, mass: 9.8, color: "#02040a", glow: "#f4c867", gravity: 1.22, type: "supermassive", arms: 12 },
    { name: "Cosmic Collapse", xp: 3900, radius: 86, mass: 13.4, color: "#01020a", glow: "#fff4bf", gravity: 1.5, type: "collapse", arms: 16 },
  ];

  const finalXp = 4620;
  const collapseDuration = reduceMotion ? 210 : 390;
  const rebirthDuration = reduceMotion ? 100 : 170;

  const state = {
    width: 1,
    height: 1,
    dpr: 1,
    running: false,
    paused: false,
    mode: "ready",
    raf: 0,
    lastTime: performance.now(),
    runStartedAt: 0,
    elapsed: 0,
    frame: 0,
    fps: 0,
    fpsTimer: 0,
    fpsFrames: 0,
    spawnTimer: 0,
    score: 0,
    xp: 0,
    level: 1,
    stageIndex: 0,
    highestStageIndex: 0,
    absorbed: 0,
    impacts: 0,
    fragments: 0,
    damageTaken: 0,
    maxOrbiting: 0,
    stars: [],
    bodies: [],
    particles: [],
    rings: [],
    keys: new Set(),
    collapseTimer: 0,
    rebirthTimer: 0,
    finalSnapshot: null,
    debugVisible: false,
    quality: "high",
    qualityScale: 1,
    qualityCooldown: 0,
    soundEvents: [],
    impactShake: 0,
    dangerFlash: 0,
    pointer: {
      active: false,
      x: 0,
      y: 0,
    },
    joystick: {
      active: false,
      x: 0,
      y: 0,
      strength: 0,
      pointerId: null,
    },
    gesture: {
      pointerId: null,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      startedAt: 0,
      moved: false,
    },
    player: {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: stages[0].radius,
      mass: stages[0].mass,
      health: 100,
      maxHealth: 100,
      shield: 0,
      angle: 0,
      invulnerable: 0,
    },
  };

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function currentStage() {
    return stages[state.stageIndex];
  }

  function formatTime(seconds) {
    const value = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(value / 60);
    const rest = value % 60;
    return `${minutes}:${String(rest).padStart(2, "0")}`;
  }

  function gravityRadius() {
    const stage = currentStage();
    const base = state.player.radius * (5.15 + state.stageIndex * 0.54);
    const massField = state.player.mass * (16 + state.stageIndex * 0.8) + stage.gravity * 48;
    return clamp(base + massField, 165, state.width < 640 ? 410 : 620);
  }

  function absorptionRadius() {
    const stage = currentStage();
    return state.player.radius * (stage.type.includes("black") || stage.type === "collapse" || stage.type === "supermassive" ? 0.92 : 0.72);
  }

  function orbitCaptureRadius() {
    const stage = currentStage();
    const scale = stage.type === "star"
      ? 0.88
      : stage.type === "planet"
        ? 0.78
        : stage.type === "moon"
          ? 0.72
          : stage.type.includes("black") || stage.type === "supermassive" || stage.type === "collapse"
            ? 0.94
            : 0.6;
    return gravityRadius() * scale;
  }

  function qualityLimit(base) {
    if (state.quality === "low") return Math.round(base * 0.56);
    if (state.quality === "medium") return Math.round(base * 0.78);
    return base;
  }

  function setQuality(value) {
    if (state.quality === value) return;
    state.quality = value;
    state.qualityScale = value === "low" ? 0.58 : value === "medium" ? 0.78 : 1;
  }

  function updateQualityFromFps() {
    if (state.qualityCooldown > 0) {
      state.qualityCooldown -= 1;
      if (!(state.quality === "low" && state.fps > 50)) return;
      state.qualityCooldown = 0;
    }
    if (state.fps <= 0) {
      return;
    }
    const compact = state.width < 640;
    if (compact && state.fps < 34) {
      setQuality("low");
      state.qualityCooldown = 28;
    } else if (compact) {
      setQuality("medium");
    } else if (state.fps < 44) {
      setQuality("medium");
      state.qualityCooldown = 34;
    } else {
      setQuality("high");
    }
  }

  function recordSoundCue(name, intensity = 1) {
    state.soundEvents.push({
      name,
      intensity: Number(intensity.toFixed(2)),
      time: Math.round(state.elapsed * 100) / 100,
    });
    if (state.soundEvents.length > 10) state.soundEvents.shift();
  }

  function startAbsorption(body, finalForm = false, source = "gravity") {
    if (body.absorbing) return;
    body.absorbing = true;
    body.absorbTimer = 0;
    body.absorbDuration = finalForm ? rand(28, 50) : rand(50, 88);
    body.absorbStartRadius = body.radius;
    body.absorbValue = body.value;
    body.absorbAlpha = 1;
    body.orbiting = true;
    body.captured = true;
    body.orbitAlpha = 1;
    recordSoundCue(source === "pulse" ? "pulse-capture" : finalForm ? "gravity-absorb" : "orbital-absorb", clamp(body.value / 32, 0.25, 1));
    absorptionImpact(body, finalForm, source);
  }

  function isBlackHoleStage(stage = currentStage()) {
    return stage.type.includes("black") || stage.type === "binary" || stage.type === "supermassive" || stage.type === "collapse";
  }

  function isOrbitalStage(stage = currentStage()) {
    return stage.type === "moon" || stage.type === "planet" || stage.type === "star" || isBlackHoleStage(stage);
  }

  function shieldCapacity() {
    if (state.stageIndex < 4) return 0;
    return 14 + state.stageIndex * 5;
  }

  function healthPercent() {
    return clamp((state.player.health / Math.max(1, state.player.maxHealth)) * 100, 0, 100);
  }

  function triggerFrameImpact(gameOver = false) {
    const frame = canvas.closest(".game-frame");
    if (!frame) return;
    frame.classList.remove("is-hit");
    void frame.offsetWidth;
    frame.classList.add("is-hit");
    frame.classList.toggle("is-game-over", gameOver);
  }

  function healPlayer(amount) {
    if (amount <= 0 || state.mode !== "play") return;
    state.player.health = Math.min(state.player.maxHealth, state.player.health + amount);
  }

  function trimBodies(limit) {
    while (state.bodies.length > limit) {
      let removeIndex = -1;
      let lowestPriority = Infinity;
      const influence = gravityRadius() * 1.1;
      for (let index = 0; index < state.bodies.length; index += 1) {
        const body = state.bodies[index];
        const dx = body.x - state.player.x;
        const dy = body.y - state.player.y;
        const distance = Math.hypot(dx, dy);
        const protectedByGravity = distance < influence || body.absorbing || body.captured || body.orbiting || body.orbitAlpha > 0.08;
        if (protectedByGravity) continue;

        let priority = -distance * 0.01;
        if (body.dangerous) priority += 340;
        if (body.fragment) priority += 160;
        if (priority < lowestPriority) {
          lowestPriority = priority;
          removeIndex = index;
        }
      }
      if (removeIndex < 0) break;
      state.bodies.splice(removeIndex, 1);
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    state.width = Math.max(320, Math.floor(rect.width));
    state.height = Math.max(360, Math.floor(rect.height));
    setQuality(state.width < 640 ? "medium" : "high");
    state.dpr = Math.min(window.devicePixelRatio || 1, state.width < 640 ? 1.25 : 1.6);
    canvas.width = Math.floor(state.width * state.dpr);
    canvas.height = Math.floor(state.height * state.dpr);
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

    if (!state.player.x || !state.player.y) {
      state.player.x = state.width * 0.5;
      state.player.y = state.height * 0.55;
      state.pointer.x = state.player.x;
      state.pointer.y = state.player.y;
    }

    const starCount = qualityLimit(Math.round(clamp((state.width * state.height) / 4300, 95, 260)));
    state.stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * state.width,
      y: Math.random() * state.height,
      ox: Math.random() * state.width,
      oy: Math.random() * state.height,
      z: rand(0.2, 1),
      r: rand(0.45, 1.9),
      twinkle: Math.random() * Math.PI * 2,
      color: Math.random() > 0.8 ? "255, 216, 106" : "159, 226, 255",
    }));
  }

  function setStatus(label) {
    if (ui.status) ui.status.textContent = label;
  }

  function resetGame() {
    state.running = false;
    state.paused = false;
    state.mode = "ready";
    if (state.raf) {
      cancelAnimationFrame(state.raf);
      state.raf = 0;
    }
    state.spawnTimer = 0;
    state.score = 0;
    state.xp = 0;
    state.level = 1;
    state.stageIndex = 0;
    state.highestStageIndex = 0;
    state.absorbed = 0;
    state.impacts = 0;
    state.fragments = 0;
    state.damageTaken = 0;
    state.maxOrbiting = 0;
    state.elapsed = 0;
    state.frame = 0;
    state.fps = 0;
    state.fpsTimer = 0;
    state.fpsFrames = 0;
    state.qualityCooldown = 0;
    state.collapseTimer = 0;
    state.rebirthTimer = 0;
    state.finalSnapshot = null;
    state.soundEvents = [];
    state.impactShake = 0;
    state.dangerFlash = 0;
    state.bodies = [];
    state.particles = [];
    state.rings = [];
    state.player.x = state.width * 0.5;
    state.player.y = state.height * 0.55;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.radius = stages[0].radius;
    state.player.mass = stages[0].mass;
    state.player.maxHealth = 100;
    state.player.health = state.player.maxHealth;
    state.player.shield = 0;
    state.player.angle = 0;
    state.player.invulnerable = 0;
    state.pointer.active = false;
    state.pointer.x = state.player.x;
    state.pointer.y = state.player.y;
    state.joystick.active = false;
    state.joystick.x = 0;
    state.joystick.y = 0;
    state.joystick.strength = 0;
    state.joystick.pointerId = null;
    ui.joystickKnob?.style.setProperty("--stick-x", "0px");
    ui.joystickKnob?.style.setProperty("--stick-y", "0px");
    state.gesture.pointerId = null;
    state.gesture.moved = false;
    for (let i = 0; i < 11; i += 1) spawnBody(true);
    supernova(state.player.x, state.player.y, reduceMotion ? 32 : 72, true, false);
    updateUi();
    ui.overlay?.classList.remove("hidden");
    ui.complete?.classList.add("hidden");
    canvas.closest(".game-frame")?.classList.remove("is-game-over");
    if (ui.completeTitle) ui.completeTitle.textContent = "Run Complete";
    if (ui.saveScore) ui.saveScore.textContent = "Save Score";
    if (ui.finalStage) ui.finalStage.textContent = stages[0].name;
    if (ui.mobilePause) ui.mobilePause.textContent = "Pause";
    setStatus("Ready");
    draw(performance.now());
  }

  function startGame() {
    if (state.mode === "complete") {
      resetGame();
    }
    if (!state.running) {
      state.running = true;
      state.mode = "play";
      state.runStartedAt = performance.now();
      ui.overlay?.classList.add("hidden");
      ui.complete?.classList.add("hidden");
      setStatus("Running");
    }
    state.paused = false;
    if (ui.mobilePause) ui.mobilePause.textContent = "Pause";
    state.lastTime = performance.now();
    if (!state.raf) state.raf = requestAnimationFrame(loop);
  }

  function togglePause() {
    if (!state.running || state.mode === "complete") return;
    state.paused = !state.paused;
    setStatus(state.paused ? "Paused" : modeLabel());
    if (ui.mobilePause) ui.mobilePause.textContent = state.paused ? "Resume" : "Pause";
    if (!state.paused) {
      state.lastTime = performance.now();
      if (!state.raf) state.raf = requestAnimationFrame(loop);
    }
  }

  function modeLabel() {
    if (state.mode === "collapse") return "Cosmic Collapse";
    if (state.mode === "rebirth") return "Universal Rebirth";
    if (state.mode === "complete") return "Run Complete";
    return "Running";
  }

  function stageForXp(xp) {
    let index = 0;
    for (let i = 0; i < stages.length; i += 1) {
      if (xp >= stages[i].xp) index = i;
    }
    return index;
  }

  function addXp(amount, x, y) {
    const previousStage = state.stageIndex;
    state.xp += amount;
    state.score += Math.round(amount * (6.5 + state.stageIndex * 0.15));
    state.level = Math.floor(state.xp / 125) + 1;
    state.stageIndex = stageForXp(state.xp);
    state.highestStageIndex = Math.max(state.highestStageIndex, state.stageIndex);

    const stage = currentStage();
    state.player.radius += (stage.radius - state.player.radius) * 0.24 + 0.22;
    state.player.mass += (stage.mass - state.player.mass) * 0.2 + 0.028;
    state.player.maxHealth = 100 + state.stageIndex * 8;
    state.player.health = Math.min(state.player.maxHealth, state.player.health + amount * 0.018 + 0.22);

    if (state.stageIndex > previousStage) {
      supernova(x, y, 32 + state.stageIndex * 8, state.stageIndex >= 5, false);
      state.player.health = Math.min(state.player.maxHealth, state.player.health + 18 + state.stageIndex * 2);
      state.player.shield = Math.min(shieldCapacity(), state.player.shield + 10 + state.stageIndex);
      state.player.invulnerable = 1.5;
    }

    if (state.xp >= finalXp && state.mode === "play") {
      beginCollapse();
    }
  }

  function updateUi() {
    const stage = currentStage();
    const next = stages[state.stageIndex + 1];
    const start = stage.xp;
    const end = next ? next.xp : finalXp;
    const progress = clamp(((state.xp - start) / Math.max(1, end - start)) * 100, 0, 100);
    const orbitingCount = state.bodies.filter((body) => body.orbiting || body.orbitAlpha > 0.05).length;
    state.maxOrbiting = Math.max(state.maxOrbiting, orbitingCount);

    if (ui.score) ui.score.textContent = String(state.score);
    if (ui.xp) ui.xp.textContent = String(Math.floor(state.xp));
    if (ui.level) ui.level.textContent = String(state.level);
    if (ui.mass) ui.mass.textContent = `${state.player.mass.toFixed(1)}x`;
    if (ui.health) ui.health.textContent = `${Math.round(healthPercent())}%`;
    if (ui.stage) ui.stage.textContent = stage.name;
    if (ui.xpBar) ui.xpBar.style.width = `${progress}%`;
    if (ui.healthBar) {
      ui.healthBar.style.width = `${healthPercent()}%`;
      ui.healthBar.classList.toggle("is-low", healthPercent() < 34);
    }

    if (ui.debugFps) ui.debugFps.textContent = String(Math.round(state.fps));
    if (ui.debugMass) ui.debugMass.textContent = `${state.player.mass.toFixed(1)}x`;
    if (ui.debugGravity) ui.debugGravity.textContent = String(Math.round(gravityRadius()));
    if (ui.debugOrbiting) ui.debugOrbiting.textContent = String(orbitingCount);
    if (ui.debugAbsorbed) ui.debugAbsorbed.textContent = String(state.absorbed);
    if (ui.debugHealth) ui.debugHealth.textContent = `${Math.round(state.player.health)}/${Math.round(state.player.maxHealth)}`;
    if (ui.debugShield) ui.debugShield.textContent = String(Math.round(state.player.shield));
    if (ui.debugQuality) ui.debugQuality.textContent = state.quality[0].toUpperCase() + state.quality.slice(1);
    if (ui.debugStage) ui.debugStage.textContent = state.mode === "rebirth" ? "Universal Rebirth" : stage.name;
    if (ui.debugXp) ui.debugXp.textContent = `${Math.round(progress)}%`;
    if (ui.debugBuild) ui.debugBuild.textContent = BUILD_VERSION;
    if (ui.missionOrbit) ui.missionOrbit.textContent = `${Math.min(state.maxOrbiting, 5)}/5`;
    if (ui.missionAbsorb) ui.missionAbsorb.textContent = `${Math.min(state.absorbed, 24)}/24`;
    if (ui.missionIntegrity) ui.missionIntegrity.textContent = `${Math.round(healthPercent())}%`;
    if (ui.missionStage) ui.missionStage.textContent = stage.name;
  }

  function spawnBody(initial = false) {
    const side = Math.floor(Math.random() * 4);
    const margin = initial ? 0 : 70;
    const x = side === 0 ? -margin : side === 1 ? state.width + margin : rand(0, state.width);
    const y = side === 2 ? -margin : side === 3 ? state.height + margin : rand(0, state.height);
    const anchorX = state.player.x || state.width * 0.5;
    const anchorY = state.player.y || state.height * 0.55;
    const targetX = anchorX + rand(-state.width * 0.22, state.width * 0.22);
    const targetY = anchorY + rand(-state.height * 0.2, state.height * 0.2);
    const angle = Math.atan2(targetY - y, targetX - x);
    const approachAngle = angle + rand(-0.5, 0.5);
    const tangentAngle = angle + Math.PI / 2;
    const maxRadius = 22 + state.stageIndex * 2.8;
    const hazardRoll = !initial && Math.random() > (state.width < 640 ? 0.78 : 0.72);
    const radius = hazardRoll
      ? rand(Math.max(13, state.player.radius * 0.92), Math.max(maxRadius, state.player.radius * (1.15 + state.stageIndex * 0.025)))
      : rand(7, maxRadius);
    const density = rand(0.68, 1.48);
    const value = Math.max(5, Math.round(radius * density * 1.08));
    const kind = state.stageIndex >= 4 && !hazardRoll && Math.random() > 0.58 ? "planet" : "asteroid";
    const color = kind === "planet"
      ? (Math.random() > 0.5 ? "#4dd6ff" : "#9ff0d0")
      : Math.random() > 0.76 ? "#f4c867" : Math.random() > 0.46 ? "#8fdcff" : "#c7d2df";
    const points = Math.floor(rand(8, 12));
    const shape = Array.from({ length: points }, () => rand(0.68, 1.14));
    const craters = Array.from({ length: Math.floor(rand(2, 5)) }, () => ({
      x: rand(-0.42, 0.42),
      y: rand(-0.42, 0.42),
      r: rand(0.08, 0.18),
    }));
    const seededOrbit = initial && Math.random() > 0.34;
    const seedAngle = Math.random() * Math.PI * 2;
    const seedDistance = rand(gravityRadius() * 0.76, gravityRadius() * 1.16);
    const seedDir = Math.random() > 0.5 ? 1 : -1;

    const body = {
      x: seededOrbit ? clamp(anchorX + Math.cos(seedAngle) * seedDistance, 24, state.width - 24) : initial ? rand(20, state.width - 20) : x,
      y: seededOrbit ? clamp(anchorY + Math.sin(seedAngle) * seedDistance, 24, state.height - 24) : initial ? rand(20, state.height - 20) : y,
      vx: seededOrbit ? -Math.sin(seedAngle) * seedDir * rand(0.55, 1.15) : Math.cos(approachAngle) * rand(0.28, 1.05) + Math.cos(tangentAngle) * rand(-0.72, 0.72),
      vy: seededOrbit ? Math.cos(seedAngle) * seedDir * rand(0.55, 1.15) : Math.sin(approachAngle) * rand(0.28, 1.05) + Math.sin(tangentAngle) * rand(-0.72, 0.72),
      radius,
      mass: Math.max(0.28, (radius / 14) * density),
      value,
      spin: rand(-1.3, 1.3),
      angle: Math.random() * Math.PI * 2,
      color,
      kind,
      atmosphere: kind === "planet" ? (Math.random() > 0.38 ? "#68f0d1" : "#55d7ff") : "",
      ringed: kind === "planet" && Math.random() > 0.68,
      surfacePhase: Math.random() * Math.PI * 2,
      shape,
      craters,
      orbitDir: seededOrbit ? seedDir : Math.random() > 0.5 ? 1 : -1,
      orbitTilt: rand(-0.75, 0.75),
      orbiting: false,
      orbitAlpha: 0,
      orbitAge: 0,
      captured: false,
      absorbing: false,
      absorbTimer: 0,
      absorbDuration: 0,
      absorbStartRadius: radius,
      absorbAlpha: 1,
      fragment: false,
      dangerous: hazardRoll,
    };

    state.bodies.push(body);
    const limit = qualityLimit(state.width < 640 ? 18 : 30);
    trimBodies(limit);
  }

  function addParticle(x, y, options = {}) {
    const angle = options.angle ?? Math.random() * Math.PI * 2;
    const speed = options.speed ?? rand(0.6, 4.2);
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed + (options.vx || 0),
      vy: Math.sin(angle) * speed + (options.vy || 0),
      radius: options.radius ?? rand(0.8, 2.7),
      life: options.life ?? 1,
      decay: options.decay ?? rand(0.012, 0.026),
      color: options.color ?? (Math.random() > 0.54 ? "85, 215, 255" : "255, 216, 106"),
      line: options.line ?? Math.random() > 0.48,
      label: options.label || "",
      fontSize: options.fontSize || 0,
    });

    const limit = qualityLimit(state.width < 640 ? 220 : 390);
    if (state.particles.length > limit) state.particles.splice(0, state.particles.length - limit);
  }

  function burst(x, y, count = 20, color = "85, 215, 255") {
    const amount = Math.max(1, Math.round((reduceMotion ? count * 0.45 : count) * state.qualityScale));
    for (let i = 0; i < amount; i += 1) {
      addParticle(x, y, {
        angle: (Math.PI * 2 * i) / amount + rand(-0.16, 0.16),
        speed: rand(1.2, 5.4),
        radius: rand(0.9, 2.8),
        decay: rand(0.018, 0.034),
        color: i % 4 === 0 ? "255, 216, 106" : color,
        line: true,
      });
    }
  }

  function absorptionImpact(body, finalForm = false, source = "gravity") {
    const color = finalForm ? "255, 216, 106" : source === "pulse" ? "255, 244, 191" : "85, 215, 255";
    const force = finalForm ? 1.55 : source === "pulse" ? 1.25 : 1;
    burst(body.x, body.y, 10 + Math.round(body.radius * 0.65 * force), color);
    addParticle(body.x, body.y - body.radius - 8, {
      label: source === "pulse" ? "PULSE" : "CAPTURE",
      fontSize: state.width < 640 ? 11 : 13,
      speed: 1,
      angle: -Math.PI / 2 + rand(-0.24, 0.24),
      radius: 0.1,
      decay: 0.026,
      color,
      line: false,
    });
    state.rings.push({
      x: body.x,
      y: body.y,
      radius: Math.max(8, body.radius * 0.74),
      speed: finalForm ? 7.6 : 5.4,
      life: 0.86,
      decay: finalForm ? 0.024 : 0.038,
      color,
    });
    if (state.rings.length > 9) state.rings.splice(0, state.rings.length - 9);
  }

  function supernova(x, y, count = 72, finalForm = false, rewardNearby = true) {
    recordSoundCue(finalForm ? "supernova-large" : "supernova-pulse", finalForm ? 1 : 0.72);
    const amount = Math.max(1, Math.round((reduceMotion ? count * 0.45 : count) * state.qualityScale));
    for (let i = 0; i < amount; i += 1) {
      const color = i % 5 === 0 ? "255, 244, 191" : i % 3 === 0 ? "255, 216, 106" : "85, 215, 255";
      addParticle(x, y, {
        angle: (Math.PI * 2 * i) / amount + rand(-0.08, 0.08),
        speed: rand(finalForm ? 4 : 2.4, finalForm ? 10.5 : 7.2),
        radius: rand(1, finalForm ? 4.2 : 3.1),
        decay: rand(0.01, finalForm ? 0.024 : 0.032),
        color,
        line: true,
      });
    }

    state.rings.push({
      x,
      y,
      radius: finalForm ? 18 : 10,
      speed: finalForm ? 8.8 : 5.6,
      life: 1,
      decay: finalForm ? 0.014 : 0.028,
      color: finalForm ? "255, 216, 106" : "85, 215, 255",
    });
    if (state.rings.length > 8) state.rings.splice(0, state.rings.length - 8);

    if (!rewardNearby || !state.running || state.paused || state.mode !== "play") return;

    const range = finalForm ? 250 : 165;
    let earned = 0;
    for (let i = state.bodies.length - 1; i >= 0; i -= 1) {
      const body = state.bodies[i];
      const distance = Math.hypot(body.x - x, body.y - y);
      const canBreak = body.radius < state.player.radius * (finalForm ? 1.45 : 1.04);
      if (distance < range && canBreak) {
        if (!body.absorbing) earned += Math.max(3, Math.round(body.value * 0.18));
        startAbsorption(body, finalForm, "pulse");
      }
    }
    if (earned > 0) addXp(earned, x, y);
  }

  function fractureBody(body, nx, ny, impactForce = 1) {
    const count = Math.round(clamp(body.radius / 4.4 + impactForce * 0.35, 3, 8));
    const baseAngle = Math.atan2(-ny, -nx);
    const fragmentMass = Math.max(0.12, body.mass / (count * 1.35));
    const fragmentRadius = Math.max(4.5, body.radius / (count > 5 ? 2.9 : 2.45));

    for (let index = 0; index < count; index += 1) {
      const spread = baseAngle + (Math.PI * 2 * index) / count + rand(-0.36, 0.36);
      const radius = fragmentRadius * rand(0.62, 1.02);
      const points = Math.floor(rand(7, 11));
      state.bodies.push({
        x: body.x + Math.cos(spread) * body.radius * 0.32,
        y: body.y + Math.sin(spread) * body.radius * 0.32,
        vx: body.vx * 0.58 + Math.cos(spread) * rand(1.1, 3.2 + impactForce * 0.12),
        vy: body.vy * 0.58 + Math.sin(spread) * rand(1.1, 3.2 + impactForce * 0.12),
        radius,
        mass: fragmentMass * rand(0.72, 1.18),
        value: Math.max(2, Math.round(body.value / count * rand(0.5, 0.85))),
        spin: rand(-2.2, 2.2),
        angle: Math.random() * Math.PI * 2,
        color: Math.random() > 0.4 ? "#d49a55" : body.color,
        kind: "asteroid",
        atmosphere: "",
        ringed: false,
        surfacePhase: Math.random() * Math.PI * 2,
        shape: Array.from({ length: points }, () => rand(0.62, 1.22)),
        craters: Array.from({ length: Math.floor(rand(1, 3)) }, () => ({
          x: rand(-0.42, 0.42),
          y: rand(-0.42, 0.42),
          r: rand(0.07, 0.16),
        })),
        orbitDir: Math.random() > 0.5 ? 1 : -1,
        orbitTilt: rand(-0.75, 0.75),
        orbiting: false,
        orbitAlpha: 0,
        orbitAge: 0,
        captured: false,
        absorbing: false,
        absorbTimer: 0,
        absorbDuration: 0,
        absorbStartRadius: radius,
        absorbAlpha: 1,
        fragment: true,
        dangerous: false,
      });
    }

    state.fragments += count;
    recordSoundCue("rock-fracture", clamp(impactForce / 32, 0.35, 1));
    burst(body.x, body.y, 18 + count * 4, "255, 216, 106");
    state.rings.push({
      x: body.x,
      y: body.y,
      radius: Math.max(10, body.radius * 0.65),
      speed: 5.2 + impactForce * 0.1,
      life: 0.86,
      decay: 0.042,
      color: "255, 216, 106",
    });
  }

  function applyDamage(rawDamage, body, nx, ny, impactForce) {
    if (state.mode !== "play" || state.player.invulnerable > 0) return false;

    const resilience = clamp(1 - state.stageIndex * 0.07, 0.38, 1);
    const shieldBlock = Math.min(state.player.shield, rawDamage * 0.72);
    state.player.shield = Math.max(0, state.player.shield - shieldBlock);
    const damage = Math.max(1, rawDamage * resilience - shieldBlock);

    state.player.health = Math.max(0, state.player.health - damage);
    recordSoundCue(damage > 24 ? "heavy-impact" : "impact", clamp(damage / 42, 0.2, 1));
    state.player.invulnerable = 0.74;
    state.impacts += 1;
    state.damageTaken += damage;
    state.impactShake = Math.max(state.impactShake, clamp(impactForce / 9, 2, 9));
    state.dangerFlash = Math.max(state.dangerFlash, clamp(damage / 45, 0.22, 0.78));
    state.score = Math.max(0, state.score - Math.round(damage * 18));

    state.player.vx += nx * clamp(impactForce * 0.34, 2.1, 8.6);
    state.player.vy += ny * clamp(impactForce * 0.34, 2.1, 8.6);
    addParticle(state.player.x, state.player.y - state.player.radius - 8, {
      label: `-${Math.round(damage)} HP`,
      fontSize: 15,
      speed: 1.1,
      angle: -Math.PI / 2 + rand(-0.3, 0.3),
      radius: 0.1,
      decay: 0.02,
      color: "255, 108, 108",
      line: false,
    });
    burst(state.player.x, state.player.y, 18 + Math.round(damage * 0.28), damage > 18 ? "255, 108, 108" : "255, 216, 106");
    triggerFrameImpact(state.player.health <= 0);

    if (state.player.health <= 0) {
      gameOver("Integrity lost");
    }
    return true;
  }

  function gameOver(reason = "Cosmic integrity lost") {
    if (state.mode === "complete") return;
    state.mode = "complete";
    state.running = false;
    state.paused = false;
    state.finalSnapshot = {
      score: state.score,
      mass: state.player.mass,
      time: state.elapsed,
      stage: currentStage().name,
      maxStage: stages[state.highestStageIndex]?.name || currentStage().name,
      absorbed: state.absorbed,
      endedBy: reason,
    };
    recordSoundCue("game-over", 1);
    setStatus("Game Over");
    if (ui.completeTitle) ui.completeTitle.textContent = "Game Over";
    if (ui.finalScore) ui.finalScore.textContent = String(state.finalSnapshot.score);
    if (ui.finalMass) ui.finalMass.textContent = `${state.finalSnapshot.mass.toFixed(1)}x`;
    if (ui.finalTime) ui.finalTime.textContent = formatTime(state.finalSnapshot.time);
    if (ui.finalAbsorbed) ui.finalAbsorbed.textContent = String(state.finalSnapshot.absorbed);
    if (ui.finalStage) ui.finalStage.textContent = state.finalSnapshot.maxStage;
    ui.complete?.classList.remove("hidden");
    triggerFrameImpact(true);
    updateUi();
  }

  function updatePlayer(dt) {
    const player = state.player;
    const stage = currentStage();
    let ax = 0;
    let ay = 0;

    if (state.keys.has("ArrowLeft") || state.keys.has("KeyA")) ax -= 1;
    if (state.keys.has("ArrowRight") || state.keys.has("KeyD")) ax += 1;
    if (state.keys.has("ArrowUp") || state.keys.has("KeyW")) ay -= 1;
    if (state.keys.has("ArrowDown") || state.keys.has("KeyS")) ay += 1;

    if (state.pointer.active) {
      const dx = state.pointer.x - player.x;
      const dy = state.pointer.y - player.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const pull = clamp(distance / 300, 0, 1) * 0.72;
      ax += (dx / distance) * pull;
      ay += (dy / distance) * pull;
    }

    if (state.joystick.active || state.joystick.strength > 0.02) {
      ax += state.joystick.x * (0.62 + state.joystick.strength * 0.38);
      ay += state.joystick.y * (0.62 + state.joystick.strength * 0.38);
      state.pointer.active = true;
      state.pointer.x = clamp(player.x + state.joystick.x * 220, 0, state.width);
      state.pointer.y = clamp(player.y + state.joystick.y * 220, 0, state.height);
    }

    const braking = state.keys.has("Space") ? 0.82 : 1;
    const thrust = (0.38 + state.stageIndex * 0.018) * braking;
    player.vx += ax * thrust * dt;
    player.vy += ay * thrust * dt;
    player.vx *= Math.pow(state.keys.has("Space") ? 0.9 : 0.957, dt);
    player.vy *= Math.pow(state.keys.has("Space") ? 0.9 : 0.957, dt);

    if (stage.type.includes("black") || stage.type === "supermassive" || stage.type === "collapse") {
      for (let i = 0; i < 2; i += 1) {
        addParticle(player.x + rand(-player.radius, player.radius), player.y + rand(-player.radius, player.radius), {
          angle: Math.random() * Math.PI * 2,
          speed: rand(0.1, 1.2),
          radius: rand(0.8, 2),
          decay: rand(0.02, 0.04),
          color: i % 2 ? "255, 216, 106" : "85, 215, 255",
          line: false,
        });
      }
    }

    player.x += player.vx * dt;
    player.y += player.vy * dt;
    player.angle += (0.004 + state.stageIndex * 0.0018) * dt;
    player.invulnerable = Math.max(0, player.invulnerable - dt / 60);
    state.impactShake = Math.max(0, state.impactShake - 0.28 * dt);
    state.dangerFlash = Math.max(0, state.dangerFlash - 0.035 * dt);

    const capacity = shieldCapacity();
    if (capacity > 0 && state.frame % 3 === 0) {
      player.shield = Math.min(capacity, player.shield + 0.035 * dt + state.stageIndex * 0.004);
    } else if (capacity === 0) {
      player.shield = 0;
    }

    const bounce = 0.58;
    if (player.x < player.radius) {
      player.x = player.radius;
      player.vx = Math.abs(player.vx) * bounce;
    }
    if (player.x > state.width - player.radius) {
      player.x = state.width - player.radius;
      player.vx = -Math.abs(player.vx) * bounce;
    }
    if (player.y < player.radius) {
      player.y = player.radius;
      player.vy = Math.abs(player.vy) * bounce;
    }
    if (player.y > state.height - player.radius) {
      player.y = state.height - player.radius;
      player.vy = -Math.abs(player.vy) * bounce;
    }
  }

  function updateSecondaryGravity(dt) {
    if (state.bodies.length < 2) return;
    const maxBodies = state.quality === "low" ? 22 : 38;
    const count = Math.min(state.bodies.length, maxBodies);
    for (let i = 0; i < count; i += 1) {
      for (let j = i + 1; j < count; j += 1) {
        const first = state.bodies[i];
        const second = state.bodies[j];
        if (!first || !second || first.absorbing || second.absorbing) continue;

        const larger = first.mass >= second.mass ? first : second;
        const smaller = larger === first ? second : first;
        if (larger.mass < smaller.mass * 1.18) continue;

        const dx = larger.x - smaller.x;
        const dy = larger.y - smaller.y;
        const dist = Math.max(12, Math.hypot(dx, dy));
        const influence = Math.max(74, larger.radius * 6.4 + smaller.radius * 2.2);
        if (dist > influence) continue;

        const nx = dx / dist;
        const ny = dy / dist;
        const orbitalBand = clamp((influence - dist) / influence, 0, 1);
        const pull = clamp((larger.mass * orbitalBand) / (dist * 0.72), 0, 0.018);
        const tangent = orbitalBand * 0.008 * (smaller.orbitDir || 1);
        smaller.vx += (nx * pull + -ny * tangent) * dt;
        smaller.vy += (ny * pull + nx * tangent) * dt;
      }
    }
  }

  function updateBodies(dt) {
    const player = state.player;
    const stage = currentStage();
    const gRadius = gravityRadius();
    const captureRadius = orbitCaptureRadius();
    const absorbRadius = absorptionRadius();
    const blackHoleLike = isBlackHoleStage(stage);
    const orbitalStage = isOrbitalStage(stage);

    for (let i = state.bodies.length - 1; i >= 0; i -= 1) {
      const body = state.bodies[i];
      if (body.absorbing) {
        body.absorbTimer = (body.absorbTimer || 0) + dt;
        const progress = clamp(body.absorbTimer / Math.max(1, body.absorbDuration || 40), 0, 1);
        const dx = player.x - body.x;
        const dy = player.y - body.y;
        const dist = Math.max(1, Math.hypot(dx, dy));
        const nx = dx / dist;
        const ny = dy / dist;
        const tx = -ny * body.orbitDir;
        const ty = nx * body.orbitDir;
        const spiralPull = blackHoleLike ? 0.3 : 0.18;
        const spiralDrift = blackHoleLike ? 0.34 : 0.24;

        body.vx += (nx * (spiralPull + progress * 0.38) + tx * (spiralDrift * (1 - progress * 0.45))) * dt;
        body.vy += (ny * (spiralPull + progress * 0.38) + ty * (spiralDrift * (1 - progress * 0.45))) * dt;
        body.vx *= Math.pow(0.972, dt);
        body.vy *= Math.pow(0.972, dt);
        body.x += body.vx * dt;
        body.y += body.vy * dt;
        body.angle += (body.spin * 0.03 + 0.04 * body.orbitDir) * dt;
        body.radius = Math.max(0.8, (body.absorbStartRadius || body.radius) * (1 - progress * 0.86));
        body.absorbAlpha = 1 - progress;
        body.orbiting = true;
        body.captured = true;
        body.orbitAlpha = Math.max(0.3, 1 - progress * 0.25);

        if (state.frame % (state.quality === "low" ? 6 : 3) === 0) {
          addParticle(body.x, body.y, {
            angle: Math.atan2(dy, dx) + Math.PI + rand(-0.45, 0.45),
            speed: rand(0.6, blackHoleLike ? 2.6 : 1.8),
            radius: rand(0.8, 2.2),
            decay: rand(0.018, 0.034),
            color: blackHoleLike ? "255, 216, 106" : "85, 215, 255",
            line: true,
          });
        }

        if (progress >= 1 || dist < Math.max(5, player.radius * 0.35)) {
          const gained = body.absorbValue || body.value;
          state.bodies.splice(i, 1);
          state.absorbed += 1;
          addXp(gained, body.x, body.y);
          healPlayer(Math.max(0.4, gained * 0.025));
          addParticle(body.x, body.y - body.radius - 10, {
            label: `+${Math.round(gained)} XP`,
            fontSize: state.width < 640 ? 11 : 14,
            speed: 1.35,
            angle: -Math.PI / 2 + rand(-0.2, 0.2),
            radius: 0.1,
            decay: 0.024,
            color: blackHoleLike ? "255, 216, 106" : "159, 240, 208",
            line: false,
          });
          burst(body.x, body.y, 10 + Math.round(body.absorbStartRadius || body.radius), blackHoleLike ? "255, 216, 106" : "85, 215, 255");
          if (blackHoleLike && state.rings.length < 8) {
            state.rings.push({
              x: player.x,
              y: player.y,
              radius: Math.max(player.radius * 0.85, dist),
              speed: 3.2,
              life: 0.72,
              decay: 0.035,
              color: "255, 216, 106",
            });
          }
        }
        continue;
      }

      const dx = player.x - body.x;
      const dy = player.y - body.y;
      const rawDist = Math.max(1, Math.hypot(dx, dy));
      const softened = 1200 + (blackHoleLike ? 600 : 1350);
      const distSq = Math.max(rawDist * rawDist + softened, 900);
      const nx = dx / rawDist;
      const ny = dy / rawDist;
      const canCapture = blackHoleLike || body.fragment || player.mass > body.mass * 0.72 || player.radius > body.radius * 1.06;
      const tx = -ny * body.orbitDir;
      const ty = nx * body.orbitDir;
      const radialVelocity = body.vx * nx + body.vy * ny;
      const tangentVelocity = body.vx * tx + body.vy * ty;

      if (rawDist < gRadius) {
        const capture = clamp((gRadius - rawDist) / gRadius, 0, 1);
        const captureBand = clamp((captureRadius - rawDist) / Math.max(captureRadius, 1), 0, 1);
        const gravity = (stage.gravity * player.mass) / distSq;
        const massPower = clamp(player.mass / Math.max(body.mass, 0.35), blackHoleLike ? 0.75 : 0.42, blackHoleLike ? 5.2 : 3.3);
        const idealOrbit = player.radius * (1.95 + clamp(body.mass / Math.max(player.mass, 0.8), 0.08, 0.74)) + body.radius * 2.2;
        const innerBrake = rawDist < idealOrbit ? clamp((idealOrbit - rawDist) / idealOrbit, 0, 0.64) : 0;
        const outsideIdeal = rawDist > idealOrbit ? clamp((rawDist - idealOrbit) / Math.max(gRadius - idealOrbit, 1), 0, 1) : 0;
        const orbitEligible = orbitalStage && canCapture && (body.fragment || body.mass < player.mass * (blackHoleLike ? 4.4 : 1.55) || body.radius < player.radius * 1.08);
        const targetOrbitSpeed = clamp(
          Math.sqrt(Math.max(0.02, (stage.gravity * player.mass * (blackHoleLike ? 142 : 104)) / Math.max(rawDist, 34))),
          0.36,
          blackHoleLike ? 6.2 : 2.8 + state.stageIndex * 0.22,
        );

        body.orbiting = orbitEligible || rawDist < captureRadius * 0.82;
        body.captured = orbitEligible && rawDist < captureRadius && Math.abs(radialVelocity) < (blackHoleLike ? 6.4 : 3.8);
        body.orbitAge = Math.min(240, (body.orbitAge || 0) + dt * (body.captured ? 1 : 0.38));
        body.orbitAlpha = Math.min(1, (body.orbitAlpha || 0) + 0.05 * dt);
        const radialAccel = (
          (blackHoleLike ? 0.072 : 0.026) +
          gravity * (blackHoleLike ? 360 : 220) * massPower +
          capture * (blackHoleLike ? 0.055 : 0.026) +
          outsideIdeal * (blackHoleLike ? 0.055 : 0.034) -
          innerBrake * (blackHoleLike ? 0.048 : 0.06)
        );
        const tangentCorrection = body.captured
          ? (targetOrbitSpeed - tangentVelocity) * (0.035 + captureBand * 0.045)
          : orbitEligible
            ? (targetOrbitSpeed * 0.68 - tangentVelocity) * (0.014 + captureBand * 0.018)
            : (targetOrbitSpeed * 0.42 - tangentVelocity) * (0.006 + captureBand * 0.008);
        const tangential = (blackHoleLike && rawDist < gRadius * 0.55 ? 0.02 : 0.034) + stage.gravity * 0.026 + capture * 0.044 + tangentCorrection;
        const radialDamping = body.captured ? 0.042 + captureBand * 0.074 : orbitEligible ? 0.022 : 0.012;

        body.vx += (nx * radialAccel + tx * tangential) * dt;
        body.vy += (ny * radialAccel + ty * tangential) * dt;
        body.vx -= nx * radialVelocity * radialDamping * dt;
        body.vy -= ny * radialVelocity * radialDamping * dt;

        const speed = Math.hypot(body.vx, body.vy);
        const maxSpeed = blackHoleLike ? 5.2 + capture * 2.75 : 2.85 + state.stageIndex * 0.22 + capture * 1.45;
        if (speed > maxSpeed) {
          body.vx = (body.vx / speed) * maxSpeed;
          body.vy = (body.vy / speed) * maxSpeed;
        }
      } else {
        body.orbiting = false;
        body.captured = false;
        body.orbitAge = Math.max(0, (body.orbitAge || 0) - 0.36 * dt);
        body.orbitAlpha = Math.max(0, (body.orbitAlpha || 0) - 0.04 * dt);

        if (player.mass > body.mass * 0.9 && rawDist < gRadius * 1.28) {
          const force = clamp((player.mass * body.mass) / distSq, 0, 0.007);
          body.vx += nx * force * 31 * dt;
          body.vy += ny * force * 31 * dt;
        }
      }

      body.x += body.vx * dt;
      body.y += body.vy * dt;
      body.vx *= Math.pow(0.997, dt);
      body.vy *= Math.pow(0.997, dt);
      body.angle += body.spin * 0.018 * dt;

      const edge = 140;
      const outsideStage = body.x < -edge || body.x > state.width + edge || body.y < -edge || body.y > state.height + edge;
      if (outsideStage && rawDist > gRadius * 1.14 && !body.captured && !body.absorbing) {
        state.bodies.splice(i, 1);
        continue;
      }

      const hitDx = player.x - body.x;
      const hitDy = player.y - body.y;
      const hitDist = Math.max(1, Math.hypot(hitDx, hitDy));
      const hitNx = hitDx / hitDist;
      const hitNy = hitDy / hitDist;
      const contactDistance = absorbRadius + body.radius * (blackHoleLike ? 0.7 : 0.82);

      if (hitDist < contactDistance) {
        const relativeSpeed = Math.hypot(player.vx - body.vx, player.vy - body.vy);
        const sizeRatio = body.radius / Math.max(player.radius, 1);
        const massRatio = body.mass / Math.max(player.mass, 0.35);
        const canAbsorb = blackHoleLike || body.fragment || body.radius <= player.radius * 0.98;
        const canDamage = !blackHoleLike && !canAbsorb && body.radius > player.radius * 1.02;
        const holdOrbit = !blackHoleLike &&
          orbitalStage &&
          body.captured &&
          !body.fragment &&
          body.orbitAge < (stage.type === "star" ? 190 : stage.type === "planet" ? 160 : 132) &&
          canAbsorb &&
          body.radius < player.radius * 0.98;
        if (holdOrbit) {
          const orbitPush = contactDistance + 10 + Math.sin(body.orbitAge * 0.08) * 3;
          body.x = player.x - hitNx * orbitPush;
          body.y = player.y - hitNy * orbitPush;
          body.vx += (-hitNx * 0.18 + -hitNy * body.orbitDir * 0.62) * dt;
          body.vy += (-hitNy * 0.18 + hitNx * body.orbitDir * 0.62) * dt;
          continue;
        }

        if (canAbsorb) {
          startAbsorption(body, blackHoleLike, "gravity");
          continue;
        }

        if (!canDamage) {
          body.vx -= hitNx * 1.75;
          body.vy -= hitNy * 1.75;
          continue;
        }

        const impactForce = clamp(relativeSpeed * 1.6 + body.radius * 0.32 + body.mass * 1.15, 2, 46);
        const damage = (sizeRatio > 1.08 || massRatio > 1.05)
          ? impactForce * (0.55 + sizeRatio * 0.42 + massRatio * 0.28)
          : impactForce * 0.32;
        const didDamage = applyDamage(damage, body, hitNx, hitNy, impactForce);
        if (body.radius > 8 && (didDamage || sizeRatio > 0.82)) {
          fractureBody(body, hitNx, hitNy, impactForce);
          state.bodies.splice(i, 1);
          continue;
        }

        body.vx -= hitNx * 1.6;
        body.vy -= hitNy * 1.6;
      }
    }
  }

  function updateParticles(dt) {
    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const p = state.particles[i];
      if (state.mode === "collapse") {
        const dx = state.player.x - p.x;
        const dy = state.player.y - p.y;
        const dist = Math.max(12, Math.hypot(dx, dy));
        p.vx += (dx / dist) * 0.05 * dt;
        p.vy += (dy / dist) * 0.05 * dt;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.pow(0.982, dt);
      p.vy *= Math.pow(0.982, dt);
      p.life -= p.decay * dt;
      if (p.life <= 0) state.particles.splice(i, 1);
    }

    for (let i = state.rings.length - 1; i >= 0; i -= 1) {
      const ring = state.rings[i];
      ring.radius += ring.speed * dt;
      ring.life -= ring.decay * dt;
      if (ring.life <= 0) state.rings.splice(i, 1);
    }
  }

  function updatePlay(dt) {
    state.spawnTimer += dt;
    const spawnEvery = Math.max(12, 38 - state.stageIndex * 2.4);
    if (state.spawnTimer > spawnEvery) {
      spawnBody();
      if (state.stageIndex >= 5 && Math.random() > 0.45) spawnBody();
      state.spawnTimer = 0;
    }

    updatePlayer(dt);
    updateSecondaryGravity(dt);
    updateBodies(dt);
    const bodyLimit = qualityLimit(state.width < 640 ? 28 : 44);
    trimBodies(bodyLimit);
    updateParticles(dt);
  }

  function beginCollapse() {
    state.mode = "collapse";
    state.collapseTimer = 0;
    state.stageIndex = stages.length - 1;
    state.highestStageIndex = Math.max(state.highestStageIndex, state.stageIndex);
    recordSoundCue("cosmic-collapse", 1);
    setStatus("Cosmic Collapse");
    state.player.invulnerable = 999;
    state.player.vx *= 0.35;
    state.player.vy *= 0.35;
    supernova(state.player.x, state.player.y, reduceMotion ? 44 : 110, true, false);
  }

  function updateCollapse(dt) {
    state.collapseTimer += dt;
    const pull = clamp(state.collapseTimer / collapseDuration, 0, 1);
    setStatus("Cosmic Collapse");

    for (let i = 0; i < state.bodies.length; i += 1) {
      const body = state.bodies[i];
      const dx = state.player.x - body.x;
      const dy = state.player.y - body.y;
      const dist = Math.max(8, Math.hypot(dx, dy));
      const strength = 0.12 + pull * 0.32;
      body.vx += (dx / dist) * strength * dt;
      body.vy += (dy / dist) * strength * dt;
      body.x += body.vx * dt;
      body.y += body.vy * dt;
      body.radius *= Math.pow(0.996, dt);
      body.orbiting = true;
      body.orbitAlpha = 1;
      if (dist < state.player.radius * 0.8) {
        state.score += Math.round(body.value * 10);
        state.absorbed += 1;
        state.bodies.splice(i, 1);
        i -= 1;
      }
    }

    if (state.frame % 2 === 0) {
      const a = Math.random() * Math.PI * 2;
      const r = rand(state.player.radius * 2, Math.max(state.width, state.height) * 0.58);
      addParticle(state.player.x + Math.cos(a) * r, state.player.y + Math.sin(a) * r, {
        angle: a + Math.PI,
        speed: rand(2.2, 6.4) + pull * 4,
        radius: rand(1, 3.4),
        decay: rand(0.008, 0.018),
        color: Math.random() > 0.5 ? "255, 216, 106" : "85, 215, 255",
        line: true,
      });
    }

    updateParticles(dt);

    if (state.collapseTimer >= collapseDuration || (state.bodies.length === 0 && state.collapseTimer > collapseDuration * 0.38)) {
      beginRebirth();
    }
  }

  function beginRebirth() {
    state.mode = "rebirth";
    state.rebirthTimer = 0;
    recordSoundCue("universal-rebirth", 1);
    setStatus("Universal Rebirth");
    state.bodies = [];
    supernova(state.player.x, state.player.y, reduceMotion ? 72 : 180, true, false);
    state.rings.push({
      x: state.player.x,
      y: state.player.y,
      radius: 24,
      speed: 12,
      life: 1,
      decay: 0.008,
      color: "255, 244, 191",
    });
  }

  function updateRebirth(dt) {
    state.rebirthTimer += dt;
    const centerX = state.player.x;
    const centerY = state.player.y;
    if (state.frame % 2 === 0) {
      for (let i = 0; i < 3; i += 1) {
        addParticle(centerX, centerY, {
          angle: Math.random() * Math.PI * 2,
          speed: rand(4, 10),
          radius: rand(1.2, 4.4),
          decay: rand(0.008, 0.018),
          color: i % 2 ? "255, 216, 106" : "85, 215, 255",
          line: true,
        });
      }
    }
    updateParticles(dt);
    if (state.rebirthTimer >= rebirthDuration) {
      completeRun();
    }
  }

  function completeRun() {
    state.mode = "complete";
    state.running = false;
    state.paused = false;
    state.finalSnapshot = {
      score: state.score,
      mass: state.player.mass,
      time: state.elapsed,
      stage: currentStage().name,
      maxStage: stages[state.highestStageIndex]?.name || currentStage().name,
      absorbed: state.absorbed,
      endedBy: "Cosmic rebirth",
    };
    recordSoundCue("universal-rebirth-complete", 1);
    setStatus("Run Complete");
    if (ui.completeTitle) ui.completeTitle.textContent = "Run Complete";
    if (ui.finalScore) ui.finalScore.textContent = String(state.finalSnapshot.score);
    if (ui.finalMass) ui.finalMass.textContent = `${state.finalSnapshot.mass.toFixed(1)}x`;
    if (ui.finalTime) ui.finalTime.textContent = formatTime(state.finalSnapshot.time);
    if (ui.finalAbsorbed) ui.finalAbsorbed.textContent = String(state.finalSnapshot.absorbed);
    if (ui.finalStage) ui.finalStage.textContent = state.finalSnapshot.maxStage;
    ui.complete?.classList.remove("hidden");
    updateUi();
  }

  function update(dt) {
    if (!state.running || state.paused) return;
    state.elapsed = (performance.now() - state.runStartedAt) / 1000;
    if (state.mode === "play") updatePlay(dt);
    else if (state.mode === "collapse") updateCollapse(dt);
    else if (state.mode === "rebirth") updateRebirth(dt);
    updateUi();
  }

  function drawBackground(time) {
    const collapse = state.mode === "collapse" ? clamp(state.collapseTimer / collapseDuration, 0, 1) : 0;
    const gradient = ctx.createRadialGradient(state.width * 0.5, state.height * 0.5, 0, state.width * 0.5, state.height * 0.5, state.width);
    gradient.addColorStop(0, collapse ? "#07101a" : "#0d1726");
    gradient.addColorStop(0.5, collapse ? "#030611" : "#07101d");
    gradient.addColorStop(1, "#01030a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, state.width, state.height);

    for (const star of state.stars) {
      const pulse = Math.sin(time * 0.0014 * star.z + star.twinkle) * 0.34 + 0.66;
      if (state.mode === "collapse") {
        const dx = state.player.x - star.x;
        const dy = state.player.y - star.y;
        const dist = Math.max(20, Math.hypot(dx, dy));
        star.x += (dx / dist) * (0.08 + collapse * 0.7) * star.z;
        star.y += (dy / dist) * (0.08 + collapse * 0.7) * star.z;
        if (dist < state.player.radius) {
          star.x = Math.random() * state.width;
          star.y = Math.random() * state.height;
        }
      } else {
        star.x -= 0.025 * star.z;
        if (star.x < -4) star.x = state.width + 4;
      }
      ctx.fillStyle = `rgba(${star.color}, ${0.18 + pulse * (0.55 - collapse * 0.25)})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r * star.z * (1 + collapse * 0.4), 0, Math.PI * 2);
      ctx.fill();
    }

    if (collapse > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${collapse * 0.42})`;
      ctx.fillRect(0, 0, state.width, state.height);
    }
  }

  function drawOrbitTrails(time) {
    const player = state.player;
    const activeBodies = state.bodies.filter((body) => body.orbitAlpha > 0.08 || body.captured || body.absorbing);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    if (activeBodies.length >= 2) {
      const ringAlpha = clamp(activeBodies.length / 7, 0.18, 0.58);
      const ringBase = Math.max(player.radius * 2.5, orbitCaptureRadius() * 0.28);
      for (let layer = 0; layer < 3; layer += 1) {
        const color = layer % 2 ? "255, 216, 106" : "85, 215, 255";
        ctx.strokeStyle = `rgba(${color}, ${ringAlpha * (0.22 - layer * 0.035)})`;
        ctx.shadowColor = `rgba(${color}, ${ringAlpha * 0.42})`;
        ctx.shadowBlur = 12 - layer * 2;
        ctx.lineWidth = 1 + layer * 0.35;
        ctx.beginPath();
        ctx.ellipse(
          player.x,
          player.y,
          ringBase + player.radius * layer * 0.72,
          (ringBase + player.radius * layer * 0.72) * (0.42 + layer * 0.06),
          player.angle * 0.28 + time * 0.00032 * (layer % 2 ? -1 : 1),
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      }
    }

    for (const body of state.bodies) {
      const alpha = body.orbitAlpha || 0;
      if (alpha <= 0.02) continue;
      const dx = body.x - player.x;
      const dy = body.y - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist < player.radius + body.radius + 6) continue;

      const color = body.orbitDir > 0 ? "85, 215, 255" : "255, 216, 106";
      const angle = Math.atan2(dy, dx) + body.orbitTilt * 0.45;
      const sweep = Math.PI * (0.68 + clamp(alpha, 0, 1) * 0.52);
      const start = angle - sweep * 0.62 + time * 0.00025 * body.orbitDir;
      const end = angle + sweep * 0.38 + time * 0.00025 * body.orbitDir;

      ctx.strokeStyle = `rgba(${color}, ${0.08 + alpha * 0.24})`;
      ctx.lineWidth = 1 + alpha * 0.9;
      ctx.shadowColor = `rgba(${color}, ${0.3 * alpha})`;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.ellipse(player.x, player.y, dist, dist * 0.56, body.orbitTilt, start, end);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPlanetBody(body, time) {
    ctx.save();
    ctx.translate(body.x, body.y);
    ctx.rotate(body.angle * 0.35);
    ctx.globalAlpha = body.absorbing ? clamp(body.absorbAlpha ?? 1, 0.08, 1) : 1;
    if (body.absorbing) {
      const wobble = 1 + Math.sin(body.absorbTimer * 0.22) * 0.05;
      ctx.scale(wobble, 1 / wobble);
    }

    const glow = body.atmosphere || "#68f0d1";
    ctx.shadowColor = glow;
    ctx.shadowBlur = 14;
    const gradient = ctx.createRadialGradient(-body.radius * 0.38, -body.radius * 0.42, body.radius * 0.08, 0, 0, body.radius);
    gradient.addColorStop(0, "#f8ffff");
    gradient.addColorStop(0.28, body.color);
    gradient.addColorStop(0.7, "#1d5570");
    gradient.addColorStop(1, "#07101c");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, body.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = hexToRgba(glow, 0.34);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, body.radius * 1.08, 0, Math.PI * 2);
    ctx.stroke();

    const cloudShift = Math.sin(time * 0.0014 + body.surfacePhase) * body.radius * 0.18;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = Math.max(1, body.radius * 0.055);
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.ellipse(cloudShift * (i + 1), i * body.radius * 0.24, body.radius * 0.72, body.radius * 0.12, 0.12 * i, 0.15, Math.PI * 1.04);
      ctx.stroke();
    }

    if (body.ringed) {
      ctx.strokeStyle = "rgba(255, 216, 106, 0.42)";
      ctx.lineWidth = 1.6;
      ctx.shadowColor = "#ffd86a";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.ellipse(0, 0, body.radius * 1.75, body.radius * 0.46, time * 0.0006 + body.surfacePhase, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawBody(body, time) {
    if (body.kind === "planet") {
      drawPlanetBody(body, time);
      return;
    }

    ctx.save();
    ctx.translate(body.x, body.y);
    ctx.rotate(body.angle);
    ctx.globalAlpha = body.absorbing ? clamp(body.absorbAlpha ?? 1, 0.08, 1) : 1;
    if (body.absorbing) {
      const wobble = 1 + Math.sin(body.absorbTimer * 0.24) * 0.06;
      ctx.scale(wobble, 1 / wobble);
    }
    ctx.fillStyle = body.color;
    ctx.shadowColor = body.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    const points = body.shape.length;
    for (let i = 0; i < points; i += 1) {
      const angle = (Math.PI * 2 * i) / points;
      const radius = body.radius * body.shape[i];
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    for (const crater of body.craters) {
      ctx.beginPath();
      ctx.arc(crater.x * body.radius, crater.y * body.radius, crater.r * body.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    if (body.fragment) {
      ctx.strokeStyle = "rgba(159, 240, 208, 0.42)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, body.radius * 1.08, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSolidBody(radius, stage, time) {
    const body = ctx.createRadialGradient(-radius * 0.34, -radius * 0.34, radius * 0.1, 0, 0, radius);
    body.addColorStop(0, "#ffffff");
    body.addColorStop(0.28, stage.color);
    body.addColorStop(1, "#162033");
    ctx.fillStyle = body;
    ctx.shadowColor = stage.glow;
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    if (stage.type === "planet" || stage.type === "moon") {
      ctx.strokeStyle = hexToRgba(stage.glow, 0.22);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 1.55, radius * 0.38, time * 0.0007, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = hexToRgba(stage.glow, 0.16);
      ctx.beginPath();
      ctx.arc(radius * 0.26, -radius * 0.2, radius * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawStar(radius, time, stage) {
    const pulse = 1 + Math.sin(time * 0.006) * 0.06;
    ctx.shadowColor = stage.glow;
    ctx.shadowBlur = 36;
    const rays = 14;
    ctx.strokeStyle = hexToRgba(stage.glow, 0.36);
    ctx.lineWidth = 2;
    for (let i = 0; i < rays; i += 1) {
      const a = (Math.PI * 2 * i) / rays + time * 0.001;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * radius * 0.75, Math.sin(a) * radius * 0.75);
      ctx.lineTo(Math.cos(a) * radius * 1.55 * pulse, Math.sin(a) * radius * 1.55 * pulse);
      ctx.stroke();
    }
    drawSolidBody(radius * pulse, stage, time);
  }

  function drawBlackHole(radius, time, stage, binary = false) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 3; i += 1) {
      ctx.strokeStyle = i % 2 ? hexToRgba("#f4c867", 0.5) : hexToRgba("#55d7ff", 0.42);
      ctx.lineWidth = 3 - i * 0.55;
      ctx.shadowColor = i % 2 ? "#f4c867" : "#55d7ff";
      ctx.shadowBlur = 22;
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * (1.58 + i * 0.22), radius * (0.52 + i * 0.07), time * 0.0012 + i * 0.8, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (binary) {
      for (const offset of [-0.45, 0.45]) {
        drawEventHorizon(offset * radius, 0, radius * 0.5, stage);
      }
    } else {
      drawEventHorizon(0, 0, radius * 0.82, stage);
    }
    ctx.restore();
  }

  function drawEventHorizon(x, y, radius, stage) {
    ctx.fillStyle = "#01030a";
    ctx.shadowColor = stage.glow;
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(stage.glow, 0.48);
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  function drawPlayer(time) {
    const player = state.player;
    const stage = currentStage();
    const pulse = Math.sin(time * 0.004) * 0.08 + 1;

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    ctx.globalCompositeOperation = "lighter";

    const aura = ctx.createRadialGradient(0, 0, player.radius * 0.3, 0, 0, gravityRadius() * 0.68);
    aura.addColorStop(0, `${hexToRgba(stage.glow, 0.34)}`);
    aura.addColorStop(0.56, `${hexToRgba(stage.glow, 0.1)}`);
    aura.addColorStop(1, `${hexToRgba(stage.glow, 0)}`);
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, gravityRadius() * 0.68, 0, Math.PI * 2);
    ctx.fill();

    if (stage.arms > 0) {
      ctx.strokeStyle = hexToRgba(stage.glow, 0.42);
      ctx.lineWidth = 1.5;
      for (let i = 0; i < stage.arms; i += 1) {
        const a = (Math.PI * 2 * i) / stage.arms + time * 0.0008;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * player.radius * 0.4, Math.sin(a) * player.radius * 0.4);
        ctx.quadraticCurveTo(
          Math.cos(a + 0.8) * player.radius * 1.55,
          Math.sin(a + 0.8) * player.radius * 1.55,
          Math.cos(a + 1.4) * player.radius * 2.2,
          Math.sin(a + 1.4) * player.radius * 2.2,
        );
        ctx.stroke();
      }
    }

    if (stage.type === "star") {
      drawStar(player.radius, time, stage);
    } else if (stage.type === "black-hole" || stage.type === "supermassive" || stage.type === "collapse") {
      drawBlackHole(player.radius, time, stage, false);
    } else if (stage.type === "binary") {
      drawBlackHole(player.radius, time, stage, true);
    } else {
      drawSolidBody(player.radius * pulse, stage, time);
    }
    ctx.restore();
  }

  function drawParticles() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const p of state.particles) {
      if (p.label) {
        ctx.font = `900 ${p.fontSize || 14}px "Segoe UI", sans-serif`;
        ctx.textAlign = "center";
        ctx.fillStyle = `rgba(${p.color}, ${p.life})`;
        ctx.shadowColor = `rgba(${p.color}, ${p.life})`;
        ctx.shadowBlur = 12;
        ctx.fillText(p.label, p.x, p.y);
        continue;
      }

      ctx.fillStyle = `rgba(${p.color}, ${p.life})`;
      ctx.shadowColor = `rgba(${p.color}, ${p.life})`;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * p.life, 0, Math.PI * 2);
      ctx.fill();
      if (p.line) {
        ctx.strokeStyle = `rgba(${p.color}, ${p.life * 0.42})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 7, p.y - p.vy * 7);
        ctx.stroke();
      }
    }

    for (const ring of state.rings) {
      ctx.strokeStyle = `rgba(${ring.color}, ${ring.life * 0.62})`;
      ctx.shadowColor = `rgba(${ring.color}, ${ring.life})`;
      ctx.shadowBlur = 22;
      ctx.lineWidth = Math.max(1, ring.life * 3);
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function draw(time) {
    drawBackground(time);
    ctx.save();
    if (state.impactShake > 0 && state.mode === "play") {
      ctx.translate(rand(-state.impactShake, state.impactShake), rand(-state.impactShake, state.impactShake));
    }
    drawOrbitTrails(time);
    for (const body of state.bodies) drawBody(body, time);
    drawParticles();
    drawPlayer(time);
    ctx.restore();

    if (state.dangerFlash > 0) {
      ctx.fillStyle = `rgba(255, 72, 72, ${state.dangerFlash * 0.22})`;
      ctx.fillRect(0, 0, state.width, state.height);
    }
  }

  function loop(time) {
    state.raf = 0;
    if (!state.running || state.paused) return;
    const dt = clamp((time - state.lastTime) / 16.67, 0.45, 2);
    state.lastTime = time;
    state.frame += 1;
    state.fpsFrames += 1;
    state.fpsTimer += dt;
    if (state.fpsTimer >= 30) {
      state.fps = (state.fpsFrames / state.fpsTimer) * 60;
      state.fpsFrames = 0;
      state.fpsTimer = 0;
      updateQualityFromFps();
    }
    update(dt);
    draw(time);
    if (state.running) state.raf = requestAnimationFrame(loop);
  }

  function hexToRgba(hex, alpha) {
    const value = hex.replace("#", "");
    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const b = parseInt(value.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function pointerFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: clamp(event.clientX - rect.left, 0, state.width),
      y: clamp(event.clientY - rect.top, 0, state.height),
    };
  }

  function beginPointer(event) {
    if (event.pointerType === "touch" || event.pointerType === "pen") event.preventDefault();
    const point = pointerFromEvent(event);
    state.pointer.active = true;
    state.pointer.x = point.x;
    state.pointer.y = point.y;
    state.gesture.pointerId = event.pointerId;
    state.gesture.startX = point.x;
    state.gesture.startY = point.y;
    state.gesture.lastX = point.x;
    state.gesture.lastY = point.y;
    state.gesture.startedAt = performance.now();
    state.gesture.moved = false;

    if (event.pointerType !== "touch" && event.pointerType !== "pen" && state.running && !state.paused && state.mode === "play") {
      supernova(point.x, point.y, state.stageIndex >= 5 ? 86 : 48, state.stageIndex >= 5);
    }
    try {
      canvas.setPointerCapture?.(event.pointerId);
    } catch {
      // Synthetic mobile tests and some browser gestures may not expose an active pointer capture target.
    }
  }

  function movePointer(event) {
    if (event.pointerType === "touch" || event.pointerType === "pen") event.preventDefault();
    const point = pointerFromEvent(event);
    state.pointer.active = true;
    state.pointer.x = point.x;
    state.pointer.y = point.y;
    state.gesture.lastX = point.x;
    state.gesture.lastY = point.y;
    if (Math.hypot(point.x - state.gesture.startX, point.y - state.gesture.startY) > 11) state.gesture.moved = true;
  }

  function endPointer(event) {
    if (event.pointerType === "touch" || event.pointerType === "pen") event.preventDefault();
    const point = pointerFromEvent(event);
    const duration = performance.now() - state.gesture.startedAt;
    const dragDistance = Math.hypot(point.x - state.gesture.startX, point.y - state.gesture.startY);
    const isTap = (event.pointerType === "touch" || event.pointerType === "pen") && !state.gesture.moved && dragDistance < 16 && duration < 460;

    state.pointer.active = false;
    state.gesture.pointerId = null;
    if (isTap && state.running && !state.paused && state.mode === "play") {
      supernova(point.x, point.y, state.stageIndex >= 5 ? 86 : 48, state.stageIndex >= 5);
    }
    try {
      canvas.releasePointerCapture?.(event.pointerId);
    } catch {
      // Matching defensive guard for browsers that already released the pointer.
    }
  }

  function setJoystickVector(x, y, strength) {
    state.joystick.x = x;
    state.joystick.y = y;
    state.joystick.strength = strength;
    const reach = 27;
    ui.joystickKnob?.style.setProperty("--stick-x", `${Math.round(x * reach * strength)}px`);
    ui.joystickKnob?.style.setProperty("--stick-y", `${Math.round(y * reach * strength)}px`);
  }

  function updateJoystickFromEvent(event) {
    if (!ui.joystick) return;
    const rect = ui.joystick.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;
    const max = Math.max(18, rect.width * 0.42);
    const distance = Math.min(max, Math.hypot(dx, dy));
    if (distance < 2) {
      setJoystickVector(0, 0, 0);
      return;
    }
    setJoystickVector(dx / Math.max(distance, 1), dy / Math.max(distance, 1), clamp(distance / max, 0, 1));
  }

  function beginJoystick(event) {
    event.preventDefault();
    if (state.joystick.active && state.joystick.pointerId !== event.pointerId) return;
    state.joystick.active = true;
    state.joystick.pointerId = event.pointerId;
    updateJoystickFromEvent(event);
    try {
      ui.joystick?.setPointerCapture?.(event.pointerId);
    } catch {
      // Pointer capture is optional for the virtual joystick.
    }
  }

  function moveJoystick(event) {
    if (!state.joystick.active || state.joystick.pointerId !== event.pointerId) return;
    event.preventDefault();
    updateJoystickFromEvent(event);
  }

  function endJoystick(event) {
    if (state.joystick.pointerId !== event.pointerId) return;
    event.preventDefault();
    state.joystick.active = false;
    state.joystick.pointerId = null;
    setJoystickVector(0, 0, 0);
    state.pointer.active = false;
    try {
      ui.joystick?.releasePointerCapture?.(event.pointerId);
    } catch {
      // Pointer capture may already be released on touch cancellation.
    }
  }

  function triggerPlayerPulse() {
    if (!state.running) startGame();
    if (state.running && !state.paused && state.mode === "play") {
      supernova(state.player.x, state.player.y, state.stageIndex >= 5 ? 92 : 54, state.stageIndex >= 5);
    }
  }

  function readScores() {
    try {
      return JSON.parse(localStorage.getItem(SCORE_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function writeScores(scores) {
    localStorage.setItem(SCORE_KEY, JSON.stringify(scores.slice(0, 8)));
  }

  function renderLeaderboard() {
    if (!ui.leaderboard) return;
    const scores = readScores();
    ui.leaderboard.innerHTML = "";
    if (!scores.length) {
      const item = document.createElement("li");
      item.textContent = "No completed runs yet.";
      ui.leaderboard.append(item);
      return;
    }
    for (const score of scores) {
      const item = document.createElement("li");
      const stage = score.maxStage || score.stage || "Unknown stage";
      item.innerHTML = `<span><strong>${score.name}</strong><small>${score.date} · ${stage}</small></span><span>${score.score} pts · ${score.mass.toFixed(1)}x · ${formatTime(score.time)}</span>`;
      ui.leaderboard.append(item);
    }
  }

  function saveCurrentScore() {
    if (!state.finalSnapshot) return;
    const name = (ui.playerName?.value || "TeoGame Player").trim().slice(0, 18) || "TeoGame Player";
    const scores = readScores();
    scores.push({
      name,
      score: state.finalSnapshot.score,
      mass: state.finalSnapshot.mass,
      time: state.finalSnapshot.time,
      absorbed: state.finalSnapshot.absorbed,
      stage: state.finalSnapshot.stage,
      maxStage: state.finalSnapshot.maxStage,
      date: new Date().toLocaleDateString("en-GB"),
    });
    scores.sort((a, b) => b.score - a.score);
    writeScores(scores);
    renderLeaderboard();
    if (ui.saveScore) ui.saveScore.textContent = "Saved";
  }

  canvas.addEventListener("pointerdown", beginPointer);
  canvas.addEventListener("pointermove", movePointer);
  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", (event) => {
    if (event.pointerType === "touch" || event.pointerType === "pen") event.preventDefault();
    state.pointer.active = false;
    state.gesture.pointerId = null;
  });
  canvas.addEventListener("touchstart", (event) => event.preventDefault(), { passive: false });
  canvas.addEventListener("touchmove", (event) => event.preventDefault(), { passive: false });
  canvas.addEventListener("touchend", (event) => event.preventDefault(), { passive: false });

  window.addEventListener("keydown", (event) => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "KeyW", "KeyA", "KeyS", "KeyD", "Space", "KeyP", "KeyR"].includes(event.code)) {
      event.preventDefault();
    }
    if (event.code === "KeyP" || event.code === "Space" && event.shiftKey) {
      togglePause();
      return;
    }
    if (event.code === "KeyR") {
      resetGame();
      startGame();
      return;
    }
    state.keys.add(event.code);
  });

  window.addEventListener("keyup", (event) => {
    state.keys.delete(event.code);
  });

  ui.start?.addEventListener("click", startGame);
  ui.pause?.addEventListener("click", togglePause);
  ui.restart?.addEventListener("click", () => {
    resetGame();
    startGame();
  });
  ui.mobilePulse?.addEventListener("click", triggerPlayerPulse);
  ui.mobilePause?.addEventListener("click", togglePause);
  ui.mobileRestart?.addEventListener("click", () => {
    resetGame();
    startGame();
  });
  ui.joystick?.addEventListener("pointerdown", beginJoystick);
  ui.joystick?.addEventListener("pointermove", moveJoystick);
  ui.joystick?.addEventListener("pointerup", endJoystick);
  ui.joystick?.addEventListener("pointercancel", endJoystick);
  ui.restartUniverse?.addEventListener("click", () => {
    resetGame();
    startGame();
  });
  ui.saveScore?.addEventListener("click", saveCurrentScore);
  ui.clearScores?.addEventListener("click", () => {
    writeScores([]);
    renderLeaderboard();
  });
  ui.debugToggle?.addEventListener("click", () => {
    state.debugVisible = !state.debugVisible;
    ui.debugPanel?.classList.toggle("is-hidden", !state.debugVisible);
    ui.debugToggle?.setAttribute("aria-expanded", String(state.debugVisible));
  });

  new ResizeObserver(() => {
    resize();
    draw(performance.now());
  }).observe(canvas);

  resize();
  resetGame();
  renderLeaderboard();

  window.__tg3dGameDebug = () => ({
    running: state.running,
    paused: state.paused,
    mode: state.mode,
    score: state.score,
    xp: Math.floor(state.xp),
    level: state.level,
    stage: currentStage().name,
    highestStage: stages[state.highestStageIndex]?.name || currentStage().name,
    bodies: state.bodies.length,
    orbiting: state.bodies.filter((body) => body.orbiting || body.orbitAlpha > 0.05).length,
    maxOrbiting: state.maxOrbiting,
    captured: state.bodies.filter((body) => body.captured).length,
    absorbing: state.bodies.filter((body) => body.absorbing).length,
    absorbed: state.absorbed,
    impacts: state.impacts,
    fragments: state.fragments,
    damageTaken: Math.round(state.damageTaken),
    health: Math.round(state.player.health),
    maxHealth: Math.round(state.player.maxHealth),
    shield: Math.round(state.player.shield),
    particles: state.particles.length,
    pointerActive: state.pointer.active,
    joystick: { ...state.joystick },
    quality: state.quality,
    soundEvents: state.soundEvents.slice(),
    gravityRadius: Math.round(gravityRadius()),
    orbitCaptureRadius: Math.round(orbitCaptureRadius()),
    absorptionRadius: Math.round(absorptionRadius()),
    fps: Math.round(state.fps),
    width: state.width,
    height: state.height,
  });
})();
