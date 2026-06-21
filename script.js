
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
   GAME STATE
========================= */
let state = "idle";
let signal = null;
let startTime = 0;
let timeout = null;

let combo = 0;
let streak = 0;

let soundOn = true;

/* =========================
   PLAYER DATA
========================= */
let data = JSON.parse(localStorage.getItem("pulsedata")) || {
  xp: 0,
  level: 1,
  crystals: 0,
  best: null,
  attempts: 0,
  totalTime: 0,
  history: [],
  achievements: [],
  crates: 0
};

/* =========================
   INIT
========================= */
updateUI();
renderAchievements();

/* =========================
   START GAME LOOP
========================= */
startBtn.addEventListener("click", startGame);

function startGame() {
  if (state !== "idle") return;

  state = "waiting";
  message.textContent = "Get ready...";
  signalType.textContent = "WAIT";

  gameBox.className = "game-box waiting";

  let delay = Math.random() * 2500 + 1200;

  timeout = setTimeout(() => {
    generateSignal();
  }, delay);
}

/* =========================
   SIGNAL SYSTEM
========================= */
function generateSignal() {
  let rand = Math.random();

  if (rand < 0.4) signal = "green";
  else if (rand < 0.65) signal = "blue";
  else if (rand < 0.85) signal = "red";
  else signal = "gold";

  state = "signal";
  startTime = Date.now();

  switch(signal){
    case "green":
      signalType.textContent = "🟢 TAP!";
      gameBox.className = "game-box ready";
      break;

    case "blue":
      signalType.textContent = "🔵 DOUBLE TAP!";
      gameBox.className = "game-box double";
      break;

    case "red":
      signalType.textContent = "🔴 DON'T TAP!";
      gameBox.className = "game-box danger";
      break;

    case "gold":
      signalType.textContent = "🟡 BONUS!";
      gameBox.className = "game-box bonus";
      break;
  }

  vibrate(50);
}

/* =========================
   GAME CLICK
========================= */
gameBox.addEventListener("click", handleAction);

function handleAction(){

  if(state !== "signal") return;

  let reaction = Date.now() - startTime;

  let reward = 0;
  let correct = false;

  // GREEN
  if(signal === "green"){
    reward = 5;
    correct = true;
    showResult(reaction, "⚡ Good");
  }

  // BLUE
  else if(signal === "blue"){
    reward = 10;
    correct = true;
    showResult(reaction, "🔥 Perfect");
  }

  // RED (DON'T TAP)
  else if(signal === "red"){
    reward = 8;
    correct = false;
    penalty("Wrong Tap!");
  }

  // GOLD
  else if(signal === "gold"){
    reward = 20;
    data.crystals += 5;
    correct = true;
    showResult(reaction, "💎 Bonus!");
  }

  applyReward(reward, reaction, correct);
}

/* =========================
   REWARD ENGINE
========================= */
function applyReward(xpGain, reaction, correct){

  state = "result";

  data.xp += xpGain;
  data.attempts++;
  data.totalTime += reaction;

  if(correct){
    combo++;
    streak++;
  } else {
    combo = 0;
    streak = 0;
  }

  if(combo >= 3) data.xp += 10;
  if(combo >= 5) data.xp += 20;
  if(combo >= 10) data.xp += 50;

  if(data.best === null || reaction < data.best){
    data.best = reaction;
  }

  data.history.unshift(reaction);
  if(data.history.length > 10) data.history.pop();

  checkLevelUp();
  checkAchievements();
  save();

  updateUI();
  renderHistory();

  setTimeout(resetRound, 900);
}

/* =========================
   PENALTY
========================= */
function penalty(text){
  combo = 0;
  streak = 0;
  vibrate(120);
  showPopup("❌ " + text);
}

/* =========================
   LEVEL SYSTEM
========================= */
function checkLevelUp(){

  let required = data.level * 100;

  if(data.xp >= required){
    data.xp -= required;
    data.level++;

    data.crystals += 10;

    showPopup("⭐ Level Up!");
    vibrate([80,50,80]);
  }
}

/* =========================
   ACHIEVEMENTS
========================= */
function checkAchievements(){

  unlock("First Steps", data.attempts >= 1);
  unlock("Speed Runner", data.best && data.best < 200);
  unlock("Combo x5", combo >= 5);
  unlock("Crystal Collector", data.crystals >= 50);
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
   CRATE SYSTEM
========================= */
crateBtn.addEventListener("click", openCrate);

function openCrate(){

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
    combo = 1;
    crateResult.textContent = "Combo Shield!";
  }

  save();
  updateUI();
}

/* =========================
   UI SYSTEM
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
   RESET
========================= */
resetBtn.addEventListener("click", () => {

  localStorage.removeItem("pulsedata");
  location.reload();

});

/* =========================
   SHARE
========================= */
shareBtn.addEventListener("click", () => {

  let text = `I scored ${data.best || 0}ms on PulseTap ⚡`;

  navigator.clipboard.writeText(text);

  showPopup("Copied!");
});

/* =========================
   SOUND TOGGLE
========================= */
soundBtn.addEventListener("click", () => {

  soundOn = !soundOn;
  soundBtn.textContent = soundOn ? "🔊 Sound" : "🔇 Muted";

});

/* =========================
   HELPERS
========================= */
function showResult(time, text){

  reactionResult.textContent = `${time} ms`;
  rankResult.textContent = text;

}

function resetRound(){

  state = "idle";
  signal = null;

  gameBox.className = "game-box waiting";
  signalType.textContent = "Ready";
  message.textContent = "Press Play";

}

function showPopup(text){

  const popup = document.getElementById("popup");
  const popupText = document.getElementById("popupText");

  popupText.textContent = text;

  popup.classList.remove("hidden");

  setTimeout(() => {
    popup.classList.add("hidden");
  }, 1200);

}

function vibrate(pattern){
  if(!navigator.vibrate) return;
  navigator.vibrate(pattern);
}

/* =========================
   SAVE
========================= */
function save(){
  localStorage.setItem("pulsedata", JSON.stringify(data));
     }
