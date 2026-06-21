const box = document.getElementById("gameBox");
const message = document.getElementById("message");
const startBtn = document.getElementById("startBtn");
const timeDisplay = document.getElementById("time");
const bestDisplay = document.getElementById("best");

let startTime = 0;
let timeout = null;
let canClick = false;

let bestTime = localStorage.getItem("bestTime");

if (bestTime) {
  bestDisplay.textContent = bestTime;
}

function startGame() {
  reset();

  message.textContent = "Wait for green...";
  box.className = "box waiting";
  canClick = false;

  let delay = Math.random() * 3000 + 2000;

  timeout = setTimeout(() => {
    box.className = "box ready";
    message.textContent = "TAP NOW!";
    startTime = Date.now();
    canClick = true;
  }, delay);
}

function reset() {
  clearTimeout(timeout);
  timeDisplay.textContent = "--";
}

function handleClick() {
  if (!startTime && !canClick) return;

  if (!canClick) {
    box.className = "box tooSoon";
    message.textContent = "Too early!";
    clearTimeout(timeout);
    return;
  }

  let reactionTime = Date.now() - startTime;
  timeDisplay.textContent = reactionTime;

  canClick = false;
  startTime = 0;

  if (!bestTime || reactionTime < bestTime) {
    bestTime = reactionTime;
    localStorage.setItem("bestTime", bestTime);
    bestDisplay.textContent = bestTime;
  }

  message.textContent = "Click Start to try again";
  box.className = "box waiting";
}

startBtn.addEventListener("click", startGame);
box.addEventListener("click", handleClick);
