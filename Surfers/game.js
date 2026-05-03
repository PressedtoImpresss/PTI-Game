// Subway-style Z-depth endless runner.
// World space: z=1 is the far horizon, z=0 is the player's feet.
// Obstacles spawn at z≈1, travel toward z=0, despawn at z<-0.12.
// Screen positions are derived from worldToScreen(lane, z) each frame.

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
const overlay      = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayScore = document.getElementById('overlay-score');
const restartBtn   = document.getElementById('restart-btn');
const pauseBtn     = document.getElementById('pause-btn');

// ─── Tuning ──────────────────────────────────────────────────────────────────
const INITIAL_Z_SPEED       = 0.55;   // z-units per second at start
const MAX_Z_SPEED           = 1.40;   // cap
const Z_INCREASE_RATE       = 0.020;  // added (z/sec) per 100 score points

const OBSTACLE_SPAWN_Z       = 0.98;  // z where new obstacles appear
const OBSTACLE_MIN_GAP_Z     = 0.30;  // min z gap between consecutive spawns
const OBSTACLE_BASE_INTERVAL = 1.60;  // seconds between spawn attempts at score 0
const OBSTACLE_MIN_INTERVAL  = 0.75;  // floor on spawn interval
const OBSTACLE_INTERVAL_DECAY= 1500;  // higher = slower ramp

// Perspective projection — all derived in worldToScreen().
const HORIZON_Y_RATIO = 0.38;  // where horizon sits on screen (fraction of H)
const PLAYER_Y_RATIO  = 0.80;  // where player's feet sit (fraction of H)
const VANISH_X_RATIO  = 0.50;  // vanishing-point X (screen centre)
const FAR_SCALE       = 0.06;  // obstacle visual scale at z=1 (tiny, near horizon)
const NEAR_SCALE      = 1.15;  // obstacle visual scale at z=0 (player level)

// Collision is only checked when an obstacle is this close.
const COLLISION_Z = 0.18;

// ─── Stage system ────────────────────────────────────────────────────────────
const STAGE_THRESHOLDS = [0, 50, 200];
const STAGE_DIFFICULTY = [
  { zSpeedMul: 1.00, intervalMul: 1.00 },
  { zSpeedMul: 1.15, intervalMul: 0.85 },
  { zSpeedMul: 1.30, intervalMul: 0.70 },
];
const TRANSITION_DURATION = 3.0;

// ─── Jump ────────────────────────────────────────────────────────────────────
const JUMP_DURATION    = 0.75;
const JUMP_COOLDOWN    = 0.90;
const JUMP_HEIGHT_RATIO= 0.20;  // peak height above ground as fraction of H
const JUMP_LAND_GRACE  = 0.12;  // seconds of collision immunity right after landing

// ─── Player animation ────────────────────────────────────────────────────────
const BOB_FREQ = 10;    // radians / sec
const BOB_AMP  = 0.005; // fraction of H  (≈ 3.5 px on 700 px canvas)

// ─── Layout ──────────────────────────────────────────────────────────────────
const LANE_COUNT = 3;
const BASE_W = 420;
const BASE_H = 700;

let W, H, laneW, laneX;
let horizonY, playerGroundY, vanishX;

// ─── Assets ──────────────────────────────────────────────────────────────────
const ASSET_SOURCES = {
  player:  'assets/player.png',
  barrier: 'assets/barrier.png',
  crate:   'assets/crate.png',
};
const assets = {};
let assetsReady = false;

function loadAssets() {
  return Promise.all(Object.entries(ASSET_SOURCES).map(([key, src]) =>
    new Promise(resolve => {
      const img = new Image();
      img.onload  = () => { assets[key] = img;  resolve(); };
      img.onerror = () => {
        console.warn(`Failed to load ${src}`);
        assets[key] = null;
        resolve();
      };
      img.src = src;
    })
  ));
}

function resize() {
  const maxH = window.innerHeight - (isMobile() ? 100 : 0);
  const scale = Math.min(window.innerWidth / BASE_W, maxH / BASE_H);
  W = Math.round(BASE_W * scale);
  H = Math.round(BASE_H * scale);
  canvas.width  = W;
  canvas.height = H;
  laneW         = W / LANE_COUNT;
  laneX         = [laneW * 0.5, laneW * 1.5, laneW * 2.5];
  horizonY      = H * HORIZON_Y_RATIO;
  playerGroundY = H * PLAYER_Y_RATIO;
  vanishX       = W * VANISH_X_RATIO;
  buildBGCache();
}

function isMobile() {
  return window.matchMedia('(max-width:600px), (pointer:coarse)').matches;
}

// ─── Perspective projection ──────────────────────────────────────────────────
// z=0 → player level (big, at bottom).  z=1 → horizon (tiny, at top).
function worldToScreen(lane, z) {
  const t = Math.max(0, Math.min(1, z));
  return {
    x:     lerp(laneX[lane], vanishX, t),
    y:     lerp(playerGroundY, horizonY, t),
    scale: lerp(NEAR_SCALE,   FAR_SCALE, t),
  };
}

// ─── Procedural backgrounds ──────────────────────────────────────────────────
// skyBot === road gradient start → eliminates the hard horizon seam.
const STAGE_PALETTES = [
  { // Stage 1: Night Factory  (orange windows, purple glow)
    skyTop: '#050318', skyBot: '#0e0b30',
    roadMid: '#0d1228', roadBot: '#0a1428',
    horizonGlow: 'rgba(90,55,210,0.35)',
    sideWall:   '#080814', sideBlock: '#100e24',
    winColor:   'rgba(255,145,30,0.78)',
    edgeAccent: 'rgba(70,45,200,0.22)',
    centerTint: 'rgba(35,25,90,0.08)',
    floorEdge:  'rgba(0,0,0,0.38)',
  },
  { // Stage 2: Industrial Port (cyan windows, teal glow)
    skyTop: '#020d12', skyBot: '#081618',
    roadMid: '#0c1c22', roadBot: '#0a1c22',
    horizonGlow: 'rgba(0,170,148,0.30)',
    sideWall:   '#060f10', sideBlock: '#0d1e1e',
    winColor:   'rgba(30,230,185,0.72)',
    edgeAccent: 'rgba(0,190,150,0.20)',
    centerTint: 'rgba(0,55,48,0.08)',
    floorEdge:  'rgba(0,0,0,0.32)',
  },
  { // Stage 3: Speed Zone (electric-blue windows, violet glow)
    skyTop: '#020008', skyBot: '#090012',
    roadMid: '#0a0020', roadBot: '#080018',
    horizonGlow: 'rgba(130,0,255,0.40)',
    sideWall:   '#06000e', sideBlock: '#130032',
    winColor:   'rgba(0,210,255,0.88)',
    edgeAccent: 'rgba(100,0,255,0.25)',
    centerTint: 'rgba(45,0,110,0.10)',
    floorEdge:  'rgba(0,0,0,0.28)',
  },
];

const bgGradCache = [];   // rebuilt by buildBGCache() on every resize

const WIN_POSITIONS = [   // [x_frac, y_frac] inside the building silhouette
  [[0.14,0.32],[0.44,0.38],[0.24,0.55],[0.56,0.20],[0.36,0.66]],
  [[0.18,0.28],[0.50,0.44],[0.30,0.60],[0.62,0.18],[0.10,0.52]],
  [[0.12,0.30],[0.42,0.46],[0.22,0.62],[0.60,0.22],[0.38,0.38]],
];

const STAGE_FADE_DURATION = 0.6;

function buildBGCache() {
  bgGradCache.length = 0;
  for (const p of STAGE_PALETTES) {
    const hy = horizonY;
    const fw = W * 0.14;

    const sg = ctx.createLinearGradient(0, 0, 0, hy);
    sg.addColorStop(0, p.skyTop);
    sg.addColorStop(1, p.skyBot);          // same as road start → no seam

    const rg = ctx.createLinearGradient(0, hy, 0, H);
    rg.addColorStop(0.0, p.skyBot);        // continues smoothly from sky
    rg.addColorStop(0.3, p.roadMid);
    rg.addColorStop(1.0, p.roadBot);

    const hg = ctx.createLinearGradient(0, hy - H * 0.06, 0, hy + H * 0.08);
    hg.addColorStop(0,   'rgba(0,0,0,0)');
    hg.addColorStop(0.5, p.horizonGlow);
    hg.addColorStop(1,   'rgba(0,0,0,0)');

    const agL = ctx.createLinearGradient(0, 0, fw * 1.6, 0);
    agL.addColorStop(0, p.edgeAccent);
    agL.addColorStop(1, 'rgba(0,0,0,0)');

    const agR = ctx.createLinearGradient(W, 0, W - fw * 1.6, 0);
    agR.addColorStop(0, p.edgeAccent);
    agR.addColorStop(1, 'rgba(0,0,0,0)');

    const cg = ctx.createLinearGradient(W * 0.28, 0, W * 0.72, 0);
    cg.addColorStop(0,   'rgba(0,0,0,0)');
    cg.addColorStop(0.5, p.centerTint);
    cg.addColorStop(1,   'rgba(0,0,0,0)');

    bgGradCache.push({ sg, rg, hg, agL, agR, cg });
  }
}

function drawProcBackground(stageIdx, alpha) {
  if (alpha < 1) ctx.globalAlpha = alpha;

  const p  = STAGE_PALETTES[stageIdx];
  const gc = bgGradCache[stageIdx];
  const hy = horizonY;
  const sw = W * 0.20;   // side building block width
  const fw = W * 0.14;   // floor-edge darkening width
  const ww = W * 0.026;  // window cell width
  const wh = H * 0.022;  // window cell height

  // Sky
  ctx.fillStyle = gc.sg;
  ctx.fillRect(0, 0, W, hy);

  // Side building silhouettes — three stacked blocks of different widths.
  ctx.fillStyle = p.sideWall;
  ctx.fillRect(0, H * 0.06, sw, hy - H * 0.06);
  ctx.fillStyle = p.sideBlock;
  ctx.fillRect(0, H * 0.13, sw * 0.62, hy - H * 0.13);
  ctx.fillStyle = p.sideWall;
  ctx.fillRect(0, H * 0.01, sw * 0.26, hy - H * 0.01);   // tower

  ctx.fillStyle = p.sideWall;
  ctx.fillRect(W - sw, H * 0.06, sw, hy - H * 0.06);
  ctx.fillStyle = p.sideBlock;
  ctx.fillRect(W - sw * 0.62, H * 0.13, sw * 0.62, hy - H * 0.13);
  ctx.fillStyle = p.sideWall;
  ctx.fillRect(W - sw * 0.26, H * 0.01, sw * 0.26, hy - H * 0.01);

  // Windows
  const wins = WIN_POSITIONS[stageIdx];
  const bt = H * 0.13, bh = hy - H * 0.13, bw = sw * 0.62;
  ctx.fillStyle = p.winColor;
  for (const [fx, fy] of wins) {
    const ly = bt + fy * bh;
    ctx.fillRect(fx * bw,            ly, ww, wh);
    ctx.fillRect(W - bw + fx * bw,   ly, ww, wh);
  }

  // Horizon glow (blends sky ↔ road)
  ctx.fillStyle = gc.hg;
  ctx.fillRect(0, hy - H * 0.06, W, H * 0.14);

  // Road surface — perspective trapezoid (narrow at horizon, full-width at bottom).
  ctx.fillStyle = gc.rg;
  ctx.beginPath();
  ctx.moveTo(vanishX,  hy);
  ctx.lineTo(W + 10,   H + 10);
  ctx.lineTo(-10,      H + 10);
  ctx.closePath();
  ctx.fill();

  // Dark strips on the road edges → centre lane reads as clean and open.
  ctx.fillStyle = p.floorEdge;
  ctx.fillRect(0,      hy, fw, H - hy);
  ctx.fillRect(W - fw, hy, fw, H - hy);

  // Stage-coloured edge accent glow
  ctx.fillStyle = gc.agL;
  ctx.fillRect(0,            hy, fw * 1.6, H - hy);
  ctx.fillStyle = gc.agR;
  ctx.fillRect(W - fw * 1.6, hy, fw * 1.6, H - hy);

  // Subtle centre-path tint keeps the middle lane calm and readable
  ctx.fillStyle = gc.cg;
  ctx.fillRect(0, hy, W, H - hy);

  if (alpha < 1) ctx.globalAlpha = 1;
}

// ─── Stage state ─────────────────────────────────────────────────────────────
let stageCurrent  = 0;
let stageFadeFrom = -1;
let stageFadeT    = 1;
let transitionTimer   = 0;
let transitionToStage = 0;

// ─── Debug ───────────────────────────────────────────────────────────────────
let debugMode = false;   // press D to toggle

// ─── Game state ──────────────────────────────────────────────────────────────
let state;        // 'playing' | 'paused' | 'stageTransition' | 'gameOver'
let score;
let hiScore = 0;
let zSpeed;       // z-units per second (replaces old px/sec speed)
let spawnTimer;
let obstacles;
let trackMarkers; // [{z}] — perspective ground stripes
let lanePhase = 0;  // drives animated lane-divider dash offset
let player;
let animId  = null;
let gameTime = 0;

// Object pool — avoids GC pressure from frequent spawn / despawn.
const obstaclePool = [];
function acquireObs() { return obstaclePool.length > 0 ? obstaclePool.pop() : {}; }
function releaseObs(o) { obstaclePool.push(o); }

// ─── Player ──────────────────────────────────────────────────────────────────
const PLAYER_HEIGHT_RATIO   = 0.13;   // 30% smaller than the previous 0.18
const PLAYER_HITBOX_W_RATIO = 0.55;
const PLAYER_HITBOX_H_RATIO = 0.78;
const SLIDE_DURATION        = 0.4;
const LANE_SWITCH_DURATION  = 0.14;

function makePlayer() {
  const ph = H * PLAYER_HEIGHT_RATIO;
  const img = assets.player;
  const aspect = (img && img.naturalWidth > 0) ? (img.naturalWidth / img.naturalHeight) : 0.6;
  return {
    lane: 1, targetLane: 1,
    x: laneX[1], y: playerGroundY,
    groundY: playerGroundY,
    w: ph * aspect, h: ph,
    jumping: false, jumpT: 0,
    jumpCooldownT: 0, landingGraceT: 0,
    jumpPeak: H * JUMP_HEIGHT_RATIO,
    sliding: false, slideT: 0,
    switching: false, switchT: 0,
    switchFrom: laneX[1], switchTo: laneX[1],
  };
}

// ─── Obstacles ───────────────────────────────────────────────────────────────
const OBSTACLE_TYPES       = ['barrier', 'crate'];
const OBSTACLE_BASE_H_RATIO = 0.11;   // natural height at perspective scale=1
const OBSTACLE_HITBOX_RATIO = 0.82;   // shrink hitbox for fairness

function spawnObstacle() {
  // Enforce minimum gap: the most-recently-spawned obstacle (highest z) must
  // have moved at least OBSTACLE_MIN_GAP_Z below the spawn point.
  if (obstacles.length > 0) {
    let maxZ = -Infinity;
    for (const o of obstacles) if (o.z > maxZ) maxZ = o.z;
    if (maxZ > OBSTACLE_SPAWN_Z - OBSTACLE_MIN_GAP_Z) return;
  }

  const lane  = Math.floor(Math.random() * LANE_COUNT);
  const type  = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
  const isLow = Math.random() < 0.3;

  const baseH = H * OBSTACLE_BASE_H_RATIO * (isLow ? 0.6 : 1.0);
  const img   = assets[type];
  const aspect = (img && img.naturalWidth > 0) ? (img.naturalWidth / img.naturalHeight) : 1.0;
  const baseW = baseH * aspect;

  const obs = acquireObs();
  obs.lane    = lane;
  obs.z       = OBSTACLE_SPAWN_Z;
  obs.type    = type;
  obs.baseH   = baseH;
  obs.baseW   = baseW;
  obs.isLow   = isLow;
  obs.jumpable = true;
  obstacles.push(obs);

  if (debugMode) console.log(`spawn lane=${lane} type=${type} z=${obs.z.toFixed(2)}`);
}

// ─── Track markers ───────────────────────────────────────────────────────────
// Horizontal stripes at Z depths — they rush toward the player to give the
// "ground coming at you" feel without scrolling the background at all.
const TRACK_MARKER_COUNT = 10;

function makeTrackMarkers() {
  const m = [];
  for (let i = 0; i < TRACK_MARKER_COUNT; i++) {
    m.push({ z: (i / TRACK_MARKER_COUNT) * OBSTACLE_SPAWN_Z });
  }
  return m;
}

// ─── Stage helpers ───────────────────────────────────────────────────────────
function pickStageForScore(s) {
  let stage = 0;
  for (let i = 0; i < STAGE_THRESHOLDS.length; i++) {
    if (s >= STAGE_THRESHOLDS[i]) stage = i;
  }
  return stage;
}

function beginStageTransition(newStage) {
  state = 'stageTransition';
  transitionToStage = newStage;
  transitionTimer   = TRANSITION_DURATION;
  for (const o of obstacles) releaseObs(o);
  obstacles.length = 0;

  const p = player;
  p.lane = p.targetLane = 1;
  p.x = p.switchFrom = p.switchTo = laneX[1];
  p.switching = false; p.switchT = 0;
  p.jumping   = false; p.jumpT   = 0;
  p.jumpCooldownT = 0; p.landingGraceT = 0;
  p.sliding = false;   p.slideT = 0;
  p.y = p.groundY;

  stageFadeFrom = stageCurrent;
  stageCurrent  = newStage;
  stageFadeT    = 0;
}

function updateTransition(dt) {
  if (stageFadeT < 1) stageFadeT = Math.min(1, stageFadeT + dt / STAGE_FADE_DURATION);
  transitionTimer -= dt;
  if (transitionTimer <= 0) { state = 'playing'; spawnTimer = 1.0; }
}

// ─── Reset / start ───────────────────────────────────────────────────────────
function resetGame() {
  resize();
  score     = 0;
  gameTime  = 0;
  zSpeed    = INITIAL_Z_SPEED;
  spawnTimer = 1.0;
  lanePhase  = 0;
  if (obstacles) for (const o of obstacles) releaseObs(o);
  obstacles    = [];
  trackMarkers = makeTrackMarkers();
  player = makePlayer();
  stageCurrent  = 0;
  stageFadeFrom = -1;
  stageFadeT    = 1;
  transitionTimer   = 0;
  transitionToStage = 0;
  lastTime = null;
  state = 'playing';
  overlay.classList.add('hidden');
  if (pauseBtn) { pauseBtn.innerHTML = '&#10074;&#10074;'; pauseBtn.style.display = ''; }
}

function startGame() {
  if (animId !== null) { cancelAnimationFrame(animId); animId = null; }
  animId = requestAnimationFrame(loop);
}

// ─── Input ───────────────────────────────────────────────────────────────────
function moveLeft()  { tryChangeLane(-1); }
function moveRight() { tryChangeLane(+1); }
function doJump()    { tryJump();  }
function doSlide()   { trySlide(); }

function tryChangeLane(dir) {
  if (state !== 'playing') return;
  const next = player.targetLane + dir;
  if (next < 0 || next >= LANE_COUNT) return;
  player.targetLane = next;
  player.switching  = true;
  player.switchT    = 0;
  player.switchFrom = player.x;
  player.switchTo   = laneX[next];
}

function tryJump() {
  if (state !== 'playing') return;
  if (player.jumping || player.jumpCooldownT > 0) return;
  player.jumping       = true;
  player.jumpT         = 0;
  player.jumpCooldownT = JUMP_COOLDOWN;
  player.landingGraceT = 0;
  player.sliding = false;
}

function trySlide() {
  if (state !== 'playing') return;
  if (player.jumping) return;
  player.sliding = true;
  player.slideT  = 0;
}

document.addEventListener('keydown', e => {
  switch (e.key) {
    case 'ArrowLeft':  e.preventDefault(); moveLeft();  break;
    case 'ArrowRight': e.preventDefault(); moveRight(); break;
    case 'ArrowUp':    e.preventDefault(); doJump();    break;
    case 'ArrowDown':  e.preventDefault(); doSlide();   break;
    case ' ': case 'Spacebar': e.preventDefault(); doJump(); break;
    case 'p': case 'P': case 'Escape': e.preventDefault(); togglePause(); break;
    case 'd': case 'D': debugMode = !debugMode; break;
  }
});

document.getElementById('btn-left').addEventListener('click', moveLeft);
document.getElementById('btn-right').addEventListener('click', moveRight);
document.getElementById('btn-up').addEventListener('click', doJump);
document.getElementById('btn-down').addEventListener('click', doSlide);
const jumpBtnEl = document.getElementById('btn-jump');
if (jumpBtnEl) jumpBtnEl.addEventListener('click', doJump);

let touchStartX = 0, touchStartY = 0;
canvas.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });
canvas.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 20) moveRight(); else if (dx < -20) moveLeft();
  } else {
    if (dy < -20) doJump(); else if (dy > 20) doSlide();
  }
}, { passive: true });

restartBtn.addEventListener('click', () => { resetGame(); startGame(); });

// ─── Pause ───────────────────────────────────────────────────────────────────
function togglePause() {
  if (state === 'playing') {
    state = 'paused';
    if (pauseBtn) pauseBtn.innerHTML = '&#9654;';
  } else if (state === 'paused') {
    state = 'playing';
    lastTime = null;  // re-seed dt on resume to prevent time jump
    if (pauseBtn) pauseBtn.innerHTML = '&#10074;&#10074;';
  }
}
if (pauseBtn) pauseBtn.addEventListener('click', togglePause);

// ─── Update ──────────────────────────────────────────────────────────────────
function update(dt) {
  if (state !== 'playing') return;

  score    += dt * 10;
  gameTime += dt;

  // Stage threshold
  const targetStage = pickStageForScore(score);
  if (targetStage !== stageCurrent) { beginStageTransition(targetStage); return; }

  // Speed ramp
  const diff    = STAGE_DIFFICULTY[stageCurrent];
  const baseZ   = Math.min(INITIAL_Z_SPEED + (score / 100) * Z_INCREASE_RATE, MAX_Z_SPEED);
  zSpeed = baseZ * diff.zSpeedMul;

  // Spawn
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnObstacle();
    const base = Math.max(OBSTACLE_MIN_INTERVAL,
                          OBSTACLE_BASE_INTERVAL - score / OBSTACLE_INTERVAL_DECAY);
    spawnTimer = base * diff.intervalMul * (0.85 + Math.random() * 0.30);
  }

  // Timers
  if (player.jumpCooldownT > 0) player.jumpCooldownT = Math.max(0, player.jumpCooldownT - dt);
  if (player.landingGraceT > 0) player.landingGraceT = Math.max(0, player.landingGraceT - dt);

  // Move obstacles toward player (z decreases toward 0)
  for (const obs of obstacles) obs.z -= zSpeed * dt;

  // Despawn obstacles that have passed the player
  let w = 0;
  for (let i = 0; i < obstacles.length; i++) {
    if (obstacles[i].z > -0.15) { obstacles[w++] = obstacles[i]; }
    else                         { releaseObs(obstacles[i]); }
  }
  obstacles.length = w;

  // Lane switch
  const p = player;
  if (p.switching) {
    p.switchT += dt / LANE_SWITCH_DURATION;
    if (p.switchT >= 1) { p.switchT = 1; p.switching = false; p.lane = p.targetLane; }
    p.x = lerp(p.switchFrom, p.switchTo, easeOut(p.switchT));
  } else {
    p.x = laneX[p.lane];
  }

  // Jump arc (sine curve — natural rise and fall)
  if (p.jumping) {
    p.jumpT += dt / JUMP_DURATION;
    if (p.jumpT >= 1) {
      p.jumpT = 1; p.jumping = false;
      p.landingGraceT = JUMP_LAND_GRACE;   // brief immune window on land
    }
    p.y = p.groundY - Math.sin(p.jumpT * Math.PI) * p.jumpPeak;
  } else {
    p.y = p.groundY;
  }

  // Slide
  if (p.sliding) {
    p.slideT += dt / SLIDE_DURATION;
    if (p.slideT >= 1) p.sliding = false;
  }

  // Track markers move toward player in Z space (wraps around)
  for (const m of trackMarkers) {
    m.z -= zSpeed * dt;
    if (m.z < 0) m.z += OBSTACLE_SPAWN_Z;
  }

  // Animated lane-divider dash phase
  lanePhase = (lanePhase + zSpeed * H * 0.45 * dt) % 100;

  checkCollisions();
}

function checkCollisions() {
  const p      = player;
  const sliding = p.sliding && p.slideT < 1;
  const immune  = p.jumping || p.landingGraceT > 0;

  // Player hitbox in screen space (feet-anchored)
  const ph   = p.h * PLAYER_HITBOX_H_RATIO * (sliding ? 0.5 : 1);
  const pw   = p.w * PLAYER_HITBOX_W_RATIO;
  const pBot = p.y;
  const pTop = pBot - ph;
  const pL   = p.x - pw / 2;
  const pR   = p.x + pw / 2;

  for (const obs of obstacles) {
    if (obs.z < -0.05 || obs.z > COLLISION_Z) continue;  // far away → skip
    if (immune && obs.jumpable) continue;

    const { x: ox, y: oy, scale } = worldToScreen(obs.lane, obs.z);
    const hs = scale * OBSTACLE_HITBOX_RATIO;
    const oh = obs.baseH * hs;
    const ow = obs.baseW * hs;
    const oL   = ox - ow / 2;
    const oR   = ox + ow / 2;
    const oTop = oy - oh;
    const oBot = oy;

    if (pL < oR && pR > oL && pTop < oBot && pBot > oTop) {
      gameOver();
      return;
    }
  }
}

function gameOver() {
  if (state === 'gameOver') return;
  state = 'gameOver';
  if (pauseBtn) pauseBtn.style.display = 'none';
  const s = Math.floor(score);
  if (s > hiScore) hiScore = s;
  overlayTitle.textContent = 'GAME OVER';
  overlayScore.textContent = `Score: ${s}   Best: ${hiScore}`;
  overlay.classList.remove('hidden');
  if (animId !== null) { cancelAnimationFrame(animId); animId = null; }
}

// ─── Draw ────────────────────────────────────────────────────────────────────
function draw() {
  ctx.clearRect(0, 0, W, H);
  drawBackground();
  drawPerspectiveLanes();
  drawTrackStripes();
  drawObstacles();
  drawPlayer();
  drawHUD();
  if (state === 'stageTransition') drawTransitionOverlay();
  if (state === 'paused')          drawPauseOverlay();
}

function drawBackground() {
  if (stageFadeT < 1 && stageFadeFrom >= 0) {
    drawProcBackground(stageFadeFrom, 1);
    drawProcBackground(stageCurrent,  stageFadeT);
  } else {
    drawProcBackground(stageCurrent, 1);
  }
  // Very light wash so HUD and obstacles stay readable over any palette.
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.fillRect(0, 0, W, H);
}

function drawPerspectiveLanes() {
  // Perspective lines radiate from the vanishing point to the screen bottom.
  // These are STATIC — only the dash pattern animates.

  // Outer road edges (solid)
  ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i <= LANE_COUNT; i++) {
    const bx = (i / LANE_COUNT) * W;
    ctx.beginPath();
    ctx.moveTo(vanishX, horizonY);
    ctx.lineTo(bx, H);
    ctx.stroke();
  }

  // Inner lane dividers (animated dashes — they appear to flow toward the player)
  ctx.setLineDash([14, 20]);
  ctx.lineDashOffset = -lanePhase;
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 1.5;
  for (let i = 1; i < LANE_COUNT; i++) {
    const bx = (i / LANE_COUNT) * W;
    ctx.beginPath();
    ctx.moveTo(vanishX, horizonY);
    ctx.lineTo(bx, H);
    ctx.stroke();
  }

  ctx.setLineDash([]);
  ctx.lineDashOffset = 0;
}

function drawTrackStripes() {
  // Horizontal stripes at each marker's Z depth give the "ground rushing toward you" feel.
  // Width narrows correctly with perspective (wider at bottom, narrower at top).
  for (const m of trackMarkers) {
    if (m.z <= 0.02 || m.z >= 0.96) continue;
    const t     = m.z;
    const sy    = lerp(playerGroundY, horizonY, t);
    const lx    = lerp(0, vanishX, t);
    const rx    = lerp(W, vanishX, t);
    const alpha = Math.max(0, (0.72 - t) * 0.26);
    if (alpha < 0.01) continue;
    ctx.strokeStyle = `rgba(160,210,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(lx, sy);
    ctx.lineTo(rx, sy);
    ctx.stroke();
  }
}

function drawObstacles() {
  // Paint far obstacles first (higher z = further away).
  // Insertion sort is fast for the small, nearly-sorted list we keep.
  for (let i = 1; i < obstacles.length; i++) {
    const cur = obstacles[i]; let j = i - 1;
    while (j >= 0 && obstacles[j].z < cur.z) { obstacles[j + 1] = obstacles[j]; j--; }
    obstacles[j + 1] = cur;
  }

  for (const obs of obstacles) {
    if (obs.z < -0.05 || obs.z > 1.01) continue;

    const { x: sx, y: sy, scale } = worldToScreen(obs.lane, obs.z);
    const dw = obs.baseW * scale;
    const dh = obs.baseH * scale;
    const dx = sx - dw / 2;
    const dy = sy - dh;

    // Ground shadow — fades toward the horizon
    if (sy > horizonY + 4) {
      const sAlpha = Math.max(0, (1 - obs.z * 1.2) * 0.38);
      ctx.fillStyle = `rgba(0,0,0,${sAlpha.toFixed(2)})`;
      ctx.beginPath();
      ctx.ellipse(sx, sy + 2, dw * 0.44, dh * 0.09, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const img = assets[obs.type];
    if (img) {
      ctx.drawImage(img, dx, dy, dw, dh);
    } else {
      ctx.fillStyle = obs.type === 'crate' ? '#c98a3a' : '#c0392b';
      ctx.beginPath();
      roundRect(ctx, dx, dy, dw, dh, 4);
      ctx.fill();
    }

    if (debugMode) {
      const hs = scale * OBSTACLE_HITBOX_RATIO;
      const hh = obs.baseH * hs, hw = obs.baseW * hs;
      // Red = in collision zone, yellow = outside
      ctx.strokeStyle = obs.z < COLLISION_Z ? 'rgba(255,60,60,0.9)' : 'rgba(255,220,0,0.5)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.strokeRect(sx - hw / 2, sy - hh, hw, hh);
      ctx.fillStyle = '#ff9';
      ctx.font = `${Math.round(H * 0.022)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(obs.z.toFixed(2), sx, dy - 3);
    }
  }
}

function drawPlayer() {
  const p       = player;
  const sliding = p.sliding && p.slideT < 1;

  const drawH = sliding ? p.h * 0.55 : p.h;
  const drawW = sliding ? p.w * 1.1  : p.w;

  // Running bob (only when grounded)
  const bob = (!p.jumping && !sliding) ? Math.sin(gameTime * BOB_FREQ) * H * BOB_AMP : 0;

  const dx = p.x - drawW / 2;
  const dy = p.y - drawH + bob;

  // Ground shadow shrinks and fades while player is airborne
  const heightAbove = p.groundY - p.y;
  const jumpFactor  = Math.max(0, Math.min(1, heightAbove / p.jumpPeak));
  const shAlpha     = 0.38 * (1 - jumpFactor * 0.7);
  const shScale     = 1   - jumpFactor * 0.35;
  ctx.fillStyle = `rgba(0,0,0,${shAlpha.toFixed(2)})`;
  ctx.beginPath();
  ctx.ellipse(p.x, p.groundY + 2, p.w * 0.42 * shScale, p.h * 0.07 * shScale, 0, 0, Math.PI * 2);
  ctx.fill();

  const img = assets.player;
  if (img) {
    ctx.drawImage(img, dx, dy, drawW, drawH);
  } else {
    ctx.fillStyle = '#2ed573';
    ctx.beginPath();
    roundRect(ctx, dx, dy, drawW, drawH, 8);
    ctx.fill();
  }

  if (debugMode) {
    const ph = p.h * PLAYER_HITBOX_H_RATIO * (sliding ? 0.5 : 1);
    const pw = p.w * PLAYER_HITBOX_W_RATIO;
    ctx.strokeStyle = 'rgba(60,255,60,0.9)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    ctx.strokeRect(p.x - pw / 2, p.y - ph, pw, ph);
    if (p.landingGraceT > 0) {
      ctx.strokeStyle = 'rgba(0,200,255,0.85)';
      ctx.strokeRect(p.x - pw / 2 - 3, p.y - ph - 3, pw + 6, ph + 6);
    }
  }
}

function drawHUD() {
  const s = Math.floor(score);
  ctx.fillStyle = 'rgba(0,0,0,0.40)';
  ctx.fillRect(0, 0, W, H * 0.072);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(H * 0.038)}px Arial Black, Arial`;
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${s}`, W * 0.04, H * 0.052);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffd700';
  ctx.fillText(`Best: ${hiScore}`, W * 0.96, H * 0.052);

  if (debugMode) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ff9999';
    ctx.font = `bold ${Math.round(H * 0.024)}px monospace`;
    ctx.fillText(
      `[D] stage:${stageCurrent + 1}  obs:${obstacles.length}  z-spd:${zSpeed.toFixed(2)}  pool:${obstaclePool.length}`,
      W * 0.04, H * 0.092
    );
  }
}

function drawPauseOverlay() {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(H * 0.09)}px Arial Black, Arial`;
  ctx.fillText('PAUSED', W / 2, H / 2 - H * 0.02);
  ctx.font = `bold ${Math.round(H * 0.03)}px Arial Black, Arial`;
  ctx.fillStyle = '#ffd700';
  ctx.fillText('Tap pause again to resume', W / 2, H / 2 + H * 0.05);
  ctx.textAlign = 'left';
}

function drawTransitionOverlay() {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, W, H);
  const cx = W / 2, cy = H / 2;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd700';
  ctx.font = `bold ${Math.round(H * 0.07)}px Arial Black, Arial`;
  ctx.fillText(`Stage ${transitionToStage + 1}`, cx, cy - H * 0.10);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(H * 0.038)}px Arial Black, Arial`;
  ctx.fillText('Get Ready', cx, cy - H * 0.04);

  const r = transitionTimer;
  const label  = r > 2.0 ? '3' : r > 1.0 ? '2' : r > 0.4 ? '1' : 'GO!';
  const phaseT = label === 'GO!' ? (0.4 - r) / 0.4 : 1 - (r % 1);
  const pulse  = 1 + Math.max(0, Math.min(1, phaseT)) * 0.25;
  ctx.fillStyle = label === 'GO!' ? '#2ed573' : '#ffffff';
  ctx.font = `bold ${Math.round(H * 0.13 * pulse)}px Arial Black, Arial`;
  ctx.fillText(label, cx, cy + H * 0.10);
  ctx.textAlign = 'left';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function lerp(a, b, t) { return a + (b - a) * t; }
function easeOut(t)    { return 1 - (1 - t) * (1 - t); }

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y,     x + w, y + r,     r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x,     y + h, x,     y + h - r, r);
  ctx.lineTo(x,     y + r);
  ctx.arcTo(x,     y,     x + r, y,         r);
  ctx.closePath();
}

// ─── Game loop ───────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  if (state === 'gameOver') { animId = null; return; }
  if (lastTime === null) lastTime = ts;
  const dt = Math.min((ts - lastTime) / 1000, 0.05);   // cap at 50 ms
  lastTime = ts;

  if      (state === 'playing')         update(dt);
  else if (state === 'stageTransition') updateTransition(dt);
  // 'paused' → skip update entirely; everything freezes.

  draw();
  animId = requestAnimationFrame(loop);
}

// ─── Window resize ───────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  if (state === 'playing' && player) {
    resize();
    const ph  = H * PLAYER_HEIGHT_RATIO;
    const img = assets.player;
    const aspect = (img && img.naturalWidth > 0) ? (img.naturalWidth / img.naturalHeight) : 0.6;
    player.w        = ph * aspect;
    player.h        = ph;
    player.groundY  = playerGroundY;
    player.y        = player.groundY;
    player.jumpPeak = H * JUMP_HEIGHT_RATIO;
    for (let i = 0; i < LANE_COUNT; i++) laneX[i] = laneW * (i + 0.5);
    player.x = player.switchFrom = player.switchTo = laneX[player.lane];
  }
});

// ─── Start ───────────────────────────────────────────────────────────────────
function showLoadingScreen() {
  resize();
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.round(H * 0.04)}px Arial Black, Arial`;
  ctx.textAlign = 'center';
  ctx.fillText('Loading…', W / 2, H / 2);
}

showLoadingScreen();
loadAssets().then(() => {
  assetsReady = true;
  resetGame();
  startGame();
});
