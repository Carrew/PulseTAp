
/* =========================
   ELEMENTS
========================= */
const gameBox = document.getElementById("gameBox");
const message = document.getElementById("message");
const signalType = document.getElementById("signalType");

const startBtn = document.getElementById("startBtn");
const themeBtn = document.getElementById("themeBtn");
const resetBtn = document.getElementById("resetStats");

const xpBar = document.getElementById("xpBar");
const xpText = document.getElementById("xpText");
const levelEl = document.getElementById("level");

const crystalsEl = document.getElementById("crystals");
const bestEl = document.getElementById("best");
const avgEl = document.getElementById("average");
const attemptsEl = document.getElementById("attempts");

const streakEl = document.getElementById("streakCount");
const comboText = document.getElementById("comboText");

const reactionResult = document.getElementById("reactionResult");
const rankResult = document.getElementById("rankResult");

const historyList = document.getElementById("historyList");
const achievementsEl = document.getElementById("achievements");

const crateBtn = document.getElementById("crateBtn");
const crateResult = document.getElementById("crateResult");

const shareBtn = document.getElementById("shareBtn");
const soundBtn = document.getElementById("soundBtn");

/* =========================
   STATE
========================= */
let running = false;
let state = "idle";
let signal = null;

let startTime = 0;
let loopTimeout = null;
let missTimeout = null;

let combo = 0;
let streak = 0;

let speed = 1; // evolves over time

/* =========================
   DATA
========================= */
let data = JSON.parse(localStorage.getItem("pulsedata")) || {
  xp: 0,
  level: 1,
  crystals: 0,
  best: null,
  attempts: 0,
  totalTime: 0,
  history: [],
  achievements: []
};

/* =========================
   START / PAUSE
========================= */
startBtn.addEventListener("click", () => {

  running = !running;

  if(running){
    startBtn.textContent = "⏸ Pause";
    gameLoop();
  } else {
    startBtn.textContent = "▶ Play";
    clearTimeout(loopTimeout);
    clearTimeout(missTimeout);
    state = "idle";
  }

});

/* =========================
   MAIN GAME LOOP
========================= */
function gameLoop(){

  if(!running) return;

  state = "waiting";
  gameBox.className = "game-box waiting";

  message.textContent = "Stay ready...";
  signalType.textContent = "WAIT";

  let delay = (Math.random() * 1500 + 600) / speed;

  loopTimeout = setTimeout(() => {

    generateSignal();

    startTime = Date.now();

    // MISS WINDOW (pressure system)
    missTimeout = setTimeout(() => {

      if(state === "signal"){
        handleMiss();
        gameLoop();
      }

    }, Math.max(600, 1200 / speed));

  }, delay);
}

/* =========================
   SIGNAL GENERATOR
========================= */
function generateSignal(){

  let r = Math.random();

  if(r < 0.4) signal = "green";
  else if(r < 0.65) signal = "blue";
  else if(r < 0.85) signal = "red";
  else signal = "gold";

  state = "signal";

  switch(signal){

    case "green":
      signalType.textContent = "🟢 TAP";
      gameBox.className = "game-box ready";
      break;

    case "blue":
      signalType.textContent = "🔵 DOUBLE TAP";
      gameBox.className = "game-box double";
      break;

    case "red":
      signalType.textContent = "🔴 DON'T TAP";
      gameBox.className = "game-box danger";
      break;

    case "gold":
      signalType.textContent = "🟡 BONUS";
      gameBox.className = "game-box bonus";
      break;

  }

  vibrate(40);
}

/* =========================
   PLAYER ACTION
========================= */
gameBox.addEventListener("click", handleAction);

function handleAction(){

  if(state !== "signal") return;

  let reaction = Date.now() - startTime;

  let xpGain = 0;
  let correct = false;

  if(signal === "green"){
    xpGain = 5;
    correct = true;
  }

  else if(signal === "blue"){
    xpGain = 10;
    correct = true;
  }

  else if(signal === "red"){
    xpGain = -5;
    correct = false;
  }

  else if(signal === "gold"){
    xpGain = 20;
    data.crystals += 5;
    correct = true;
  }

  processResult(xpGain, reaction, correct);
}

/* =========================
   MISS SYSTEM
========================= */
function handleMiss(){

  combo = 0;
  streak = 0;

  vibrate(120);

  showPopup("⏱ Missed!");

  state = "result";
}

/* =========================
   RESULT ENGINE
========================= */
function processResult(xpGain, reaction, correct){

  state = "result";

  clearTimeout(missTimeout);

  data.xp += xpGain;
  data.attempts++;
  data.totalTime += reaction;

  if(correct){
    combo++;
    streak++;

    // combo scaling
    if(combo >= 3) data.xp += 10;
    if(combo >= 5) data.xp += 20;
    if(combo >= 10) data.xp += 50;

  } else {
    combo = 0;
    streak = 0;
  }

  if(!data.best || reaction < data.best){
    data.best = reaction;
  }

  data.history.unshift(reaction);
  if(data.history.length > 10) data.history.pop();

  // SPEED EVOLUTION (core upgrade)
  speed += 0.02;

  checkLevelUp();
  checkAchievements();
  save();

  showResult(reaction, correct);
  updateUI();
  renderHistory();

  setTimeout(() => {
    gameLoop();
  }, 500);

}

/* =========================
   LEVEL SYSTEM
========================= */
function checkLevelUp(){

  let req = data.level * 100;

  if(data.xp >= req){

    data.xp -= req;
    data.level++;

    data.crystals += 10;

    speed += 0.1;

    showPopup("⭐ Level Up!");
    vibrate([80,40,80]);

  }

}

/* =========================
   ACHIEVEMENTS
========================= */
function checkAchievements(){

  unlock("First Tap", data.attempts >= 1);
  unlock("Speed Demon", data.best && data.best < 200);
  unlock("Combo x5", combo >= 5);
  unlock("Survivor", speed > 2);
  unlock("Veteran", data.attempts >= 50);

}

function unlock(name, condition){

  if(!condition) return;

  if(!data.achievements.includes(name)){
    data.achievements.push(name);
    showPopup("🏆 " + name);
    renderAchievements();
  }

}

/* =========================
   UI
========================= */
function updateUI(){

  levelEl.textContent = data.level;
  crystalsEl.textContent = data.crystals;

  bestEl.textContent = data.best || "--";

  let avg = data.attempts
    ? Math.round(data.totalTime / data.attempts)
    : 0;

  avgEl.textContent = avg;
  attemptsEl.textContent = data.attempts;

  streakEl.textContent = streak;

  comboText.textContent = "⚡ COMBO x" + combo;

  let req = data.level * 100;
  let percent = (data.xp / req) * 100;

  xpBar.style.width = percent + "%";
  xpText.textContent = `${data.xp} / ${req} XP`;

}

/* =========================
   HISTORY
========================= */
function renderHistory(){

  historyList.innerHTML = "";

  data.history.forEach(t => {

    let div = document.createElement("div");
    div.className = "history-item";
    div.textContent = `${t} ms`;

    historyList.appendChild(div);

  });

}

/* =========================
   ACHIEVEMENTS UI
========================= */
function renderAchievements(){

  achievementsEl.innerHTML = "";

  data.achievements.forEach(a => {

    let div = document.createElement("div");
    div.className = "achievement-badge";
    div.textContent = a;

    achievementsEl.appendChild(div);

  });

}

/* =========================
   RESULT UI
========================= */
function showResult(time, correct){

  reactionResult.textContent = `${time} ms`;

  rankResult.textContent =
    correct ? "⚡ Clean Hit" : "❌ Mistake";

}

/* =========================
   CRATES
========================= */
crateBtn.addEventListener("click", () => {

  if(data.crystals < 50){
    crateResult.textContent = "Not enough crystals";
    return;
  }

  data.crystals -= 50;

  let roll = Math.random();

  if(roll < 0.4){
    data.xp += 25;
    crateResult.textContent = "+25 XP";
  }
  else if(roll < 0.7){
    data.xp += 50;
    crateResult.textContent = "+50 XP";
  }
  else if(roll < 0.9){
    data.crystals += 10;
    crateResult.textContent = "+10 Crystals";
  }
  else{
    combo = 2;
    crateResult.textContent = "Combo Shield!";
  }

  save();
  updateUI();

});

/* =========================
   SHARE
========================= */
shareBtn.addEventListener("click", () => {

  let text = `I survived PulseTap at Level ${data.level}! ⚡`;

  navigator.clipboard.writeText(text);

  showPopup("Copied!");

});

/* =========================
   SOUND (placeholder toggle)
========================= */
soundBtn.addEventListener("click", () => {

  soundBtn.textContent =
    soundBtn.textContent.includes("🔊")
      ? "🔇 Muted"
      : "🔊 Sound";

});

/* =========================
   RESET
========================= */
resetBtn.addEventListener("click", () => {

  localStorage.removeItem("pulsedata");
  location.reload();

});

/* =========================
   POPUP
========================= */
function showPopup(text){

  const popup = document.getElementById("popup");
  const popupText = document.getElementById("popupText");

  popupText.textContent = text;

  popup.classList.remove("hidden");

  setTimeout(() => {
    popup.classList.add("hidden");
  }, 1200);

}

/* =========================
   VIBRATION
========================= */
function vibrate(p){

  if(navigator.vibrate)
    navigator.vibrate(p);

}

/* =========================
   SAVE
========================= */
function save(){

  localStorage.setItem(
    "pulsedata",
    JSON.stringify(data)
  );

}

/* =========================
   INIT
========================= */
updateUI();
renderAchievements();
renderHistory();
