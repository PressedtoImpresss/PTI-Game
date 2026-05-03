const STORAGE_PREFIX = "pti-tunnel-flight";
const SHARED_LEADERBOARD_KEY = "pti-slingshot:leaderboard";
const ACTIVE_GAME_TYPE = "delivery-dash";
const ACTIVE_GAME_NAME = "Delivery Dash";
const APPS_SCRIPT_URL = "";
const SHEETS_URL = "https://script.google.com/macros/s/AKfycbwBBaFdetFrzqHDl9T6wJAEsaSihyQF5eXCCc1iwy8Fk2OVEV-Y5HQ1ZuB-HPdQRm1j/exec";

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const scoreValue = document.getElementById("score-value");
const lifeValue = document.getElementById("life-value");
const bestValue = document.getElementById("best-value");
const missilesValue = document.getElementById("missiles-value");
const startOverlay = document.getElementById("start-overlay");
const gameOverOverlay = document.getElementById("game-over-overlay");
const levelGateOverlay = document.getElementById("level-gate-overlay");
const startButton = document.getElementById("start-button");
const restartButton = document.getElementById("restart-button");
const gateButton = document.getElementById("gate-button");
const scoreForm = document.getElementById("score-form");
const playerNameInput = document.getElementById("player-name");
const playerEmailInput = document.getElementById("player-email");
const finalScoreHeading = document.getElementById("final-score-heading");
const resultMessage = document.getElementById("result-message");
const leaderboardBody = document.getElementById("leaderboard-body");
const pauseBtn = document.getElementById("pause-btn");
const fireBtn = document.getElementById("cave-fire-btn");

const W = canvas.width;
const H = canvas.height;
const CENTER_X = W / 2;
const CENTER_Y = H * 0.46;
const FOCAL = 410;
const FAR_Z = 1550;
const TUNNEL_RX = 185;
const TUNNEL_RY = 255;

const LEVELS = [
  { id: 1, name: "Level 1: Tunnel Run", next: "Level 2: Shop Floor", target: 900, speed: 330, spawn: 1.15, color: "#4dd9ff" },
  { id: 2, name: "Level 2: Shop Floor", next: "Rush Order", target: 1450, speed: 390, spawn: 0.98, color: "#ff9f43" },
  { id: 3, name: "Rush Order", next: "Deadline Crunch", target: 1900, speed: 440, spawn: 0.86, color: "#ffd84d" },
  { id: 4, name: "Deadline Crunch", next: "Night Shift", target: 2600, speed: 500, spawn: 0.72, color: "#ff4b5f" },
  { id: 5, name: "Night Shift", next: "Double Shift", target: 3600, speed: 560, spawn: 0.62, color: "#a29bfe" },
  { id: 6, name: "Double Shift", next: "The Final Press", target: 5000, speed: 620, spawn: 0.54, color: "#fd9644" },
  { id: 7, name: "The Final Press", next: "Graveyard Shift", target: 7000, speed: 680, spawn: 0.48, color: "#ff2255" },
  { id: 8, name: "Graveyard Shift", next: "Midnight Run", target: 9000, speed: 735, spawn: 0.43, color: "#00e5ff" },
  { id: 9, name: "Midnight Run", next: "Legendary Print", target: 11000, speed: 790, spawn: 0.38, color: "#bf5fff" },
  { id: 10, name: "Legendary Print", next: null, target: 14000, speed: 850, spawn: 0.34, color: "#ffd700" },
];

const C = {
  bg0: "#030613",
  bg1: "#091a37",
  cyan: "#4dd9ff",
  magenta: "#ff3df2",
  gold: "#ffd84d",
  red: "#ff4b5f",
  text: "#ffffff",
};

const state = {
  status: "idle",
  levelIndex: 0,
  score: 0,
  totalScore: 0,
  finalTotal: 0,
  best: loadBestScore(),
  lives: 3,
  missiles: 3,
  distance: 0,
  levelDistance: 0,
  spawnTimer: 0,
  paused: false,
  justSubmitted: false,
  hitFlash: 0,
  shake: 0,
  allComplete: false,
};

const player = {
  x: 0,
  y: 45,
  tx: 0,
  ty: 45,
  vx: 0,
  vy: 0,
  tilt: 0,
  thrusting: false,
};

const entities = [];
const shots = [];
const particles = [];
const keys = {};
let pointerActive = false;
let lastFrame = performance.now();

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function currentLevel() {
  return LEVELS[state.levelIndex];
}

function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekKey() {
  return `${STORAGE_PREFIX}:${getWeekStart().toISOString().slice(0, 10)}`;
}

function loadBestScore() {
  return Number(localStorage.getItem(`${STORAGE_PREFIX}:best`) || 0);
}

function saveBestScore(score) {
  localStorage.setItem(`${STORAGE_PREFIX}:best`, String(score));
}

function loadWeeklyScores() {
  try {
    return JSON.parse(localStorage.getItem(SHARED_LEADERBOARD_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveWeeklyScores(entries) {
  localStorage.setItem(SHARED_LEADERBOARD_KEY, JSON.stringify(entries.slice(0, 20)));
}

function project(x, y, z) {
  const scale = FOCAL / (FOCAL + z);
  return {
    x: CENTER_X + (x - player.x * 0.34) * scale,
    y: CENTER_Y + (y - player.y * 0.28) * scale,
    s: scale,
  };
}

function screenToTunnel(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const sx = (clientX - rect.left) * (W / rect.width);
  const sy = (clientY - rect.top) * (H / rect.height);
  return {
    x: clamp((sx - CENTER_X) * 0.78, -112, 112),
    y: clamp((sy - H * 0.62) * 0.72, -150, 155),
  };
}

function resetRun(fullReset = true) {
  entities.length = 0;
  shots.length = 0;
  particles.length = 0;
  player.x = 0;
  player.y = 45;
  player.tx = 0;
  player.ty = 45;
  player.vx = 0;
  player.vy = 0;
  player.tilt = 0;
  player.thrusting = false;
  state.status = "idle";
  state.score = 0;
  state.distance = 0;
  state.levelDistance = 0;
  state.spawnTimer = 0.5;
  state.paused = false;
  state.justSubmitted = false;
  state.hitFlash = 0;
  state.shake = 0;
  state.allComplete = false;
  if (fullReset) {
    state.levelIndex = 0;
    state.totalScore = 0;
    state.lives = 3;
    state.missiles = 3;
  }
  updateHud();
}

function startGame() {
  resetRun(true);
  state.status = "running";
  startOverlay.classList.add("hidden");
  gameOverOverlay.classList.add("hidden");
  levelGateOverlay.classList.add("hidden");
}

function updateHud() {
  scoreValue.textContent = String(Math.floor(state.totalScore + state.score));
  lifeValue.textContent = String(state.lives);
  bestValue.textContent = String(state.best);
  missilesValue.textContent = String(state.missiles);
  const active = state.status === "running";
  pauseBtn.classList.toggle("hidden", !active);
  pauseBtn.textContent = state.paused ? "▶" : "⏸";
  fireBtn.classList.toggle("hidden", !active);
  fireBtn.textContent = state.missiles > 0 ? "FIRE" : "- FIRE";
  fireBtn.style.opacity = state.missiles > 0 ? "1" : "0.42";
}

function spawnEntity() {
  const level = currentLevel();
  const roll = Math.random();
  let type = "plane";
  if (roll < 0.28) type = "ring";
  else if (roll < 0.43) type = "drone";
  else if (roll < 0.59) type = "mine";
  else if (roll < 0.74) type = "cargo";
  else if (roll < 0.91) type = "plane";
  else type = Math.random() < 0.55 ? "missile" : "heart";

  if (state.levelIndex >= 4 && Math.random() < 0.18) type = "wall";

  const radius = type === "ring" ? rand(40, 52) : type === "wall" ? rand(70, 94) : rand(22, 36);
  entities.push({
    type,
    x: rand(-TUNNEL_RX * 0.72, TUNNEL_RX * 0.72),
    y: rand(-TUNNEL_RY * 0.58, TUNNEL_RY * 0.62),
    z: FAR_Z,
    radius,
    spin: rand(0, Math.PI * 2),
    rot: rand(-1, 1),
    color: level.color,
    hit: false,
  });
}

function fireMissile() {
  if (state.status !== "running" || state.paused || state.missiles <= 0) return;
  state.missiles -= 1;
  shots.push({ x: player.x, y: player.y, z: 60, speed: 1060, life: 1.2 });
  spawnParticles(player.x, player.y, 80, C.gold, 10);
  updateHud();
}

function spawnParticles(x, y, z, color, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      z,
      vx: rand(-80, 80),
      vy: rand(-80, 80),
      vz: rand(-80, 120),
      life: rand(0.35, 0.85),
      maxLife: 0.85,
      color,
    });
  }
}

function takeHit(entity) {
  if (entity.hit) return;
  entity.hit = true;
  state.lives -= 1;
  state.hitFlash = 0.22;
  state.shake = 10;
  spawnParticles(entity.x, entity.y, 45, C.red, 24);
  if (state.lives <= 0) endGame();
  updateHud();
}

function collect(entity) {
  entity.hit = true;
  if (entity.type === "ring") {
    state.score += 100;
    spawnParticles(entity.x, entity.y, 60, C.gold, 18);
  } else if (entity.type === "heart") {
    state.lives = Math.min(5, state.lives + 1);
    spawnParticles(entity.x, entity.y, 60, C.red, 18);
  } else if (entity.type === "missile") {
    state.missiles = Math.min(9, state.missiles + 2);
    spawnParticles(entity.x, entity.y, 60, C.cyan, 18);
  }
  updateHud();
}

function destroyEntity(entity, points = 80) {
  entity.hit = true;
  state.score += points;
  spawnParticles(entity.x, entity.y, entity.z, C.gold, 24);
}

function update(delta) {
  if (state.status !== "running" || state.paused) return;

  const level = currentLevel();
  const speed = level.speed + Math.min(240, state.levelDistance * 0.025);
  state.distance += speed * delta;
  state.levelDistance += speed * delta;
  state.score = Math.floor(state.levelDistance / 5);
  state.spawnTimer -= delta;
  state.hitFlash = Math.max(0, state.hitFlash - delta);
  state.shake = Math.max(0, state.shake - delta * 24);

  const keyX = (keys.ArrowRight || keys.d || keys.D ? 1 : 0) - (keys.ArrowLeft || keys.a || keys.A ? 1 : 0);
  const keyY = (keys.ArrowDown || keys.s || keys.S ? 1 : 0) - (keys.ArrowUp || keys.w || keys.W || keys[" "] ? 1 : 0);
  if (keyX || keyY) {
    player.tx = clamp(player.tx + keyX * 270 * delta, -112, 112);
    player.ty = clamp(player.ty + keyY * 300 * delta, -150, 155);
  }

  const px0 = player.x;
  player.x += (player.tx - player.x) * Math.min(1, delta * 8.5);
  player.y += (player.ty - player.y) * Math.min(1, delta * 8.5);
  player.tilt += ((player.x - px0) * 0.065 - player.tilt) * Math.min(1, delta * 8);

  if (state.spawnTimer <= 0) {
    spawnEntity();
    state.spawnTimer = Math.max(0.26, level.spawn - Math.min(0.22, state.levelDistance / 16000));
  }

  for (let i = entities.length - 1; i >= 0; i--) {
    const e = entities[i];
    e.z -= speed * delta;
    e.spin += (e.rot || 1) * delta;
    if (e.z < -90 || e.hit) {
      entities.splice(i, 1);
      continue;
    }
    if (e.z < 52) {
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (e.type === "ring" && distance < e.radius * 0.76) collect(e);
      else if ((e.type === "heart" || e.type === "missile") && distance < 38) collect(e);
      else if (!["ring", "heart", "missile"].includes(e.type) && distance < e.radius * 0.78) takeHit(e);
    }
  }

  for (let si = shots.length - 1; si >= 0; si--) {
    const shot = shots[si];
    shot.z += shot.speed * delta;
    shot.life -= delta;
    if (shot.z > FAR_Z + 120 || shot.life <= 0) {
      shots.splice(si, 1);
      continue;
    }
    let best = null;
    let bestD = Infinity;
    for (const e of entities) {
      if (["ring", "heart", "missile"].includes(e.type) || e.hit) continue;
      const dz = Math.abs(e.z - shot.z);
      const dx = e.x - shot.x;
      const dy = e.y - shot.y;
      const d = Math.sqrt(dx * dx + dy * dy) + dz * 0.25;
      if (dz < 120 && d < e.radius + 36 && d < bestD) {
        best = e;
        bestD = d;
      }
    }
    if (best) {
      destroyEntity(best, best.type === "wall" ? 150 : 90);
      shots.splice(si, 1);
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= delta;
    p.x += p.vx * delta;
    p.y += p.vy * delta;
    p.z += p.vz * delta;
    if (p.life <= 0) particles.splice(i, 1);
  }

  if (Math.floor(state.levelDistance / 5) >= level.target) endLevel();
  updateHud();
}

function endLevel() {
  state.totalScore += Math.floor(state.score);
  state.status = "levelcomplete";
  const level = currentLevel();
  const next = LEVELS[state.levelIndex + 1];
  document.getElementById("gate-kicker").textContent = `Level ${level.id}: Complete`;
  document.getElementById("gate-heading").textContent = `${level.name} Complete!`;
  document.getElementById("gate-score").textContent = `Your score: ${Math.floor(state.score)}  ·  Total: ${state.totalScore}`;
  if (next) {
    document.getElementById("gate-next-label").textContent = "Up Next";
    document.getElementById("gate-next-name").textContent = next.name;
    document.getElementById("gate-next-instruction").textContent = "Stay inside the tunnel, cut through rings, and dodge incoming traffic.";
    gateButton.textContent = `Start ${next.name}`;
  } else {
    state.allComplete = true;
    document.getElementById("gate-next-label").textContent = "All Levels Complete";
    document.getElementById("gate-next-name").textContent = "YOU WIN!";
    document.getElementById("gate-next-instruction").textContent = "You've beaten every tunnel. Submit your score to the leaderboard.";
    gateButton.textContent = "Submit Score";
  }
  levelGateOverlay.classList.remove("hidden");
  updateHud();
}

function startNextLevel() {
  levelGateOverlay.classList.add("hidden");
  if (state.allComplete) {
    state.allComplete = false;
    endGame();
    return;
  }
  state.levelIndex += 1;
  state.missiles = Math.min(9, state.missiles + 1);
  resetRun(false);
  state.status = "running";
  startOverlay.classList.add("hidden");
  gameOverOverlay.classList.add("hidden");
}

async function endGame() {
  state.status = "gameover";
  state.finalTotal = Math.floor(state.totalScore + state.score);
  if (state.finalTotal > state.best) {
    state.best = state.finalTotal;
    saveBestScore(state.best);
  }
  finalScoreHeading.textContent = `Score: ${state.finalTotal}`;
  resultMessage.textContent = "Submit your score to the leaderboard.";
  gameOverOverlay.classList.remove("hidden");
  updateHud();
}

function drawTunnel(time) {
  const level = currentLevel();
  const shakeX = state.shake ? rand(-state.shake, state.shake) : 0;
  const shakeY = state.shake ? rand(-state.shake, state.shake) : 0;
  ctx.save();
  ctx.translate(shakeX, shakeY);

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, C.bg0);
  bg.addColorStop(0.52, C.bg1);
  bg.addColorStop(1, "#05040d");
  ctx.fillStyle = bg;
  ctx.fillRect(-20, -20, W + 40, H + 40);

  const glow = ctx.createRadialGradient(CENTER_X, CENTER_Y, 10, CENTER_X, CENTER_Y, 340);
  glow.addColorStop(0, `${level.color}44`);
  glow.addColorStop(0.42, "rgba(20,60,120,0.18)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  ctx.lineWidth = 1;
  for (let i = 0; i < 22; i++) {
    const z = ((i * 94 - state.distance * 0.75) % FAR_Z + FAR_Z) % FAR_Z;
    const p = project(0, 0, z);
    const rx = TUNNEL_RX * p.s;
    const ry = TUNNEL_RY * p.s;
    const a = clamp(1 - z / FAR_Z, 0.08, 0.7);
    ctx.strokeStyle = `rgba(77,217,255,${a * 0.28})`;
    ctx.beginPath();
    ctx.ellipse(CENTER_X - player.x * p.s * 0.34, CENTER_Y - player.y * p.s * 0.28, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + Math.sin(time * 0.4) * 0.04;
    const x = Math.cos(a) * TUNNEL_RX;
    const y = Math.sin(a) * TUNNEL_RY;
    const p0 = project(x, y, 80);
    const p1 = project(x, y, FAR_Z);
    ctx.strokeStyle = "rgba(77,217,255,0.16)";
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
  }

  ctx.restore();
}

function drawRing(e, p) {
  const r = e.radius * p.s;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(e.spin);
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = Math.max(2, 7 * p.s);
  ctx.shadowColor = C.gold;
  ctx.shadowBlur = 16 * p.s;
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.72, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255,255,255,0.65)";
  ctx.lineWidth = Math.max(1, 2 * p.s);
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.72, r * 0.50, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawEnemyPlane(e, p) {
  const s = Math.max(0.22, p.s * 1.9);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(e.spin * 0.15);
  ctx.scale(s, s);
  ctx.shadowColor = C.magenta;
  ctx.shadowBlur = 14;
  const g = ctx.createLinearGradient(-20, -10, 25, 10);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.4, "#5ce8ff");
  g.addColorStop(1, "#273a98");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-25, 0);
  ctx.quadraticCurveTo(-8, -13, 20, -8);
  ctx.lineTo(31, 0);
  ctx.lineTo(20, 8);
  ctx.quadraticCurveTo(-8, 13, -25, 0);
  ctx.fill();
  ctx.fillStyle = C.magenta;
  ctx.beginPath(); ctx.moveTo(-4, -4); ctx.lineTo(13, -22); ctx.lineTo(23, -8); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-4, 4); ctx.lineTo(13, 22); ctx.lineTo(23, 8); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#081126";
  ctx.beginPath(); ctx.ellipse(-8, -2, 8, 4, -0.2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawDrone(e, p) {
  const s = Math.max(0.22, p.s * 1.75);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(s, s);
  ctx.shadowColor = C.red;
  ctx.shadowBlur = 13;
  ctx.fillStyle = "#dfe7ff";
  ctx.beginPath();
  ctx.moveTo(-18, 0); ctx.lineTo(-8, -10); ctx.lineTo(16, -7); ctx.lineTo(22, 0); ctx.lineTo(16, 7); ctx.lineTo(-8, 10);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = C.cyan;
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 2;
  for (const y of [-14, 14]) {
    ctx.beginPath(); ctx.ellipse(-8, y, 12, 5, 0, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.fillStyle = C.red;
  ctx.beginPath(); ctx.arc(-3, 0, 4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawCargo(e, p) {
  const s = Math.max(0.22, p.s * 1.85);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(e.spin);
  ctx.scale(s, s);
  ctx.shadowColor = C.gold;
  ctx.shadowBlur = 12;
  const g = ctx.createLinearGradient(-24, -14, 24, 14);
  g.addColorStop(0, "#e4ecff");
  g.addColorStop(0.42, "#697dce");
  g.addColorStop(1, "#17204c");
  ctx.fillStyle = g;
  if (ctx.roundRect) {
    ctx.beginPath(); ctx.roundRect(-24, -13, 48, 26, 7); ctx.fill();
  } else ctx.fillRect(-24, -13, 48, 26);
  ctx.fillStyle = C.gold;
  for (let x = -16; x < 18; x += 15) {
    ctx.save();
    ctx.translate(x, 0);
    ctx.rotate(-0.6);
    ctx.fillRect(-2, -14, 5, 28);
    ctx.restore();
  }
  ctx.restore();
}

function drawMine(e, p) {
  const s = Math.max(0.18, p.s * 1.9);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(e.spin);
  ctx.scale(s, s);
  ctx.shadowColor = C.magenta;
  ctx.shadowBlur = 18;
  const g = ctx.createRadialGradient(-5, -6, 0, 0, 0, 24);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.22, C.magenta);
  g.addColorStop(1, "#140a28");
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = C.magenta;
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 12, Math.sin(a) * 12);
    ctx.lineTo(Math.cos(a) * 27, Math.sin(a) * 27);
    ctx.stroke();
  }
  ctx.restore();
}

function drawWall(e, p) {
  const s = Math.max(0.22, p.s * 1.6);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(e.spin * 0.2);
  ctx.scale(s, s);
  ctx.shadowColor = e.color;
  ctx.shadowBlur = 14;
  ctx.fillStyle = "#14254d";
  ctx.strokeStyle = e.color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < 7; i++) {
    const a = i * Math.PI * 2 / 7;
    const r = i % 2 ? 44 : 58;
    i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawPickup(e, p) {
  const s = Math.max(0.22, p.s * 1.7);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(e.spin);
  ctx.scale(s, s);
  const color = e.type === "heart" ? C.red : C.cyan;
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.fillStyle = color;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  if (e.type === "heart") {
    ctx.beginPath();
    ctx.moveTo(0, 13);
    ctx.bezierCurveTo(-24, -4, -12, -22, 0, -10);
    ctx.bezierCurveTo(12, -22, 24, -4, 0, 13);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(-18, -5); ctx.lineTo(8, -5); ctx.lineTo(20, 0); ctx.lineTo(8, 5); ctx.lineTo(-18, 5);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = C.gold;
    ctx.fillRect(-8, -5, 4, 10);
  }
  ctx.restore();
}

function drawEntities() {
  const sorted = [...entities].sort((a, b) => b.z - a.z);
  for (const e of sorted) {
    const p = project(e.x, e.y, e.z);
    if (p.s < 0.18 || p.x < -120 || p.x > W + 120 || p.y < -140 || p.y > H + 140) continue;
    if (e.type === "ring") drawRing(e, p);
    else if (e.type === "plane") drawEnemyPlane(e, p);
    else if (e.type === "drone") drawDrone(e, p);
    else if (e.type === "cargo") drawCargo(e, p);
    else if (e.type === "mine") drawMine(e, p);
    else if (e.type === "wall") drawWall(e, p);
    else drawPickup(e, p);
  }
}

function drawShots() {
  for (const shot of shots) {
    const p = project(shot.x, shot.y, shot.z);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(Math.max(0.22, p.s * 1.8), Math.max(0.22, p.s * 1.8));
    ctx.shadowColor = C.gold;
    ctx.shadowBlur = 16;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.ellipse(0, 0, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

function drawParticles() {
  for (const part of particles) {
    const p = project(part.x, part.y, part.z);
    const alpha = Math.max(0, part.life / part.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = part.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(1, 7 * p.s * alpha), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawPlayer(time) {
  const sx = CENTER_X + player.x;
  const sy = H * 0.72 + player.y * 0.25;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(player.tilt * 0.018);
  ctx.scale(0.84, 0.84);

  ctx.shadowColor = "rgba(0,0,0,0.58)";
  ctx.shadowBlur = 14;
  ctx.fillStyle = "rgba(0,0,0,0.30)";
  ctx.beginPath();
  ctx.ellipse(0, 32, 42, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowColor = "rgba(77,217,255,0.42)";
  ctx.shadowBlur = 8;
  const body = ctx.createLinearGradient(-26, -30, 28, 32);
  body.addColorStop(0, "#f8fdff");
  body.addColorStop(0.36, "#8fdcff");
  body.addColorStop(0.62, "#314a74");
  body.addColorStop(1, "#111827");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(0, -38);
  ctx.bezierCurveTo(20, -18, 22, 16, 7, 39);
  ctx.lineTo(0, 48);
  ctx.lineTo(-7, 39);
  ctx.bezierCurveTo(-22, 16, -20, -18, 0, -38);
  ctx.fill();

  const wing = ctx.createLinearGradient(-58, 2, 58, 26);
  wing.addColorStop(0, "#27d7ff");
  wing.addColorStop(0.5, "#7df0ff");
  wing.addColorStop(1, "#1c70ff");
  ctx.shadowBlur = 0;
  ctx.fillStyle = wing;
  ctx.beginPath();
  ctx.moveTo(-12, 5);
  ctx.lineTo(-62, 30);
  ctx.lineTo(-17, 27);
  ctx.lineTo(0, 12);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(12, 5);
  ctx.lineTo(62, 30);
  ctx.lineTo(17, 27);
  ctx.lineTo(0, 12);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ffd84d";
  ctx.beginPath();
  ctx.moveTo(-13, 40);
  ctx.lineTo(0, 62);
  ctx.lineTo(13, 40);
  ctx.closePath();
  ctx.fill();

  const canopy = ctx.createLinearGradient(-7, -24, 9, 10);
  canopy.addColorStop(0, "rgba(245,255,255,0.95)");
  canopy.addColorStop(0.45, "rgba(88,206,255,0.72)");
  canopy.addColorStop(1, "rgba(8,18,42,0.92)");
  ctx.fillStyle = canopy;
  ctx.beginPath();
  ctx.ellipse(0, -10, 10, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.42)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -34);
  ctx.lineTo(0, 36);
  ctx.stroke();

  const finShift = Math.sin(time * 0.006) * 2;
  ctx.fillStyle = "#ff4b5f";
  ctx.beginPath();
  ctx.moveTo(-5, 26);
  ctx.lineTo(0, 10 + finShift);
  ctx.lineTo(5, 26);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawScreenEffects() {
  const level = currentLevel();
  ctx.save();
  const vignette = ctx.createRadialGradient(CENTER_X, CENTER_Y, 80, CENTER_X, CENTER_Y, 360);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(0.72, "rgba(0,0,0,0.05)");
  vignette.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 0.035;
  ctx.fillStyle = level.color;
  for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
  if (state.hitFlash > 0) {
    ctx.globalAlpha = state.hitFlash * 0.45;
    ctx.fillStyle = C.red;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

function render(now = performance.now()) {
  const time = now / 1000;
  ctx.clearRect(0, 0, W, H);
  drawTunnel(time);
  drawEntities();
  drawShots();
  drawParticles();
  drawPlayer(time);
  drawProgress();
  if (state.status === "idle") drawIdleScene();
  if (state.paused && state.status === "running") drawPauseOverlay();
  drawScreenEffects();
}

function drawProgress() {
  if (state.status !== "running") return;
  const level = currentLevel();
  const levelScore = Math.floor(state.levelDistance / 5);
  const progress = clamp(levelScore / level.target, 0, 1);
  const x = 16, y = 14, w = W - 32, h = 8;
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  roundedRect(x, y, w, h, 6, true);
  const g = ctx.createLinearGradient(x, 0, x + w * progress, 0);
  g.addColorStop(0, level.color);
  g.addColorStop(1, "#ffffff");
  ctx.fillStyle = g;
  ctx.shadowColor = level.color;
  ctx.shadowBlur = 8;
  roundedRect(x, y, Math.max(5, w * progress), h, 6, true);
  ctx.shadowBlur = 0;
  ctx.fillStyle = level.color;
  ctx.font = "bold 10px Trebuchet MS";
  ctx.textAlign = "left";
  ctx.fillText(`LV ${level.id} - ${level.name.replace(/^Level \d+: /, "")}`, x, y + 20);
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.textAlign = "right";
  ctx.fillText(`${Math.max(0, level.target - levelScore)} pts to next`, x + w, y + 20);
}

function drawIdleScene() {
  ctx.save();
  ctx.globalAlpha = 0.72;
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = "bold 16px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText("3D tunnel ready", CENTER_X, H * 0.18);
  ctx.restore();
}

function drawPauseOverlay() {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.46)";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 24px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText("PAUSED", CENTER_X, CENTER_Y);
  ctx.restore();
}

function roundedRect(x, y, w, h, r, fill) {
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    fill ? ctx.fill() : ctx.stroke();
  } else {
    fill ? ctx.fillRect(x, y, w, h) : ctx.strokeRect(x, y, w, h);
  }
}

function sanitizeText(v) {
  return String(v).replace(/[<>&"]/g, "");
}

function rankLabel(i) {
  if (i === 0) return "Major Prize";
  if (i < 10) return "Prize Draw Entry";
  return "Submitted";
}

function getPrizePoints(entry) {
  const points = Number(entry?.prizePoints ?? entry?.score ?? 0);
  return Number.isFinite(points) ? points : 0;
}

function badgeClass(i) {
  if (i === 0) return "champion";
  if (i < 10) return "raffle";
  return "standard";
}

function renderLeaderboard() {
  const entries = loadWeeklyScores()
    .sort((a, b) => getPrizePoints(b) - getPrizePoints(a) || String(a.createdAt || "").localeCompare(String(b.createdAt || "")))
    .slice(0, 10);
  if (!entries.length) {
    leaderboardBody.innerHTML = '<tr><td colspan="4" class="empty-state">No scores yet. Start the first run.</td></tr>';
    return;
  }
  leaderboardBody.innerHTML = entries.map((e, i) => `
    <tr class="${i === 0 ? "champion" : i < 10 ? "raffle" : ""}">
      <td>#${i + 1}</td>
      <td>${sanitizeText(e.name)}</td>
      <td>${getPrizePoints(e)}</td>
      <td><span class="status-badge ${badgeClass(i)}">${rankLabel(i)}</span></td>
    </tr>`).join("");
}

function submitScore(name, email, score) {
  const rawScore = Math.max(0, Math.floor(Number(score) || 0));
  const entry = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: name.trim(),
    email: email.trim(),
    score: rawScore,
    rawScore,
    gameType: ACTIVE_GAME_TYPE,
    gameName: ACTIVE_GAME_NAME,
    prizePoints: rawScore,
    createdAt: new Date().toISOString(),
  };
  const entries = loadWeeklyScores();
  entries.push(entry);
  saveWeeklyScores(entries);
  renderLeaderboard();

  fetch(SHEETS_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: entry.name,
      email: entry.email,
      score: entry.score,
      rawScore: entry.rawScore,
      gameType: entry.gameType,
      prizePoints: entry.prizePoints,
      best: state.best,
      submitted_at: entry.createdAt,
      source: "pti-giveaway-arcade",
    }),
  }).catch(() => {});
}

function fitMobileCanvas() {
  const vw = window.innerWidth;
  const root = document.documentElement;
  if (vw > 700) {
    canvas.style.width = "";
    canvas.style.height = "";
    root.style.removeProperty("--mobile-canvas-width");
    root.style.removeProperty("--mobile-canvas-height");
    return;
  }
  const frame = document.querySelector(".game-frame");
  const hud = document.querySelector(".hud-strip");
  const frameHeight = frame?.clientHeight || window.innerHeight;
  const hudHeight = hud?.offsetHeight || 58;
  const availableHeight = Math.max(320, frameHeight - hudHeight);
  const w = vw;
  const h = availableHeight;
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  root.style.setProperty("--mobile-canvas-width", w + "px");
  root.style.setProperty("--mobile-canvas-height", h + "px");
}

function frameLoop(now) {
  const delta = Math.min(0.032, (now - lastFrame) / 1000);
  lastFrame = now;
  update(delta);
  render(now);
  requestAnimationFrame(frameLoop);
}

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);
gateButton.addEventListener("click", startNextLevel);

pauseBtn.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (state.status !== "running") return;
  state.paused = !state.paused;
  updateHud();
});

fireBtn.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  fireMissile();
});

canvas.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  pointerActive = true;
  const target = screenToTunnel(e.clientX, e.clientY);
  player.tx = target.x;
  player.ty = target.y;
});

canvas.addEventListener("pointermove", (e) => {
  if (!pointerActive) return;
  const target = screenToTunnel(e.clientX, e.clientY);
  player.tx = target.x;
  player.ty = target.y;
});

canvas.addEventListener("pointerup", () => { pointerActive = false; });
canvas.addEventListener("pointercancel", () => { pointerActive = false; });
canvas.addEventListener("pointerleave", () => { pointerActive = false; });
window.addEventListener("pointerup", () => { pointerActive = false; });

window.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
  if ((e.key === "z" || e.key === "Z" || e.key === "x" || e.key === "X") && state.status === "running") {
    e.preventDefault();
    fireMissile();
  }
});

window.addEventListener("keyup", (e) => {
  delete keys[e.key];
});

window.addEventListener("blur", () => {
  pointerActive = false;
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && state.status === "running") state.paused = true;
  updateHud();
});

scoreForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (state.justSubmitted) return;
  submitScore(playerNameInput.value, playerEmailInput.value, state.finalTotal || Math.floor(state.totalScore + state.score));
  state.justSubmitted = true;
  resultMessage.textContent = "Score submitted. Play again any time to climb the board.";
  playerNameInput.value = "";
  playerEmailInput.value = "";
});

missilesValue.textContent = String(state.missiles);
bestValue.textContent = String(state.best);
renderLeaderboard();
resetRun();
render();
requestAnimationFrame(frameLoop);
window.addEventListener("resize", fitMobileCanvas);
fitMobileCanvas();
