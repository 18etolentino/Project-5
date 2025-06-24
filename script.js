const game = document.getElementById('game');
const player = document.getElementById('player');
const jerrycan = document.getElementById('water-level');

const lanes = [80, 160, 240];
let currentLane = 1;
let waterLevel = 0;

player.style.left = lanes[currentLane] + 'px';

let gameInterval = null;
let gamePaused = true;
const startPauseBtn = document.getElementById('start-pause-btn');
const restartBtn = document.getElementById('restart-btn');

// Track all active items and their intervals
let activeItems = [];

let timer = 10;
let timerInterval = null;
const timerDisplay = document.getElementById('timer');
let finishLineActive = false;
let finishLineReleased = false;
let finishLineObj = null;

function spawnItem() {
  if (finishLineActive || finishLineReleased) return;
  const item = document.createElement('div');
  const lane = Math.floor(Math.random() * 3);
  const types = ['clean', 'contaminated', 'obstacle'];
  const type = types[Math.floor(Math.random() * types.length)];
  item.classList.add('item', type);
  item.style.left = lanes[lane] + 'px';
  game.appendChild(item);
  let position = 0;
  const speed = 4;
  function moveItem() {
    position += speed;
    item.style.top = position + 'px';
    const itemRect = item.getBoundingClientRect();
    const playerRect = player.getBoundingClientRect();
    const overlapping =
      itemRect.bottom >= playerRect.top &&
      itemRect.left === playerRect.left;
    if (overlapping) {
      handleCollision(item);
      clearInterval(interval);
      activeItems = activeItems.filter(obj => obj.item !== item);
      item.remove();
    }
    if (position > 600) {
      clearInterval(interval);
      activeItems = activeItems.filter(obj => obj.item !== item);
      item.remove();
    }
  }
  let interval = setInterval(moveItem, 50);
  activeItems.push({item, moveItem, position, interval, speed});
}

function spawnFinishLine() {
  if (finishLineReleased) return;
  finishLineActive = true;
  finishLineReleased = true;
  const finishLine = document.createElement('div');
  finishLine.className = 'finish-line-item';
  finishLine.textContent = 'FINISH';
  finishLine.style.top = '-40px';
  game.appendChild(finishLine);
  let position = -40;
  const speed = 4;
  let finished = false;
  function moveFinishLine() {
    if (finished) return;
    position += speed;
    finishLine.style.top = position + 'px';
    if (finishLineObj) finishLineObj.position = position;
    const finishRect = finishLine.getBoundingClientRect();
    const playerRect = player.getBoundingClientRect();
    const overlapping =
      finishRect.bottom >= playerRect.top &&
      finishRect.left < playerRect.right &&
      finishRect.right > playerRect.left;
    if (overlapping) {
      finished = true;
      if (finishLineObj && finishLineObj.interval) clearInterval(finishLineObj.interval);
      finishLine.remove();
      finishLineObj = null;
      stopGameCompletely();
      return;
    }
    if (position > 600) {
      finished = true;
      if (finishLineObj && finishLineObj.interval) clearInterval(finishLineObj.interval);
      finishLine.remove();
      finishLineObj = null;
      stopGameCompletely();
      return;
    }
  }
  let interval = setInterval(moveFinishLine, 50);
  finishLineObj = {elem: finishLine, position, speed, interval, move: moveFinishLine};
}

function pauseAllItems() {
  activeItems.forEach(obj => {
    clearInterval(obj.interval);
    obj.interval = null;
  });
  if (finishLineObj && finishLineObj.interval) {
    clearInterval(finishLineObj.interval);
    finishLineObj.interval = null;
  }
}

function resumeAllItems() {
  activeItems.forEach(obj => {
    if (!obj.interval) {
      obj.interval = setInterval(() => {
        obj.position += obj.speed;
        obj.item.style.top = obj.position + 'px';
        const itemRect = obj.item.getBoundingClientRect();
        const playerRect = player.getBoundingClientRect();
        const overlapping =
          itemRect.bottom >= playerRect.top &&
          itemRect.left === playerRect.left;
        if (overlapping) {
          handleCollision(obj.item);
          clearInterval(obj.interval);
          activeItems = activeItems.filter(o => o.item !== obj.item);
          obj.item.remove();
        }
        if (obj.position > 600) {
          clearInterval(obj.interval);
          activeItems = activeItems.filter(o => o.item !== obj.item);
          obj.item.remove();
        }
      }, 50);
    }
  });
  if (finishLineObj && !finishLineObj.interval) {
    finishLineObj.interval = setInterval(() => {
      finishLineObj.position += finishLineObj.speed;
      finishLineObj.elem.style.top = finishLineObj.position + 'px';
      const finishRect = finishLineObj.elem.getBoundingClientRect();
      const playerRect = player.getBoundingClientRect();
      const overlapping =
        finishRect.bottom >= playerRect.top &&
        finishRect.left < playerRect.right &&
        finishRect.right > playerRect.left;
      if (overlapping) {
        clearInterval(finishLineObj.interval);
        finishLineObj.elem.remove();
        finishLineObj = null;
        stopGameCompletely();
      }
      if (finishLineObj.position > 600) {
        clearInterval(finishLineObj.interval);
        finishLineObj.elem.remove();
        finishLineObj = null;
        stopGameCompletely();
      }
    }, 50);
  }
}

function disablePlayerMovement() {
  document.removeEventListener('keydown', playerMoveHandler);
}
function enablePlayerMovement() {
  document.addEventListener('keydown', playerMoveHandler);
}

function playerMoveHandler(e) {
  if (gamePaused) return;
  if (e.key === 'ArrowLeft' && currentLane > 0) {
    currentLane--;
    player.style.left = lanes[currentLane] + 'px';
  } else if (e.key === 'ArrowRight' && currentLane < 2) {
    currentLane++;
    player.style.left = lanes[currentLane] + 'px';
  }
}
disablePlayerMovement();

function handleCollision(item) {
  if (item.classList.contains('clean')) {
    waterLevel = Math.min(100, waterLevel + 10);
  } else if (item.classList.contains('contaminated')) {
    waterLevel = Math.max(0, waterLevel - 10);
  }
  jerrycan.style.height = waterLevel + '%';
}

function endGame() {
  spawnFinishLine();
}

function stopGameCompletely() {
  // Stop all item intervals
  activeItems.forEach(obj => {
    if (obj.interval) clearInterval(obj.interval);
    obj.item.remove();
  });
  activeItems = [];
  // Stop finish line interval if any
  if (typeof finishLineObj !== 'undefined' && finishLineObj && finishLineObj.interval) {
    clearInterval(finishLineObj.interval);
    if (finishLineObj.elem) finishLineObj.elem.remove();
    finishLineObj = null;
  }
  // Stop game logic
  pauseGame();
  stopTimer();
  finishLineActive = false;
  startPauseBtn.disabled = true;
  restartBtn.disabled = false;
  disablePlayerMovement();
  showEndModal();
}

function showEndModal() {
  const modal = document.getElementById('end-modal');
  const message = document.getElementById('end-message');
  const newGameBtn = document.getElementById('new-game-btn');
  const charityLink = document.getElementById('charity-link');
  if (waterLevel === 100) {
    message.textContent = 'Well done! Clean water reached the village.';
  } else {
    message.textContent = 'Try again! The jerrycan was not full.';
  }
  modal.style.display = 'flex';
  newGameBtn.onclick = () => {
    modal.style.display = 'none';
    resetGame();
    startGame();
  };
  charityLink.onclick = () => {
    window.open('https://www.charitywater.org/', '_blank');
  };
}

function startTimer() {
  timer = 10;
  timerDisplay.textContent = timer;
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!gamePaused) {
      timer--;
      timerDisplay.textContent = timer;
      if (timer <= 0) {
        endGame();
      }
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
}

function startGame() {
  if (!gameInterval) {
    gameInterval = setInterval(spawnItem, 1000);
  }
  gamePaused = false;
  startPauseBtn.textContent = 'Pause';
  resumeAllItems();
  enablePlayerMovement();
  startTimer();
}

function pauseGame() {
  if (gameInterval) {
    clearInterval(gameInterval);
    gameInterval = null;
  }
  gamePaused = true;
  startPauseBtn.textContent = 'Start';
  pauseAllItems();
  disablePlayerMovement();
}

function resetGame() {
  activeItems.forEach(obj => {
    if (obj.interval) clearInterval(obj.interval);
    obj.item.remove();
  });
  activeItems = [];
  currentLane = 1;
  player.style.left = lanes[currentLane] + 'px';
  waterLevel = 0;
  jerrycan.style.height = waterLevel + '%';
  pauseGame();
  stopTimer();
  timerDisplay.textContent = 10;
  finishLineActive = false;
  finishLineReleased = false;
  startPauseBtn.disabled = false;
  restartBtn.disabled = false;
  if (finishLineObj && finishLineObj.interval) clearInterval(finishLineObj.interval);
  if (finishLineObj && finishLineObj.elem) finishLineObj.elem.remove();
  finishLineObj = null;
}

startPauseBtn.addEventListener('click', () => {
  if (gamePaused) {
    startGame();
  } else {
    pauseGame();
  }
});

restartBtn.addEventListener('click', () => {
  resetGame();
  startGame();
});
