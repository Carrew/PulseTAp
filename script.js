
/* =========================
   ELEMENTS
========================= */
const box = document.getElementById("gameBox");
const message = document.getElementById("message");

const startBtn = document.getElementById("startBtn");
const resetStatsBtn = document.getElementById("resetStats");
const themeBtn = document.getElementById("themeBtn");

const timeDisplay = document.getElementById("time");
const bestDisplay = document.getElementById("best");
const averageDisplay = document.getElementById("average");
const attemptsDisplay = document.getElementById("attempts");

const reactionResult = document.getElementById("reactionResult");
const rankResult = document.getElementById("rankResult");

const streakCount = document.getElementById("streakCount");
const streakMsg = document.getElementById("streakMsg");

const historyList = document.getElementById("historyList");

const levelDisplay = document.getElementById("level");
const xpBar = document.getElementById("xpBar");
const xpText = document.getElementById("xpText");

const achievementsContainer = document.getElementById("achievements");

/* =========================
   GAME STATE
========================= */
let startTime = 0;
let timeout = null;
let canClick = false;

/* =========================
   LOCAL STORAGE DATA
========================= */
let bestTime = Number(localStorage.getItem("bestTime")) || null;

let attempts = Number(localStorage.getItem("attempts")) || 0;
let totalTime = Number(localStorage.getItem("totalTime")) || 0;

let history = JSON.parse(localStorage.getItem("history")) || [];

let streak = Number(localStorage.getItem("streak")) || 0;

let xp = Number(localStorage.getItem("xp")) || 0;
let level = Number(localStorage.getItem("level")) || 1;

let achievements = JSON.parse(localStorage.getItem("achievements")) || [];

let currentTheme = localStorage.getItem("theme") || "dark";

/* =========================
   INIT UI
========================= */
applyTheme();
updateStatsUI();
updateXPUI();
renderHistory();
renderAchievements();

/* =========================
   START GAME
========================= */
startBtn.addEventListener("click", startGame);

function startGame() {
  resetRound();

  message.textContent = "Wait for green...";
  box.className = "box waiting";

  canClick = false;

  let delay = Math.random() * 3000 + 1500;

  timeout = setTimeout(() => {
    box.className = "box ready";
    message.textContent = "TAP NOW!";
    startTime = Date.now();
    canClick = true;

    navigator.vibrate?.(50);
  }, delay);
}

/* =========================
   CLICK GAME AREA
========================= */
box.addEventListener("click", handleClick);

function handleClick() {
  if (!startTime && !canClick) return;

  if (!canClick) {
    box.className = "box tooSoon";
    message.textContent = "Too early!";

    streak = 0;
    saveStreak();
    updateStreakUI();

    clearTimeout(timeout);
    return;
  }

  let reactionTime = Date.now() - startTime;

  timeDisplay.textContent = reactionTime;

  // RESULT CARD
  reactionResult.textContent = `${reactionTime} ms`;
  rankResult.textContent = getRank(reactionTime);

  // STATS
  attempts++;
  totalTime += reactionTime;

  saveStats();

  // HISTORY
  history.unshift(reactionTime);
  if (history.length > 10) history.pop();
  localStorage.setItem("history", JSON.stringify(history));
  renderHistory();

  // BEST SCORE
  if (!bestTime || reactionTime < bestTime) {
    bestTime = reactionTime;
    localStorage.setItem("bestTime", bestTime);
  }

  // STREAK
  updateStreak(reactionTime);

  // XP
  addXP(reactionTime);

  // RESET ROUND
  canClick = false;
  startTime = 0;

  message.textContent = "Click Start to try again";
  box.className = "box waiting";

  updateStatsUI();
  updateXPUI();
}

/* =========================
   STREAK SYSTEM
========================= */
function updateStreak(time) {
  if (time < 250) {
    streak++;
  } else {
    streak = 0;
  }

  saveStreak();
  updateStreakUI();
}

function updateStreakUI() {
  streakCount.textContent = streak;

  if (streak >= 10) {
    streakMsg.textContent = "🔥 UNSTOPPABLE!";
  } else if (streak >= 5) {
    streakMsg.textContent = "⚡ ON FIRE!";
  } else if (streak >= 3) {
    streakMsg.textContent = "🚀 Building momentum...";
  } else {
    streakMsg.textContent = "Keep going...";
  }
}

function saveStreak() {
  localStorage.setItem("streak", streak);
}

/* =========================
   XP SYSTEM
========================= */
function addXP(time) {
  let gained = 5;

  if (time < 200) {
    gained += 10;
  }

  xp += gained;

  let required = level * 100;

  if (xp >= required) {
    xp -= required;
    level++;

    showLevelUp();
  }

  localStorage.setItem("xp", xp);
  localStorage.setItem("level", level);
}

function updateXPUI() {
  let required = level * 100;
  let percent = (xp / required) * 100;

  xpBar.style.width = `${percent}%`;
  xpText.textContent = `${xp} / ${required} XP`;
  levelDisplay.textContent = level;
}

function showLevelUp() {
  alert(`Level Up! You are now Level ${level}`);
  navigator.vibrate?.([100, 50, 100]);
}

/* =========================
   RANK SYSTEM
========================= */
function getRank(time) {
  if (time < 150) return "⚡ Lightning";
  if (time < 200) return "🔥 Elite";
  if (time < 250) return "🚀 Fast";
  if (time < 300) return "👍 Good";
  return "🌱 Beginner";
}

/* =========================
   HISTORY
========================= */
function renderHistory() {
  historyList.innerHTML = "";

  history.forEach(t => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.textContent = `${t} ms`;
    historyList.appendChild(div);
  });
}

/* =========================
   STATS
========================= */
function saveStats() {
  localStorage.setItem("attempts", attempts);
  localStorage.setItem("totalTime", totalTime);
}

function updateStatsUI() {
  attemptsDisplay.textContent = attempts;

  bestDisplay.textContent = bestTime || "--";

  averageDisplay.textContent =
    attempts > 0
      ? Math.round(totalTime / attempts)
      : "--";
}

/* =========================
   ACHIEVEMENTS
========================= */
function unlockAchievement(name) {
  if (achievements.includes(name)) return;

  achievements.push(name);

  localStorage.setItem(
    "achievements",
    JSON.stringify(achievements)
  );

  renderAchievements();
}

function renderAchievements() {
  achievementsContainer.innerHTML = "";

  achievements.forEach(a => {
    const div = document.createElement("div");
    div.className = "achievement-badge";
    div.textContent = a;
    achievementsContainer.appendChild(div);
  });
}

/* =========================
   THEME SYSTEM
========================= */
const themes = ["dark", "light", "neon"];

themeBtn.addEventListener("click", () => {
  document.body.classList.remove(
    "theme-dark",
    "theme-light",
    "theme-neon"
  );

  let index = themes.indexOf(currentTheme);
  currentTheme = themes[(index + 1) % themes.length];

  applyTheme();

  localStorage.setItem("theme", currentTheme);
});

function applyTheme() {
  document.body.classList.add(`theme-${currentTheme}`);
}

/* =========================
   RESET
========================= */
resetStatsBtn.addEventListener("click", () => {
  localStorage.clear();
  location.reload();
});

/* =========================
   ROUND RESET
========================= */
function resetRound() {
  clearTimeout(timeout);
  timeDisplay.textContent = "--";
    }
