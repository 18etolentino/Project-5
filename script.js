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

function spawnItem() {
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

function pauseAllItems() {
  activeItems.forEach(obj => {
    clearInterval(obj.interval);
    obj.interval = null;
  });
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

function startGame() {
  if (!gameInterval) {
    gameInterval = setInterval(spawnItem, 1000);
  }
  gamePaused = false;
  startPauseBtn.textContent = 'Pause';
  resumeAllItems();
  enablePlayerMovement();
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
