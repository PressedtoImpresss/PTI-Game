const STORAGE_PREFIX = "pti-slingshot";
const ACTIVE_GAME_TYPE = "print-yard-sling";
const ACTIVE_GAME_NAME = "Print Yard Sling";
const APPS_SCRIPT_URL = "";
const SHEETS_URL = "https://script.google.com/macros/s/AKfycbwBBaFdetFrzqHDl9T6wJAEsaSihyQF5eXCCc1iwy8Fk2OVEV-Y5HQ1ZuB-HPdQRm1j/exec";
const SHOT_LANDED_VIEW_TIME = 2.0;
const PHYSICS_TIME_SCALE = 0.70;
const CAMERA_FOLLOW_SPEED = 5.2;
// Multiplies slingshot release velocity; lower values make arcs easier to read.
const LAUNCH_POWER_MULTIPLIER = 0.72;
// Hard cap for final launch velocity after level/projectile modifiers.
const MAX_LAUNCH_FORCE = 22.5;
// Slightly lowers gravity for longer, less frantic projectile arcs.
const PROJECTILE_GRAVITY_SCALE = 0.84;
// Radial push applied by the mid-flight burst ability.
const BURST_FORCE = 0.00011;
// Upward lift applied by burst so hits still feel punchy after slower shots.
const BURST_LIFT_FORCE = 0.010;
// Delay before burst becomes available, preventing accidental instant bursts.
const BURST_AVAILABLE_DELAY = 0.15;
// Maximum burst activations allowed per launched projectile.
const BURST_MAX_USES_PER_SHOT = 1;
// Drops every slingshot level deck and target stack lower in the playfield.
const PLATFORM_VERTICAL_OFFSET = 24;
const SLINGSHOT_ROTATION = 0.08;
const SLINGSHOT_LOCAL_POUCH = { x: 0.50, y: 0.42 };
const SLINGSHOT_LEFT_BAND = { x: 0.38, y: 0.19 };
const SLINGSHOT_RIGHT_BAND = { x: 0.69, y: 0.17 };
const SLING_STRING_TARGET_HEIGHT = { min: 8.5, ratio: 0.012, max: 14.5 };
const SLING_STRING_SOURCE_CAPS = { start: 170, end: 36 };
const SLING_STRING_OVERLAP = { start: 0.62, end: 0.78 };
const FINAL_SHOT_POWER = 1.24;
const FINAL_PROJECTILE_TYPE = "finalLogo";
const PROJECTILE_TYPE_SEQUENCE = ["standard", "tshirt", "heavy", "splatter", "trigger"];
const PLATFORM_ASSET_KEYS = Object.freeze(["table1", "table2", "table3", "table4", "table5", "table6", "table7"]);
const PLATFORM_ROTATION_KEYS = Object.freeze(["table2", "table3", "table6", "table7", "table1"]);
const PLATFORM_ASSET_ALIASES = Object.freeze({
  "table-1": "table1",
  "table-2": "table2",
  "table-3": "table3",
  "table-4": "table4",
  "table-5": "table5",
  "table-6": "table6",
  "table-7": "table7",
});
const LEGACY_PROJECTILE_TYPE_MAP = {
  paint: "standard",
  parcel: "heavy",
  roll: "trigger",
  ink: "utility",
  logo: FINAL_PROJECTILE_TYPE,
};
const PROJECTILE_TYPES = {
  standard: {
    label: "Standard",
    description: "Balanced shot",
    asset: "paint",
    radius: 21,
    width: 50,
    height: 50,
    density: 0.0034,
    restitution: 0.28,
    frictionAir: 0.0045,
    power: 1.1,
    impactBoost: 1,
    damageScale: 1,
    effect: "standard",
    tint: "#5de6ff",
  },
  heavy: {
    label: "Heavy",
    description: "Slower, stronger impact",
    asset: "parcel",
    radius: 23,
    width: 52,
    height: 52,
    density: 0.0056,
    restitution: 0.18,
    frictionAir: 0.0038,
    power: 1.04,
    impactBoost: 1.55,
    damageScale: 1.45,
    effect: "heavy",
    tint: "#ffb342",
  },
  tshirt: {
    label: "T-Shirt",
    description: "Light merch shot",
    asset: "tshirt",
    radius: 22,
    width: 52,
    height: 58,
    density: 0.003,
    restitution: 0.36,
    frictionAir: 0.0048,
    power: 1.08,
    impactBoost: 0.9,
    damageScale: 0.82,
    effect: "standard",
    tint: "#ff8f25",
  },
  splatter: {
    label: "Splatter",
    description: "Area damage on impact",
    asset: "paint",
    radius: 21,
    width: 50,
    height: 50,
    density: 0.0031,
    restitution: 0.34,
    frictionAir: 0.0048,
    power: 1.08,
    impactBoost: 0.95,
    damageScale: 0.85,
    effect: "splatter",
    effectRadius: 128,
    effectDamage: 1.05,
    effectForce: 0.014,
    tint: "#ff4bd8",
  },
  trigger: {
    label: "Trigger",
    description: "Activates TNT and bombs",
    asset: "roll",
    radius: 20,
    width: 50,
    height: 42,
    density: 0.0028,
    restitution: 0.22,
    frictionAir: 0.005,
    power: 1.1,
    impactBoost: 0.55,
    damageScale: 0.45,
    effect: "trigger",
    triggerImpact: 1.1,
    effectRadius: 84,
    tint: "#ffd84d",
  },
  utility: {
    label: "Utility",
    description: "Push wave effect",
    asset: "ink",
    radius: 21,
    width: 50,
    height: 50,
    density: 0.0032,
    restitution: 0.3,
    frictionAir: 0.0046,
    power: 1.02,
    impactBoost: 0.75,
    damageScale: 0.5,
    effect: "push",
    effectRadius: 150,
    effectForce: 0.024,
    tint: "#7dff63",
  },
  finalLogo: {
    label: "Final Logo",
    description: "Final powerful shot",
    asset: "logo",
    radius: 23,
    width: 58,
    height: 58,
    density: 0.0042,
    restitution: 0.32,
    frictionAir: 0.0042,
    power: FINAL_SHOT_POWER,
    impactBoost: 1.42,
    damageScale: 1.35,
    effect: "final",
    finalShot: true,
    tint: "#ffd84d",
  },
};

const PROJECTILE_ASSETS = Object.freeze(
  [...new Set(Object.values(PROJECTILE_TYPES).map((type) => type.asset))]
);
const PROJECTILE_ONLY_ASSETS = new Set(PROJECTILE_ASSETS);
const WORLD_OBJECT_ASSETS = Object.freeze([
  "woodH", "woodV", "glass", "metal", "box", "badPrint", "sign", "printer",
  "enemy", "enemy2", "enemy3", "glue", "heatPress", "inkCan", "paintBallObject",
  "bombObject", "tnt", "star",
]);
const TARGET_ASSETS = Object.freeze([
  "enemy", "enemy2", "enemy3", "box", "badPrint", "sign", "printer", "star",
  "heatPress", "inkCan", "paintBallObject", "bombObject",
]);
const PLATFORM_ASSETS = Object.freeze([...PLATFORM_ASSET_KEYS]);
const DECORATIVE_ASSETS = Object.freeze(["background", "logo", "slingshot", "badge", "puff"]);

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const scoreValue = document.getElementById("score-value");
const shotsValue = document.getElementById("life-value");
const bestValue = document.getElementById("best-value");
const levelValue = document.getElementById("missiles-value");
const startOverlay = document.getElementById("start-overlay");
const gameSelectOverlay = document.getElementById("game-select-overlay");
const gameSelectBackButton = document.getElementById("game-select-back-button");
const selectSlingshotGame = document.getElementById("select-slingshot-game");
const selectDeliveryGame = document.getElementById("select-delivery-game");
const levelSelectOverlay = document.getElementById("level-select-overlay");
const levelSelectGrid = document.getElementById("level-select-grid");
const levelBackButton = document.getElementById("level-back-button");
const slingOrientationOverlay = document.getElementById("sling-orientation-overlay");
const gameOverOverlay = document.getElementById("game-over-overlay");
const levelGateOverlay = document.getElementById("level-gate-overlay");
const startButton = document.getElementById("start-button");
const homeSoundButton = document.getElementById("home-sound-button");
const homeLeaderboardButton = document.getElementById("home-leaderboard-button");
const homeLevelsButton = document.getElementById("home-levels-button");
const homeShopButton = document.getElementById("home-shop-button");
const homeShopModal = document.getElementById("home-shop-modal");
const shopCloseButton = document.getElementById("shop-close-button");
const restartButton = document.getElementById("restart-button");
const resultMainMenuButton = document.getElementById("result-main-menu-button");
const failedRetryButton = document.getElementById("failed-retry-button");
const failedLevelSelectButton = document.getElementById("failed-level-select-button");
const failedMainMenuButton = document.getElementById("failed-main-menu-button");
const gateButton = document.getElementById("gate-button");
const gateRetryButton = document.getElementById("gate-retry-button");
const gateLevelSelectButton = document.getElementById("gate-level-select-button");
const gateScoreValue = document.getElementById("gate-score");
const gateShotsUsed = document.getElementById("gate-shots-used");
const gateBonus = document.getElementById("gate-bonus");
const scoreForm = document.getElementById("score-form");
const playerNameInput = document.getElementById("player-name");
const playerEmailInput = document.getElementById("player-email");
const finalScoreHeading = document.getElementById("final-score-heading");
const resultPrizePoints = document.getElementById("result-prize-points");
const resultBestPrizePoints = document.getElementById("result-best-pp");
const resultRankMessage = document.getElementById("result-rank-message");
const runResultBadge = document.getElementById("run-result-badge");
const runResultKicker = document.getElementById("run-result-kicker");
const runResultTitle = document.getElementById("run-result-title");
const resultMessage = document.getElementById("result-message");
const failedTargetsLeft = document.getElementById("failed-targets-left");
const failedShotsUsed = document.getElementById("failed-shots-used");
const failedBestScore = document.getElementById("failed-best-score");
const leaderboardSection = document.getElementById("leaderboard-section");
const leaderboardBody = document.getElementById("leaderboard-body");
const pauseBtn = document.getElementById("pause-btn");
const pausePanel = document.getElementById("pause-panel");
const pauseRestartBtn = document.getElementById("pause-restart-btn");
const pauseLevelsBtn = document.getElementById("pause-levels-btn");
const pauseResumeBtn = document.getElementById("pause-resume-btn");
const pauseMainMenuBtn = document.getElementById("pause-main-menu-btn");
const pauseSoundBtn = document.getElementById("pause-sound-btn");
const fireBtn = document.getElementById("cave-fire-btn");
const projectileIndicator = document.getElementById("projectile-indicator");
const projectileCurrentLabel = document.getElementById("projectile-current-label");
const projectileCurrentDesc = document.getElementById("projectile-current-desc");
const projectileNextLabel = document.getElementById("projectile-next-label");
const projectileOrder = document.getElementById("projectile-order");

const Matter = window.Matter;
const { Engine, World, Bodies, Body, Events, Vector, Sleeping } = Matter || {};

const ASSET_ROOT = "Assets/slingshot/";
const assetPaths = {
  background: "./Background.png",
  backgroundLevel02: "background-level-02.png",
  backgroundLevel03: "background-level-03.png",
  backgroundLevel04: "background-level-04.png",
  backgroundLevel05: "background-level-05.png",
  backgroundLevel06: "background-level-06.png",
  backgroundLevel07: "background-level-07.png",
  backgroundLevel08: "background-level-08.png",
  backgroundLevel09: "background-level-09.png",
  backgroundLevel10: "background-level-10.png",
  backgroundLevel11: "background-level-11.png",
  backgroundLevel12: "background-level-12.png",
  backgroundLevel13: "background-level-13.png",
  backgroundLevel14: "background-level-14.png",
  backgroundLevel15: "background-level-15.png",
  backgroundLevel16: "background-level-16.png",
  backgroundLevel17: "background-level-17.png",
  backgroundLevel18: "background-level-18.png",
  backgroundLevel19: "background-level-19.png",
  backgroundLevel20: "background-level-20.png",
  backgroundLevel21: "background-level-21.png",
  backgroundLevel22: "background-level-22.png",
  backgroundLevel23: "background-level-23.png",
  backgroundLevel24: "background-level-24.png",
  backgroundLevel25: "background-level-25.png",
  logo: "PTI%20-%20Logo.png",
  slingshot: "slingshot-game-rest.png",
  slingshotFrame: "slingshot-game-rest.png",
  slingString1: "String1.png",
  slingString2: "String2.png",
  ink: "projectile-ink-can.png",
  roll: "projectile-print-roll.png",
  parcel: "projectile-delivery-box.png",
  paint: "projectile-paint-ball.png",
  tshirt: "tshirt.png",
  table1: "table-1.png",
  table2: "table-2.png",
  table3: "table-3.png",
  table4: "table-4.png",
  table5: "table-5.png",
  table6: "table-6.png",
  table7: "table-7.png",
  woodH: "block-wood-horizontal.png",
  woodV: "block-wood-vertical.png",
  glass: "block-glass.png",
  metal: "block-metal.png",
  box: "target-cardboard-box.png",
  badPrint: "target-bad-print-stack.png",
  sign: "target-signboard.png",
  printer: "target-printer.png",
  enemy: "enemy-blob.png",
  enemy2: "Enemy-blob2.png",
  enemy3: "Enemy-blob3.png",
  glue: "Glue.png",
  heatPress: "heat-press.png",
  inkCan: "Ink%20Can.png",
  paintBallObject: "Paint%20Ball.png",
  bombObject: "bomb.png",
  tnt: "Tnt.png",
  star: "bonus-star.png",
  puff: "effect-explosion-puff.png",
  badge: "ui-level-complete-badge.png",
};

const LEVEL_OBJECT_PREFABS = {
  enemy2: {
    label: "Enemy Blob 2",
    asset: "enemy2",
    collider: "circle",
    role: "enemy",
    mass: "medium",
    restitution: 0.24,
    density: 0.0026,
    size: [46, 46],
    health: 1.15,
    points: 800,
  },
  enemy3: {
    label: "Enemy Blob 3",
    asset: "enemy3",
    collider: "circle",
    role: "enemy",
    mass: "mediumHigh",
    restitution: 0.18,
    density: 0.0034,
    size: [50, 50],
    health: 1.35,
    points: 980,
  },
  glue: {
    label: "Glue",
    asset: "glue",
    collider: "box",
    role: "static",
    static: true,
    restitution: 0,
    density: 0.004,
    size: [74, 28],
    health: Infinity,
    points: 0,
  },
  heatPress: {
    label: "Heat Press",
    asset: "heatPress",
    collider: "box",
    role: "target",
    mass: "high",
    restitution: 0.04,
    density: 0.0075,
    size: [72, 58],
    health: 3.2,
    points: 420,
  },
  inkCanObject: {
    label: "Ink Can",
    asset: "inkCan",
    collider: "box",
    role: "target",
    mass: "mediumHigh",
    restitution: 0.12,
    density: 0.0042,
    size: [52, 42],
    health: 1.6,
    points: 300,
  },
  paintBallObject: {
    label: "Paint Ball",
    asset: "paintBallObject",
    collider: "circle",
    role: "target",
    mass: "medium",
    restitution: 0.42,
    density: 0.0026,
    size: [44, 44],
    health: 1.2,
    points: 320,
  },
  bombObject: {
    label: "Bomb",
    asset: "bombObject",
    collider: "circle",
    role: "target",
    mass: "medium",
    restitution: 0.16,
    density: 0.003,
    size: [44, 44],
    health: 1.6,
    points: 340,
  },
};

window.__ptiLevelPrefabs = LEVEL_OBJECT_PREFABS;
window.__ptiAssetRoles = {
  projectileOnly: PROJECTILE_ASSETS,
  worldObjects: WORLD_OBJECT_ASSETS,
  targets: TARGET_ASSETS,
  platforms: PLATFORM_ASSETS,
  decorative: DECORATIVE_ASSETS,
};

const NEW_ENEMY_RULES = {
  enemy2: { defeatImpact: 3.2, projectileImpact: 0.1, crushImpact: 2.7, heavyMass: 7.5, bombDefeatFalloff: 0.28 },
  enemy3: { defeatImpact: 6.8, projectileImpact: 2.8, crushImpact: 3.5, heavyMass: 9.5, bombDefeatFalloff: 0.72, bombDamageFalloff: 0.42 },
};
const BASIC_BOMB_IMPACT = 6.3;
const LEVEL_GRID_SIZE = 25;
const LEVEL_VALIDATION_ENABLED = typeof location !== "undefined"
  && (location.protocol === "file:" || location.hostname === "localhost" || new URLSearchParams(location.search).has("debugLevels"));

const SLING_LEVEL_LAYOUTS = [
  {
    id: 1,
    block: 1,
    name: "First Shot",
    difficulty: "Easy",
    shots: 3,
    objective: "Hit the main target.",
    requiredTargetIds: ["target_1"],
    bonusObjectIds: [],
    objects: [
      { id: "main_platform", type: "platform", asset: "table-1", x: -380, y: 16, width: 360, height: 32, isStatic: true },
      { id: "target_1", type: "target", x: -380, y: -25, width: 46, height: 46, required: true, points: 500 },
    ],
  },
  {
    id: 2,
    block: 1,
    name: "Low Wall",
    difficulty: "Easy",
    shots: 3,
    objective: "Break through the low wall and hit the target.",
    requiredTargetIds: ["target_1"],
    bonusObjectIds: [],
    objects: [
      { id: "main_platform", type: "platform", asset: "table-2", x: -380, y: 16, width: 400, height: 32, isStatic: true },
      { id: "wall_post_left", type: "verticalPost", x: -455, y: -30, width: 24, height: 60 },
      { id: "wall_post_right", type: "verticalPost", x: -405, y: -30, width: 24, height: 60 },
      { id: "wall_beam", type: "horizontalBeam", x: -430, y: -70, width: 86, height: 20 },
      { id: "target_1", type: "target", x: -320, y: -25, width: 46, height: 46, required: true, points: 500 },
    ],
  },
  {
    id: 3,
    block: 1,
    name: "Two Targets",
    difficulty: "Easy-Medium",
    shots: 4,
    objective: "Clear both targets.",
    requiredTargetIds: ["target_low", "target_high"],
    bonusObjectIds: [],
    objects: [
      { id: "lower_platform", type: "platform", asset: "table-3", x: -430, y: 16, width: 260, height: 32, isStatic: true },
      { id: "target_low", type: "target", x: -430, y: -25, width: 44, height: 44, required: true, points: 500 },
      { id: "upper_platform", type: "platform", asset: "table-3", x: -330, y: -78, width: 190, height: 28, isStatic: true },
      { id: "target_high", type: "target", x: -330, y: -120, width: 44, height: 44, required: true, points: 500 },
    ],
  },
  {
    id: 4,
    block: 1,
    name: "Bonus Object",
    difficulty: "Medium",
    shots: 4,
    objective: "Clear the target. Hit the star for extra score.",
    requiredTargetIds: ["target_1"],
    bonusObjectIds: ["bonus_star"],
    objects: [
      { id: "main_platform", type: "platform", asset: "table-2", x: -500, y: 16, width: 340, height: 32, isStatic: true },
      { id: "target_1", type: "target", x: -465, y: -25, width: 46, height: 46, required: true, points: 500 },
      { id: "bonus_shelf", type: "platform", style: "shelf", x: -400, y: -86, width: 130, height: 24, isStatic: true },
      { id: "bonus_star", type: "bonusObject", x: -400, y: -120, width: 42, height: 42, bonus: true, points: 250 },
    ],
  },
  {
    id: 5,
    block: 1,
    name: "First Mini Structure",
    difficulty: "Medium",
    shots: 5,
    objective: "Knock down the small frame and clear the target.",
    requiredTargetIds: ["target_1"],
    bonusObjectIds: ["bonus_star"],
    objects: [
      { id: "main_platform", type: "platform", asset: "table-6", x: -420, y: 16, width: 400, height: 32, isStatic: true },
      { id: "tower_post_left", type: "verticalPost", x: -470, y: -42, width: 24, height: 84 },
      { id: "tower_post_right", type: "verticalPost", x: -370, y: -42, width: 24, height: 84 },
      { id: "tower_roof", type: "horizontalBeam", x: -420, y: -94, width: 132, height: 20 },
      { id: "target_1", type: "target", x: -420, y: -24, width: 44, height: 44, required: true, points: 500 },
      { id: "bonus_star", type: "bonusObject", x: -525, y: -25, width: 42, height: 42, bonus: true, points: 250 },
    ],
  },
];

const assets = {};
const assetLoadPromises = new Map();
const levels = [
  { ...SLING_LEVEL_LAYOUTS[0], projectile: "ink", strength: 1, tower: "structured", platformPattern: "starter" },
  { ...SLING_LEVEL_LAYOUTS[1], projectile: "paint", strength: 1.08, tower: "structured", platformPattern: "wideRight" },
  { ...SLING_LEVEL_LAYOUTS[2], projectile: "parcel", strength: 1.16, tower: "structured", platformPattern: "shortLeft" },
  { ...SLING_LEVEL_LAYOUTS[3], projectile: "roll", strength: 1.22, tower: "structured", platformPattern: "narrowRight" },
  { ...SLING_LEVEL_LAYOUTS[4], projectile: "ink", strength: 1.24, tower: "structured", platformPattern: "split" },
  { name: "Courier Crunch", projectile: "paint", strength: 1.26, tower: "bridge", shots: 4, platformPattern: "splitWide" },
  { name: "Press Tower", projectile: "parcel", strength: 1.28, tower: "tower", shots: 5, platformPattern: "pressTower" },
  { name: "Ink Fortress", projectile: "roll", strength: 1.30, tower: "fort", shots: 5, platformPattern: "fortSplit" },
  { name: "Dispatch Gauntlet", projectile: "ink", strength: 1.32, tower: "gauntlet", shots: 5, platformPattern: "splitWide" },
  { name: "Final Proof", projectile: "paint", strength: 1.34, tower: "final", shots: 5, platformPattern: "splitWide" },
  { name: "Vault Doors", projectile: "ink", strength: 1.36, tower: "vault", shots: 5, platformPattern: "narrowLeft" },
  { name: "Spire Press", projectile: "roll", strength: 1.38, tower: "spire", shots: 5, platformPattern: "skinny" },
  { name: "Loading Dock", projectile: "parcel", strength: 1.40, tower: "dock", shots: 5, platformPattern: "threeStep" },
  { name: "Tunnel Press", projectile: "paint", strength: 1.42, tower: "tunnel", shots: 4, platformPattern: "offsetSplit" },
  { name: "Chain Reaction", projectile: "ink", strength: 1.44, tower: "chain", shots: 4, platformPattern: "split" },
  { name: "Roof Stack", projectile: "roll", strength: 1.46, tower: "stack", shots: 5, platformPattern: "roofStack" },
  { name: "Glass Pyramid", projectile: "paint", strength: 1.48, tower: "pyramid", shots: 5, platformPattern: "narrowRight" },
  { name: "Iron Wall", projectile: "parcel", strength: 1.50, tower: "wall", shots: 5, platformPattern: "shortLeft" },
  { name: "Print Floor Boss", projectile: "ink", strength: 1.52, tower: "boss", shots: 5, platformPattern: "splitWide" },
  { name: "The Last Run", projectile: "roll", strength: 1.54, tower: "lastRun", shots: 6, platformPattern: "threeStep" },
  { name: "Box Mountain", projectile: "parcel", strength: 1.56, tower: "boxMountain", shots: 5, platformPattern: "narrowLeft" },
  { name: "Sign Storm", projectile: "ink", strength: 1.58, tower: "signStorm", shots: 4, platformPattern: "offsetSplit" },
  { name: "Press Stack", projectile: "roll", strength: 1.60, tower: "pressStack", shots: 4, platformPattern: "skinny" },
  { name: "Skyline Spire", projectile: "paint", strength: 1.61, tower: "skyline", shots: 4, platformPattern: "narrowRight" },
  { name: "Crossfire", projectile: "parcel", strength: 1.63, tower: "crossfire", shots: 5, platformPattern: "splitWide" },
  { name: "Demolition Yard", projectile: "ink", strength: 1.64, tower: "demolition", shots: 4, platformPattern: "shortLeft" },
  { name: "Glass Maze", projectile: "roll", strength: 1.66, tower: "glassMaze", shots: 5, platformPattern: "narrowLeft" },
  { name: "Iron Bunker", projectile: "paint", strength: 1.68, tower: "ironBunker", shots: 5, platformPattern: "narrowRight" },
  { name: "Skyline Apex", projectile: "parcel", strength: 1.70, tower: "apex", shots: 5, platformPattern: "skinny" },
  { name: "Print Shop Showdown", projectile: "ink", strength: 1.72, tower: "printShop", shots: 6, platformPattern: "threeStep" },
];

const state = {
  status: "loading",
  levelIndex: 0,
  score: 0,
  finalScore: 0,
  best: loadBestScore(),
  shots: 3,
  submitted: false,
  paused: false,
  wonLevel: false,
  levelCompleteQueued: false,
  settling: 0,
  hasLaunched: false,
};

function setArcadeShellMode(mode) {
  const modeClasses = ["arcade-home-mode", "arcade-menu-mode", "arcade-game-mode"];
  [document.documentElement, document.body].forEach((el) => {
    if (!el) return;
    modeClasses.forEach((className) => el.classList.remove(className));
    el.classList.add(`arcade-${mode}-mode`);
  });
}

function syncArcadeShellMode() {
  if (state.status === "idle" || state.status === "loading") {
    setArcadeShellMode("home");
  } else if (state.status === "game-select" || state.status === "select") {
    setArcadeShellMode("menu");
  } else {
    setArcadeShellMode("game");
  }
}

function isTouchPhoneViewport() {
  const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches || false;
  return (coarsePointer || navigator.maxTouchPoints > 0) && Math.min(window.innerWidth, window.innerHeight) <= 700;
}

function isPhoneLandscapeViewport() {
  return isTouchPhoneViewport() && window.innerWidth > window.innerHeight;
}

function requestSlingshotFullscreen() {
  if (!isPhoneLandscapeViewport() || document.fullscreenElement) return;
  const target = document.documentElement;
  const request = target.requestFullscreen || target.webkitRequestFullscreen || target.msRequestFullscreen;
  try {
    const result = request?.call(target, { navigationUI: "hide" });
    if (result?.catch) result.catch(() => {});
  } catch (_) {
    // Mobile in-app browsers often block fullscreen; gameplay still fits the visible viewport.
  }
}

function shouldLockSlingshotForPortrait() {
  if (!isTouchPhoneViewport()) return false;
  if (window.innerWidth >= window.innerHeight) return false;
  return ["select", "running", "level", "over"].includes(state.status);
}

function updateSlingshotOrientationGate() {
  const locked = shouldLockSlingshotForPortrait();
  slingOrientationOverlay?.classList.toggle("hidden", !locked);
  document.body.classList.toggle("sling-orientation-locked", locked);
  document.documentElement.classList.toggle("sling-orientation-locked", locked);

  if (locked && state.status === "running") {
    cancelDrag();
    if (!state.paused) {
      state.paused = true;
      orientationPauseLock = true;
    }
    pausePanel.classList.add("hidden");
  } else if (!locked && orientationPauseLock) {
    if (state.status === "running") {
      state.paused = false;
      lastFrame = performance.now();
    }
    orientationPauseLock = false;
  } else if (!locked) {
    orientationPauseLock = false;
  }
}

let engine = null;
let world = null;
let layoutSettling = false;
let cssW = 960;
let cssH = 540;
let worldW = 1500;
let cameraX = 0;
let cameraTargetX = 0;
let groundY = 470;
let lastDrawnLevelBackgroundKey = null;
let anchor = { x: 150, y: 360 };
let currentProjectile = null;
let launchedProjectile = null;
let heldProjectilePosition = null;
let dragging = false;
let pointer = { x: 0, y: 0 };
let dragStart = { x: 0, y: 0 };
let panning = false;
let panStartCameraX = 0;
let panStartPointerX = 0;
let userPanned = false;
let launchAge = 0;
let launchRealAge = 0;
let nextProjectileDelay = 0;
let shotLandedAge = null;
let projectileSpawnAnim = 0;
let levelShotTotal = 3;
let lastFrame = performance.now();
let bodies = [];
let targets = [];
let platforms = [];
let particles = [];
let scorePopups = [];
let shotTrail = [];
let resizeQueued = false;
let lastLaunch = null;
let shotAbilityUsed = false;
let shotAbilityUsesThisShot = 0;
let screenShake = 0;
let audioCtx = null;
let audioMaster = null;
let audioUnlocked = false;
let audioMuted = localStorage.getItem(`${STORAGE_PREFIX}:sound-muted`) === "1";
let lastImpactSoundAt = 0;
let lastPullSoundAt = 0;
let levelHintTimer = 0;
let orientationPauseLock = false;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function addScorePopup(x, y, points, label = "") {
  const value = Math.max(0, Math.floor(points || 0));
  if (!value) return;
  scorePopups.push({
    x,
    y,
    text: label ? `+${value} ${label}` : `+${value}`,
    life: 0.92,
    max: 0.92,
    vy: -44,
    scale: 0.85,
  });
}

function awardScore(points, x, y, label = "") {
  const value = Math.max(0, Math.floor(points || 0));
  if (!value) return 0;
  state.score += value;
  addScorePopup(x, y, value, label);
  return value;
}

function ensureAudio() {
  if (!window.AudioContext && !window.webkitAudioContext) return null;
  if (!audioCtx) {
    const Context = window.AudioContext || window.webkitAudioContext;
    audioCtx = new Context();
    audioMaster = audioCtx.createGain();
    audioMaster.gain.value = audioMuted ? 0 : 0.18;
    audioMaster.connect(audioCtx.destination);
  }
  if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
  audioUnlocked = true;
  return audioCtx;
}

function updateSoundUi() {
  homeSoundButton?.classList.toggle("is-muted", audioMuted);
  homeSoundButton?.setAttribute("aria-pressed", audioMuted ? "true" : "false");
  if (pauseSoundBtn) {
    pauseSoundBtn.textContent = audioMuted ? "Sound Off" : "Sound On";
    pauseSoundBtn.classList.toggle("is-muted", audioMuted);
    pauseSoundBtn.setAttribute("aria-pressed", audioMuted ? "true" : "false");
  }
}

function setAudioMuted(muted) {
  audioMuted = Boolean(muted);
  localStorage.setItem(`${STORAGE_PREFIX}:sound-muted`, audioMuted ? "1" : "0");
  if (audioMaster) audioMaster.gain.value = audioMuted ? 0 : 0.18;
  updateSoundUi();
}

function toggleAudioMuted() {
  const nextMuted = !audioMuted;
  if (!nextMuted) ensureAudio();
  setAudioMuted(nextMuted);
  if (!nextMuted) playSound("start");
}

function playTone({ frequency = 440, endFrequency = frequency, duration = 0.12, type = "sine", volume = 0.12, when = 0 }) {
  const ctxAudio = ensureAudio();
  if (!ctxAudio || !audioMaster) return;
  const start = ctxAudio.currentTime + when;
  const osc = ctxAudio.createOscillator();
  const gain = ctxAudio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(audioMaster);
  osc.start(start);
  osc.stop(start + duration + 0.03);
}

function playNoise({ duration = 0.08, volume = 0.08, filter = 900, when = 0 }) {
  const ctxAudio = ensureAudio();
  if (!ctxAudio || !audioMaster) return;
  const start = ctxAudio.currentTime + when;
  const length = Math.max(1, Math.floor(ctxAudio.sampleRate * duration));
  const buffer = ctxAudio.createBuffer(1, length, ctxAudio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const source = ctxAudio.createBufferSource();
  const gain = ctxAudio.createGain();
  const biquad = ctxAudio.createBiquadFilter();
  source.buffer = buffer;
  biquad.type = "lowpass";
  biquad.frequency.value = filter;
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(biquad);
  biquad.connect(gain);
  gain.connect(audioMaster);
  source.start(start);
}

function playSound(name, intensity = 1) {
  if (audioMuted) return;
  if (!audioUnlocked && name !== "start") return;
  const power = clamp(intensity, 0.35, 1.6);
  if (name === "start") {
    playTone({ frequency: 440, endFrequency: 660, duration: 0.08, type: "triangle", volume: 0.08 });
    playTone({ frequency: 660, endFrequency: 880, duration: 0.10, type: "triangle", volume: 0.07, when: 0.07 });
  } else if (name === "pull") {
    playTone({ frequency: 170, endFrequency: 125, duration: 0.10, type: "sawtooth", volume: 0.035 });
  } else if (name === "launch") {
    playTone({ frequency: 180, endFrequency: 520, duration: 0.12, type: "triangle", volume: 0.10 * power });
    playNoise({ duration: 0.05, volume: 0.035 * power, filter: 1800 });
  } else if (name === "hit") {
    const now = performance.now();
    if (now - lastImpactSoundAt < 45) return;
    lastImpactSoundAt = now;
    playTone({ frequency: 150, endFrequency: 90, duration: 0.07, type: "square", volume: 0.055 * power });
    playNoise({ duration: 0.045, volume: 0.045 * power, filter: 850 });
  } else if (name === "break") {
    playNoise({ duration: 0.13, volume: 0.09 * power, filter: 1600 });
    playTone({ frequency: 240, endFrequency: 85, duration: 0.12, type: "square", volume: 0.045 * power });
  } else if (name === "target") {
    playTone({ frequency: 520, endFrequency: 900, duration: 0.09, type: "triangle", volume: 0.08 * power });
    playNoise({ duration: 0.08, volume: 0.045 * power, filter: 2200, when: 0.02 });
  } else if (name === "burst") {
    playNoise({ duration: 0.16, volume: 0.095 * power, filter: 1300 });
    playTone({ frequency: 110, endFrequency: 55, duration: 0.18, type: "sine", volume: 0.07 * power });
  } else if (name === "level") {
    playTone({ frequency: 523, endFrequency: 659, duration: 0.08, type: "triangle", volume: 0.08 });
    playTone({ frequency: 659, endFrequency: 784, duration: 0.08, type: "triangle", volume: 0.08, when: 0.08 });
    playTone({ frequency: 784, endFrequency: 1046, duration: 0.16, type: "triangle", volume: 0.08, when: 0.16 });
  } else if (name === "over") {
    playTone({ frequency: 260, endFrequency: 180, duration: 0.18, type: "triangle", volume: 0.08 });
    playTone({ frequency: 180, endFrequency: 110, duration: 0.22, type: "triangle", volume: 0.07, when: 0.16 });
  } else if (name === "pause") {
    playTone({ frequency: 340, endFrequency: 260, duration: 0.08, type: "sine", volume: 0.05 });
  }
}

function loadBestScore() {
  return Number(localStorage.getItem(`${STORAGE_PREFIX}:best`) || 0);
}

function saveBestScore(score) {
  if (score > state.best) {
    state.best = score;
    localStorage.setItem(`${STORAGE_PREFIX}:best`, String(score));
  }
}

function loadLevelCheckpoint() {
  const saved = Number(localStorage.getItem(`${STORAGE_PREFIX}:level-checkpoint`) || 0);
  return clamp(Number.isFinite(saved) ? saved : 0, 0, Math.max(0, levels.length - 1));
}

function saveLevelCheckpoint(index) {
  const requested = clamp(index, 0, Math.max(0, levels.length - 1));
  const next = Math.max(loadLevelCheckpoint(), requested);
  localStorage.setItem(`${STORAGE_PREFIX}:level-checkpoint`, String(next));
  return next;
}

function resetLevelCheckpoint() {
  localStorage.setItem(`${STORAGE_PREFIX}:level-checkpoint`, "0");
  state.levelIndex = 0;
}

function loadLeaderboard() {
  return window.PTIArcade ? window.PTIArcade.getLeaderboard() : [];
}

function saveLeaderboard(entries) {
  if (!window.PTIArcade) localStorage.setItem(`${STORAGE_PREFIX}:leaderboard`, JSON.stringify(entries.slice(0, 20)));
}

function getPrizePoints(entry) {
  const points = Number(entry?.prizePoints ?? entry?.score ?? 0);
  return Number.isFinite(points) ? points : 0;
}

function renderLeaderboard() {
  if (window.PTIArcade) {
    window.PTIArcade.renderAll();
    return;
  }
  const rows = loadLeaderboard().sort((a, b) => getPrizePoints(b) - getPrizePoints(a)).slice(0, 10);
  if (!rows.length) {
    leaderboardBody.innerHTML = '<tr><td colspan="6" class="empty-state">No scores yet. Start the first run.</td></tr>';
    return;
  }
  leaderboardBody.innerHTML = rows.map((entry, index) => {
    const status = index === 0 ? "Monthly Prize" : index < 10 ? "Prize Draw" : "Keep Climbing";
    const submitted = window.PTIArcade?.formatSubmittedAt?.(entry.submittedAt || entry.createdAt) || "Unknown";
    return `<tr class="${index === 0 ? "winner" : index < 10 ? "raffle" : ""}">
      <td data-label="Rank">#${index + 1}</td>
      <td data-label="Player">${escapeHtml(entry.name)}</td>
      <td data-label="Prize Points">${getPrizePoints(entry).toLocaleString()} Prize Points</td>
      <td data-label="Game">${escapeHtml(entry.gameName || "Arcade")}</td>
      <td data-label="Submitted">${escapeHtml(submitted)}</td>
      <td data-label="Status">${status}</td>
    </tr>`;
  }).join("");
}

function renderLevelSelect() {
  if (!levelSelectGrid) return;
  const currentLevelIndex = loadLevelCheckpoint();
  levelSelectGrid.innerHTML = "";
  levels.forEach((level, index) => {
    const completed = index < currentLevelIndex;
    const current = index === currentLevelIndex;
    const locked = index > currentLevelIndex;
    const card = document.createElement("button");
    card.type = "button";
    card.className = `level-card ${completed ? "completed" : current ? "current" : "locked"}`;
    card.dataset.levelIndex = String(index);
    card.setAttribute("aria-disabled", locked ? "true" : "false");
    card.setAttribute("aria-label", `${level.name}, level ${index + 1}, ${completed ? "completed" : current ? "current" : "locked"}`);
    const label = document.createElement("strong");
    label.textContent = String(index + 1);
    const meta = document.createElement("span");
    meta.className = completed ? "level-check" : locked ? "level-lock" : "level-current-mark";
    if (locked) {
      meta.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
          <path d="M7.5 10V7.8C7.5 5.15 9.51 3.25 12 3.25C14.49 3.25 16.5 5.15 16.5 7.8V10" stroke="white" stroke-width="2.4" stroke-linecap="round"/>
          <rect x="5.25" y="9.25" width="13.5" height="11" rx="2.4" fill="url(#lockBody-${index})" stroke="rgba(255,255,255,0.8)" stroke-width="1.2"/>
          <circle cx="12" cy="14" r="1.45" fill="#4f555b"/>
          <path d="M12 15.3V17.4" stroke="#4f555b" stroke-width="1.7" stroke-linecap="round"/>
          <defs>
            <linearGradient id="lockBody-${index}" x1="12" y1="9.25" x2="12" y2="20.25" gradientUnits="userSpaceOnUse">
              <stop stop-color="#ffffff"/>
              <stop offset="0.42" stop-color="#d9dde0"/>
              <stop offset="1" stop-color="#8d949b"/>
            </linearGradient>
          </defs>
        </svg>`;
    }
    card.append(label, meta);
    levelSelectGrid.appendChild(card);
  });
}

function showLevelSelect() {
  ensureAudio();
  playSound("start");
  closeHomeModals();
  renderLevelSelect();
  state.status = "select";
  startOverlay.style.display = "none";
  gameSelectOverlay.classList.add("hidden");
  levelSelectOverlay.classList.remove("hidden");
  gameOverOverlay.classList.add("hidden");
  levelGateOverlay.classList.add("hidden");
  updateHud();
}

function showGameSelect() {
  ensureAudio();
  playSound("start");
  closeHomeModals();
  state.status = "game-select";
  state.paused = false;
  pausePanel.classList.add("hidden");
  startOverlay.style.display = "none";
  gameSelectOverlay.classList.remove("hidden");
  levelSelectOverlay.classList.add("hidden");
  gameOverOverlay.classList.add("hidden");
  levelGateOverlay.classList.add("hidden");
  updateHud();
}

function showStartScreen() {
  state.status = "idle";
  state.paused = false;
  pausePanel.classList.add("hidden");
  gameSelectOverlay.classList.add("hidden");
  levelSelectOverlay.classList.add("hidden");
  gameOverOverlay.classList.add("hidden");
  levelGateOverlay.classList.add("hidden");
  closeHomeModals();
  startOverlay.style.display = "";
  updateHud();
}

function resumeGameFromPause() {
  if (state.status !== "running") return;
  state.paused = false;
  pausePanel.classList.add("hidden");
  playSound("pause");
  updateHud();
}

function closeHomeModals() {
  homeShopModal?.classList.add("hidden");
}

function showHomeModal(modal) {
  closeHomeModals();
  modal?.classList.remove("hidden");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[ch]));
}

function makeCutout(img, key) {
  if (key.startsWith("background")) return img;
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const cx = c.getContext("2d", { willReadFrequently: true });
  cx.drawImage(img, 0, 0);
  let image;
  try {
    image = cx.getImageData(0, 0, c.width, c.height);
  } catch (e) {
    // file:// CORS restriction — return plain canvas without background removal
    return c;
  }
  const data = image.data;
  const w = c.width;
  const h = c.height;
  const seen = new Uint8Array(w * h);
  const queue = [];

  function sat(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    return max === 0 ? 0 : (max - min) / max;
  }

  function isBackground(i) {
    const p = i * 4;
    const r = data[p], g = data[p + 1], b = data[p + 2], a = data[p + 3];
    if (a < 8) return true;
    const bright = Math.max(r, g, b);
    const s = sat(r, g, b);
    return (bright > 190 && s < 0.22) || (bright > 92 && s < 0.08);
  }

  function push(x, y) {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = y * w + x;
    if (seen[i] || !isBackground(i)) return;
    seen[i] = 1;
    queue.push(i);
  }

  for (let x = 0; x < w; x += 1) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y += 1) {
    push(0, y);
    push(w - 1, y);
  }

  while (queue.length) {
    const i = queue.pop();
    const x = i % w;
    const y = (i / w) | 0;
    data[i * 4 + 3] = 0;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  if (key === "slingshot") {
    for (let i = 0; i < w * h; i += 1) {
      const p = i * 4;
      const r = data[p], g = data[p + 1], b = data[p + 2], a = data[p + 3];
      if (a < 8) continue;
      const bright = Math.max(r, g, b);
      const s = sat(r, g, b);
      if (bright > 145 && s < 0.18) {
        data[p + 3] = 0;
      }
    }
  }

  if (key === "logo") {
    for (let i = 0; i < w * h; i += 1) {
      const p = i * 4;
      const r = data[p], g = data[p + 1], b = data[p + 2], a = data[p + 3];
      const bright = Math.max(r, g, b);
      if (a > 0 && bright > 104) {
        data[p + 3] = 0;
      } else if (a > 0) {
        const alpha = clamp((120 - bright) / 80, 0.72, 1);
        data[p] = 0;
        data[p + 1] = 0;
        data[p + 2] = 0;
        data[p + 3] = Math.round(a * alpha);
      }
    }
  }

  cx.putImageData(image, 0, 0);
  return c;
}

function updateHud() {
  syncArcadeShellMode();
  scoreValue.textContent = String(Math.floor(state.score));
  shotsValue.textContent = String(Math.max(0, state.shots));
  bestValue.textContent = String(state.best);
  levelValue.textContent = String(state.levelIndex + 1);
  pauseBtn.classList.toggle("hidden", state.status !== "running");
  if (state.status !== "running") pausePanel.classList.add("hidden");
  updateProjectileIndicator();
  fireBtn.textContent = "BURST";
  fireBtn.classList.toggle(
    "hidden",
    !(state.status === "running"
      && launchedProjectile
      && launchRealAge >= BURST_AVAILABLE_DELAY
      && shotAbilityUsesThisShot < BURST_MAX_USES_PER_SHOT)
  );
  updateSlingshotOrientationGate();
}

function shotTypeForHud() {
  if (currentProjectile?.plugin?.projectileType) return currentProjectile.plugin.projectileType;
  if (state.shots > 0) return getProjectileTypeForSlot(state.shots);
  if (launchedProjectile?.plugin?.projectileType) return launchedProjectile.plugin.projectileType;
  return null;
}

function updateProjectileIndicator() {
  if (!projectileIndicator || !projectileCurrentLabel || !projectileCurrentDesc || !projectileNextLabel || !projectileOrder) return;
  const isVisible = state.status === "running" && (state.shots > 0 || currentProjectile || launchedProjectile);
  projectileIndicator.classList.toggle("hidden", !isVisible);
  if (!isVisible) return;

  const currentType = shotTypeForHud();
  const currentMetrics = projectileMetrics(currentType);
  const nextSlot = currentProjectile ? state.shots - 1 : state.shots - 1;
  const nextType = nextSlot > 0 ? getProjectileTypeForSlot(nextSlot) : null;
  const nextMetrics = nextType ? projectileMetrics(nextType) : null;

  projectileCurrentLabel.textContent = currentMetrics.label;
  projectileCurrentDesc.textContent = currentMetrics.description || "";
  projectileNextLabel.textContent = nextMetrics ? nextMetrics.label : "Last Shot";
  projectileIndicator.style.setProperty("--projectile-accent", currentMetrics.tint || "#7dff63");

  projectileOrder.innerHTML = "";
  const slots = [];
  for (let slot = state.shots; slot >= 1; slot -= 1) {
    slots.push(getProjectileTypeForSlot(slot));
  }
  if (!slots.length && currentType) slots.push(currentType);

  slots.forEach((type, index) => {
    const metrics = projectileMetrics(type);
    const chip = document.createElement("span");
    chip.className = `projectile-chip${index === 0 ? " active" : ""}`;
    chip.textContent = metrics.label;
    if (index !== 0) chip.style.color = metrics.tint || "#fff";
    chip.title = `${metrics.label}: ${metrics.description || ""}`;
    projectileOrder.appendChild(chip);
  });
}

function isDeferredAssetKey(key) {
  return /^backgroundLevel\d+$/i.test(key);
}

function resolveAssetPath(path) {
  return path.startsWith("./") || path.startsWith("/") ? path : ASSET_ROOT + path;
}

function loadAssetByKey(key) {
  if (assets[key]) return Promise.resolve(assets[key]);
  if (assetLoadPromises.has(key)) return assetLoadPromises.get(key);
  const path = assetPaths[key];
  if (!path) return Promise.resolve(null);
  const promise = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        assets[key] = makeCutout(img, key);
      } catch (e) {
        console.warn(`Could not process ${key}:`, e.message);
        assets[key] = img;
      }
      resolve();
    };
    img.onerror = () => {
      console.warn(`Could not load ${path}`);
      resolve();
    };
    img.src = resolveAssetPath(path);
  });
  assetLoadPromises.set(key, promise);
  return promise;
}

function backgroundKeyForLevel(levelNumber) {
  return levelNumber >= 2 && levelNumber <= 25
    ? `backgroundLevel${String(levelNumber).padStart(2, "0")}`
    : "background";
}

function requestLevelBackground(levelNumber) {
  const key = backgroundKeyForLevel(levelNumber);
  if (key !== "background") loadAssetByKey(key);
}

function loadAssets() {
  const entries = Object.keys(assetPaths).filter((key) => !isDeferredAssetKey(key));
  return Promise.all(entries.map(loadAssetByKey));
}

function setupCanvasSize() {
  const root = document.documentElement;
  const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches || navigator.maxTouchPoints > 0;
  const mobile = window.innerWidth <= 640 || (coarsePointer && Math.min(window.innerWidth, window.innerHeight) <= 640);
  const landscapePhone = mobile && window.innerWidth > window.innerHeight;
  if (mobile) {
    const hudH = document.querySelector(".hud-strip")?.offsetHeight || 58;
    const minCanvasHeight = landscapePhone ? 220 : 420;
    const targetHeight = landscapePhone
      ? Math.max(minCanvasHeight, window.innerHeight)
      : Math.max(minCanvasHeight, window.innerHeight - hudH);
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = targetHeight + "px";
    root.style.setProperty("--mobile-canvas-width", window.innerWidth + "px");
    root.style.setProperty("--mobile-canvas-height", targetHeight + "px");
  } else {
    canvas.style.width = "";
    canvas.style.height = "";
    root.style.removeProperty("--mobile-canvas-width");
    root.style.removeProperty("--mobile-canvas-height");
  }

  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cssW = Math.max(320, rect.width || 960);
  cssH = Math.max(landscapePhone ? 260 : 320, rect.height || 540);
  const mobileWorldScale = landscapePhone ? 1 : (mobile ? 1.45 : 1.55);
  worldW = Math.max(cssW, cssW * mobileWorldScale);
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  groundY = cssH * 0.86;
  const anchorXRatio = landscapePhone ? 0.17 : (mobile ? 0.24 : 0.28);
  const anchorLift = landscapePhone ? clamp(cssH * 0.08, 24, 42) : clamp(cssH * 0.095, 42, 64);
  anchor = { x: cssW * anchorXRatio, y: groundY - anchorLift };
  if (landscapePhone) {
    cameraX = 0;
    cameraTargetX = 0;
  } else {
    cameraX = clamp(cameraX, 0, Math.max(0, worldW - cssW));
    cameraTargetX = clamp(cameraTargetX, 0, Math.max(0, worldW - cssW));
  }
}

function slingshotMobileScale() {
  if (!isPhoneLandscapeViewport()) return clamp(cssW / 960, 0.72, 1.25);
  return clamp(Math.min(cssW / 960, cssH / 540) * 0.98, 0.58, 0.72);
}

function createWorld() {
  engine = Engine.create();
  world = engine.world;
  engine.enableSleeping = true;
  engine.gravity.y = 1.08 * PROJECTILE_GRAVITY_SCALE;
  World.add(world, [
    Bodies.rectangle(worldW / 2, groundY + 46, worldW + 160, 90, { isStatic: true, label: "ground", friction: 0.9 }),
    Bodies.rectangle(-40, cssH / 2, 80, cssH * 2, { isStatic: true, label: "wall" }),
    Bodies.rectangle(worldW + 40, cssH / 2, 80, cssH * 2, { isStatic: true, label: "wall" }),
  ]);

  Events.on(engine, "collisionStart", handleCollisions);
}

function resetLevel(keepScore = false) {
  if (!engine) createWorld();
  requestLevelBackground(state.levelIndex + 1);
  requestLevelBackground(state.levelIndex + 2);
  World.clear(world, false);
  Engine.clear(engine);
  bodies = [];
  targets = [];
  platforms = [];
  particles = [];
  scorePopups = [];
  shotTrail = [];
  shotAbilityUsed = false;
  shotAbilityUsesThisShot = 0;
  currentProjectile = null;
  launchedProjectile = null;
  heldProjectilePosition = null;
  dragging = false;
  panning = false;
  userPanned = false;
  dragStart = { x: 0, y: 0 };
  launchAge = 0;
  launchRealAge = 0;
  nextProjectileDelay = 0;
  shotLandedAge = null;
  projectileSpawnAnim = 0;
  cameraX = 0;
  cameraTargetX = 0;
  state.shots = levels[state.levelIndex].shots || 3;
  levelShotTotal = state.shots;
  state.wonLevel = false;
  state.levelCompleteQueued = false;
  state.settling = 0;
  state.hasLaunched = false;
  levelHintTimer = 4.8;
  if (!keepScore) state.score = 0;

  World.add(world, [
    Bodies.rectangle(worldW / 2, groundY + 46, worldW + 160, 90, { isStatic: true, label: "ground", friction: 0.9 }),
    Bodies.rectangle(-40, cssH / 2, 80, cssH * 2, { isStatic: true, label: "wall" }),
    Bodies.rectangle(worldW + 40, cssH / 2, 80, cssH * 2, { isStatic: true, label: "wall" }),
  ]);

  buildTower();
  stabilizeInitialLayout();
  settleInitialLevelPhysics();
  spawnProjectile();
  updateHud();
}

function bodyOptions(kind) {
  const options = {
    friction: 0.78,
    frictionStatic: 0.85,
    frictionAir: 0.012,
    restitution: 0.18,
    density: 0.0024,
  };
  if (kind === "glass") {
    options.restitution = 0.35;
    options.density = 0.0015;
  }
  if (kind === "metal") {
    options.density = 0.006;
    options.restitution = 0.08;
  }
  return options;
}

function addBlock(kind, x, y, w, h, angle = 0) {
  const body = Bodies.rectangle(x, y, w, h, bodyOptions(kind));
  Body.setAngle(body, angle);
  const health = kind === "metal" ? 3 : kind === "glass" ? 1 : kind === "woodV" ? 0.8 : 1.35;
  body.plugin = { kind: "block", asset: kind, w, h, health, scored: false };
  bodies.push(body);
  World.add(world, body);
  return body;
}

function addTarget(kind, x, y, w, h, points = 400) {
  if (PROJECTILE_ONLY_ASSETS.has(kind)) return null;
  const circleTarget = kind === "enemy" || kind === "paint" || kind === "star";
  const body = circleTarget
    ? Bodies.circle(x, y, Math.min(w, h) * 0.42, { ...bodyOptions("woodH"), restitution: 0.28 })
    : Bodies.rectangle(x, y, w, h, { ...bodyOptions("woodH"), density: 0.0018 });
  body.plugin = {
    kind: kind === "enemy" ? "enemy" : "target",
    asset: kind,
    w,
    h,
    points,
    health: kind === "enemy" ? 1.1 : kind === "star" ? 0.75 : ["ink", "roll", "parcel", "paint"].includes(kind) ? 1.2 : 1.7,
    scored: false,
  };
  targets.push(body);
  bodies.push(body);
  World.add(world, body);
  return body;
}

function addLevelObject(kind, x, y, scale = 1, angle = 0) {
  const def = LEVEL_OBJECT_PREFABS[kind];
  if (!def) return null;
  if (PROJECTILE_ONLY_ASSETS.has(def.asset)) return null;
  const w = def.size[0] * scale;
  const h = def.size[1] * scale;
  const behaviorKind = def.static
    ? "static"
    : NEW_ENEMY_RULES[kind]
      ? "enemy"
      : kind === "bombObject"
        ? "basicBomb"
        : "levelObject";
  const options = {
    friction: def.static ? 0.95 : 0.72,
    frictionStatic: def.static ? 1 : 0.82,
    frictionAir: def.static ? 0 : 0.012,
    restitution: def.restitution,
    density: def.density,
    isStatic: Boolean(def.static),
    label: def.static ? "static" : "levelObject",
  };
  const body = def.collider === "circle"
    ? Bodies.circle(x, y, Math.min(w, h) * 0.43, options)
    : Bodies.rectangle(x, y, w, h, options);

  Body.setAngle(body, angle);
  body.plugin = {
    kind: behaviorKind,
    asset: def.asset,
    prefab: kind,
    role: def.role,
    label: def.label,
    w,
    h,
    points: NEW_ENEMY_RULES[kind] ? 0 : def.points,
    health: def.health,
    bombDamage: 0,
    scored: false,
    contain: true,
  };

  if (behaviorKind === "enemy") targets.push(body);
  bodies.push(body);
  World.add(world, body);
  return body;
}

function addBomb(x, y, size = 42) {
  const body = Bodies.rectangle(x, y, size, size, {
    ...bodyOptions("woodH"),
    density: 0.0022,
    restitution: 0.24,
  });
  body.plugin = { kind: "bomb", asset: "tnt", w: size, h: size, health: 1, scored: false };
  bodies.push(body);
  World.add(world, body);
  return body;
}

function platformTop(platform) {
  return platform.y - platform.h / 2;
}

function overlapWidth(leftA, rightA, leftB, rightB) {
  return Math.min(rightA, rightB) - Math.max(leftA, leftB);
}

function supportSurfaces(excludeBody = null) {
  const surfaces = platforms.map((platform) => ({
    left: platform.x - platform.w / 2,
    right: platform.x + platform.w / 2,
    top: platformTop(platform),
    material: "woodV",
  }));

  for (const body of bodies) {
    if (body === excludeBody || !body.plugin || body.plugin.kind !== "block") continue;
    surfaces.push({
      left: body.bounds.min.x,
      right: body.bounds.max.x,
      top: body.bounds.min.y,
      material: body.plugin.asset === "metal" ? "metal" : "woodV",
    });
  }

  return surfaces;
}

function findSupportBelow(body, maxGap) {
  const left = body.bounds.min.x;
  const right = body.bounds.max.x;
  const bottom = body.bounds.max.y;
  const minOverlap = Math.min(14, Math.max(8, (right - left) * 0.18));
  let best = null;

  for (const surface of supportSurfaces(body)) {
    const gap = surface.top - bottom;
    if (gap < -2 || gap > maxGap) continue;
    if (overlapWidth(left, right, surface.left, surface.right) < minOverlap) continue;
    if (!best || gap < best.gap) best = { ...surface, gap };
  }

  return best;
}

function wakePhysicsBody(body, nudge = false) {
  if (!body || body.isStatic || body.label === "projectile") return false;
  if (Sleeping) Sleeping.set(body, false);
  if (nudge && Math.abs(body.velocity.y) < 0.2) {
    Body.setVelocity(body, { x: body.velocity.x, y: Math.max(body.velocity.y, 0.45) });
  }
  return true;
}

function boundsCenter(bounds) {
  return {
    x: (bounds.min.x + bounds.max.x) / 2,
    y: (bounds.min.y + bounds.max.y) / 2,
  };
}

function cloneBounds(bounds) {
  return {
    min: { x: bounds.min.x, y: bounds.min.y },
    max: { x: bounds.max.x, y: bounds.max.y },
  };
}

function bodyTouchesSupportBounds(body, supportBounds, maxGap = 14) {
  if (!body || !supportBounds) return false;
  const left = body.bounds.min.x;
  const right = body.bounds.max.x;
  const bottom = body.bounds.max.y;
  const supportLeft = supportBounds.min.x;
  const supportRight = supportBounds.max.x;
  const supportTop = supportBounds.min.y;
  const minOverlap = Math.min(14, Math.max(8, (right - left) * 0.18));
  const gap = supportTop - bottom;
  return gap >= -5 && gap <= maxGap && overlapWidth(left, right, supportLeft, supportRight) >= minOverlap;
}

function wakeNearbyBodies(center, radius = 128, excludeBody = null, nudge = false) {
  if (!center) return 0;
  let woke = 0;
  for (const body of bodies) {
    if (!body?.plugin || body === excludeBody || body.plugin.scored || body.isStatic || body.label === "projectile") continue;
    const distance = Vector.magnitude(Vector.sub(body.position, center));
    if (distance > radius) continue;
    if (wakePhysicsBody(body, nudge)) woke += 1;
  }
  return woke;
}

function wakeBodiesRestingOnBounds(supportBounds, nudge = true) {
  if (!supportBounds) return 0;
  let woke = 0;
  const queue = [supportBounds];
  const seen = new Set();

  while (queue.length) {
    const bounds = queue.shift();
    for (const body of bodies) {
      if (!body?.plugin || body.plugin.scored || body.isStatic || body.label === "projectile" || seen.has(body.id)) continue;
      if (!bodyTouchesSupportBounds(body, bounds)) continue;
      seen.add(body.id);
      if (wakePhysicsBody(body, nudge)) woke += 1;
      queue.push(cloneBounds(body.bounds));
    }
  }

  return woke;
}

function wakeUnsupportedSleepingBodies() {
  if (!state.hasLaunched || !Sleeping) return 0;
  let woke = 0;
  for (const body of bodies) {
    if (!body?.plugin || body.plugin.scored || body.isStatic || body.label === "projectile" || !body.isSleeping) continue;
    const highEnoughToFall = body.bounds.max.y < groundY - 6;
    if (!highEnoughToFall) continue;
    if (findSupportBelow(body, 10)) continue;
    if (wakePhysicsBody(body, true)) woke += 1;
  }
  return woke;
}

function closeSmallLayoutGaps(maxGap) {
  for (let pass = 0; pass < 4; pass += 1) {
    let moved = false;
    for (const body of bodies) {
      if (!body.plugin || body.isStatic) continue;
      const support = findSupportBelow(body, maxGap);
      if (!support || support.gap <= 0.5) continue;
      Body.translate(body, { x: 0, y: support.gap + 0.5 });
      Body.setVelocity(body, { x: 0, y: 0 });
      Body.setAngularVelocity(body, 0);
      moved = true;
    }
    if (!moved) break;
  }
}

function addSupportPostsForFloatingBodies() {
  const s = clamp(cssW / 960, 0.72, 1.25);
  const candidates = bodies.filter((body) => {
    const kind = body.plugin?.kind;
    const horizontalBlock = kind === "block" && (body.plugin?.w || 0) > (body.plugin?.h || 1) * 1.45;
    return horizontalBlock || kind === "enemy" || kind === "target" || kind === "bomb";
  });

  for (const body of candidates) {
    const support = findSupportBelow(body, 145 * s);
    if (!support || support.gap < 18 * s) continue;

    const postH = support.gap - 2 * s;
    if (postH < 20 * s) continue;
    const x = clamp(body.position.x, support.left + 12 * s, support.right - 12 * s);
    const y = body.bounds.max.y + postH / 2;
    const material = support.material === "metal" ? "metal" : "woodV";
    addBlock(material, x, y, 16 * s, postH);
  }
}

function stabilizeInitialLayout() {
  const s = clamp(cssW / 960, 0.72, 1.25);
  closeSmallLayoutGaps(26 * s);
  addSupportPostsForFloatingBodies();
  closeSmallLayoutGaps(12 * s);
}

function platformPalette(index) {
  const palettes = [
    { accent: "#ff9f1c", glow: "rgba(255,159,28,0.42)", trimTop: "#80ff6f", trimBottom: "#228f45", beltTop: "#1f6a56", beltBottom: "#06291f", bodyTop: "#155761", bodyBottom: "#05242b", stroke: "rgba(115,255,78,0.58)" },
    { accent: "#ffb342", glow: "rgba(255,179,66,0.38)", trimTop: "#7dff63", trimBottom: "#2a9d4d", beltTop: "#205f50", beltBottom: "#06251f", bodyTop: "#184d58", bodyBottom: "#061e27", stroke: "rgba(255,179,66,0.56)" },
    { accent: "#58d8ff", glow: "rgba(88,216,255,0.34)", trimTop: "#84ffbd", trimBottom: "#248f78", beltTop: "#1a5c67", beltBottom: "#061f29", bodyTop: "#174a64", bodyBottom: "#071d2a", stroke: "rgba(88,216,255,0.54)" },
    { accent: "#c28cff", glow: "rgba(194,140,255,0.30)", trimTop: "#7dff63", trimBottom: "#268a52", beltTop: "#244f5b", beltBottom: "#0a1f2a", bodyTop: "#25405e", bodyBottom: "#101929", stroke: "rgba(194,140,255,0.48)" },
    { accent: "#7ff5a1", glow: "rgba(127,245,161,0.30)", trimTop: "#9bff73", trimBottom: "#319f58", beltTop: "#1e6451", beltBottom: "#082a21", bodyTop: "#194f4c", bodyBottom: "#071e22", stroke: "rgba(127,245,161,0.52)" },
    { accent: "#ff8f70", glow: "rgba(255,143,112,0.30)", trimTop: "#7dff63", trimBottom: "#278f46", beltTop: "#22574b", beltBottom: "#0a241f", bodyTop: "#25464d", bodyBottom: "#101d23", stroke: "rgba(255,143,112,0.46)" },
  ];
  return palettes[index % palettes.length];
}

function normalizePlatformAsset(asset) {
  if (!asset) return null;
  const key = String(asset).replace(/\.png$/i, "");
  if (PLATFORM_ASSET_KEYS.includes(key)) return key;
  return PLATFORM_ASSET_ALIASES[key] || null;
}

function platformAssetForLevel(levelIndex, platformIndex = 0, explicitAsset = null) {
  const normalized = normalizePlatformAsset(explicitAsset);
  if (normalized) return normalized;
  return PLATFORM_ROTATION_KEYS[(Math.max(0, levelIndex) + Math.max(0, platformIndex)) % PLATFORM_ROTATION_KEYS.length];
}

function platformSpecsForLevel(level) {
  const pattern = level.platformPattern || "starter";
  const layouts = {
    starter: [{ offset: -300, width: 680 }],
    wideRight: [{ offset: -430, width: 500 }],
    shortLeft: [{ offset: -22, width: 330 }],
    narrowRight: [{ offset: 68, width: 300 }],
    narrowLeft: [{ offset: -58, width: 300 }],
    skinny: [{ offset: 16, width: 252 }],
    pressTower: [{ offset: 8, width: 330 }],
    roofStack: [{ offset: 16, width: 330 }],
    split: [
      { offset: -108, width: 205 },
      { offset: 118, width: 215 },
    ],
    fortSplit: [
      { offset: -118, width: 230 },
      { offset: 120, width: 240 },
    ],
    splitWide: [
      { offset: -142, width: 235 },
      { offset: 132, width: 240 },
    ],
    offsetSplit: [
      { offset: -152, width: 210 },
      { offset: 82, width: 250 },
    ],
    threeStep: [
      { offset: -178, width: 170 },
      { offset: 4, width: 185 },
      { offset: 184, width: 175 },
    ],
  };
  return layouts[pattern] || layouts.starter;
}

function snapLevelX(value) {
  return Math.round((Number(value) || 0) / LEVEL_GRID_SIZE) * LEVEL_GRID_SIZE;
}

function levelObjectMetrics(obj, baseX, baseY, s) {
  const xOffset = obj.snap === false ? Number(obj.x || 0) : snapLevelX(obj.x);
  return {
    x: baseX + xOffset * s,
    y: baseY + (Number(obj.y) || 0) * s,
    w: (Number(obj.width) || 44) * s,
    h: (Number(obj.height) || 44) * s,
  };
}

function addStaticPlatformFromLayout(obj, baseX, baseY, s, palette) {
  const { x, y, w, h } = levelObjectMetrics(obj, baseX, baseY, s);
  const platformAsset = platformAssetForLevel(state.levelIndex, platforms.length, obj.asset);
  const shelf = Bodies.rectangle(x, y, w, h, {
    isStatic: true,
    label: "static",
    friction: 0.96,
  });
  shelf.plugin = { id: obj.id, kind: "static", asset: platformAsset, layoutType: obj.type };
  platforms.push({ id: obj.id, x, y, w, h, palette, asset: platformAsset, style: obj.style || "" });
  World.add(world, shelf);
  return shelf;
}

function addStructuredLevelObject(obj, baseX, baseY, s, palette) {
  const { x, y, w, h } = levelObjectMetrics(obj, baseX, baseY, s);
  let body = null;

  if (obj.type === "platform" || obj.type === "staticGround") {
    return addStaticPlatformFromLayout(obj, baseX, baseY, s, palette);
  }

  if (obj.type === "target") {
    body = addTarget("enemy", x, y, w, h, obj.points || 500);
    if (body) {
      body.plugin.required = true;
      body.plugin.health = obj.health ?? 0.95;
    }
  } else if (obj.type === "bonusObject") {
    body = addTarget("star", x, y, w, h, obj.points || 250);
    if (body) {
      body.plugin.required = false;
      body.plugin.bonus = true;
      body.plugin.health = obj.health ?? 0.6;
    }
  } else if (obj.type === "crate") {
    body = addTarget("box", x, y, w, h, obj.points || 220);
    if (body) {
      body.plugin.required = false;
      body.plugin.bonus = Boolean(obj.bonus);
      body.plugin.health = obj.health ?? 1.1;
    }
  } else {
    const blockKind = {
      woodBlockSmall: "woodH",
      woodBlockMedium: "woodH",
      woodBlockLarge: "woodH",
      horizontalBeam: "woodH",
      verticalPost: "woodV",
      hazardObject: "metal",
    }[obj.type] || "woodH";
    body = addBlock(blockKind, x, y, w, h, obj.rotation || 0);
    if (body && Number.isFinite(obj.health)) body.plugin.health = obj.health;
  }

  if (body?.plugin) {
    body.plugin.id = obj.id;
    body.plugin.layoutType = obj.type;
    body.plugin.required = Boolean(obj.required || obj.type === "target");
    body.plugin.bonus = Boolean(obj.bonus || obj.type === "bonusObject");
  }
  return body;
}

function validateStructuredLevel(level, baseX, baseY, s) {
  if (!LEVEL_VALIDATION_ENABLED || !level?.objects) return;
  const warnings = [];
  const ids = new Set();
  const requiredIds = new Set(level.requiredTargetIds || []);
  const objectIds = new Set();

  if (!level.id) warnings.push("missing level id");
  if (!level.shots || level.shots <= 0) warnings.push("shots must be greater than zero");
  if (!requiredIds.size) warnings.push("missing requiredTargetIds");

  const bounds = level.objects.map((obj) => {
    if (!obj.id) warnings.push(`${obj.type || "object"} is missing id`);
    if (obj.id && ids.has(obj.id)) warnings.push(`duplicate object id: ${obj.id}`);
    if (obj.id) {
      ids.add(obj.id);
      objectIds.add(obj.id);
    }
    if (obj.type === "target" && !obj.required) warnings.push(`${obj.id} should be explicitly required`);
    const metrics = levelObjectMetrics(obj, baseX, baseY, s);
    const box = {
      id: obj.id,
      type: obj.type,
      left: metrics.x - metrics.w / 2,
      right: metrics.x + metrics.w / 2,
      top: metrics.y - metrics.h / 2,
      bottom: metrics.y + metrics.h / 2,
      area: metrics.w * metrics.h,
    };
    if (obj.required && (box.left < 40 || box.right > worldW - 30 || box.top < 78 || box.bottom > groundY + 20)) {
      warnings.push(`${obj.id} is outside the safe required-target play area`);
    }
    return box;
  });

  for (const id of requiredIds) {
    if (!objectIds.has(id)) warnings.push(`required target id missing from objects: ${id}`);
  }

  for (let i = 0; i < bounds.length; i += 1) {
    for (let j = i + 1; j < bounds.length; j += 1) {
      const a = bounds[i];
      const b = bounds[j];
      const overlapW = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
      const overlapH = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      const overlapArea = overlapW * overlapH;
      const overlapRatio = overlapArea / Math.max(1, Math.min(a.area, b.area));
      if (overlapRatio > 0.18) warnings.push(`${a.id} overlaps ${b.id}`);
    }
  }

  if (warnings.length) console.warn(`Print Yard Sling level ${level.id} validation`, warnings);
}

function buildStructuredLevel(level, baseX, baseY, s) {
  const palette = platformPalette(state.levelIndex);
  validateStructuredLevel(level, baseX, baseY, s);
  for (const obj of level.objects || []) {
    addStructuredLevelObject(obj, baseX, baseY, s, palette);
  }
}

function buildTower() {
  const level = levels[state.levelIndex];
  const fittedPhone = isPhoneLandscapeViewport();
  const baseX = fittedPhone ? cssW * 0.72 : worldW - cssW * (cssW < 560 ? 0.37 : 0.41);
  const s = slingshotMobileScale();
  const platformDrop = PLATFORM_VERTICAL_OFFSET * s;
  const baseY = groundY - 28 * s + platformDrop;
  const beamW = 132 * s;
  const beamH = 20 * s;
  const postW = 24 * s;
  const postH = 86 * s;
  const gap = 48 * s;
  if (level.objects?.length) {
    buildStructuredLevel(level, baseX, baseY, s);
    return;
  }
  const platformSpecs = level.platforms || platformSpecsForLevel(level);
  const palette = platformPalette(state.levelIndex);
  for (const p of platformSpecs) {
    const offset = p.offset ?? 18;
    const elevation = p.elevation ?? 0;
    const px = baseX + offset * s;
    const pw = (p.width ?? 360) * s;
    const py = baseY + 16 * s - elevation * s;
    const platformAsset = platformAssetForLevel(state.levelIndex, platforms.length, p.asset);
    const shelf = Bodies.rectangle(px, py, pw, 32 * s, {
      isStatic: true,
      label: "static",
    });
    shelf.plugin = { kind: "static", asset: platformAsset };
    platforms.push({ x: px, y: py, w: pw, h: 32 * s, palette, asset: platformAsset, style: p.style || "" });
    World.add(world, shelf);
  }

  function deck(index = 0) {
    return platforms[Math.min(index, Math.max(0, platforms.length - 1))] || { x: baseX, y: baseY + 16 * s, w: 360 * s, h: 32 * s };
  }

  function deckX(index = 0, offset = 0) {
    return deck(index).x + offset * s;
  }

  function deckFloorY(index = 0, lift = 0) {
    return platformTop(deck(index)) - beamH / 2 - lift * s;
  }

  function hut(x, floorW = beamW, material = "woodH", enemyOffset = 0, floorYOverride = null) {
    const floorY = floorYOverride ?? baseY - beamH / 2;
    const postY = floorY - beamH / 2 - postH / 2;
    const roofY = postY - postH / 2 - beamH / 2;
    const enemySize = 47 * s;
    addBlock(material, x, floorY, floorW, beamH);
    addBlock("woodV", x - gap, postY, postW, postH);
    addBlock("woodV", x + gap, postY, postW, postH);
    addBlock(material, x, roofY, floorW * 0.92, beamH);
    addTarget("enemy", x + enemyOffset, floorY - beamH / 2 - enemySize * 0.42, enemySize, enemySize, 650);
  }

  function capRoof(x, y, width = beamW * 0.72) {
    addBlock("woodH", x - width * 0.28, y, width, beamH, -0.62);
    addBlock("woodH", x + width * 0.28, y, width, beamH, 0.62);
  }

  function addSupplyProps() {
    const idx = state.levelIndex;
    let cycles;
    if (idx <= 4) {
      // L1-5: simple boxes and occasional enemy2 (projectile-style props stay out of levels)
      cycles = [
        ["box"],
        ["badPrint"],
        ["enemy2", "box"],
      ];
    } else if (idx <= 9) {
      // L6-10: signage, print stacks, and cardboard boxes
      cycles = [
        ["sign", "box"],
        ["enemy2", "box"],
        ["badPrint", "box", "sign"],
      ];
    } else if (idx <= 14) {
      // L11-15: introduce glue
      cycles = [
        ["printer", "glue"],
        ["badPrint", "enemy2", "glue"],
        ["glue", "sign", "box"],
      ];
    } else if (idx <= 19) {
      // L16-20: introduce enemy3 + heatPress
      cycles = [
        ["heatPress", "badPrint"],
        ["enemy2", "enemy3", "printer"],
        ["heatPress", "sign", "enemy3"],
      ];
    } else if (idx <= 24) {
      // L21-25: introduce bombObject
      cycles = [
        ["bombObject", "badPrint", "glue"],
        ["enemy3", "bombObject", "sign"],
        ["bombObject", "enemy2", "glue"],
      ];
    } else {
      // L26-30: full mix
      cycles = [
        ["heatPress", "bombObject", "glue"],
        ["enemy3", "heatPress", "bombObject"],
        ["bombObject", "glue", "printer", "enemy3"],
      ];
    }
    const sizes = {
      ink: [42, 42],
      roll: [48, 34],
      parcel: [44, 44],
      paint: [42, 42],
      star: [36, 36],
      badPrint: [48, 54],
      box: [40, 40],
    };
    const props = cycles[idx % cycles.length];
    props.forEach((kind, index) => {
      const [w, h] = LEVEL_OBJECT_PREFABS[kind]?.size || sizes[kind] || [42, 42];
      const deck = platforms[index % Math.max(1, platforms.length)];
      const deckIndex = platforms.length ? index % platforms.length : 0;
      const slotIndex = platforms.length ? Math.floor(index / platforms.length) : index;
      const slotCount = platforms.length
        ? Math.ceil((props.length - deckIndex) / platforms.length)
        : props.length;
      const spacing = Math.min(58 * s, (deck?.w || 240 * s) / Math.max(2.4, slotCount + 1));
      const px = deck?.x ?? baseX;
      const top = deck ? platformTop(deck) : baseY;
      const rawX = px + (slotIndex - (slotCount - 1) / 2) * spacing;
      const halfW = (w * s) / 2;
      const leftLimit = deck ? deck.x - deck.w / 2 + halfW + 6 * s : baseX - 120 * s;
      const rightLimit = deck ? deck.x + deck.w / 2 - halfW - 6 * s : baseX + 120 * s;
      const x = clamp(rawX, leftLimit, rightLimit);
      const y = top - (h * s) / 2 - 2 * s;
      const points = kind === "star" ? 700 : kind === "badPrint" ? 360 : 260;
      if (LEVEL_OBJECT_PREFABS[kind]) {
        addLevelObject(kind, x, y, s);
      } else {
        addTarget(kind, x, y, w * s, h * s, points);
      }
    });
  }

  function blockAt(deckIndex, xOffset, yOffset, w, h, kind = "woodH", angle = 0) {
    addBlock(kind, deckX(deckIndex, xOffset), deckFloorY(deckIndex) - yOffset * s, w * s, h * s, angle);
  }

  function beam(deckIndex, xOffset, yOffset, w = 126, kind = "woodH", angle = 0) {
    blockAt(deckIndex, xOffset, yOffset, w, 20, kind, angle);
  }

  function post(deckIndex, xOffset, yOffset, h = 78, kind = "woodV", angle = 0) {
    blockAt(deckIndex, xOffset, yOffset, 22, h, kind, angle);
  }

  function targetAt(kind, deckIndex, xOffset, yOffset, w = 44, h = 44, points = 420, angle = 0) {
    addTarget(kind, deckX(deckIndex, xOffset), deckFloorY(deckIndex) - yOffset * s, w * s, h * s, points);
    const body = targets[targets.length - 1];
    if (body && angle) Body.setAngle(body, angle);
  }

  function enemyAt(deckIndex, xOffset, yOffset, type = "enemy", size = 43, points = 720) {
    if (type === "enemy") {
      targetAt("enemy", deckIndex, xOffset, yOffset, size, size, points);
    } else {
      addLevelObject(type, deckX(deckIndex, xOffset), deckFloorY(deckIndex) - yOffset * s, s);
    }
  }

  function objectAt(kind, deckIndex, xOffset, yOffset, scale = 1, angle = 0) {
    addLevelObject(kind, deckX(deckIndex, xOffset), deckFloorY(deckIndex) - yOffset * s, s * scale, angle);
  }

  function tntAt(deckIndex, xOffset, yOffset, size = 38) {
    addBomb(deckX(deckIndex, xOffset), deckFloorY(deckIndex) - yOffset * s, size * s);
  }

  function frame(deckIndex, xOffset, yOffset, width = 126, height = 78, material = "woodH") {
    beam(deckIndex, xOffset, yOffset, width, material);
    post(deckIndex, xOffset - width * 0.34, yOffset + 10 + height / 2, height);
    post(deckIndex, xOffset + width * 0.34, yOffset + 10 + height / 2, height);
    beam(deckIndex, xOffset, yOffset + height + 20, width * 0.9, material);
  }

  function sideStop(deckIndex, xOffset, height = 36) {
    post(deckIndex, xOffset, 10 + height / 2, height, "woodV");
  }

  function buildDesignedLevel() {
    switch (state.levelIndex) {
      case 0:
        frame(0, -58, 0, 118, 92);
        beam(0, -58, 122, 70);
        post(0, -58, 153, 42);
        enemyAt(0, -58, 151, "enemy", 42, 700);
        sideStop(0, -170, 40);
        sideStop(0, 54, 40);
        return true;

      case 1:
        beam(0, -58, 0, 178);
        post(0, -126, 48, 76);
        post(0, 10, 48, 76);
        beam(0, -58, 96, 164);
        enemyAt(0, -100, 28, "enemy", 42, 680);
        enemyAt(0, -16, 126, "enemy2");
        tntAt(0, 70, 30, 34);
        return true;

      case 2:
        frame(0, -94, 0, 96, 72, "glass");
        frame(0, 42, 0, 96, 72);
        enemyAt(0, -94, 28, "enemy2");
        enemyAt(0, 42, 104, "enemy", 40, 720);
        targetAt("box", 0, 118, 24, 40, 40, 320);
        return true;

      case 3:
        beam(0, -70, 0, 205);
        post(0, -140, 44, 68);
        post(0, -70, 44, 68);
        post(0, 0, 44, 68);
        beam(0, -105, 88, 126);
        beam(0, -35, 88, 126);
        post(0, -70, 132, 68, "glass");
        beam(0, -70, 176, 88);
        enemyAt(0, -70, 208, "enemy", 43, 780);
        enemyAt(0, -132, 118, "enemy2");
        return true;

      case 4:
        frame(0, -48, 0, 150, 86);
        beam(0, -48, 126, 116);
        enemyAt(0, -48, 28, "enemy", 41, 720);
        targetAt("box", 0, 18, 28, 40, 40, 300);
        tntAt(0, -130, 30, 34);
        return true;

      case 5:
        frame(0, -12, 0, 118, 92, "glass");
        frame(1, 6, 0, 116, 78);
        beam(0, 118, 118, 96);
        enemyAt(0, -12, 124, "enemy2");
        enemyAt(1, 6, 28, "enemy", 42, 730);
        targetAt("badPrint", 0, 86, 30, 50, 54, 360);
        return true;

      case 6:
        beam(0, 0, 0, 158);
        post(0, -55, 56, 92);
        post(0, 55, 56, 92);
        beam(0, 0, 112, 134);
        post(0, -38, 157, 70, "glass");
        post(0, 38, 157, 70, "glass");
        beam(0, 0, 202, 92);
        enemyAt(0, -42, 142, "enemy", 40, 780);
        enemyAt(0, 0, 234, "enemy2");
        return true;

      case 7:
        frame(0, -26, 0, 128, 82);
        post(1, -70, 45, 70, "woodV", -0.08);
        post(1, 70, 45, 70, "woodV", 0.08);
        beam(1, 0, 88, 174, "woodH");
        enemyAt(0, -26, 28, "enemy", 42, 730);
        enemyAt(1, 0, 120, "enemy2");
        tntAt(1, 0, 32, 36);
        return true;

      case 8:
        frame(0, -30, 0, 112, 82, "glass");
        frame(1, 18, 0, 126, 96);
        beam(0, 88, 128, 96);
        enemyAt(0, -30, 114, "enemy2");
        enemyAt(1, 18, 128, "enemy", 44, 820);
        targetAt("badPrint", 1, -70, 30, 50, 54, 360);
        objectAt("glue", 0, 58, 8);
        return true;

      case 9:
        frame(0, -42, 0, 128, 88, "metal");
        frame(1, 42, 0, 128, 88, "woodH");
        beam(0, 92, 132, 138, "glass");
        enemyAt(0, -42, 120, "enemy", 43, 820);
        enemyAt(1, 42, 28, "enemy2");
        tntAt(0, 92, 164, 36);
        targetAt("box", 1, -58, 24, 40, 40, 320);
        return true;

      case 10:
        beam(0, 0, 0, 188, "metal");
        post(0, -68, 55, 90, "glass");
        post(0, 68, 55, 90, "glass");
        beam(0, 0, 110, 170, "woodH");
        enemyAt(0, -48, 28, "enemy", 42, 780);
        enemyAt(0, 48, 140, "enemy2");
        targetAt("sign", 0, 110, 32, 54, 54, 360);
        objectAt("glue", 0, -116, 8);
        return true;

      case 11:
        frame(0, 0, 0, 118, 98);
        post(0, -34, 165, 74, "woodV");
        post(0, 34, 165, 74, "woodV");
        beam(0, 0, 212, 86, "glass");
        enemyAt(0, 0, 244, "enemy", 43, 900);
        enemyAt(0, -48, 130, "enemy2");
        tntAt(0, 60, 130, 34);
        return true;

      case 12:
        frame(0, 0, 0, 100, 70, "glass");
        frame(1, 0, 0, 118, 88);
        frame(2, 0, 0, 100, 70, "glass");
        beam(1, 0, 128, 162);
        enemyAt(0, 0, 102, "enemy", 40, 760);
        enemyAt(1, 0, 160, "enemy2");
        enemyAt(2, 0, 102, "enemy", 40, 760);
        return true;

      case 13:
        frame(0, -22, 0, 118, 92);
        beam(1, -16, 0, 172, "woodH");
        post(1, -80, 58, 96, "glass");
        post(1, 44, 58, 96, "glass");
        beam(1, -18, 116, 156, "woodH");
        enemyAt(0, -22, 124, "enemy", 42, 820);
        enemyAt(1, -18, 28, "enemy2");
        objectAt("glue", 1, 86, 8);
        return true;

      case 14:
        frame(0, 0, 0, 112, 82, "glass");
        frame(1, 0, 0, 112, 82, "glass");
        beam(0, 100, 126, 176, "woodH");
        post(0, 42, 170, 68);
        post(1, -42, 170, 68);
        beam(1, -100, 126, 176, "woodH");
        enemyAt(0, 0, 114, "enemy2");
        enemyAt(1, 0, 114, "enemy2");
        enemyAt(0, 100, 158, "enemy", 44, 900);
        tntAt(1, -100, 158, 36);
        return true;

      case 15:
        beam(0, -70, 0, 150);
        beam(0, 70, 0, 150);
        post(0, -118, 54, 88);
        post(0, -22, 54, 88);
        post(0, 22, 54, 88);
        post(0, 118, 54, 88);
        beam(0, -70, 108, 126, "woodH", -0.06);
        beam(0, 70, 108, 126, "woodH", 0.06);
        beam(0, 0, 172, 112, "glass");
        enemyAt(0, -70, 140, "enemy2");
        enemyAt(0, 70, 140, "enemy", 42, 840);
        enemyAt(0, 0, 204, "enemy3");
        return true;

      case 16:
        beam(0, 0, 0, 210);
        post(0, -86, 48, 76, "glass");
        post(0, -28, 48, 76, "glass");
        post(0, 28, 48, 76, "glass");
        post(0, 86, 48, 76, "glass");
        beam(0, -58, 96, 130);
        beam(0, 58, 96, 130);
        post(0, -34, 140, 68);
        post(0, 34, 140, 68);
        beam(0, 0, 184, 92);
        enemyAt(0, -76, 126, "enemy", 42, 820);
        enemyAt(0, 76, 126, "enemy2");
        enemyAt(0, 0, 216, "enemy", 43, 950);
        targetAt("box", 0, 128, 30, 40, 40, 320);
        return true;

      case 17:
        beam(0, 0, 0, 192, "metal");
        post(0, -78, 62, 104, "metal");
        post(0, 78, 62, 104, "metal");
        beam(0, 0, 124, 178, "metal");
        post(0, -36, 174, 78, "glass");
        post(0, 36, 174, 78, "glass");
        beam(0, 0, 224, 92);
        enemyAt(0, -44, 32, "enemy3");
        enemyAt(0, 44, 156, "enemy", 42, 880);
        tntAt(0, 0, 258, 38);
        return true;

      case 18:
        frame(0, -38, 0, 116, 96, "metal");
        frame(1, 38, 0, 116, 96, "woodH");
        beam(0, 96, 136, 138, "metal");
        beam(1, -96, 136, 138, "glass");
        enemyAt(0, -38, 128, "enemy3");
        enemyAt(1, 38, 128, "enemy2");
        enemyAt(1, -96, 168, "enemy", 42, 930);
        objectAt("heatPress", 0, 92, 168);
        return true;

      case 19:
        frame(0, 0, 0, 124, 94, "woodH");
        frame(1, 0, 0, 124, 94, "woodH");
        frame(2, 0, 0, 124, 94, "metal");
        beam(1, 0, 140, 206, "glass");
        post(1, -42, 188, 72);
        post(1, 42, 188, 72);
        beam(1, 0, 234, 92, "woodH");
        enemyAt(0, 0, 126, "enemy2");
        enemyAt(1, 0, 266, "enemy3");
        enemyAt(2, 0, 126, "enemy", 44, 980);
        return true;

      case 20:
        frame(0, 0, 0, 150, 92);
        targetAt("box", 0, -100, 30, 42, 42, 320);
        targetAt("box", 0, -52, 72, 42, 42, 320);
        targetAt("box", 0, -4, 114, 42, 42, 320);
        beam(0, 76, 134, 118, "glass");
        enemyAt(0, 0, 30, "enemy3");
        enemyAt(0, -116, 112, "enemy2");
        enemyAt(0, 76, 166, "enemy", 42, 930);
        tntAt(0, 132, 30, 38);
        return true;

      case 21:
        frame(0, -18, 0, 120, 94, "metal");
        beam(1, 0, 0, 190);
        post(1, -74, 56, 92);
        post(1, 74, 56, 92);
        beam(1, 0, 112, 172, "woodH");
        targetAt("sign", 0, -18, 128, 58, 58, 380);
        enemyAt(0, -18, 176, "enemy", 42, 940);
        enemyAt(1, -54, 32, "enemy2");
        enemyAt(1, 54, 144, "enemy3");
        tntAt(0, 74, 30, 38);
        return true;

      case 22:
        beam(0, 0, 0, 170, "metal");
        targetAt("printer", 0, 0, 34, 78, 50, 380);
        objectAt("heatPress", 0, -66, 88);
        targetAt("badPrint", 0, 66, 30, 50, 54, 360);
        post(0, -78, 122, 88, "metal");
        post(0, 78, 122, 88, "metal");
        beam(0, 0, 178, 156, "woodH");
        enemyAt(0, -44, 210, "enemy", 42, 940);
        enemyAt(0, 44, 210, "enemy3");
        return true;

      case 23:
        beam(0, 0, 0, 112);
        post(0, -36, 62, 104, "glass");
        post(0, 36, 62, 104, "glass");
        beam(0, 0, 124, 100);
        post(0, -28, 184, 100, "woodV", -0.08);
        post(0, 28, 184, 100, "woodV", 0.08);
        beam(0, 0, 246, 76, "metal");
        enemyAt(0, 0, 278, "enemy3");
        enemyAt(0, -54, 32, "enemy2");
        enemyAt(0, 54, 32, "enemy", 42, 980);
        targetAt("badPrint", 0, -118, 30, 50, 54, 360);
        targetAt("badPrint", 0, 118, 30, 50, 54, 360);
        return true;

      case 24:
        frame(0, -58, 0, 112, 90, "glass");
        frame(1, 58, 0, 112, 90, "metal");
        beam(0, 92, 136, 162, "woodH");
        beam(1, -92, 136, 162, "woodH");
        enemyAt(0, -58, 122, "enemy2");
        enemyAt(1, 58, 122, "enemy3");
        enemyAt(0, 92, 168, "enemy", 42, 980);
        objectAt("bombObject", 1, -92, 168);
        return true;

      case 25:
        frame(0, 0, 0, 134, 92, "glass");
        targetAt("badPrint", 0, -92, 30, 54, 58, 380);
        targetAt("badPrint", 0, 92, 30, 54, 58, 380);
        tntAt(0, -126, 92, 38);
        tntAt(0, 126, 92, 38);
        beam(0, 0, 136, 172, "woodH");
        objectAt("bombObject", 0, 0, 168);
        enemyAt(0, 0, 28, "enemy", 42, 960);
        enemyAt(0, -46, 168, "enemy2");
        enemyAt(0, 46, 168, "enemy3");
        return true;

      case 26:
        beam(0, 0, 0, 210, "glass");
        post(0, -88, 48, 76, "glass");
        post(0, -30, 48, 76, "glass");
        post(0, 30, 48, 76, "glass");
        post(0, 88, 48, 76, "glass");
        beam(0, 0, 96, 190, "glass");
        post(0, -58, 142, 72, "woodV");
        post(0, 58, 142, 72, "woodV");
        beam(0, 0, 188, 132, "metal");
        enemyAt(0, -78, 126, "enemy2");
        enemyAt(0, 78, 126, "enemy", 42, 930);
        enemyAt(0, 0, 220, "enemy3");
        targetAt("printer", 0, 126, 34, 70, 46, 380);
        return true;

      case 27:
        frame(0, 0, 0, 126, 96, "metal");
        post(0, -104, 62, 104, "metal");
        post(0, 104, 62, 104, "metal");
        beam(0, 0, 124, 230, "metal");
        frame(0, 0, 152, 112, 80, "glass");
        enemyAt(0, -52, 32, "enemy3");
        enemyAt(0, 0, 122, "enemy2");
        enemyAt(0, 52, 184, "enemy", 42, 960);
        objectAt("heatPress", 0, 0, 264);
        tntAt(0, -120, 160, 38);
        return true;

      case 28:
        frame(0, 0, 0, 118, 96, "woodH");
        post(0, -76, 154, 96, "glass");
        post(0, 76, 154, 96, "glass");
        beam(0, 0, 212, 178, "woodH");
        post(0, -42, 268, 92, "woodV", -0.1);
        post(0, 42, 268, 92, "woodV", 0.1);
        beam(0, 0, 326, 100, "metal");
        enemyAt(0, -46, 128, "enemy2");
        enemyAt(0, 46, 244, "enemy", 42, 980);
        enemyAt(0, 0, 358, "enemy3");
        objectAt("bombObject", 0, 112, 30);
        return true;

      case 29:
        frame(0, 0, 0, 116, 88, "metal");
        frame(1, 0, 0, 116, 88, "glass");
        frame(2, 0, 0, 116, 88, "metal");
        beam(1, 0, 136, 300, "woodH");
        post(1, -108, 190, 88);
        post(1, 0, 190, 88, "glass");
        post(1, 108, 190, 88);
        beam(1, 0, 244, 232, "metal");
        enemyAt(0, 0, 120, "enemy2");
        enemyAt(1, -78, 276, "enemy3");
        enemyAt(1, 78, 276, "enemy3");
        enemyAt(2, 0, 120, "enemy", 46, 1200);
        objectAt("bombObject", 1, 0, 276);
        tntAt(1, 0, 34, 40);
        return true;

      default:
        return false;
    }
  }

  if (buildDesignedLevel()) return;

  const NO_SUPPLY_TOWERS = ["starter", "wide", "glass", "stack", "tunnel", "chain", "pyramid", "wall"];
  if (!NO_SUPPLY_TOWERS.includes(level.tower)) addSupplyProps();

  if (level.tower === "starter") {
    const starterX = baseX - 360 * s;
    const floorY = baseY - beamH / 2;
    const lowerPostH = 106 * s;
    const lowerPostY = floorY - beamH / 2 - lowerPostH / 2;
    const midBeamY = lowerPostY - lowerPostH / 2 - beamH / 2;
    const upperPostH = 112 * s;
    const upperPostY = midBeamY - beamH / 2 - upperPostH / 2;
    const topBeamY = upperPostY - upperPostH / 2 - beamH / 2;
    const lowerGap = 58 * s;
    const upperGap = 44 * s;
    const enemySize = 46 * s;
    const perchW = 34 * s;
    const perchH = 24 * s;
    const perchY = midBeamY - beamH / 2 - perchH / 2;

    addBlock("woodH", starterX, floorY, beamW * 1.38, beamH);
    addBlock("woodV", starterX - lowerGap, lowerPostY, postW * 0.92, lowerPostH);
    addBlock("woodV", starterX + lowerGap, lowerPostY, postW * 0.92, lowerPostH);
    addBlock("glass", starterX - 26 * s, lowerPostY + 8 * s, 18 * s, 72 * s);
    addBlock("glass", starterX + 26 * s, lowerPostY + 8 * s, 18 * s, 72 * s);
    addBlock("woodH", starterX, midBeamY, beamW * 1.34, beamH);

    addBlock("woodH", starterX, perchY, perchW, perchH);
    addTarget("enemy", starterX, perchY - perchH / 2 - enemySize * 0.42, enemySize, enemySize, 650);
    addBlock("woodV", starterX - upperGap, upperPostY, postW * 0.86, upperPostH);
    addBlock("woodV", starterX + upperGap, upperPostY, postW * 0.86, upperPostH);
    addBlock("woodH", starterX, topBeamY, beamW * 0.84, beamH);
    addBlock("woodV", starterX, topBeamY - beamH / 2 - 20 * s, postW * 0.62, 40 * s);

    addBlock("woodV", starterX - 132 * s, floorY - 11 * s, postW * 0.62, 42 * s);
    addBlock("woodV", starterX + 132 * s, floorY - 11 * s, postW * 0.62, 42 * s);
    addTarget("box", starterX + 96 * s, floorY - 28 * s, 40 * s, 40 * s, 320);
    return;
  }

  if (level.tower === "wide") {
    const towerX = deckX(0, -10);
    const floorY = deckFloorY(0);
    const enemySize = 42 * s;
    const postH2 = 74 * s;
    const postY = floorY - beamH / 2 - postH2 / 2;
    const topY = postY - postH2 / 2 - beamH / 2;

    addBlock("woodH", towerX - 108 * s, floorY, beamW * 0.78, beamH);
    addBlock("woodH", towerX, floorY, beamW * 0.78, beamH);
    addBlock("woodH", towerX + 108 * s, floorY, beamW * 0.78, beamH);

    addBlock("woodV", towerX - 108 * s, postY, postW * 0.82, postH2);
    addBlock("woodV", towerX, postY, postW * 0.82, postH2);
    addBlock("woodV", towerX + 108 * s, postY, postW * 0.82, postH2);

    addBlock("woodH", towerX - 54 * s, topY, beamW * 0.82, beamH);
    addBlock("woodH", towerX + 54 * s, topY, beamW * 0.82, beamH);
    addBlock("woodH", towerX + 6 * s, topY - 50 * s, beamW * 0.86, beamH);

    addTarget("enemy", towerX - 108 * s, floorY - beamH / 2 - enemySize * 0.42, enemySize, enemySize, 620);
    addLevelObject("enemy2", towerX, floorY - beamH / 2 - enemySize * 0.42, s);
    addTarget("enemy", towerX + 108 * s, floorY - beamH / 2 - enemySize * 0.42, enemySize, enemySize, 620);
    addTarget("box", towerX + 6 * s, topY - 82 * s, 40 * s, 40 * s, 320);
    return;
  }

  if (level.tower === "glass") {
    // L3 — all-glass, Enemy Blob 2 × 2, paint ball bonus, no bomb (L1-5 rule)
    const floorY = baseY - beamH / 2;
    const postH2 = 86 * s;
    const postY = floorY - beamH / 2 - postH2 / 2;
    const roofY = postY - postH2 / 2 - beamH / 2;

    // Glass floor with Enemy Blob 2 sitting on top
    addBlock("glass", baseX, floorY, beamW * 1.18, beamH);
    addLevelObject("enemy2", baseX - 14 * s, floorY - beamH / 2 - 20 * s, s);

    // Fragile glass posts (easy to shatter, clear shot path)
    addBlock("glass", baseX - gap, postY, postW * 0.9, postH2);
    addBlock("glass", baseX + gap, postY, postW * 0.9, postH2);

    // Glass roof with second Enemy Blob 2 perched on top
    addBlock("glass", baseX, roofY, beamW * 1.02, beamH);
    addLevelObject("enemy2", baseX + 10 * s, roofY - beamH / 2 - 20 * s, s);

    // Paint ball beside structure as bonus-hit reward
    addTarget("box", baseX + gap * 1.9, floorY - beamH / 2 - 22 * s, 40 * s, 40 * s, 320);
    return;
  }

  if (level.tower === "heavy") {
    hut(baseX - 38 * s, beamW * 1.02);
    hut(baseX + 94 * s, beamW * 0.95);
    addBlock("woodH", baseX + 28 * s, baseY - 126 * s, beamW * 1.7, beamH * 1.2);
    addBlock("woodV", baseX + 28 * s, baseY - 178 * s, postW, 78 * s);
    addBlock("woodH", baseX + 28 * s, baseY - 224 * s, beamW * 0.88, beamH);
    addTarget("enemy", baseX + 28 * s, baseY - 258 * s, 44 * s, 44 * s, 850);
    return;
  }

  if (level.tower === "split") {
    hut(baseX - 92 * s, beamW * 0.86, "woodH", -4 * s);
    hut(baseX + 92 * s, beamW * 0.86, "woodH", 4 * s);
    addBlock("woodH", baseX, baseY - 34 * s, beamW * 0.90, beamH);
    addTarget("enemy", baseX, baseY - 66 * s, 42 * s, 42 * s, 720);
    addBlock("woodV", baseX - 22 * s, baseY - 110 * s, postW, 60 * s);
    addBlock("woodV", baseX + 22 * s, baseY - 110 * s, postW, 60 * s);
    addBlock("woodH", baseX, baseY - 152 * s, beamW * 0.78, beamH);
    addTarget("enemy", baseX, baseY - 186 * s, 42 * s, 42 * s, 800);
    return;
  }

  if (level.tower === "bridge") {
    hut(baseX - 84 * s, beamW * 0.86, "woodH");
    hut(baseX + 84 * s, beamW * 0.86, "glass");
    addBlock("woodH", baseX, baseY - 126 * s, beamW * 1.85, beamH);
    addBlock("woodH", baseX, baseY - 158 * s, beamW * 1.55, beamH);
    addTarget("enemy", baseX, baseY - 190 * s, 44 * s, 44 * s, 760);
    return;
  }

  if (level.tower === "tower") {
    const enemySize = 42 * s;
    const lowerBeamY = baseY - beamH / 2;
    const midBeamY = baseY - 102 * s;
    const topBeamY = baseY - 178 * s;
    addBlock("woodH", baseX, lowerBeamY, beamW * 1.32, beamH);
    addTarget("enemy", baseX - 48 * s, lowerBeamY - beamH / 2 - enemySize * 0.42, enemySize, enemySize, 720);
    addTarget("badPrint", baseX + 52 * s, lowerBeamY - beamH / 2 - 24 * s, 50 * s, 54 * s, 360);
    addBlock("woodV", baseX - 58 * s, baseY - 56 * s, postW, 76 * s);
    addBlock("woodV", baseX + 58 * s, baseY - 56 * s, postW, 76 * s);
    addBlock("woodH", baseX, midBeamY, beamW * 1.12, beamH);
    addTarget("sign", baseX, midBeamY - beamH / 2 - 28 * s, 54 * s, 54 * s, 360);
    addBlock("woodV", baseX - 38 * s, midBeamY - 42 * s, postW * 0.88, 60 * s);
    addBlock("woodV", baseX + 38 * s, midBeamY - 42 * s, postW * 0.88, 60 * s);
    addBlock("woodH", baseX, topBeamY, beamW * 0.82, beamH);
    addTarget("enemy", baseX, topBeamY - beamH / 2 - enemySize * 0.42, enemySize, enemySize, 820);
    return;
  }

  if (level.tower === "fort") {
    const enemySize = 42 * s;
    const leftX = baseX - 106 * s;
    const rightX = baseX + 106 * s;
    const deckY = baseY - beamH / 2;
    hut(leftX, beamW * 0.84, "woodH", -4 * s);
    hut(rightX, beamW * 0.84, "woodH", 4 * s);
    addBlock("woodV", baseX - 42 * s, baseY - 58 * s, postW * 0.9, 72 * s);
    addBlock("woodV", baseX + 42 * s, baseY - 58 * s, postW * 0.9, 72 * s);
    addBlock("woodH", baseX, baseY - 104 * s, beamW * 1.36, beamH);
    addTarget("sign", baseX, baseY - 138 * s, 54 * s, 54 * s, 360);
    addTarget("box", leftX - 56 * s, deckY - beamH / 2 - 20 * s, 40 * s, 40 * s, 320);
    addTarget("box", baseX, deckY - beamH / 2 - 20 * s, 40 * s, 40 * s, 320);
    addTarget("enemy", rightX + 50 * s, deckY - beamH / 2 - enemySize * 0.42, enemySize, enemySize, 760);
    return;
  }

  if (level.tower === "gauntlet") {
    hut(baseX - 114 * s, beamW * 0.72, "glass");
    hut(baseX, beamW * 0.82, "woodH");
    hut(baseX + 114 * s, beamW * 0.72, "woodH");
    addBlock("woodH", baseX, baseY - 148 * s, beamW * 2.45, beamH);
    addTarget("enemy", baseX, baseY - 184 * s, 42 * s, 42 * s, 840);
    addTarget("badPrint", baseX - 56 * s, baseY - 178 * s, 50 * s, 50 * s, 350);
    addTarget("badPrint", baseX + 56 * s, baseY - 178 * s, 50 * s, 50 * s, 350);
    return;
  }

  if (level.tower === "final") {
    hut(baseX - 112 * s, beamW * 0.78, "glass");
    hut(baseX, beamW * 0.88, "woodH");
    hut(baseX + 112 * s, beamW * 0.78, "glass");
    addBlock("woodH", baseX, baseY - 148 * s, beamW * 2.35, beamH * 1.15);
    addBlock("woodV", baseX, baseY - 204 * s, postW, 78 * s);
    addBlock("woodH", baseX, baseY - 254 * s, beamW * 0.95, beamH);
    addTarget("enemy", baseX, baseY - 288 * s, 44 * s, 44 * s, 1000);
    addTarget("printer", baseX - 56 * s, baseY - 178 * s, 70 * s, 46 * s, 380);
    addTarget("sign", baseX + 56 * s, baseY - 178 * s, 56 * s, 56 * s, 360);
    return;
  }

  if (level.tower === "vault") {
    hut(baseX - 80 * s, beamW * 0.86, "glass");
    hut(baseX + 80 * s, beamW * 0.86, "glass");
    addBlock("woodH", baseX, baseY - 86 * s, beamW * 1.75, beamH * 1.2);
    addBlock("glass", baseX, baseY - 38 * s, postW * 1.4, postH * 0.9);
    addTarget("enemy", baseX, baseY - 132 * s, 46 * s, 46 * s, 900);
    return;
  }

  if (level.tower === "spire") {
    hut(baseX, beamW * 0.78, "woodH");
    addBlock("woodV", baseX - gap * 0.65, baseY - 168 * s, postW, 78 * s);
    addBlock("woodV", baseX + gap * 0.65, baseY - 168 * s, postW, 78 * s);
    addBlock("woodH", baseX, baseY - 218 * s, beamW * 0.78, beamH);
    addTarget("enemy", baseX, baseY - 252 * s, 42 * s, 42 * s, 880);
    addBlock("woodV", baseX - gap * 0.5, baseY - 304 * s, postW, 70 * s);
    addBlock("woodV", baseX + gap * 0.5, baseY - 304 * s, postW, 70 * s);
    addBlock("glass", baseX, baseY - 348 * s, beamW * 0.62, beamH);
    addTarget("enemy", baseX, baseY - 380 * s, 44 * s, 44 * s, 1000);
    return;
  }

  if (level.tower === "dock") {
    hut(baseX - 130 * s, beamW * 0.74, "woodH", -4 * s);
    hut(baseX, beamW * 0.78, "woodH");
    hut(baseX + 130 * s, beamW * 0.74, "woodH", 4 * s);
    addBlock("woodH", baseX, baseY - 130 * s, beamW * 2.6, beamH);
    addTarget("enemy", baseX, baseY - 162 * s, 44 * s, 44 * s, 900);
    return;
  }

  if (level.tower === "tunnel") {
    const leftX = deckX(0, -10);
    const rightX = deckX(1, 12);
    const leftFloor = deckFloorY(0);
    const rightFloor = deckFloorY(1);
    hut(rightX, beamW * 0.82, "woodH", 0, rightFloor);
    addBlock("woodV", leftX - 38 * s, leftFloor - 52 * s, postW * 1.25, postH * 1.25);
    addBlock("glass", leftX - 38 * s, leftFloor - 124 * s, beamW * 0.68, beamH);
    addTarget("enemy", leftX - 38 * s, leftFloor - 34 * s, 42 * s, 42 * s, 850);
    addBlock("woodV", leftX + 30 * s, leftFloor - 142 * s, postW, postH * 0.72);
    addTarget("enemy", leftX + 30 * s, leftFloor - 188 * s, 42 * s, 42 * s, 950);
    addLevelObject("glue", rightX - 60 * s, rightFloor - 14 * s, s);
    addTarget("sign", leftX + 56 * s, leftFloor - 28 * s, 54 * s, 54 * s, 360);
    return;
  }

  if (level.tower === "chain") {
    const leftX = deckX(0, -8);
    const rightX = deckX(1, 8);
    const leftFloor = deckFloorY(0);
    const rightFloor = deckFloorY(1);
    hut(leftX, beamW * 0.74, "glass", -5 * s, leftFloor);
    hut(rightX, beamW * 0.74, "glass", 5 * s, rightFloor);
    addLevelObject("glue", leftX - 50 * s, leftFloor - 14 * s, s);
    addLevelObject("glue", rightX + 50 * s, rightFloor - 14 * s, s);
    addTarget("sign", leftX + 56 * s, leftFloor - 28 * s, 54 * s, 54 * s, 360);
    addTarget("box", rightX - 56 * s, rightFloor - 24 * s, 40 * s, 40 * s, 320);
    const midX = (leftX + rightX) / 2;
    const midY = Math.min(leftFloor, rightFloor) - 142 * s;
    addBlock("woodH", midX, midY, beamW * 0.92, beamH);
    addTarget("enemy", midX, midY - beamH / 2 - 22 * s, 44 * s, 44 * s, 950);
    return;
  }

  if (level.tower === "stack") {
    const enemySize = 43 * s;
    const stackX = deckX(0);
    const lowerBeamY = deckFloorY(0);
    const middleBeamY = lowerBeamY - 98 * s;
    const topBeamY = lowerBeamY - 188 * s;

    addBlock("woodH", stackX, lowerBeamY, beamW * 1.25, beamH);
    addLevelObject("enemy2", stackX - 42 * s, lowerBeamY - beamH / 2 - enemySize * 0.42, s);
    addLevelObject("enemy2", stackX + 42 * s, lowerBeamY - beamH / 2 - enemySize * 0.42, s);
    addTarget("badPrint", stackX, lowerBeamY - beamH / 2 - 24 * s, 50 * s, 54 * s, 360);

    addBlock("woodV", stackX - 58 * s, lowerBeamY - 51 * s, postW, 86 * s);
    addBlock("woodV", stackX + 58 * s, lowerBeamY - 51 * s, postW, 86 * s);
    addBlock("woodH", stackX, middleBeamY, beamW * 1.06, beamH);
    addLevelObject("heatPress", stackX + 3 * s, middleBeamY - beamH / 2 - 30 * s, s);

    addBlock("woodV", stackX - 40 * s, middleBeamY - 48 * s, postW * 0.9, 70 * s);
    addBlock("woodV", stackX + 40 * s, middleBeamY - 48 * s, postW * 0.9, 70 * s);
    addBlock("woodH", stackX, topBeamY, beamW * 0.84, beamH);
    addLevelObject("enemy3", stackX, topBeamY - beamH / 2 - enemySize * 0.5, s);
    return;
  }

  if (level.tower === "pyramid") {
    const px = deckX(0);
    const floorY = deckFloorY(0);
    addBlock("glass", px - 92 * s, floorY - 38 * s, 36 * s, 76 * s);
    addBlock("glass", px - 32 * s, floorY - 38 * s, 36 * s, 76 * s);
    addBlock("glass", px + 32 * s, floorY - 38 * s, 36 * s, 76 * s);
    addBlock("glass", px + 92 * s, floorY - 38 * s, 36 * s, 76 * s);
    addBlock("woodH", px, floorY - 82 * s, beamW * 1.56, beamH);
    addLevelObject("enemy3", px - 62 * s, floorY - 116 * s, s);
    addTarget("enemy", px + 62 * s, floorY - 116 * s, 40 * s, 40 * s, 700);
    addBlock("glass", px - 46 * s, floorY - 132 * s, 34 * s, 68 * s);
    addBlock("glass", px + 46 * s, floorY - 132 * s, 34 * s, 68 * s);
    addBlock("woodH", px, floorY - 176 * s, beamW * 0.94, beamH);
    addTarget("enemy", px, floorY - 210 * s, 44 * s, 44 * s, 950);
    addLevelObject("heatPress", px - 56 * s, floorY - 215 * s, s);
    return;
  }

  if (level.tower === "wall") {
    const wallX = deckX(0);
    const floorY = deckFloorY(0);
    addBlock("metal", wallX - 72 * s, floorY - 60 * s, postW * 1.3, postH * 1.45);
    addBlock("metal", wallX + 72 * s, floorY - 60 * s, postW * 1.3, postH * 1.45);
    addBlock("metal", wallX, floorY - 138 * s, beamW * 1.72, beamH * 1.3);
    addLevelObject("enemy3", wallX - 28 * s, floorY - 38 * s, s);
    addTarget("enemy", wallX - 50 * s, floorY - 180 * s, 44 * s, 44 * s, 950);
    addLevelObject("heatPress", wallX + 30 * s, floorY - 180 * s, s);
    return;
  }

  if (level.tower === "boss") {
    hut(baseX - 92 * s, beamW * 0.84, "metal");
    hut(baseX + 92 * s, beamW * 0.84, "metal");
    addBlock("metal", baseX, baseY - 134 * s, beamW * 2.05, beamH * 1.25);
    addBlock("woodV", baseX - 42 * s, baseY - 190 * s, postW, postH * 0.8);
    addBlock("woodV", baseX + 42 * s, baseY - 190 * s, postW, postH * 0.8);
    addBlock("metal", baseX, baseY - 232 * s, beamW * 0.85, beamH);
    addTarget("enemy", baseX, baseY - 268 * s, 50 * s, 50 * s, 1200);
    return;
  }

  if (level.tower === "lastRun") {
    hut(baseX - 132 * s, beamW * 0.74, "glass");
    hut(baseX, beamW * 0.84, "metal");
    hut(baseX + 132 * s, beamW * 0.74, "glass");
    addBlock("metal", baseX, baseY - 136 * s, beamW * 2.55, beamH * 1.2);
    addBlock("woodV", baseX - 52 * s, baseY - 194 * s, postW, postH * 0.85);
    addBlock("woodV", baseX + 52 * s, baseY - 194 * s, postW, postH * 0.85);
    addBlock("metal", baseX, baseY - 240 * s, beamW * 0.95, beamH * 1.1);
    addTarget("enemy", baseX, baseY - 276 * s, 50 * s, 50 * s, 1250);
    addTarget("enemy", baseX, baseY - 38 * s, 38 * s, 38 * s, 950);
    return;
  }

  if (level.tower === "boxMountain") {
    hut(baseX, beamW * 0.9, "woodH");
    addTarget("box", baseX - 120 * s, baseY - 22 * s, 44 * s, 44 * s, 320);
    addTarget("box", baseX - 120 * s, baseY - 70 * s, 44 * s, 44 * s, 320);
    addTarget("box", baseX - 70 * s, baseY - 70 * s, 44 * s, 44 * s, 320);
    addTarget("box", baseX + 110 * s, baseY - 22 * s, 44 * s, 44 * s, 320);
    addBlock("woodH", baseX, baseY - 134 * s, beamW * 1.0, beamH);
    addTarget("box", baseX - 30 * s, baseY - 162 * s, 40 * s, 40 * s, 320);
    addTarget("box", baseX + 30 * s, baseY - 162 * s, 40 * s, 40 * s, 320);
    addTarget("enemy", baseX, baseY - 200 * s, 44 * s, 44 * s, 950);
    addBomb(baseX + 130 * s, baseY - 70 * s, 38 * s);
    return;
  }

  if (level.tower === "signStorm") {
    hut(baseX + 70 * s, beamW * 0.86, "metal");
    addTarget("sign", baseX - 80 * s, baseY - 30 * s, 56 * s, 56 * s, 380);
    addTarget("sign", baseX - 80 * s, baseY - 88 * s, 56 * s, 56 * s, 380);
    addTarget("sign", baseX - 80 * s, baseY - 146 * s, 56 * s, 56 * s, 380);
    addBlock("woodV", baseX - 80 * s, baseY - 192 * s, postW, postH * 0.8);
    addBlock("woodH", baseX, baseY - 230 * s, beamW * 1.4, beamH);
    addTarget("enemy", baseX, baseY - 264 * s, 44 * s, 44 * s, 1000);
    addBomb(baseX + 130 * s, baseY - 38 * s, 38 * s);
    return;
  }

  if (level.tower === "pressStack") {
    addBlock("metal", baseX - 70 * s, baseY - 70 * s, 22 * s, 140 * s);
    addBlock("metal", baseX + 70 * s, baseY - 70 * s, 22 * s, 140 * s);
    addTarget("printer", baseX, baseY - 32 * s, 80 * s, 50 * s, 380);
    addTarget("printer", baseX, baseY - 88 * s, 80 * s, 50 * s, 380);
    addBlock("woodH", baseX, baseY - 152 * s, beamW * 0.85, beamH);
    addTarget("enemy", baseX - 32 * s, baseY - 188 * s, 42 * s, 42 * s, 880);
    addTarget("enemy", baseX + 32 * s, baseY - 188 * s, 42 * s, 42 * s, 880);
    addTarget("badPrint", baseX - 130 * s, baseY - 30 * s, 56 * s, 60 * s, 360);
    addBomb(baseX + 130 * s, baseY - 38 * s, 38 * s);
    return;
  }

  if (level.tower === "skyline") {
    addTarget("badPrint", baseX - 110 * s, baseY - 30 * s, 56 * s, 60 * s, 360);
    addTarget("badPrint", baseX + 110 * s, baseY - 30 * s, 56 * s, 60 * s, 360);
    addBlock("glass", baseX, baseY - 32 * s, 76 * s, 56 * s);
    addBlock("woodH", baseX, baseY - 86 * s, 76 * s, 50 * s);
    addBlock("glass", baseX, baseY - 138 * s, 76 * s, 56 * s);
    addBlock("woodH", baseX, baseY - 192 * s, 76 * s, 50 * s);
    addBlock("glass", baseX, baseY - 246 * s, 76 * s, 56 * s);
    addBlock("woodH", baseX, baseY - 296 * s, 80 * s, beamH);
    addTarget("enemy", baseX, baseY - 328 * s, 44 * s, 44 * s, 1100);
    return;
  }

  if (level.tower === "crossfire") {
    hut(baseX - 130 * s, beamW * 0.7, "woodH", -4 * s);
    hut(baseX + 130 * s, beamW * 0.7, "metal", 4 * s);
    addTarget("printer", baseX, baseY - 30 * s, 70 * s, 46 * s, 380);
    addBlock("woodV", baseX - 32 * s, baseY - 102 * s, postW, postH * 1.4);
    addBlock("woodV", baseX + 32 * s, baseY - 102 * s, postW, postH * 1.4);
    addBlock("woodH", baseX, baseY - 178 * s, beamW * 0.85, beamH);
    addTarget("sign", baseX, baseY - 218 * s, 56 * s, 56 * s, 360);
    addTarget("enemy", baseX, baseY - 258 * s, 44 * s, 44 * s, 1050);
    addBomb(baseX - 60 * s, baseY - 218 * s, 38 * s);
    addBomb(baseX + 60 * s, baseY - 218 * s, 38 * s);
    return;
  }

  if (level.tower === "demolition") {
    hut(baseX, beamW * 0.92, "glass");
    addTarget("badPrint", baseX - 100 * s, baseY - 30 * s, 56 * s, 60 * s, 360);
    addTarget("badPrint", baseX + 100 * s, baseY - 30 * s, 56 * s, 60 * s, 360);
    addBomb(baseX - 130 * s, baseY - 84 * s, 38 * s);
    addBomb(baseX + 130 * s, baseY - 84 * s, 38 * s);
    addBomb(baseX, baseY - 168 * s, 40 * s);
    addBomb(baseX - 50 * s, baseY - 210 * s, 36 * s);
    addBomb(baseX + 50 * s, baseY - 210 * s, 36 * s);
    addBlock("woodH", baseX, baseY - 250 * s, beamW * 0.9, beamH);
    addTarget("enemy", baseX, baseY - 284 * s, 46 * s, 46 * s, 1150);
    return;
  }

  if (level.tower === "glassMaze") {
    addBlock("glass", baseX - 90 * s, baseY - 50 * s, 22 * s, 100 * s);
    addBlock("glass", baseX + 90 * s, baseY - 50 * s, 22 * s, 100 * s);
    addBlock("glass", baseX, baseY - 100 * s, beamW * 1.6, beamH);
    addTarget("enemy", baseX - 45 * s, baseY - 50 * s, 42 * s, 42 * s, 850);
    addTarget("enemy", baseX + 45 * s, baseY - 50 * s, 42 * s, 42 * s, 850);
    addBlock("glass", baseX - 50 * s, baseY - 150 * s, 22 * s, 80 * s);
    addBlock("glass", baseX + 50 * s, baseY - 150 * s, 22 * s, 80 * s);
    addBlock("glass", baseX, baseY - 200 * s, 110 * s, beamH);
    addTarget("printer", baseX, baseY - 148 * s, 70 * s, 46 * s, 380);
    addTarget("enemy", baseX, baseY - 232 * s, 44 * s, 44 * s, 950);
    return;
  }

  if (level.tower === "ironBunker") {
    addBlock("metal", baseX - 90 * s, baseY - 50 * s, 24 * s, 100 * s);
    addBlock("metal", baseX + 90 * s, baseY - 50 * s, 24 * s, 100 * s);
    addBlock("metal", baseX, baseY - 100 * s, beamW * 1.6, beamH * 1.2);
    addTarget("sign", baseX, baseY - 50 * s, 50 * s, 56 * s, 360);
    addTarget("enemy", baseX - 50 * s, baseY - 50 * s, 40 * s, 40 * s, 950);
    addTarget("enemy", baseX + 50 * s, baseY - 50 * s, 40 * s, 40 * s, 950);
    addBlock("metal", baseX, baseY - 132 * s, beamW * 0.7, postH * 0.5);
    addBlock("woodH", baseX, baseY - 174 * s, beamW * 0.85, beamH);
    addTarget("enemy", baseX, baseY - 208 * s, 44 * s, 44 * s, 1100);
    addBomb(baseX - 110 * s, baseY - 38 * s, 40 * s);
    addBomb(baseX + 110 * s, baseY - 38 * s, 40 * s);
    return;
  }

  if (level.tower === "apex") {
    hut(baseX, beamW * 0.95, "woodH");
    addTarget("printer", baseX - 130 * s, baseY - 30 * s, 70 * s, 46 * s, 380);
    addTarget("printer", baseX + 130 * s, baseY - 30 * s, 70 * s, 46 * s, 380);
    addBlock("woodV", baseX - gap * 0.7, baseY - 150 * s, postW, postH * 0.9);
    addBlock("woodV", baseX + gap * 0.7, baseY - 150 * s, postW, postH * 0.9);
    addBlock("glass", baseX, baseY - 200 * s, beamW * 0.92, beamH);
    addTarget("enemy", baseX - 38 * s, baseY - 232 * s, 42 * s, 42 * s, 950);
    addTarget("enemy", baseX + 38 * s, baseY - 232 * s, 42 * s, 42 * s, 950);
    addBlock("woodV", baseX, baseY - 268 * s, postW, postH * 0.5);
    addTarget("enemy", baseX, baseY - 298 * s, 46 * s, 46 * s, 1300);
    return;
  }

  if (level.tower === "printShop") {
    hut(baseX - 130 * s, beamW * 0.7, "metal");
    hut(baseX + 130 * s, beamW * 0.7, "metal");
    addTarget("badPrint", baseX - 30 * s, baseY - 30 * s, 50 * s, 56 * s, 380);
    addTarget("badPrint", baseX + 30 * s, baseY - 30 * s, 50 * s, 56 * s, 380);
    addBlock("metal", baseX, baseY - 130 * s, beamW * 2.5, beamH * 1.2);
    addTarget("printer", baseX - 70 * s, baseY - 165 * s, 70 * s, 46 * s, 380);
    addTarget("printer", baseX + 70 * s, baseY - 165 * s, 70 * s, 46 * s, 380);
    addBlock("woodV", baseX - 90 * s, baseY - 200 * s, postW, postH * 0.7);
    addBlock("woodV", baseX + 90 * s, baseY - 200 * s, postW, postH * 0.7);
    addBlock("glass", baseX, baseY - 240 * s, beamW * 1.5, beamH);
    addTarget("sign", baseX, baseY - 232 * s, 50 * s, 56 * s, 380);
    addTarget("enemy", baseX - 70 * s, baseY - 270 * s, 42 * s, 42 * s, 1100);
    addTarget("enemy", baseX + 70 * s, baseY - 270 * s, 42 * s, 42 * s, 1100);
    addBlock("woodV", baseX, baseY - 296 * s, postW, postH * 0.4);
    addTarget("enemy", baseX, baseY - 322 * s, 48 * s, 48 * s, 1500);
    addBomb(baseX - 70 * s, baseY - 38 * s, 40 * s);
    addBomb(baseX + 70 * s, baseY - 38 * s, 40 * s);
    addBomb(baseX, baseY - 38 * s, 40 * s);
    return;
  }
}

function getProjectileTypeForSlot(slotFromNow) {
  if (slotFromNow <= 1) return FINAL_PROJECTILE_TYPE;
  const firedBeforeSlot = Math.max(0, levelShotTotal - slotFromNow);
  const idx = firedBeforeSlot % PROJECTILE_TYPE_SEQUENCE.length;
  return PROJECTILE_TYPE_SEQUENCE[idx];
}

function projectileMetrics(type) {
  const base = isPhoneLandscapeViewport()
    ? clamp(Math.min(cssW / 960, cssH / 540), 0.62, 0.76)
    : clamp(cssW / 960, 0.76, 1.16);
  const resolvedType = PROJECTILE_TYPES[type] ? type : (LEGACY_PROJECTILE_TYPE_MAP[type] || "standard");
  const config = PROJECTILE_TYPES[resolvedType];
  return {
    type: resolvedType,
    label: config.label,
    asset: config.asset,
    r: base * config.radius,
    w: base * config.width,
    h: base * config.height,
    density: config.density,
    restitution: config.restitution,
    frictionAir: config.frictionAir,
    description: config.description,
    power: config.power,
    impactBoost: config.impactBoost,
    damageScale: config.damageScale,
    effect: config.effect,
    effectRadius: config.effectRadius ? base * config.effectRadius : 0,
    effectDamage: config.effectDamage || 0,
    effectForce: config.effectForce || 0,
    triggerImpact: config.triggerImpact || 0,
    tint: config.tint,
    finalShot: Boolean(config.finalShot),
  };
}

function groundQueuePosition(index) {
  const scale = isPhoneLandscapeViewport()
    ? clamp(Math.min(cssW / 960, cssH / 540), 0.62, 0.76)
    : clamp(cssW / 960, 0.76, 1.16);
  const size = scale * 42;
  return {
    x: anchor.x - size * 2.65 - index * size * 0.82,
    y: groundY - size * 0.42,
  };
}

function spawnProjectile() {
  const projectileType = getProjectileTypeForSlot(state.shots);
  const metrics = projectileMetrics(projectileType);
  const r = metrics.r;
  currentProjectile = Bodies.circle(anchor.x, anchor.y, r, {
    frictionAir: metrics.frictionAir,
    restitution: metrics.restitution,
    density: metrics.density,
    label: "projectile",
    collisionFilter: { mask: 0 },
  });
  currentProjectile.sleepThreshold = Infinity;
  if (Sleeping) Sleeping.set(currentProjectile, false);
  currentProjectile.deltaTime = 1000 / 60;
  currentProjectile.plugin = {
    kind: "projectile",
    projectileType: metrics.type,
    projectileLabel: metrics.label,
    asset: metrics.asset,
    w: metrics.w,
    h: metrics.h,
    scored: true,
    power: metrics.power,
    impactBoost: metrics.impactBoost,
    damageScale: metrics.damageScale,
    effect: metrics.effect,
    effectUsed: false,
    effectRadius: metrics.effectRadius,
    effectDamage: metrics.effectDamage,
    effectForce: metrics.effectForce,
    triggerImpact: metrics.triggerImpact,
    finalShot: metrics.finalShot,
    tint: metrics.tint,
  };
  heldProjectilePosition = { ...anchor };
  projectileSpawnAnim = 0.32;
  World.add(world, currentProjectile);
}

function keepProjectileAwake(body) {
  if (!body) return;
  body.sleepThreshold = Infinity;
  if (Sleeping && body.isSleeping) Sleeping.set(body, false);
}

function startGame(options = {}) {
  if (!Matter) return;
  requestSlingshotFullscreen();
  ensureAudio();
  playSound("start");
  state.status = "running";
  if (options.restartFromFirstLevel) resetLevelCheckpoint();
  else if (Number.isInteger(options.levelIndex)) state.levelIndex = clamp(options.levelIndex, 0, levels.length - 1);
  else state.levelIndex = loadLevelCheckpoint();
  state.score = 0;
  state.finalScore = 0;
  state.submitted = false;
  state.paused = false;
  closeHomeModals();
  startOverlay.style.display = "none";
  gameSelectOverlay.classList.add("hidden");
  levelSelectOverlay.classList.add("hidden");
  gameOverOverlay.classList.add("hidden");
  levelGateOverlay.classList.add("hidden");
  pausePanel.classList.add("hidden");
  canvas.style.cursor = "grab";
  resetLevel(false);
}

function startNextLevel() {
  requestSlingshotFullscreen();
  ensureAudio();
  const nextLevelIndex = Math.min(levels.length - 1, state.levelIndex + 1);
  saveLevelCheckpoint(nextLevelIndex);
  state.levelIndex = nextLevelIndex;
  state.status = "running";
  state.paused = false;
  pausePanel.classList.add("hidden");
  levelGateOverlay.classList.add("hidden");
  resetLevel(true);
}

function restartCurrentLevel() {
  if (!Matter) return;
  requestSlingshotFullscreen();
  ensureAudio();
  playSound("start");
  state.status = "running";
  state.score = 0;
  state.finalScore = 0;
  state.submitted = false;
  state.paused = false;
  pausePanel.classList.add("hidden");
  startOverlay.style.display = "none";
  gameSelectOverlay.classList.add("hidden");
  gameOverOverlay.classList.add("hidden");
  levelGateOverlay.classList.add("hidden");
  canvas.style.cursor = "grab";
  resetLevel(false);
}

function restartFromFirstLevel() {
  pausePanel.classList.add("hidden");
  startGame({ restartFromFirstLevel: true });
}

function finishLevel() {
  if (state.wonLevel || !state.hasLaunched) return;
  playSound("level");
  state.levelCompleteQueued = false;
  state.wonLevel = true;
  cameraX = 0;
  cameraTargetX = 0;
  const completedLevel = levels[state.levelIndex];
  const remainingShots = Math.max(0, state.shots);
  const shotBonus = remainingShots * 350;
  const shotsUsed = Math.max(0, levelShotTotal - remainingShots);
  state.score += shotBonus;
  saveLevelCheckpoint(Math.min(levels.length - 1, state.levelIndex + 1));
  renderLevelSelect();
  updateHud();
  const isFinalLevel = state.levelIndex >= levels.length - 1;
  const nextLevel = levels[state.levelIndex + 1];
  state.status = "level";
  document.getElementById("gate-kicker").textContent = "Level Complete";
  document.getElementById("gate-heading").textContent = `${completedLevel.name} Cleared`;
  gateScoreValue.textContent = String(Math.floor(state.score));
  gateShotsUsed.textContent = `${shotsUsed} / ${levelShotTotal}`;
  gateBonus.textContent = `+${shotBonus}`;
  document.getElementById("gate-next-label").textContent = isFinalLevel ? "Run Complete" : "Next Up";
  document.getElementById("gate-next-name").textContent = isFinalLevel ? "Leaderboard" : nextLevel.name;
  document.getElementById("gate-next-instruction").textContent = isFinalLevel
    ? "All levels cleared. Submit your final score and lock in your run."
    : "The tower gets stronger. Use fewer shots for a bigger bonus.";
  const card = levelGateOverlay.querySelector(".overlay-card");
  if (card && assets.badge && !document.getElementById("gate-badge-image")) {
    const badge = document.createElement("img");
    badge.id = "gate-badge-image";
    badge.className = "gate-badge-image";
    badge.alt = "";
    badge.src = ASSET_ROOT + assetPaths.badge;
    card.insertBefore(badge, card.firstChild);
  }
  gateButton.dataset.action = isFinalLevel ? "submit" : "next";
  gateButton.textContent = isFinalLevel ? "Submit Score" : `Start Level ${state.levelIndex + 2}`;
  gateRetryButton.textContent = `Retry Level ${state.levelIndex + 1}`;
  levelGateOverlay.classList.remove("hidden");
}

function endGame(message = "You ran out of shots before clearing all targets. Try again and use your projectiles wisely.", options = {}) {
  window.PTIArcade?.trackEvent("game_over", { gameId: "printYardSling", completed: options.completed === true, rawScore: Math.floor(state.score) });
  playSound("over");
  state.status = "over";
  state.finalScore = Math.floor(state.score);
  saveBestScore(state.finalScore);
  updateHud();
  const completedRun = options.completed === true;
  const targetsLeft = Math.max(0, remainingTargets());
  const shotsUsed = Math.max(0, levelShotTotal - Math.max(0, state.shots));
  gameOverOverlay.classList.toggle("is-complete", completedRun);
  gameOverOverlay.classList.toggle("is-failed", !completedRun);
  runResultBadge.textContent = completedRun ? "★" : "!";
  runResultKicker.textContent = completedRun ? "Run Complete" : "Run Failed";
  runResultTitle.textContent = completedRun ? "Final Score Ready" : "Targets Still Standing";
  finalScoreHeading.textContent = String(state.finalScore);
  const prizePoints = window.PTIArcade
    ? window.PTIArcade.calculatePrizePoints(ACTIVE_GAME_TYPE, state.finalScore)
    : state.finalScore;
  const bests = window.PTIArcade ? window.PTIArcade.getPlayerBests() : null;
  const normalizedGameId = window.PTIArcade ? window.PTIArcade.normalizeGameId(ACTIVE_GAME_TYPE) : ACTIVE_GAME_TYPE;
  const bestGame = bests?.games?.[normalizedGameId] || null;
  if (resultPrizePoints) resultPrizePoints.textContent = prizePoints.toLocaleString();
  if (resultBestPrizePoints) resultBestPrizePoints.textContent = Math.max(prizePoints, Number(bestGame?.prizePoints || 0)).toLocaleString();
  if (resultRankMessage) {
    resultRankMessage.textContent = completedRun
      ? "Submit your Prize Points to lock in your monthly leaderboard run."
      : "Clear every target to submit this run to the monthly leaderboard.";
  }
  resultMessage.textContent = completedRun
    ? message
    : "You ran out of shots before clearing all targets. Try again and use your projectiles wisely.";
  failedTargetsLeft.textContent = String(targetsLeft);
  failedShotsUsed.textContent = `${shotsUsed} / ${levelShotTotal}`;
  failedBestScore.textContent = String(state.best);
  restartButton.textContent = "Play Again";
  failedRetryButton.textContent = `Retry Level ${state.levelIndex + 1}`;
  levelGateOverlay.classList.add("hidden");
  gameOverOverlay.classList.remove("hidden");
}

function isNewEnemy(body) {
  return Boolean(body?.plugin && NEW_ENEMY_RULES[body.plugin.prefab]);
}

function isHeavyCrusher(body) {
  if (!body || body.isStatic || body.label === "projectile") return false;
  return body.plugin?.prefab === "heatPress" || body.plugin?.prefab === "inkCanObject" || body.mass >= 7.5;
}

function defeatNewEnemy(body, color = "#ffd84d") {
  if (!isNewEnemy(body) || body.plugin.scored) return false;
  body.plugin.scored = true;
  awardScore(body.plugin.points || (body.plugin.prefab === "enemy3" ? 980 : 800), body.position.x, body.position.y, "TARGET");
  burst(body.position.x, body.position.y, color, body.plugin.prefab === "enemy3" ? 22 : 16);
  playSound("target");
  destroyBody(body);
  queueLevelComplete();
  return true;
}

function handleNewEnemyImpact(enemy, other, impact, projectileHit) {
  if (!isNewEnemy(enemy) || enemy.plugin.scored) return false;
  const rules = NEW_ENEMY_RULES[enemy.plugin.prefab];
  const heavyHit = isHeavyCrusher(other) && impact >= rules.crushImpact;
  const directHit = projectileHit && impact >= (rules.projectileImpact ?? rules.defeatImpact);
  const strongCrash = impact >= rules.defeatImpact + 1.1;
  if (directHit || heavyHit || strongCrash) {
    return defeatNewEnemy(enemy, enemy.plugin.prefab === "enemy3" ? "#ffb233" : "#ffd84d");
  }
  return false;
}

function applyGlueContact(pairBodies) {
  const glue = pairBodies.find((body) => body.plugin?.prefab === "glue");
  if (!glue) return false;
  const other = pairBodies.find((body) => body !== glue && !body.isStatic && body.plugin?.kind !== "static");
  if (!other) return false;
  const speed = Vector.magnitude(other.velocity);
  if (speed < 0.08) return false;
  Body.setVelocity(other, {
    x: other.velocity.x * 0.46,
    y: other.velocity.y * 0.46,
  });
  Body.setAngularVelocity(other, other.angularVelocity * 0.38);
  other.frictionAir = Math.max(other.frictionAir || 0, other.label === "projectile" ? 0.035 : 0.055);
  other.friction = Math.max(other.friction || 0, 0.9);
  other.frictionStatic = Math.max(other.frictionStatic || 0, 0.95);
  return true;
}

function explodeBasicBomb(body) {
  if (body?.plugin?.prefab !== "bombObject" || body.plugin.scored) return false;
  body.plugin.scored = true;
  const center = { ...body.position };
  const radius = clamp(cssW * 0.12, 92, 132);
  wakeNearbyBodies(center, radius, body, true);
  awardScore(340, center.x, center.y, "BOMB");
  burst(center.x, center.y, "#ff8a24", 26);
  playSound("burst", 1.15);
  screenShake = Math.max(screenShake, 0.28);
  destroyBody(body);

  for (const item of [...bodies]) {
    if (!item.plugin || item.plugin.scored || item.plugin.kind === "static") continue;
    const offset = Vector.sub(item.position, center);
    const distance = Vector.magnitude(offset);
    if (distance > radius || distance < 1) continue;
    const falloff = 1 - distance / radius;
    const direction = Vector.normalise(offset);
    wakePhysicsBody(item, true);
    Body.applyForce(item, item.position, {
      x: direction.x * 0.020 * falloff,
      y: direction.y * 0.012 * falloff - 0.010 * falloff,
    });

    if (isNewEnemy(item)) {
      const rules = NEW_ENEMY_RULES[item.plugin.prefab];
      if (item.plugin.prefab === "enemy2" && falloff >= rules.bombDefeatFalloff) {
        defeatNewEnemy(item, "#ffb233");
      } else if (item.plugin.prefab === "enemy3") {
        item.plugin.bombDamage = (item.plugin.bombDamage || 0) + falloff;
        if (falloff >= rules.bombDefeatFalloff || item.plugin.bombDamage >= 1.1) {
          defeatNewEnemy(item, "#ff8a24");
        }
      }
    }
  }
  queueLevelComplete();
  return true;
}

function isExplosiveBody(body) {
  return Boolean(body?.plugin && !body.plugin.scored && (body.plugin.kind === "bomb" || body.plugin.prefab === "bombObject"));
}

function triggerExplosiveBody(body) {
  if (!isExplosiveBody(body)) return false;
  if (body.plugin.prefab === "bombObject") return explodeBasicBomb(body);
  return explodeBomb(body);
}

function breakBlockFromEffect(body, color = "#8eeaff") {
  if (!body?.plugin || body.plugin.scored) return false;
  body.plugin.scored = true;
  awardScore(body.plugin.asset === "metal" ? 120 : body.plugin.asset === "glass" ? 160 : 100, body.position.x, body.position.y, "BREAK");
  burst(body.position.x, body.position.y, color, 10);
  playSound("break", 0.85);
  wakeNearbyBodies(body.position, clamp(cssW * 0.1, 86, 128), body, true);
  destroyBody(body);
  return true;
}

function applyAreaDamage(body, damage, falloff, color) {
  if (!body?.plugin || body.plugin.scored || body.plugin.kind === "static") return false;
  const amount = damage * falloff;
  if (amount <= 0) return false;

  if (isNewEnemy(body)) {
    const threshold = body.plugin.prefab === "enemy3" ? 1.15 : 0.62;
    body.plugin.areaDamage = (body.plugin.areaDamage || 0) + amount;
    if (body.plugin.areaDamage >= threshold || falloff > 0.82) {
      return defeatNewEnemy(body, color);
    }
    return false;
  }

  if (body.plugin.kind === "enemy") {
    if (falloff > 0.52) {
      scoreTarget(body);
      return true;
    }
    return false;
  }

  if (body.plugin.kind === "target") {
    body.plugin.health = (body.plugin.health || 2) - amount;
    if (body.plugin.health <= 0) {
      scoreTarget(body);
      return true;
    }
    return false;
  }

  if (body.plugin.kind === "block") {
    body.plugin.health -= amount;
    if (body.plugin.health <= 0) return breakBlockFromEffect(body, color);
  }

  return false;
}

function applyProjectileAreaEffect(projectileBody, hitBody, impact) {
  if (!projectileBody?.plugin || projectileBody.plugin.effectUsed || !hitBody) return false;
  const plugin = projectileBody.plugin;
  const effect = plugin.effect;
  const center = { ...projectileBody.position };
  const color = plugin.tint || "#ffd84d";

  if (effect === "trigger") {
    const nearbyExplosive = isExplosiveBody(hitBody)
      ? hitBody
      : [...bodies]
        .filter(isExplosiveBody)
        .find((item) => Vector.magnitude(Vector.sub(item.position, center)) <= (plugin.effectRadius || 80));
    if (nearbyExplosive && impact >= (plugin.triggerImpact || 1)) {
      plugin.effectUsed = true;
      burst(nearbyExplosive.position.x, nearbyExplosive.position.y, color, 18);
      return triggerExplosiveBody(nearbyExplosive);
    }
    return false;
  }

  if (effect === "splatter") {
    plugin.effectUsed = true;
    const radius = plugin.effectRadius || clamp(cssW * 0.1, 86, 120);
    burst(center.x, center.y, color, 28);
    for (const item of [...bodies]) {
      if (!item.plugin || item.plugin.scored || item.isStatic || item.label === "projectile") continue;
      const offset = Vector.sub(item.position, center);
      const distance = Vector.magnitude(offset);
      if (distance > radius) continue;
      const falloff = distance < 1 ? 1 : 1 - distance / radius;
      if (distance >= 1) {
        const direction = Vector.normalise(offset);
        wakePhysicsBody(item, true);
        Body.applyForce(item, item.position, {
          x: direction.x * (plugin.effectForce || 0.01) * falloff,
          y: -0.007 * falloff,
        });
      }
      applyAreaDamage(item, plugin.effectDamage || 0.8, falloff, color);
    }
    queueLevelComplete();
    return false;
  }

  if (effect === "push") {
    plugin.effectUsed = true;
    const radius = plugin.effectRadius || clamp(cssW * 0.11, 92, 135);
    burst(center.x, center.y, color, 24);
    for (const item of [...bodies]) {
      if (!item.plugin || item.plugin.scored || item.isStatic || item.label === "projectile") continue;
      const offset = Vector.sub(item.position, center);
      const distance = Vector.magnitude(offset);
      if (distance > radius || distance < 1) continue;
      const falloff = 1 - distance / radius;
      const direction = Vector.normalise(offset);
      wakePhysicsBody(item, true);
      Body.applyForce(item, item.position, {
        x: direction.x * (plugin.effectForce || 0.014) * falloff,
        y: -0.011 * falloff,
      });
    }
    return false;
  }

  if (effect === "heavy" && impact > 4.5) {
    plugin.effectUsed = true;
    burst(hitBody.position.x, hitBody.position.y, color, 12);
  }

  return false;
}

function handleNewObjectCollision(pairBodies, impact, projectileHit) {
  if (!state.hasLaunched && !projectileHit) return false;
  const basicBomb = pairBodies.find((body) => body.plugin?.prefab === "bombObject" && !body.plugin.scored);
  if (basicBomb && impact >= BASIC_BOMB_IMPACT) return explodeBasicBomb(basicBomb);

  let defeated = false;
  for (const enemy of pairBodies.filter(isNewEnemy)) {
    const other = pairBodies.find((body) => body !== enemy);
    defeated = handleNewEnemyImpact(enemy, other, impact, projectileHit) || defeated;
  }
  return defeated;
}

function handleCollisions(event) {
  if (state.status !== "running") return;
  if (layoutSettling) return;
  for (const pair of event.pairs) {
    const bodiesInPair = [pair.bodyA, pair.bodyB];
    const projectileHit = bodiesInPair.some((b) => b.label === "projectile");
    const projectileBody = bodiesInPair.find((b) => b.label === "projectile");
    const impactBoost = projectileBody?.plugin?.impactBoost || 1;
    const impact = Vector.magnitude(Vector.sub(pair.bodyA.velocity, pair.bodyB.velocity)) * impactBoost;
    const hitBody = bodiesInPair.find((b) => b.plugin && b.plugin.kind !== "projectile" && b.plugin.kind !== "static");
    if (projectileHit && hitBody) {
      wakeNearbyBodies(hitBody.position, clamp(cssW * 0.11, 92, 146), projectileBody);
      wakeBodiesRestingOnBounds(cloneBounds(hitBody.bounds), true);
      wakePhysicsBody(hitBody);
    }
    const wallHit = projectileHit && bodiesInPair.some((b) => b.label === "wall");
    if (wallHit && projectileBody) {
      projectileBody.plugin.expiredByBoundary = true;
      projectileBody.collisionFilter.mask = 0;
      Body.setVelocity(projectileBody, { x: 0, y: 0 });
      Body.setAngularVelocity(projectileBody, 0);
      shotLandedAge = shotLandedAge ?? launchAge;
      continue;
    }
    applyGlueContact(bodiesInPair);
    if (projectileHit && projectileBody && applyProjectileAreaEffect(projectileBody, hitBody, impact)) continue;
    if (handleNewObjectCollision(bodiesInPair, impact, projectileHit)) continue;

    const enemyHit = bodiesInPair.find((b) => b.plugin && b.plugin.kind === "enemy" && !b.plugin.scored);
    const groundHit = bodiesInPair.some((b) => b.label === "ground");
    if (enemyHit && isNewEnemy(enemyHit) && state.hasLaunched && groundHit) {
      defeatNewEnemy(enemyHit);
      continue;
    }
    if (enemyHit && !isNewEnemy(enemyHit) && state.hasLaunched && (projectileHit || groundHit)) {
      scoreTarget(enemyHit);
      burst(enemyHit.position.x, enemyHit.position.y, "#ffd84d", 18);
      continue;
    }

    const bombHit = bodiesInPair.find((b) => b.plugin && b.plugin.kind === "bomb" && !b.plugin.scored);
    if (bombHit && state.hasLaunched && (projectileHit || impact > 5.2)) {
      explodeBomb(bombHit);
      continue;
    }

    if (impact < 2.6) continue;

    if (hitBody) {
      addImpactScore(hitBody, impact, projectileHit, projectileBody);
      if (hitBody.plugin?.kind !== "levelObject") {
        burst(hitBody.position.x, hitBody.position.y, projectileHit ? "#ff4bd8" : "#5de6ff", projectileHit ? 14 : 7);
      }
      playSound("hit", impact / 5);
    }
  }
}

function addImpactScore(body, impact, projectileHit, projectileBody = null) {
  if (!state.hasLaunched && !projectileHit) return;
  const plugin = body.plugin || {};
  if (plugin.scored) return;
  const damageScale = projectileHit ? (projectileBody?.plugin?.damageScale || 1) : 1;
  if (isNewEnemy(body)) {
    handleNewEnemyImpact(body, null, impact, projectileHit);
    return;
  }
  if (plugin.prefab === "bombObject") {
    if (projectileBody?.plugin?.effect === "trigger" && impact >= (projectileBody.plugin.triggerImpact || 1)) {
      triggerExplosiveBody(body);
    } else if (impact >= BASIC_BOMB_IMPACT) {
      explodeBasicBomb(body);
    }
    return;
  }
  if (plugin.kind === "block") {
    state.score += projectileHit ? 18 : 6;
    plugin.health -= projectileHit ? ((impact > 6 ? 2.4 : 1.6) * damageScale) : (impact > 6 ? 1.4 : 0.8);
    if (plugin.health <= 0) {
      plugin.scored = true;
      awardScore(plugin.asset === "metal" ? 120 : plugin.asset === "glass" ? 160 : 100, body.position.x, body.position.y, "BREAK");
      burst(body.position.x, body.position.y, "#8eeaff", 12);
      playSound("break", impact / 7);
      wakeNearbyBodies(body.position, clamp(cssW * 0.1, 88, 132), body, true);
      destroyBody(body);
    }
  }
  if (plugin.kind === "levelObject") {
    state.score += projectileHit ? 14 : 5;
    plugin.health = (plugin.health ?? 1.5) - (projectileHit ? ((impact > 6 ? 1.6 : 1.1) * damageScale) : (impact > 6 ? 0.9 : 0.45));
    if (plugin.health <= 0 || (projectileHit && impact > 8.4)) {
      plugin.scored = true;
      awardScore(plugin.points ?? 300, body.position.x, body.position.y, "BREAK");
      burst(body.position.x, body.position.y, "#ffb342", 12);
      playSound("break", impact / 7);
      wakeNearbyBodies(body.position, clamp(cssW * 0.1, 88, 132), body, true);
      destroyBody(body);
    }
  }
  if (plugin.kind === "bomb") {
    if (projectileBody?.plugin?.effect === "trigger" && impact >= (projectileBody.plugin.triggerImpact || 1)) {
      triggerExplosiveBody(body);
      return;
    }
    plugin.health -= projectileHit ? 1.2 * damageScale : 0.7;
    if (plugin.health <= 0 || impact > 5.2) explodeBomb(body);
  }
  if (plugin.kind === "enemy" || plugin.kind === "target") {
    if (plugin.kind === "enemy" && projectileHit) {
      scoreTarget(body);
      return;
    }
    if (plugin.kind === "enemy") return;
    plugin.health = (plugin.health || 2) - (projectileHit ? 2.2 * damageScale : 1.0);
    if (plugin.health <= 0 || impact > 6.4) scoreTarget(body);
  }
}

function destroyBody(body) {
  const removedBounds = body?.bounds ? cloneBounds(body.bounds) : null;
  const removedCenter = body?.position ? { ...body.position } : (removedBounds ? boundsCenter(removedBounds) : null);
  World.remove(world, body);
  bodies = bodies.filter((item) => item !== body);
  targets = targets.filter((item) => item !== body);
  wakeBodiesRestingOnBounds(removedBounds, true);
  wakeNearbyBodies(removedCenter, clamp(cssW * 0.1, 88, 138), body, true);
}

function freezeWorldMotion() {
  for (const body of bodies) {
    if (!body || body.isStatic || body.label === "projectile") continue;
    Body.setVelocity(body, { x: 0, y: 0 });
    Body.setAngularVelocity(body, 0);
  }
}

function settleInitialLevelPhysics() {
  if (!engine) return;
  layoutSettling = true;
  for (let i = 0; i < 120; i += 1) {
    Engine.update(engine, 1000 / 60 * PHYSICS_TIME_SCALE);
  }
  layoutSettling = false;
  freezeWorldMotion();
  if (Sleeping) {
    for (const body of bodies) {
      if (!body || body.isStatic || body.label === "projectile") continue;
      Sleeping.set(body, true);
    }
  }
}

function scoreTarget(body) {
  if (!body.plugin || body.plugin.scored) return;
  body.plugin.scored = true;
  awardScore(body.plugin.points ?? (body.plugin.kind === "enemy" ? 300 : 500), body.position.x, body.position.y, body.plugin.kind === "enemy" ? "TARGET" : "");
  burst(body.position.x, body.position.y, "#ffd84d", 18);
  playSound("target");
  destroyBody(body);
  queueLevelComplete();
}

function explodeBomb(body) {
  if (!body.plugin || body.plugin.scored) return;
  body.plugin.scored = true;
  const center = { ...body.position };
  awardScore(260, center.x, center.y, "TNT");
  burst(center.x, center.y, "#ff8a24", 28);
  playSound("burst", 1.3);
  destroyBody(body);
  const radius = clamp(cssW * 0.11, 88, 128);
  for (const item of [...bodies]) {
    if (!item.plugin || item.plugin.scored) continue;
    const d = Vector.magnitude(Vector.sub(item.position, center));
    if (d > radius) continue;
    if (item.plugin.kind === "enemy") {
      if (isNewEnemy(item)) defeatNewEnemy(item, "#ff8a24");
      else scoreTarget(item);
      continue;
    }
    if (item.plugin.kind === "block") {
      item.plugin.health -= 2.4;
      wakePhysicsBody(item, true);
      Body.applyForce(item, item.position, {
        x: (item.position.x - center.x) * 0.00016,
        y: -0.018,
      });
      if (item.plugin.health <= 0) {
        item.plugin.scored = true;
        awardScore(item.plugin.asset === "metal" ? 120 : item.plugin.asset === "glass" ? 160 : 100, item.position.x, item.position.y, "BREAK");
        burst(item.position.x, item.position.y, "#8eeaff", 10);
        playSound("break", 1.1);
        destroyBody(item);
      }
    }
  }
  queueLevelComplete();
}

function activateShotAbility() {
  if (state.status !== "running" || state.paused || !launchedProjectile) return false;
  if (launchRealAge < BURST_AVAILABLE_DELAY || shotAbilityUsesThisShot >= BURST_MAX_USES_PER_SHOT) return false;
  shotAbilityUsesThisShot += 1;
  shotAbilityUsed = shotAbilityUsesThisShot >= BURST_MAX_USES_PER_SHOT;
  const center = { ...launchedProjectile.position };
  const radius = clamp(cssW * 0.095, 78, 112);
  burst(center.x, center.y, "#ffd84d", 32);
  playSound("burst");

  for (const item of [...bodies]) {
    if (!item.plugin || item.plugin.scored || item.plugin.kind === "static" || item.label === "projectile") continue;
    const dx = item.position.x - center.x;
    const dy = item.position.y - center.y;
    const distance = Math.hypot(dx, dy);
    if (distance > radius) continue;

    const falloff = 1 - distance / radius;
    wakePhysicsBody(item, true);
    Body.applyForce(item, item.position, {
      x: dx * BURST_FORCE * falloff,
      y: -BURST_LIFT_FORCE * falloff,
    });

    if ((item.plugin.kind === "bomb" || item.plugin.prefab === "bombObject") && distance < radius * 0.45) {
      if (item.plugin.prefab === "bombObject") {
        explodeBasicBomb(item);
        continue;
      }
      explodeBomb(item);
      continue;
    }

    if (item.plugin.kind === "enemy") {
      if (distance < radius * 0.38) {
        if (isNewEnemy(item)) defeatNewEnemy(item, "#ffb233");
        else scoreTarget(item);
      }
      continue;
    }

    if (item.plugin.kind === "block") {
      item.plugin.health -= 0.55 + falloff * 0.75;
      if (item.plugin.health <= 0) {
        item.plugin.scored = true;
        awardScore(item.plugin.asset === "metal" ? 120 : item.plugin.asset === "glass" ? 160 : 100, item.position.x, item.position.y, "BREAK");
        burst(item.position.x, item.position.y, "#8eeaff", 12);
        playSound("break", 0.9 + falloff);
        destroyBody(item);
      }
      continue;
    }

    if (item.plugin.kind === "target") {
      item.plugin.health = (item.plugin.health || 2) - (0.8 + falloff * 0.8);
      if (item.plugin.health <= 0) scoreTarget(item);
    }
  }

  updateHud();
  queueLevelComplete();
  return true;
}

function queueLevelComplete() {
  if (state.status !== "running" || state.wonLevel || state.levelCompleteQueued) return;
  if (!state.hasLaunched) return;
  if (remainingTargets() !== 0) return;
  state.levelCompleteQueued = true;
  setTimeout(() => {
    if (state.status === "running" && remainingTargets() === 0) finishLevel();
  }, 260);
}

function burst(x, y, color, count) {
  particles.push({
    x,
    y,
    vx: 0,
    vy: 0,
    life: 0.38,
    max: 0.38,
    color,
    sprite: "ring",
    size: 34,
  });
  if (assets.puff) {
    particles.push({
      x,
      y,
      vx: 0,
      vy: -20,
      life: 0.48,
      max: 0.48,
      color,
      sprite: "puff",
      size: 58,
    });
  }
  const debrisCount = Math.max(6, Math.round(count * 0.45));
  for (let i = 0; i < debrisCount; i += 1) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 190,
      vy: (Math.random() - 0.75) * 170,
      life: 0.38 + Math.random() * 0.28,
      max: 0.58,
      color,
      sprite: null,
      size: 5 + Math.random() * 5,
    });
  }
}

function screenPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const touch = event.touches && event.touches[0]
    ? event.touches[0]
    : event.changedTouches && event.changedTouches[0]
      ? event.changedTouches[0]
      : event;
  return {
    x: (touch.clientX - rect.left) * (cssW / rect.width) + cameraX,
    y: (touch.clientY - rect.top) * (cssH / rect.height),
  };
}

function rawScreenX(event) {
  const rect = canvas.getBoundingClientRect();
  const touch = event.touches && event.touches[0]
    ? event.touches[0]
    : event.changedTouches && event.changedTouches[0]
      ? event.changedTouches[0]
      : event;
  return (touch.clientX - rect.left) * (cssW / rect.width);
}

function isInLaunchZone(point) {
  const nearProjectile = currentProjectile
    ? Vector.magnitude(Vector.sub(point, currentProjectile.position)) < 96
    : false;
  const nearSling = Math.abs(point.x - anchor.x) < cssW * 0.23 && point.y > cssH * 0.45 && point.y < cssH * 0.96;
  return nearProjectile || nearSling;
}

function onPointerDown(event) {
  if (state.status !== "running" || state.paused) return;
  pointer = screenPoint(event);

  if (launchedProjectile && !currentProjectile && !dragging) {
    event.preventDefault();
    activateShotAbility();
    return;
  }

  if (currentProjectile && !launchedProjectile && isInLaunchZone(pointer)) {
    event.preventDefault();
    ensureAudio();
    const now = performance.now();
    if (now - lastPullSoundAt > 180) {
      playSound("pull");
      lastPullSoundAt = now;
    }
    dragging = true;
    dragStart = { ...pointer };
    canvas.setPointerCapture?.(event.pointerId);
    canvas.style.cursor = "grabbing";
    onPointerMove(event);
    return;
  }

  if (!launchedProjectile) {
    event.preventDefault();
    if (isPhoneLandscapeViewport() || worldW <= cssW + 8) {
      panning = false;
      cameraX = 0;
      cameraTargetX = 0;
      return;
    }
    panning = true;
    panStartPointerX = rawScreenX(event);
    panStartCameraX = cameraX;
    canvas.setPointerCapture?.(event.pointerId);
    canvas.style.cursor = "grabbing";
  }
}

function onPointerMove(event) {
  if (panning) {
    event.preventDefault();
    if (isPhoneLandscapeViewport() || worldW <= cssW + 8) {
      panning = false;
      cameraX = 0;
      cameraTargetX = 0;
      return;
    }
    const screenX = rawScreenX(event);
    const deltaX = screenX - panStartPointerX;
    cameraX = clamp(panStartCameraX - deltaX, 0, Math.max(0, worldW - cssW));
    cameraTargetX = cameraX;
    userPanned = true;
    return;
  }
  if (!dragging || !currentProjectile) return;
  event.preventDefault();
  pointer = screenPoint(event);
  const pull = Vector.sub(pointer, anchor);
  const isMobileCanvas = cssW <= 640 || isPhoneLandscapeViewport();
  const maxPull = isMobileCanvas ? clamp(cssH * 0.09, 66, 78) : clamp(cssW * 0.095, 58, 92);
  const length = Vector.magnitude(pull);
  const limited = length > maxPull ? Vector.mult(Vector.normalise(pull), maxPull) : pull;
  const x = anchor.x + limited.x;
  const y = anchor.y + limited.y;
  heldProjectilePosition = { x, y };
  keepProjectileAwake(currentProjectile);
  Body.setPosition(currentProjectile, heldProjectilePosition);
  Body.setVelocity(currentProjectile, { x: 0, y: 0 });
  Body.setAngularVelocity(currentProjectile, 0);
}

function cancelDrag(event) {
  if (panning) {
    event?.preventDefault?.();
    panning = false;
    canvas.style.cursor = "grab";
  }
  if (!dragging || !currentProjectile) return;
  event?.preventDefault?.();
  dragging = false;
  canvas.style.cursor = "grab";
  heldProjectilePosition = { ...anchor };
  keepProjectileAwake(currentProjectile);
  Body.setPosition(currentProjectile, heldProjectilePosition);
  Body.setVelocity(currentProjectile, { x: 0, y: 0 });
  Body.setAngularVelocity(currentProjectile, 0);
}

function launchVectorFromDrag() {
  const projectilePos = currentProjectile.position;
  const raw = {
    x: anchor.x - projectilePos.x,
    y: anchor.y - projectilePos.y,
  };

  let distance = Math.hypot(raw.x, raw.y);
  if (distance < 12) return null;

  let direction = { x: raw.x / distance, y: raw.y / distance };
  if (!Number.isFinite(direction.x) || !Number.isFinite(direction.y)) return null;

  const shotPower = currentProjectile?.plugin?.power || 1;
  const rawSpeed = clamp(distance * 0.255, 11, 23.5);
  const speed = Math.min(
    rawSpeed * levels[state.levelIndex].strength * shotPower * LAUNCH_POWER_MULTIPLIER,
    MAX_LAUNCH_FORCE
  );
  return { x: direction.x * speed, y: direction.y * speed };
}

function fireCurrentProjectile() {
  if (!dragging || !currentProjectile) return;
  dragging = false;
  canvas.style.cursor = "grab";
  const velocity = launchVectorFromDrag();
  lastLaunch = { pointer: { ...pointer }, anchor: { ...anchor }, velocity: velocity ? { ...velocity } : null };
  if (!velocity) {
    heldProjectilePosition = { ...anchor };
    keepProjectileAwake(currentProjectile);
    Body.setPosition(currentProjectile, anchor);
    Body.setVelocity(currentProjectile, { x: 0, y: 0 });
    Body.setAngularVelocity(currentProjectile, 0);
    return;
  }
  keepProjectileAwake(currentProjectile);
  currentProjectile.collisionFilter.mask = 0xFFFFFFFF;
  currentProjectile.deltaTime = 1000 / 60;
  Body.setPosition(currentProjectile, anchor);
  Body.setVelocity(currentProjectile, velocity);
  Body.setAngularVelocity(currentProjectile, velocity.x * 0.018);
  if (currentProjectile.plugin?.finalShot) {
    burst(anchor.x, anchor.y, "#ffd84d", 18);
    state.score += 40;
  }
  launchedProjectile = currentProjectile;
  currentProjectile = null;
  heldProjectilePosition = null;
  launchAge = 0;
  launchRealAge = 0;
  shotLandedAge = null;
  shotAbilityUsed = false;
  shotAbilityUsesThisShot = 0;
  nextProjectileDelay = 0;
  state.hasLaunched = true;
  state.shots -= 1;
  shotTrail = [];
  userPanned = false;
  playSound("launch", Math.hypot(velocity.x, velocity.y) / 18);
  updateHud();
}

function onPointerUp(event) {
  if (panning) {
    event.preventDefault();
    panning = false;
    canvas.releasePointerCapture?.(event.pointerId);
    canvas.style.cursor = "grab";
    return;
  }
  if (!dragging || !currentProjectile) return;
  event.preventDefault();
  canvas.releasePointerCapture?.(event.pointerId);
  fireCurrentProjectile();
}

function completeShot() {
  if (!launchedProjectile) return;
  World.remove(world, launchedProjectile);
  launchedProjectile = null;
  shotAbilityUsed = false;
  shotAbilityUsesThisShot = 0;
  launchRealAge = 0;
  cameraTargetX = 0;
  updateHud();
  if (remainingTargets() === 0) {
    setTimeout(finishLevel, 220);
  } else if (state.shots > 0) {
    nextProjectileDelay = 0.35;
  } else {
    state.settling = 2.4;
  }
}

function update(delta) {
  if (state.status !== "running" || state.paused || !engine) return;
  if (projectileSpawnAnim > 0) projectileSpawnAnim = Math.max(0, projectileSpawnAnim - delta);
  if (currentProjectile) {
    const hold = dragging && heldProjectilePosition ? heldProjectilePosition : anchor;
    keepProjectileAwake(currentProjectile);
    Body.setPosition(currentProjectile, hold);
    Body.setVelocity(currentProjectile, { x: 0, y: 0 });
    Body.setAngularVelocity(currentProjectile, 0);
  }
  Engine.update(engine, delta * 1000 * PHYSICS_TIME_SCALE);
  if (currentProjectile) {
    const hold = dragging && heldProjectilePosition ? heldProjectilePosition : anchor;
    keepProjectileAwake(currentProjectile);
    Body.setPosition(currentProjectile, hold);
    Body.setVelocity(currentProjectile, { x: 0, y: 0 });
    Body.setAngularVelocity(currentProjectile, 0);
  }
  wakeUnsupportedSleepingBodies();
  window.__ptiDebug = {
    dragging,
    current: currentProjectile ? { x: currentProjectile.position.x, y: currentProjectile.position.y } : null,
    currentAsset: currentProjectile?.plugin?.asset || null,
    currentProjectileType: currentProjectile?.plugin?.projectileType || null,
    launched: launchedProjectile ? {
      x: launchedProjectile.position.x,
      y: launchedProjectile.position.y,
      vx: launchedProjectile.velocity.x,
      vy: launchedProjectile.velocity.y,
      speed: launchedProjectile.speed,
      asset: launchedProjectile.plugin?.asset || null,
      projectileType: launchedProjectile.plugin?.projectileType || null,
      projectileEffect: launchedProjectile.plugin?.effect || null,
      expiredByBoundary: Boolean(launchedProjectile.plugin?.expiredByBoundary),
      age: launchAge,
      realAge: launchRealAge,
      landedAge: shotLandedAge,
    } : null,
    shots: state.shots,
    levelShotTotal,
    spawnAnim: projectileSpawnAnim,
    score: state.score,
    cssW,
    cssH,
    worldW,
    platforms: platforms.map((p) => ({ x: p.x, y: p.y, w: p.w, h: p.h, asset: p.asset })),
    targets: targets.map((t) => ({
      x: t.position.x,
      y: t.position.y,
      w: t.plugin?.w || 0,
      h: t.plugin?.h || 0,
      scored: Boolean(t.plugin?.scored),
      required: Boolean(t.plugin?.requiredTarget),
      asset: t.plugin?.asset || null,
    })),
    shotAbilityUsed,
    shotAbilityUsesThisShot,
    burstReady: Boolean(launchedProjectile && launchRealAge >= BURST_AVAILABLE_DELAY && shotAbilityUsesThisShot < BURST_MAX_USES_PER_SHOT),
    cameraX,
    anchor,
    lastLaunch,
    scorePopups: scorePopups.map((p) => ({ text: p.text, x: p.x, y: p.y, life: p.life })),
    worldObjectAssets: bodies.filter((b) => b.plugin && b.label !== "projectile").map((b) => b.plugin.asset || b.plugin.prefab || b.plugin.kind),
  };

  for (const body of targets) {
    if (!body.plugin || body.plugin.scored) continue;
    const hitRealGround = body.position.y > groundY - (body.plugin.h || 44) * 0.45;
    const outOfBounds = body.position.x < -80 || body.position.x > worldW + 80 || body.position.y > cssH + 100;
    if (state.hasLaunched && (hitRealGround || outOfBounds)) {
      if (isNewEnemy(body)) defeatNewEnemy(body);
      else scoreTarget(body);
    }
  }
  queueLevelComplete();

  for (const body of bodies) {
    if (!body.plugin || body.plugin.kind !== "block" || body.plugin.scored) continue;
    if (state.hasLaunched && (body.position.y > groundY + 36 || Math.abs(body.angle) > 1.35)) {
      body.plugin.scored = true;
      awardScore(80, body.position.x, body.position.y, "BREAK");
      burst(body.position.x, body.position.y, "#8eeaff", 6);
      destroyBody(body);
    }
  }

  if (launchedProjectile) {
    launchRealAge += delta;
    launchAge += delta * PHYSICS_TIME_SCALE;
    cameraTargetX = clamp(launchedProjectile.position.x - cssW * 0.34, 0, Math.max(0, worldW - cssW));
    shotTrail.push({ x: launchedProjectile.position.x, y: launchedProjectile.position.y });
    if (shotTrail.length > 240) shotTrail.shift();
    const out = launchedProjectile.position.x > worldW + 140 || launchedProjectile.position.y > cssH + 140 || launchedProjectile.position.x < -140;
    const stuckTopLeft = launchAge > 0.45 && launchedProjectile.position.x < cssW * 0.14 && launchedProjectile.position.y < cssH * 0.18;
    const grounded = launchAge > 0.8 && launchedProjectile.position.y > groundY - 8;
    const slow = launchAge > 1.0 && launchedProjectile.speed < 2.2;
    if ((grounded || slow) && shotLandedAge === null) {
      shotLandedAge = launchAge;
    }
    const settledLongEnough = shotLandedAge !== null && launchAge - shotLandedAge > SHOT_LANDED_VIEW_TIME;
    if (launchedProjectile.plugin?.expiredByBoundary || out || stuckTopLeft || settledLongEnough || launchAge > 6.0) completeShot();
  }

  if (!launchedProjectile && currentProjectile && !userPanned && !panning) cameraTargetX = 0;
  cameraX += (cameraTargetX - cameraX) * clamp(delta * CAMERA_FOLLOW_SPEED, 0, 1);

  if (!launchedProjectile && !currentProjectile && nextProjectileDelay > 0) {
    nextProjectileDelay -= delta;
    if (nextProjectileDelay <= 0) spawnProjectile();
  }

  if (!launchedProjectile && !currentProjectile && state.settling > 0) {
    state.settling -= delta;
    if (state.settling <= 0) {
      if (remainingTargets() === 0) finishLevel();
      else endGame();
    }
  }

  for (const p of particles) {
    p.life -= delta;
    p.x += p.vx * delta;
    p.y += p.vy * delta;
    p.vy += 360 * delta;
  }
  particles = particles.filter((p) => p.life > 0);
  for (const p of scorePopups) {
    p.life -= delta;
    p.y += p.vy * delta;
    p.scale = Math.min(1.15, p.scale + delta * 1.2);
  }
  scorePopups = scorePopups.filter((p) => p.life > 0);
  if (levelHintTimer > 0) levelHintTimer = Math.max(0, levelHintTimer - delta);
  if (screenShake > 0) screenShake = Math.max(0, screenShake - delta * 1.9);
  updateHud();
}

function remainingTargets() {
  return targets.filter((body) => body.plugin && body.plugin.kind === "enemy" && !body.plugin.scored).length;
}

function drawCover(img, x, y, w, h) {
  if (!img) return;
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (img.width - sw) * 0.5;
  const sy = (img.height - sh) * 0.52;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function drawBackgroundCover(x, y, w, h) {
  const levelNumber = state.levelIndex + 1;
  const levelKey = backgroundKeyForLevel(levelNumber);
  if (levelKey !== "background" && !assets[levelKey]) loadAssetByKey(levelKey);
  if (levelKey !== "background") {
    if (assets[levelKey]) {
      drawCover(assets[levelKey], x, y, w, h);
      lastDrawnLevelBackgroundKey = levelKey;
      return;
    }
    if (lastDrawnLevelBackgroundKey && lastDrawnLevelBackgroundKey !== "background" && assets[lastDrawnLevelBackgroundKey]) {
      drawCover(assets[lastDrawnLevelBackgroundKey], x, y, w, h);
      return;
    }
    const fallback = ctx.createLinearGradient(0, y, 0, y + h);
    fallback.addColorStop(0, "#94dff5");
    fallback.addColorStop(0.52, "#7ccf87");
    fallback.addColorStop(1, "#416f37");
    ctx.fillStyle = fallback;
    ctx.fillRect(x, y, w, h);
    return;
  }
  const background = assets.background;
  if (!background) return;
  lastDrawnLevelBackgroundKey = "background";
  ctx.save();
  ctx.translate(x + w, y + h);
  ctx.rotate(Math.PI);
  drawCover(background, 0, 0, w, h);
  ctx.restore();
}

function drawContain(img, x, y, w, h) {
  if (!img) return;
  const scale = Math.min(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function rotatePoint(point, center, angle) {
  if (!angle) return point;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

function drawContainRotated(img, x, y, w, h, angle) {
  if (!img) return;
  const scale = Math.min(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const cx = x + w / 2;
  const cy = y + h / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();
}

function drawStretchRotated(img, x, y, w, h, angle) {
  if (!img) return;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(angle);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}

function rotatedLocalPoint(geom, local) {
  const dx = (local.x - 0.5) * geom.w;
  const dy = (local.y - 0.5) * geom.h;
  const cos = Math.cos(geom.angle);
  const sin = Math.sin(geom.angle);
  return {
    x: geom.center.x + dx * cos - dy * sin,
    y: geom.center.y + dx * sin + dy * cos,
  };
}

function slingshotGeometry() {
  const size = isPhoneLandscapeViewport()
    ? clamp(cssH * 0.25, 70, 94)
    : clamp(cssW * 0.15, 92, 142);
  const w = size * 0.92;
  const h = size * 1.34;
  const angle = SLINGSHOT_ROTATION;
  const pouchOffset = {
    x: (SLINGSHOT_LOCAL_POUCH.x - 0.5) * w,
    y: (SLINGSHOT_LOCAL_POUCH.y - 0.5) * h,
  };
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const rotatedPouchOffset = {
    x: pouchOffset.x * cos - pouchOffset.y * sin,
    y: pouchOffset.x * sin + pouchOffset.y * cos,
  };
  const center = {
    x: anchor.x - rotatedPouchOffset.x,
    y: anchor.y - rotatedPouchOffset.y,
  };
  return {
    size,
    w,
    h,
    angle,
    center,
    x: center.x - w / 2,
    y: center.y - h / 2,
  };
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawPtiProjectileMark(w, h) {
  const size = Math.min(w, h);
  ctx.save();
  ctx.fillStyle = "#050505";
  ctx.strokeStyle = "#050505";
  ctx.lineWidth = Math.max(1.1, size * 0.035);
  ctx.lineCap = "round";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `600 ${size * 0.86}px Georgia, serif`;
  ctx.fillText("P", size * 0.03, size * 0.06);
  ctx.beginPath();
  ctx.moveTo(-size * 0.13, -size * 0.36);
  ctx.lineTo(-size * 0.13, size * 0.38);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-size * 0.30, -size * 0.22);
  ctx.lineTo(size * 0.14, -size * 0.22);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.52);
  ctx.lineTo(0, -size * 0.40);
  ctx.moveTo(-size * 0.06, -size * 0.46);
  ctx.lineTo(size * 0.06, -size * 0.46);
  ctx.stroke();
  ctx.restore();
}

function drawBlockShape(plugin, w, h) {
  const r = Math.min(7, Math.min(w, h) * 0.2);
  if (plugin.asset === "bomb" || plugin.asset === "tnt") {
    const bomb = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    bomb.addColorStop(0, "#ff5a3d");
    bomb.addColorStop(1, "#a71817");
    ctx.fillStyle = bomb;
    roundRect(-w / 2, -h / 2, w, h, 7);
    ctx.fill();
    ctx.strokeStyle = "#611010";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#fff2a8";
    ctx.font = `800 ${Math.max(10, h * 0.34)}px Trebuchet MS, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("TNT", 0, 1);
    return;
  }
  if (plugin.asset === "glass") {
    const glass = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
    glass.addColorStop(0, "#bff7ff");
    glass.addColorStop(1, "#4db9df");
    ctx.fillStyle = glass;
    roundRect(-w / 2, -h / 2, w, h, r);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.78)";
    ctx.lineWidth = 2;
    ctx.stroke();
    return;
  }
  if (plugin.asset === "metal") {
    const metal = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    metal.addColorStop(0, "#d2d8d8");
    metal.addColorStop(0.5, "#8e979b");
    metal.addColorStop(1, "#535b60");
    ctx.fillStyle = metal;
    roundRect(-w / 2, -h / 2, w, h, r);
    ctx.fill();
    ctx.strokeStyle = "#3b4248";
    ctx.lineWidth = 2;
    ctx.stroke();
    return;
  }
  const wood = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  wood.addColorStop(0, "#c77a24");
  wood.addColorStop(0.45, "#9d5418");
  wood.addColorStop(1, "#5c2f12");
  ctx.fillStyle = wood;
  roundRect(-w / 2, -h / 2, w, h, r);
  ctx.fill();
  ctx.strokeStyle = "#4b250e";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,210,111,0.55)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-w * 0.38, -h * 0.16);
  ctx.lineTo(w * 0.38, -h * 0.16);
  ctx.moveTo(-w * 0.34, h * 0.18);
  ctx.lineTo(w * 0.28, h * 0.18);
  ctx.stroke();
}

function drawBody(body, positionOverride = null) {
  const plugin = body.plugin || {};
  const img = assets[plugin.asset];
  const w = plugin.w || 40;
  const h = plugin.h || 40;
  const useBlockShape = plugin.kind === "block" && (plugin.asset === "glass" || plugin.asset === "metal") && h > w * 1.2;
  const position = positionOverride || body.position;
  ctx.save();
  ctx.translate(position.x, position.y);
  ctx.rotate(body.angle);
  if (plugin.asset === "logo") {
    if (img) {
      drawContain(img, -w / 2, -h / 2, w, h);
    } else {
      drawPtiProjectileMark(w, h);
    }
  } else if (img && plugin.contain) {
    drawContain(img, -w / 2, -h / 2, w, h);
  } else if (plugin.kind === "bomb" && img) {
    drawContain(img, -w / 2, -h / 2, w, h);
  } else if (plugin.kind === "block" && img && !useBlockShape) {
    drawContain(img, -w / 2, -h / 2, w, h);
  } else if (plugin.kind === "block" || plugin.kind === "bomb") {
    drawBlockShape(plugin, w, h);
  } else if (img) {
    if (plugin.kind === "projectile") drawContain(img, -w / 2, -h / 2, w, h);
    else ctx.drawImage(img, -w / 2, -h / 2, w, h);
  } else {
    ctx.fillStyle = plugin.kind === "projectile" ? "#ff3df2" : "#8eeaff";
    roundRect(-w / 2, -h / 2, w, h, 6);
    ctx.fill();
  }
  if (plugin.scored && plugin.kind !== "block" && plugin.kind !== "projectile") {
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(w, h) * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawProjectileToken(projectileType, x, y, size, active = false) {
  const metrics = projectileMetrics(projectileType);
  const img = assets[metrics.asset];
  const w = active ? metrics.w : size * (metrics.finalShot ? 1.12 : 1);
  const h = active ? metrics.h : size * (metrics.finalShot ? 1.12 : 1);
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = active ? 10 : 6;
  ctx.shadowOffsetY = active ? 6 : 4;
  if (metrics.finalShot) {
    ctx.globalAlpha = active ? 1 : 0.92;
    if (img) drawContain(img, -w / 2, -h / 2, w, h);
    else drawPtiProjectileMark(w, h);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(255,216,77,0.82)";
    ctx.lineWidth = Math.max(2, size * 0.06);
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(w, h) * 0.48, 0, Math.PI * 2);
    ctx.stroke();
  } else if (img) {
    drawContain(img, -w / 2, -h / 2, w, h);
  } else {
    ctx.fillStyle = metrics.tint || "#ff4bd8";
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
  if (!metrics.finalShot) {
    ctx.strokeStyle = metrics.tint || "rgba(255,255,255,0.72)";
    ctx.lineWidth = Math.max(1.5, size * 0.045);
    ctx.globalAlpha = active ? 0.95 : 0.82;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(w, h) * 0.48, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawProjectileQueue() {
  if (state.status !== "running" && state.status !== "level") return;
  const waitingCount = Math.max(0, state.shots - (currentProjectile ? 1 : 0));
  const size = clamp(cssW / 960, 0.76, 1.16) * 34;
  for (let i = 0; i < waitingCount; i += 1) {
    const slotFromNow = waitingCount - i;
    const pos = groundQueuePosition(i);
    drawProjectileToken(getProjectileTypeForSlot(slotFromNow), pos.x, pos.y, size, false);
  }
}

function currentProjectileDrawPosition() {
  if (!currentProjectile || dragging || projectileSpawnAnim <= 0) return null;
  const progress = 1 - clamp(projectileSpawnAnim / 0.32, 0, 1);
  const ease = 1 - Math.pow(1 - progress, 3);
  const start = groundQueuePosition(0);
  return {
    x: start.x + (anchor.x - start.x) * ease,
    y: start.y + (anchor.y - start.y) * ease - Math.sin(progress * Math.PI) * clamp(cssH * 0.045, 18, 34),
  };
}

function pointToward(from, to, distance) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  return {
    x: from.x + (dx / length) * distance,
    y: from.y + (dy / length) * distance,
  };
}

function drawFallbackElasticCurve(from, to, width, curveOffset = 0) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / length;
  const ny = dx / length;
  const control = {
    x: (from.x + to.x) / 2 + nx * curveOffset,
    y: (from.y + to.y) / 2 + ny * curveOffset + Math.min(5, length * 0.018),
  };

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 2;
  ctx.strokeStyle = "#160a04";
  ctx.lineWidth = width + 2.2;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.quadraticCurveTo(control.x, control.y, to.x, to.y);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.strokeStyle = "#3a1d0d";
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.quadraticCurveTo(control.x, control.y, to.x, to.y);
  ctx.stroke();
  ctx.strokeStyle = "rgba(218,142,78,0.62)";
  ctx.lineWidth = Math.max(1.2, width * 0.28);
  ctx.beginPath();
  ctx.moveTo(from.x + nx * width * 0.18, from.y + ny * width * 0.18);
  ctx.quadraticCurveTo(
    control.x + nx * width * 0.18,
    control.y + ny * width * 0.18,
    to.x + nx * width * 0.18,
    to.y + ny * width * 0.18
  );
  ctx.stroke();
  ctx.restore();
}

function drawSlingStringSprite(img, start, end, targetHeight) {
  if (!img) return false;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.max(1, Math.hypot(dx, dy));
  const angle = Math.atan2(dy, dx);
  const startCapSrc = clamp(SLING_STRING_SOURCE_CAPS.start, 1, img.width * 0.38);
  const endCapSrc = clamp(SLING_STRING_SOURCE_CAPS.end, 1, Math.max(1, img.width - startCapSrc - 1));
  const middleSrcX = startCapSrc;
  const middleSrcW = Math.max(1, img.width - startCapSrc - endCapSrc);
  const scale = targetHeight / Math.max(1, img.height);
  const startCapW = startCapSrc * scale;
  const endCapW = endCapSrc * scale;
  const startOverlap = targetHeight * SLING_STRING_OVERLAP.start;
  const endOverlap = targetHeight * SLING_STRING_OVERLAP.end;
  const visualLength = Math.max(distance + startOverlap + endOverlap, startCapW + endCapW + targetHeight);
  const drawX = -startOverlap;
  const drawY = -targetHeight / 2;

  ctx.save();
  ctx.translate(start.x, start.y);
  ctx.rotate(angle);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 3.5;
  ctx.shadowOffsetY = 1.5;

  if (visualLength <= startCapW + endCapW + targetHeight) {
    ctx.drawImage(img, 0, 0, img.width, img.height, drawX, drawY, visualLength, targetHeight);
  } else {
    const middleDstW = Math.max(1, visualLength - startCapW - endCapW);
    ctx.drawImage(img, 0, 0, startCapSrc, img.height, drawX, drawY, startCapW, targetHeight);
    ctx.drawImage(img, middleSrcX, 0, middleSrcW, img.height, drawX + startCapW, drawY, middleDstW, targetHeight);
    ctx.drawImage(img, img.width - endCapSrc, 0, endCapSrc, img.height, drawX + visualLength - endCapW, drawY, endCapW, targetHeight);
  }

  ctx.restore();
  return true;
}

function drawSlingPouch(pouchCenter, angle, projectileSize) {
  const pouchW = clamp(projectileSize * 0.46, 18, 30);
  const pouchH = clamp(projectileSize * 0.28, 11, 18);
  ctx.save();
  ctx.translate(pouchCenter.x, pouchCenter.y);
  ctx.rotate(angle);
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 2;
  const pouch = ctx.createLinearGradient(0, -pouchH / 2, 0, pouchH / 2);
  pouch.addColorStop(0, "#5a2c12");
  pouch.addColorStop(1, "#1c0b04");
  ctx.fillStyle = pouch;
  roundRect(-pouchW / 2, -pouchH / 2, pouchW, pouchH, pouchH * 0.45);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255,190,112,0.36)";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();
}

function drawSlingStrings(leftFork, rightFork, projectilePosition) {
  const plugin = currentProjectile?.plugin || {};
  const projectileSize = Math.max(plugin.w || 42, plugin.h || 42);
  const pouchRadius = projectileSize * 0.34;
  const stringHeight = clamp(
    cssW * SLING_STRING_TARGET_HEIGHT.ratio,
    SLING_STRING_TARGET_HEIGHT.min,
    SLING_STRING_TARGET_HEIGHT.max
  );
  const leftEnd = pointToward(projectilePosition, leftFork, pouchRadius);
  const rightEnd = pointToward(projectilePosition, rightFork, pouchRadius);
  const pouchCenter = {
    x: (leftEnd.x + rightEnd.x) / 2,
    y: (leftEnd.y + rightEnd.y) / 2,
  };
  const hasStringAssets = assets.slingString1 && assets.slingString2;

  if (hasStringAssets) {
    drawSlingStringSprite(assets.slingString1, leftFork, leftEnd, stringHeight);
    drawSlingStringSprite(assets.slingString2, rightFork, rightEnd, stringHeight);
  } else {
    const bandWidth = clamp(cssW * 0.0085, 5.2, 8.5);
    drawFallbackElasticCurve(leftFork, leftEnd, bandWidth, -bandWidth * 0.35);
    drawFallbackElasticCurve(rightFork, rightEnd, bandWidth, bandWidth * 0.35);
  }

  const forkMid = {
    x: (leftFork.x + rightFork.x) / 2,
    y: (leftFork.y + rightFork.y) / 2,
  };
  drawSlingPouch(pouchCenter, Math.atan2(forkMid.y - projectilePosition.y, forkMid.x - projectilePosition.x), projectileSize);
}

function slingPouchVisualPosition() {
  if (dragging && currentProjectile) return currentProjectile.position;
  return anchor;
}

function drawSlingshot() {
  const geom = slingshotGeometry();
  const leftFork = rotatedLocalPoint(geom, SLINGSHOT_LEFT_BAND);
  const rightFork = rotatedLocalPoint(geom, SLINGSHOT_RIGHT_BAND);
  const slingAsset = dragging && currentProjectile && assets.slingshotFrame
    ? assets.slingshotFrame
    : assets.slingshot;
  const pouchPosition = slingPouchVisualPosition();

  if (dragging && currentProjectile) drawTrajectoryPreview();

  ctx.save();
  if (slingAsset) {
    drawStretchRotated(slingAsset, geom.x, geom.y, geom.w, geom.h, geom.angle);
  } else {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#c77a24";
    ctx.lineWidth = geom.size * 0.105;
    ctx.beginPath();
    ctx.moveTo(anchor.x, anchor.y + geom.size * 0.50);
    ctx.lineTo(anchor.x, anchor.y - geom.size * 0.05);
    ctx.lineTo(leftFork.x, leftFork.y);
    ctx.moveTo(anchor.x, anchor.y - geom.size * 0.05);
    ctx.lineTo(rightFork.x, rightFork.y);
    ctx.stroke();
  }
  ctx.restore();

  drawSlingStrings(leftFork, rightFork, pouchPosition);
}

function drawTrajectoryPreview() {
  const velocity = launchVectorFromDrag();
  if (!velocity || !currentProjectile) return;
  const pos = currentProjectile.position;
  ctx.save();
  for (let i = 1; i <= 18; i += 1) {
    const frames = i * 5.2;
    const x = pos.x + velocity.x * frames;
    const y = pos.y + velocity.y * frames + 0.5 * engine.gravity.y * frames * frames * 0.018;
    const screenX = x - cameraX;
    if (screenX > cssW - 12 || y > cssH - 12 || screenX < 12 || x > worldW - 12) break;
    ctx.globalAlpha = clamp(0.78 - i * 0.032, 0.16, 0.74);
    ctx.fillStyle = "#fff7c2";
    ctx.beginPath();
    ctx.arc(x, y, clamp(5 - i * 0.12, 2.6, 4.8), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

const PLATFORM_DRAW_PROFILES = Object.freeze({
  table1: { maxH: 124, minH: 68, topRatio: 0.08, pad: 22 },
  table2: { maxH: 88, minH: 50, topRatio: 0.13, pad: 18 },
  table3: { maxH: 118, minH: 58, topRatio: 0.11, pad: 20 },
  table4: { maxH: 68, minH: 34, topRatio: 0.10, pad: 16 },
  table5: { maxH: 50, minH: 28, topRatio: 0.08, pad: 14 },
  table6: { maxH: 86, minH: 48, topRatio: 0.08, pad: 20 },
  table7: { maxH: 88, minH: 48, topRatio: 0.08, pad: 20 },
});

function drawGeneratedPlatform(platform, palette) {
  const x = platform.x - platform.w / 2;
  const y = platform.y - platform.h / 2;
  const topH = Math.max(12, platform.h * 0.42);
  const bodyH = Math.max(19, platform.h * 0.68);
  const topY = y - Math.max(3, platform.h * 0.12);
  const bodyY = y + topH * 0.42;
  const radius = clamp(platform.h * 0.28, 7, 12);
  const accent = palette.accent || palette.rim || "#ff9f1c";
  const trimTopColor = palette.trimTop || palette.top || "#7dff63";
  const trimBottomColor = palette.trimBottom || palette.rim || "#228f45";
  const beltTopColor = palette.beltTop || palette.bodyTop || "#1f6a56";
  const beltBottomColor = palette.beltBottom || palette.bodyBottom || "#06291f";

  ctx.save();
  ctx.globalAlpha = 0.24;
  ctx.fillStyle = "rgba(0, 0, 0, 0.58)";
  roundRect(x + 12, y + platform.h * 0.92, platform.w - 24, Math.max(8, platform.h * 0.34), 12);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.shadowColor = palette.glow || "rgba(115,255,78,0.22)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;
  const body = ctx.createLinearGradient(0, bodyY, 0, bodyY + bodyH);
  body.addColorStop(0, palette.bodyTop);
  body.addColorStop(1, palette.bodyBottom);
  ctx.fillStyle = body;
  roundRect(x + 2, bodyY, platform.w - 4, bodyH, radius);
  ctx.fill();
  ctx.shadowColor = "transparent";

  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  ctx.stroke();

  const top = ctx.createLinearGradient(0, topY, 0, topY + topH);
  top.addColorStop(0, trimTopColor);
  top.addColorStop(0.34, trimBottomColor);
  top.addColorStop(1, beltBottomColor);
  ctx.fillStyle = top;
  roundRect(x - 6, topY, platform.w + 12, topH, radius + 2);
  ctx.fill();
  ctx.strokeStyle = palette.stroke;
  ctx.lineWidth = 2;
  ctx.stroke();

  const beltY = topY + topH * 0.34;
  const beltH = Math.max(7, topH * 0.45);
  const belt = ctx.createLinearGradient(0, beltY, 0, beltY + beltH);
  belt.addColorStop(0, beltTopColor);
  belt.addColorStop(1, beltBottomColor);
  ctx.fillStyle = belt;
  roundRect(x + 7, beltY, platform.w - 14, beltH, beltH / 2);
  ctx.fill();

  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let tx = x + 24; tx < x + platform.w - 18; tx += 32) {
    ctx.moveTo(tx, beltY + beltH * 0.22);
    ctx.lineTo(tx + 12, beltY + beltH * 0.22);
  }
  ctx.stroke();

  ctx.globalAlpha = 1;
  ctx.fillStyle = accent;
  roundRect(x - 3, bodyY + bodyH * 0.18, 8, bodyH * 0.58, 4);
  ctx.fill();
  roundRect(x + platform.w - 5, bodyY + bodyH * 0.18, 8, bodyH * 0.58, 4);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.72)";
  for (let bx = x + 24; bx <= x + platform.w - 24; bx += 72) {
    ctx.beginPath();
    ctx.arc(bx, bodyY + bodyH * 0.45, 2.1, 0, Math.PI * 2);
    ctx.fill();
  }

  if (platform.w > 165) {
    const legW = clamp(platform.h * 0.18, 5, 8);
    const legH = Math.max(13, platform.h * 0.46);
    const legTop = bodyY + bodyH * 0.72;
    const leg = ctx.createLinearGradient(0, legTop, 0, legTop + legH);
    leg.addColorStop(0, "#144f57");
    leg.addColorStop(1, "#061e25");
    ctx.fillStyle = leg;
    for (const lx of [x + platform.w * 0.24, x + platform.w * 0.76]) {
      roundRect(lx - legW / 2, legTop, legW, legH, 3);
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawTablePlatformImage(platform, img, palette) {
  const topY = platformTop(platform);
  const profile = PLATFORM_DRAW_PROFILES[platform.asset] || PLATFORM_DRAW_PROFILES.table2;
  const scale = clamp(cssW / 960, 0.72, 1.25);
  const visualW = platform.w + profile.pad * scale;
  const naturalH = visualW * (img.height / Math.max(1, img.width));
  const visualH = clamp(naturalH, profile.minH * scale, profile.maxH * scale);
  const x = platform.x - visualW / 2;
  const y = topY - visualH * profile.topRatio;

  ctx.save();
  ctx.shadowColor = palette?.glow || "rgba(0,0,0,0.28)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 8;
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = "rgba(0,0,0,0.58)";
  roundRect(x + visualW * 0.07, topY + visualH * 0.62, visualW * 0.86, Math.max(7, visualH * 0.13), 14);
  ctx.fill();
  ctx.globalAlpha = 1;

  const imageScale = Math.max(visualW / img.width, visualH / img.height);
  const sw = Math.min(img.width, visualW / imageScale);
  const sh = Math.min(img.height, visualH / imageScale);
  const sx = (img.width - sw) * 0.5;
  const sy = 0;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, visualW, visualH);

  ctx.shadowColor = "transparent";
  ctx.globalAlpha = 0.58;
  ctx.strokeStyle = palette?.stroke || "rgba(115,255,78,0.42)";
  ctx.lineWidth = Math.max(1.2, platform.h * 0.055);
  ctx.beginPath();
  ctx.moveTo(platform.x - platform.w * 0.43, topY + 1);
  ctx.lineTo(platform.x + platform.w * 0.43, topY + 1);
  ctx.stroke();
  ctx.restore();
}

function drawPlatforms() {
  for (const platform of platforms) {
    const palette = platform.palette || platformPalette(0);
    const tableImg = assets[platform.asset] || assets.table1;
    const compactShelf = platform.style === "shelf" || platform.w < clamp(cssW * 0.17, 145, 190);
    if (tableImg && !compactShelf) {
      drawTablePlatformImage(platform, tableImg, palette);
      continue;
    }
    drawGeneratedPlatform(platform, palette);
  }
}

function drawHudBrand() {
  const logoW = clamp(cssW * 0.072, 44, 74);
  const logoH = logoW * 0.64;
  const logoX = cssW / 2 - logoW / 2;
  const logoY = clamp(cssH * 0.018, 10, 18);
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.shadowColor = "rgba(0, 0, 0, 0.40)";
  ctx.shadowBlur = 9;
  ctx.shadowOffsetY = 3;
  drawContain(assets.logo, logoX, logoY, logoW, logoH);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = "rgba(5,10,22,0.58)";
  roundRect(cssW - 170, 14, 154, 38, 12);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "700 14px Trebuchet MS, sans-serif";
  ctx.textAlign = "right";
  const remaining = remainingTargets();
  ctx.fillText(`${remaining} target${remaining === 1 ? "" : "s"} left`, cssW - 30, 38);
  ctx.restore();
}

function drawParticles(delta) {
  for (const p of particles) {
    const alpha = clamp(p.life / p.max, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    if (p.sprite === "ring") {
      const t = 1 - alpha;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(2, 6 * alpha);
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10 * alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.35 + t * 1.45), 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.sprite && assets[p.sprite]) {
      const t = 1 - alpha;
      const size = p.size * (0.75 + t * 0.55);
      ctx.translate(p.x, p.y);
      ctx.rotate((1 - alpha) * Math.PI * 0.35);
      drawContain(assets[p.sprite], -size / 2, -size / 2, size, size);
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.5 + alpha * 0.6), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  if (shotTrail.length > 1) {
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(255,200,80,0.55)";
    ctx.shadowBlur = 8;
    ctx.strokeStyle = "rgba(255,232,140,0.85)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(shotTrail[0].x, shotTrail[0].y);
    for (let i = 1; i < shotTrail.length; i += 1) {
      ctx.lineTo(shotTrail[i].x, shotTrail[i].y);
    }
    ctx.stroke();
    ctx.restore();

    const last = shotTrail[shotTrail.length - 1];
    ctx.save();
    ctx.fillStyle = "rgba(255,232,140,0.9)";
    ctx.beginPath();
    ctx.arc(last.x, last.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawScorePopups() {
  for (const popup of scorePopups) {
    const t = 1 - clamp(popup.life / popup.max, 0, 1);
    const alpha = clamp(popup.life / popup.max, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(popup.x, popup.y);
    ctx.scale(popup.scale + t * 0.08, popup.scale + t * 0.08);
    ctx.font = "1000 21px Trebuchet MS, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 5;
    ctx.strokeStyle = "rgba(2, 12, 15, 0.92)";
    ctx.fillStyle = popup.text.includes("TARGET") ? "#ffd84d" : "#ffffff";
    ctx.shadowColor = popup.text.includes("TARGET") ? "rgba(255, 216, 77, 0.72)" : "rgba(125, 255, 99, 0.46)";
    ctx.shadowBlur = 10;
    ctx.strokeText(popup.text, 0, 0);
    ctx.fillText(popup.text, 0, 0);
    ctx.restore();
  }
}

function drawGameplayHint() {
  if (state.status !== "running" || levelHintTimer <= 0 || dragging) return;
  if (isPhoneLandscapeViewport()) return;
  const hints = [
    "Tip: Bonus objects give extra points.",
    "Tip: Break bonus objects for extra score. Projectiles hit differently.",
    "Tip: Clear every target. Use burst while the shot is flying.",
  ];
  const text = hints[Math.min(hints.length - 1, state.levelIndex % hints.length)];
  ctx.save();
  const lifetime = 4.8;
  const elapsed = lifetime - levelHintTimer;
  const alpha = Math.min(1, elapsed / 0.24, levelHintTimer / 0.55) * 0.96;
  const slide = (1 - Math.min(1, elapsed / 0.24)) * -8;
  const fontSize = clamp(cssW * 0.014, 12, 15);
  ctx.font = `900 ${fontSize}px Trebuchet MS, Arial, sans-serif`;
  const icon = "★";
  const label = text.replace(/^Tip:/, "Tip:");
  const w = Math.min(cssW - 34, Math.max(330, ctx.measureText(label).width + 68));
  const h = clamp(fontSize + 24, 36, 44);
  const isCompact = cssW < 680;
  const x = isCompact ? (cssW - w) / 2 : cssW - w - 22;
  const compactBottomLimit = Math.max(86, cssH - h - 92);
  const y = isCompact ? clamp(cssH * 0.18, 132, compactBottomLimit) : clamp(cssH * 0.13, 72, 98);
  ctx.globalAlpha = alpha;
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, "rgba(4, 34, 38, 0.94)");
  grad.addColorStop(1, "rgba(1, 15, 18, 0.97)");
  ctx.fillStyle = grad;
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 14;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y + slide, w, h, h / 2);
  else ctx.rect(x, y + slide, w, h);
  ctx.fill();
  ctx.shadowColor = "rgba(102,255,72,0.20)";
  ctx.shadowBlur = 16;
  ctx.strokeStyle = "rgba(115,255,78,0.48)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffb342";
  ctx.font = `1000 ${fontSize + 2}px Trebuchet MS, Arial, sans-serif`;
  ctx.fillText("*", x + 16, y + slide + h / 2 + 1);
  ctx.font = `900 ${fontSize}px Trebuchet MS, Arial, sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 4;
  ctx.fillText(label, x + 42, y + slide + h / 2 + 1);
  ctx.restore();
}

function render(delta = 0) {
  ctx.clearRect(0, 0, cssW, cssH);

  if (!Matter) {
    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, cssW, cssH);
    ctx.fillStyle = "#fff";
    ctx.font = "700 20px Trebuchet MS, sans-serif";
    ctx.fillText("Matter.js did not load.", 32, 48);
    return;
  }

  ctx.save();
  const shakeX = screenShake > 0 ? (Math.random() - 0.5) * screenShake * 18 : 0;
  const shakeY = screenShake > 0 ? (Math.random() - 0.5) * screenShake * 10 : 0;
  const fixedMobileBackground = isPhoneLandscapeViewport();
  if (fixedMobileBackground) {
    ctx.save();
    ctx.translate(shakeX, shakeY);
    drawBackgroundCover(0, 0, cssW, cssH);
    ctx.fillStyle = "rgba(0,0,0,0.03)";
    ctx.fillRect(0, 0, cssW, cssH);
    ctx.restore();
  }
  ctx.translate(-cameraX + shakeX, shakeY);
  if (!fixedMobileBackground) {
    drawBackgroundCover(0, 0, worldW, cssH);
    ctx.fillStyle = "rgba(0,0,0,0.05)";
    ctx.fillRect(0, 0, worldW, cssH);
  }
  drawPlatforms();
  drawProjectileQueue();
  drawSlingshot();

  const drawables = bodies
    .concat(currentProjectile ? [currentProjectile] : [])
    .concat(launchedProjectile ? [launchedProjectile] : []);
  drawables.sort((a, b) => a.position.y - b.position.y);
  const currentOverride = currentProjectileDrawPosition();
  for (const body of drawables) drawBody(body, body === currentProjectile ? currentOverride : null);

  drawParticles(delta);
  drawScorePopups();
  ctx.restore();

  drawHudBrand();
  drawGameplayHint();
}

function frame(now) {
  const delta = Math.min(0.016, (now - lastFrame) / 1000);
  lastFrame = now;
  if (resizeQueued) {
    resizeQueued = false;
    const oldW = cssW;
    const oldH = cssH;
    setupCanvasSize();
    const changed = Math.abs(cssW - oldW) > 3 || Math.abs(cssH - oldH) > 3;
    if (state.status === "running" && changed && !state.hasLaunched) resetLevel(true);
  }
  updateSlingshotOrientationGate();
  update(delta);
  render(delta);
  requestAnimationFrame(frame);
}

function submitScore(name, email, score) {
  const rawScore = Math.max(0, Math.floor(Number(score) || 0));
  const prizePoints = window.PTIArcade
    ? window.PTIArcade.calculatePrizePoints(ACTIVE_GAME_TYPE, rawScore)
    : rawScore;
  const arcadeResult = window.PTIArcade
    ? window.PTIArcade.submitScore({ playerName: name, email, gameId: ACTIVE_GAME_TYPE, rawScore })
    : null;
  if (arcadeResult && !arcadeResult.accepted && arcadeResult.reason) {
    resultMessage.textContent = arcadeResult.reason;
    return arcadeResult;
  }
  if (arcadeResult) {
    window.PTIArcade?.trackEvent("score_submitted", { gameId: "printYardSling", rawScore, prizePoints, accepted: arcadeResult.accepted });
    renderLeaderboard();
    const rankText = arcadeResult.rank ? `You are ranked #${arcadeResult.rank} on the monthly leaderboard.` : "";
    const chaseText = arcadeResult.pointsToTop10
      ? ` Earn ${arcadeResult.pointsToTop10} more Prize Points to enter the prize draw.`
      : arcadeResult.pointsToNextRank
        ? ` Earn ${arcadeResult.pointsToNextRank} more Prize Points to climb one rank.`
        : "";
    resultMessage.textContent = `${arcadeResult.message} ${rankText}${chaseText}`;
    if (resultRankMessage) {
      resultRankMessage.textContent = arcadeResult.rank === 1
        ? "You're leading for the monthly prize."
        : arcadeResult.rank && arcadeResult.rank <= 10
          ? "You're in the prize draw."
          : "Keep playing to climb into the prize draw.";
    }
    if (resultBestPrizePoints) {
      const best = window.PTIArcade.getPlayerBests()?.overall?.prizePoints || prizePoints;
      resultBestPrizePoints.textContent = Number(best).toLocaleString();
    }
    saveBestScore(rawScore);
    updateHud();
    return arcadeResult;
  }
  const entry = {
    name: name.trim(),
    email: email.trim(),
    score: rawScore,
    rawScore,
    gameScore: rawScore,
    gameType: ACTIVE_GAME_TYPE,
    gameName: ACTIVE_GAME_NAME,
    prizePoints,
    createdAt: new Date().toISOString(),
    submittedAt: new Date().toISOString(),
    monthlyId: new Date().toISOString().slice(0, 7),
  };
  const rows = loadLeaderboard();
  rows.push(entry);
  saveLeaderboard(rows.sort((a, b) => getPrizePoints(b) - getPrizePoints(a)));
  renderLeaderboard();
  saveBestScore(rawScore);
  updateHud();
  if (!APPS_SCRIPT_URL && !SHEETS_URL) return;
  const endpoint = APPS_SCRIPT_URL || SHEETS_URL;
  fetch(endpoint, {
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
      submitted_at: entry.createdAt,
      source: "pti-giveaway-arcade",
    }),
  }).catch(() => {});
}

homeSoundButton?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  toggleAudioMuted();
});

homeLeaderboardButton?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  closeHomeModals();
  window.PTIArcade?.trackEvent("leaderboard_viewed", { source: "home_button" });
  leaderboardSection?.scrollIntoView({ behavior: "smooth", block: "start" });
});

homeLevelsButton?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  showGameSelect();
});

homeShopButton?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  ensureAudio();
  playSound("pause");
  showHomeModal(homeShopModal);
});

shopCloseButton?.addEventListener("click", closeHomeModals);
homeShopModal?.addEventListener("click", (event) => {
  if (event.target === homeShopModal) closeHomeModals();
});

startButton.addEventListener("click", () => {
  window.PTIArcade?.trackEvent("game_select_opened");
  showGameSelect();
});
gameSelectBackButton?.addEventListener("click", showStartScreen);
selectSlingshotGame?.addEventListener("click", () => {
  window.PTIArcade?.trackEvent("game_started", { gameId: "printYardSling" });
  requestSlingshotFullscreen();
  showLevelSelect();
});
selectDeliveryGame?.addEventListener("click", () => {
  window.PTIArcade?.trackEvent("game_started", { gameId: "inkFlightRush" });
  window.location.href = "./cave-flight.html";
});
restartButton.addEventListener("click", startGame);
resultMainMenuButton?.addEventListener("click", showStartScreen);
failedRetryButton?.addEventListener("click", restartCurrentLevel);
failedLevelSelectButton?.addEventListener("click", () => {
  requestSlingshotFullscreen();
  showLevelSelect();
});
failedMainMenuButton?.addEventListener("click", showStartScreen);
gateButton.addEventListener("click", () => {
  requestSlingshotFullscreen();
  if (gateButton.dataset.action === "submit") {
    endGame("All levels cleared. Submit your Prize Points to the monthly leaderboard.", { completed: true });
    return;
  }
  startNextLevel();
});
gateRetryButton?.addEventListener("click", restartCurrentLevel);
gateLevelSelectButton?.addEventListener("click", () => {
  requestSlingshotFullscreen();
  showLevelSelect();
});

levelBackButton.addEventListener("click", showGameSelect);

levelSelectGrid.addEventListener("click", (event) => {
  const card = event.target.closest(".level-card");
  if (!card || card.classList.contains("locked") || card.getAttribute("aria-disabled") === "true") return;
  const levelIndex = Number(card.dataset.levelIndex);
  if (!Number.isInteger(levelIndex)) return;
  requestSlingshotFullscreen();
  startGame({ levelIndex });
});

pauseBtn.addEventListener("click", () => {
  if (state.status !== "running") return;
  ensureAudio();
  state.paused = true;
  pausePanel.classList.remove("hidden");
  playSound("pause");
  updateHud();
});

pauseRestartBtn.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  restartCurrentLevel();
});

pauseResumeBtn.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  resumeGameFromPause();
});

pauseLevelsBtn.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  state.paused = false;
  pausePanel.classList.add("hidden");
  renderLevelSelect();
  state.status = "select";
  levelSelectOverlay.classList.remove("hidden");
  updateHud();
});

pauseMainMenuBtn?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  showStartScreen();
});

pauseSoundBtn?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  toggleAudioMuted();
});

fireBtn.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  ensureAudio();
  activateShotAbility();
});

document.addEventListener("keydown", (event) => {
  const tag = event.target?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
  if (event.code === "Escape") {
    closeHomeModals();
    if (state.paused) {
      resumeGameFromPause();
    }
    return;
  }
  ensureAudio();
  if (event.code === "Space") {
    if (dragging && currentProjectile) {
      event.preventDefault();
      fireCurrentProjectile();
    }
    return;
  }
  if (event.key?.toLowerCase() === "b") {
    if (activateShotAbility()) event.preventDefault();
  }
});

canvas.addEventListener("pointerdown", onPointerDown);
canvas.addEventListener("pointermove", onPointerMove);
canvas.addEventListener("pointerup", onPointerUp);
canvas.addEventListener("pointercancel", cancelDrag);
document.addEventListener("pointermove", onPointerMove);
window.addEventListener("pointerup", onPointerUp);

canvas.addEventListener("touchstart", onPointerDown, { passive: false });
document.addEventListener("touchmove", onPointerMove, { passive: false });
window.addEventListener("touchend", onPointerUp, { passive: false });
window.addEventListener("touchcancel", cancelDrag, { passive: false });
canvas.addEventListener("mousedown", onPointerDown);
document.addEventListener("mousemove", onPointerMove);
window.addEventListener("mouseup", onPointerUp);

window.addEventListener("resize", () => {
  resizeQueued = true;
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && state.status === "running") state.paused = true;
  updateHud();
});

scoreForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (state.submitted) return;
  const result = submitScore(playerNameInput.value, playerEmailInput.value, state.finalScore || Math.floor(state.score));
  if (result?.accepted === false && result.reason) return;
  state.submitted = true;
  if (window.PTIArcade) window.PTIArcade.renderAll();
  playerNameInput.value = window.PTIArcade?.getSavedPlayerName?.() || playerNameInput.value;
  playerEmailInput.value = "";
});

setupCanvasSize();
renderLeaderboard();
renderLevelSelect();
updateSoundUi();
updateHud();
if (playerNameInput && window.PTIArcade?.getSavedPlayerName) {
  playerNameInput.value = window.PTIArcade.getSavedPlayerName();
}

loadAssets().then(() => {
  state.status = "idle";
  syncArcadeShellMode();
  renderLevelSelect();
  startOverlay.style.display = "";
  render();
  requestAnimationFrame(frame);
});
