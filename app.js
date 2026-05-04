// â”€â”€ CONFIG â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const STORAGE_PREFIX = "pti-cave-flight";
const SHARED_LEADERBOARD_KEY = "pti_arcade_monthly_scores";
const ACTIVE_GAME_TYPE = "cave-flight";
const ACTIVE_GAME_NAME = "Ink Flight Rush";
const MAX_LIVES = 5;
const HEART_SCORE_GAP = 1050;
const HEARTS_PER_LEVEL = 2;
const BACKGROUND_SCROLL_SPEED = 0.34;
const FOREGROUND_SCROLL_SPEED = 0.72;
const POWERUP_FIRST_SPAWN_RANGE = [10, 15]; // seconds before first gun/shield chance in a level
const POWERUP_SPAWN_RANGE = [20, 35];       // seconds between later gun/shield chances
const DEFAULT_GUN_DURATION = 9;             // seconds of free auto-fire
const DEFAULT_AUTO_FIRE_INTERVAL = 0.5;     // seconds between free gun shots
const DEFAULT_SHIELD_HITS = 1;              // one-hit shield by default
const MIN_GUN_PICKUPS_PER_LEVEL = 2;        // guaranteed gun drops per Ink Flight level
const MIN_SHIELD_PICKUPS_PER_LEVEL = 2;     // guaranteed shield drops per Ink Flight level
const MAX_SHIELD_HITS = 2;                  // shield charges can stack, but only up to two hits
const GUARANTEED_GUN_PROGRESS = [0.12, 0.42];
const GUARANTEED_SHIELD_PROGRESS = [0.24, 0.62];

// Paste your deployed Google Apps Script URL here after setting up Claude commentary
const APPS_SCRIPT_URL = "";

// Shared arcade palette for the Ink Flight Rush canvas UI.
const C = {
  bgTop:        "#031417",
  bgMid:        "#062b32",
  wallDark:     "#04171d",
  wallMid:      "#0d4f5a",
  wallLight:    "#159aa8",
  wallEdge:     "rgba(125,255,99,0.92)",
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
  gridLine:     "rgba(125,255,99,0.16)",
  bannerBg:     "rgba(2,14,17,0.96)",
};

// â”€â”€ DOM REFS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const canvas             = document.getElementById("game-canvas");
const ctx                = canvas.getContext("2d");
const IS_MOBILE_FLIGHT_PORTRAIT = window.matchMedia("(max-width: 700px) and (orientation: portrait)").matches;
if (IS_MOBILE_FLIGHT_PORTRAIT) {
  canvas.width = 540;
  canvas.height = 960;
  document.documentElement.classList.add("cave-flight-mobile-portrait");
  document.body?.classList.add("cave-flight-mobile-portrait");
}
const ptiLogoImg         = new Image();
let   ptiLogoReady       = false;
ptiLogoImg.onload        = () => { ptiLogoReady = true; };
ptiLogoImg.src           = './pti-logo.png';
const HELICOPTER_ASSET_BASE = "./Assets/slingshot/helicopter/";
const helicopterAssets = {
  background1:   loadHelicopterAsset("background1.png", { eager: false }),
  background2:   loadHelicopterAsset("background2.png", { eager: false }),
  background3:   loadHelicopterAsset("background3.png", { eager: false }),
  background4:   loadHelicopterAsset("background4.png", { eager: false }),
  background5:   loadHelicopterAsset("background5.png", { eager: false }),
  background6:   loadHelicopterAsset("background6.png", { eager: false }),
  background7:   loadHelicopterAsset("background7.png", { eager: false }),
  background8:   loadHelicopterAsset("background8.png", { eager: false }),
  background9:   loadHelicopterAsset("background9.png", { eager: false }),
  background10:  loadHelicopterAsset("background10.png", { eager: false }),
  background11:  loadHelicopterAsset("background11.png", { eager: false }),
  drone:        loadHelicopterAsset("drone.png"),
  dtfRoll:      loadHelicopterAsset("dtf-roll.png"),
  glowingBeam:  loadHelicopterAsset("glowing-beam.png"),
  gun:          loadHelicopterAsset("gun.png"),
  helicopter:   loadHelicopterAsset("helicopter.png"),
  ink:          loadHelicopterAsset("ink.png"),
  missile:      loadHelicopterAsset("missile.png"),
  motionBlur:   loadHelicopterAsset("motion-blur.png"),
  paintRing:    loadHelicopterAsset("paint-ring.png"),
  paintSmoke:   loadHelicopterAsset("paint-smoke.png"),
  shield:       loadHelicopterAsset("shield.png"),
};
const scoreValue         = document.getElementById("score-value");
// modeValue removed â€” Mode pill deleted from HUD
const lifeValue          = document.getElementById("life-value");
const bestValue          = document.getElementById("best-value");
const missilesValue      = document.getElementById("missiles-value");
const startOverlay       = document.getElementById("start-overlay");
const gameOverOverlay    = document.getElementById("game-over-overlay");
const startButton        = document.getElementById("start-button");
const restartButton      = document.getElementById("restart-button");
const caveResultArcade   = document.getElementById("cave-result-arcade");
const scoreForm          = document.getElementById("score-form");
const playerNameInput    = document.getElementById("player-name");
const playerEmailInput   = document.getElementById("player-email");
const finalScoreHeading  = document.getElementById("final-score-heading");
const resultPrizePoints  = document.getElementById("result-prize-points");
const resultBestPrizePoints = document.getElementById("result-best-pp");
const resultRankMessage  = document.getElementById("result-rank-message");
const resultMessage      = document.getElementById("result-message");
const leaderboardBody    = document.getElementById("leaderboard-body");
const exportJsonButton   = document.getElementById("export-json");
const exportCsvButton    = document.getElementById("export-csv");
const resetBoardButton   = document.getElementById("reset-board");
const caveLevelSelectOverlay = document.getElementById("cave-level-select-overlay");
const caveLevelGrid     = document.getElementById("cave-level-grid");
const caveLevelBack     = document.getElementById("cave-level-back");
const startLevelKicker  = document.getElementById("start-level-kicker");
const startLevelTitle   = document.getElementById("start-level-title");
const resultLevelLabel  = document.getElementById("result-level-label");
const gateScoreForm     = document.getElementById("gate-score-form");
const gatePlayerNameInput = document.getElementById("gate-player-name");
const gatePlayerEmailInput = document.getElementById("gate-player-email");
const gateReplayButton  = document.getElementById("gate-replay-button");
const gateArcadeButton  = document.getElementById("gate-arcade-button");
const gateRankMessage   = document.getElementById("gate-rank-message");
const gateRawScore      = document.getElementById("gate-raw-score");
const gatePrizePoints   = document.getElementById("gate-prize-points");
const gateBestPrizePoints = document.getElementById("gate-best-pp");
const cavePauseOverlay   = document.getElementById("cave-pause-overlay");
const cavePauseResume    = document.getElementById("cave-pause-resume");
const cavePauseRestart   = document.getElementById("cave-pause-restart");
const cavePauseLevels    = document.getElementById("cave-pause-levels");
const cavePauseArcade    = document.getElementById("cave-pause-arcade");
const cavePauseSound     = document.getElementById("cave-pause-sound");
let caveSoundMuted       = localStorage.getItem(`${STORAGE_PREFIX}:muted`) === "1";

function loadHelicopterAsset(fileName, options = {}) {
  const img = new Image();
  img.ready = false;
  img.loadStarted = false;
  img.onload = () => {
    img.ready = true;
  };
  img.onerror = () => {
    console.warn(`Could not load ${HELICOPTER_ASSET_BASE}${fileName}`);
  };
  img.ensureLoaded = () => {
    if (img.loadStarted) return;
    img.loadStarted = true;
    img.src = `${HELICOPTER_ASSET_BASE}${fileName}`;
  };
  if (options.eager !== false) img.ensureLoaded();
  return img;
}

// â”€â”€ WORLD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const WORLD_WIDTH  = canvas.width;
const WORLD_HEIGHT = canvas.height;
const COLUMN_WIDTH = 24;
const COLUMN_COUNT = Math.ceil(WORLD_WIDTH / COLUMN_WIDTH) + 6;
const PLAYABLE_TOP_PADDING = 72;
const PLAYABLE_BOTTOM_PADDING = 104;
const MOBILE_FLIGHT_SPEED_SCALE = IS_MOBILE_FLIGHT_PORTRAIT ? 0.84 : 1;
const MOBILE_FLIGHT_GAP_BONUS = IS_MOBILE_FLIGHT_PORTRAIT ? 170 : 0;

// â”€â”€ LEVELS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const LEVEL_DEFS = [
  {
    id: 1, name: "Level 1: Print Run",
    subtitle: "Thread the hoops",
    instruction: "Fly through paint rings for +100 bonus points. Dodge print-shop objects and grab rapid gun drops to clear obstacles.",
    completionScore: 900,
    obstacleTypes: ["paint-ring", "dtf-roll", "ink", "missile"],
    hoopWeight: 0.55,
    baseSpeed: 108, baseGap: 470,
    color: "#4dd9ff",
  },
  {
    id: 2, name: "Level 2: Shop Floor",
    subtitle: "Dodge the press",
    instruction: "Dodge drones, DTF rolls, ink drops, and smoke clouds. Rapid gun drops can clear a path.",
    completionScore: 1400,
    obstacleTypes: ["paint-ring", "drone", "dtf-roll", "ink", "paint-smoke", "missile"],
    hoopWeight: 0.15,
    baseSpeed: 128, baseGap: 435,
    color: "#ff9f43",
  },
  {
    id: 3, name: "Rush Order",
    subtitle: "Survive as long as you can",
    instruction: "All print-shop hazards, full speed. Collect paint rings, dodge everything else.",
    completionScore: 1800,
    obstacleTypes: ["paint-ring", "drone", "dtf-roll", "ink", "paint-smoke", "glowing-beam", "missile"],
    baseSpeed: 152, baseGap: 392,
    color: "#ffcc5c",
    verticalMovement: true,
    droneWeight: 0.35,
  },
  {
    id: 4, name: "Deadline Crunch",
    subtitle: "Nothing stays still",
    instruction: "Maximum speed, moving obstacles, tighter routes. Rapid gun drops can blast a path through hazards.",
    completionScore: 2500,
    obstacleTypes: ["paint-ring", "drone", "dtf-roll", "glowing-beam", "paint-smoke", "motion-blur", "missile"],
    hoopWeight: 0.3,
    baseSpeed: 185, baseGap: 352,
    color: "#ff4757",
    verticalMovement: true,
    droneWeight: 0.45,
  },
  {
    id: 5, name: "Night Shift",
    subtitle: "No mercy. Survive.",
    instruction: "Drones everywhere. Shoot them down or dodge them. Only the best survive the night shift.",
    completionScore: 3500,
    obstacleTypes: ["paint-ring", "drone", "drone", "dtf-roll", "glowing-beam", "paint-smoke", "motion-blur", "missile"],
    hoopWeight: 0.25,
    baseSpeed: 210, baseGap: 340,
    color: "#a29bfe",
    verticalMovement: true,
    droneWeight: 0.55,
  },
  {
    id: 6, name: "Double Shift",
    subtitle: "Beyond the limit.",
    instruction: "Drone swarms and brutal speed. Shoot what you can, dodge the rest. Every heart counts.",
    completionScore: 5000,
    obstacleTypes: ["paint-ring", "drone", "drone", "dtf-roll", "glowing-beam", "ink", "paint-smoke", "motion-blur", "missile"],
    hoopWeight: 0.2,
    baseSpeed: 235, baseGap: 326,
    color: "#fd9644",
    verticalMovement: true,
    droneWeight: 0.60,
  },
  {
    id: 7, name: "The Final Press",
    subtitle: "This is the end.",
    instruction: "Maximum drone swarms. Shoot everything. Tightest route. Only the best pilots finish The Final Press.",
    completionScore: 7000,
    obstacleTypes: ["paint-ring", "drone", "drone", "dtf-roll", "glowing-beam", "paint-smoke", "motion-blur", "missile"],
    hoopWeight: 0.18,
    baseSpeed: 260, baseGap: 312,
    color: "#ff2255",
    verticalMovement: true,
    droneWeight: 0.65,
  },
  {
    id: 8, name: "Graveyard Shift",
    subtitle: "The route fights back.",
    instruction: "Tightest gaps yet. Drone swarms hunt you relentlessly. Use your missiles wisely.",
    completionScore: 9000,
    obstacleTypes: ["paint-ring", "drone", "drone", "dtf-roll", "glowing-beam", "paint-smoke", "motion-blur", "missile"],
    hoopWeight: 0.16,
    baseSpeed: 285, baseGap: 296,
    color: "#00e5ff",
    verticalMovement: true,
    droneWeight: 0.70,
  },
  {
    id: 9, name: "Midnight Run",
    subtitle: "Almost nothing left.",
    instruction: "Barely any room to move. Drones everywhere. Only missiles and instinct will carry you through.",
    completionScore: 11000,
    obstacleTypes: ["paint-ring", "drone", "drone", "glowing-beam", "paint-smoke", "motion-blur", "ink", "missile"],
    hoopWeight: 0.14,
    baseSpeed: 308, baseGap: 282,
    color: "#bf5fff",
    verticalMovement: true,
    droneWeight: 0.75,
  },
  {
    id: 10, name: "Legendary Print",
    subtitle: "Only legends reach this.",
    instruction: "The ultimate run. Maximum speed, minimum space. Survive long enough and your name is permanent.",
    completionScore: 14000,
    obstacleTypes: ["paint-ring", "drone", "drone", "glowing-beam", "paint-smoke", "motion-blur", "ink", "missile"],
    hoopWeight: 0.12,
    baseSpeed: 330, baseGap: 268,
    color: "#ffd700",
    verticalMovement: true,
    droneWeight: 0.80,
  },
];

function getLevelForScore(score) {
  let level = LEVEL_DEFS[0];
  let cumulativeScore = 0;

  for (let i = 0; i < LEVEL_DEFS.length; i++) {
    if (i > 0) cumulativeScore += LEVEL_DEFS[i - 1].completionScore;
    if (score >= cumulativeScore) level = LEVEL_DEFS[i];
  }

  return level;
}

// â”€â”€ CAVE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const cave = {
  ceiling:     new Array(COLUMN_COUNT).fill(72),
  floor:       new Array(COLUMN_COUNT).fill(WORLD_HEIGHT),
  offset:      0,
  nextCeiling: 72,
  nextFloor:   WORLD_HEIGHT,
};

// â”€â”€ HELICOPTER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const helicopter = {
  x: IS_MOBILE_FLIGHT_PORTRAIT ? 94 : 122,
  y: IS_MOBILE_FLIGHT_PORTRAIT ? WORLD_HEIGHT * 0.46 : 308,
  width: 54, height: 24,
  velocityY: 0,
  rotor: 0,
  thrusting: false,
  thrustGlow: 0,
};

// â”€â”€ FLOATERS (hoops + branded obstacles) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Each: { type, cx, cy, w, h, radius, rotation, rotSpeed, phase, collected }

const floaters = [];

// â”€â”€ SMOKE PUFFS (put-put exhaust) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Each: { x, y, vy, age, maxAge, size0 }
// Emitted as discrete blobs that expand and fade, giving a chuffing exhaust look

const smokePuffs = [];

// â”€â”€ PARTICLES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Each: { x, y, vx, vy, life, maxLife, color, size }

const particles = [];

// â”€â”€ SCORE POPUPS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Each: { x, y, text, life }

const scorePopups  = [];
const caveBullets  = [];
const burstBullets = []; // free auto-fired energy bolts during burst

// â”€â”€ LEVEL BANNER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const banner = { active: false, alpha: 0, def: null, timer: 0 };

// â”€â”€ GAME STATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
  missiles:             3,  // stacks across levels; +1 per level start
  caveGunTimer:         0,
  caveShootPressed:     false,
  caveShield:           0,  // one-hit shield charges remaining
  caveBurst:            0,  // seconds of gun auto-fire remaining
  caveBurstFireTimer:   0,  // auto-fire timer during gun power-up
  pickupTimer:          0,
  gunPickupsSpawnedThisLevel: 0,
  shieldPickupsSpawnedThisLevel: 0,
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

// â”€â”€ STORAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function getMonthId(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function loadBestScore() {
  return parseInt(localStorage.getItem(`${STORAGE_PREFIX}:best`) || "0", 10) || 0;
}

function saveBestScore(score) {
  localStorage.setItem(`${STORAGE_PREFIX}:best`, String(score));
}

function loadWeeklyScores() {
  return window.PTIArcade ? window.PTIArcade.getLeaderboard() : [];
}

function saveWeeklyScores(entries) {
  if (!window.PTIArcade) localStorage.setItem(SHARED_LEADERBOARD_KEY, JSON.stringify(entries.slice(0, 20)));
}

const INK_FLIGHT_LEVELS = LEVEL_DEFS;
const INK_FLIGHT_STORAGE = {
  unlockedLevel: "pti_ink_flight_unlocked_level",
  completedLevels: "pti_ink_flight_completed_levels",
  bestByLevel: "pti_ink_flight_best_by_level",
};

function readLocalJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

function writeLocalJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getLevelDef(levelNumber = gameState.levelIndex + 1) {
  const safeNumber = Math.max(1, Math.min(INK_FLIGHT_LEVELS.length, Math.floor(Number(levelNumber) || 1)));
  return INK_FLIGHT_LEVELS[safeNumber - 1];
}

function getUnlockedLevel() {
  const saved = parseInt(localStorage.getItem(INK_FLIGHT_STORAGE.unlockedLevel) || "1", 10);
  const savedLevel = Math.max(1, Math.min(INK_FLIGHT_LEVELS.length, Number.isFinite(saved) ? saved : 1));
  const completed = readLocalJson(INK_FLIGHT_STORAGE.completedLevels, []);
  const highestCompleted = Array.isArray(completed)
    ? Math.max(0, ...completed.map((value) => Math.floor(Number(value))).filter((value) => value >= 1 && value <= INK_FLIGHT_LEVELS.length))
    : 0;
  const repairedLevel = Math.max(savedLevel, Math.min(INK_FLIGHT_LEVELS.length, highestCompleted + 1));
  if (repairedLevel !== savedLevel) localStorage.setItem(INK_FLIGHT_STORAGE.unlockedLevel, String(repairedLevel));
  return repairedLevel;
}

function saveUnlockedLevel(levelNumber) {
  const current = getUnlockedLevel();
  const next = Math.max(current, Math.max(1, Math.min(INK_FLIGHT_LEVELS.length, Math.floor(Number(levelNumber) || 1))));
  localStorage.setItem(INK_FLIGHT_STORAGE.unlockedLevel, String(next));
  return next;
}

function getCompletedLevels() {
  const completed = readLocalJson(INK_FLIGHT_STORAGE.completedLevels, []);
  return new Set(Array.isArray(completed) ? completed.map((value) => Math.floor(Number(value))).filter((value) => value >= 1 && value <= INK_FLIGHT_LEVELS.length) : []);
}

function saveCompletedLevels(completedSet) {
  writeLocalJson(INK_FLIGHT_STORAGE.completedLevels, Array.from(completedSet).sort((a, b) => a - b));
}

function getBestByLevel() {
  const bests = readLocalJson(INK_FLIGHT_STORAGE.bestByLevel, {});
  return bests && typeof bests === "object" && !Array.isArray(bests) ? bests : {};
}

function saveBestByLevel(bests) {
  writeLocalJson(INK_FLIGHT_STORAGE.bestByLevel, bests);
}

function updateBestByLevel(levelNumber, rawScore) {
  const prizePoints = window.PTIArcade
    ? window.PTIArcade.calculatePrizePoints(ACTIVE_GAME_TYPE, rawScore)
    : rawScore;
  const bests = getBestByLevel();
  const key = String(levelNumber);
  const previous = bests[key];
  if (!previous || prizePoints > Number(previous.prizePoints || 0) || (prizePoints === Number(previous.prizePoints || 0) && rawScore > Number(previous.rawScore || 0))) {
    bests[key] = { rawScore, prizePoints, updatedAt: new Date().toISOString() };
    saveBestByLevel(bests);
  }
  return { prizePoints, best: bests[key] };
}

function markLevelComplete(levelNumber, rawScore) {
  const completed = getCompletedLevels();
  completed.add(levelNumber);
  saveCompletedLevels(completed);
  saveUnlockedLevel(Math.min(INK_FLIGHT_LEVELS.length, levelNumber + 1));
  return updateBestByLevel(levelNumber, rawScore);
}

function isLevelUnlocked(levelNumber) {
  return levelNumber <= getUnlockedLevel();
}

// â”€â”€ DIFFICULTY CURVES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function getSpeedForScore(score) {
  const base = LEVEL_DEFS[gameState.levelIndex].baseSpeed;
  let speed;
  if (score < 250) speed = base;
  else if (score < 500) speed = base + 14;
  else if (score < 700) speed = base + 24;
  else speed = base + 32;
  return speed * MOBILE_FLIGHT_SPEED_SCALE;
}

function getGapForScore(score) {
  const maxPortraitGap = WORLD_HEIGHT - PLAYABLE_TOP_PADDING - PLAYABLE_BOTTOM_PADDING - 64;
  const base      = Math.min(maxPortraitGap, LEVEL_DEFS[gameState.levelIndex].baseGap + MOBILE_FLIGHT_GAP_BONUS);
  const wideStart = IS_MOBILE_FLIGHT_PORTRAIT ? Math.min(maxPortraitGap, 720) : 520; // all levels start with a generous opening
  // Smoothly narrow from wideStart to base. Level 4+ eases in over a longer run.
  const lateLevel = gameState.levelIndex >= 3;
  const shrinkDistance = lateLevel ? 520 : 300;
  if (score < shrinkDistance) {
    const t = score / shrinkDistance;
    return Math.round(wideStart - (wideStart - base) * t);
  }
  if (lateLevel) {
    if (score < 760) return base;
    if (score < 1000) return base - 10;
    if (score < 1240) return base - 18;
    return base - 26;
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
  return score < 400 ? 0.72 : 0.52; // levels 8â€“10: extremely dense
}

// â”€â”€ CAVE GENERATION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function randomRange([min, max]) {
  return min + Math.random() * (max - min);
}

function getPickupConfig() {
  const def = LEVEL_DEFS[gameState.levelIndex] || {};
  return {
    enableGunPickup: def.enableGunPickup !== false,
    enableShieldPickup: def.enableShieldPickup !== false,
    pickupSpawnMin: (def.pickupSpawnMinMs || POWERUP_SPAWN_RANGE[0] * 1000) / 1000,
    pickupSpawnMax: (def.pickupSpawnMaxMs || POWERUP_SPAWN_RANGE[1] * 1000) / 1000,
    gunDuration: def.gunDuration || DEFAULT_GUN_DURATION,
    autoFireInterval: def.autoFireInterval || DEFAULT_AUTO_FIRE_INTERVAL,
    shieldHits: def.shieldHits || DEFAULT_SHIELD_HITS,
    maxShieldHits: def.maxShieldHits || MAX_SHIELD_HITS,
    minGunPickups: def.minGunPickups || MIN_GUN_PICKUPS_PER_LEVEL,
    minShieldPickups: def.minShieldPickups || MIN_SHIELD_PICKUPS_PER_LEVEL,
    gunProgress: def.gunPickupProgress || GUARANTEED_GUN_PROGRESS,
    shieldProgress: def.shieldPickupProgress || GUARANTEED_SHIELD_PROGRESS,
  };
}

function queueNextPickupSpawn(first = false) {
  const config = getPickupConfig();
  const range = first ? POWERUP_FIRST_SPAWN_RANGE : [config.pickupSpawnMin, config.pickupSpawnMax];
  gameState.pickupTimer = randomRange(range);
}

function getDueGuaranteedPickupType() {
  const config = getPickupConfig();
  const levelDef = LEVEL_DEFS[gameState.levelIndex];
  if (!levelDef?.completionScore) return null;

  const levelScore = Math.floor(gameState.distance / 6);
  const due = [];
  if (config.enableGunPickup && gameState.gunPickupsSpawnedThisLevel < config.minGunPickups) {
    const threshold = config.gunProgress[gameState.gunPickupsSpawnedThisLevel] ?? config.gunProgress[config.gunProgress.length - 1];
    if (levelScore >= levelDef.completionScore * threshold) due.push("gun");
  }
  if (config.enableShieldPickup && gameState.shieldPickupsSpawnedThisLevel < config.minShieldPickups) {
    const threshold = config.shieldProgress[gameState.shieldPickupsSpawnedThisLevel] ?? config.shieldProgress[config.shieldProgress.length - 1];
    if (levelScore >= levelDef.completionScore * threshold) due.push("shield");
  }
  if (!due.length) return null;
  if (due.length === 1) return due[0];
  return gameState.gunPickupsSpawnedThisLevel <= gameState.shieldPickupsSpawnedThisLevel ? "gun" : "shield";
}

function generateNextColumn(index, initializing = false) {
  const score = gameState.displayedScore;
  const gap = getGapForScore(score);
  const driftLimit = initializing ? 2 : score < 130 ? 6 : 8;
  const drift = Math.random() * driftLimit * 2 - driftLimit;

  // Keep the cave vertically centred as it narrows; floor stays above the HUD strip
  const minCeiling = 44;
  const maxCeiling = WORLD_HEIGHT - gap - 82; // 82px clearance for HUD at bottom
  const midCeiling = (minCeiling + maxCeiling) / 2;
  // Gentle centering pull â€” stronger when far from centre so the cave doesn't drift into the HUD
  const pull = (midCeiling - cave.nextCeiling) * 0.07;

  cave.nextCeiling = clamp(cave.nextCeiling + drift + pull, minCeiling, maxCeiling);
  cave.nextFloor   = cave.nextCeiling + gap;

  return { ceiling: cave.nextCeiling, floor: cave.nextFloor };
}

function resetCave() {
  cave.offset = 0;
  // Start cave centred â€” wide opening, symmetric top and bottom
  const startGap = IS_MOBILE_FLIGHT_PORTRAIT
    ? Math.min(WORLD_HEIGHT - PLAYABLE_TOP_PADDING - PLAYABLE_BOTTOM_PADDING - 64, 720)
    : 520;
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

// â”€â”€ FLOATER SPAWNING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function spawnFloater() {
  const allowed = LEVEL_DEFS[gameState.levelIndex].obstacleTypes;

  const b = getCaveBoundsAtX(WORLD_WIDTH - COLUMN_WIDTH * 2);
  const minY = b.ceiling + 62;
  const maxY = b.floor - 62;
  if (maxY - minY < 80) return;

  const cx = WORLD_WIDTH + 50;
  const cy = minY + Math.random() * (maxY - minY);

  const def = LEVEL_DEFS[gameState.levelIndex];
  const canSpawnHeart =
    gameState.lives < MAX_LIVES &&
    gameState.heartsSpawnedThisLevel < HEARTS_PER_LEVEL &&
    gameState.displayedScore - gameState.lastHeartScore >= HEART_SCORE_GAP &&
    !floaters.some((f) => f.type === "heart") &&
    Math.random() < 0.18;

  if (canSpawnHeart) {
    gameState.heartsSpawnedThisLevel += 1;
    gameState.lastHeartScore = gameState.displayedScore;
    gameState.lastAnySpecialScore = gameState.displayedScore;
    floaters.push({
      type: "heart",
      cx,
      cy,
      baseCy: cy,
      vertAmp: 18 + Math.random() * 18,
      vertFreq: 0.85 + Math.random() * 0.45,
      w: 34,
      h: 34,
      rotation: 0,
      rotSpeed: 0,
      phase: Math.random() * Math.PI * 2,
      collected: false,
    });
    return;
  }

  const ringWeight = def.hoopWeight !== undefined ? def.hoopWeight : 0.35;
  let type;
  if (allowed.length === 1) {
    type = allowed[0];
  } else {
    const nonRing = allowed.filter(t => t !== "paint-ring");
    if (allowed.includes("paint-ring") && Math.random() < ringWeight) {
      type = "paint-ring";
    } else {
      const nonSpecial = nonRing.filter(t => t !== "missile");
      const missileGap  = 400;
      const missileChance = 0.22;
      const anySep = gameState.displayedScore - gameState.lastAnySpecialScore >= 500;

      if (allowed.includes("missile")
          && gameState.missilesSpawnedThisLevel < 4
          && gameState.displayedScore - gameState.lastMissileScore >= missileGap
          && anySep
          && Math.random() < missileChance) {
        gameState.missilesSpawnedThisLevel++;
        gameState.lastMissileScore = gameState.displayedScore;
        gameState.lastAnySpecialScore = gameState.displayedScore;
        type = "missile";
      } else if (gameState.levelIndex === 1) {
        const fresh = nonSpecial.filter(t => t !== gameState.lastSpawnType);
        type = (fresh.length > 0 ? fresh : nonSpecial)[Math.floor(Math.random() * (fresh.length > 0 ? fresh : nonSpecial).length)];
      } else {
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
  const lv2      = gameState.levelIndex === 1;
  const vertAmp  = vertMov ? 28 + Math.random() * 36 : (lv2 ? 10 + Math.random() * 14 : 0);
  const vertFreq = vertMov ? 0.7 + Math.random() * 1.0 : (lv2 ? 0.7 + Math.random() * 0.7 : 0);

  const ringAmp  = 32 + gameState.levelIndex * 16 + Math.random() * 20;
  const ringFreq = 0.8 + gameState.levelIndex * 0.3 + Math.random() * 0.6;

  if (type === "paint-ring") {
    floaters.push({ type, cx, cy, baseCy: cy, vertAmp: ringAmp, vertFreq: ringFreq, w: 48, h: 48, radius: 19 + Math.random() * 4, rotation: 0, rotSpeed: 0.5, phase: Math.random() * Math.PI * 2, collected: false });
  } else if (type === "drone") {
    const droneAmp  = 40 + Math.random() * 50;
    const droneFreq = 1.2 + Math.random() * 1.2;
    floaters.push({ type, cx, cy, baseCy: cy, vertAmp: droneAmp, vertFreq: droneFreq, w: 44, h: 32, rotation: 0, rotSpeed: 0, phase: Math.random() * Math.PI * 2, collected: false });
  } else if (type === "dtf-roll") {
    floaters.push({ type, cx, cy, baseCy: cy, vertAmp, vertFreq, w: 50, h: 34, rotation: (Math.random() - 0.5) * 0.22, rotSpeed: (Math.random() > 0.5 ? 1 : -1) * 0.7, phase: Math.random() * Math.PI * 2, collected: false });
  } else if (type === "glowing-beam") {
    const beamH = Math.min(maxY - minY, 118 + gameState.levelIndex * 7);
    floaters.push({ type, cx, cy, baseCy: cy, vertAmp: vertAmp * 0.55, vertFreq, w: 22, h: beamH, rotation: 0, rotSpeed: 0, phase: Math.random() * Math.PI * 2, collected: false });
  } else if (type === "ink") {
    floaters.push({ type, cx, cy, baseCy: cy, vertAmp: 24 + Math.random() * 24, vertFreq: 1.0 + Math.random() * 0.7, w: 34, h: 50, rotation: (Math.random() - 0.5) * 0.5, rotSpeed: (Math.random() - 0.5) * 1.0, phase: Math.random() * Math.PI * 2, collected: false });
  } else if (type === "motion-blur") {
    floaters.push({ type, cx, cy, baseCy: cy, vertAmp: 18 + Math.random() * 28, vertFreq: 1.6 + Math.random() * 0.9, w: 66, h: 32, rotation: (Math.random() - 0.5) * 0.18, rotSpeed: 0, phase: Math.random() * Math.PI * 2, collected: false });
  } else if (type === "paint-smoke") {
    floaters.push({ type, cx, cy, baseCy: cy, vertAmp: 28 + Math.random() * 24, vertFreq: 0.75 + Math.random() * 0.6, w: 58, h: 52, rotation: (Math.random() - 0.5) * 0.22, rotSpeed: (Math.random() - 0.5) * 0.25, phase: Math.random() * Math.PI * 2, collected: false });
  } else if (type === "missile") {
    floaters.push({ type, cx, cy, baseCy: cy, vertAmp: 18, vertFreq: 1.3, w: 36, h: 14, rotation: 0, rotSpeed: 0, phase: Math.random() * Math.PI * 2, collected: false });
  }
}

function spawnPowerPickup(forcedType = null) {
  const config = getPickupConfig();
  const possible = [];
  if (config.enableGunPickup) possible.push("gun");
  if (config.enableShieldPickup) possible.push("shield");
  if (!possible.length) {
    queueNextPickupSpawn(false);
    return false;
  }
  if (forcedType && !possible.includes(forcedType)) {
    queueNextPickupSpawn(false);
    return false;
  }

  if (floaters.some((f) => f.type === "gun" || f.type === "shield")) {
    gameState.pickupTimer = Math.min(gameState.pickupTimer, 1.2);
    return false;
  }

  const b = getCaveBoundsAtX(WORLD_WIDTH - COLUMN_WIDTH * 2);
  const minY = Math.max(PLAYABLE_TOP_PADDING + 34, b.ceiling + 72);
  const maxY = Math.min(WORLD_HEIGHT - PLAYABLE_BOTTOM_PADDING - 34, b.floor - 72);
  if (maxY <= minY) {
    queueNextPickupSpawn(false);
    return false;
  }

  const type = forcedType || (possible.length === 2
    ? (Math.random() < 0.62 ? "gun" : "shield")
    : possible[0]);

  const cy = minY + Math.random() * (maxY - minY);
  const spawnX = WORLD_WIDTH + 70;
  const tooCloseToHazard = floaters.some((f) =>
    Math.abs(f.cx - spawnX) < 90 &&
    Math.abs(f.cy - cy) < Math.max(70, (f.h || 40) * 1.4)
  );
  if (tooCloseToHazard) {
    gameState.pickupTimer = Math.min(gameState.pickupTimer, 1.2);
    return false;
  }
  if (type === "gun") gameState.gunPickupsSpawnedThisLevel += 1;
  if (type === "shield") gameState.shieldPickupsSpawnedThisLevel += 1;
  floaters.push({
    type,
    cx: spawnX,
    cy,
    baseCy: cy,
    vertAmp: 18 + Math.random() * 16,
    vertFreq: 0.85 + Math.random() * 0.45,
    w: type === "gun" ? 42 : 40,
    h: type === "gun" ? 34 : 40,
    rotation: 0,
    rotSpeed: 0,
    phase: Math.random() * Math.PI * 2,
    collected: false,
  });
  queueNextPickupSpawn(false);
  return true;
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
  if (f.type === "gun" || f.type === "shield" || f.type === "heart" || f.type === "missile") {
    return { x: f.cx - f.w * 0.62, y: f.cy - f.h * 0.62, width: f.w * 1.24, height: f.h * 1.24 };
  }
  if (f.type === "paint-ring") {
    return { x: f.cx - f.radius * 0.7, y: f.cy - f.radius * 0.7, width: f.radius * 1.4, height: f.radius * 1.4 };
  }
  if (f.type === "paint-smoke") {
    return { x: f.cx - f.w * 0.33, y: f.cy - f.h * 0.30, width: f.w * 0.66, height: f.h * 0.60 };
  }
  if (f.type === "glowing-beam") {
    return { x: f.cx - f.w * 0.38, y: f.cy - f.h * 0.46, width: f.w * 0.76, height: f.h * 0.92 };
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

function isDestructibleFloater(f) {
  return f && !f.collected &&
    f.type !== "paint-ring" &&
    f.type !== "missile" &&
    f.type !== "heart" &&
    f.type !== "gun" &&
    f.type !== "shield";
}

function projectileHitsFloater(projectile, f, radius) {
  const fb = getFloaterHitbox(f);
  return projectile.x >= fb.x - radius &&
         projectile.x <= fb.x + fb.width + radius &&
         projectile.y >= fb.y - radius &&
         projectile.y <= fb.y + fb.height + radius;
}

function getFloaterAimPoint(f) {
  return { x: f.cx, y: f.cy };
}

function getNearestDestructibleAhead() {
  let target = null;
  let nearestX = Infinity;
  for (const f of floaters) {
    if (!isDestructibleFloater(f) || f.cx <= helicopter.x + 24) continue;
    if (f.cx < nearestX) {
      target = f;
      nearestX = f.cx;
    }
  }
  return target;
}

function destroyFloaterAt(index, points, colorA, colorB) {
  const f = floaters[index];
  spawnParticles(f.cx, f.cy, colorA, 24);
  spawnParticles(f.cx, f.cy, colorB, 16);
  scorePopups.push({ x: f.cx, y: f.cy - 18, text: `+${points}`, life: 1.1 });
  gameState.bonusScore += points;
  floaters.splice(index, 1);
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

    if (f.type === "paint-ring" && !f.collected) {
      f.collected = true;
      gameState.hoopsCollected += 1;
      gameState.bonusScore     += 100;
      spawnParticles(f.cx, f.cy, C.particleHoop, 22);
      scorePopups.push({ x: f.cx, y: f.cy - 18, text: "+100 Ring Bonus", life: 1.0 });
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

    if (f.type === "heart" && !f.collected) {
      f.collected = true;
      if (gameState.lives < MAX_LIVES) {
        gameState.lives = Math.min(MAX_LIVES, gameState.lives + 1);
        lifeValue.textContent = String(gameState.lives);
        scorePopups.push({ x: f.cx, y: f.cy - 18, text: "+1 LIFE", life: 1.05 });
        spawnParticles(f.cx, f.cy, "#ff4466", 18);
        spawnParticles(f.cx, f.cy, "#ffffff", 8);
      }
      floaters.splice(i, 1);
      continue;
    }

    if (f.type === "gun" && !f.collected) {
      const config = getPickupConfig();
      f.collected = true;
      gameState.caveBurst = Math.min(12, Math.max(gameState.caveBurst, 0) + config.gunDuration);
      gameState.caveBurstFireTimer = Math.min(gameState.caveBurstFireTimer, 0.1);
      spawnParticles(f.cx, f.cy, "#ffb342", 22);
      spawnParticles(f.cx, f.cy, "#ffffff", 10);
      scorePopups.push({ x: f.cx, y: f.cy - 18, text: `AUTO FIRE ${Math.ceil(config.gunDuration)}s`, life: 1.25 });
      floaters.splice(i, 1);
      continue;
    }

    if (f.type === "shield" && !f.collected) {
      const config = getPickupConfig();
      f.collected = true;
      gameState.caveShield = Math.min(config.maxShieldHits, gameState.caveShield + config.shieldHits);
      spawnParticles(f.cx, f.cy, "#50c8ff", 24);
      spawnParticles(f.cx, f.cy, "#ffffff", 10);
      scorePopups.push({ x: f.cx, y: f.cy - 18, text: `SHIELD x${gameState.caveShield}`, life: 1.25 });
      floaters.splice(i, 1);
      continue;
    }

    if (f.type !== "paint-ring" && f.type !== "missile" && f.type !== "heart" && f.type !== "gun" && f.type !== "shield") {
      registerHit();
      return;
    }
  }
}

// â”€â”€ PARTICLES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€ LEVEL BANNER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€ GAME FLOW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function resetGame(fullReset = true) {
  if (fullReset) {
    gameState.levelIndex = 0;
  }
  const levelDef = getLevelDef(gameState.levelIndex + 1);

  helicopter.y        = IS_MOBILE_FLIGHT_PORTRAIT ? WORLD_HEIGHT * 0.46 : 308;
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

  gameState.status         = "idle";
  gameState.score          = 0;
  gameState.displayedScore = 0;
  gameState.distance       = 0;
  gameState.speed          = (levelDef.baseSpeed || 115) * MOBILE_FLIGHT_SPEED_SCALE;
  gameState.justSubmitted  = false;
  gameState.pausedByBlur   = false;
  cavePauseOverlay?.classList.add("hidden");
  gameState.safeTime    = 1.1;
  gameState.hitRecovery = 0;
  gameState.totalScore = 0;
  gameState.lives      = Math.min(MAX_LIVES, levelDef.lives || 3);
  gameState.missiles   = levelDef.fireCount || 3;
  gameState.lastSpawnType = null;
  gameState.allComplete   = false;
  gameState.level          = levelDef.id;
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
  gameState.gunPickupsSpawnedThisLevel = 0;
  gameState.shieldPickupsSpawnedThisLevel = 0;
  gameState.caveShield        = 0;
  gameState.caveBurst         = 0;
  gameState.caveBurstFireTimer = 0;
  gameState.pickupTimer       = 0;
  gameState.lastAnySpecialScore = -9999;

  scoreValue.textContent = "0";
  lifeValue.textContent  = String(gameState.lives);
  missilesValue.textContent = String(gameState.missiles);

  resetCave();
  helicopter.y = getSpawnCenterY();
  queueNextPickupSpawn(true);
}

function renderCaveLevelSelect() {
  if (!caveLevelGrid) return;
  const unlocked = getUnlockedLevel();
  const completed = getCompletedLevels();
  const currentLevel = Math.min(unlocked, INK_FLIGHT_LEVELS.length);
  const lockIcon = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 10V7.8C7.5 5.15 9.51 3.25 12 3.25C14.49 3.25 16.5 5.15 16.5 7.8V10" fill="none" stroke="white" stroke-width="2.4" stroke-linecap="round"/><rect x="5.25" y="9.25" width="13.5" height="11" rx="2.4" fill="#d9dde0" stroke="rgba(255,255,255,0.8)" stroke-width="1.2"/><circle cx="12" cy="14" r="1.45" fill="#4f555b"/><path d="M12 15.3V17.4" stroke="#4f555b" stroke-width="1.7" stroke-linecap="round"/></svg>`;
  caveLevelGrid.innerHTML = INK_FLIGHT_LEVELS.map((def) => {
    const isCompleted = completed.has(def.id);
    const isCurrent = def.id === currentLevel && !isCompleted;
    const isLocked = def.id > unlocked;
    const stateClass = isLocked ? "locked" : isCurrent ? "current" : "completed";
    const status = isLocked ? "Locked" : isCompleted ? "Completed" : "Current";
    return `<button class="cave-level-button ${stateClass}" type="button" data-level="${def.id}" ${isLocked ? "disabled" : ""} aria-label="Level ${def.id} ${status}">
      <span class="cave-level-number">${def.id}</span>
      <span class="cave-level-state" aria-hidden="true">${isLocked ? lockIcon : isCompleted ? "&#10003;" : "PLAY"}</span>
    </button>`;
  }).join("");
}

function showCaveLevelSelect() {
  setThrust(false);
  gameState.status = "idle";
  gameState.pausedByBlur = false;
  startOverlay.classList.add("hidden");
  gameOverOverlay.classList.add("hidden");
  cavePauseOverlay?.classList.add("hidden");
  document.getElementById("level-gate-overlay").classList.add("hidden");
  caveLevelSelectOverlay?.classList.remove("hidden");
  renderCaveLevelSelect();
  updateCaveFireBtn();
  updatePauseBtn();
}

function prepareLevelIntro(levelNumber) {
  const safeLevel = Math.max(1, Math.min(INK_FLIGHT_LEVELS.length, Math.floor(Number(levelNumber) || 1)));
  if (!isLevelUnlocked(safeLevel)) return;
  gameState.levelIndex = safeLevel - 1;
  const def = getLevelDef(safeLevel);
  resetGame(false);
  if (startLevelKicker) startLevelKicker.textContent = `Level ${def.id}: ${def.subtitle || "Ink Flight Rush"}`;
  if (startLevelTitle) startLevelTitle.textContent = def.name.replace(/^Level \d+[: ]\s*/, "");
  startButton.textContent = `Start Level ${def.id}`;
  caveLevelSelectOverlay?.classList.add("hidden");
  gameOverOverlay.classList.add("hidden");
  cavePauseOverlay?.classList.add("hidden");
  document.getElementById("level-gate-overlay").classList.add("hidden");
  startOverlay.classList.remove("hidden");
  render();
}

function startLevel(levelNumber = gameState.levelIndex + 1) {
  const safeLevel = Math.max(1, Math.min(INK_FLIGHT_LEVELS.length, Math.floor(Number(levelNumber) || 1)));
  if (!isLevelUnlocked(safeLevel)) {
    showCaveLevelSelect();
    return;
  }
  window.PTIArcade?.trackEvent("game_started", { gameId: "inkFlightRush", level: safeLevel });
  gameState.levelIndex = safeLevel - 1;
  resetGame(false);
  gameState.status = "running";
  startOverlay.classList.add("hidden");
  gameOverOverlay.classList.add("hidden");
  cavePauseOverlay?.classList.add("hidden");
  caveLevelSelectOverlay?.classList.add("hidden");
  document.getElementById("level-gate-overlay").classList.add("hidden");
  lastFrame = performance.now();
  updateCaveFireBtn();
  updatePauseBtn();
}

function restartCurrentLevel() {
  startLevel(gameState.levelIndex + 1);
}

function registerHit(options = {}) {
  if (!options.ignoreShield && gameState.caveShield > 0) {
    gameState.caveShield = Math.max(0, gameState.caveShield - 1);
    gameState.hitRecovery = 0.85;
    spawnParticles(helicopter.x, helicopter.y, "#50c8ff", 28);
    spawnParticles(helicopter.x, helicopter.y, "#ffffff", 10);
    scorePopups.push({ x: helicopter.x + 34, y: helicopter.y - 26, text: "SHIELD BLOCK", life: 1.0 });
    lifeValue.textContent = String(gameState.lives);
    helicopter.velocityY = options.velocityY ? options.velocityY * 0.45 : -80;
    helicopter.y = clamp(helicopter.y + (options.nudgeY ? options.nudgeY * 0.35 : -18), 52, WORLD_HEIGHT - 52);
    return false;
  }
  if (!options.ignoreRecovery && (gameState.safeTime > 0 || gameState.hitRecovery > 0)) return false;
  if (gameState.lives > 0) {
    gameState.lives        -= 1;
    gameState.hitRecovery  = 1.2;
    gameState.obstaclesHit += 1;
    spawnParticles(helicopter.x, helicopter.y, C.particleHit, 14);
    lifeValue.textContent  = String(gameState.lives);
    helicopter.velocityY   = options.velocityY ?? -90;
    helicopter.y           = clamp(helicopter.y + (options.nudgeY ?? -24), 52, WORLD_HEIGHT - 52);
    if (gameState.lives <= 0) endGame();
  } else {
    endGame();
  }
  return true;
}

function getPlayableBounds() {
  return {
    top: PLAYABLE_TOP_PADDING,
    bottom: WORLD_HEIGHT - PLAYABLE_BOTTOM_PADDING,
  };
}

function enforcePlayableBounds() {
  const bounds = getPlayableBounds();
  const hb = getHelicopterHitbox();
  if (hb.y <= bounds.top) {
    helicopter.y += bounds.top - hb.y;
    if (gameState.safeTime <= 0 && gameState.hitRecovery <= 0) {
      registerHit({ ignoreRecovery: true, velocityY: 130, nudgeY: 34 });
    }
    return true;
  }
  if (hb.y + hb.height >= bounds.bottom) {
    helicopter.y -= (hb.y + hb.height) - bounds.bottom;
    if (gameState.safeTime <= 0 && gameState.hitRecovery <= 0) {
      registerHit({ ignoreRecovery: true, velocityY: -135, nudgeY: -36 });
    }
    return true;
  }
  return false;
}

function showLevelGateOverlay() {
  const currentDef = LEVEL_DEFS[gameState.levelIndex];
  const nextDef    = LEVEL_DEFS[gameState.levelIndex + 1];
  const lvNum      = gameState.levelIndex + 1;
  const shortName  = currentDef.name.replace(/^Level \d+[: ] /, '');
  const finalTotal = Math.max(0, Math.floor(gameState.finalTotal || gameState.totalScore + gameState.score));
  const prizePoints = window.PTIArcade
    ? window.PTIArcade.calculatePrizePoints(ACTIVE_GAME_TYPE, finalTotal)
    : finalTotal;
  const normalizedGameId = window.PTIArcade ? window.PTIArcade.normalizeGameId(ACTIVE_GAME_TYPE) : ACTIVE_GAME_TYPE;
  const bestGame = window.PTIArcade?.getPlayerBests?.()?.games?.[normalizedGameId] || null;

  document.getElementById("gate-kicker").textContent = "Level Complete";
  document.getElementById("gate-score").textContent  = `Game Score: ${finalTotal.toLocaleString()}`;
  document.getElementById("gate-heading").textContent = `${shortName} Cleared`;
  if (gateRawScore) gateRawScore.textContent = finalTotal.toLocaleString();
  if (gatePrizePoints) gatePrizePoints.textContent = prizePoints.toLocaleString();
  if (gateBestPrizePoints) gateBestPrizePoints.textContent = Math.max(prizePoints, Number(bestGame?.prizePoints || 0)).toLocaleString();
  if (gateRankMessage) gateRankMessage.textContent = "Submit your Prize Points, continue, or replay this level.";
  if (gatePlayerNameInput) gatePlayerNameInput.value = window.PTIArcade?.getSavedPlayerName?.() || gatePlayerNameInput.value;
  if (gatePlayerEmailInput) gatePlayerEmailInput.value = "";
  gameState.justSubmitted = false;

  if (nextDef) {
    document.getElementById("gate-next-label").textContent       = "Up Next";
    document.getElementById("gate-next-name").textContent        = nextDef.name;
    document.getElementById("gate-next-instruction").textContent = nextDef.instruction;
    document.getElementById("gate-button").textContent           = `Next Level ${nextDef.id}`;
  } else {
    // All levels beaten
    document.getElementById("gate-next-label").textContent       = "All Levels Complete";
    document.getElementById("gate-next-name").textContent        = "YOU WIN!";
    document.getElementById("gate-next-instruction").textContent = "You've beaten every level. Submit your Prize Points to the monthly leaderboard!";
    document.getElementById("gate-button").textContent           = "Replay Level";
    gameState.allComplete = true;
  }

  document.getElementById("level-gate-overlay").classList.remove("hidden");
  startOverlay.classList.add("hidden");
  gameOverOverlay.classList.add("hidden");
  caveLevelSelectOverlay?.classList.add("hidden");
  cavePauseOverlay?.classList.add("hidden");
  gameState.status = "levelcomplete";
  updateCaveFireBtn();
  updatePauseBtn();
}

function endLevel() {
  const levelNumber = gameState.levelIndex + 1;
  const finalTotal = Math.max(0, Math.floor(gameState.totalScore + gameState.score));
  gameState.finalTotal = finalTotal;
  gameState.score = Math.floor(gameState.score);
  gameState.caveBurst = 0;
  gameState.caveShield = 0;
  gameState.caveBurstFireTimer = 0;
  markLevelComplete(levelNumber, finalTotal);
  if (finalTotal > gameState.best) {
    gameState.best = finalTotal;
    saveBestScore(gameState.best);
    bestValue.textContent = String(gameState.best);
  }
  scorePopups.push({
    x: WORLD_WIDTH / 2,
    y: WORLD_HEIGHT * 0.34,
    text: `Level ${levelNumber} Complete`,
    life: 1.45,
  });
  showLevelGateOverlay();
}

function startNextLevel() {
  document.getElementById("level-gate-overlay").classList.add("hidden");
  if (gameState.allComplete) {
    gameState.allComplete = false;
    restartCurrentLevel();
    return;
  }
  startLevel(gameState.levelIndex + 2);
}

async function endGame() {
  window.PTIArcade?.trackEvent("game_over", { gameId: "inkFlightRush", level: gameState.levelIndex + 1, rawScore: Math.floor(gameState.totalScore + gameState.score) });
  gameState.status = "gameover";
  cavePauseOverlay?.classList.add("hidden");
  gameState.score  = Math.floor(gameState.score);
  gameState.caveBurst = 0;
  gameState.caveShield = 0;
  gameState.caveBurstFireTimer = 0;
  const finalTotal = Math.max(0, Math.floor(gameState.totalScore + gameState.score));
  gameState.finalTotal = finalTotal;
  updateBestByLevel(gameState.levelIndex + 1, finalTotal);

  if (finalTotal > gameState.best) {
    gameState.best = finalTotal;
    saveBestScore(gameState.best);
    bestValue.textContent = String(gameState.best);
  }

  const prizePoints = window.PTIArcade
    ? window.PTIArcade.calculatePrizePoints(ACTIVE_GAME_TYPE, finalTotal)
    : finalTotal;
  const normalizedGameId = window.PTIArcade ? window.PTIArcade.normalizeGameId(ACTIVE_GAME_TYPE) : ACTIVE_GAME_TYPE;
  const bestGame = window.PTIArcade?.getPlayerBests?.()?.games?.[normalizedGameId] || null;
  if (resultLevelLabel) resultLevelLabel.textContent = `Level ${gameState.levelIndex + 1}`;
  finalScoreHeading.textContent = `Game Score: ${finalTotal.toLocaleString()}`;
  if (resultPrizePoints) resultPrizePoints.textContent = prizePoints.toLocaleString();
  if (resultBestPrizePoints) resultBestPrizePoints.textContent = Math.max(prizePoints, Number(bestGame?.prizePoints || 0)).toLocaleString();
  if (resultRankMessage) resultRankMessage.textContent = "Submit your Prize Points to lock in your monthly leaderboard run.";
  resultMessage.textContent = "Run over. Your game score converts into Prize Points for the monthly leaderboard.";
  if (playerNameInput) playerNameInput.value = window.PTIArcade?.getSavedPlayerName?.() || playerNameInput.value;
  if (playerEmailInput) playerEmailInput.value = "";
  startOverlay.classList.add("hidden");
  caveLevelSelectOverlay?.classList.add("hidden");
  document.getElementById("level-gate-overlay").classList.add("hidden");
  gameOverOverlay.classList.remove("hidden");
  updateCaveFireBtn();
  updatePauseBtn();

  const comment = await fetchClaudeComment(
    gameState.score,
    gameState.level,
    gameState.hoopsCollected,
    gameState.obstaclesHit,
  );

  const levelReached = LEVEL_DEFS[Math.min(gameState.levelIndex, LEVEL_DEFS.length - 1)]?.id || gameState.level;
  const baseComment = comment || getFallbackComment(gameState.score);
  resultMessage.textContent = `Run over on Level ${levelReached}. Best game score: ${gameState.best.toLocaleString()}. ${baseComment}`;
}

function getFallbackComment(score) {
  if (score < 40)  return "Barely off the press. Warm up those controls.";
  if (score < 80)  return "Getting there. Thread a few hoops next time.";
  if (score < 130) return "Nice run. Push past the speed jump at 130.";
  if (score < 200) return "Strong flight. You might just make the board.";
  return "That's leaderboard territory. Submit it.";
}

function setThrust(active) {
  helicopter.thrusting = active && gameState.status === "running";
}

// â”€â”€ MAIN UPDATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function update(delta) {
  if (gameState.status !== "running") return;
  if (gameState.pausedByBlur || document.hidden) return;

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
    // Emit 1 puff from the tail â€” size and rate depend on thrust
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

  // Level completion â€” checked against distance-only score (not bonus) so hoops don't skip levels
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
  const boundaryHit = enforcePlayableBounds();
  if (boundaryHit && gameState.status !== "running") return;
  helicopter.rotor     += delta * (helicopter.thrusting ? 6 : 4);
  helicopter.thrustGlow = helicopter.thrusting
    ? Math.min(1, helicopter.thrustGlow + delta * 4)
    : Math.max(0, helicopter.thrustGlow - delta * 3);

  gameState.safeTime    = Math.max(0, gameState.safeTime - delta);
  gameState.hitRecovery = Math.max(0, gameState.hitRecovery - delta);
  gameState.caveBurst   = Math.max(0, gameState.caveBurst  - delta);

  // Floater spawning
  gameState.floaterTimer -= delta;
  if (gameState.floaterTimer <= 0) {
    spawnFloater();
    gameState.floaterTimer = getFloaterInterval(gameState.displayedScore);
  }
  const guaranteedPickup = getDueGuaranteedPickupType();
  if (guaranteedPickup) {
    spawnPowerPickup(guaranteedPickup);
  } else {
    gameState.pickupTimer -= delta;
    if (gameState.pickupTimer <= 0) {
      spawnPowerPickup();
    }
  }

  updateFloaters(delta);
  updateParticles(delta);
  updateBanner(delta);

  // â”€â”€ Cave missiles: manual fire (X key or FIRE button) â”€â”€
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

    // Missiles pierce â€” check every missile vs every destructible obstacle each frame
    for (let fi = floaters.length - 1; fi >= 0; fi--) {
      const f = floaters[fi];
      if (!isDestructibleFloater(f)) continue;
      for (const m of caveBullets) {
        if (projectileHitsFloater(m, f, 18)) {
          destroyFloaterAt(fi, 150, "#ff5500", "#ffcc00");
          break;
        }
      }
    }
  }

  // Gun pickup: timed free auto-fire. Runs in the frame loop so pause/resume stops the timer cleanly.
  if (gameState.caveBurst > 0) {
    gameState.caveBurstFireTimer -= delta;
    if (gameState.caveBurstFireTimer <= 0) {
      const target = getNearestDestructibleAhead();
      const origin = { x: helicopter.x + 28, y: helicopter.y + (Math.random() - 0.5) * 8 };
      const aim = target ? getFloaterAimPoint(target) : { x: origin.x + 160, y: origin.y + (Math.random() - 0.5) * 10 };
      const travelTime = Math.max(0.16, (aim.x - origin.x) / 580);
      const vy = clamp((aim.y - origin.y) / travelTime, -420, 420);
      burstBullets.push({ x: origin.x, y: origin.y, vy });
      gameState.caveBurstFireTimer = getPickupConfig().autoFireInterval;
    }
  }
  // Move burst bullets
  for (let bi = burstBullets.length - 1; bi >= 0; bi--) {
    burstBullets[bi].x  += 580 * delta;
    burstBullets[bi].y  += burstBullets[bi].vy * delta;
    if (burstBullets[bi].x > WORLD_WIDTH + 20) burstBullets.splice(bi, 1);
  }
  // Burst bullets destroy every obstacle, including wall rocks, but not pickups or hoops.
  for (let fi = floaters.length - 1; fi >= 0; fi--) {
    const f = floaters[fi];
    if (!isDestructibleFloater(f)) continue;
    for (let bi = burstBullets.length - 1; bi >= 0; bi--) {
      const b = burstBullets[bi];
      if (projectileHitsFloater(b, f, 14)) {
        destroyFloaterAt(fi, 80, "#ffcc33", "#ff8800");
        burstBullets.splice(bi, 1);
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

// â”€â”€ DRAW: BACKGROUND â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function getCaveBackgroundImage() {
  const backgrounds = [
    helicopterAssets.background1,
    helicopterAssets.background2,
    helicopterAssets.background3,
    helicopterAssets.background4,
    helicopterAssets.background5,
    helicopterAssets.background6,
    helicopterAssets.background7,
    helicopterAssets.background8,
    helicopterAssets.background9,
    helicopterAssets.background10,
    helicopterAssets.background11,
  ];
  const index = gameState.levelIndex % backgrounds.length;
  const active = backgrounds[index];
  const next = backgrounds[(index + 1) % backgrounds.length];
  active?.ensureLoaded?.();
  next?.ensureLoaded?.();
  return active;
}

function drawCoverImage(img, dx, dy, dw, dh, offsetX = 0.5, offsetY = 0.5) {
  if (!img || !img.ready || img.naturalWidth <= 0 || img.naturalHeight <= 0) return false;

  const scale = Math.max(dw / img.naturalWidth, dh / img.naturalHeight);
  const sw = dw / scale;
  const sh = dh / scale;
  const sx = clamp((img.naturalWidth - sw) * offsetX, 0, img.naturalWidth - sw);
  const sy = clamp((img.naturalHeight - sh) * offsetY, 0, img.naturalHeight - sh);

  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  return true;
}

function drawScrollingCoverImage(img, speed, alpha = 1, yShift = 0, heightScale = 1) {
  if (!img || !img.ready || img.naturalWidth <= 0 || img.naturalHeight <= 0) return false;
  const scale = Math.max(WORLD_WIDTH / img.naturalWidth, WORLD_HEIGHT / img.naturalHeight);
  const tileW = Math.max(WORLD_WIDTH, img.naturalWidth * scale);
  const tileH = Math.max(WORLD_HEIGHT, img.naturalHeight * scale * heightScale);
  const scroll = gameState.status === "running"
    ? (gameState.distance * speed) % tileW
    : (performance.now() * 0.012 * speed) % tileW;
  const y = (WORLD_HEIGHT - tileH) * 0.5 + yShift;

  ctx.save();
  ctx.globalAlpha = alpha;
  for (let x = -scroll - tileW; x < WORLD_WIDTH + tileW; x += tileW) {
    ctx.drawImage(img, x, y, tileW, tileH);
  }
  ctx.restore();
  return true;
}

function drawPannedCoverImage(img, zoom = 1.14) {
  if (!img || !img.ready || img.naturalWidth <= 0 || img.naturalHeight <= 0) return false;
  const scale = Math.max(WORLD_WIDTH / img.naturalWidth, WORLD_HEIGHT / img.naturalHeight) * zoom;
  const drawW = img.naturalWidth * scale;
  const drawH = img.naturalHeight * scale;
  const extraX = Math.max(0, drawW - WORLD_WIDTH);
  const extraY = Math.max(0, drawH - WORLD_HEIGHT);
  const raw = gameState.status === "running"
    ? (gameState.distance * 0.00042) % 2
    : (performance.now() * 0.000018) % 2;
  const pan = 1 - Math.abs(1 - raw);
  const x = -extraX * pan;
  const y = -extraY * 0.48;

  ctx.drawImage(img, x, y, drawW, drawH);
  return true;
}

function drawForegroundParallax(levelColor) {
  if (gameState.status !== "running") return;
  ctx.save();
  ctx.globalAlpha = 0.26;
  ctx.lineCap = "round";
  for (let i = 0; i < 18; i++) {
    const depth = 0.8 + (i % 5) * 0.18;
    const x = ((i * 97 - gameState.distance * FOREGROUND_SCROLL_SPEED * depth) % (WORLD_WIDTH + 180) + WORLD_WIDTH + 180) % (WORLD_WIDTH + 180) - 90;
    const y = WORLD_HEIGHT - 34 - (i % 4) * 9;
    ctx.strokeStyle = i % 3 === 0 ? `${levelColor}66` : "rgba(255,255,255,0.28)";
    ctx.lineWidth = 2 + (i % 3);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 44 + (i % 4) * 18, y - 3);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBackground() {
  const levelColor = LEVEL_DEFS[gameState.levelIndex]?.color || "#4dd9ff";
  const time = performance.now() / 1000;

  const bgImg = getCaveBackgroundImage();
  if (!drawPannedCoverImage(bgImg)) {
    const bg = ctx.createLinearGradient(0, 0, 0, WORLD_HEIGHT);
    bg.addColorStop(0,   C.bgTop);
    bg.addColorStop(0.5, C.bgMid);
    bg.addColorStop(1,   "#02090c");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  } else {
    drawForegroundParallax(levelColor);
  }

  // Keep the artwork visible while preserving HUD/object readability.
  const wash = ctx.createLinearGradient(0, 0, 0, WORLD_HEIGHT);
  wash.addColorStop(0, "rgba(0, 22, 24, 0.12)");
  wash.addColorStop(0.48, "rgba(0, 18, 20, 0.07)");
  wash.addColorStop(1, "rgba(0, 22, 24, 0.14)");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  const playPath = ctx.createLinearGradient(0, WORLD_HEIGHT * 0.24, 0, WORLD_HEIGHT * 0.78);
  playPath.addColorStop(0, "rgba(255,255,255,0)");
  playPath.addColorStop(0.42, "rgba(0,32,32,0.06)");
  playPath.addColorStop(0.58, "rgba(0,32,32,0.06)");
  playPath.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = playPath;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  const sideGlow = ctx.createLinearGradient(0, 0, WORLD_WIDTH, 0);
  sideGlow.addColorStop(0,    `${levelColor}10`);
  sideGlow.addColorStop(0.22, "rgba(0,0,0,0)");
  sideGlow.addColorStop(0.78, "rgba(0,0,0,0)");
  sideGlow.addColorStop(1,    `${levelColor}10`);
  ctx.fillStyle = sideGlow;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  // Lightweight particles only; the old grid is replaced by the artwork backgrounds.
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 22; i++) {
    const depth = 0.45 + (i % 7) * 0.11;
    const drift = gameState.status === "running" ? gameState.distance * 0.08 * depth : time * 7 * depth;
    const x = ((i * 83 + 30 - drift) % (WORLD_WIDTH + 80) + WORLD_WIDTH + 80) % (WORLD_WIDTH + 80) - 40;
    const y = (i * 149 + Math.sin(time * 0.7 + i) * 18) % WORLD_HEIGHT;
    const r = 0.7 + (i % 4) * 0.35;
    ctx.globalAlpha = 0.12 + (i % 5) * 0.024;
    ctx.fillStyle = i % 3 === 0 ? levelColor : "#8df3ff";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  if (gameState.status === "running") {
    ctx.lineCap = "round";
    for (let i = 0; i < 14; i++) {
      const y = (i * 47 + time * 18) % WORLD_HEIGHT;
      const x = ((i * 101 - gameState.distance * 0.45) % (WORLD_WIDTH + 160) + WORLD_WIDTH + 160) % (WORLD_WIDTH + 160) - 80;
      const len = 18 + (i % 4) * 9;
      ctx.globalAlpha = 0.10 + Math.min(0.18, gameState.speed / 1300);
      ctx.strokeStyle = i % 2 ? "#8df3ff" : levelColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + len, y);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawScreenEffects() {
  const levelColor = LEVEL_DEFS[gameState.levelIndex]?.color || "#4dd9ff";
  ctx.save();

  ctx.globalAlpha = 0.055;
  ctx.fillStyle = levelColor;
  for (let y = 0; y < WORLD_HEIGHT; y += 4) ctx.fillRect(0, y, WORLD_WIDTH, 1);

  ctx.globalAlpha = gameState.hitRecovery > 0 ? Math.min(0.09, gameState.hitRecovery * 0.09) : 0;
  if (ctx.globalAlpha > 0) {
    ctx.fillStyle = "#ff3850";
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  }

  ctx.restore();
}

// â”€â”€ DRAW: CAVE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function drawCave() {
  // Outer border glow â€” level-coloured
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

    // Edge glow strip â€” tinted to current level colour
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

// â”€â”€ DRAW: FLOATERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function drawImageAsset(img, x, y, boxW, boxH, rotation = 0, alpha = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha = alpha;
  if (img && img.ready && img.naturalWidth > 0 && img.naturalHeight > 0) {
    const scale = Math.min(boxW / img.naturalWidth, boxH / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
  } else {
    ctx.fillStyle = "rgba(125,255,99,0.24)";
    if (ctx.roundRect) {
      ctx.beginPath(); ctx.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, 8); ctx.fill();
    } else {
      ctx.fillRect(-boxW / 2, -boxH / 2, boxW, boxH);
    }
  }
  ctx.restore();
}

function drawAssetFloater(f) {
  const pulse = 0.72 + 0.28 * Math.sin(f.phase * 3.6);
  ctx.save();

  if (f.type === "paint-ring") {
    ctx.shadowColor = "#ffd84d";
    ctx.shadowBlur = 24 * pulse;
    drawImageAsset(helicopterAssets.paintRing, f.cx, f.cy, f.w, f.h, f.rotation, 0.98);
  } else if (f.type === "drone") {
    ctx.shadowColor = "#ff7300";
    ctx.shadowBlur = 14 * pulse;
    drawImageAsset(helicopterAssets.drone, f.cx, f.cy, f.w, f.h, 0, 0.98);
  } else if (f.type === "dtf-roll") {
    ctx.shadowColor = "#4dd9ff";
    ctx.shadowBlur = 10 * pulse;
    drawImageAsset(helicopterAssets.dtfRoll, f.cx, f.cy, f.w, f.h, f.rotation, 0.98);
  } else if (f.type === "glowing-beam") {
    ctx.shadowColor = "#7dff63";
    ctx.shadowBlur = 18 + 10 * pulse;
    drawImageAsset(helicopterAssets.glowingBeam, f.cx, f.cy, f.w, f.h, 0, 0.92);
  } else if (f.type === "ink") {
    ctx.shadowColor = "#42d7ff";
    ctx.shadowBlur = 12 * pulse;
    drawImageAsset(helicopterAssets.ink, f.cx, f.cy, f.w, f.h, f.rotation, 0.98);
  } else if (f.type === "motion-blur") {
    ctx.shadowColor = "#ffb342";
    ctx.shadowBlur = 10 + 8 * pulse;
    drawImageAsset(helicopterAssets.motionBlur, f.cx, f.cy, f.w, f.h, f.rotation, 0.82);
  } else if (f.type === "paint-smoke") {
    ctx.shadowColor = "rgba(255,255,255,0.45)";
    ctx.shadowBlur = 12 * pulse;
    drawImageAsset(helicopterAssets.paintSmoke, f.cx, f.cy, f.w, f.h, f.rotation, 0.78);
  }

  ctx.restore();
}

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
    // Invert the black-on-white logo â†’ white-on-black, then screen-composite
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
  ctx.save();
  ctx.translate(f.cx, f.cy);
  ctx.rotate(f.rotation);

  const w = f.w, h = f.h;
  const hw = w / 2, hh = h / 2;
  const pulse = 0.65 + 0.35 * Math.sin(f.phase * 5);

  ctx.shadowColor = "#ff3df2";
  ctx.shadowBlur  = 18 + pulse * 8;

  // Rival flyer silhouette, nose facing left into the player.
  const bodyG = ctx.createLinearGradient(-hw, -hh, hw, hh);
  bodyG.addColorStop(0, "#f8fbff");
  bodyG.addColorStop(0.45, "#50d9ff");
  bodyG.addColorStop(1, "#1a2d7a");
  ctx.fillStyle = bodyG;
  ctx.beginPath();
  ctx.moveTo(-hw, 0);
  ctx.quadraticCurveTo(-hw * 0.42, -hh * 0.92, hw * 0.45, -hh * 0.42);
  ctx.quadraticCurveTo(hw, -hh * 0.18, hw, 0);
  ctx.quadraticCurveTo(hw, hh * 0.18, hw * 0.45, hh * 0.42);
  ctx.quadraticCurveTo(-hw * 0.42, hh * 0.92, -hw, 0);
  ctx.fill();

  // Wings and tail fins.
  ctx.fillStyle = "#ff3df2";
  ctx.beginPath();
  ctx.moveTo(-5, -3); ctx.lineTo(12, -hh - 8); ctx.lineTo(23, -hh + 2); ctx.lineTo(6, 3);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-5, 3); ctx.lineTo(12, hh + 8); ctx.lineTo(23, hh - 2); ctx.lineTo(6, -3);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#ffd84d";
  ctx.beginPath(); ctx.moveTo(hw * 0.48, -2); ctx.lineTo(hw + 8, -10); ctx.lineTo(hw, 2); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(hw * 0.48, 2); ctx.lineTo(hw + 8, 10); ctx.lineTo(hw, -2); ctx.closePath(); ctx.fill();

  // Cockpit, warning eye, and engine trail.
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(8, 10, 24, 0.72)";
  ctx.beginPath(); ctx.ellipse(-hw * 0.18, -2, 8, 5, -0.18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.ellipse(-hw * 0.25, -4, 3, 1.4, -0.25, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = `rgba(255,216,77,${0.55 + pulse * 0.35})`;
  ctx.beginPath(); ctx.arc(-hw + 8, 0, 3.2, 0, Math.PI * 2); ctx.fill();

  const trail = ctx.createLinearGradient(hw - 2, 0, hw + 34, 0);
  trail.addColorStop(0, "rgba(77,217,255,0.62)");
  trail.addColorStop(1, "rgba(255,61,242,0)");
  ctx.fillStyle = trail;
  ctx.beginPath(); ctx.ellipse(hw + 14, 0, 21, 5 + pulse * 2, 0, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

function drawVinylRoll(f) {
  ctx.save();
  ctx.translate(f.cx, f.cy);
  ctx.rotate(f.rotation);

  const w = f.w, h = f.h, hw = w / 2, hh = h / 2;
  const pulse = 0.7 + 0.3 * Math.sin(f.phase * 4);

  ctx.shadowColor = "#ffd84d";
  ctx.shadowBlur  = 14 * pulse;

  // Floating cargo pod with bright hazard bands.
  const podG = ctx.createLinearGradient(-hw, -hh, hw, hh);
  podG.addColorStop(0, "#dde7ff");
  podG.addColorStop(0.38, "#5e78c8");
  podG.addColorStop(1, "#17214d");
  ctx.fillStyle = podG;
  if (ctx.roundRect) {
    ctx.beginPath(); ctx.roundRect(-hw, -hh, w, h, 8); ctx.fill();
  } else { ctx.fillRect(-hw, -hh, w, h); }
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#ffd84d";
  for (let x = -hw + 8; x < hw - 4; x += 14) {
    ctx.save();
    ctx.translate(x, 0);
    ctx.rotate(-0.6);
    ctx.fillRect(-2, -hh, 5, h);
    ctx.restore();
  }

  ctx.strokeStyle = "rgba(141,243,255,0.82)";
  ctx.lineWidth = 1.5;
  if (ctx.roundRect) {
    ctx.beginPath(); ctx.roundRect(-hw, -hh, w, h, 8); ctx.stroke();
  } else { ctx.strokeRect(-hw, -hh, w, h); }

  ctx.fillStyle = `rgba(255,61,242,${0.55 + pulse * 0.3})`;
  ctx.beginPath(); ctx.arc(-hw + 8, -hh + 7, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(hw - 8, hh - 7, 3, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

function drawHeatPress(f) {
  const oscY = Math.sin(f.phase * 2.2) * 9;
  ctx.save();
  ctx.translate(f.cx, f.cy + oscY);

  const w = f.w, h = f.h;
  const hw = w / 2, hh = h / 2;
  const pulse = 0.65 + 0.35 * Math.sin(f.phase * 5.5);

  ctx.shadowColor = "#ff4b5f";
  ctx.shadowBlur  = 18;

  // Armored shuttle block, heavier and more readable than the old press.
  const grad = ctx.createLinearGradient(-hw, -hh, hw, hh);
  grad.addColorStop(0, "#f4f6ff");
  grad.addColorStop(0.24, "#ff7a4d");
  grad.addColorStop(0.72, "#912247");
  grad.addColorStop(1, "#1b1232");
  ctx.fillStyle = grad;
  if (ctx.roundRect) {
    ctx.beginPath(); ctx.roundRect(-hw, -hh, w, h, 7); ctx.fill();
  } else { ctx.fillRect(-hw, -hh, w, h); }

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#0a1026";
  ctx.beginPath(); ctx.moveTo(-hw, -hh); ctx.lineTo(-hw - 13, 0); ctx.lineTo(-hw, hh); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#4dd9ff";
  ctx.globalAlpha = 0.34 + pulse * 0.36;
  ctx.fillRect(-hw + 12, -hh + 6, w - 24, 5);
  ctx.fillRect(-hw + 12, hh - 11, w - 24, 5);
  ctx.globalAlpha = 1;

  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-hw + 8, 0); ctx.lineTo(hw - 8, 0); ctx.stroke();

  const engine = ctx.createRadialGradient(hw, 0, 0, hw + 10, 0, 24);
  engine.addColorStop(0, "rgba(255,255,255,0.75)");
  engine.addColorStop(0.35, "rgba(77,217,255,0.52)");
  engine.addColorStop(1, "rgba(77,217,255,0)");
  ctx.fillStyle = engine;
  ctx.beginPath(); ctx.ellipse(hw + 8, 0, 20, 9 + pulse * 3, 0, 0, Math.PI * 2); ctx.fill();

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
  const rotorSpin = f.phase * 10;

  ctx.shadowColor = "#ff4757";
  ctx.shadowBlur  = 12 + pulse * 8;

  // Sleeker attack drone body.
  const bodyG = ctx.createLinearGradient(-18, -10, 18, 10);
  bodyG.addColorStop(0, "#f8fbff");
  bodyG.addColorStop(0.45, "#7f91d8");
  bodyG.addColorStop(1, "#171831");
  ctx.fillStyle = bodyG;
  ctx.beginPath();
  ctx.moveTo(-18, 0);
  ctx.lineTo(-7, -10);
  ctx.lineTo(14, -7);
  ctx.lineTo(18, 0);
  ctx.lineTo(14, 7);
  ctx.lineTo(-7, 10);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(77,217,255,0.7)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Twin rotors with motion blur.
  for (const [rx, ry] of [[-10, -13], [-10, 13]]) {
    ctx.strokeStyle = `rgba(141,243,255,${0.28 + pulse * 0.25})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(rx, ry, 11, 5, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(rotorSpin);
    ctx.strokeStyle = "rgba(255,255,255,0.72)";
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(9, 0); ctx.stroke();
    ctx.rotate(Math.PI / 2);
    ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(5, 0); ctx.stroke();
    ctx.restore();
  }

  ctx.fillStyle = `rgba(255,75,95,${0.72 + pulse * 0.28})`;
  ctx.beginPath(); ctx.arc(-4, 0, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ffd84d";
  ctx.fillRect(7, -2, 6, 4);

  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawMissilePickup(f) {
  ctx.save();
  ctx.translate(f.cx, f.cy);

  const pulse = 0.72 + 0.28 * Math.sin(f.phase * 3.5);
  ctx.shadowColor = "#ff9900";
  ctx.shadowBlur = 18 * pulse;
  drawImageAsset(helicopterAssets.missile, 0, 0, f.w * 1.35, f.h * 2.2, 0, 0.98);
  ctx.restore();
}

function drawInkBlob(f) {
  ctx.save();
  ctx.translate(f.cx, f.cy);
  ctx.rotate(f.rotation);

  const col = f.color || "#ff2255";
  ctx.shadowColor = col;
  ctx.shadowBlur  = 20;

  // Plasma mine: clearer hazard than an ink splat.
  const pulse = 0.68 + 0.32 * Math.sin(f.phase * 4.4);
  const core = ctx.createRadialGradient(-5, -6, 0, 0, 0, 22);
  core.addColorStop(0, "#ffffff");
  core.addColorStop(0.22, col);
  core.addColorStop(0.7, "rgba(25,12,45,0.95)");
  core.addColorStop(1, "rgba(25,12,45,0)");
  ctx.fillStyle = core;
  ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = `rgba(255,255,255,${0.24 + pulse * 0.34})`;
  ctx.lineWidth = 2;
  for (let r = 12; r <= 22; r += 5) {
    ctx.beginPath(); ctx.arc(0, 0, r + pulse * 2, 0, Math.PI * 2); ctx.stroke();
  }

  ctx.strokeStyle = col;
  ctx.lineWidth = 2.2;
  for (let i = 0; i < 8; i++) {
    const a = f.phase * 1.5 + i * Math.PI / 4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 12, Math.sin(a) * 12);
    ctx.lineTo(Math.cos(a) * (21 + pulse * 4), Math.sin(a) * (21 + pulse * 4));
    ctx.stroke();
  }

  ctx.restore();
}

function drawCaveShieldPickup(f) {
  ctx.save();
  ctx.translate(f.cx, f.cy);
  ctx.rotate(f.rotation);
  const pulse = 0.7 + 0.3 * Math.sin(f.phase * 3.2);
  ctx.shadowColor = "#50c8ff";
  ctx.shadowBlur  = 24 * pulse;
  drawImageAsset(helicopterAssets.shield, 0, 0, f.w * 1.18, f.h * 1.18, 0, 0.98);
  ctx.restore();
}

function drawGunPickup(f) {
  ctx.save();
  ctx.translate(f.cx, f.cy);
  ctx.rotate(f.rotation);
  const pulse = 0.7 + 0.3 * Math.sin(f.phase * 3.8);
  ctx.shadowColor = "#ffb342";
  ctx.shadowBlur  = 22 * pulse;
  drawImageAsset(helicopterAssets.gun, 0, 0, f.w * 1.35, f.h * 1.5, 0, 0.98);
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

  // Scan lines â€” same texture as cave walls
  ctx.fillStyle = "rgba(0,0,0,0.07)";
  const scanStep = 11;
  const yMin = Math.min(wallY, tipY);
  const yMax = Math.max(wallY, tipY);
  for (let y = yMin + 3; y < yMax - 2; y += scanStep) {
    ctx.fillRect(left, y, w, 2);
  }

  // Bright level-coloured glow strip along the jagged tip edge â€” same as cave edge strips
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
    if (f.type === "missile") {
      drawMissilePickup(f);
    } else if (f.type === "heart") {
      drawExtraLife(f);
    } else if (f.type === "gun") {
      drawGunPickup(f);
    } else if (f.type === "shield") {
      drawCaveShieldPickup(f);
    } else {
      drawAssetFloater(f);
    }
  }
}

// â”€â”€ DRAW: PARTICLES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€ DRAW: HELICOPTER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  // Cave shield aura â€” use the supplied shield pickup art as the active bubble.
  if (gameState.caveShield > 0) {
    const sp = 0.65 + 0.35 * Math.sin(performance.now() / 120);
    ctx.save();
    ctx.shadowColor = "#50c8ff";
    ctx.shadowBlur  = 24;
    drawImageAsset(helicopterAssets.shield, hx, hy, 82 + sp * 8, 82 + sp * 8, 0, 0.42 + sp * 0.16);
    ctx.restore();
  }

  // Cave burst aura â€” gold lightning ring
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
  ctx.rotate(clamp(helicopter.velocityY / 340, -0.42, 0.46));
  if (gameState.hitRecovery > 0 && Math.floor(gameState.hitRecovery * 12) % 2 === 0) {
    ctx.globalAlpha = 0.38;
  }
  drawImageAsset(helicopterAssets.helicopter, 0, 0, 66, 42, 0, ctx.globalAlpha);
  ctx.restore();
  return;

  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(clamp(helicopter.velocityY / 320, -0.48, 0.52));
  ctx.scale(-1, 1); // flip so nose faces right (direction of travel)

  if (gameState.hitRecovery > 0 && Math.floor(gameState.hitRecovery * 12) % 2 === 0) {
    ctx.globalAlpha = 0.38;
  }

  // â”€â”€ Tail boom (draw first, behind fuselage) â”€â”€
  const tailG = ctx.createLinearGradient(14, 0, 44, 0);
  tailG.addColorStop(0, "#d8d8d8");
  tailG.addColorStop(1, "#505050");
  ctx.fillStyle = tailG;
  ctx.beginPath();
  ctx.moveTo(14, -3); ctx.lineTo(44, -1); ctx.lineTo(44, 2); ctx.lineTo(14, 5);
  ctx.closePath(); ctx.fill();

  // â”€â”€ Tail fin (vertical stabiliser) â”€â”€
  ctx.fillStyle = "#222222";
  ctx.beginPath();
  ctx.moveTo(38, -1); ctx.lineTo(44, -13); ctx.lineTo(46, -12); ctx.lineTo(41, -1);
  ctx.closePath(); ctx.fill();

  // â”€â”€ Tail rotor â”€â”€
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

  // â”€â”€ Main fuselage â€” teardrop shape â”€â”€
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

  // â”€â”€ Side stripe (black) â”€â”€
  ctx.strokeStyle = "#111111";
  ctx.lineWidth   = 2.5;
  ctx.beginPath();
  ctx.moveTo(-18, 4); ctx.bezierCurveTo(-8, 7, 6, 7, 14, 4);
  ctx.stroke();

  // â”€â”€ Cockpit bubble â€” dark tinted glass â”€â”€
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

  // â”€â”€ Landing skids (black) â”€â”€
  ctx.strokeStyle = "#111111";
  ctx.lineWidth   = 2.5;
  ctx.lineCap     = "round";
  ctx.beginPath(); ctx.moveTo(-16, 14); ctx.lineTo(10, 14); ctx.stroke();

  // Struts
  ctx.strokeStyle = "#333333";
  ctx.lineWidth   = 1.5;
  ctx.beginPath(); ctx.moveTo(-10, 9); ctx.lineTo(-12, 14); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(4,   8); ctx.lineTo(6,   14); ctx.stroke();

  // â”€â”€ Main rotor mast â”€â”€
  ctx.fillStyle = "#111111";
  ctx.fillRect(-2, -15, 4, 4);

  // â”€â”€ Main rotor â”€â”€
  ctx.save();
  ctx.translate(0, -13);

  const rotAngle = helicopter.rotor * -5.5;
  const BLADES   = 3;

  // Blades â€” 3 swept blades, flat underside / curved top
  for (let bl = 0; bl < BLADES; bl++) {
    ctx.save();
    ctx.rotate(rotAngle + bl * (Math.PI * 2 / BLADES));

    // Blade gradient: pale grey root â†’ dark charcoal tip, cyan accent
    const bg = ctx.createLinearGradient(2, 0, 28, 0);
    bg.addColorStop(0,    "#d8dde8");
    bg.addColorStop(0.35, "#9aaabb");
    bg.addColorStop(0.75, "#3c4a5e");
    bg.addColorStop(1,    "#4dd9ff");   // cyan tip
    ctx.fillStyle = bg;

    // Swept blade â€” flat underside, curved top, tapered to tip
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

  // Spinner cap â€” gold/bronze domed hub
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

// â”€â”€ DRAW: SCORE POPUPS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function drawScorePopups() {
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  for (const p of scorePopups) {
    // Pick colour by content
    let col = C.hoopStroke;
    if (p.text.includes("LIFE"))   col = "#ff4466";
    else if (p.text.includes("AUTO")) col = "#ffb342";
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

// â”€â”€ DRAW: LEVEL BANNER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function drawBanner() {
  if (!banner.active || banner.alpha <= 0) return;
  const def = banner.def;

  ctx.save();
  ctx.globalAlpha = banner.alpha;

  // Background bar â€” taller to fit instruction line
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
  const alpha = Math.min(1, gameState.levelTipTimer / 1.5) * 0.92;

  ctx.save();
  ctx.globalAlpha  = alpha;

  const pillW = WORLD_WIDTH - 148;
  const pillH = 34;
  const pillX = 14;
  const pillY = WORLD_HEIGHT - 148;

  const panel = ctx.createLinearGradient(0, pillY, 0, pillY + pillH);
  panel.addColorStop(0, "rgba(8,46,49,0.88)");
  panel.addColorStop(1, "rgba(1,14,18,0.95)");
  ctx.fillStyle = panel;
  ctx.shadowColor = "rgba(125,255,99,0.25)";
  ctx.shadowBlur = 10;
  if (ctx.roundRect) {
    ctx.beginPath(); ctx.roundRect(pillX, pillY, pillW, pillH, 17); ctx.fill();
  } else {
    ctx.fillRect(pillX, pillY, pillW, pillH);
  }
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(125,255,99,0.34)";
  ctx.lineWidth = 1;
  if (ctx.roundRect) {
    ctx.beginPath(); ctx.roundRect(pillX + 0.5, pillY + 0.5, pillW - 1, pillH - 1, 17); ctx.stroke();
  } else {
    ctx.strokeRect(pillX + 0.5, pillY + 0.5, pillW - 1, pillH - 1);
  }

  ctx.fillStyle = def.color;
  if (ctx.roundRect) {
    ctx.beginPath(); ctx.roundRect(pillX + 8, pillY + 8, 4, pillH - 16, 3); ctx.fill();
  } else {
    ctx.fillRect(pillX + 8, pillY + 8, 4, pillH - 16);
  }

  ctx.fillStyle    = "rgba(255,255,255,0.90)";
  ctx.font         = "bold 11px Arial";
  ctx.textAlign    = "left";
  ctx.textBaseline = "middle";
  ctx.beginPath();
  ctx.rect(pillX + 18, pillY, pillW - 28, pillH);
  ctx.clip();
  let tipText = def.instruction;
  if (gameState.levelIndex === 0) tipText = "Paint rings +100 bonus. Dodge hazards.";
  const maxTipW = pillW - 34;
  if (ctx.measureText(tipText).width > maxTipW) {
    while (tipText.length > 8 && ctx.measureText(`${tipText}...`).width > maxTipW) {
      tipText = tipText.slice(0, -1);
    }
    tipText = `${tipText}...`;
  }
  ctx.fillText(tipText, pillX + 20, pillY + pillH / 2);

  ctx.restore();
}

// â”€â”€ DRAW: LEVEL PROGRESS BAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function drawLevelProgressBar() {
  if (gameState.status !== "running") return;
  const def  = LEVEL_DEFS[gameState.levelIndex];
  const hudX = 10, hudY = 10, hudW = WORLD_WIDTH - 20, hudH = 46;
  const barX = hudX + 12, barY = hudY + 35, barW = hudW - 24, barH = 5;

  ctx.save();

  const panel = ctx.createLinearGradient(0, hudY, 0, hudY + hudH);
  panel.addColorStop(0, "rgba(10, 58, 58, 0.93)");
  panel.addColorStop(0.48, "rgba(5, 31, 36, 0.95)");
  panel.addColorStop(1, "rgba(1, 14, 18, 0.97)");
  ctx.fillStyle = panel;
  ctx.shadowColor = "rgba(125,255,99,0.40)";
  ctx.shadowBlur = 14;
  if (ctx.roundRect) {
    ctx.beginPath(); ctx.roundRect(hudX, hudY, hudW, hudH, 16); ctx.fill();
  } else {
    ctx.fillRect(hudX, hudY, hudW, hudH);
  }
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(125,255,99,0.52)";
  ctx.lineWidth = 1;
  if (ctx.roundRect) {
    ctx.beginPath(); ctx.roundRect(hudX + 0.5, hudY + 0.5, hudW - 1, hudH - 1, 16); ctx.stroke();
  } else {
    ctx.strokeRect(hudX + 0.5, hudY + 0.5, hudW - 1, hudH - 1);
  }

  const gloss = ctx.createLinearGradient(0, hudY, 0, hudY + hudH * 0.55);
  gloss.addColorStop(0, "rgba(255,255,255,0.16)");
  gloss.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gloss;
  if (ctx.roundRect) {
    ctx.beginPath(); ctx.roundRect(hudX + 4, hudY + 4, hudW - 8, 17, 12); ctx.fill();
  } else {
    ctx.fillRect(hudX + 4, hudY + 4, hudW - 8, 17);
  }

  ctx.fillStyle = "rgba(255,255,255,0.11)";
  if (ctx.roundRect) {
    ctx.beginPath(); ctx.roundRect(barX, barY, barW, barH, 3); ctx.fill();
  } else {
    ctx.fillRect(barX, barY, barW, barH);
  }

  const nextDef    = LEVEL_DEFS[gameState.levelIndex + 1];
  const levelScore = Math.floor(gameState.distance / 6);
  const progress   = Math.min(1, levelScore / def.completionScore);
  const fillW      = Math.max(4, barW * progress);

  const grad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
  grad.addColorStop(0, def.color);
  grad.addColorStop(1, "rgba(255,255,255,0.9)");
  ctx.fillStyle   = grad;
  ctx.shadowColor = def.color;
  ctx.shadowBlur  = 8;
  if (ctx.roundRect) {
    ctx.beginPath(); ctx.roundRect(barX, barY, fillW, barH, 3); ctx.fill();
  } else {
    ctx.fillRect(barX, barY, fillW, barH);
  }

  const remaining = Math.max(0, def.completionScore - levelScore);
  const fitCanvasText = (text, maxWidth) => {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let fitted = text;
    while (fitted.length > 4 && ctx.measureText(`${fitted}...`).width > maxWidth) {
      fitted = fitted.slice(0, -1);
    }
    return `${fitted}...`;
  };
  const shortLabel = def.name.replace(/^Level \d+\s*[:—-]\s*/, '');
  const nextText = nextDef ? `${remaining} pts -> LV ${nextDef.id}` : `${remaining} pts left`;
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 4;

  const chipW = 42, chipH = 18;
  const chipX = barX, chipY = hudY + 9;
  const chip = ctx.createLinearGradient(0, chipY, 0, chipY + chipH);
  chip.addColorStop(0, "rgba(125,255,99,0.34)");
  chip.addColorStop(1, "rgba(18,86,52,0.84)");
  ctx.fillStyle = chip;
  if (ctx.roundRect) {
    ctx.beginPath(); ctx.roundRect(chipX, chipY, chipW, chipH, 9); ctx.fill();
  } else {
    ctx.fillRect(chipX, chipY, chipW, chipH);
  }
  ctx.strokeStyle = "rgba(125,255,99,0.72)";
  ctx.lineWidth = 1;
  if (ctx.roundRect) {
    ctx.beginPath(); ctx.roundRect(chipX + 0.5, chipY + 0.5, chipW - 1, chipH - 1, 9); ctx.stroke();
  } else {
    ctx.strokeRect(chipX + 0.5, chipY + 0.5, chipW - 1, chipH - 1);
  }
  ctx.font = "bold 10px Arial";
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`LV ${def.id}`, chipX + chipW / 2, chipY + chipH / 2 + 0.5);

  ctx.font = "bold 10px Arial";
  const availableLabelWidth = barW - ctx.measureText(nextText).width - 58;
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(fitCanvasText(shortLabel, Math.max(52, availableLabelWidth)), barX + 50, hudY + 18);

  ctx.fillStyle = "#ffb342";
  ctx.font = "bold 10px Arial";
  ctx.textAlign = "right";
  ctx.fillText(nextText, barX + barW, hudY + 18);

  ctx.restore();
}

// DRAW: HUD PROMPT
function drawPrompt() {
  if (gameState.status !== "running" || gameState.displayedScore > 20) return;
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.74)";
  ctx.font      = "bold 13px Arial";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0,0,0,0.72)";
  ctx.shadowBlur = 6;
  ctx.fillText("Hold to rise - Release to fall", WORLD_WIDTH / 2, 76);
  ctx.restore();
}

// â”€â”€ DRAW: HOOP COUNTER (in-canvas) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
  ctx.fillText(`RINGS x${gameState.hoopsCollected}`, WORLD_WIDTH - 16, 36);
  ctx.restore();
}

function drawPowerupStatus() {
  if (gameState.status !== "running") return;
  const chips = [];
  if (gameState.caveBurst > 0) chips.push({ label: "AUTO FIRE", value: `${Math.ceil(gameState.caveBurst)}s`, color: "#ffb342" });
  if (gameState.caveShield > 0) chips.push({ label: "SHIELD", value: `x${gameState.caveShield}`, color: "#50c8ff" });
  if (!chips.length) return;

  ctx.save();
  ctx.textBaseline = "middle";
  ctx.font = "bold 10px Arial";
  let x = WORLD_WIDTH - 16;
  const y = 66;

  for (let i = chips.length - 1; i >= 0; i--) {
    const chip = chips[i];
    const text = `${chip.label} ${chip.value}`;
    const w = Math.max(86, ctx.measureText(text).width + 24);
    x -= w;

    const panel = ctx.createLinearGradient(0, y - 13, 0, y + 13);
    panel.addColorStop(0, "rgba(10,58,58,0.94)");
    panel.addColorStop(1, "rgba(1,14,18,0.96)");
    ctx.fillStyle = panel;
    ctx.shadowColor = chip.color;
    ctx.shadowBlur = 11;
    if (ctx.roundRect) {
      ctx.beginPath(); ctx.roundRect(x, y - 13, w, 26, 13); ctx.fill();
    } else {
      ctx.fillRect(x, y - 13, w, 26);
    }
    ctx.shadowBlur = 0;
    ctx.strokeStyle = `${chip.color}aa`;
    ctx.lineWidth = 1.2;
    if (ctx.roundRect) {
      ctx.beginPath(); ctx.roundRect(x + 0.5, y - 12.5, w - 1, 25, 13); ctx.stroke();
    } else {
      ctx.strokeRect(x + 0.5, y - 12.5, w - 1, 25);
    }

    ctx.textAlign = "left";
    ctx.fillStyle = chip.color;
    ctx.fillText(chip.label, x + 10, y);
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(chip.value, x + w - 10, y);
    x -= 8;
  }
  ctx.restore();
}

// â”€â”€ RENDER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
    // Glowing gold energy bolt â€” elongated streak
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

    // â”€â”€ Exhaust flame trail â”€â”€
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

    ctx.shadowColor = "#ff6600";
    ctx.shadowBlur = 12;
    drawImageAsset(helicopterAssets.missile, 0, 0, 42, 22, 0, 0.98);

    ctx.restore();
  }
}

function render() {
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
  drawPrompt();
  drawHoopCounter();
  drawPowerupStatus();
  drawScreenEffects();
  if (gameState.status === "running" && gameState.pausedByBlur) drawPauseOverlay();
}

// â”€â”€ GAME LOOP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

let lastFrame = performance.now();

function frameLoop(now) {
  const delta = Math.min(0.032, (now - lastFrame) / 1000);
  lastFrame = now;
  update(delta);
  render();
  requestAnimationFrame(frameLoop);
}

// â”€â”€ CLAUDE COMMENTARY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€ LEADERBOARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function rankLabel(i) {
  if (i === 0) return "Monthly Prize";
  if (i < 10)  return "Prize Draw";
  return "Keep Climbing";
}

function badgeClass(i) {
  if (i === 0) return "champion";
  if (i < 10)  return "raffle";
  return "standard";
}

function sanitizeText(v) {
  return String(v).replace(/[<>&"]/g, "");
}

function renderLeaderboard() {
  if (window.PTIArcade) {
    window.PTIArcade.renderAll();
    return;
  }
  const entries = loadWeeklyScores().sort((a, b) => Number(b.prizePoints || b.score || 0) - Number(a.prizePoints || a.score || 0) || String(a.submittedAt || a.createdAt || "").localeCompare(String(b.submittedAt || b.createdAt || "")));
  if (!entries.length) {
    leaderboardBody.innerHTML = '<tr><td colspan="6" class="empty-state">No scores yet. Start the first run.</td></tr>';
    return;
  }
  leaderboardBody.innerHTML = entries.map((e, i) => `
    <tr class="${i === 0 ? "champion" : i < 10 ? "raffle" : ""}">
      <td data-label="Rank">#${i + 1}</td>
      <td data-label="Player">${sanitizeText(e.playerName || e.name || "Player")}</td>
      <td data-label="Prize Points">${Number(e.prizePoints || e.score || 0).toLocaleString()} Prize Points</td>
      <td data-label="Game">${sanitizeText(e.gameName || "Arcade")}</td>
      <td data-label="Submitted">${window.PTIArcade?.formatSubmittedAt?.(e.submittedAt || e.createdAt) || "Unknown"}</td>
      <td data-label="Status"><span class="status-badge ${badgeClass(i)}">${rankLabel(i)}</span></td>
    </tr>`).join("");
}

const SHEETS_URL = "https://script.google.com/macros/s/AKfycbwBBaFdetFrzqHDl9T6wJAEsaSihyQF5eXCCc1iwy8Fk2OVEV-Y5HQ1ZuB-HPdQRm1j/exec";

function submitScore(name, email, score, ui = {}) {
  const messageEl = ui.messageEl || resultMessage;
  const rankEl = ui.rankEl || resultRankMessage;
  const bestEl = ui.bestEl || resultBestPrizePoints;
  const rawScore = Math.max(0, Math.floor(Number(score) || 0));
  const prizePoints = window.PTIArcade
    ? window.PTIArcade.calculatePrizePoints(ACTIVE_GAME_TYPE, rawScore)
    : rawScore;
  const arcadeResult = window.PTIArcade
    ? window.PTIArcade.submitScore({ playerName: name, email, gameId: ACTIVE_GAME_TYPE, rawScore, level: gameState.levelIndex + 1 })
    : null;
  if (arcadeResult && !arcadeResult.accepted && arcadeResult.reason) {
    messageEl.textContent = arcadeResult.reason;
    return arcadeResult;
  }
  if (arcadeResult) {
    window.PTIArcade?.trackEvent("score_submitted", { gameId: "inkFlightRush", rawScore, prizePoints, accepted: arcadeResult.accepted });
    renderLeaderboard();
    const rankText = arcadeResult.rank ? `You are ranked #${arcadeResult.rank} on the monthly leaderboard.` : "";
    const chaseText = arcadeResult.pointsToTop10
      ? ` Earn ${arcadeResult.pointsToTop10} more Prize Points to enter the prize draw.`
      : arcadeResult.pointsToNextRank
        ? ` Earn ${arcadeResult.pointsToNextRank} more Prize Points to climb one rank.`
        : "";
    messageEl.textContent = `${arcadeResult.message} ${rankText}${chaseText}`;
    if (rankEl) {
      rankEl.textContent = arcadeResult.rank === 1
        ? "You're leading for the monthly prize."
        : arcadeResult.rank && arcadeResult.rank <= 10
          ? "You're in the prize draw."
          : "Keep playing to climb into the prize draw.";
    }
    if (bestEl) {
      const best = window.PTIArcade.getPlayerBests()?.overall?.prizePoints || prizePoints;
      bestEl.textContent = Number(best).toLocaleString();
    }
    return arcadeResult;
  }
  const entry = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: name.trim(),
    email: email.trim(),
    score: rawScore,
    rawScore,
    gameScore: rawScore,
    level: gameState.levelIndex + 1,
    gameType: ACTIVE_GAME_TYPE,
    gameName: ACTIVE_GAME_NAME,
    prizePoints,
    createdAt: new Date().toISOString(),
    submittedAt: new Date().toISOString(),
    monthlyId: getMonthId(),
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
      rawScore: entry.rawScore,
      gameType: entry.gameType,
      prizePoints: entry.prizePoints,
      best: gameState.best,
      submitted_at: entry.createdAt,
      source: "pti-giveaway-arcade",
    }),
  }).catch(() => {}); // silent fail â€” local save already happened
}

// â”€â”€ EXPORT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
    `pti-cave-flight-${getMonthId()}.json`,
    JSON.stringify(loadWeeklyScores(), null, 2),
    "application/json",
  );
}

function csvValue(v) { return `"${String(v).replace(/"/g, '""')}"`; }

function exportScoresAsCsv() {
  const entries = loadWeeklyScores().sort((a, b) => Number(b.prizePoints || b.score || 0) - Number(a.prizePoints || a.score || 0) || String(a.submittedAt || a.createdAt || "").localeCompare(String(b.submittedAt || b.createdAt || "")));
  const rows    = [
    ["rank", "name", "email", "game_score", "prize_points", "status", "submitted_at"].join(","),
    ...entries.map((e, i) =>
      [i + 1, csvValue(e.name), csvValue(e.email), e.rawScore || e.score, e.prizePoints || e.score, csvValue(rankLabel(i)), e.submittedAt || e.createdAt].join(","),
    ),
  ];
  downloadText(
    `pti-cave-flight-${getMonthId()}.csv`,
    rows.join("\n"),
    "text/csv",
  );
}

// â”€â”€ INPUT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

startButton.addEventListener("click",   () => startLevel(gameState.levelIndex + 1));
restartButton.addEventListener("click", restartCurrentLevel);
document.getElementById("gate-button").addEventListener("click", startNextLevel);
caveLevelGrid?.addEventListener("click", (event) => {
  const button = event.target.closest(".cave-level-button");
  if (!button || button.disabled) return;
  prepareLevelIntro(parseInt(button.dataset.level || "1", 10));
});
caveLevelBack?.addEventListener("click", () => {
  window.location.href = "index.html";
});
gateReplayButton?.addEventListener("click", restartCurrentLevel);
gateArcadeButton?.addEventListener("click", () => {
  window.location.href = "index.html";
});

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
    cavFireBtn.textContent   = count > 0 ? "FIRE" : "NO FIRE";
    cavFireBtn.style.opacity = count > 0 ? "1" : "0.4";
  }
  missilesValue.textContent = String(gameState.missiles);
}

const pauseBtn = document.getElementById("pause-btn");

function updateCaveSoundButton() {
  if (!cavePauseSound) return;
  cavePauseSound.textContent = caveSoundMuted ? "Sound Off" : "Sound On";
  cavePauseSound.classList.toggle("muted", caveSoundMuted);
}

function setCavePaused(paused) {
  if (gameState.status !== "running") return;
  gameState.pausedByBlur = paused;
  cavePauseOverlay?.classList.toggle("hidden", !paused);
  if (!paused) lastFrame = performance.now();
  setThrust(false);
  updatePauseBtn();
}

function updatePauseBtn() {
  const active = gameState.status === "running";
  pauseBtn.classList.toggle("hidden", !active);
  pauseBtn.setAttribute("aria-label", gameState.pausedByBlur ? "Resume" : "Pause");
  cavePauseOverlay?.classList.toggle("hidden", !(active && gameState.pausedByBlur));
  updateCaveSoundButton();
}

pauseBtn.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (gameState.status === "running") {
    setCavePaused(!gameState.pausedByBlur);
  }
});

cavePauseResume?.addEventListener("click", () => setCavePaused(false));
cavePauseRestart?.addEventListener("click", restartCurrentLevel);
cavePauseLevels?.addEventListener("click", showCaveLevelSelect);
cavePauseArcade?.addEventListener("click", () => {
  window.location.href = "index.html";
});
caveResultArcade?.addEventListener("click", () => {
  window.location.href = "index.html";
});
cavePauseSound?.addEventListener("click", () => {
  caveSoundMuted = !caveSoundMuted;
  localStorage.setItem(`${STORAGE_PREFIX}:muted`, caveSoundMuted ? "1" : "0");
  updateCaveSoundButton();
});

canvas.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  if (gameState.pausedByBlur) return; // only pause btn can unpause
  setThrust(true);
});

canvas.addEventListener("pointerup",     ()  => { setThrust(false); });
canvas.addEventListener("pointerleave",  ()  => { setThrust(false); });
canvas.addEventListener("pointercancel", ()  => { setThrust(false); });
window.addEventListener("pointerup",     () => setThrust(false));

window.addEventListener("keydown", (e) => {
  if (e.code === "Space") { e.preventDefault(); setThrust(true); }
  if ((e.code === "KeyX" || e.code === "KeyZ") && gameState.status === "running") {
    e.preventDefault(); gameState.caveShootPressed = true;
  }
});
window.addEventListener("keyup", (e) => {
  if (e.code === "Space") { e.preventDefault(); setThrust(false); }
});

window.addEventListener("blur",  () => { setThrust(false); });
window.addEventListener("focus", () => { if (!gameState.pausedByBlur) lastFrame = performance.now(); });

document.addEventListener("visibilitychange", () => {
  gameState.pausedByBlur = document.hidden;
  if (document.hidden) setThrust(false);
  else lastFrame = performance.now();
  updatePauseBtn();
});

scoreForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (gameState.justSubmitted) return;
  const result = submitScore(playerNameInput.value, playerEmailInput.value, gameState.finalTotal || gameState.score);
  if (result?.accepted === false && result.reason) return;
  gameState.justSubmitted    = true;
  if (window.PTIArcade) window.PTIArcade.renderAll();
  playerNameInput.value      = window.PTIArcade?.getSavedPlayerName?.() || playerNameInput.value;
  playerEmailInput.value     = "";
});

gateScoreForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  if (gameState.justSubmitted) return;
  const result = submitScore(
    gatePlayerNameInput?.value || "",
    gatePlayerEmailInput?.value || "",
    gameState.finalTotal || gameState.score,
    { messageEl: document.getElementById("gate-score"), rankEl: gateRankMessage, bestEl: gateBestPrizePoints },
  );
  if (result?.accepted === false && result.reason) return;
  gameState.justSubmitted = true;
  if (window.PTIArcade) window.PTIArcade.renderAll();
  if (gatePlayerNameInput) gatePlayerNameInput.value = window.PTIArcade?.getSavedPlayerName?.() || gatePlayerNameInput.value;
  if (gatePlayerEmailInput) gatePlayerEmailInput.value = "";
});

if (exportJsonButton) exportJsonButton.addEventListener("click", exportScoresAsJson);
if (exportCsvButton) exportCsvButton.addEventListener("click",  exportScoresAsCsv);

if (resetBoardButton) {
  resetBoardButton.addEventListener("click", () => {
    if (!window.confirm("Reset this month's local leaderboard cache?")) return;
    localStorage.removeItem(window.PTIArcade?.KEYS?.monthlyScores || SHARED_LEADERBOARD_KEY);
    renderLeaderboard();
  });
}

// â”€â”€ INIT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

missilesValue.textContent = String(gameState.missiles);
bestValue.textContent = String(gameState.best);
renderLeaderboard();
if (playerNameInput && window.PTIArcade?.getSavedPlayerName) {
  playerNameInput.value = window.PTIArcade.getSavedPlayerName();
}
if (gatePlayerNameInput && window.PTIArcade?.getSavedPlayerName) {
  gatePlayerNameInput.value = window.PTIArcade.getSavedPlayerName();
}
resetGame(false);
showCaveLevelSelect();
render();
requestAnimationFrame(frameLoop);

// â”€â”€ MOBILE CANVAS FIT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// CSS handles most cases but JS ensures canvas never overflows on short phones
// where width*16/9 would exceed available height.
function fitMobileCanvas() {
  const vw = window.innerWidth;
  const root = document.documentElement;

  if (vw > 700 || root.classList.contains("cave-flight-doc")) {
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
  const aspect = WORLD_WIDTH / WORLD_HEIGHT;

  let w = Math.min(vw, Math.floor(availableHeight * aspect));
  let h = Math.floor(w / aspect);

  if (h > availableHeight) {
    h = availableHeight;
    w = Math.floor(h * aspect);
  }

  canvas.style.width  = w + "px";
  canvas.style.height = h + "px";
  root.style.setProperty("--mobile-canvas-width", w + "px");
  root.style.setProperty("--mobile-canvas-height", h + "px");
}
window.addEventListener("resize", fitMobileCanvas);
fitMobileCanvas();

