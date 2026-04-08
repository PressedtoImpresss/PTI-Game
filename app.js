// ── CONFIG ────────────────────────────────────────────────────────────────────

const STORAGE_PREFIX = "pti-cave-flight";

// Paste your deployed Google Apps Script URL here after setting up Claude commentary
const APPS_SCRIPT_URL = "";

// Midnight Studio palette
const C = {
  bgTop:        "#060210",
  bgMid:        "#0a0e26",
  wallDark:     "#0c1040",
  wallMid:      "#1e4490",
  wallLight:    "#2870cc",
  wallEdge:     "rgba(60,150,255,0.95)",
  hoopStroke:   "#f5c830",
  hoopGlow:     "rgba(245,200,48,0.75)",
  hoopInner:    "rgba(245,200,48,0.20)",
  obstFill:     "#ff4820",
  obstGlow:     "rgba(255,72,32,0.65)",
  obstAlt:      "#ffec40",
  heliBody:     "#eeeadc",
  heliTrim:     "#f5c830",
  heliCockpit:  "#70ccff",
  thrustGlow:   "rgba(80,225,255,0.80)",
  trailBase:    "rgba(170,225,255,",
  particleHoop: "#f5c830",
  particleHit:  "#ff4820",
  hudText:      "#ffffff",
  hudMuted:     "rgba(255,255,255,0.65)",
  gridLine:     "rgba(60,90,200,0.20)",
  bannerBg:     "rgba(5,2,16,0.96)",
};

// ── DOM REFS ──────────────────────────────────────────────────────────────────

const canvas             = document.getElementById("game-canvas");
const ctx                = canvas.getContext("2d");
const ptiLogoImg         = new Image();
let   ptiLogoReady       = false;
ptiLogoImg.onload        = () => { ptiLogoReady = true; };
ptiLogoImg.src           = './pti-logo.png';
const scoreValue         = document.getElementById("score-value");
// modeValue removed — Mode pill deleted from HUD
const lifeValue          = document.getElementById("life-value");
const bestValue          = document.getElementById("best-value");
const missilesValue      = document.getElementById("missiles-value");
const startOverlay       = document.getElementById("start-overlay");
const gameOverOverlay    = document.getElementById("game-over-overlay");
const startButton        = document.getElementById("start-button");
const restartButton      = document.getElementById("restart-button");
const scoreForm          = document.getElementById("score-form");
const playerNameInput    = document.getElementById("player-name");
const playerEmailInput   = document.getElementById("player-email");
const finalScoreHeading  = document.getElementById("final-score-heading");
const resultMessage      = document.getElementById("result-message");
const leaderboardBody    = document.getElementById("leaderboard-body");
const exportJsonButton   = document.getElementById("export-json");
const exportCsvButton    = document.getElementById("export-csv");
const resetBoardButton   = document.getElementById("reset-board");

// ── WORLD ─────────────────────────────────────────────────────────────────────

const WORLD_WIDTH  = canvas.width;
const WORLD_HEIGHT = canvas.height;
const COLUMN_WIDTH = 24;
const COLUMN_COUNT = Math.ceil(WORLD_WIDTH / COLUMN_WIDTH) + 6;

// ── LEVELS ────────────────────────────────────────────────────────────────────

const LEVEL_DEFS = [
  {
    id: 1, name: "Level 1: Print Run",
    subtitle: "Thread the hoops",
    instruction: "Fly through the glowing rings for +100 bonus points. Dodge flying t-shirts. Grab the heart for an extra life!",
    completionScore: 900,
    obstacleTypes: ["hoop", "tshirt", "extralife", "missile"],
    hoopWeight: 0.55,
    baseSpeed: 108, baseGap: 470,
    color: "#4dd9ff",
  },
  {
    id: 2, name: "Level 2: Shop Floor",
    subtitle: "Dodge the press",
    instruction: "T-shirts and DTF rolls flying at you — dodge them or lose a life. Rings give bonus. Hearts give life!",
    completionScore: 1400,
    obstacleTypes: ["hoop", "tshirt", "tshirt", "vinyl", "inkblob", "heatpress", "drone", "extralife", "missile", "caveshield"],
    hoopWeight: 0.15,
    baseSpeed: 128, baseGap: 435,
    color: "#ff9f43",
  },
  {
    id: 3, name: "Rush Order",
    subtitle: "Survive as long as you can",
    instruction: "All obstacles, full speed. Grab the heart for an extra life. Collect hoops, dodge everything else.",
    completionScore: 1800,
    obstacleTypes: ["hoop", "tshirt", "vinyl", "heatpress", "drone", "inkblob", "rock", "extralife", "missile", "caveshield", "caveburst"],
    baseSpeed: 152, baseGap: 392,
    color: "#ffcc5c",
    verticalMovement: true,
    droneWeight: 0.35,
  },
  {
    id: 4, name: "Deadline Crunch",
    subtitle: "Nothing stays still",
    instruction: "Maximum speed, moving obstacles, tighter cave. Shoot the drones with your gun! Grab hearts when you can!",
    completionScore: 2500,
    obstacleTypes: ["hoop", "tshirt", "vinyl", "heatpress", "drone", "inkblob", "rock", "rock", "extralife", "missile", "caveshield", "caveburst"],
    hoopWeight: 0.3,
    baseSpeed: 185, baseGap: 320,
    color: "#ff4757",
    verticalMovement: true,
    droneWeight: 0.45,
  },
  {
    id: 5, name: "Night Shift",
    subtitle: "No mercy. Survive.",
    instruction: "Drones everywhere. Shoot them down or dodge them. Only the best survive the night shift.",
    completionScore: 3500,
    obstacleTypes: ["hoop", "drone", "drone", "drone", "heatpress", "inkblob", "rock", "rock", "extralife", "missile", "caveshield", "caveburst"],
    hoopWeight: 0.25,
    baseSpeed: 210, baseGap: 310,
    color: "#a29bfe",
    verticalMovement: true,
    droneWeight: 0.55,
  },
  {
    id: 6, name: "Double Shift",
    subtitle: "Beyond the limit.",
    instruction: "Drone swarms and brutal speed. Shoot what you can, dodge the rest. Every heart counts.",
    completionScore: 5000,
    obstacleTypes: ["hoop", "drone", "drone", "drone", "heatpress", "inkblob", "rock", "rock", "extralife", "missile", "caveshield", "caveburst"],
    hoopWeight: 0.2,
    baseSpeed: 235, baseGap: 295,
    color: "#fd9644",
    verticalMovement: true,
    droneWeight: 0.60,
  },
  {
    id: 7, name: "The Final Press",
    subtitle: "This is the end.",
    instruction: "Maximum drone swarms. Shoot everything. Tightest cave. Only the best pilots finish The Final Press.",
    completionScore: 7000,
    obstacleTypes: ["hoop", "drone", "drone", "drone", "heatpress", "inkblob", "rock", "rock", "extralife", "missile", "caveshield", "caveburst"],
    hoopWeight: 0.18,
    baseSpeed: 260, baseGap: 278,
    color: "#ff2255",
    verticalMovement: true,
    droneWeight: 0.65,
  },
  {
    id: 8, name: "Graveyard Shift",
    subtitle: "The cave fights back.",
    instruction: "Tightest gaps yet. Drone swarms hunt you relentlessly. Use your missiles wisely.",
    completionScore: 9000,
    obstacleTypes: ["hoop", "drone", "drone", "drone", "heatpress", "inkblob", "rock", "rock", "extralife", "missile", "caveshield", "caveburst"],
    hoopWeight: 0.16,
    baseSpeed: 285, baseGap: 260,
    color: "#00e5ff",
    verticalMovement: true,
    droneWeight: 0.70,
  },
  {
    id: 9, name: "Midnight Run",
    subtitle: "Almost nothing left.",
    instruction: "Barely any room to move. Drones everywhere. Only missiles and instinct will carry you through.",
    completionScore: 11000,
    obstacleTypes: ["hoop", "drone", "drone", "drone", "inkblob", "rock", "rock", "extralife", "missile", "caveshield", "caveburst"],
    hoopWeight: 0.14,
    baseSpeed: 308, baseGap: 245,
    color: "#bf5fff",
    verticalMovement: true,
    droneWeight: 0.75,
  },
  {
    id: 10, name: "Legendary Print",
    subtitle: "Only legends reach this.",
    instruction: "The ultimate run. Maximum speed, minimum space. Survive long enough and your name is permanent.",
    completionScore: 14000,
    obstacleTypes: ["hoop", "drone", "drone", "drone", "inkblob", "rock", "rock", "extralife", "missile", "caveshield", "caveburst"],
    hoopWeight: 0.12,
    baseSpeed: 330, baseGap: 230,
    color: "#ffd700",
    verticalMovement: true,
    droneWeight: 0.80,
  },
];

// ── BOSS DEFINITIONS ──────────────────────────────────────────────────────────
const BOSS_DEFS = [
  { name: "The Presser",     hp: 30,  speed: 58,  shootInterval: 1.55, bulletSpeed: 155, pattern: "single",  color: "#ff9f43", w: 64, h: 72 },
  { name: "DTF Phantom",     hp: 65,  speed: 85,  shootInterval: 1.65, bulletSpeed: 195, pattern: "double",  color: "#ff6b81", w: 68, h: 68 },
  { name: "Rush Daemon",     hp: 95,  speed: 88,  shootInterval: 1.7,  bulletSpeed: 195, pattern: "spread3", color: "#ffd32a", w: 74, h: 78 },
  { name: "The Overseer",    hp: 130, speed: 115, shootInterval: 1.25, bulletSpeed: 235, pattern: "aimed",   color: "#a29bfe", w: 82, h: 82 },
  { name: "Midnight Machine",hp: 165, speed: 140, shootInterval: 1.0,  bulletSpeed: 265, pattern: "chaos",   color: "#ff2255", w: 88, h: 88 },
  { name: "The Foreman",     hp: 210, speed: 165, shootInterval: 0.78, bulletSpeed: 300, pattern: "chaos",   color: "#fd9644", w: 94, h: 94 },
  { name: "The Final Press", hp: 270, speed: 190, shootInterval: 0.60, bulletSpeed: 335, pattern: "chaos",   color: "#ff2255", w: 100, h: 100 },
  { name: "The Phantom",     hp: 340, speed: 215, shootInterval: 0.50, bulletSpeed: 365, pattern: "chaos",   color: "#00e5ff", w: 106, h: 106 },
  { name: "Midnight King",   hp: 420, speed: 240, shootInterval: 0.42, bulletSpeed: 395, pattern: "chaos",   color: "#bf5fff", w: 112, h: 112 },
  { name: "The Legend",      hp: 520, speed: 265, shootInterval: 0.35, bulletSpeed: 425, pattern: "chaos",   color: "#ffd700", w: 118, h: 118 },
];

// ── WEAPON DEFINITIONS ────────────────────────────────────────────────────────
// 5 weapons total, unlocked progressively boss 1→5
const WEAPONS = [
  { id: "gun",    label: "GUN",    damage: 1,   cooldown: 0.32, speed: 380, color: "#44eeff", size: 5  },
  { id: "bomb",   label: "BOMB",   damage: 6,   cooldown: 2.1,  speed: 92,  color: "#ff8800", size: 13 },
  { id: "spread", label: "SPREAD", damage: 1.2, cooldown: 1.0,  speed: 340, color: "#88ff44", size: 4  },
  { id: "triple", label: "TRIPLE", damage: 2.2, cooldown: 0.85, speed: 360, color: "#ff44dd", size: 4  },
  { id: "heavy",  label: "HEAVY",  damage: 14,  cooldown: 2.5,  speed: 65,  color: "#ff6600", size: 15 },
];
function weaponsForBoss(bossIndex) {
  // Return shallow copies so per-boss scaling doesn't mutate the base WEAPONS array
  const pool = Math.min(5, bossIndex === 0 ? 1 : bossIndex === 1 ? 2 : bossIndex === 2 ? 3 : bossIndex === 3 ? 4 : 5);
  return WEAPONS.slice(0, pool).map(w => {
    const wp = Object.assign({}, w);

    // BOMB — harder to land so reward grows: +2 damage per boss from boss 2 onward
    if (wp.id === "bomb" && bossIndex >= 1) {
      wp.damage = +(6 + (bossIndex - 1) * 2).toFixed(0);          // 6 → 8 → 10 → 12 → 14 → 16
    }

    // SPREAD — fires faster and hits slightly harder from boss 3 onward
    if (wp.id === "spread" && bossIndex >= 2) {
      const extra   = bossIndex - 2;
      wp.damage     = +(1.2 + extra * 0.20).toFixed(2);
      wp.cooldown   = +(Math.max(0.48, 1.0 - extra * 0.11)).toFixed(2);
    }
    // TRIPLE — damage scales from boss 4 onward
    if (wp.id === "triple" && bossIndex >= 3) {
      const extra = bossIndex - 3;
      wp.damage = +(2.2 + extra * 0.5).toFixed(1);
    }
    // HEAVY — damage scales from boss 5 onward
    if (wp.id === "heavy" && bossIndex >= 4) {
      const extra = bossIndex - 4;
      wp.damage = +(14 + extra * 4).toFixed(0);
    }

    return wp;
  });
}

function getLevelForScore(score) {
  let lv = LEVEL_DEFS[0];
  for (const def of LEVEL_DEFS) {
    if (score >= def.threshold) lv = def;
  }
  return lv;
}

// ── CAVE ──────────────────────────────────────────────────────────────────────

const cave = {
  ceiling:     new Array(COLUMN_COUNT).fill(72),
  floor:       new Array(COLUMN_COUNT).fill(540),
  offset:      0,
  nextCeiling: 72,
  nextFloor:   540,
};

// ── HELICOPTER ────────────────────────────────────────────────────────────────

const helicopter = {
  x: 122, y: 308,
  width: 54, height: 24,
  velocityY: 0,
  rotor: 0,
  thrusting: false,
  thrustGlow: 0,
};

// ── FLOATERS (hoops + branded obstacles) ─────────────────────────────────────
// Each: { type, cx, cy, w, h, radius, rotation, rotSpeed, phase, collected }

const floaters = [];

// ── SMOKE PUFFS (put-put exhaust) ────────────────────────────────────────────
// Each: { x, y, vy, age, maxAge, size0 }
// Emitted as discrete blobs that expand and fade, giving a chuffing exhaust look

const smokePuffs = [];

// ── PARTICLES ─────────────────────────────────────────────────────────────────
// Each: { x, y, vx, vy, life, maxLife, color, size }

const particles = [];

// ── SCORE POPUPS ──────────────────────────────────────────────────────────────
// Each: { x, y, text, life }

const scorePopups  = [];
const caveBullets  = [];
const burstBullets = []; // free auto-fired energy bolts during burst

// ── LEVEL BANNER ──────────────────────────────────────────────────────────────

const banner = { active: false, alpha: 0, def: null, timer: 0 };

// ── GAME STATE ────────────────────────────────────────────────────────────────

const gameState = {
  status:         "idle",
  score:          0,
  displayedScore: 0,
  best:           loadBestScore(),
  distance:       0,
  speed:          115,
  justSubmitted:  false,
  pausedByBlur:   false,
  safeTime:       0,
  lives:          3,
  lastSpawnType:  null,
  allComplete:    false,
  hitRecovery:    0,
  levelIndex:     0,
  level:          1,
  hoopsCollected:    0,
  obstaclesHit:      0,
  floaterTimer:      0,
  levelTipTimer:     0,
  bonusScore:        0,
  totalScore:        0,
  smokePuffTimer:       0,
  missiles:             3,  // stacks across levels; +1 per level start, +1 per boss kill
  caveGunTimer:         0,
  caveShootPressed:     false,
  caveShield:           0,  // seconds of shield remaining in cave
  caveBurst:            0,  // seconds of rapid-fire remaining in cave
  caveBurstFireTimer:   0,  // auto-fire timer during burst
  lastAnySpecialScore: -9999, // prevents multiple specials dropping close together
  heartsSpawnedThisLevel:    0,
  lastHeartScore:           -9999,
  missilesSpawnedThisLevel:  0,
  lastMissileScore:         -9999,
  shieldsSpawnedThisLevel:   0,
  lastShieldScore:          -9999,
  burstsSpawnedThisLevel:    0,
  lastBurstScore:           -9999,
};

// ── STORAGE ───────────────────────────────────────────────────────────────────

function getWeekStart(date = new Date()) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  const day = copy.getDay();
  copy.setDate(copy.getDate() + (day === 0 ? -6 : 1 - day));
  return copy;
}

function formatWeekLabel(date = new Date()) {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

function getWeekKey() {
  return `${STORAGE_PREFIX}:${getWeekStart().toISOString().slice(0, 10)}`;
}

function loadBestScore() {
  return parseInt(localStorage.getItem(`${STORAGE_PREFIX}:best`) || "0", 10) || 0;
}

function saveBestScore(score) {
  localStorage.setItem(`${STORAGE_PREFIX}:best`, String(score));
}

function loadWeeklyScores() {
  try {
    const raw = localStorage.getItem(getWeekKey());
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function saveWeeklyScores(entries) {
  localStorage.setItem(getWeekKey(), JSON.stringify(entries));
}

// ── DIFFICULTY CURVES ─────────────────────────────────────────────────────────

function getSpeedForScore(score) {
  const base = LEVEL_DEFS[gameState.levelIndex].baseSpeed;
  if (score < 250) return base;
  if (score < 500) return base + 14;
  if (score < 700) return base + 24;
  return base + 32;
}

function getGapForScore(score) {
  const base      = LEVEL_DEFS[gameState.levelIndex].baseGap;
  const wideStart = 520; // all levels start with a generous opening
  // Smoothly narrow from wideStart → base over the first 300 pts of each level
  if (score < 300) {
    const t = score / 300;
    return Math.round(wideStart - (wideStart - base) * t);
  }
  if (score < 500) return base;
  if (score < 700) return base - 18;
  if (score < 900) return base - 32;
  return base - 44;
}

function getFloaterInterval(score) {
  if (gameState.levelIndex === 0) return score < 400 ? 2.6 : 2.0;
  if (gameState.levelIndex === 1) return score < 400 ? 1.7 : 1.3;
  if (gameState.levelIndex === 2) return score < 400 ? 1.5 : 1.1;
  if (gameState.levelIndex <= 4)  return score < 400 ? 1.1 : 0.85;
  if (gameState.levelIndex <= 6) return score < 400 ? 0.85 : 0.65;
  return score < 400 ? 0.72 : 0.52; // levels 8–10: extremely dense
}

// ── CAVE GENERATION ───────────────────────────────────────────────────────────

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function generateNextColumn(index, initializing = false) {
  const score = gameState.displayedScore;
  const gap = getGapForScore(score);
  const driftLimit = initializing ? 2 : score < 130 ? 6 : 8;
  const drift = Math.random() * driftLimit * 2 - driftLimit;

  // Keep the cave vertically centred as it narrows; floor stays above the HUD strip
  const minCeiling = 44;
  const maxCeiling = WORLD_HEIGHT - gap - 82; // 82px clearance for HUD at bottom
  const midCeiling = (minCeiling + maxCeiling) / 2;
  // Gentle centering pull — stronger when far from centre so the cave doesn't drift into the HUD
  const pull = (midCeiling - cave.nextCeiling) * 0.07;

  cave.nextCeiling = clamp(cave.nextCeiling + drift + pull, minCeiling, maxCeiling);
  cave.nextFloor   = cave.nextCeiling + gap;

  return { ceiling: cave.nextCeiling, floor: cave.nextFloor };
}

function resetCave() {
  cave.offset = 0;
  // Start cave centred — wide opening, symmetric top and bottom
  const startGap = 520;
  cave.nextCeiling = Math.round((WORLD_HEIGHT - startGap) / 2);
  cave.nextFloor   = cave.nextCeiling + startGap;
  for (let i = 0; i < COLUMN_COUNT; i++) {
    const g = generateNextColumn(i, true);
    cave.ceiling[i] = g.ceiling;
    cave.floor[i]   = g.floor;
  }
}

function recycleColumns() {
  while (cave.offset >= COLUMN_WIDTH) {
    cave.offset -= COLUMN_WIDTH;
    cave.ceiling.shift();
    cave.floor.shift();
    const g = generateNextColumn(COLUMN_COUNT - 1);
    cave.ceiling.push(g.ceiling);
    cave.floor.push(g.floor);
  }
}

function getColumnIndexAtX(x) {
  return Math.floor((x + cave.offset) / COLUMN_WIDTH);
}

function getCaveBoundsAtX(x) {
  const index = clamp(getColumnIndexAtX(x), 0, cave.ceiling.length - 1);
  return { ceiling: cave.ceiling[index], floor: cave.floor[index] };
}

function getSpawnCenterY() {
  const b = getCaveBoundsAtX(helicopter.x);
  return (b.ceiling + b.floor) / 2;
}

// ── FLOATER SPAWNING ──────────────────────────────────────────────────────────

function spawnFloater() {
  const allowed = LEVEL_DEFS[gameState.levelIndex].obstacleTypes;

  const b = getCaveBoundsAtX(WORLD_WIDTH - COLUMN_WIDTH * 2);
  const minY = b.ceiling + 55;
  const maxY = b.floor - 55;
  if (maxY - minY < 80) return;

  const cx = WORLD_WIDTH + 50;
  const cy = minY + Math.random() * (maxY - minY);

  const def = LEVEL_DEFS[gameState.levelIndex];
  const hoopWeight = def.hoopWeight !== undefined ? def.hoopWeight : 0.35;
  let type;
  if (allowed.length === 1) {
    type = allowed[0];
  } else {
    // extralife is rare (1-in-8 chance when it's in the pool); drone treated as normal obstacle
    const nonHoop = allowed.filter(t => t !== "hoop");
    if (Math.random() < hoopWeight) {
      type = "hoop";
    } else {
      const nonSpecial = nonHoop.filter(t => t !== "extralife" && t !== "missile");
      // Hearts per level: 1/1/1/2/3/4/4/4/4/4
      const maxHearts   = [1, 1, 1, 2, 3, 4, 4, 4, 4, 4][gameState.levelIndex] ?? 1;
      const heartGap    = 600;
      const heartChance = gameState.levelIndex === 0 ? 0.06 : gameState.levelIndex <= 2 ? 0.10 : 0.14;
      // Missile pickups: up to 4 per level, spaced 400+ score apart, 22% chance
      const missileGap  = 400;
      const missileChance = 0.22;
      // Global gap — no two specials within 500 score of each other
      const anySep = gameState.displayedScore - gameState.lastAnySpecialScore >= 500;
      if (allowed.includes("extralife")
          && gameState.heartsSpawnedThisLevel < maxHearts
          && gameState.displayedScore - gameState.lastHeartScore >= heartGap
          && anySep
          && Math.random() < heartChance) {
        gameState.heartsSpawnedThisLevel++;
        gameState.lastHeartScore = gameState.displayedScore;
        gameState.lastAnySpecialScore = gameState.displayedScore;
        type = "extralife";
      } else if (allowed.includes("missile")
          && gameState.missilesSpawnedThisLevel < 4
          && gameState.displayedScore - gameState.lastMissileScore >= missileGap
          && anySep
          && Math.random() < missileChance) {
        gameState.missilesSpawnedThisLevel++;
        gameState.lastMissileScore = gameState.displayedScore;
        gameState.lastAnySpecialScore = gameState.displayedScore;
        type = "missile";
      } else if (allowed.includes("caveshield")
          && gameState.shieldsSpawnedThisLevel < 1
          && gameState.displayedScore - gameState.lastShieldScore >= 1100
          && anySep
          && Math.random() < 0.09) {
        gameState.shieldsSpawnedThisLevel++;
        gameState.lastShieldScore = gameState.displayedScore;
        gameState.lastAnySpecialScore = gameState.displayedScore;
        type = "caveshield";
      } else if (allowed.includes("caveburst")
          && gameState.burstsSpawnedThisLevel < 1
          && gameState.displayedScore - gameState.lastBurstScore >= 1100
          && anySep
          && Math.random() < 0.09) {
        gameState.burstsSpawnedThisLevel++;
        gameState.lastBurstScore = gameState.displayedScore;
        gameState.lastAnySpecialScore = gameState.displayedScore;
        type = "caveburst";
      } else if (gameState.levelIndex === 1) {
        // Level 2: never repeat the same obstacle type back-to-back
        const fresh = nonSpecial.filter(t => t !== gameState.lastSpawnType);
        type = (fresh.length > 0 ? fresh : nonSpecial)[Math.floor(Math.random() * (fresh.length > 0 ? fresh : nonSpecial).length)];
      } else {
        // Bias toward drones when droneWeight is set (level 3+)
        const droneWeight = def.droneWeight || 0;
        if (droneWeight > 0 && allowed.includes("drone") && Math.random() < droneWeight) {
          type = "drone";
        } else {
          const nonDrone = nonSpecial.filter(t => t !== "drone");
          const pool = nonDrone.length > 0 ? nonDrone : nonSpecial;
          type = pool[Math.floor(Math.random() * pool.length)];
        }
      }
    }
  }
  gameState.lastSpawnType = type;

  const vertMov  = def.verticalMovement;
  // Level 2 gets a gentle wobble even without full verticalMovement to add challenge
  const lv2      = gameState.levelIndex === 1;
  const vertAmp  = vertMov ? 28 + Math.random() * 36 : (lv2 ? 10 + Math.random() * 14 : 0);
  const vertFreq = vertMov ? 0.7 + Math.random() * 1.0 : (lv2 ? 0.7 + Math.random() * 0.7 : 0);

  // Hoops always move vertically — amplitude and speed scale with level
  // Level 1 starts at 32px so rings are already noticeably bouncy from the start
  const hoopAmp  = 32 + gameState.levelIndex * 16 + Math.random() * 20;
  const hoopFreq = 0.8 + gameState.levelIndex * 0.3 + Math.random() * 0.6;

  if (type === "hoop") {
    floaters.push({ type, cx, cy, baseCy: cy, vertAmp: hoopAmp, vertFreq: hoopFreq, radius: 13 + Math.random() * 5, rotation: 0, rotSpeed: 0, phase: Math.random() * Math.PI * 2, collected: false });
  } else if (type === "tshirt") {
    floaters.push({ type, cx, cy, baseCy: cy, vertAmp, vertFreq, w: 54, h: 62, rotation: (Math.random() - 0.5) * 0.5, rotSpeed: (Math.random() - 0.5) * 1.2, phase: 0, collected: false });
  } else if (type === "vinyl") {
    floaters.push({ type, cx, cy, baseCy: cy, vertAmp, vertFreq, w: 58, h: 20, rotation: Math.random() * Math.PI * 2, rotSpeed: (Math.random() > 0.5 ? 1 : -1) * (1.0 + Math.random()), phase: 0, collected: false });
  } else if (type === "heatpress") {
    floaters.push({ type, cx, cy, baseCy: cy, vertAmp, vertFreq, w: 64, h: 28, rotation: 0, rotSpeed: 0, phase: Math.random() * Math.PI * 2, collected: false });
  } else if (type === "extralife") {
    floaters.push({ type, cx, cy, baseCy: cy, vertAmp: 20, vertFreq: 1.2, w: 28, h: 28, rotation: 0, rotSpeed: 0.8, phase: Math.random() * Math.PI * 2, collected: false });
  } else if (type === "drone") {
    const droneAmp  = 40 + Math.random() * 50;
    const droneFreq = 1.2 + Math.random() * 1.2;
    floaters.push({ type, cx, cy, baseCy: cy, vertAmp: droneAmp, vertFreq: droneFreq, w: 28, h: 12, rotation: 0, rotSpeed: 0, phase: Math.random() * Math.PI * 2, collected: false });
  } else if (type === "missile") {
    floaters.push({ type, cx, cy, baseCy: cy, vertAmp: 18, vertFreq: 1.3, w: 36, h: 14, rotation: 0, rotSpeed: 0, phase: Math.random() * Math.PI * 2, collected: false });
  } else if (type === "inkblob") {
    const blobColor = ["#ff2255","#00ccff","#ffcc00","#aa22ff","#ff6600"][Math.floor(Math.random() * 5)];
    floaters.push({ type, cx, cy, baseCy: cy, vertAmp: 35 + Math.random() * 30, vertFreq: 1.4 + Math.random() * 0.8, w: 40, h: 40, rotation: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 1.8, phase: Math.random() * Math.PI * 2, color: blobColor, collected: false });
  } else if (type === "caveshield") {
    floaters.push({ type, cx, cy, baseCy: cy, vertAmp: 22, vertFreq: 1.1, w: 30, h: 30, rotation: 0, rotSpeed: 0.6, phase: Math.random() * Math.PI * 2, collected: false });
  } else if (type === "caveburst") {
    floaters.push({ type, cx, cy, baseCy: cy, vertAmp: 22, vertFreq: 1.1, w: 30, h: 30, rotation: 0, rotSpeed: 0.9, phase: Math.random() * Math.PI * 2, collected: false });
  } else if (type === "rock") {
    const fromTop = Math.random() < 0.5;
    const caveH = b.floor - b.ceiling;
    const maxRockH = Math.max(0, caveH - 72);
    if (maxRockH < 30) return;
    const rockH = maxRockH * (0.52 + Math.random() * 0.15);
    const rockW = 88 + Math.random() * 38;
    const rockCy = fromTop ? b.ceiling + rockH / 2 : b.floor - rockH / 2;
    // Pre-bake jagged profile (7 tip points) so shape is stable each frame
    const cols = 7;
    const jitterPts = [];
    for (let i = 0; i <= cols; i++) {
      jitterPts.push((i === 0 || i === cols) ? 0 : (Math.random() - 0.5) * rockH * 0.38);
    }
    floaters.push({ type, cx, cy: rockCy, baseCy: rockCy, vertAmp: 0, vertFreq: 0, w: rockW, h: rockH, rotation: 0, rotSpeed: 0, phase: 0, fromTop, jitterPts, collected: false });
  }
}

function updateFloaters(delta) {
  const speed = gameState.speed;
  for (let i = floaters.length - 1; i >= 0; i--) {
    const f = floaters[i];
    f.cx -= speed * delta;
    if (f.rotSpeed) f.rotation += f.rotSpeed * delta;
    f.phase += delta;
    if (f.vertAmp) f.cy = f.baseCy + Math.sin(f.phase * f.vertFreq) * f.vertAmp;
    if (f.cx < -120) floaters.splice(i, 1);
  }
}

function getFloaterHitbox(f) {
  if (f.type === "hoop") {
    return { x: f.cx - f.radius * 0.7, y: f.cy - f.radius * 0.7, width: f.radius * 1.4, height: f.radius * 1.4 };
  }
  if (f.type === "extralife") {
    return { x: f.cx - 14, y: f.cy - 14, width: 28, height: 28 };
  }
  return { x: f.cx - f.w / 2, y: f.cy - f.h / 2, width: f.w, height: f.h };
}

function getHelicopterHitbox() {
  return {
    x: helicopter.x - helicopter.width  * 0.36,
    y: helicopter.y - helicopter.height * 0.28,
    width:  helicopter.width  * 0.72,
    height: helicopter.height * 0.56,
  };
}

function intersects(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x &&
         a.y < b.y + b.height && a.y + a.height > b.y;
}

function collidesWithCave() {
  const hb = getHelicopterHitbox();
  const xs = [hb.x, hb.x + hb.width / 2, hb.x + hb.width];
  for (const sx of xs) {
    const b = getCaveBoundsAtX(sx);
    if (hb.y < b.ceiling || hb.y + hb.height > b.floor) return true;
  }
  return false;
}

function checkFloaterCollisions() {
  if (gameState.safeTime > 0 || gameState.hitRecovery > 0) return;
  const hb = getHelicopterHitbox();

  for (let i = floaters.length - 1; i >= 0; i--) {
    const f = floaters[i];
    const fb = getFloaterHitbox(f);
    if (!intersects(hb, fb)) continue;

    if (f.type === "hoop" && !f.collected) {
      f.collected = true;
      gameState.hoopsCollected += 1;
      gameState.bonusScore     += 100;
      spawnParticles(f.cx, f.cy, C.particleHoop, 22);
      scorePopups.push({ x: f.cx, y: f.cy - 18, text: "+100", life: 1.0 });
      floaters.splice(i, 1);
      continue;
    }

    if (f.type === "extralife" && !f.collected) {
      f.collected = true;
      gameState.lives += 1;
      spawnParticles(f.cx, f.cy, "#44ff88", 26);
      scorePopups.push({ x: f.cx, y: f.cy - 18, text: "+LIFE", life: 1.2 });
      lifeValue.textContent = String(gameState.lives);
      floaters.splice(i, 1);
      continue;
    }

    if (f.type === "missile" && !f.collected) {
      f.collected = true;
      gameState.missiles += 1;
      spawnParticles(f.cx, f.cy, "#ff9900", 22);
      spawnParticles(f.cx, f.cy, "#ffcc44", 12);
      scorePopups.push({ x: f.cx, y: f.cy - 18, text: "+MISSILE", life: 1.3 });
      updateCaveFireBtn();
      floaters.splice(i, 1);
      continue;
    }

    if (f.type === "caveshield" && !f.collected) {
      f.collected = true;
      gameState.caveShield = 5.0;
      spawnParticles(f.cx, f.cy, "#50c8ff", 28);
      spawnParticles(f.cx, f.cy, "#ffffff", 14);
      scorePopups.push({ x: f.cx, y: f.cy - 18, text: "SHIELD 5s", life: 1.5 });
      floaters.splice(i, 1);
      continue;
    }

    if (f.type === "caveburst" && !f.collected) {
      f.collected = true;
      gameState.caveBurst = 5.0;
      spawnParticles(f.cx, f.cy, "#ffcc33", 28);
      spawnParticles(f.cx, f.cy, "#ff8800", 14);
      scorePopups.push({ x: f.cx, y: f.cy - 18, text: "BURST 5s", life: 1.5 });
      floaters.splice(i, 1);
      continue;
    }

    if (f.type !== "hoop" && f.type !== "extralife" && f.type !== "missile" && f.type !== "caveshield" && f.type !== "caveburst") {
      registerHit();
      return;
    }
  }
}

// ── PARTICLES ─────────────────────────────────────────────────────────────────

function spawnParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 120;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.5 + Math.random() * 0.4,
      maxLife: 0.5 + Math.random() * 0.4,
      color,
      size: 2 + Math.random() * 3,
    });
  }
}

function updateParticles(delta) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x  += p.vx * delta;
    p.y  += p.vy * delta;
    p.vy += 80 * delta;
    p.life -= delta;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

// ── LEVEL BANNER ──────────────────────────────────────────────────────────────

function triggerBanner(def) {
  banner.active = true;
  banner.def    = def;
  banner.timer  = 2.4;
  banner.alpha  = 0;
}

function updateBanner(delta) {
  if (!banner.active) return;
  banner.timer -= delta;
  if (banner.timer > 2.0)      banner.alpha = (2.4 - banner.timer) / 0.4;
  else if (banner.timer > 0.5) banner.alpha = 1;
  else                         banner.alpha = Math.max(0, banner.timer / 0.5);
  if (banner.timer <= 0) banner.active = false;
}

// ── GAME FLOW ─────────────────────────────────────────────────────────────────

function resetGame(fullReset = true) {
  helicopter.y        = 308;
  helicopter.velocityY = 0;
  helicopter.rotor    = 0;
  helicopter.thrusting = false;
  helicopter.thrustGlow = 0;

  floaters.length    = 0;
  particles.length   = 0;
  smokePuffs.length  = 0;
  scorePopups.length = 0;
  caveBullets.length  = 0;
  burstBullets.length = 0;
  banner.active      = false;

  bossArena = null;
  document.getElementById("boss-controls").classList.add("hidden");
  gameState.status         = "idle";
  gameState.score          = 0;
  gameState.displayedScore = 0;
  gameState.distance       = 0;
  gameState.speed          = 115;
  gameState.justSubmitted  = false;
  gameState.pausedByBlur   = false;
  gameState.safeTime    = 1.1;
  gameState.hitRecovery = 0;
  if (fullReset) {
    gameState.levelIndex   = 0;
    gameState.totalScore   = 0;
    gameState.lives        = 3;
    gameState.missiles     = 3;
  }
  gameState.lastSpawnType = null;
  gameState.allComplete   = false;
  // On level transitions (fullReset=false) lives are preserved
  gameState.level          = gameState.levelIndex + 1;
  gameState.hoopsCollected = 0;
  gameState.obstaclesHit   = 0;
  gameState.floaterTimer      = 1.8;
  gameState.levelTipTimer     = 9;
  gameState.bonusScore        = 0;
  gameState.smokePuffTimer          = 0.12;
  gameState.heartsSpawnedThisLevel   = 0;
  gameState.lastHeartScore           = -9999;
  gameState.missilesSpawnedThisLevel = 0;
  gameState.lastMissileScore         = -9999;
  gameState.shieldsSpawnedThisLevel  = 0;
  gameState.lastShieldScore          = -9999;
  gameState.burstsSpawnedThisLevel   = 0;
  gameState.lastBurstScore           = -9999;
  gameState.caveShield        = 0;
  gameState.caveBurst         = 0;
  gameState.caveBurstFireTimer = 0;
  gameState.lastAnySpecialScore = -9999;

  scoreValue.textContent = "0";
  lifeValue.textContent  = String(gameState.lives);

  resetCave();
  helicopter.y = getSpawnCenterY();
}

function startGame() {
  resetGame(true);
  gameState.status = "running";
  startOverlay.classList.add("hidden");
  gameOverOverlay.classList.add("hidden");
  document.getElementById("level-gate-overlay").classList.add("hidden");
}

function registerHit() {
  if (gameState.caveShield > 0) return; // shield absorbs the hit
  if (gameState.lives > 0) {
    gameState.lives        -= 1;
    gameState.hitRecovery  = 1.2;
    gameState.obstaclesHit += 1;
    spawnParticles(helicopter.x, helicopter.y, C.particleHit, 14);
    lifeValue.textContent  = String(gameState.lives);
    helicopter.velocityY   = -90;
    helicopter.y           = clamp(helicopter.y - 24, 52, WORLD_HEIGHT - 52);
  } else {
    endGame();
  }
}

function showLevelGateOverlay() {
  const currentDef = LEVEL_DEFS[gameState.levelIndex];
  const nextDef    = LEVEL_DEFS[gameState.levelIndex + 1];
  const lvNum      = gameState.levelIndex + 1;
  const shortName  = currentDef.name.replace(/^Level \d+[: ] /, '');

  document.getElementById("gate-kicker").textContent = `Level ${lvNum}: ${shortName}`;
  document.getElementById("gate-score").textContent  = `Your score: ${gameState.displayedScore}  ·  Total: ${gameState.totalScore}`;
  document.getElementById("gate-heading").textContent = `Level ${lvNum} Complete!`;

  if (nextDef) {
    document.getElementById("gate-next-label").textContent       = "Up Next";
    document.getElementById("gate-next-name").textContent        = nextDef.name;
    document.getElementById("gate-next-instruction").textContent = nextDef.instruction;
    document.getElementById("gate-button").textContent           = `Start ${nextDef.name}`;
  } else {
    // All levels beaten
    document.getElementById("gate-next-label").textContent       = "🏆 All Levels Complete!";
    document.getElementById("gate-next-name").textContent        = "YOU WIN!";
    document.getElementById("gate-next-instruction").textContent = "You've beaten every level and every boss. Submit your score to the leaderboard!";
    document.getElementById("gate-button").textContent           = "Submit Score";
    gameState.allComplete = true;
  }

  document.getElementById("level-gate-overlay").classList.remove("hidden");
  gameState.status = "levelcomplete";
}

function endLevel() {
  gameState.totalScore += gameState.displayedScore;
  gameState.status = "bosswait";
  const bossIndex = gameState.levelIndex;
  const def = BOSS_DEFS[bossIndex];
  const lvNum = bossIndex + 1;
  document.getElementById("boss-ready-kicker").textContent = `⚔ BOSS FIGHT — After Level ${lvNum}`;
  document.getElementById("boss-ready-title").textContent  = def.name;
  document.getElementById("boss-ready-overlay").classList.remove("hidden");
}

function startNextLevel() {
  document.getElementById("level-gate-overlay").classList.add("hidden");
  if (gameState.allComplete) {
    gameState.allComplete = false;
    endGame();
    return;
  }
  gameState.levelIndex += 1;
  gameState.missiles   += 1;  // +1 missile awarded each new level
  updateCaveFireBtn();
  resetGame(false);
  gameState.status = "running";
  startOverlay.classList.add("hidden");
  gameOverOverlay.classList.add("hidden");
}

async function endGame() {
  gameState.status = "gameover";
  gameState.score  = Math.floor(gameState.score);
  const finalTotal = gameState.totalScore + gameState.score;
  gameState.finalTotal = finalTotal;

  if (finalTotal > gameState.best) {
    gameState.best = finalTotal;
    saveBestScore(gameState.best);
    bestValue.textContent = String(gameState.best);
  }

  finalScoreHeading.textContent = `Score: ${finalTotal}`;
  resultMessage.textContent = "Analyzing your run…";
  gameOverOverlay.classList.remove("hidden");

  const comment = await fetchClaudeComment(
    gameState.score,
    gameState.level,
    gameState.hoopsCollected,
    gameState.obstaclesHit,
  );

  resultMessage.textContent = comment || getFallbackComment(gameState.score);
}

function getFallbackComment(score) {
  if (score < 40)  return "Barely off the press. Warm up those controls.";
  if (score < 80)  return "Getting there. Thread a few hoops next time.";
  if (score < 130) return "Nice run. Push past the speed jump at 130.";
  if (score < 200) return "Strong flight. You might just make the board.";
  return "That's leaderboard territory. Submit it.";
}

function setThrust(active) {
  if (gameState.status === "idle" && active) startGame();
  helicopter.thrusting = active && gameState.status === "running";
}

// ── MAIN UPDATE ───────────────────────────────────────────────────────────────

function update(delta) {
  if (gameState.status === "boss") { updateBossArena(delta); return; }
  if (gameState.status !== "running") return;
  if (gameState.pausedByBlur || document.hidden || !document.hasFocus()) return;

  gameState.speed = getSpeedForScore(gameState.displayedScore);
  gameState.distance += gameState.speed * delta;
  gameState.score = gameState.distance / 6 + gameState.bonusScore;
  gameState.displayedScore = Math.floor(gameState.score);
  // Show running total across all levels in HUD
  scoreValue.textContent = String(gameState.totalScore + gameState.displayedScore);

  gameState.levelTipTimer = Math.max(0, gameState.levelTipTimer - delta);

  // Smoke: age existing puffs, scroll them left, then emit new discrete puffs
  for (let si = smokePuffs.length - 1; si >= 0; si--) {
    const sp = smokePuffs[si];
    sp.x   -= gameState.speed * delta;
    sp.y   += sp.vy * delta;
    sp.age += delta;
    if (sp.age >= sp.maxAge) smokePuffs.splice(si, 1);
  }
  gameState.smokePuffTimer -= delta;
  if (gameState.smokePuffTimer <= 0) {
    // Emit 1 puff from the tail — size and rate depend on thrust
    const thrusting = helicopter.thrusting;
    smokePuffs.push({
      x:       helicopter.x - 26 + (Math.random() - 0.5) * 5,
      y:       helicopter.y + 5  + (Math.random() - 0.5) * 4,
      vy:      -(10 + Math.random() * 14),  // float upward
      age:     0,
      maxAge:  0.48 + Math.random() * 0.22,
      size0:   thrusting ? 2.5 + Math.random() * 2 : 3.5 + Math.random() * 2.5,
    });
    // Thrusting = faster chug; gliding = slower drift
    gameState.smokePuffTimer = thrusting ? 0.07 + Math.random() * 0.04 : 0.13 + Math.random() * 0.06;
  }

  // Level completion — checked against distance-only score (not bonus) so hoops don't skip levels
  const levelDef = LEVEL_DEFS[gameState.levelIndex];
  if (Math.floor(gameState.distance / 6) >= levelDef.completionScore) {
    endLevel();
    return;
  }

  cave.offset += gameState.speed * delta;
  recycleColumns();

  // Helicopter physics
  const gravity = 560, lift = 860;
  helicopter.velocityY += (helicopter.thrusting ? -lift : gravity) * delta;
  helicopter.velocityY  = clamp(helicopter.velocityY, -220, 260);
  helicopter.y         += helicopter.velocityY * delta;
  helicopter.y          = clamp(helicopter.y, 36, WORLD_HEIGHT - 36);
  helicopter.rotor     += delta * (helicopter.thrusting ? 6 : 4);
  helicopter.thrustGlow = helicopter.thrusting
    ? Math.min(1, helicopter.thrustGlow + delta * 4)
    : Math.max(0, helicopter.thrustGlow - delta * 3);

  gameState.safeTime    = Math.max(0, gameState.safeTime - delta);
  gameState.hitRecovery = Math.max(0, gameState.hitRecovery - delta);
  gameState.caveShield  = Math.max(0, gameState.caveShield - delta);
  gameState.caveBurst   = Math.max(0, gameState.caveBurst  - delta);

  // Floater spawning
  gameState.floaterTimer -= delta;
  if (gameState.floaterTimer <= 0) {
    spawnFloater();
    gameState.floaterTimer = getFloaterInterval(gameState.displayedScore);
  }

  updateFloaters(delta);
  updateParticles(delta);
  updateBanner(delta);

  // ── Cave missiles: manual fire (X key or FIRE button) ──
  if (true) {
    if (gameState.caveGunTimer > 0) gameState.caveGunTimer -= delta;
    if (gameState.caveShootPressed && gameState.caveGunTimer <= 0 && gameState.missiles > 0) {
      gameState.missiles--;
      caveBullets.push({ x: helicopter.x + 28, y: helicopter.y, phase: Math.random() * Math.PI * 2 });
      const burstMult = gameState.caveBurst > 0 ? 0.16 : 1.0;
      gameState.caveGunTimer = 0.4 * burstMult;
      updateCaveFireBtn();
    }
    gameState.caveShootPressed = false;

    // Move missiles forward
    for (let bi = caveBullets.length - 1; bi >= 0; bi--) {
      caveBullets[bi].x += 420 * delta;
      caveBullets[bi].phase += delta * 18; // flame flicker
      if (caveBullets[bi].x > WORLD_WIDTH + 30) { caveBullets.splice(bi, 1); }
    }

    // Missiles pierce — check every missile vs every destructible obstacle each frame
    for (let fi = floaters.length - 1; fi >= 0; fi--) {
      const f = floaters[fi];
      if (f.type === "extralife" || f.type === "hoop" || f.type === "missile" || f.type === "caveshield" || f.type === "caveburst" || f.type === "rock" || f.collected) continue;
      for (const m of caveBullets) {
        if (Math.abs(m.x - f.cx) < f.w / 2 + 16 && Math.abs(m.y - f.cy) < f.h / 2 + 16) {
          spawnParticles(f.cx, f.cy, "#ff5500", 32);
          spawnParticles(f.cx, f.cy, "#ffcc00", 22);
          spawnParticles(f.cx, f.cy, "#ffffff", 10);
          scorePopups.push({ x: f.cx, y: f.cy - 22, text: "+150", life: 1.3 });
          gameState.bonusScore += 150;
          floaters.splice(fi, 1);
          break;
        }
      }
    }
  }

  // ── Burst auto-fire: rapid free energy bolts when burst is active ──
  if (gameState.caveBurst > 0) {
    gameState.caveBurstFireTimer -= delta;
    if (gameState.caveBurstFireTimer <= 0) {
      burstBullets.push({ x: helicopter.x + 28, y: helicopter.y + (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 20 });
      gameState.caveBurstFireTimer = 0.055; // ~18 shots/sec
    }
  }
  // Move burst bullets
  for (let bi = burstBullets.length - 1; bi >= 0; bi--) {
    burstBullets[bi].x  += 580 * delta;
    burstBullets[bi].y  += burstBullets[bi].vy * delta;
    if (burstBullets[bi].x > WORLD_WIDTH + 20) burstBullets.splice(bi, 1);
  }
  // Burst bullets destroy all non-special obstacles
  for (let fi = floaters.length - 1; fi >= 0; fi--) {
    const f = floaters[fi];
    if (f.type === "extralife" || f.type === "hoop" || f.type === "missile" || f.type === "caveshield" || f.type === "caveburst" || f.type === "rock" || f.collected) continue;
    for (let bi = burstBullets.length - 1; bi >= 0; bi--) {
      const b = burstBullets[bi];
      if (Math.abs(b.x - f.cx) < f.w / 2 + 10 && Math.abs(b.y - f.cy) < f.h / 2 + 10) {
        spawnParticles(f.cx, f.cy, "#ffcc33", 18);
        spawnParticles(f.cx, f.cy, "#ff8800", 10);
        scorePopups.push({ x: f.cx, y: f.cy - 18, text: "+80", life: 1.0 });
        gameState.bonusScore += 80;
        burstBullets.splice(bi, 1);
        floaters.splice(fi, 1);
        break;
      }
    }
  }

  // Score popups float upward and fade
  for (let i = scorePopups.length - 1; i >= 0; i--) {
    scorePopups[i].y    -= 55 * delta;
    scorePopups[i].life -= delta * 1.4;
    if (scorePopups[i].life <= 0) scorePopups.splice(i, 1);
  }

  // Collisions
  if (gameState.safeTime <= 0 && gameState.hitRecovery <= 0 && collidesWithCave()) {
    registerHit();
  }
  checkFloaterCollisions();

  updateCaveFireBtn();
  updatePauseBtn();
}

// ── DRAW: BACKGROUND ─────────────────────────────────────────────────────────

function drawBackground() {
  const levelColor = LEVEL_DEFS[gameState.levelIndex]?.color || "#4dd9ff";

  // Base gradient — subtly shifted toward level colour at midpoint
  const bg = ctx.createLinearGradient(0, 0, 0, WORLD_HEIGHT);
  bg.addColorStop(0,   C.bgTop);
  bg.addColorStop(0.5, C.bgMid);
  bg.addColorStop(1,   C.bgTop);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  // Level-coloured side glow (left + right edges)
  const sideGlow = ctx.createLinearGradient(0, 0, WORLD_WIDTH, 0);
  sideGlow.addColorStop(0,    `${levelColor}28`);
  sideGlow.addColorStop(0.22, "rgba(0,0,0,0)");
  sideGlow.addColorStop(0.78, "rgba(0,0,0,0)");
  sideGlow.addColorStop(1,    `${levelColor}28`);
  ctx.fillStyle = sideGlow;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  // Grid lines tinted to level colour
  ctx.strokeStyle = `${levelColor}1a`;
  ctx.lineWidth = 1;
  for (let x = 0; x < WORLD_WIDTH; x += 36) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, WORLD_HEIGHT); ctx.stroke();
  }
  for (let y = 0; y < WORLD_HEIGHT; y += 36) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD_WIDTH, y); ctx.stroke();
  }

  // Strong radial glow from centre in level colour
  const vign = ctx.createRadialGradient(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 20, WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 280);
  vign.addColorStop(0,   `${levelColor}30`);
  vign.addColorStop(0.45, `${levelColor}0c`);
  vign.addColorStop(1,   "rgba(0,0,0,0)");
  ctx.fillStyle = vign;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
}

// ── DRAW: CAVE ────────────────────────────────────────────────────────────────

function drawCave() {
  // Outer border glow — level-coloured
  const lvBorder = LEVEL_DEFS[gameState.levelIndex]?.color || "#4dd9ff";
  ctx.strokeStyle = `${lvBorder}70`;
  ctx.lineWidth   = 2;
  ctx.shadowColor = lvBorder;
  ctx.shadowBlur  = 8;
  ctx.strokeRect(8, 8, WORLD_WIDTH - 16, WORLD_HEIGHT - 16);
  ctx.shadowBlur  = 0;

  for (let i = 0; i < cave.ceiling.length; i++) {
    const x       = i * COLUMN_WIDTH - cave.offset;
    if (x > WORLD_WIDTH + COLUMN_WIDTH || x < -COLUMN_WIDTH) continue;

    const ceilH  = cave.ceiling[i];
    const floorY = cave.floor[i];
    const w      = COLUMN_WIDTH + 1;

    // Ceiling gradient (top=dark, bottom=lighter toward opening)
    const cg = ctx.createLinearGradient(0, 8, 0, ceilH);
    cg.addColorStop(0,   C.wallDark);
    cg.addColorStop(0.6, C.wallMid);
    cg.addColorStop(1,   C.wallLight);
    ctx.fillStyle = cg;
    ctx.fillRect(x, 8, w, ceilH - 8);

    // Floor gradient (top=lighter at opening, bottom=dark)
    const fg = ctx.createLinearGradient(0, floorY, 0, WORLD_HEIGHT - 8);
    fg.addColorStop(0,   C.wallLight);
    fg.addColorStop(0.4, C.wallMid);
    fg.addColorStop(1,   C.wallDark);
    ctx.fillStyle = fg;
    ctx.fillRect(x, floorY, w, WORLD_HEIGHT - floorY - 8);

    // Edge glow strip — tinted to current level colour
    const lvColor = LEVEL_DEFS[gameState.levelIndex]?.color || "#4dd9ff";
    ctx.shadowColor = lvColor;
    ctx.shadowBlur  = 6;
    ctx.fillStyle = lvColor + "66";
    ctx.fillRect(x, ceilH - 3, w, 3);
    ctx.fillRect(x, floorY,    w, 3);
    ctx.shadowBlur = 0;

    // Horizontal scan lines (texture)
    ctx.fillStyle = "rgba(0,0,0,0.07)";
    for (let y = 10; y < ceilH - 2; y += 11) ctx.fillRect(x, y, w, 2);
    for (let y = floorY + 5; y < WORLD_HEIGHT - 10; y += 11) ctx.fillRect(x, y, w, 2);
  }
}

// ── DRAW: FLOATERS ────────────────────────────────────────────────────────────

function drawHoop(f) {
  // PTI Logo collectible
  ctx.save();
  ctx.translate(f.cx, f.cy);
  const r     = f.radius;
  const pulse = 0.7 + 0.3 * Math.sin(f.phase * 2.8);
  const size  = r * 2.6;

  // Gold pulsing glow ring behind logo
  ctx.shadowColor = "#ffd700";
  ctx.shadowBlur  = 28 * pulse;
  ctx.strokeStyle = `rgba(255,215,0,${0.35 * pulse})`;
  ctx.lineWidth   = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, r + 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  if (ptiLogoReady) {
    // Invert the black-on-white logo → white-on-black, then screen-composite
    // so the black bg vanishes and the white logo glows on the cave
    ctx.shadowColor = "#ffd700";
    ctx.shadowBlur  = 18 * pulse;
    ctx.filter      = "invert(1) sepia(1) saturate(4) hue-rotate(5deg)";
    ctx.globalCompositeOperation = "screen";
    ctx.drawImage(ptiLogoImg, -size / 2, -size / 2, size, size);
    ctx.globalCompositeOperation = "source-over";
    ctx.filter      = "none";
    ctx.shadowBlur  = 0;
  } else {
    // Fallback gold circle until image loads
    const coinG = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
    coinG.addColorStop(0,   "#fff0a0");
    coinG.addColorStop(0.5, "#ffd700");
    coinG.addColorStop(1,   "#7a5800");
    ctx.fillStyle = coinG;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawTshirt(f) {
  // Redrawn as a DTF Transfer Film Sheet — shiny iridescent film with a printed design
  ctx.save();
  ctx.translate(f.cx, f.cy);
  ctx.rotate(f.rotation);

  const w = f.w, h = f.h;
  const hw = w / 2, hh = h / 2;

  ctx.shadowColor = "#ff6ec7";
  ctx.shadowBlur  = 18;

  // Film sheet body — slightly translucent with iridescent sheen
  const filmG = ctx.createLinearGradient(-hw, -hh, hw, hh);
  filmG.addColorStop(0,    "#ffe8f8");
  filmG.addColorStop(0.25, "#c8f0ff");
  filmG.addColorStop(0.5,  "#fff0c0");
  filmG.addColorStop(0.75, "#e0c8ff");
  filmG.addColorStop(1,    "#ffe8c8");
  ctx.fillStyle = filmG;
  if (ctx.roundRect) {
    ctx.beginPath(); ctx.roundRect(-hw, -hh, w, h, 4); ctx.fill();
  } else { ctx.fillRect(-hw, -hh, w, h); }

  ctx.shadowBlur = 0;

  // Iridescent shimmer overlay
  const shimG = ctx.createLinearGradient(-hw, 0, hw, 0);
  shimG.addColorStop(0,    "rgba(255,255,255,0)");
  shimG.addColorStop(0.35, "rgba(255,255,255,0.38)");
  shimG.addColorStop(0.5,  "rgba(255,255,255,0.12)");
  shimG.addColorStop(1,    "rgba(255,255,255,0)");
  ctx.fillStyle = shimG;
  if (ctx.roundRect) {
    ctx.beginPath(); ctx.roundRect(-hw, -hh, w, h, 4); ctx.fill();
  } else { ctx.fillRect(-hw, -hh, w, h); }

  // Film border / edge
  ctx.strokeStyle = "rgba(180,140,220,0.7)";
  ctx.lineWidth   = 1.2;
  if (ctx.roundRect) {
    ctx.beginPath(); ctx.roundRect(-hw, -hh, w, h, 4); ctx.stroke();
  } else { ctx.strokeRect(-hw, -hh, w, h); }

  // Printed design area (simulated CMYK dots pattern)
  const dotColors = ["#ff2255","#00ccff","#ffcc00","#222222"];
  for (let di = 0; di < 12; di++) {
    const dx = -hw + 8 + (di % 4) * (w - 16) / 3;
    const dy = -hh * 0.3 + Math.floor(di / 4) * hh * 0.35;
    ctx.fillStyle = dotColors[di % 4];
    ctx.globalAlpha = 0.55;
    ctx.beginPath(); ctx.arc(dx, dy, 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // "PRESS" label — brand identity
  ctx.fillStyle    = "rgba(80,20,80,0.85)";
  ctx.font         = `bold ${Math.floor(h * 0.19)}px Trebuchet MS`;
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("PRESS", 0, hh * 0.45);
  ctx.textBaseline = "alphabetic";

  // Peel corner effect (top-right)
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.beginPath();
  ctx.moveTo(hw - 10, -hh); ctx.lineTo(hw, -hh); ctx.lineTo(hw, -hh + 10);
  ctx.closePath(); ctx.fill();

  ctx.restore();
}

function drawVinylRoll(f) {
  // Redrawn as an Ink Drum — industrial printing ink barrel
  ctx.save();
  ctx.translate(f.cx, f.cy);
  ctx.rotate(f.rotation);

  const w = f.w, h = f.h, r = h / 2;
  const rx = w / 2;

  ctx.shadowColor = "#ff6600";
  ctx.shadowBlur  = 16;

  // Barrel body — dark metallic with ink colour band
  const bodyG = ctx.createLinearGradient(0, -r, 0, r);
  bodyG.addColorStop(0,    "#6a6a7a");
  bodyG.addColorStop(0.2,  "#c0c0cc");
  bodyG.addColorStop(0.5,  "#8a8a9a");
  bodyG.addColorStop(0.8,  "#555566");
  bodyG.addColorStop(1,    "#222230");
  ctx.fillStyle = bodyG;
  ctx.fillRect(-rx, -r, w, h);
  ctx.shadowBlur = 0;

  // Bright ink colour stripe around middle third
  const inkColor = ["#ff2255","#00ccff","#ffcc00","#333333","#ff6600"][Math.floor(f.phase * 0.3) % 5];
  ctx.fillStyle = inkColor;
  ctx.globalAlpha = 0.82;
  ctx.fillRect(-rx, -r * 0.28, w, r * 0.56);
  ctx.globalAlpha = 1;

  // Horizontal barrel rib lines
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth   = 1;
  for (const ry of [-r * 0.55, -r * 0.15, r * 0.15, r * 0.55]) {
    ctx.beginPath(); ctx.moveTo(-rx, ry); ctx.lineTo(rx, ry); ctx.stroke();
  }

  // End caps (left + right)
  for (const ex of [-rx, rx]) {
    const capG = ctx.createRadialGradient(ex, -r * 0.2, 0, ex, 0, r);
    capG.addColorStop(0,   "#aaaabc");
    capG.addColorStop(0.6, "#606070");
    capG.addColorStop(1,   "#1a1a28");
    ctx.fillStyle = capG;
    ctx.beginPath();
    ctx.ellipse(ex, 0, 7, r, 0, 0, Math.PI * 2);
    ctx.fill();
    // Bolt marks on cap
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth   = 0.8;
    ctx.beginPath(); ctx.ellipse(ex, 0, 5, r * 0.7, 0, 0, Math.PI * 2); ctx.stroke();
  }

  // "INK" label
  ctx.fillStyle    = "rgba(255,255,255,0.92)";
  ctx.font         = `bold ${Math.floor(h * 0.32)}px Trebuchet MS`;
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor  = "rgba(0,0,0,0.7)";
  ctx.shadowBlur   = 4;
  ctx.fillText("INK", 0, 0);
  ctx.shadowBlur   = 0;
  ctx.textBaseline = "alphabetic";

  ctx.restore();
}

function drawHeatPress(f) {
  const oscY = Math.sin(f.phase * 2.2) * 9;
  ctx.save();
  ctx.translate(f.cx, f.cy + oscY);

  const w = f.w, h = f.h;

  ctx.shadowColor = C.obstGlow;
  ctx.shadowBlur  = 14;

  // Press head with metallic gradient
  const grad = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  grad.addColorStop(0,   "#777");
  grad.addColorStop(0.3, C.obstFill);
  grad.addColorStop(0.7, C.obstFill);
  grad.addColorStop(1,   "#444");
  ctx.fillStyle = grad;

  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 5);
    ctx.fill();
  } else {
    ctx.fillRect(-w / 2, -h / 2, w, h);
  }

  // Heating element lines
  ctx.shadowBlur  = 0;
  ctx.strokeStyle = "rgba(255,80,0,0.65)";
  ctx.lineWidth   = 2;
  for (let lx = -w / 2 + 7; lx < w / 2 - 4; lx += 9) {
    ctx.beginPath();
    ctx.moveTo(lx, -h / 2 + 4);
    ctx.lineTo(lx, h / 2 - 4);
    ctx.stroke();
  }

  // Steam dots
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  for (let s = 0; s < 3; s++) {
    const sx  = -10 + s * 10;
    const sy  = -h / 2 - 7 - Math.abs(Math.sin(f.phase * 3.5 + s)) * 7;
    ctx.beginPath();
    ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawExtraLife(f) {
  ctx.save();
  ctx.translate(f.cx, f.cy);

  const pulse = 0.7 + 0.3 * Math.sin(f.phase * 3);
  ctx.shadowColor = "#ff2244";
  ctx.shadowBlur  = 20 * pulse;

  // Heart shape using parametric curve
  const r = 11;
  const sx = r / 16, sy = r / 13;
  ctx.beginPath();
  for (let i = 0; i <= 63; i++) {
    const t = (i / 63) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3) * sx;
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)) * sy;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();

  // Fill: red gradient
  const hg = ctx.createRadialGradient(-r*0.2, -r*0.4, 0, 0, 0, r * 1.1);
  hg.addColorStop(0,   "#ff6680");
  hg.addColorStop(0.5, "#ee1133");
  hg.addColorStop(1,   "#aa0022");
  ctx.fillStyle = hg;
  ctx.fill();

  // Highlight glint
  ctx.shadowBlur = 0;
  ctx.fillStyle  = "rgba(255,255,255,0.35)";
  ctx.beginPath();
  ctx.ellipse(-r * 0.3, -r * 0.55, r * 0.25, r * 0.14, -0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawDrone(f) {
  ctx.save();
  ctx.translate(f.cx, f.cy);

  const pulse = Math.sin(f.phase * 5) * 0.5 + 0.5;
  const rotorSpin = f.phase * 8;

  ctx.shadowColor = "#ff4757";
  ctx.shadowBlur  = 8 + pulse * 6;

  // 4 diagonal arms
  const armLen = 14;
  const armDirs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  ctx.strokeStyle = "#44445a";
  ctx.lineWidth   = 1.5;
  for (const [dx, dy] of armDirs) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(dx * armLen, dy * armLen * 0.7);
    ctx.stroke();
  }

  // Rotor blur discs at arm tips
  for (const [dx, dy] of armDirs) {
    const rx = dx * armLen, ry = dy * armLen * 0.7;
    // Blur disc
    ctx.strokeStyle = `rgba(180,190,220,${0.25 + pulse * 0.2})`;
    ctx.lineWidth   = 1;
    ctx.beginPath(); ctx.arc(rx, ry, 6, 0, Math.PI * 2); ctx.stroke();
    // Two crossing blade lines
    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(rotorSpin);
    ctx.strokeStyle = `rgba(200,210,240,${0.55 + pulse * 0.25})`;
    ctx.lineWidth   = 1.2;
    ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(5, 0); ctx.stroke();
    ctx.rotate(Math.PI / 2);
    ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(5, 0); ctx.stroke();
    ctx.restore();
  }

  // Central body — small hexagonal shape
  ctx.fillStyle = "#22223a";
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
    const r = 6;
    i === 0 ? ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath(); ctx.fill();

  // Body rim
  ctx.strokeStyle = "#55557a";
  ctx.lineWidth   = 1;
  ctx.stroke();

  // Pulsing red camera/LED dot
  ctx.fillStyle = `rgba(255,71,87,${0.6 + pulse * 0.4})`;
  ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2); ctx.fill();

  // Small package hanging below
  ctx.fillStyle = "#c9a84c";
  ctx.fillRect(-4, 7, 8, 5);
  ctx.strokeStyle = "#8a7030";
  ctx.lineWidth   = 0.8;
  ctx.strokeRect(-4, 7, 8, 5);
  // String
  ctx.strokeStyle = "rgba(200,180,100,0.6)";
  ctx.lineWidth   = 0.8;
  ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(0, 7); ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawMissilePickup(f) {
  ctx.save();
  ctx.translate(f.cx, f.cy);

  // Outer glow pulse
  const pulse = 0.72 + 0.28 * Math.sin(f.phase * 3.5);
  ctx.shadowColor = "#ff9900";
  ctx.shadowBlur  = 14 * pulse;

  // Body — horizontal missile shape
  const bodyG = ctx.createLinearGradient(-16, -5, 16, 5);
  bodyG.addColorStop(0,   "#888888");
  bodyG.addColorStop(0.4, "#dddddd");
  bodyG.addColorStop(1,   "#555555");
  ctx.fillStyle = bodyG;
  ctx.beginPath();
  if (ctx.roundRect) { ctx.roundRect(-15, -5, 24, 10, 4); } else { ctx.rect(-15, -5, 24, 10); }
  ctx.fill();

  // Warhead (nose cone, right)
  ctx.fillStyle = "#ff5500";
  ctx.beginPath();
  ctx.moveTo(9, -5); ctx.lineTo(17, 0); ctx.lineTo(9, 5);
  ctx.closePath(); ctx.fill();

  // Red centre band
  ctx.fillStyle = "rgba(255,40,0,0.75)";
  ctx.fillRect(2, -5, 5, 10);

  // Tail fins (left)
  ctx.fillStyle = "#777777";
  ctx.beginPath(); ctx.moveTo(-15, -5); ctx.lineTo(-20, -10); ctx.lineTo(-14, -5); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-15,  5); ctx.lineTo(-20,  10); ctx.lineTo(-14,  5); ctx.closePath(); ctx.fill();

  // Exhaust flame
  const flicker = 0.6 + 0.4 * Math.sin(f.phase * 14);
  const flameG  = ctx.createLinearGradient(-15, 0, -26 * flicker, 0);
  flameG.addColorStop(0,   "rgba(255,160,30,0.9)");
  flameG.addColorStop(0.5, "rgba(255,80,0,0.6)");
  flameG.addColorStop(1,   "rgba(255,60,0,0)");
  ctx.fillStyle = flameG;
  ctx.beginPath(); ctx.ellipse(-19, 0, 8 * flicker, 3, 0, 0, Math.PI * 2); ctx.fill();

  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawInkBlob(f) {
  ctx.save();
  ctx.translate(f.cx, f.cy);
  ctx.rotate(f.rotation);

  const col = f.color || "#ff2255";
  ctx.shadowColor = col;
  ctx.shadowBlur  = 16;

  // Organic ink splat — main blob with 6 rounded protrusions
  ctx.fillStyle = col;
  ctx.beginPath();
  const spikes = 7;
  for (let i = 0; i <= spikes * 2; i++) {
    const angle = (i / (spikes * 2)) * Math.PI * 2;
    // Alternate between outer blob radius and inner dip
    const r = i % 2 === 0 ? 18 + Math.sin(f.phase * 2 + i) * 3 : 11 + Math.sin(f.phase * 3 + i) * 2;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  // Highlight sheen
  ctx.shadowBlur = 0;
  const sG = ctx.createRadialGradient(-5, -6, 1, 0, 0, 18);
  sG.addColorStop(0,   "rgba(255,255,255,0.42)");
  sG.addColorStop(0.4, "rgba(255,255,255,0.10)");
  sG.addColorStop(1,   "rgba(0,0,0,0.18)");
  ctx.fillStyle = sG;
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.fill();

  // Small drip drops
  for (let d = 0; d < 3; d++) {
    const da = (d / 3) * Math.PI * 2 + f.phase * 0.5;
    ctx.fillStyle = col;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(Math.cos(da) * 22, Math.sin(da) * 22 + 4, 3 + d, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.restore();
}

function drawCaveShieldPickup(f) {
  ctx.save();
  ctx.translate(f.cx, f.cy);
  ctx.rotate(f.rotation);
  const pulse = 0.7 + 0.3 * Math.sin(f.phase * 3.2);
  ctx.shadowColor = "#50c8ff";
  ctx.shadowBlur  = 18 * pulse;
  // Outer hex ring
  ctx.strokeStyle = "#50c8ff";
  ctx.lineWidth   = 2;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
    i === 0 ? ctx.moveTo(Math.cos(a)*13, Math.sin(a)*13) : ctx.lineTo(Math.cos(a)*13, Math.sin(a)*13);
  }
  ctx.closePath(); ctx.stroke();
  // Inner shield icon
  ctx.fillStyle = "rgba(80,200,255,0.18)";
  ctx.fill();
  ctx.fillStyle = "#aaeeff";
  ctx.font = "bold 13px Trebuchet MS";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("🛡", 0, 0);
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawCaveBurstPickup(f) {
  ctx.save();
  ctx.translate(f.cx, f.cy);
  ctx.rotate(f.rotation);
  const pulse = 0.7 + 0.3 * Math.sin(f.phase * 3.8);
  ctx.shadowColor = "#ffcc33";
  ctx.shadowBlur  = 18 * pulse;
  // Star burst ring
  ctx.strokeStyle = "#ffcc33";
  ctx.lineWidth   = 2;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const r = i % 2 === 0 ? 13 : 8;
    i === 0 ? ctx.moveTo(Math.cos(a)*r, Math.sin(a)*r) : ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
  }
  ctx.closePath(); ctx.stroke();
  ctx.fillStyle = "rgba(255,200,40,0.15)";
  ctx.fill();
  ctx.fillStyle = "#ffe080";
  ctx.font = "bold 13px Trebuchet MS";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("⚡", 0, 0);
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawRock(f) {
  const { cx, cy, w, h, fromTop, jitterPts } = f;
  const left  = cx - w / 2;
  const right = cx + w / 2;
  const wallY = fromTop ? cy - h / 2 : cy + h / 2; // attached to cave wall
  const tipY  = fromTop ? cy + h / 2 : cy - h / 2; // jagger edge into the gap
  const cols  = jitterPts ? jitterPts.length - 1 : 7;
  const lvColor = LEVEL_DEFS[gameState.levelIndex]?.color || "#4dd9ff";

  // Build jagged tip profile
  const pts = [];
  for (let i = 0; i <= cols; i++) {
    const t  = i / cols;
    const px = left + t * w;
    pts.push({ x: px, y: tipY + (jitterPts ? jitterPts[i] : 0) });
  }

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(left, wallY);
  for (const p of pts) ctx.lineTo(p.x, p.y);
  ctx.lineTo(right, wallY);
  ctx.closePath();

  // Same gradient direction as the cave wall it grows from
  const g0 = fromTop ? wallY : tipY;
  const g1 = fromTop ? tipY  : wallY;
  const grad = ctx.createLinearGradient(0, g0, 0, g1);
  if (fromTop) {
    grad.addColorStop(0,   C.wallDark);
    grad.addColorStop(0.6, C.wallMid);
    grad.addColorStop(1,   C.wallLight);
  } else {
    grad.addColorStop(0,   C.wallLight);
    grad.addColorStop(0.4, C.wallMid);
    grad.addColorStop(1,   C.wallDark);
  }
  ctx.fillStyle = grad;
  ctx.fill();

  // Scan lines — same texture as cave walls
  ctx.fillStyle = "rgba(0,0,0,0.07)";
  const scanStep = 11;
  const yMin = Math.min(wallY, tipY);
  const yMax = Math.max(wallY, tipY);
  for (let y = yMin + 3; y < yMax - 2; y += scanStep) {
    ctx.fillRect(left, y, w, 2);
  }

  // Bright level-coloured glow strip along the jagged tip edge — same as cave edge strips
  ctx.shadowColor = lvColor;
  ctx.shadowBlur  = 8;
  ctx.strokeStyle = lvColor + "cc";
  ctx.lineWidth   = 3;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i <= cols; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.restore();
}

function drawFloaters() {
  for (const f of floaters) {
    if (f.collected) continue;
    if      (f.type === "hoop")        drawHoop(f);
    else if (f.type === "tshirt")      drawTshirt(f);
    else if (f.type === "vinyl")       drawVinylRoll(f);
    else if (f.type === "heatpress")   drawHeatPress(f);
    else if (f.type === "extralife")   drawExtraLife(f);
    else if (f.type === "drone")       drawDrone(f);
    else if (f.type === "missile")     drawMissilePickup(f);
    else if (f.type === "inkblob")     drawInkBlob(f);
    else if (f.type === "caveshield")  drawCaveShieldPickup(f);
    else if (f.type === "caveburst")   drawCaveBurstPickup(f);
    else if (f.type === "rock")        drawRock(f);
  }
}

// ── DRAW: PARTICLES ───────────────────────────────────────────────────────────

function drawParticles() {
  for (const p of particles) {
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle   = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ── DRAW: HELICOPTER ──────────────────────────────────────────────────────────

function drawSmoke() {
  for (const sp of smokePuffs) {
    const t     = sp.age / sp.maxAge;           // 0 = fresh, 1 = gone
    // Brief fade-in, then fade-out
    const alpha = t < 0.2 ? (t / 0.2) * 0.52 : 0.52 * (1 - (t - 0.2) / 0.8);
    const size  = sp.size0 + t * 18;            // blob expands as it ages
    const grey  = Math.floor(110 + t * 95);     // starts darker, whitens as it disperses
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillStyle   = `rgb(${grey},${grey + 8},${grey + 14})`;
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawHelicopter() {
  drawSmoke();

  const hx = helicopter.x;
  const hy = helicopter.y;

  // Ground shadow
  const bnd     = getCaveBoundsAtX(hx);
  const shadowY = Math.min(hy + 52, bnd.floor - 10);
  const shadowA = Math.max(0, 0.22 * (1 - (shadowY - hy) / 65));
  ctx.save();
  ctx.globalAlpha = shadowA;
  ctx.fillStyle   = "#000";
  ctx.beginPath();
  ctx.ellipse(hx + 4, shadowY, 20, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Cave shield aura — blue pulsing ring around helicopter
  if (gameState.caveShield > 0) {
    const sp = 0.65 + 0.35 * Math.sin(performance.now() / 120);
    ctx.save();
    ctx.strokeStyle = "#50c8ff";
    ctx.lineWidth   = 3;
    ctx.globalAlpha = 0.55 + 0.3 * sp;
    ctx.shadowColor = "#50c8ff";
    ctx.shadowBlur  = 20;
    ctx.beginPath(); ctx.arc(hx, hy, 32 + sp * 4, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  // Cave burst aura — gold lightning ring
  if (gameState.caveBurst > 0) {
    const bp = 0.65 + 0.35 * Math.sin(performance.now() / 80);
    ctx.save();
    ctx.strokeStyle = "#ffcc33";
    ctx.lineWidth   = 2.5;
    ctx.globalAlpha = 0.55 + 0.3 * bp;
    ctx.shadowColor = "#ffcc33";
    ctx.shadowBlur  = 22;
    ctx.beginPath(); ctx.arc(hx, hy, 28 + bp * 5, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(clamp(helicopter.velocityY / 320, -0.48, 0.52));
  ctx.scale(-1, 1); // flip so nose faces right (direction of travel)

  if (gameState.hitRecovery > 0 && Math.floor(gameState.hitRecovery * 12) % 2 === 0) {
    ctx.globalAlpha = 0.38;
  }

  // ── Tail boom (draw first, behind fuselage) ──
  const tailG = ctx.createLinearGradient(14, 0, 44, 0);
  tailG.addColorStop(0, "#d8d8d8");
  tailG.addColorStop(1, "#505050");
  ctx.fillStyle = tailG;
  ctx.beginPath();
  ctx.moveTo(14, -3); ctx.lineTo(44, -1); ctx.lineTo(44, 2); ctx.lineTo(14, 5);
  ctx.closePath(); ctx.fill();

  // ── Tail fin (vertical stabiliser) ──
  ctx.fillStyle = "#222222";
  ctx.beginPath();
  ctx.moveTo(38, -1); ctx.lineTo(44, -13); ctx.lineTo(46, -12); ctx.lineTo(41, -1);
  ctx.closePath(); ctx.fill();

  // ── Tail rotor ──
  ctx.save();
  ctx.translate(44, -7);
  for (let tr = 0; tr < 2; tr++) {
    ctx.save();
    ctx.rotate(helicopter.rotor * 3.2 + tr * Math.PI / 2);
    ctx.globalAlpha = 0.7 - tr * 0.2;
    ctx.strokeStyle = "#111111";
    ctx.lineWidth   = 2;
    ctx.lineCap     = "round";
    ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(0, 7); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  // ── Main fuselage — teardrop shape ──
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur  = 7;
  const fuseG = ctx.createLinearGradient(-2, -13, 6, 13);
  fuseG.addColorStop(0,   "#ffffff");
  fuseG.addColorStop(0.45, "#c8c8c8");
  fuseG.addColorStop(1,   "#686868");
  ctx.fillStyle = fuseG;
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.bezierCurveTo(18, -11,  4, -13, -10, -12);
  ctx.bezierCurveTo(-20, -11, -24,  -7, -24,  0);
  ctx.bezierCurveTo(-24,   7, -20,  11, -10,  12);
  ctx.bezierCurveTo(  4,  13,  18,  11,  18,   0);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Fuselage outline
  ctx.strokeStyle = "rgba(0,0,0,0.28)";
  ctx.lineWidth   = 1;
  ctx.stroke();

  // ── Side stripe (black) ──
  ctx.strokeStyle = "#111111";
  ctx.lineWidth   = 2.5;
  ctx.beginPath();
  ctx.moveTo(-18, 4); ctx.bezierCurveTo(-8, 7, 6, 7, 14, 4);
  ctx.stroke();

  // ── Cockpit bubble — dark tinted glass ──
  const ckG = ctx.createRadialGradient(-1, -7, 1, 2, -4, 14);
  ckG.addColorStop(0,    "rgba(200,200,200,0.90)");
  ckG.addColorStop(0.45, "rgba(80,80,80,0.82)");
  ckG.addColorStop(1,    "rgba(10,10,10,0.75)");
  ctx.fillStyle = ckG;
  ctx.beginPath();
  ctx.ellipse(2, -3, 13, 9, -0.12, 0, Math.PI * 2);
  ctx.fill();

  // Cockpit frame
  ctx.strokeStyle = "rgba(0,0,0,0.45)";
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.ellipse(2, -3, 13, 9, -0.12, 0, Math.PI * 2);
  ctx.stroke();

  // Glint 1 (main)
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.beginPath(); ctx.ellipse(-3, -7, 5, 2.5, -0.35, 0, Math.PI * 2); ctx.fill();
  // Glint 2 (small secondary)
  ctx.fillStyle = "rgba(255,255,255,0.38)";
  ctx.beginPath(); ctx.ellipse(5, -5, 2.5, 1.2, 0.2, 0, Math.PI * 2); ctx.fill();

  // ── Landing skids (black) ──
  ctx.strokeStyle = "#111111";
  ctx.lineWidth   = 2.5;
  ctx.lineCap     = "round";
  ctx.beginPath(); ctx.moveTo(-16, 14); ctx.lineTo(10, 14); ctx.stroke();

  // Struts
  ctx.strokeStyle = "#333333";
  ctx.lineWidth   = 1.5;
  ctx.beginPath(); ctx.moveTo(-10, 9); ctx.lineTo(-12, 14); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(4,   8); ctx.lineTo(6,   14); ctx.stroke();

  // ── Main rotor mast ──
  ctx.fillStyle = "#111111";
  ctx.fillRect(-2, -15, 4, 4);

  // ── Main rotor ──
  ctx.save();
  ctx.translate(0, -13);

  const rotAngle = helicopter.rotor * -5.5;
  const BLADES   = 3;

  // Rotor disk — semi-transparent blur effect giving a spinning appearance
  const diskG = ctx.createRadialGradient(0, 0, 3, 0, 0, 30);
  diskG.addColorStop(0,   "rgba(200,220,255,0.14)");
  diskG.addColorStop(0.6, "rgba(160,200,255,0.08)");
  diskG.addColorStop(1,   "rgba(100,160,255,0.0)");
  ctx.fillStyle = diskG;
  ctx.beginPath();
  ctx.arc(0, 0, 30, 0, Math.PI * 2);
  ctx.fill();

  // Subtle cyan tip-trace ring
  ctx.strokeStyle = "rgba(77,217,255,0.18)";
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 28, 0, Math.PI * 2);
  ctx.stroke();

  // Blades — 3 swept blades, flat underside / curved top
  for (let bl = 0; bl < BLADES; bl++) {
    ctx.save();
    ctx.rotate(rotAngle + bl * (Math.PI * 2 / BLADES));

    // Blade gradient: pale grey root → dark charcoal tip, cyan accent
    const bg = ctx.createLinearGradient(2, 0, 28, 0);
    bg.addColorStop(0,    "#d8dde8");
    bg.addColorStop(0.35, "#9aaabb");
    bg.addColorStop(0.75, "#3c4a5e");
    bg.addColorStop(1,    "#4dd9ff");   // cyan tip
    ctx.fillStyle = bg;

    // Swept blade — flat underside, curved top, tapered to tip
    ctx.beginPath();
    ctx.moveTo(2,  2.2);                                      // root trailing
    ctx.lineTo(2, -2.2);                                      // root leading
    ctx.bezierCurveTo(8, -2.8, 18, -2.0, 27, -0.7);          // leading edge curve (swept)
    ctx.lineTo(28.5, 0);                                      // tip
    ctx.bezierCurveTo(18,  0.6,  8,  1.6,  2,  2.2);         // trailing taper
    ctx.closePath();
    ctx.fill();

    // Leading-edge glint
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth   = 0.7;
    ctx.beginPath();
    ctx.moveTo(2, -2.1);
    ctx.bezierCurveTo(8, -2.6, 18, -1.9, 27, -0.6);
    ctx.stroke();

    // Cyan tip glow
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = "#4dd9ff";
    ctx.lineWidth   = 1.2;
    ctx.beginPath();
    ctx.arc(27, 0, 1.8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  // Spinner cap — gold/bronze domed hub
  const hubG = ctx.createRadialGradient(-2, -2, 0, 0, 0, 7);
  hubG.addColorStop(0,   "#ffe080");
  hubG.addColorStop(0.4, "#c9a84c");
  hubG.addColorStop(1,   "#5a3d00");
  ctx.globalAlpha = 1;
  ctx.fillStyle   = hubG;
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.arc(0, 0, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Hub centre bolt
  ctx.fillStyle = "#1a1000";
  ctx.beginPath();
  ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  ctx.restore();
}

// ── DRAW: SCORE POPUPS ────────────────────────────────────────────────────────

function drawScorePopups() {
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  for (const p of scorePopups) {
    // Pick colour by content
    let col = C.hoopStroke;
    if (p.text.includes("LIFE"))   col = "#ff4466";
    else if (p.text.includes("+")) col = "#c9a84c";
    else if (p.text.includes("SHIELD")) col = "#50c8ff";
    else if (p.text.includes("BURST"))   col = "#ffcc33";
    else if (p.text.includes("MISSILE")) col = "#ff9900";
    // Size scales with life remaining (pops in big, then settles)
    const scale = 0.85 + Math.min(0.15, p.life * 0.1);
    ctx.save();
    ctx.globalAlpha  = Math.min(1, p.life * 2);
    ctx.fillStyle    = col;
    ctx.font         = `bold ${Math.round(16 * scale)}px Trebuchet MS`;
    ctx.shadowColor  = col;
    ctx.shadowBlur   = 12;
    ctx.fillText(p.text, p.x, p.y);
    ctx.restore();
  }
}

// ── DRAW: LEVEL BANNER ────────────────────────────────────────────────────────

function drawBanner() {
  if (!banner.active || banner.alpha <= 0) return;
  const def = banner.def;

  ctx.save();
  ctx.globalAlpha = banner.alpha;

  // Background bar — taller to fit instruction line
  ctx.fillStyle = C.bannerBg;
  ctx.fillRect(0, WORLD_HEIGHT / 2 - 66, WORLD_WIDTH, 132);

  // Accent lines
  ctx.fillStyle   = def.color;
  ctx.globalAlpha = banner.alpha * 0.8;
  ctx.fillRect(0, WORLD_HEIGHT / 2 - 66, WORLD_WIDTH, 2);
  ctx.fillRect(0, WORLD_HEIGHT / 2 + 64, WORLD_WIDTH, 2);
  ctx.globalAlpha = banner.alpha;

  // Level name
  ctx.fillStyle    = def.color;
  ctx.font         = "bold 26px Trebuchet MS";
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor  = def.color;
  ctx.shadowBlur   = 12;
  ctx.fillText(def.name.toUpperCase(), WORLD_WIDTH / 2, WORLD_HEIGHT / 2 - 22);

  // Subtitle
  ctx.shadowBlur = 0;
  ctx.fillStyle  = "rgba(255,255,255,0.8)";
  ctx.font       = "bold 15px Trebuchet MS";
  ctx.fillText(def.subtitle, WORLD_WIDTH / 2, WORLD_HEIGHT / 2 + 6);

  // Instruction (what to actually do)
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font      = "13px Trebuchet MS";
  ctx.fillText(def.instruction, WORLD_WIDTH / 2, WORLD_HEIGHT / 2 + 32);

  ctx.restore();
}

function drawLevelTip() {
  if (gameState.status !== "running" || gameState.levelTipTimer <= 0) return;
  if (banner.active) return; // don't overlap with the transition banner

  const def   = LEVEL_DEFS[gameState.levelIndex];
  const alpha = Math.min(1, gameState.levelTipTimer / 1.5) * 0.88;

  ctx.save();
  ctx.globalAlpha  = alpha;

  // Pill background
  const pillW = WORLD_WIDTH - 32;
  const pillH = 28;
  const pillX = 16;
  const pillY = WORLD_HEIGHT - 48;

  ctx.fillStyle = "rgba(7,16,24,0.82)";
  if (ctx.roundRect) {
    ctx.beginPath(); ctx.roundRect(pillX, pillY, pillW, pillH, 14); ctx.fill();
  } else {
    ctx.fillRect(pillX, pillY, pillW, pillH);
  }

  // Accent left bar
  ctx.fillStyle = def.color;
  ctx.fillRect(pillX, pillY + 6, 3, pillH - 12);

  // Instruction text
  ctx.fillStyle    = "rgba(255,255,255,0.85)";
  ctx.font         = "12px Trebuchet MS";
  ctx.textAlign    = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(def.instruction, pillX + 12, pillY + pillH / 2);

  ctx.restore();
}

// ── DRAW: LEVEL PROGRESS BAR ─────────────────────────────────────────────────

function drawLevelProgressBar() {
  if (gameState.status !== "running") return;
  const def  = LEVEL_DEFS[gameState.levelIndex];
  const barX = 16, barY = 14, barW = WORLD_WIDTH - 32, barH = 7;

  // Track
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  if (ctx.roundRect) {
    ctx.beginPath(); ctx.roundRect(barX, barY, barW, barH, 4); ctx.fill();
  } else {
    ctx.fillRect(barX, barY, barW, barH);
  }

  const nextDef    = LEVEL_DEFS[gameState.levelIndex + 1];
  const levelScore = Math.floor(gameState.distance / 6);
  const progress   = Math.min(1, levelScore / def.completionScore);
  const fillW      = Math.max(4, barW * progress);

  // Fill gradient
  const grad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
  grad.addColorStop(0, def.color);
  grad.addColorStop(1, "rgba(255,255,255,0.9)");
  ctx.fillStyle   = grad;
  ctx.shadowColor = def.color;
  ctx.shadowBlur  = 6;
  if (ctx.roundRect) {
    ctx.beginPath(); ctx.roundRect(barX, barY, fillW, barH, 4); ctx.fill();
  } else {
    ctx.fillRect(barX, barY, fillW, barH);
  }
  ctx.shadowBlur = 0;

  const remaining = Math.max(0, def.completionScore - levelScore);
  ctx.textBaseline = "top";

  // Current level label — left, in level colour
  const shortLabel = def.name.replace(/^Level \d+ — /, '');
  ctx.font      = "bold 10px Trebuchet MS";
  ctx.fillStyle = def.color;
  ctx.textAlign = "left";
  ctx.fillText(`LV ${def.id} — ${shortLabel}`, barX, barY + barH + 3);

  // Distance to next level — right, dimmed
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font      = "10px Trebuchet MS";
  ctx.textAlign = "right";
  if (nextDef) {
    const nextShort = nextDef.name.replace(/^Level \d+ — /, '');
    ctx.fillText(`${remaining} pts → LV ${nextDef.id} ${nextShort}`, barX + barW, barY + barH + 3);
  } else {
    ctx.fillText(`${remaining} pts to finish`, barX + barW, barY + barH + 3);
  }
}

// ── DRAW: HUD PROMPT ─────────────────────────────────────────────────────────

function drawPrompt() {
  if (gameState.status !== "running" || gameState.displayedScore > 20) return;
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font      = "14px Trebuchet MS";
  ctx.textAlign = "left";
  ctx.fillText("Hold to rise · Release to fall", 52, 44);
}

// ── DRAW: HOOP COUNTER (in-canvas) ────────────────────────────────────────────

function drawHoopCounter() {
  if (gameState.status !== "running" || gameState.level < 1) return;
  if (gameState.hoopsCollected === 0) return;

  ctx.save();
  ctx.fillStyle    = C.hoopStroke;
  ctx.font         = "bold 12px Trebuchet MS";
  ctx.textAlign    = "right";
  ctx.textBaseline = "top";
  ctx.shadowColor  = C.hoopStroke;
  ctx.shadowBlur   = 8;
  ctx.fillText(`🪙 ×${gameState.hoopsCollected}`, WORLD_WIDTH - 16, 36);
  ctx.restore();
}

// ── RENDER ────────────────────────────────────────────────────────────────────

function drawPauseOverlay() {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.52)";
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  ctx.fillStyle    = "rgba(255,255,255,0.92)";
  ctx.font         = "bold 28px Trebuchet MS";
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor  = "#4dd9ff";
  ctx.shadowBlur   = 16;
  ctx.fillText("PAUSED", WORLD_WIDTH / 2, WORLD_HEIGHT / 2 - 14);
  ctx.shadowBlur   = 0;
  ctx.fillStyle    = "rgba(255,255,255,0.5)";
  ctx.font         = "14px Trebuchet MS";
  ctx.fillText("Click the game to resume", WORLD_WIDTH / 2, WORLD_HEIGHT / 2 + 18);
  ctx.restore();
}

function drawBurstBullets() {
  if (burstBullets.length === 0) return;
  for (const b of burstBullets) {
    ctx.save();
    ctx.translate(b.x, b.y);
    // Glowing gold energy bolt — elongated streak
    const trailG = ctx.createLinearGradient(-22, 0, 8, 0);
    trailG.addColorStop(0,   "rgba(255,180,0,0)");
    trailG.addColorStop(0.6, "rgba(255,220,40,0.6)");
    trailG.addColorStop(1,   "rgba(255,255,180,0.95)");
    ctx.fillStyle = trailG;
    ctx.shadowColor = "#ffcc33"; ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.ellipse(-7, 0, 15, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // Bright white core
    ctx.fillStyle = "#ffffff";
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.ellipse(0, 0, 5, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawCaveBullets() {
  if (caveBullets.length === 0) return;
  for (const m of caveBullets) {
    ctx.save();
    ctx.translate(m.x, m.y);

    // ── Exhaust flame trail ──
    const flicker = 0.7 + 0.3 * Math.sin(m.phase);
    const trailLen = 28 + flicker * 10;
    const trail = ctx.createLinearGradient(-trailLen, 0, -8, 0);
    trail.addColorStop(0,   "rgba(255,100,0,0)");
    trail.addColorStop(0.5, `rgba(255,160,30,${0.45 * flicker})`);
    trail.addColorStop(1,   `rgba(255,220,80,${0.85 * flicker})`);
    ctx.fillStyle = trail;
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(-trailLen, -3 * flicker);
    ctx.lineTo(-trailLen - 4, 0);
    ctx.lineTo(-trailLen, 3 * flicker);
    ctx.closePath();
    ctx.fill();

    // ── Missile body ──
    ctx.shadowColor = "#ff6600"; ctx.shadowBlur = 10;
    const bodyG = ctx.createLinearGradient(0, -5, 0, 5);
    bodyG.addColorStop(0, "#d8d8d8");
    bodyG.addColorStop(0.5, "#f0f0f0");
    bodyG.addColorStop(1, "#888888");
    ctx.fillStyle = bodyG;
    if (ctx.roundRect) {
      ctx.beginPath(); ctx.roundRect(-14, -4, 20, 8, 3); ctx.fill();
    } else {
      ctx.fillRect(-14, -4, 20, 8);
    }

    // ── Nose cone (red) ──
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#dd2222";
    ctx.beginPath();
    ctx.moveTo(6, -4); ctx.lineTo(16, 0); ctx.lineTo(6, 4);
    ctx.closePath(); ctx.fill();

    // ── Tail fins ──
    ctx.fillStyle = "#555555";
    ctx.beginPath(); ctx.moveTo(-14, -4); ctx.lineTo(-20, -10); ctx.lineTo(-14, -4); ctx.lineTo(-10, -4); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-14,  4); ctx.lineTo(-20,  10); ctx.lineTo(-14,  4); ctx.lineTo(-10,  4); ctx.closePath(); ctx.fill();

    // ── Centre band stripe ──
    ctx.fillStyle = "rgba(200,50,50,0.75)";
    ctx.fillRect(-4, -4, 4, 8);

    ctx.restore();
  }
}

function render() {
  if (gameState.status === "boss") { renderBossArena(); return; }
  drawBackground();
  drawCave();
  drawFloaters();
  drawHelicopter();
  drawCaveBullets();
  drawBurstBullets();
  drawParticles();
  drawScorePopups();
  drawBanner();
  drawLevelProgressBar();
  drawLevelTip();
  drawPrompt();
  drawHoopCounter();
  if (gameState.status === "running" && gameState.pausedByBlur) drawPauseOverlay();
}

// ══════════════════════════════════════════════════════════════════════════════
// BOSS FIGHT SYSTEM
// ══════════════════════════════════════════════════════════════════════════════

let bossArena = null;
const bossKeys = {};

// ── Init ──────────────────────────────────────────────────────────────────────

function initBossArena(bossIndex) {
  const def = BOSS_DEFS[bossIndex];
  bossArena = {
    bossIndex,
    def,
    bossHp:   def.hp,
    boss: {
      x: WORLD_WIDTH - def.w / 2 - 14,
      y: WORLD_HEIGHT / 2,
      vy: def.speed,
      phase: 0,
      shootTimer: def.shootInterval * 0.5,
      hitFlash: 0,
    },
    player: { x: 55, y: WORLD_HEIGHT / 2, vx: 0, vy: 0, shootCooldown: 0 },
    bullets:       [],
    bossBullets:   [],
    sparks:        [],
    weapons:         weaponsForBoss(bossIndex),
    weaponIndex:     0,
    // Each successive boss unlocks faster player shooting (10% faster per level, up to 55% faster)
    shootSpeedMult:  Math.max(0.45, 1 - bossIndex * 0.09),
    playerHp:        100 + Math.max(0, bossIndex - 3) * 60,  // 100/100/100/100/160/220/280/340/400/460
    playerMaxHp:     100 + Math.max(0, bossIndex - 3) * 60,
    powerups:        [],
    powerupTimer:    Math.max(7, 18 - bossIndex * 1.6), // first drop: ~18s at boss1 down to ~7s at boss7
    activeShield:    0,
    activeBurst:     0,
    phase:  "intro",
    timer:  2.2,
    invincible: 0,
    stars: Array.from({ length: 60 }, () => ({
      x: Math.random() * WORLD_WIDTH,
      y: Math.random() * WORLD_HEIGHT,
      r: Math.random() * 1.4 + 0.3,
      a: Math.random(),
    })),
  };
}

// ── Update ────────────────────────────────────────────────────────────────────

function updateBossArena(delta) {
  if (!bossArena) return;
  updatePauseBtn();
  if (gameState.pausedByBlur) return; // pause support in boss fights
  const A = bossArena;

  if (A.phase === "intro") {
    A.timer -= delta;
    if (A.timer <= 0) A.phase = "fight";
    return;
  }

  if (A.phase === "victory") {
    A.timer -= delta;
    updateBossSparks(A, delta);
    if (A.timer <= 0) {
      bossArena = null;
      document.getElementById("boss-controls").classList.add("hidden");
      for (const k in bossKeys) delete bossKeys[k];
      showLevelGateOverlay();
    }
    return;
  }

  if (A.phase === "defeat") {
    A.timer -= delta;
    updateBossSparks(A, delta);
    if (A.timer <= 0) {
      bossArena = null;
      document.getElementById("boss-controls").classList.add("hidden");
      for (const k in bossKeys) delete bossKeys[k];
      endGame();
    }
    return;
  }

  // Keep rotor spinning in boss mode
  helicopter.rotor += delta * 4;

  // ── Player movement ──
  const PSPEED = 165;
  A.player.vx = 0; A.player.vy = 0;
  if (bossKeys["ArrowLeft"]  || bossKeys["a"] || bossKeys["A"]) A.player.vx = -PSPEED;
  if (bossKeys["ArrowRight"] || bossKeys["d"] || bossKeys["D"]) A.player.vx =  PSPEED;
  if (bossKeys["ArrowUp"]    || bossKeys["w"] || bossKeys["W"]) A.player.vy = -PSPEED;
  if (bossKeys["ArrowDown"]  || bossKeys["s"] || bossKeys["S"]) A.player.vy =  PSPEED;
  const pw = 20, ph = 18;

  // Virtual joystick — anchor is where finger touched down, joyPos is current
  if (A.touchActive && A.joyAnchor && A.joyPos) {
    const JOY_RADIUS = 52; // canvas pixels — how far to push for full speed
    const jdx = A.joyPos.x - A.joyAnchor.x;
    const jdy = A.joyPos.y - A.joyAnchor.y;
    const jdist = Math.hypot(jdx, jdy);
    if (jdist > 4) {
      const ratio = Math.min(1, jdist / JOY_RADIUS);
      A.player.vx = (jdx / jdist) * PSPEED * ratio;
      A.player.vy = (jdy / jdist) * PSPEED * ratio;
    }
  }

  A.player.x = clamp(A.player.x + A.player.vx * delta, pw, WORLD_WIDTH - pw - 12);
  A.player.y = clamp(A.player.y + A.player.vy * delta, ph + 24, WORLD_HEIGHT - ph - 85);

  // ── Active power-up timers ──
  if (A.activeShield > 0) A.activeShield -= delta;
  if (A.activeBurst  > 0) A.activeBurst  -= delta;

  // ── Power-up spawning & collection ──
  if (A.phase === "fight") {
    A.powerupTimer -= delta;
    if (A.powerupTimer <= 0 && A.powerups.length === 0) {
      const type = Math.random() < 0.5 ? "shield" : "burst";
      A.powerups.push({ type, x: 40 + Math.random() * (WORLD_WIDTH - 80), y: -18, vy: 55 });
      A.powerupTimer = Math.max(7, 18 - A.bossIndex * 1.6);
    }
    for (let i = A.powerups.length - 1; i >= 0; i--) {
      const pu = A.powerups[i];
      pu.y += pu.vy * delta;
      const dx = Math.abs(pu.x - A.player.x), dy = Math.abs(pu.y - A.player.y);
      if (dx < 28 && dy < 28) {
        if (pu.type === "shield") {
          A.activeShield = 6.0;
          scorePopups.push({ x: A.player.x, y: A.player.y - 22, text: "SHIELD!", life: 2.0 });
        } else {
          A.activeBurst = 5.0;
          scorePopups.push({ x: A.player.x, y: A.player.y - 22, text: "BURST!", life: 2.0 });
        }
        A.powerups.splice(i, 1);
        continue;
      }
      if (pu.y > WORLD_HEIGHT + 20) A.powerups.splice(i, 1);
    }
  }

  // ── Player shooting ──
  if (A.player.shootCooldown > 0) A.player.shootCooldown -= delta;
  if ((bossKeys[" "] || bossKeys["z"] || bossKeys["Z"]) && A.player.shootCooldown <= 0) {
    const wp = A.weapons[A.weaponIndex];
    const ox = A.player.x + pw, oy = A.player.y;
    if (wp.id === "gun") {
      A.bullets.push({ x: ox, y: oy, vx: wp.speed, vy: 0, wtype: "gun", damage: wp.damage });
    } else if (wp.id === "bomb") {
      A.bullets.push({ x: ox, y: oy, vx: wp.speed, vy: 0, wtype: "bomb", damage: wp.damage });
    } else if (wp.id === "spread") {
      for (const ang of [-0.28, 0, 0.28]) {
        A.bullets.push({ x: ox, y: oy, vx: Math.cos(ang) * wp.speed, vy: Math.sin(ang) * wp.speed, wtype: "spread", damage: wp.damage });
      }
    } else if (wp.id === "triple") {
      for (const ang of [-0.10, 0, 0.10]) {
        A.bullets.push({ x: ox, y: oy, vx: Math.cos(ang) * wp.speed, vy: Math.sin(ang) * wp.speed, wtype: "triple", damage: wp.damage });
      }
    } else if (wp.id === "heavy") {
      A.bullets.push({ x: ox, y: oy, vx: wp.speed, vy: 0, wtype: "heavy", damage: wp.damage });
    }
    // Burst power-up: near-zero cooldown for gun/triple while active
    // Burst power-up: all weapons fire much faster, proportional to their base cooldown
    const burstMult = A.activeBurst > 0 ? 0.16 : 1.0;
    A.player.shootCooldown = Math.max(0.04, wp.cooldown * A.shootSpeedMult * burstMult);
  }
  // Weapon swap: Q key
  if (bossKeys["q"] || bossKeys["Q"]) {
    bossKeys["q"] = false; bossKeys["Q"] = false;
    A.weaponIndex = (A.weaponIndex + 1) % A.weapons.length;
  }

  // ── Boss movement (bounces, phase modifies to side-sway at higher levels) ──
  const def = A.def;
  A.boss.phase += delta;
  A.boss.y += A.boss.vy * delta;
  const bhh = def.h / 2;
  if (A.boss.y > WORLD_HEIGHT - bhh - 82) { A.boss.y = WORLD_HEIGHT - bhh - 82; A.boss.vy = -Math.abs(A.boss.vy); }
  if (A.boss.y < bhh + 26)                { A.boss.y = bhh + 26;                A.boss.vy =  Math.abs(A.boss.vy); }
  // Level 3+ boss also sways horizontally
  if (A.bossIndex >= 2) {
    A.boss.x = WORLD_WIDTH - def.w / 2 - 14 + Math.sin(A.boss.phase * 0.8) * 28;
  }
  if (A.boss.hitFlash > 0) A.boss.hitFlash -= delta;

  // ── Boss shooting ──
  A.boss.shootTimer += delta;
  if (A.boss.shootTimer >= def.shootInterval) {
    A.boss.shootTimer = 0;
    spawnBossShot(A);
  }

  // ── Move player bullets ──
  if (A.invincible > 0) A.invincible -= delta;
  for (let i = A.bullets.length - 1; i >= 0; i--) {
    const b = A.bullets[i];
    b.x += b.vx * delta; b.y += b.vy * delta;
    if (b.x > WORLD_WIDTH + 10 || b.y < 0 || b.y > WORLD_HEIGHT) { A.bullets.splice(i, 1); continue; }
    // Hit on boss?
    if (b.x > A.boss.x - def.w/2 && b.x < A.boss.x + def.w/2 &&
        b.y > A.boss.y - def.h/2 && b.y < A.boss.y + def.h/2) {
      A.bullets.splice(i, 1);
      A.bossHp = Math.max(0, A.bossHp - b.damage);
      if (b.wtype === "bomb") {
        A.boss.hitFlash = 0.30;
        bossHitSparks(A, A.boss.x, A.boss.y, "#ff8800", 20);
        bossHitSparks(A, A.boss.x, A.boss.y, "#ffdd00", 12);
      } else {
        A.boss.hitFlash = 0.12;
        bossHitSparks(A, A.boss.x + (Math.random()-0.5)*30, A.boss.y + (Math.random()-0.5)*30, def.color, 6);
      }
      if (A.bossHp <= 0) {
        bossExplode(A);
        A.phase = "victory"; A.timer = 2.8;
        gameState.lives   += 1;
        gameState.missiles += 1;
        lifeValue.textContent = String(gameState.lives);
        updateCaveFireBtn();
        scorePopups.push({ x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 - 50, text: "+LIFE  +MISSILE", life: 2.0 });
      }
    }
  }

  // ── Move boss bullets ──
  for (let i = A.bossBullets.length - 1; i >= 0; i--) {
    const b = A.bossBullets[i];
    b.x += b.vx * delta; b.y += b.vy * delta;
    if (b.x < -20 || b.x > WORLD_WIDTH+20 || b.y < 0 || b.y > WORLD_HEIGHT) { A.bossBullets.splice(i, 1); continue; }
    // Hit player?
    if (A.invincible <= 0 &&
        b.x > A.player.x - pw && b.x < A.player.x + pw &&
        b.y > A.player.y - ph && b.y < A.player.y + ph) {
      A.bossBullets.splice(i, 1);
      bossHitPlayer(A);
    }
  }

  // ── Player touching boss body ──
  if (A.invincible <= 0) {
    const dx = Math.abs(A.player.x - A.boss.x), dy = Math.abs(A.player.y - A.boss.y);
    if (dx < def.w/2 + pw*0.6 && dy < def.h/2 + ph*0.6) bossHitPlayer(A);
  }

  updateBossSparks(A, delta);

  // Keep score popups animated during boss fights (e.g. "+LIFE" on victory)
  for (let i = scorePopups.length - 1; i >= 0; i--) {
    scorePopups[i].y    -= 55 * delta;
    scorePopups[i].life -= delta * 1.4;
    if (scorePopups[i].life <= 0) scorePopups.splice(i, 1);
  }
}

function spawnBossShot(A) {
  const bx = A.boss.x - A.def.w / 2 - 4, by = A.boss.y;
  const sp = A.def.bulletSpeed;
  if (A.def.pattern === "single") {
    A.bossBullets.push({ x: bx, y: by, vx: -sp, vy: 0 });
  } else if (A.def.pattern === "double") {
    A.bossBullets.push({ x: bx, y: by - 14, vx: -sp, vy: 0 });
    A.bossBullets.push({ x: bx, y: by + 14, vx: -sp, vy: 0 });
  } else if (A.def.pattern === "spread3") {
    A.bossBullets.push({ x: bx, y: by, vx: -sp,        vy: 0 });
    A.bossBullets.push({ x: bx, y: by, vx: -sp * 0.88, vy: -sp * 0.46 });
    A.bossBullets.push({ x: bx, y: by, vx: -sp * 0.88, vy:  sp * 0.46 });
  } else if (A.def.pattern === "aimed") {
    const dx = A.player.x - bx, dy = A.player.y - by;
    const len = Math.sqrt(dx*dx + dy*dy) || 1;
    A.bossBullets.push({ x: bx, y: by, vx: (dx/len)*sp, vy: (dy/len)*sp });
    A.bossBullets.push({ x: bx, y: by, vx: -sp * 0.85,  vy: -sp * 0.3 });
    A.bossBullets.push({ x: bx, y: by, vx: -sp * 0.85,  vy:  sp * 0.3 });
  } else if (A.def.pattern === "chaos") {
    // Alternates: aimed burst + 5-way spread each shot
    const dx = A.player.x - bx, dy = A.player.y - by;
    const len = Math.sqrt(dx*dx + dy*dy) || 1;
    // Aimed
    A.bossBullets.push({ x: bx, y: by, vx: (dx/len)*sp,        vy: (dy/len)*sp });
    // 5-way spread fan
    for (let i = -2; i <= 2; i++) {
      const ang = Math.atan2(dy, dx) + i * 0.28;
      A.bossBullets.push({ x: bx, y: by, vx: Math.cos(ang)*sp*0.85, vy: Math.sin(ang)*sp*0.85 });
    }
  }
}

function bossHitPlayer(A) {
  if (A.phase !== "fight" || A.invincible > 0) return; // double-hit guard
  if (A.activeShield > 0) return; // shield absorbs the hit
  A.playerHp = Math.max(0, A.playerHp - 20);
  A.invincible = 2.0;
  bossHitSparks(A, A.player.x, A.player.y, "#ff4444", 12);
  if (A.playerHp <= 0) { A.phase = "defeat"; A.timer = 1.8; }
}

function bossHitSparks(A, x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2, sp = 55 + Math.random() * 100;
    A.sparks.push({ x, y, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp, life: 0.35 + Math.random()*0.3, maxLife: 0.65, color });
  }
}

function bossExplode(A) {
  for (let i = 0; i < 38; i++) {
    const a = Math.random() * Math.PI * 2, sp = 70 + Math.random() * 160;
    A.sparks.push({ x: A.boss.x + (Math.random()-0.5)*20, y: A.boss.y + (Math.random()-0.5)*20,
      vx: Math.cos(a)*sp, vy: Math.sin(a)*sp, life: 0.5 + Math.random()*0.7, maxLife: 1.2, color: A.def.color });
  }
  for (let i = 0; i < 20; i++) {
    const a = Math.random() * Math.PI * 2, sp = 40 + Math.random() * 80;
    A.sparks.push({ x: A.boss.x, y: A.boss.y, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp, life: 0.8, maxLife: 0.8, color: "#ffffff" });
  }
}

function updateBossSparks(A, delta) {
  for (let i = A.sparks.length - 1; i >= 0; i--) {
    const p = A.sparks[i];
    p.x += p.vx * delta; p.y += p.vy * delta;
    p.vy += 60 * delta; // slight gravity
    p.life -= delta;
    if (p.life <= 0) A.sparks.splice(i, 1);
  }
}

// ── Render ────────────────────────────────────────────────────────────────────

function renderBossArena() {
  if (!bossArena) return;
  const A = bossArena;

  // Background — deep space with boss colour atmosphere
  ctx.fillStyle = "#06080f";
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  const bossCol = A.def.color || "#4dd9ff";
  const bossAtm = ctx.createRadialGradient(WORLD_WIDTH / 2, WORLD_HEIGHT * 0.28, 10, WORLD_WIDTH / 2, WORLD_HEIGHT * 0.28, WORLD_HEIGHT * 0.75);
  bossAtm.addColorStop(0,   `${bossCol}2a`);
  bossAtm.addColorStop(0.5, `${bossCol}10`);
  bossAtm.addColorStop(1,   "rgba(0,0,0,0)");
  ctx.fillStyle = bossAtm;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  // Stars — tinted slightly to boss colour
  for (const s of A.stars) {
    ctx.globalAlpha = s.a * (0.5 + 0.5 * Math.sin(A.boss.phase * 1.4 + s.x));
    ctx.fillStyle = s.x % 3 === 0 ? bossCol : "#ffffff";
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Arena grid lines tinted to boss colour
  ctx.strokeStyle = `${bossCol}12`;
  ctx.lineWidth = 1;
  for (let y = 0; y < WORLD_HEIGHT; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD_WIDTH, y); ctx.stroke();
  }
  for (let x = 0; x < WORLD_WIDTH; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, WORLD_HEIGHT); ctx.stroke();
  }

  drawBossSparks(A);

  if (A.phase !== "intro") {
    drawBossEnemy(A);
    drawBossPlayer(A);
    drawBossPowerups(A);
    drawBossPlayerBullets(A);
    drawBossEnemyBullets(A);
    drawBossHud(A);
  }

  drawScorePopups();
  drawBossPhaseText(A);
  drawBossJoystick(A);
  if (gameState.pausedByBlur) drawPauseOverlay();
}

function drawBossJoystick(A) {
  if (!A || !A.touchActive || !A.joyAnchor || !A.joyPos) return;
  const JOY_RADIUS = 52;
  const ax = A.joyAnchor.x, ay = A.joyAnchor.y;
  // Clamp stick position to joystick radius
  const dx = A.joyPos.x - ax, dy = A.joyPos.y - ay;
  const dist = Math.hypot(dx, dy);
  const clampedDist = Math.min(dist, JOY_RADIUS);
  const sx = dist > 0 ? ax + (dx / dist) * clampedDist : ax;
  const sy = dist > 0 ? ay + (dy / dist) * clampedDist : ay;

  ctx.save();
  // Outer ring
  ctx.strokeStyle = "rgba(77,217,255,0.45)";
  ctx.lineWidth   = 2;
  ctx.fillStyle   = "rgba(77,217,255,0.07)";
  ctx.beginPath(); ctx.arc(ax, ay, JOY_RADIUS, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  // Direction line
  ctx.strokeStyle = "rgba(77,217,255,0.3)";
  ctx.lineWidth   = 1.5;
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(sx, sy); ctx.stroke();

  // Inner knob
  const knobG = ctx.createRadialGradient(sx - 4, sy - 4, 1, sx, sy, 18);
  knobG.addColorStop(0,   "rgba(120,230,255,0.95)");
  knobG.addColorStop(0.5, "rgba(77,217,255,0.75)");
  knobG.addColorStop(1,   "rgba(20,100,160,0.60)");
  ctx.fillStyle   = knobG;
  ctx.shadowColor = "#4dd9ff";
  ctx.shadowBlur  = 12;
  ctx.beginPath(); ctx.arc(sx, sy, 18, 0, Math.PI * 2); ctx.fill();

  // Centre dot on anchor
  ctx.shadowBlur  = 0;
  ctx.fillStyle   = "rgba(77,217,255,0.4)";
  ctx.beginPath(); ctx.arc(ax, ay, 5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawBossHud(A) {
  // Boss name + health bar at top
  const bw = WORLD_WIDTH - 32, bx = 16, by = 14, bh = 8;
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 4); ctx.fill(); }
  else ctx.fillRect(bx, by, bw, bh);

  const pct  = Math.max(0, A.bossHp / A.def.hp);
  const fillW = Math.max(4, bw * pct);
  const hpGrad = ctx.createLinearGradient(bx, 0, bx + fillW, 0);
  hpGrad.addColorStop(0, A.def.color);
  hpGrad.addColorStop(1, "#ffffff");
  ctx.fillStyle = hpGrad;
  ctx.shadowColor = A.def.color; ctx.shadowBlur = 8;
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(bx, by, fillW, bh, 4); ctx.fill(); }
  else ctx.fillRect(bx, by, fillW, bh);
  ctx.shadowBlur = 0;

  ctx.font = "bold 10px Trebuchet MS"; ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.fillStyle = A.def.color;
  ctx.fillText(`⚠ BOSS — ${A.def.name}`, bx, by + bh + 3);

  ctx.font = "10px Trebuchet MS"; ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText(`HP ${A.bossHp} / ${A.def.hp}`, bx + bw, by + bh + 3);

  // ── Player HP bar — placed just below the boss HP label row ──
  const infoY = by + bh + 17;
  const pbw = 110, pbh = 7;
  const phpPct = Math.max(0, A.playerHp / A.playerMaxHp);
  // Background track
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(bx, infoY, pbw, pbh, 3); ctx.fill(); }
  else ctx.fillRect(bx, infoY, pbw, pbh);
  // Fill — green → yellow → red as HP drops
  const phpFillW = Math.max(3, pbw * phpPct);
  const phpColor = phpPct > 0.5 ? "#44dd88" : phpPct > 0.25 ? "#ffcc33" : "#ff3344";
  ctx.fillStyle = phpColor;
  ctx.shadowColor = phpColor; ctx.shadowBlur = 6;
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(bx, infoY, phpFillW, pbh, 3); ctx.fill(); }
  else ctx.fillRect(bx, infoY, phpFillW, pbh);
  ctx.shadowBlur = 0;
  // Label
  ctx.font = "bold 9px Trebuchet MS"; ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillText(`YOU  ${A.playerHp} / ${A.playerMaxHp}`, bx + pbw + 6, infoY);

  // Active power-up status chips
  let chipX = bx + pbw + 58;
  if (A.activeShield > 0) {
    ctx.fillStyle = "#50c8ff"; ctx.font = "bold 9px Trebuchet MS"; ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.fillText(`🛡 ${A.activeShield.toFixed(1)}s`, chipX, infoY);
    chipX += 52;
  }
  if (A.activeBurst > 0) {
    ctx.fillStyle = "#ffcc33"; ctx.font = "bold 9px Trebuchet MS"; ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.fillText(`⚡ ${A.activeBurst.toFixed(1)}s`, chipX, infoY);
  }

  // Weapon chips — evenly spaced across full width so they never overlap
  if (A.weapons.length > 0) {
    const wpRowY   = infoY + 14;
    const totalW   = bw;                              // full bar width
    const chipW    = Math.floor(totalW / A.weapons.length) - 4;
    const chipStep = Math.floor(totalW / A.weapons.length);

    for (let wi = 0; wi < A.weapons.length; wi++) {
      const wp     = A.weapons[wi];
      const active = wi === A.weaponIndex;
      const cx     = bx + wi * chipStep;

      ctx.save();
      ctx.textBaseline = "top";

      // Background pill
      if (active) {
        ctx.fillStyle   = wp.color;
        ctx.shadowColor = wp.color; ctx.shadowBlur = 10;
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(cx, wpRowY - 2, chipW, 16, 4); ctx.fill(); }
        else ctx.fillRect(cx, wpRowY - 2, chipW, 16);
        ctx.shadowBlur  = 0;
        ctx.fillStyle   = "#000";
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(cx, wpRowY - 2, chipW, 16, 4); ctx.fill(); }
        else ctx.fillRect(cx, wpRowY - 2, chipW, 16);
        ctx.fillStyle = "rgba(255,255,255,0.40)";
      }

      ctx.font = `bold 8px Trebuchet MS`;
      ctx.textAlign = "center";
      const dmgTag = (wp.id === "gun") ? "" : ` x${wp.damage}`;
      ctx.fillText(`${wi + 1} ${wp.label}${dmgTag}`, cx + chipW / 2, wpRowY);
      ctx.restore();
    }

    if (A.weapons.length > 1) {
      ctx.font = "8px Trebuchet MS"; ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillStyle = "rgba(255,255,255,0.28)";
      ctx.fillText("Q / SWAP to switch", bx, wpRowY + 18);
    }
  }
}

function drawBossEnemy(A) {
  const { bossIndex, def, boss } = A;
  ctx.save();
  ctx.translate(boss.x, boss.y);

  // Hit flash
  if (boss.hitFlash > 0) {
    ctx.globalAlpha = 0.55 + boss.hitFlash * 2;
  }

  if      (bossIndex === 0) drawBoss1(ctx, def, boss);
  else if (bossIndex === 1) drawBoss2(ctx, def, boss);
  else if (bossIndex === 2) drawBoss3(ctx, def, boss);
  else if (bossIndex === 3) drawBoss4(ctx, def, boss);
  else                      drawBoss5(ctx, def, boss); // bosses 5, 6, 7 reuse the Midnight Machine art

  ctx.restore();
}

// Boss 1: The Presser — giant heat press
function drawBoss1(c, def, boss) {
  const w = def.w, h = def.h, hw = w/2, hh = h/2;
  // Body
  const bg = c.createLinearGradient(-hw, -hh, hw, hh);
  bg.addColorStop(0, "#888"); bg.addColorStop(0.5, def.color); bg.addColorStop(1, "#444");
  c.fillStyle = bg;
  c.shadowColor = def.color; c.shadowBlur = 18;
  if (c.roundRect) { c.beginPath(); c.roundRect(-hw, -hh, w, h, 8); c.fill(); }
  else c.fillRect(-hw, -hh, w, h);
  c.shadowBlur = 0;
  // Heating plate (glowing bottom strip)
  c.fillStyle = "#ff5500";
  c.shadowColor = "#ff7700"; c.shadowBlur = 12;
  c.fillRect(-hw + 4, hh - 14, w - 8, 10);
  c.shadowBlur = 0;
  // Eyes (two glowing orange circles)
  for (const ex of [-hw*0.35, hw*0.35]) {
    c.fillStyle = "#ffcc44";
    c.shadowColor = "#ffcc44"; c.shadowBlur = 10;
    c.beginPath(); c.arc(ex, -hh*0.3, 7, 0, Math.PI*2); c.fill();
    c.fillStyle = "#ff4400";
    c.beginPath(); c.arc(ex, -hh*0.3, 4, 0, Math.PI*2); c.fill();
    c.shadowBlur = 0;
  }
  // Arm (left-extending press arm)
  const armExt = 10 + Math.abs(Math.sin(boss.phase * 2.2)) * 16;
  c.fillStyle = "#666";
  c.fillRect(-hw - armExt, -8, armExt + 4, 16);
  c.shadowColor = "#ff9900"; c.shadowBlur = 6;
  c.fillStyle = def.color;
  c.fillRect(-hw - armExt - 8, -10, 12, 20);
  c.shadowBlur = 0;
}

// Boss 2: Vinyl Wraith — giant spinning roll with tentacles
function drawBoss2(c, def, boss) {
  const r = def.w / 2;
  // Spinning tentacles
  c.lineWidth = 5; c.lineCap = "round";
  for (let i = 0; i < 5; i++) {
    const a = boss.phase * 1.8 + i * (Math.PI * 2 / 5);
    const len = r * 1.5 + Math.sin(boss.phase * 2 + i) * 10;
    c.strokeStyle = `rgba(255,107,129,${0.35 + i*0.1})`;
    c.shadowColor = def.color; c.shadowBlur = 6;
    c.beginPath();
    c.moveTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8);
    c.lineTo(Math.cos(a) * len, Math.sin(a) * len);
    c.stroke();
  }
  c.shadowBlur = 0;
  // Main roll body
  const bg = c.createRadialGradient(-r*0.2, -r*0.2, 0, 0, 0, r);
  bg.addColorStop(0, "#ff8898"); bg.addColorStop(0.6, def.color); bg.addColorStop(1, "#880030");
  c.fillStyle = bg;
  c.shadowColor = def.color; c.shadowBlur = 22;
  c.beginPath(); c.arc(0, 0, r, 0, Math.PI*2); c.fill();
  c.shadowBlur = 0;
  // Roll core rings
  for (let ri = 1; ri <= 3; ri++) {
    c.strokeStyle = `rgba(255,255,255,${0.08 + ri*0.06})`;
    c.lineWidth = 1.5;
    c.beginPath(); c.arc(0, 0, r * (1 - ri*0.22), 0, Math.PI*2); c.stroke();
  }
  // Glowing eye
  c.fillStyle = "#ff0033";
  c.shadowColor = "#ff2244"; c.shadowBlur = 16;
  c.beginPath(); c.arc(0, 0, 9, 0, Math.PI*2); c.fill();
  c.fillStyle = "#ffffff";
  c.shadowBlur = 0;
  c.beginPath(); c.arc(-3, -3, 4, 0, Math.PI*2); c.fill();
  c.fillStyle = "#000";
  c.beginPath(); c.arc(-2, -2, 2.5, 0, Math.PI*2); c.fill();
}

// Boss 3: Rush Daemon — demonic heat press with fire
function drawBoss3(c, def, boss) {
  const w = def.w, h = def.h, hw = w/2, hh = h/2;
  // Fire jets on sides
  for (const fx of [-hw - 8, hw - 4]) {
    const flen = 14 + Math.abs(Math.sin(boss.phase * 5)) * 18;
    const fg = c.createLinearGradient(fx, 0, fx - flen * Math.sign(fx + hw), 0);
    fg.addColorStop(0, "rgba(255,180,0,0.9)"); fg.addColorStop(1, "rgba(255,50,0,0)");
    c.fillStyle = fg;
    c.shadowColor = "#ff7700"; c.shadowBlur = 14;
    c.fillRect(fx - (fx < 0 ? flen : 0), -8, flen, 16);
    c.shadowBlur = 0;
  }
  // Main body
  const bg = c.createLinearGradient(-hw, -hh, hw, hh);
  bg.addColorStop(0, "#886600"); bg.addColorStop(0.4, def.color); bg.addColorStop(1, "#442200");
  c.fillStyle = bg;
  c.shadowColor = def.color; c.shadowBlur = 20;
  if (c.roundRect) { c.beginPath(); c.roundRect(-hw, -hh, w, h, 6); c.fill(); }
  else c.fillRect(-hw, -hh, w, h);
  c.shadowBlur = 0;
  // Triple eyes
  for (let i = -1; i <= 1; i++) {
    const pulse = 0.7 + 0.3 * Math.sin(boss.phase * 4 + i);
    c.shadowColor = "#ff0000"; c.shadowBlur = 10 * pulse;
    c.fillStyle = "#ff2200";
    c.beginPath(); c.arc(i * hw * 0.38, -hh * 0.2, 6, 0, Math.PI*2); c.fill();
    c.fillStyle = "#ffcc00";
    c.beginPath(); c.arc(i * hw * 0.38 + 1.5, -hh * 0.2 - 1.5, 3, 0, Math.PI*2); c.fill();
    c.shadowBlur = 0;
  }
  // Jagged bottom "teeth"
  c.fillStyle = "#222";
  c.beginPath(); c.moveTo(-hw+4, hh);
  for (let tx = -hw+4; tx < hw-4; tx += 10) {
    c.lineTo(tx + 5, hh - 8); c.lineTo(tx + 10, hh);
  }
  c.closePath(); c.fill();
}

// Boss 4: The Overseer — massive drone overlord
function drawBoss4(c, def, boss) {
  const r = def.w / 2;
  // 6 rotor arms
  for (let i = 0; i < 6; i++) {
    const a = boss.phase * 1.2 + i * (Math.PI / 3);
    const ax = Math.cos(a) * r * 0.9, ay = Math.sin(a) * r * 0.9;
    c.strokeStyle = "#55559a"; c.lineWidth = 3;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(ax, ay); c.stroke();
    // Spinning rotor disc
    c.save(); c.translate(ax, ay);
    const discG = c.createRadialGradient(0,0,0,0,0,10);
    discG.addColorStop(0, "rgba(140,140,255,0.55)"); discG.addColorStop(1, "rgba(80,80,200,0)");
    c.fillStyle = discG;
    c.beginPath(); c.arc(0, 0, 10, 0, Math.PI*2); c.fill();
    // Blade lines
    c.save(); c.rotate(boss.phase * -5);
    c.strokeStyle = "rgba(160,160,255,0.8)"; c.lineWidth = 1.5; c.lineCap = "round";
    c.beginPath(); c.moveTo(-8,0); c.lineTo(8,0); c.stroke();
    c.rotate(Math.PI/2);
    c.beginPath(); c.moveTo(-8,0); c.lineTo(8,0); c.stroke();
    c.restore(); c.restore();
  }
  // Hex body
  c.shadowColor = def.color; c.shadowBlur = 22;
  const bg = c.createRadialGradient(-r*0.15, -r*0.15, 0, 0, 0, r*0.55);
  bg.addColorStop(0, "#6655cc"); bg.addColorStop(1, def.color);
  c.fillStyle = bg;
  c.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3 - Math.PI / 6;
    const hx = Math.cos(a) * r * 0.52, hy = Math.sin(a) * r * 0.52;
    i === 0 ? c.moveTo(hx, hy) : c.lineTo(hx, hy);
  }
  c.closePath(); c.fill();
  c.shadowBlur = 0;
  // Pulsing camera eye
  const pulse = 0.6 + 0.4 * Math.sin(boss.phase * 3.5);
  c.fillStyle = `rgba(255, 50, 80, ${pulse})`;
  c.shadowColor = "#ff2244"; c.shadowBlur = 14 * pulse;
  c.beginPath(); c.arc(0, 0, 11, 0, Math.PI*2); c.fill();
  c.fillStyle = "#ffffff";
  c.shadowBlur = 0;
  c.beginPath(); c.arc(-3, -3, 5, 0, Math.PI*2); c.fill();
  c.fillStyle = "#000";
  c.beginPath(); c.arc(-2, -2, 3, 0, Math.PI*2); c.fill();
}

// Boss 5: Midnight Machine — the final boss, all-in-one nightmare
function drawBoss5(c, def, boss) {
  const r = def.w / 2;
  const pulse = 0.6 + 0.4 * Math.sin(boss.phase * 4.2);

  // 8 rotating spike arms
  for (let i = 0; i < 8; i++) {
    const a = boss.phase * 1.6 + i * (Math.PI / 4);
    const len = r * 1.45 + Math.sin(boss.phase * 3 + i) * 8;
    c.save(); c.rotate(a);
    c.strokeStyle = `rgba(255,40,80,${0.4 + i*0.05})`; c.lineWidth = 3; c.lineCap = "round";
    c.shadowColor = def.color; c.shadowBlur = 8;
    c.beginPath(); c.moveTo(r * 0.55, 0); c.lineTo(len, 0); c.stroke();
    // Spike tip
    c.fillStyle = def.color;
    c.beginPath(); c.arc(len, 0, 4, 0, Math.PI*2); c.fill();
    c.restore();
  }
  c.shadowBlur = 0;

  // Outer ring
  c.strokeStyle = `rgba(255,50,80,${0.3 + pulse*0.3})`;
  c.lineWidth = 2;
  c.shadowColor = def.color; c.shadowBlur = 14 * pulse;
  c.beginPath(); c.arc(0, 0, r * 0.9, 0, Math.PI*2); c.stroke();
  c.shadowBlur = 0;

  // Main body — dark core with red glow
  const bg = c.createRadialGradient(-r*0.2, -r*0.2, 0, 0, 0, r*0.7);
  bg.addColorStop(0, "#660020"); bg.addColorStop(0.5, "#330010"); bg.addColorStop(1, "#110008");
  c.fillStyle = bg;
  c.shadowColor = def.color; c.shadowBlur = 26 * pulse;
  c.beginPath(); c.arc(0, 0, r * 0.68, 0, Math.PI*2); c.fill();
  c.shadowBlur = 0;

  // Three rotating inner orbs
  for (let i = 0; i < 3; i++) {
    const a = boss.phase * -2.5 + i * (Math.PI * 2 / 3);
    const ox = Math.cos(a) * r * 0.38, oy = Math.sin(a) * r * 0.38;
    c.fillStyle = def.color;
    c.shadowColor = def.color; c.shadowBlur = 12;
    c.beginPath(); c.arc(ox, oy, 7, 0, Math.PI*2); c.fill();
    c.shadowBlur = 0;
  }

  // Central eye — large, menacing
  c.fillStyle = "#ff0033";
  c.shadowColor = "#ff0033"; c.shadowBlur = 18 * pulse;
  c.beginPath(); c.arc(0, 0, 16, 0, Math.PI*2); c.fill();
  c.fillStyle = "#ffffff";
  c.shadowBlur = 0;
  c.beginPath(); c.arc(-4, -4, 8, 0, Math.PI*2); c.fill();
  c.fillStyle = "#000";
  c.beginPath(); c.arc(-3, -3, 5, 0, Math.PI*2); c.fill();
  // Pupil track (follows boss phase)
  const pupilX = -3 + Math.cos(boss.phase * 2.2) * 2;
  const pupilY = -3 + Math.sin(boss.phase * 2.2) * 2;
  c.fillStyle = "#ff0000";
  c.beginPath(); c.arc(pupilX, pupilY, 2.5, 0, Math.PI*2); c.fill();
}

function drawBossPlayer(A) {
  const p = A.player;
  ctx.save();
  ctx.translate(p.x, p.y);

  if (A.invincible > 0 && Math.floor(A.invincible * 10) % 2 === 0) ctx.globalAlpha = 0.35;

  const t = A.boss.phase;
  const moving = A.player.vx !== 0 || A.player.vy !== 0;

  // ── Jetpack (back, left side since astronaut faces right) ──
  ctx.fillStyle = "#2a2a48";
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(-20, -4, 9, 18, 3); ctx.fill(); }
  else ctx.fillRect(-20, -4, 9, 18);
  ctx.fillStyle = "#3a3a5a";
  ctx.fillRect(-20, 11, 9, 4);

  // ── Jetpack exhaust flame ──
  const flameH = moving ? 9 + Math.sin(t * 22) * 4 : 5 + Math.sin(t * 14) * 2;
  ctx.shadowColor = "#4dd9ff"; ctx.shadowBlur = moving ? 12 : 5;
  const flameG = ctx.createLinearGradient(-15.5, 15, -15.5, 15 + flameH);
  flameG.addColorStop(0,   `rgba(200,240,255,${moving ? 0.95 : 0.55})`);
  flameG.addColorStop(0.5, `rgba(77,217,255,${moving ? 0.7 : 0.35})`);
  flameG.addColorStop(1,   "rgba(77,217,255,0)");
  ctx.fillStyle = flameG;
  ctx.beginPath();
  ctx.moveTo(-20, 15); ctx.lineTo(-11, 15); ctx.lineTo(-15.5, 15 + flameH); ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  // ── Suit body ──
  const suitG = ctx.createLinearGradient(-11, -1, 11, 18);
  suitG.addColorStop(0, "#f2efe9"); suitG.addColorStop(0.5, "#dedad2"); suitG.addColorStop(1, "#b8b4ae");
  ctx.fillStyle = suitG;
  ctx.shadowColor = "rgba(0,0,0,0.28)"; ctx.shadowBlur = 5;
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(-11, -1, 22, 20, 7); ctx.fill(); }
  else ctx.fillRect(-11, -1, 22, 20);
  ctx.shadowBlur = 0;

  // Suit seam lines
  ctx.strokeStyle = "rgba(0,0,0,0.09)"; ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.moveTo(-5, 4); ctx.lineTo(-5, 15); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(5, 4); ctx.lineTo(5, 15); ctx.stroke();

  // PTI chest badge
  ctx.fillStyle = "rgba(77,217,255,0.75)";
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(-5, 3, 10, 7, 2); ctx.fill(); }
  else ctx.fillRect(-5, 3, 10, 7);
  ctx.fillStyle = "#000d18"; ctx.font = "bold 5px Trebuchet MS";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("PTI", 0, 6.5);

  // ── Arms ──
  ctx.fillStyle = "#e8e4de";
  ctx.shadowColor = "rgba(0,0,0,0.16)"; ctx.shadowBlur = 3;
  ctx.save(); ctx.translate(-15, 2); ctx.rotate(-0.22);
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(-3, -3, 6, 11, 3); ctx.fill(); }
  else ctx.fillRect(-3, -3, 6, 11);
  ctx.restore();
  ctx.save(); ctx.translate(15, 2); ctx.rotate(0.18);
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(-3, -3, 6, 11, 3); ctx.fill(); }
  else ctx.fillRect(-3, -3, 6, 11);
  ctx.restore();
  ctx.shadowBlur = 0;
  // Right glove (gun hand)
  ctx.fillStyle = "#bbb8b2";
  ctx.beginPath(); ctx.arc(18, 9, 4, 0, Math.PI * 2); ctx.fill();

  // ── Legs ──
  ctx.fillStyle = "#dedad4";
  ctx.shadowColor = "rgba(0,0,0,0.15)"; ctx.shadowBlur = 2;
  if (ctx.roundRect) {
    ctx.beginPath(); ctx.roundRect(-9, 18, 7, 9, 3); ctx.fill();
    ctx.beginPath(); ctx.roundRect(2,  18, 7, 9, 3); ctx.fill();
  } else { ctx.fillRect(-9, 18, 7, 9); ctx.fillRect(2, 18, 7, 9); }
  ctx.shadowBlur = 0;
  // Boots
  ctx.fillStyle = "#888898";
  if (ctx.roundRect) {
    ctx.beginPath(); ctx.roundRect(-10, 25, 9, 4, 2); ctx.fill();
    ctx.beginPath(); ctx.roundRect(1,   25, 9, 4, 2); ctx.fill();
  } else { ctx.fillRect(-10, 25, 9, 4); ctx.fillRect(1, 25, 9, 4); }

  // ── Helmet ──
  const helG = ctx.createRadialGradient(-3, -17, 1, 0, -13, 12);
  helG.addColorStop(0, "#f8f8f6"); helG.addColorStop(0.6, "#eae6e0"); helG.addColorStop(1, "#bfbbb7");
  ctx.fillStyle = helG;
  ctx.shadowColor = "rgba(0,0,0,0.22)"; ctx.shadowBlur = 6;
  ctx.beginPath(); ctx.arc(0, -13, 12, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(0,0,0,0.10)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(0, -13, 12, 0, Math.PI * 2); ctx.stroke();

  // ── Neck ring ──
  ctx.fillStyle = "#9090a2";
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(-6, -2, 12, 4, 2); ctx.fill(); }
  else ctx.fillRect(-6, -2, 12, 4);

  // ── Visor ──
  const visG = ctx.createRadialGradient(-3, -16, 1, 1, -12, 9);
  visG.addColorStop(0,    "rgba(190,225,255,0.96)");
  visG.addColorStop(0.55, "rgba(35,105,210,0.88)");
  visG.addColorStop(1,    "rgba(8,40,130,0.82)");
  ctx.fillStyle = visG;
  ctx.beginPath(); ctx.ellipse(1, -12, 8, 6, 0, 0, Math.PI * 2); ctx.fill();
  // Glints
  ctx.fillStyle = "rgba(255,255,255,0.62)";
  ctx.beginPath(); ctx.ellipse(-3, -16, 3.5, 2, -0.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.beginPath(); ctx.ellipse(5, -11, 1.8, 1.2, 0.3, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

function drawBossPlayerBullets(A) {
  for (const b of A.bullets) {
    ctx.save();
    if (b.wtype === "bomb") {
      // Large glowing orange bomb
      ctx.shadowColor = "#ff8800"; ctx.shadowBlur = 22;
      const bg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 13);
      bg.addColorStop(0, "#ffffff");
      bg.addColorStop(0.3, "#ffcc00");
      bg.addColorStop(0.7, "#ff6600");
      bg.addColorStop(1, "rgba(255,80,0,0)");
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(b.x, b.y, 13, 0, Math.PI*2); ctx.fill();
      // Inner core dot
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI*2); ctx.fill();
    } else if (b.wtype === "spread") {
      // Small green bullet
      ctx.shadowColor = "#88ff44"; ctx.shadowBlur = 10;
      const bg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 5);
      bg.addColorStop(0, "#ffffff"); bg.addColorStop(0.45, "#88ff44"); bg.addColorStop(1, "rgba(80,255,40,0)");
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI*2); ctx.fill();
    } else if (b.wtype === "triple") {
      // Pink/magenta bullet
      ctx.shadowColor = "#ff44dd"; ctx.shadowBlur = 11;
      const bg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 5);
      bg.addColorStop(0, "#ffffff"); bg.addColorStop(0.4, "#ff44dd"); bg.addColorStop(1, "rgba(255,40,200,0)");
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI*2); ctx.fill();
    } else if (b.wtype === "heavy") {
      // Large glowing orange-red slug
      ctx.shadowColor = "#ff6600"; ctx.shadowBlur = 26;
      const bg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 15);
      bg.addColorStop(0, "#ffffff"); bg.addColorStop(0.3, "#ff8833"); bg.addColorStop(0.7, "#cc3300"); bg.addColorStop(1, "rgba(180,40,0,0)");
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(b.x, b.y, 15, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0; ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI*2); ctx.fill();
    } else {
      // Gun — cyan bullet
      ctx.shadowColor = "#44eeff"; ctx.shadowBlur = 10;
      const bg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 5);
      bg.addColorStop(0, "#ffffff"); bg.addColorStop(0.4, "#44eeff"); bg.addColorStop(1, "rgba(30,200,255,0)");
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI*2); ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

function drawBossPowerups(A) {
  // Falling power-up pickups
  for (const pu of A.powerups) {
    ctx.save();
    ctx.translate(pu.x, pu.y);
    const rimColor = pu.type === "shield" ? "#50c8ff" : "#ffcc33";
    const fillColor = pu.type === "shield" ? "rgba(20,80,180,0.88)" : "rgba(160,110,10,0.88)";
    ctx.shadowColor = rimColor; ctx.shadowBlur = 20;
    ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fillStyle = fillColor; ctx.fill();
    ctx.strokeStyle = rimColor; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#fff";
    ctx.font = "13px sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(pu.type === "shield" ? "🛡" : "⚡", 0, 1);
    ctx.restore();
  }

  // Shield aura around player when active
  if (A.activeShield > 0) {
    ctx.save();
    const pulse = 0.55 + 0.45 * Math.sin(Date.now() / 110);
    ctx.globalAlpha = Math.min(1, A.activeShield * 0.5) * pulse;
    ctx.strokeStyle = "#50c8ff"; ctx.shadowColor = "#50c8ff"; ctx.shadowBlur = 22;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(A.player.x, A.player.y, 24, 0, Math.PI * 2); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Burst aura (gold dashed ring) when active
  if (A.activeBurst > 0) {
    ctx.save();
    const pulse = 0.55 + 0.45 * Math.sin(Date.now() / 70);
    ctx.globalAlpha = Math.min(1, A.activeBurst * 0.5) * pulse;
    ctx.strokeStyle = "#ffcc33"; ctx.shadowColor = "#ffcc33"; ctx.shadowBlur = 18;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.arc(A.player.x, A.player.y, 19, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

function drawBossEnemyBullets(A) {
  for (const b of A.bossBullets) {
    ctx.save();
    ctx.shadowColor = A.def.color; ctx.shadowBlur = 12;
    const bg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 7);
    bg.addColorStop(0, "#ffffff"); bg.addColorStop(0.35, A.def.color); bg.addColorStop(1, "rgba(255,100,50,0)");
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.arc(b.x, b.y, 7, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

function drawBossSparks(A) {
  for (const p of A.sparks) {
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, 3 * alpha + 0.5, 0, Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawBossPhaseText(A) {
  if (A.phase === "intro") {
    const t = 2.2 - A.timer;
    ctx.globalAlpha = Math.min(1, t * 2);
    ctx.fillStyle = A.def.color;
    ctx.font = "bold 26px Trebuchet MS";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.shadowColor = A.def.color; ctx.shadowBlur = 24;
    ctx.fillText("⚠ BOSS FIGHT ⚠", WORLD_WIDTH/2, WORLD_HEIGHT/2 - 28);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px Trebuchet MS";
    ctx.fillText(A.def.name.toUpperCase(), WORLD_WIDTH/2, WORLD_HEIGHT/2 + 8);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "13px Trebuchet MS";
    ctx.fillText("Arrow keys / WASD to move  ·  Space to fire", WORLD_WIDTH/2, WORLD_HEIGHT/2 + 38);
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  } else if (A.phase === "victory") {
    const alpha = Math.min(1, (2.8 - A.timer) * 1.5);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px Trebuchet MS";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.shadowColor = A.def.color; ctx.shadowBlur = 28;
    ctx.fillText("BOSS DEFEATED!", WORLD_WIDTH/2, WORLD_HEIGHT/2 - 16);
    ctx.shadowBlur = 0;
    ctx.fillStyle = A.def.color;
    ctx.font = "15px Trebuchet MS";
    ctx.fillText("Proceeding to next level…", WORLD_WIDTH/2, WORLD_HEIGHT/2 + 18);
    ctx.globalAlpha = 1;
  } else if (A.phase === "defeat") {
    ctx.globalAlpha = Math.min(1, (1.8 - A.timer) * 2);
    ctx.fillStyle = "#ff2244";
    ctx.font = "bold 28px Trebuchet MS";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.shadowColor = "#ff2244"; ctx.shadowBlur = 24;
    ctx.fillText("DEFEATED…", WORLD_WIDTH/2, WORLD_HEIGHT/2);
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  }
}

// ── GAME LOOP ─────────────────────────────────────────────────────────────────

let lastFrame = performance.now();

function frameLoop(now) {
  const delta = Math.min(0.032, (now - lastFrame) / 1000);
  lastFrame = now;
  update(delta);
  render();
  requestAnimationFrame(frameLoop);
}

// ── CLAUDE COMMENTARY ─────────────────────────────────────────────────────────

async function fetchClaudeComment(score, level, hoops, hits) {
  if (!APPS_SCRIPT_URL) return null;
  try {
    const url = `${APPS_SCRIPT_URL}?action=commentary&score=${score}&level=${level}&hoops=${hoops}&hits=${hits}`;
    const res  = await fetch(url, { redirect: "follow" });
    const data = await res.json();
    return data.comment || null;
  } catch {
    return null;
  }
}

// ── LEADERBOARD ───────────────────────────────────────────────────────────────

function rankLabel(i) {
  if (i < 2)  return "Prize Winner";
  if (i < 10) return "Giveaway Entry";
  return "Submitted";
}

function badgeClass(i) {
  if (i < 2)  return "champion";
  if (i < 10) return "raffle";
  return "standard";
}

function sanitizeText(v) {
  return String(v).replace(/[<>&"]/g, "");
}

function renderLeaderboard() {
  const entries = loadWeeklyScores().sort((a, b) => b.score - a.score || a.createdAt.localeCompare(b.createdAt));
  if (!entries.length) {
    leaderboardBody.innerHTML = '<tr><td colspan="4" class="empty-state">No scores yet. Start the first run.</td></tr>';
    return;
  }
  leaderboardBody.innerHTML = entries.map((e, i) => `
    <tr class="${i < 2 ? "champion" : i < 10 ? "raffle" : ""}">
      <td>#${i + 1}</td>
      <td>${sanitizeText(e.name)}</td>
      <td>${e.score}</td>
      <td><span class="status-badge ${badgeClass(i)}">${rankLabel(i)}</span></td>
    </tr>`).join("");
}

const SHEETS_URL = "https://script.google.com/macros/s/AKfycbwBBaFdetFrzqHDl9T6wJAEsaSihyQF5eXCCc1iwy8Fk2OVEV-Y5HQ1ZuB-HPdQRm1j/exec";

function submitScore(name, email, score) {
  const entry = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: name.trim(),
    email: email.trim(),
    score,
    createdAt: new Date().toISOString(),
  };
  const entries = loadWeeklyScores();
  entries.push(entry);
  saveWeeklyScores(entries);
  renderLeaderboard();

  // Send to Google Sheet
  fetch(SHEETS_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: entry.name,
      email: entry.email,
      score: entry.score,
      best: gameState.best,
      submitted_at: entry.createdAt,
      source: "github-pages",
    }),
  }).catch(() => {}); // silent fail — local save already happened
}

// ── EXPORT ────────────────────────────────────────────────────────────────────

function downloadText(filename, content, mimeType) {
  const blob   = new Blob([content], { type: mimeType });
  const url    = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href  = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function exportScoresAsJson() {
  downloadText(
    `pti-cave-flight-${getWeekStart().toISOString().slice(0, 10)}.json`,
    JSON.stringify(loadWeeklyScores(), null, 2),
    "application/json",
  );
}

function csvValue(v) { return `"${String(v).replace(/"/g, '""')}"`; }

function exportScoresAsCsv() {
  const entries = loadWeeklyScores().sort((a, b) => b.score - a.score || a.createdAt.localeCompare(b.createdAt));
  const rows    = [
    ["rank", "name", "email", "score", "status", "submitted_at"].join(","),
    ...entries.map((e, i) =>
      [i + 1, csvValue(e.name), csvValue(e.email), e.score, csvValue(rankLabel(i)), e.createdAt].join(","),
    ),
  ];
  downloadText(
    `pti-cave-flight-${getWeekStart().toISOString().slice(0, 10)}.csv`,
    rows.join("\n"),
    "text/csv",
  );
}

// ── INPUT ─────────────────────────────────────────────────────────────────────

startButton.addEventListener("click",   startGame);
restartButton.addEventListener("click", startGame); // Play Again = full reset back to Level 1
document.getElementById("gate-button").addEventListener("click", startNextLevel);

const cavFireBtn = document.getElementById("cave-fire-btn");
cavFireBtn.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  if (gameState.status === "running") {
    gameState.caveShootPressed = true;
  }
});

function updateCaveFireBtn() {
  const show = gameState.status === "running";
  cavFireBtn.classList.toggle("hidden", !show);
  if (show) {
    const count = gameState.missiles;
    cavFireBtn.textContent   = count > 0 ? `🚀 FIRE` : "– FIRE";
    cavFireBtn.style.opacity = count > 0 ? "1" : "0.4";
  }
  missilesValue.textContent = String(gameState.missiles);
}

const pauseBtn = document.getElementById("pause-btn");

function updatePauseBtn() {
  const active = gameState.status === "running" || gameState.status === "boss";
  pauseBtn.classList.toggle("hidden", !active);
  pauseBtn.textContent = gameState.pausedByBlur ? "▶️" : "⏸️";
}

pauseBtn.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (gameState.status === "running" || gameState.status === "boss") {
    gameState.pausedByBlur = !gameState.pausedByBlur;
    if (!gameState.pausedByBlur) lastFrame = performance.now();
    setThrust(false);
    updatePauseBtn();
  }
});

// Map a pointer event to canvas pixel coordinates
function canvasCoords(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (WORLD_WIDTH  / rect.width),
    y: (e.clientY - rect.top)  * (WORLD_HEIGHT / rect.height),
  };
}

canvas.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  if (gameState.pausedByBlur && (gameState.status === "running" || gameState.status === "boss")) {
    gameState.pausedByBlur = false;
    lastFrame = performance.now();
    return;
  }
  if (gameState.status === "boss" && bossArena) {
    const c = canvasCoords(e);
    bossArena.joyAnchor    = { x: c.x, y: c.y };
    bossArena.joyPos       = { x: c.x, y: c.y };
    bossArena.touchActive  = true;
    bossArena.joyPointerId = e.pointerId;
    canvas.setPointerCapture(e.pointerId);
    return;
  }
  setThrust(true);
});

canvas.addEventListener("pointermove", (e) => {
  if (gameState.status === "boss" && bossArena && bossArena.touchActive
      && e.pointerId === bossArena.joyPointerId) {
    bossArena.joyPos = canvasCoords(e);
  }
});

function clearBossTouch() {
  if (bossArena) {
    bossArena.touchActive  = false;
    bossArena.joyAnchor    = null;
    bossArena.joyPos       = null;
    bossArena.joyPointerId = null;
  }
}
canvas.addEventListener("pointerup",     (e) => { if (e.pointerId === bossArena?.joyPointerId) clearBossTouch(); setThrust(false); });
canvas.addEventListener("pointerleave",  ()  => { setThrust(false); });
canvas.addEventListener("pointercancel", (e) => { if (e.pointerId === bossArena?.joyPointerId) clearBossTouch(); setThrust(false); });
window.addEventListener("pointerup",     () => setThrust(false));

window.addEventListener("keydown", (e) => {
  if (gameState.status === "boss") { bossKeys[e.key] = true; e.preventDefault(); return; }
  if (e.code === "Space") { e.preventDefault(); setThrust(true); }
  if ((e.code === "KeyX" || e.code === "KeyZ") && gameState.status === "running") {
    e.preventDefault(); gameState.caveShootPressed = true;
  }
});
window.addEventListener("keyup", (e) => {
  if (gameState.status === "boss") { delete bossKeys[e.key]; e.preventDefault(); return; }
  if (e.code === "Space") { e.preventDefault(); setThrust(false); }
});

window.addEventListener("blur",  () => { gameState.pausedByBlur = true;  setThrust(false); });
window.addEventListener("focus", () => { gameState.pausedByBlur = false; lastFrame = performance.now(); });

// Boss ready button
document.getElementById("boss-ready-btn").addEventListener("click", () => {
  document.getElementById("boss-ready-overlay").classList.add("hidden");
  const bossIndex = gameState.levelIndex;
  gameState.status = "boss";
  initBossArena(bossIndex);
  document.getElementById("boss-controls").classList.remove("hidden");
  document.getElementById("btn-swap").classList.toggle("hidden", bossArena.weapons.length <= 1);
  updateCaveFireBtn();  // ensure missile button is hidden during boss fight
  updatePauseBtn();
});

// Fire button touch control for boss fight (movement handled by canvas joystick)
[["btn-fire"," "]].forEach(([id, key]) => {
  const el = document.getElementById(id);
  el.addEventListener("pointerdown",  (e) => { e.preventDefault(); bossKeys[key] = true;  });
  el.addEventListener("pointerup",    (e) => { e.preventDefault(); delete bossKeys[key];  });
  el.addEventListener("pointerleave", (e) => { e.preventDefault(); delete bossKeys[key];  });
  el.addEventListener("pointercancel",(e) => { e.preventDefault(); delete bossKeys[key];  });
});

// SWAP button — cycle weapon on tap
document.getElementById("btn-swap").addEventListener("pointerdown", (e) => {
  e.preventDefault();
  if (bossArena && bossArena.phase === "fight") {
    bossArena.weaponIndex = (bossArena.weaponIndex + 1) % bossArena.weapons.length;
  }
});

// Pause when clicking anywhere outside the game canvas
document.addEventListener("pointerdown", (e) => {
  if (e.target === canvas) return;
  if (e.target.closest("#boss-controls")) return;  // d-pad / fire / swap don't pause
  if (e.target.closest("#cave-fire-btn")) return;  // missile button doesn't pause
  if (e.target.closest("#pause-btn"))      return;  // pause button handles itself
  if ((gameState.status === "running" || gameState.status === "boss") && !gameState.pausedByBlur) {
    gameState.pausedByBlur = true;
    setThrust(false);
  }
});

document.addEventListener("visibilitychange", () => {
  gameState.pausedByBlur = document.hidden;
  if (document.hidden) setThrust(false);
  else lastFrame = performance.now();
});

scoreForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (gameState.justSubmitted) return;
  submitScore(playerNameInput.value, playerEmailInput.value, gameState.finalTotal || gameState.score);
  gameState.justSubmitted    = true;
  resultMessage.textContent  = "Score submitted. Play again any time to climb the board.";
  playerNameInput.value      = "";
  playerEmailInput.value     = "";
});

exportJsonButton.addEventListener("click", exportScoresAsJson);
exportCsvButton.addEventListener("click",  exportScoresAsCsv);

resetBoardButton.addEventListener("click", () => {
  if (!window.confirm("Reset this week's leaderboard?")) return;
  localStorage.removeItem(getWeekKey());
  renderLeaderboard();
});

// ── INIT ─────────────────────────────────────────────────────────────────────

missilesValue.textContent = String(gameState.missiles);
bestValue.textContent = String(gameState.best);
renderLeaderboard();
resetGame();
render();
requestAnimationFrame(frameLoop);
