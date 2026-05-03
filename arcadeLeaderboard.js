(function () {
  "use strict";

  const KEYS = {
    playerId: "pti_arcade_player_id",
    playerName: "pti_arcade_player_name",
    leaderboardMode: "pti_arcade_leaderboard_mode",
    leaderboardCurrentMonth: "pti_arcade_leaderboard_current_month",
    playerBests: "pti_arcade_player_bests",
    monthlyScores: "pti_arcade_monthly_scores",
    weeklyScores: "pti_arcade_weekly_scores",
  };

  const LEADERBOARD_MODE = "monthly";
  const GIVEAWAY_END_DATE = "";
  const DEV_MODE = new URLSearchParams(window.location.search).get("devLeaderboard") === "1";

  const GAME_SCORING = {
    inkRunRush: {
      id: "inkRunRush",
      name: "Ink Run Rush",
      difficulty: "Coming Soon",
      maxRawScore: 500000,
      rawToPrizePoints(rawScore) {
        return Math.floor(rawScore / 10);
      },
    },
    inkFlightRush: {
      id: "inkFlightRush",
      aliases: ["cave-flight", "ink-flight-rush"],
      name: "Ink Flight Rush",
      difficulty: "Medium",
      maxRawScore: 250000,
      rawToPrizePoints(rawScore) {
        return Math.floor(rawScore / 8);
      },
    },
    printYardSling: {
      id: "printYardSling",
      aliases: ["print-yard-sling", "slingshot"],
      name: "Print Yard Sling",
      difficulty: "Easy",
      maxRawScore: 500000,
      rawToPrizePoints(rawScore) {
        return Math.floor(rawScore / 50);
      },
    },
  };

  const GAME_ALIASES = Object.values(GAME_SCORING).reduce((map, game) => {
    map[game.id] = game.id;
    (game.aliases || []).forEach((alias) => { map[alias] = game.id; });
    return map;
  }, {});

  const fakeScores = [
    { playerName: "Katelyn", gameId: "printYardSling", rawScore: 71000, prizePoints: 1420 },
    { playerName: "Ash", gameId: "inkFlightRush", rawScore: 9440, prizePoints: 1180 },
    { playerName: "Jay", gameId: "printYardSling", rawScore: 46500, prizePoints: 930 },
    { playerName: "Mia", gameId: "inkFlightRush", rawScore: 6960, prizePoints: 870 },
    { playerName: "Tane", gameId: "printYardSling", rawScore: 40500, prizePoints: 810 },
  ];

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function createId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function getPlayerId() {
    let playerId = localStorage.getItem(KEYS.playerId);
    if (!playerId) {
      playerId = createId();
      localStorage.setItem(KEYS.playerId, playerId);
    }
    return playerId;
  }

  function sanitizeText(value, maxLength = 80) {
    return String(value || "")
      .replace(/[<>&"']/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxLength);
  }

  function sanitizePlayerName(value) {
    return sanitizeText(value, 20);
  }

  function getSavedPlayerName() {
    return sanitizePlayerName(localStorage.getItem(KEYS.playerName) || "");
  }

  function setSavedPlayerName(name) {
    const clean = sanitizePlayerName(name);
    if (clean) localStorage.setItem(KEYS.playerName, clean);
    return clean;
  }

  function normalizeGameId(gameId) {
    return GAME_ALIASES[gameId] || gameId;
  }

  function getGameConfig(gameId) {
    return GAME_SCORING[normalizeGameId(gameId)] || null;
  }

  function calculatePrizePoints(gameId, rawScore) {
    const game = getGameConfig(gameId);
    const raw = Math.max(0, Math.floor(Number(rawScore) || 0));
    if (!game) return Math.floor(raw / 50);
    return Math.max(0, game.rawToPrizePoints(raw));
  }

  function getCurrentMonthId(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  function getGiveawayEnd(date = new Date()) {
    if (GIVEAWAY_END_DATE) {
      const configured = new Date(GIVEAWAY_END_DATE);
      if (!Number.isNaN(configured.getTime())) return configured;
    }
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  function getResetCountdown(date = new Date()) {
    const ms = Math.max(0, getGiveawayEnd(date) - date);
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    return `${days}d ${hours}h`;
  }

  function ensureCurrentMonth() {
    const monthId = getCurrentMonthId();
    localStorage.setItem(KEYS.leaderboardMode, LEADERBOARD_MODE);
    const saved = localStorage.getItem(KEYS.leaderboardCurrentMonth);
    if (saved !== monthId) {
      localStorage.setItem(KEYS.leaderboardCurrentMonth, monthId);
    }
    return monthId;
  }

  function isCurrentMonthlyEntry(entry, monthId) {
    if (entry.monthlyId) return entry.monthlyId === monthId;
    const submitted = entry.submittedAt || entry.createdAt;
    if (!submitted) return false;
    const submittedDate = new Date(submitted);
    if (Number.isNaN(submittedDate.getTime())) return false;
    return getCurrentMonthId(submittedDate) === monthId;
  }

  function normalizeLeaderboardEntry(entry, monthId) {
    const rawScore = Math.max(0, Math.floor(Number(entry.rawScore ?? entry.gameScore ?? entry.score) || 0));
    return {
      ...entry,
      rawScore,
      gameScore: rawScore,
      prizePoints: Math.max(0, Math.floor(Number(entry.prizePoints ?? entry.score) || 0)),
      submittedAt: entry.submittedAt || entry.createdAt || new Date().toISOString(),
      monthlyId: entry.monthlyId || monthId,
      leaderboardMode: entry.leaderboardMode || LEADERBOARD_MODE,
    };
  }

  function loadMonthlyScores() {
    const monthId = ensureCurrentMonth();
    const monthlyRows = readJson(KEYS.monthlyScores, []);
    const legacyRows = readJson(KEYS.weeklyScores, []);
    const rows = []
      .concat(Array.isArray(monthlyRows) ? monthlyRows : [])
      .concat(Array.isArray(legacyRows) ? legacyRows : []);
    const seen = new Set();
    const activeRows = rows
      .filter((entry) => isCurrentMonthlyEntry(entry, monthId))
      .map((entry) => normalizeLeaderboardEntry(entry, monthId))
      .filter((entry) => {
        const key = entry.id || `${entry.playerId}-${entry.gameId}-${entry.submittedAt}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    if (activeRows.length || !DEV_MODE) {
      const seenPlayers = new Set();
      return sortLeaderboard(activeRows).filter((entry) => {
        const key = entry.playerId || entry.id;
        if (!key || !entry.playerId) return true;
        if (seenPlayers.has(key)) return false;
        seenPlayers.add(key);
        return true;
      });
    }
    const now = Date.now();
    return fakeScores.map((entry, index) => ({
      id: `dev-${index}`,
      playerId: `dev-${index}`,
      playerName: entry.playerName,
      gameId: entry.gameId,
      gameName: GAME_SCORING[entry.gameId].name,
      rawScore: entry.rawScore,
      gameScore: entry.rawScore,
      prizePoints: entry.prizePoints,
      submittedAt: new Date(now - index * 600000).toISOString(),
      monthlyId: monthId,
      leaderboardMode: LEADERBOARD_MODE,
      dev: true,
    }));
  }

  function saveMonthlyScores(entries) {
    const monthId = ensureCurrentMonth();
    const existing = readJson(KEYS.monthlyScores, []);
    const archive = Array.isArray(existing) ? existing.filter((entry) => !isCurrentMonthlyEntry(entry, monthId)) : [];
    const normalized = entries.map((entry) => normalizeLeaderboardEntry(entry, monthId));
    writeJson(KEYS.monthlyScores, archive.concat(normalized).slice(-400));
  }

  function sortLeaderboard(entries) {
    return entries.slice().sort((a, b) => {
      const ppDiff = Number(b.prizePoints || 0) - Number(a.prizePoints || 0);
      if (ppDiff) return ppDiff;
      const timeDiff = String(a.submittedAt || "").localeCompare(String(b.submittedAt || ""));
      if (timeDiff) return timeDiff;
      return Number(b.rawScore || 0) - Number(a.rawScore || 0);
    });
  }

  function getLeaderboard(limit) {
    const rows = sortLeaderboard(loadMonthlyScores());
    return Number.isFinite(limit) ? rows.slice(0, limit) : rows;
  }

  function getPlayerBests(playerId = getPlayerId()) {
    const all = readJson(KEYS.playerBests, {});
    const currentMonth = getCurrentMonthId();
    const bests = all[playerId] || { monthlyId: currentMonth, games: {}, overall: null };
    if ((bests.monthlyId || bests.weeklyId) !== currentMonth) {
      return { monthlyId: currentMonth, games: {}, overall: null };
    }
    return {
      monthlyId: currentMonth,
      games: bests.games || {},
      overall: bests.overall || null,
    };
  }

  function savePlayerBests(playerId, bests) {
    const all = readJson(KEYS.playerBests, {});
    all[playerId] = bests;
    writeJson(KEYS.playerBests, all);
  }

  function isPlausibleScore(gameId, rawScore) {
    const game = getGameConfig(gameId);
    const raw = Math.floor(Number(rawScore) || 0);
    if (!game || raw < 0) return false;
    return raw <= game.maxRawScore;
  }

  function getPrizeStatus(rankIndex) {
    if (rankIndex === 0) return "Monthly Prize";
    if (rankIndex > 0 && rankIndex < 10) return "Prize Draw";
    return "Keep Climbing";
  }

  function submitScore({ playerName, email = "", gameId, rawScore, level = null }) {
    const normalizedGameId = normalizeGameId(gameId);
    const game = getGameConfig(normalizedGameId);
    const raw = Math.max(0, Math.floor(Number(rawScore) || 0));
    if (!game) return { accepted: false, reason: "Unknown game." };
    if (!isPlausibleScore(normalizedGameId, raw)) {
      return { accepted: false, reason: "That score looks outside the normal range." };
    }

    const cleanName = setSavedPlayerName(playerName);
    if (!cleanName) return { accepted: false, reason: "Enter a player name." };

    const playerId = getPlayerId();
    const monthlyId = ensureCurrentMonth();
    const prizePoints = calculatePrizePoints(normalizedGameId, raw);
    const submittedAt = new Date().toISOString();
    const entry = {
      id: createId(),
      playerId,
      name: cleanName,
      playerName: cleanName,
      email: sanitizeText(email, 80),
      gameId: normalizedGameId,
      gameName: game.name,
      level: Number.isFinite(Number(level)) ? Math.max(1, Math.floor(Number(level))) : null,
      score: prizePoints,
      rawScore: raw,
      gameScore: raw,
      prizePoints,
      createdAt: submittedAt,
      submittedAt,
      monthlyId,
      leaderboardMode: LEADERBOARD_MODE,
      status: "",
    };

    const rows = loadMonthlyScores().filter((row) => row.playerId !== playerId);
    const previous = loadMonthlyScores().find((row) => row.playerId === playerId) || null;
    const accepted = !previous || prizePoints > Number(previous.prizePoints || 0)
      || (prizePoints === Number(previous.prizePoints || 0) && raw > Number(previous.rawScore || 0));

    if (accepted) {
      saveMonthlyScores(rows.concat(entry));
    }

    const bests = getPlayerBests(playerId);
    const gameBest = bests.games[normalizedGameId];
    if (!gameBest || prizePoints > Number(gameBest.prizePoints || 0) || (prizePoints === Number(gameBest.prizePoints || 0) && raw > Number(gameBest.rawScore || 0))) {
      bests.games[normalizedGameId] = entry;
    }
    if (!bests.overall || prizePoints > Number(bests.overall.prizePoints || 0)
      || (prizePoints === Number(bests.overall.prizePoints || 0) && raw > Number(bests.overall.rawScore || 0))) {
      bests.overall = entry;
    }
    savePlayerBests(playerId, bests);

    const leaderboard = getLeaderboard();
    const rankIndex = leaderboard.findIndex((row) => row.playerId === playerId);
    const nextRank = rankIndex > 0 ? leaderboard[rankIndex - 1] : null;
    const tenth = leaderboard[9] || null;

    return {
      accepted,
      entry,
      previous,
      leaderboard,
      rank: rankIndex >= 0 ? rankIndex + 1 : null,
      pointsToNextRank: nextRank ? Math.max(1, nextRank.prizePoints - prizePoints + 1) : 0,
      pointsToTop10: rankIndex >= 10 && tenth ? Math.max(1, tenth.prizePoints - prizePoints + 1) : 0,
      message: accepted ? "Score submitted." : "Good run. Your best submitted score is still higher.",
    };
  }

  function escapeHtml(value) {
    return sanitizeText(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[char]));
  }

  function formatNumber(value) {
    return new Intl.NumberFormat().format(Math.max(0, Math.floor(Number(value) || 0)));
  }

  function formatSubmittedAt(value) {
    const date = new Date(value || "");
    if (Number.isNaN(date.getTime())) return "Unknown";
    const day = date.getDate();
    const month = date.toLocaleString(undefined, { month: "short" });
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const suffix = date.getHours() >= 12 ? "pm" : "am";
    const hour = date.getHours() % 12 || 12;
    return `${day} ${month}, ${hour}:${minutes}${suffix}`;
  }

  function renderLeaderboardBody(tbody, limit = 10) {
    if (!tbody) return;
    const rows = getLeaderboard(limit);
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-state">
        <div class="leaderboard-empty-card">
          <strong>No scores yet. Start the first run.</strong>
          <button class="leaderboard-play-now" type="button">Play Now</button>
        </div>
      </td></tr>`;
      return;
    }
    const currentPlayerId = getPlayerId();
    tbody.innerHTML = rows.map((entry, index) => {
      const status = getPrizeStatus(index);
      const prizeClass = index === 0 ? "winner champion" : index < 10 ? "raffle" : "";
      const rowClass = `${prizeClass} ${entry.playerId === currentPlayerId ? "current-player" : ""}`.trim();
      const medal = index === 0 ? "Trophy " : index === 1 ? "Silver " : index === 2 ? "Bronze " : "";
      return `<tr class="${rowClass}">
        <td data-label="Rank">${medal}#${index + 1}</td>
        <td data-label="Player">${escapeHtml(entry.playerName || entry.name || "Player")}</td>
        <td data-label="Prize Points">${formatNumber(entry.prizePoints)} Prize Points</td>
        <td data-label="Game">${escapeHtml(entry.gameName || getGameConfig(entry.gameId)?.name || "Arcade")}</td>
        <td data-label="Submitted">${escapeHtml(formatSubmittedAt(entry.submittedAt || entry.createdAt))}</td>
        <td data-label="Status"><span class="status-badge ${index === 0 ? "champion" : index < 10 ? "raffle" : "standard"}">${status}</span></td>
      </tr>`;
    }).join("");
  }

  function renderPreview() {
    const list = document.getElementById("leaderboard-preview-list");
    if (list) {
      const rows = getLeaderboard(3);
      list.innerHTML = rows.length
        ? rows.map((entry, index) => `<li><strong>${index + 1}. ${escapeHtml(entry.playerName || "Player")}</strong><span>${formatNumber(entry.prizePoints)} Prize Points</span></li>`).join("")
        : '<li class="empty">No scores yet. Start the first run.</li>';
    }
    const reset = document.getElementById("leaderboard-reset-countdown");
    if (reset) reset.textContent = `Monthly giveaway ends in: ${getResetCountdown()}`;
  }

  function renderGameCardBests() {
    const bests = getPlayerBests();
    document.querySelectorAll("[data-best-game]").forEach((el) => {
      const gameId = normalizeGameId(el.dataset.bestGame);
      const best = bests.games[gameId];
      el.textContent = best ? `${formatNumber(best.prizePoints)} Points` : "0 Points";
    });
    document.querySelectorAll("[data-best-raw-game]").forEach((el) => {
      const gameId = normalizeGameId(el.dataset.bestRawGame);
      const best = bests.games[gameId];
      el.textContent = best ? formatNumber(best.rawScore) : "0";
    });
  }

  function renderAll() {
    document.querySelectorAll("#leaderboard-body").forEach((tbody) => renderLeaderboardBody(tbody, 10));
    renderPreview();
    renderGameCardBests();
  }

  function trackEvent(name, data = {}) {
    window.dispatchEvent(new CustomEvent("pti_arcade_event", { detail: { name, data, at: new Date().toISOString() } }));
  }

  window.PTIArcade = {
    KEYS,
    LEADERBOARD_MODE,
    GAME_SCORING,
    getPlayerId,
    getSavedPlayerName,
    setSavedPlayerName,
    sanitizePlayerName,
    sanitizeText,
    normalizeGameId,
    getGameConfig,
    calculatePrizePoints,
    getCurrentMonthId,
    getCurrentWeekId: getCurrentMonthId,
    getResetCountdown,
    getLeaderboard,
    submitScore,
    getPlayerBests,
    renderLeaderboardBody,
    renderAll,
    trackEvent,
    formatNumber,
    formatSubmittedAt,
  };

  document.addEventListener("DOMContentLoaded", () => {
    renderAll();
    trackEvent("arcade_home_view");
    document.querySelectorAll('a[href="#leaderboard-section"]').forEach((link) => {
      link.addEventListener("click", () => trackEvent("leaderboard_viewed"));
    });
    document.addEventListener("click", (event) => {
      const playNow = event.target.closest(".leaderboard-play-now");
      if (!playNow) return;
      trackEvent("play_again_clicked", { source: "leaderboard_empty" });
      const startButton = document.getElementById("start-button");
      if (startButton) {
        startButton.click();
      } else {
        window.location.href = "./index.html";
      }
    });
  });
})();
