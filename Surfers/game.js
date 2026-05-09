const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const overlayKicker = document.getElementById("overlay-kicker");
const overlayTitle = document.getElementById("overlay-title");
const overlayScore = document.getElementById("overlay-score");
const overlayHelp = document.getElementById("overlay-help");
const actionBtn = document.getElementById("restart-btn");
const arcadeBtn = document.getElementById("arcade-btn");
const pauseBtn = document.getElementById("pause-btn");

const controls = {
  left: document.getElementById("btn-left"),
  right: document.getElementById("btn-right"),
  up: document.getElementById("btn-up"),
  down: document.getElementById("btn-down"),
  jump: document.getElementById("btn-jump"),
};

const STORAGE_BEST = "pti_ink_run_rush_best_score";
const STORAGE_COINS = "pti_ink_run_rush_total_coins";

const ASSET_SOURCES = {
  playerRun1: "assets/Player/run-1.png",
  playerRun2: "assets/Player/run-2.png",
  playerRun3: "assets/Player/run-3.png",
  playerRun4: "assets/Player/run-4.png",
  playerJump: "assets/Player/jump.png",
  playerHit: "assets/Player/hit.png",
  coin: "assets/coin.png",
  jetpack: "assets/jetpack.png",
  crate: "assets/crate.png",
  barrier: "assets/barrier.png",
  stageDay: "assets/stage2.png",
  stageWarehouse: "assets/stage1.png",
  stageNeon: "assets/stage3.png",
};

const assets = {};
const stageAssets = ["stageDay", "stageWarehouse", "stageNeon"];
const PLAYER_RUN_FRAME_KEYS = ["playerRun1", "playerRun2", "playerRun3", "playerRun4"];
const PLAYER_RUN_FPS = 10;

const LANE_COUNT = 3;
const FAR_Z = 1.08;
const COLLISION_Z = 0.16;
const COLLISION_PAST_Z = -0.025;
const FIXED_Z_SPEED = 0.48;
const DESPAWN_Z = -0.18;
const HORIZON_RATIO = 0.36;
const GROUND_RATIO = 0.785;
const FAR_SCALE = 0.07;
const NEAR_SCALE = 1.13;
const PROJECTION_CURVE = 0.55;
const MAX_PROJECTED_Z = 1.04;
const MIN_PROJECTED_Z = -0.34;
const PLAYER_H_RATIO = 0.15;
const PLAYER_HIT_W = 0.48;
const PLAYER_HIT_H = 0.7;
const LANE_SWITCH_TIME = 0.11;
const JUMP_TIME = 0.8;
const SLIDE_TIME = 0.58;
const BASE_JUMP_HEIGHT = 0.225;
const JETPACK_DURATION = 15;
const JETPACK_FLIGHT_RATIO = 0.38;
const SURVIVAL_SCORE_RATE = 12;
const GROUND_COIN_SCORE = 20;
const AIR_COIN_SCORE = 20;
const DODGE_SCORE = 6;
const MISSION_SCORE_BONUS = 250;
const DPR = Math.min(2, window.devicePixelRatio || 1);

const obstacleConfigs = {
  crate: { asset: "crate", action: "jump", h: 0.052, hitW: 0.5, hitH: 0.44, label: "JUMP" },
  barrier: { asset: "barrier", action: "jump", h: 0.074, hitW: 0.62, hitH: 0.58, label: "JUMP" },
  gate: { asset: null, action: "slide", h: 0.13, wMul: 1.02, hitW: 0.68, hitH: 0.72, label: "SLIDE" },
  wall: { asset: null, action: "avoid", h: 0.115, wMul: 0.9, hitW: 0.64, hitH: 0.72, label: "SWITCH" },
};

const powerupConfigs = {
  magnet: { label: "MAGNET", color: "#ff4757", duration: 8 },
  shield: { label: "SHIELD", color: "#36d8ff", duration: 12 },
  sneakers: { label: "JUMP+", color: "#ffb22f", duration: 9 },
  jetpack: { label: "JETPACK", color: "#36d8ff", duration: JETPACK_DURATION, asset: "jetpack" },
};

let W = 420;
let H = 760;
let horizonY = 0;
let groundY = 0;
let vanishX = 0;
let nearLaneX = [];
let laneX = [];
let trackMetrics = null;

let state = "loading";
let score = 0;
let coins = 0;
let totalCoins = readNumber(STORAGE_COINS);
let bestScore = readNumber(STORAGE_BEST);
let multiplier = 1;
let dodges = 0;
let gameTime = 0;
let runTime = 0;
let speedZ = 0.54;
let obstacleTimer = 1.0;
let coinTimer = 0.45;
let powerTimer = 6.5;
let jetpackCoinTimer = 0;
let jetpackCoinLane = 1;
let jetpackLaneTimer = 0;
let coinGuideLane = 1;
let coinTrailCount = 0;
let lastObstacleLane = -1;
let repeatedObstacleLaneCount = 0;
let lastDoubleSafeLane = 1;
let obstacleWaveCount = 0;
let stageCurrent = 0;
let stagePrevious = 0;
let stageFade = 1;
let trackMarkers = [];
let worldObjects = [];
let floatingText = [];
let player = null;
let animId = null;
let lastTime = null;
let pointerStart = null;
let assetsReady = false;
let debugMode = false;
let playerRunFrames = [];
let crouchHeld = false;

const effects = {
  magnet: 0,
  shield: 0,
  sneakers: 0,
  jetpack: 0,
  shieldHits: 0,
  flash: 0,
};

const mission = {
  text: "Collect 30 gold coins",
  target: 30,
  count: 0,
  complete: false,
};

function readNumber(key) {
  const value = Number(localStorage.getItem(key));
  return Number.isFinite(value) ? value : 0;
}

function loadAssets() {
  const entries = Object.entries(ASSET_SOURCES);
  return Promise.all(entries.map(([key, src]) => new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      assets[key] = img;
      resolve();
    };
    img.onerror = () => {
      console.warn(`Ink Run Rush asset failed: ${src}`);
      assets[key] = null;
      resolve();
    };
    img.src = src;
  })));
}

function refreshPlayerAnimationFrames() {
  playerRunFrames = PLAYER_RUN_FRAME_KEYS.map(key => assets[key]).filter(Boolean);
}

function getBasePlayerImage() {
  return assets.playerRun1 || assets.playerJump || assets.playerHit || null;
}

function getPlayerImage() {
  if (!player) return getBasePlayerImage();
  if (effects.flash > 0 && assets.playerHit) return assets.playerHit;
  if (effects.jetpack > 0 && assets.playerJump) return assets.playerJump;
  if (player.jumping && assets.playerJump) return assets.playerJump;
  if (playerRunFrames.length) {
    return playerRunFrames[Math.floor(gameTime * PLAYER_RUN_FPS) % playerRunFrames.length];
  }
  return getBasePlayerImage();
}

function isCoarse() {
  return window.matchMedia("(pointer: coarse)").matches;
}

function isLandscapePhone() {
  return isCoarse() && window.innerWidth > window.innerHeight;
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  const fallbackW = Math.min(window.innerWidth, 560);
  const fallbackH = window.innerHeight;
  W = Math.max(300, Math.round(rect.width || fallbackW));
  H = Math.max(300, Math.round(rect.height || fallbackH));

  canvas.width = Math.round(W * DPR);
  canvas.height = Math.round(H * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  horizonY = H * (isLandscapePhone() ? 0.30 : HORIZON_RATIO);
  groundY = H * (isLandscapePhone() ? 0.82 : GROUND_RATIO);
  vanishX = W * 0.5;
  trackMetrics = getTrackMetrics();
  nearLaneX = [0, 1, 2].map(lane => getLaneCenter(lane, 0));
  laneX = nearLaneX.slice();

  if (player) {
    const oldLane = Math.max(0, Math.min(LANE_COUNT - 1, player.targetLane));
    sizePlayer(player);
    player.groundY = groundY;
    player.x = laneX[oldLane];
    player.y = player.groundY;
    player.switchFrom = player.x;
    player.switchTo = player.x;
  }
}

function sizePlayer(p) {
  const ph = H * PLAYER_H_RATIO;
  const img = getBasePlayerImage();
  const aspect = img && img.naturalWidth ? img.naturalWidth / img.naturalHeight : 0.62;
  p.h = ph;
  p.w = ph * aspect;
  p.jumpPeak = H * BASE_JUMP_HEIGHT;
}

function createPlayer() {
  const p = {
    lane: 1,
    targetLane: 1,
    x: laneX[1],
    y: groundY,
    groundY,
    w: 0,
    h: 0,
    jumpT: 0,
    jumping: false,
    sliding: false,
    slideT: 0,
    slideVisual: 0,
    switching: false,
    switchT: 0,
    switchFrom: laneX[1],
    switchTo: laneX[1],
    jumpPeak: H * BASE_JUMP_HEIGHT,
  };
  sizePlayer(p);
  return p;
}

function resetRun() {
  resize();
  score = 0;
  coins = 0;
  multiplier = 1;
  dodges = 0;
  gameTime = 0;
  runTime = 0;
  speedZ = 0.54;
  obstacleTimer = 1.0;
  coinTimer = 0.35;
  powerTimer = randomRange(14, 19);
  jetpackCoinTimer = 0.35;
  jetpackCoinLane = 1;
  jetpackLaneTimer = 0;
  coinGuideLane = 1;
  coinTrailCount = 0;
  lastObstacleLane = -1;
  repeatedObstacleLaneCount = 0;
  lastDoubleSafeLane = 1;
  obstacleWaveCount = 0;
  stageCurrent = 0;
  stagePrevious = 0;
  stageFade = 1;
  crouchHeld = false;
  worldObjects = [];
  floatingText = [];
  trackMarkers = [];
  for (let i = 0; i < 13; i++) {
    trackMarkers.push({ z: (i / 13) * FAR_Z });
  }
  mission.count = 0;
  mission.complete = false;
  effects.magnet = 0;
  effects.shield = 0;
  effects.sneakers = 0;
  effects.jetpack = 0;
  effects.shieldHits = 0;
  effects.flash = 0;
  player = createPlayer();
  lastTime = null;
}

function showOverlay(mode) {
  overlay.classList.remove("hidden");
  pauseBtn.style.display = mode === "ready" || mode === "loading" ? "none" : "flex";
  actionBtn.disabled = false;
  arcadeBtn?.classList.add("hidden");
  overlayHelp.style.display = "";

  if (mode === "loading") {
    overlayKicker.textContent = "Pressed To Impress Arcade";
    overlayTitle.textContent = "Loading";
    overlayScore.textContent = "Preparing Ink Run Rush...";
    actionBtn.textContent = "Loading";
    actionBtn.disabled = true;
    overlayHelp.textContent = "";
  } else if (mode === "ready") {
    overlayKicker.textContent = "Pressed To Impress Arcade";
    overlayTitle.textContent = "Ink Run Rush";
    overlayScore.textContent = "Jump over print-yard boxes, collect gold coins, and grab jetpacks for bonus flight.";
    actionBtn.textContent = "Start Run";
    overlayHelp.textContent = "Swipe left/right to change lanes. Swipe up or tap JUMP to clear boxes.";
  } else if (mode === "paused") {
    overlayKicker.textContent = "Run Paused";
    overlayTitle.textContent = "Paused";
    overlayScore.textContent = `Score ${Math.floor(score)}  |  Coins ${coins}`;
    actionBtn.textContent = "Resume";
    if (arcadeBtn) arcadeBtn.textContent = "Back to Arcade";
    arcadeBtn?.classList.remove("hidden");
    overlayHelp.textContent = "Resume your run or head back to the arcade.";
  } else if (mode === "gameOver") {
    const s = Math.floor(score);
    overlayKicker.textContent = s >= bestScore ? "New Best Run" : "Run Over";
    overlayTitle.textContent = "Run Over";
    overlayScore.textContent = `Score ${s} | Coins ${coins} | Best ${bestScore}`;
    actionBtn.textContent = "Run Again";
    overlayHelp.textContent = "Keep a steady rhythm. The speed stays fixed, but the lanes get busier.";
  }
}

function hideOverlay() {
  overlay.classList.add("hidden");
  pauseBtn.style.display = "flex";
}

function startRun() {
  resetRun();
  state = "playing";
  hideOverlay();
  startLoop();
}

function resumeRun() {
  state = "playing";
  lastTime = null;
  hideOverlay();
  startLoop();
}

function startLoop() {
  if (animId !== null) cancelAnimationFrame(animId);
  animId = requestAnimationFrame(loop);
}

function worldToScreen(lane, z) {
  const t = projectDepth(z);
  return {
    x: getLaneCenter(lane, z),
    y: lerp(groundY, horizonY, t),
    scale: Math.max(0.035, Math.min(1.75, lerp(NEAR_SCALE, FAR_SCALE, t))),
  };
}

function projectDepth(z) {
  const depth = Math.max(MIN_PROJECTED_Z, Math.min(MAX_PROJECTED_Z, z));
  if (depth >= 0) {
    return ((1 + PROJECTION_CURVE) * depth) / (depth + PROJECTION_CURVE);
  }
  const nearDerivative = (1 + PROJECTION_CURVE) / PROJECTION_CURVE;
  return depth * nearDerivative;
}

function getTrackMetrics() {
  const landscape = isLandscapePhone();
  return {
    nearLeft: W * (landscape ? 0.08 : 0.055),
    nearRight: W * (landscape ? 0.92 : 0.945),
    farLeft: W * 0.455,
    farRight: W * 0.545,
  };
}

function getLaneCenter(lane, z) {
  const metrics = trackMetrics || getTrackMetrics();
  const t = projectDepth(z);
  const left = lerp(metrics.nearLeft, metrics.farLeft, t);
  const right = lerp(metrics.nearRight, metrics.farRight, t);
  const laneWidth = (right - left) / LANE_COUNT;
  return left + laneWidth * (lane + 0.5);
}

function stageForScore() {
  return 0;
}

function update(dt) {
  if (state !== "playing") return;

  runTime += dt;
  gameTime += dt;
  multiplier = 1;
  score += dt * SURVIVAL_SCORE_RATE;

  if (stageFade < 1) stageFade = Math.min(1, stageFade + dt / 0.8);

  speedZ = FIXED_Z_SPEED;

  obstacleTimer -= dt;
  if (obstacleTimer <= 0) {
    spawnObstacleWave();
    obstacleTimer = getObstacleInterval();
  }

  if (effects.jetpack > 0) {
    updateJetpackCoinLane(dt);
    jetpackCoinTimer -= dt;
    if (jetpackCoinTimer <= 0) {
      spawnJetpackCoinTrail();
      jetpackCoinTimer = randomRange(0.24, 0.36);
    }
  } else {
    coinTimer -= dt;
    if (coinTimer <= 0) {
      spawnCoinTrail();
      coinTimer = randomRange(1.15, 1.85);
    }
  }

  powerTimer -= dt;
  if (powerTimer <= 0) {
    if (effects.jetpack <= 0 && !hasJetpackPickup()) spawnPowerup("jetpack");
    powerTimer = randomRange(26, 38);
  }

  updatePlayer(dt);
  updateWorld(dt);
  updateEffects(dt);
  updateFloatingText(dt);
  checkInteractions();
}

function updatePlayer(dt) {
  const p = player;

  if (p.switching) {
    p.switchT += dt / LANE_SWITCH_TIME;
    if (p.switchT >= 1) {
      p.switchT = 1;
      p.switching = false;
      p.lane = p.targetLane;
    }
    p.x = lerp(p.switchFrom, p.switchTo, easeOut(p.switchT));
  } else {
    p.x = laneX[p.lane];
  }

  if (effects.jetpack > 0) {
    p.jumping = false;
    p.sliding = false;
    crouchHeld = false;
    const flightY = p.groundY - H * JETPACK_FLIGHT_RATIO + Math.sin(gameTime * 4.2) * H * 0.012;
    p.y += (flightY - p.y) * Math.min(1, dt * 6.5);
  } else if (p.jumping) {
    p.jumpT += dt / JUMP_TIME;
    if (p.jumpT >= 1) {
      p.jumpT = 1;
      p.jumping = false;
    }
    const jumpBoost = effects.sneakers > 0 ? 1.25 : 1;
    p.y = p.groundY - Math.sin(p.jumpT * Math.PI) * p.jumpPeak * jumpBoost;
  } else {
    p.y += (p.groundY - p.y) * Math.min(1, dt * 9);
    if (Math.abs(p.y - p.groundY) < 1) p.y = p.groundY;
  }

  if (p.sliding) {
    p.slideT += dt / SLIDE_TIME;
    if (!crouchHeld && p.slideT >= 1) p.sliding = false;
  }

  const slideTarget = p.sliding ? 1 : 0;
  p.slideVisual += (slideTarget - p.slideVisual) * Math.min(1, dt * 16);
}

function updateWorld(dt) {
  const dz = speedZ * dt;
  for (const obj of worldObjects) obj.z -= dz;

  let write = 0;
  for (let i = 0; i < worldObjects.length; i++) {
    const obj = worldObjects[i];
    const despawnZ = obj.kind === "coin" && obj.air ? -0.04 : DESPAWN_Z;
    if (obj.z > despawnZ && !obj.remove) {
      worldObjects[write++] = obj;
    } else if (obj.kind === "obstacle" && !obj.scored && obj.z <= -0.05) {
      dodges += 1;
      score += DODGE_SCORE;
    }
  }
  worldObjects.length = write;

  for (const marker of trackMarkers) {
    marker.z -= dz;
    if (marker.z < 0) marker.z += FAR_Z;
  }
}

function updateEffects(dt) {
  const wasJetpack = effects.jetpack > 0;
  if (effects.magnet > 0) effects.magnet = Math.max(0, effects.magnet - dt);
  if (effects.shield > 0) effects.shield = Math.max(0, effects.shield - dt);
  if (effects.sneakers > 0) effects.sneakers = Math.max(0, effects.sneakers - dt);
  if (effects.jetpack > 0) effects.jetpack = Math.max(0, effects.jetpack - dt);
  if (wasJetpack && effects.jetpack <= 0) {
    for (const obj of worldObjects) {
      if (obj.kind === "coin" && obj.air) obj.remove = true;
    }
    jetpackCoinTimer = 0.45;
  }
  if (effects.flash > 0) effects.flash = Math.max(0, effects.flash - dt);
  if (effects.shield <= 0) effects.shieldHits = 0;
}

function updateFloatingText(dt) {
  let write = 0;
  for (const item of floatingText) {
    item.life -= dt;
    item.y -= dt * 44;
    item.scale += dt * 0.22;
    if (item.life > 0) floatingText[write++] = item;
  }
  floatingText.length = write;
}

function addFloat(text, x, y, color = "#fff") {
  floatingText.push({ text, x, y, color, life: 0.85, maxLife: 0.85, scale: 1 });
}

function getObstacleInterval() {
  const pressure = Math.min(1, score / 5200);
  return randomRange(1.62, 2.08) - pressure * 0.24;
}

function spawnObstacleWave() {
  const z = FAR_Z;
  obstacleWaveCount += 1;
  const pressure = Math.min(1, Math.max(0, (score - 650) / 5200));
  const doubleChance = runTime < 10 ? 0 : 0.08 + pressure * 0.24;

  if (Math.random() > doubleChance) {
    spawnObstacle(chooseSingleObstacleLane(), "crate", z);
    return;
  }

  const safe = chooseDoubleSafeLane();
  for (let lane = 0; lane < LANE_COUNT; lane++) {
    if (lane !== safe) spawnObstacle(lane, "crate", z);
  }
}

function chooseSingleObstacleLane() {
  let lane = randomLane();
  if (lane === lastObstacleLane && repeatedObstacleLaneCount >= 1) {
    const alternatives = [0, 1, 2].filter(candidate => candidate !== lane);
    lane = alternatives[Math.floor(Math.random() * alternatives.length)];
  }

  if (lane === lastObstacleLane) repeatedObstacleLaneCount += 1;
  else repeatedObstacleLaneCount = 0;
  lastObstacleLane = lane;
  return lane;
}

function chooseDoubleSafeLane() {
  const options = [0, 1, 2].filter(lane => lane !== lastDoubleSafeLane);
  const playerLane = player ? player.targetLane : 1;
  const weighted = options.concat(playerLane);
  const safe = weighted[Math.floor(Math.random() * weighted.length)];
  lastDoubleSafeLane = safe;
  lastObstacleLane = -1;
  repeatedObstacleLaneCount = 0;
  return safe;
}

function pickObstacleType() {
  return "crate";
}

function spawnObstacle(lane, type, z) {
  const config = obstacleConfigs[type] || obstacleConfigs.crate;
  worldObjects.push({
    kind: "obstacle",
    type,
    lane,
    z,
    hRatio: config.h,
    scored: false,
    cleared: false,
    wobble: Math.random() * Math.PI * 2,
  });
}

function spawnCoinTrail() {
  const activeGroundCoins = worldObjects.filter(obj => obj.kind === "coin" && !obj.air && !obj.remove).length;
  if (activeGroundCoins > 8) return;

  const previousLane = coinGuideLane;
  if (coinTrailCount === 0 || Math.random() < 0.42) {
    const options = [previousLane];
    if (previousLane > 0) options.push(previousLane - 1);
    if (previousLane < LANE_COUNT - 1) options.push(previousLane + 1);
    coinGuideLane = options[Math.floor(Math.random() * options.length)];
  }

  const lane = coinGuideLane;
  const count = Math.random() < 0.22 ? 5 : 4;
  const startZ = 0.98;
  const gap = 0.13;
  for (let i = 0; i < count; i++) {
    worldObjects.push({
      kind: "coin",
      lane,
      z: Math.max(0.42, startZ - i * gap),
      collected: false,
      spin: Math.random() * Math.PI * 2,
    });
  }
  coinTrailCount += 1;
}

function spawnJetpackCoinTrail() {
  const activeAirCoins = worldObjects.filter(obj => obj.kind === "coin" && obj.air && !obj.remove).length;
  if (activeAirCoins > 18) return;
  worldObjects.push({
    kind: "coin",
    lane: jetpackCoinLane,
    z: 0.98,
    air: true,
    laneOffset: 0,
    collected: false,
    spin: Math.random() * Math.PI * 2,
  });
}

function updateJetpackCoinLane(dt) {
  jetpackLaneTimer -= dt;
  if (jetpackLaneTimer > 0) return;

  const options = [];
  if (jetpackCoinLane > 0) options.push(jetpackCoinLane - 1);
  options.push(jetpackCoinLane);
  if (jetpackCoinLane < LANE_COUNT - 1) options.push(jetpackCoinLane + 1);

  const adjacent = options.filter(lane => lane !== jetpackCoinLane);
  jetpackCoinLane = Math.random() < 0.64 && adjacent.length
    ? adjacent[Math.floor(Math.random() * adjacent.length)]
    : jetpackCoinLane;
  jetpackLaneTimer = randomRange(1.55, 2.25);
}

function hasJetpackPickup() {
  return worldObjects.some(obj => obj.kind === "powerup" && obj.type === "jetpack" && !obj.remove);
}

function spawnPowerup(type = "jetpack") {
  worldObjects.push({
    kind: "powerup",
    type,
    lane: randomLane(),
    z: FAR_Z,
    pulse: 0,
  });
}

function checkInteractions() {
  const pRect = getPlayerRect();

  for (const obj of worldObjects) {
    if (obj.remove || obj.z > 0.34 || obj.z < -0.08) continue;

    if (obj.kind === "coin") {
      const rect = getCoinRect(obj);
      const magnetCatch = effects.magnet > 0 && obj.z < 0.42 && Math.abs(rect.cx - player.x) < W * 0.26;
      if (magnetCatch || rectsOverlap(pRect, rect)) collectCoin(obj, rect);
      continue;
    }

    if (obj.kind === "powerup") {
      const rect = getPowerupRect(obj);
      if (rectsOverlap(pRect, rect)) collectPowerup(obj, rect);
      continue;
    }

    if (obj.kind === "obstacle") {
      if (effects.jetpack > 0) continue;
      if (obj.cleared) continue;
      if (obj.z > COLLISION_Z || obj.z < COLLISION_PAST_Z) continue;
      const rect = getObstacleRect(obj);
      if (isObstacleSafelyCleared(obj, rect, pRect)) {
        markObstacleCleared(obj, rect);
        continue;
      }
      if (!rectsOverlap(pRect, rect)) continue;
      if (effects.shieldHits > 0) {
        effects.shieldHits = 0;
        effects.shield = 0;
        effects.flash = 0.35;
        obj.remove = true;
      } else {
        endRun();
        return;
      }
    }
  }
}

function collectCoin(obj, rect) {
  obj.remove = true;
  coins += 1;
  totalCoins += 1;
  score += obj.air ? AIR_COIN_SCORE : GROUND_COIN_SCORE;
  mission.count = Math.min(mission.target, mission.count + 1);
  addFloat("+20", rect.cx, rect.y, "#ffe05b");
  if (!mission.complete && mission.count >= mission.target) {
    mission.complete = true;
    score += MISSION_SCORE_BONUS;
  }
}

function collectPowerup(obj, rect) {
  obj.remove = true;
  const cfg = powerupConfigs[obj.type];
  if (obj.type === "jetpack") {
    effects.jetpack = cfg.duration;
    jetpackCoinTimer = 0.05;
    jetpackCoinLane = player.targetLane;
    jetpackLaneTimer = 0.9;
    powerTimer = cfg.duration + randomRange(24, 34);
    crouchHeld = false;
    player.sliding = false;
    player.jumping = false;
    player.jumpT = 0;
    for (const item of worldObjects) {
      if (item.kind === "coin" && !item.air) item.remove = true;
    }
  } else if (obj.type === "shield") {
    effects.shieldHits = 1;
    effects.shield = cfg.duration;
  } else {
    effects[obj.type] = cfg.duration;
  }
}

function isObstacleSafelyCleared(obj, rect, pRect) {
  const action = obstacleConfigs[obj.type].action;
  if (action === "jump") {
    const feetLifted = player.jumping;
    const feetAboveObstacle = pRect.y + pRect.h < rect.y + rect.h * 0.42;
    return feetLifted || feetAboveObstacle;
  }
  if (action === "slide") return player.sliding;
  return false;
}

function markObstacleCleared(obj, rect) {
  obj.cleared = true;
  if (!obj.scored) {
    obj.scored = true;
    dodges += 1;
    score += DODGE_SCORE;
  }
}

function getPlayerRect() {
  const sliding = player.sliding;
  const h = player.h * PLAYER_HIT_H * (sliding ? 0.5 : 1);
  const w = player.w * PLAYER_HIT_W * (sliding ? 1.05 : 1);
  return {
    x: player.x - w / 2,
    y: player.y - h,
    w,
    h,
    cx: player.x,
    cy: player.y - h / 2,
  };
}

function getCoinRect(obj) {
  const visual = getCoinVisual(obj);
  const hit = visual.size * (obj.air ? 0.86 : 0.95);
  return {
    x: visual.x - hit / 2,
    y: visual.y - hit / 2,
    w: hit,
    h: hit,
    cx: visual.x,
    cy: visual.y,
  };
}

function getPowerupRect(obj) {
  const p = worldToScreen(obj.lane, obj.z);
  const s = Math.max(22, H * 0.09 * p.scale);
  const y = p.y - s * 1.28;
  return { x: p.x - s / 2, y: y - s / 2, w: s, h: s, cx: p.x, cy: y };
}

function getObstacleRect(obj) {
  const p = worldToScreen(obj.lane, obj.z);
  const size = getObstacleSize(obj, p.scale);
  const config = obstacleConfigs[obj.type];
  const hitW = config.hitW || 0.62;
  const hitH = config.hitH || 0.62;
  return {
    x: p.x - size.w * hitW / 2,
    y: p.y - size.h * hitH,
    w: size.w * hitW,
    h: size.h * hitH,
    cx: p.x,
    cy: p.y - size.h * hitH / 2,
  };
}

function getObstacleSize(obj, scale) {
  const config = obstacleConfigs[obj.type];
  const h = H * obj.hRatio * scale;
  let w = h * (config.wMul || 1);
  const img = config.asset ? assets[config.asset] : null;
  if (img && img.naturalWidth) w = h * (img.naturalWidth / img.naturalHeight) * (config.wMul || 1);
  return { w, h };
}

function moveLeft() { changeLane(-1); }
function moveRight() { changeLane(1); }

function changeLane(dir) {
  if (state !== "playing") return;
  const next = Math.max(0, Math.min(LANE_COUNT - 1, player.targetLane + dir));
  if (next === player.targetLane) return;
  player.targetLane = next;
  player.switching = true;
  player.switchT = 0;
  player.switchFrom = player.x;
  player.switchTo = laneX[next];
}

function jump() {
  if (state !== "playing" || player.jumping) return;
  player.jumping = true;
  crouchHeld = false;
  player.sliding = false;
  player.jumpT = 0;
}

function slide(held = false) {
  if (state !== "playing" || player.jumping) return;
  crouchHeld = held;
  player.sliding = true;
  player.slideT = 0;
}

function stopCrouchHold() {
  crouchHeld = false;
}

function togglePause() {
  if (state === "playing") {
    state = "paused";
    showOverlay("paused");
    return;
  }
  if (state === "paused") resumeRun();
}

function endRun() {
  if (state === "gameOver") return;
  state = "gameOver";
  crouchHeld = false;
  const s = Math.floor(score);
  if (s > bestScore) {
    bestScore = s;
    localStorage.setItem(STORAGE_BEST, String(bestScore));
  }
  localStorage.setItem(STORAGE_COINS, String(totalCoins));
  showOverlay("gameOver");
  if (animId !== null) {
    cancelAnimationFrame(animId);
    animId = null;
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  drawBackground();
  drawTrack();
  drawObjects();
  drawPlayer();
  drawFloatingText();
  drawHud();

  if (state === "loading") {
    ctx.fillStyle = "#06100e";
    ctx.fillRect(0, 0, W, H);
  }
}

function drawBackground() {
  if (stageFade < 1) {
    drawStageImage(stagePrevious, 1);
    ctx.save();
    ctx.globalAlpha = stageFade;
    drawStageImage(stageCurrent, 1);
    ctx.restore();
  } else {
    drawStageImage(stageCurrent, 1);
  }

  const shade = ctx.createLinearGradient(0, 0, 0, H);
  shade.addColorStop(0, "rgba(0,0,0,0.05)");
  shade.addColorStop(0.55, "rgba(0,30,24,0.05)");
  shade.addColorStop(1, "rgba(0,0,0,0.18)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, H);
}

function drawStageImage(stageIndex) {
  const img = assets[stageAssets[stageIndex]];
  if (!img) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#17a8ff");
    g.addColorStop(0.5, "#36d37d");
    g.addColorStop(1, "#0b231e");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    return;
  }

  const imgRatio = img.naturalWidth / img.naturalHeight;
  const viewRatio = W / H;
  let dw = W;
  let dh = H;
  if (imgRatio > viewRatio) {
    dh = H;
    dw = dh * imgRatio;
  } else {
    dw = W;
    dh = dw / imgRatio;
  }
  const parallax = Math.sin(gameTime * 0.22) * W * 0.015;
  const dx = (W - dw) / 2 + parallax;
  const dy = (H - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function drawTrack() {
  const { nearLeft, nearRight, farLeft, farRight } = trackMetrics || getTrackMetrics();

  const road = ctx.createLinearGradient(0, horizonY, 0, H);
  road.addColorStop(0, "rgba(20, 38, 45, 0.08)");
  road.addColorStop(0.45, "rgba(5, 28, 34, 0.18)");
  road.addColorStop(1, "rgba(0, 8, 10, 0.32)");
  ctx.fillStyle = road;
  ctx.beginPath();
  ctx.moveTo(farLeft, horizonY);
  ctx.lineTo(farRight, horizonY);
  ctx.lineTo(nearRight, H);
  ctx.lineTo(nearLeft, H);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  for (let i = 0; i <= LANE_COUNT; i++) {
    const t = i / LANE_COUNT;
    const bx = lerp(nearLeft, nearRight, t);
    const hx = lerp(farLeft, farRight, t);
    ctx.beginPath();
    ctx.moveTo(hx, horizonY);
    ctx.lineTo(bx, H);
    ctx.stroke();
  }

  ctx.lineWidth = 1;
  for (const marker of trackMarkers) {
    const z = marker.z;
    if (z < 0.03 || z > 1) continue;
    const t = projectDepth(z);
    const y = lerp(groundY, horizonY, t);
    const left = lerp(nearLeft, farLeft, t);
    const right = lerp(nearRight, farRight, t);
    const alpha = Math.max(0, (1 - z) * 0.42);
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
  }
}

function drawObjects() {
  const sorted = worldObjects.slice().sort((a, b) => b.z - a.z);
  for (const obj of sorted) {
    if (obj.kind === "coin") drawCoin(obj);
    else if (obj.kind === "obstacle") drawObstacle(obj);
    else if (obj.kind === "powerup") drawPowerup(obj);
  }
}

function getCoinVisual(obj) {
  const p = worldToScreen(obj.lane, obj.z);
  const metrics = trackMetrics || getTrackMetrics();
  const t = projectDepth(obj.z);
  const laneWidth = (lerp(metrics.nearRight, metrics.farRight, t) - lerp(metrics.nearLeft, metrics.farLeft, t)) / LANE_COUNT;
  const size = Math.max(obj.air ? 11 : 8, H * (obj.air ? 0.03 : 0.027) * p.scale);
  const airLineY = player ? player.y - H * 0.075 : groundY - H * 0.45;
  const airFarY = Math.max(H * 0.18, horizonY - H * 0.15);
  const airFloat = Math.sin(gameTime * 2.8 + obj.spin) * H * 0.004;
  return {
    x: p.x + (obj.air ? (obj.laneOffset || 0) * laneWidth : 0),
    y: obj.air ? lerp(airLineY, airFarY, t) + airFloat : p.y - size * 2.95,
    size,
    scale: p.scale,
  };
}

function drawCoin(obj) {
  const visual = getCoinVisual(obj);
  const img = assets.coin;
  const pulse = 1 + Math.sin(gameTime * 7 + obj.spin) * 0.045;
  const size = visual.size * pulse;
  if (img) {
    ctx.save();
    ctx.shadowColor = "rgba(255, 207, 39, 0.42)";
    ctx.shadowBlur = Math.max(4, size * 0.22);
    ctx.drawImage(img, visual.x - size / 2, visual.y - size / 2, size, size);
    ctx.restore();
    return;
  }

  const r = size / 2;
  const g = ctx.createRadialGradient(visual.x - r * 0.3, visual.y - r * 0.35, r * 0.2, visual.x, visual.y, r);
  g.addColorStop(0, "#fff7a6");
  g.addColorStop(0.55, "#ffd03b");
  g.addColorStop(1, "#ff8b00");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(visual.x, visual.y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawPowerup(obj) {
  const p = worldToScreen(obj.lane, obj.z);
  const s = Math.max(24, H * 0.09 * p.scale);
  const y = p.y - s * 1.28 + Math.sin(gameTime * 5 + obj.z * 10) * s * 0.08;
  const cfg = powerupConfigs[obj.type];
  const img = cfg.asset ? assets[cfg.asset] : null;

  ctx.save();
  ctx.shadowColor = cfg.color;
  ctx.shadowBlur = s * 0.35;
  if (img) {
    ctx.drawImage(img, p.x - s / 2, y - s / 2, s, s);
    ctx.restore();
    return;
  }
  ctx.fillStyle = "rgba(3, 22, 24, 0.88)";
  roundRect(ctx, p.x - s / 2, y - s / 2, s, s, s * 0.22);
  ctx.fill();
  ctx.strokeStyle = cfg.color;
  ctx.lineWidth = Math.max(2, s * 0.08);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = cfg.color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${Math.max(12, s * 0.28)}px Arial`;
  const label = obj.type === "magnet" ? "M" : obj.type === "shield" ? "S" : "J";
  ctx.fillText(label, p.x, y);
  ctx.restore();
}

function drawObstacle(obj) {
  const p = worldToScreen(obj.lane, obj.z);
  const size = getObstacleSize(obj, p.scale);
  const x = p.x - size.w / 2;
  const y = p.y - size.h;
  const cfg = obstacleConfigs[obj.type];

  const shadowAlpha = Math.max(0, (1 - obj.z) * 0.36);
  ctx.fillStyle = `rgba(0,0,0,${shadowAlpha.toFixed(3)})`;
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 2, size.w * 0.45, size.h * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();

  const img = cfg.asset ? assets[cfg.asset] : null;
  if (img) {
    ctx.drawImage(img, x, y, size.w, size.h);
  } else if (obj.type === "gate") {
    drawGateObstacle(x, y, size.w, size.h, p.scale);
  } else {
    drawWallObstacle(x, y, size.w, size.h, p.scale);
  }

  if (debugMode) {
    const rect = getObstacleRect(obj);
    ctx.strokeStyle = "rgba(255, 70, 70, 0.9)";
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  }
}

function drawGateObstacle(x, y, w, h, scale) {
  const postW = w * 0.16;
  const topH = h * 0.28;
  ctx.fillStyle = "rgba(4, 31, 35, 0.96)";
  roundRect(ctx, x, y, w, h, h * 0.08);
  ctx.fill();
  ctx.strokeStyle = "#63ff5d";
  ctx.lineWidth = Math.max(2, 4 * scale);
  ctx.stroke();

  ctx.fillStyle = "#ff9c15";
  roundRect(ctx, x + postW * 0.7, y + topH * 0.72, postW, h * 0.7, 4 * scale);
  ctx.fill();
  roundRect(ctx, x + w - postW * 1.7, y + topH * 0.72, postW, h * 0.7, 4 * scale);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.14)";
  ctx.fillRect(x + postW * 1.5, y + topH, w - postW * 3, h * 0.08);
}

function drawWallObstacle(x, y, w, h, scale) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, "#1fe0cf");
  g.addColorStop(0.5, "#0b605d");
  g.addColorStop(1, "#042a2d");
  ctx.fillStyle = g;
  roundRect(ctx, x, y, w, h, h * 0.1);
  ctx.fill();
  ctx.strokeStyle = "#ffb22f";
  ctx.lineWidth = Math.max(2, 4 * scale);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.fillRect(x + w * 0.12, y + h * 0.18, w * 0.76, h * 0.08);
}

function drawActionBadge(text, x, y, scale) {
  const w = Math.max(32, 74 * scale);
  const h = Math.max(12, 22 * scale);
  ctx.fillStyle = "rgba(0, 20, 18, 0.72)";
  roundRect(ctx, x - w / 2, y - h / 2, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${Math.max(8, 13 * scale)}px Arial`;
  ctx.fillText(text, x, y + 1);
}

function drawPlayer() {
  if (!player) return;
  const playerImage = getPlayerImage();
  const slideEase = easeOut(player.slideVisual || 0);
  const sliding = slideEase > 0.01;
  const imageAspect = playerImage && playerImage.naturalWidth
    ? playerImage.naturalWidth / playerImage.naturalHeight
    : player.w / Math.max(1, player.h);
  const drawH = player.h * (1 - slideEase * 0.42);
  const drawW = sliding
    ? player.w * (1 - slideEase * 0.1)
    : drawH * imageAspect;
  const bob = !player.jumping && !sliding ? Math.sin(gameTime * 13) * H * 0.005 : 0;
  const x = player.x - drawW / 2;
  const y = player.y - drawH + bob;

  const jumpAmount = Math.max(0, player.groundY - player.y);
  const jumpT = Math.min(1, jumpAmount / Math.max(1, player.jumpPeak));
  ctx.fillStyle = `rgba(0,0,0,${(0.32 * (1 - jumpT * 0.7)).toFixed(3)})`;
  ctx.beginPath();
  ctx.ellipse(player.x, player.groundY + 4, player.w * 0.42 * (1 - jumpT * 0.25), player.h * 0.075, 0, 0, Math.PI * 2);
  ctx.fill();

  if (effects.magnet > 0) {
    ctx.strokeStyle = "rgba(255, 70, 88, 0.42)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(player.x, player.y - player.h * 0.55, player.h * 0.72, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (effects.shieldHits > 0) {
    ctx.strokeStyle = "rgba(54, 216, 255, 0.72)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(player.x, player.y - player.h * 0.5, player.h * 0.58 + Math.sin(gameTime * 6) * 3, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (effects.jetpack > 0) {
    drawFlyingPlayer(playerImage, drawW, drawH);
    if (debugMode) {
      const rect = getPlayerRect();
      ctx.strokeStyle = "rgba(116,255,86,0.9)";
      ctx.lineWidth = 2;
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    }
    return;
  }

  if (effects.flash > 0) ctx.globalAlpha = 0.5 + Math.sin(gameTime * 40) * 0.25;
  if (playerImage) ctx.drawImage(playerImage, x, y, drawW, drawH);
  else {
    ctx.fillStyle = "#ff3e22";
    roundRect(ctx, x, y, drawW, drawH, 14);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  if (debugMode) {
    const rect = getPlayerRect();
    ctx.strokeStyle = "rgba(116,255,86,0.9)";
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  }
}

function drawFlyingPlayer(playerImage, drawW, drawH) {
  const bodyH = drawH * 0.96;
  const bodyW = drawW * 0.96;
  const centerX = player.x;
  const centerY = player.y - bodyH * 0.42 + Math.sin(gameTime * 5.8) * H * 0.004;
  const angle = -0.12 + Math.sin(gameTime * 3.4) * 0.02;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);

  if (playerImage) ctx.drawImage(playerImage, -bodyW / 2, -bodyH / 2, bodyW, bodyH);
  else {
    ctx.fillStyle = "#ff3e22";
    roundRect(ctx, -bodyW / 2, -bodyH / 2, bodyW, bodyH, 14);
    ctx.fill();
  }

  drawPlayerJetpack(bodyW, bodyH);
  ctx.restore();
}

function drawPlayerJetpack(bodyW, bodyH) {
  const img = assets.jetpack;
  const packW = bodyW * 0.62;
  const packH = img && img.naturalWidth ? packW * (img.naturalHeight / img.naturalWidth) : bodyH * 0.5;
  const packX = -packW / 2;
  const packY = -bodyH * 0.25;

  ctx.save();
  ctx.globalAlpha = 0.96;
  if (img) {
    ctx.drawImage(img, packX, packY, packW, packH);
  } else {
    ctx.fillStyle = "#36d8ff";
    roundRect(ctx, packX, packY, packW, packH, packW * 0.16);
    ctx.fill();
  }

  const flameY = packY + packH * 0.88;
  const flameH = bodyH * (0.28 + Math.sin(gameTime * 26) * 0.05);
  const flameW = packW * 0.22;
  for (const offset of [-packW * 0.28, packW * 0.28]) {
    const fx = offset;
    const g = ctx.createRadialGradient(fx, flameY, 2, fx, flameY + flameH * 0.45, flameH * 0.58);
    g.addColorStop(0, "rgba(255,255,255,0.92)");
    g.addColorStop(0.35, "rgba(255,215,54,0.76)");
    g.addColorStop(1, "rgba(255,109,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(fx, flameY + flameH * 0.42, flameW, flameH * 0.52, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawHud() {
  const pad = Math.max(10, W * 0.025);
  const topH = Math.max(58, H * 0.08);
  const g = ctx.createLinearGradient(0, 0, 0, topH);
  g.addColorStop(0, "rgba(0, 20, 18, 0.88)");
  g.addColorStop(1, "rgba(0, 10, 10, 0.55)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, topH);

  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillStyle = "#74ff56";
  ctx.font = `900 ${Math.max(10, H * 0.018)}px Arial`;
  ctx.fillText("INK RUN RUSH", pad, topH * 0.3);

  ctx.fillStyle = "#fff";
  ctx.font = `900 ${Math.max(20, H * 0.035)}px Arial Black, Arial`;
  ctx.fillText(String(Math.floor(score)), pad, topH * 0.69);

  const rightHudX = W - pad - Math.max(58, W * 0.12);
  drawHudChip(rightHudX, topH * 0.36, "COINS", coins, "#ffd840", "right");
  drawHudChip(rightHudX, topH * 0.74, "BEST", bestScore, "#ffffff", "right");
  drawMissionChip(pad, topH + pad * 0.7);
  drawEffectChips();
}

function drawHudChip(x, y, label, value, color, align) {
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.font = `900 ${Math.max(12, H * 0.018)}px Arial`;
  ctx.fillText(`${label} ${value}`, x, y);
}

function drawMissionChip(x, y) {
  const text = mission.complete ? "Mission complete" : `${mission.text}: ${mission.count}/${mission.target}`;
  ctx.font = `900 ${Math.max(11, H * 0.016)}px Arial`;
  const w = Math.min(W - x * 2 - 70, ctx.measureText(text).width + 26);
  const h = Math.max(26, H * 0.036);
  ctx.fillStyle = "rgba(0, 23, 20, 0.66)";
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.strokeStyle = mission.complete ? "rgba(255, 178, 47, 0.75)" : "rgba(116, 255, 86, 0.4)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + 13, y + h / 2);
}

function drawEffectChips() {
  const active = [];
  if (effects.magnet > 0) active.push(["MAGNET", effects.magnet, "#ff4757"]);
  if (effects.shieldHits > 0) active.push(["SHIELD", effects.shield, "#36d8ff"]);
  if (effects.sneakers > 0) active.push(["JUMP+", effects.sneakers, "#ffb22f"]);
  if (effects.jetpack > 0) active.push(["JETPACK", effects.jetpack, "#36d8ff"]);
  let y = H * 0.155;
  const x = W - Math.max(12, W * 0.03);
  for (const [label, time, color] of active) {
    const text = `${label} ${Math.ceil(time)}s`;
    ctx.font = `900 ${Math.max(11, H * 0.016)}px Arial`;
    const w = ctx.measureText(text).width + 22;
    const h = Math.max(25, H * 0.034);
    ctx.fillStyle = "rgba(0, 18, 18, 0.74)";
    roundRect(ctx, x - w, y, w, h, h / 2);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x - w / 2, y + h / 2);
    y += h + 6;
  }
}

function drawFloatingText() {
  for (const item of floatingText) {
    const alpha = Math.max(0, item.life / item.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = item.color;
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.lineWidth = 4;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `900 ${Math.max(14, H * 0.025 * item.scale)}px Arial Black, Arial`;
    ctx.strokeText(item.text, item.x, item.y);
    ctx.fillText(item.text, item.x, item.y);
    ctx.restore();
  }
}

function loop(ts) {
  if (lastTime === null) lastTime = ts;
  const dt = Math.min(0.05, (ts - lastTime) / 1000);
  lastTime = ts;

  if (state === "playing") update(dt);
  draw();

  if (state === "playing" || state === "paused" || state === "ready" || state === "loading") {
    animId = requestAnimationFrame(loop);
  } else {
    animId = null;
  }
}

function handleActionButton() {
  if (state === "loading") return;
  if (state === "ready" || state === "gameOver") startRun();
  else if (state === "paused") resumeRun();
}

function backToArcade() {
  if (animId !== null) {
    cancelAnimationFrame(animId);
    animId = null;
  }
  state = "ready";
  window.location.href = "../index.html";
}

function handleKey(e) {
  const key = e.key.toLowerCase();
  if (["arrowleft", "a"].includes(key)) { e.preventDefault(); moveLeft(); }
  else if (["arrowright", "d"].includes(key)) { e.preventDefault(); moveRight(); }
  else if (["arrowup", "w", " "].includes(key)) { e.preventDefault(); jump(); }
  else if (["arrowdown", "s"].includes(key)) { e.preventDefault(); slide(true); }
  else if (key === "p" || key === "escape") { e.preventDefault(); togglePause(); }
  else if (key === "enter" && state !== "playing") { e.preventDefault(); handleActionButton(); }
  else if (key === "x") debugMode = !debugMode;
}

function handleKeyUp(e) {
  const key = e.key.toLowerCase();
  if (["arrowdown", "s"].includes(key)) {
    e.preventDefault();
    stopCrouchHold();
  }
}

function wireButton(el, fn) {
  if (!el) return;
  el.addEventListener("pointerdown", e => {
    e.preventDefault();
    fn();
  });
}

function safePointerCapture(el, e) {
  try {
    if (el && el.setPointerCapture && e.pointerId !== undefined) el.setPointerCapture(e.pointerId);
  } catch {
    // Some embedded mobile browsers and synthetic tests expose pointer events without active capture.
  }
}

wireButton(controls.left, moveLeft);
wireButton(controls.right, moveRight);
wireButton(controls.up, jump);
wireButton(controls.jump, jump);

if (controls.down) {
  controls.down.addEventListener("pointerdown", e => {
    e.preventDefault();
    slide(true);
    safePointerCapture(controls.down, e);
  });
  controls.down.addEventListener("pointerup", e => {
    e.preventDefault();
    stopCrouchHold();
  });
  controls.down.addEventListener("pointercancel", stopCrouchHold);
  controls.down.addEventListener("lostpointercapture", stopCrouchHold);
}

canvas.addEventListener("pointerdown", e => {
  if (state !== "playing") return;
  pointerStart = { x: e.clientX, y: e.clientY, t: performance.now() };
  safePointerCapture(canvas, e);
  e.preventDefault();
}, { passive: false });

canvas.addEventListener("pointerup", e => {
  if (state !== "playing" || !pointerStart) return;
  const dx = e.clientX - pointerStart.x;
  const dy = e.clientY - pointerStart.y;
  const min = 26;
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > min) moveRight();
    else if (dx < -min) moveLeft();
  } else {
    if (dy < -min) jump();
    else if (dy > min) slide();
  }
  pointerStart = null;
  e.preventDefault();
}, { passive: false });

canvas.addEventListener("pointercancel", () => { pointerStart = null; });
document.addEventListener("keydown", handleKey);
document.addEventListener("keyup", handleKeyUp);
pauseBtn.addEventListener("click", togglePause);
actionBtn.addEventListener("click", handleActionButton);
arcadeBtn?.addEventListener("click", backToArcade);

window.addEventListener("resize", () => {
  resize();
  draw();
});

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function randomLane() {
  return Math.floor(Math.random() * LANE_COUNT);
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeOut(t) {
  return 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function boot() {
  showOverlay("loading");
  resize();
  draw();
  loadAssets().then(() => {
    assetsReady = true;
    refreshPlayerAnimationFrames();
    resetRun();
    state = "ready";
    showOverlay("ready");
    startLoop();
  });
}

boot();
