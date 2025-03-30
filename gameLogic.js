// DOM elements
const gameBoard = document.getElementById("gameBoard");
const ctx = gameBoard.getContext("2d");
const scoreText = document.getElementById("score");
const highScoreElem = document.getElementById("highScore");
const resetButton = document.getElementById("resetButton");
const soundToggleBtn = document.getElementById("soundToggle");
const themeToggleBtn = document.getElementById("themeToggle");
const leaderboardBtn = document.getElementById("viewLeaderboard");
const leaderboardModal = document.getElementById("leaderboardModal");
const closeModalBtn = document.querySelector(".close-modal");
const leaderboardList = document.getElementById("leaderboardList");

// Game settings
const gameWidth = gameBoard.width;
const gameHeight = gameBoard.height;
const unitSize = 25;

// Game variables
let boardBackground, gridColor, snakeBodyColor, snakeHeadColor, snakeBorder, foodColor, foodGlowColor;
let gameLoop;
let running = false;
let paused = false;
let xVelocity = unitSize;
let yVelocity = 0;
let Xfood, Yfood;
let score = 0;
let highScores = [];
let speed = 100;
let snake = [
  {x: unitSize * 4, y: 0},
  {x: unitSize * 3, y: 0},
  {x: unitSize * 2, y: 0},
  {x: unitSize, y: 0},
  {x: 0, y: 0}
];

// Theme & sound settings
let currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
let soundEnabled = true;
let eatSound, gameOverSound;

// Event listeners
window.addEventListener("keydown", changeDirection);
resetButton.addEventListener("click", resetGame);
soundToggleBtn.addEventListener("click", toggleSound);
themeToggleBtn.addEventListener("click", toggleTheme);
leaderboardBtn.addEventListener("click", openLeaderboard);
closeModalBtn.addEventListener("click", closeLeaderboard);
document.addEventListener("DOMContentLoaded", setupGame);

// Mobile controls
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
  document.querySelectorAll('.touchBtn').forEach(btn => {
    btn.addEventListener('touchstart', handleTouchControls);
  });
}

// Close leaderboard 
window.addEventListener("click", (event) => {
  if (event.target === leaderboardModal) {
    closeLeaderboard();
  }
});

function setupGame() {
  loadHighScores();
  updateGameColors();
  
  // Sounds
  eatSound = new Audio('https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3');
  gameOverSound = new Audio('https://assets.mixkit.co/active_storage/sfx/240/240-preview.mp3');
  eatSound.volume = 0.3;
  gameOverSound.volume = 0.2;
  
  gameStart();
}

function gameStart() {
  running = true;
  paused = false;
  scoreText.textContent = score;
  createFood();
  clearBoard();
  drawGrid();
  drawFood();
  drawSnake();
  nextTick();
}

function updateGameColors() {
  if (currentTheme === 'dark') {
    boardBackground = "#0F0F1B";
    gridColor = "rgba(125, 249, 255, 0.1)";
    snakeBodyColor = "#50C5B7";
    snakeHeadColor = "#7DF9FF";
    snakeBorder = "#084C61";
    foodColor = "#FF6B6B";
    foodGlowColor = "rgba(255, 107, 107, 0.7)";
  } else {
    boardBackground = "#ffffff";
    gridColor = "rgba(128, 0, 128, 0.1)";
    snakeBodyColor = "#9370DB";
    snakeHeadColor = "#8A2BE2";
    snakeBorder = "#5E35B1";
    foodColor = "#D8336E";
    foodGlowColor = "rgba(216, 51, 110, 0.7)";
  }
  
  // Redraw game 
  if (gameBoard) {
    clearBoard();
    drawGrid();
    if (typeof Xfood !== 'undefined') drawFood();
    if (snake && snake.length > 0) drawSnake();
    
    if (paused) displayPaused();
    else if (!running) displayGameOver();
  }
}

function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  
  themeToggleBtn.innerHTML = currentTheme === 'dark' 
    ? '<span class="theme-icon">🌙</span> Dark'
    : '<span class="theme-icon">☀️</span> Light';
  
  updateGameColors();
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  soundToggleBtn.textContent = soundEnabled ? "🔊 Sound ON" : "🔇 Sound OFF";
  soundToggleBtn.classList.toggle("muted", !soundEnabled);
}

// Main game loop
function nextTick() {
  if (running && !paused) {
    clearTimeout(gameLoop);
    gameLoop = setTimeout(() => {
      clearBoard();
      drawGrid();
      drawFood();
      moveSnake();
      drawSnake();
      checkGameOver();
      
      if (running) nextTick();
      else displayGameOver();
    }, speed);
  } else if (paused && running) {
    displayPaused();
  } else {
    displayGameOver();
  }
}

function clearBoard() {
  ctx.fillStyle = boardBackground;
  ctx.fillRect(0, 0, gameWidth, gameHeight);
}

function drawGrid() {
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 0.5;

  // Grid lines
  for (let x = 0; x <= gameWidth; x += unitSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, gameHeight);
    ctx.stroke();
  }

  for (let y = 0; y <= gameHeight; y += unitSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(gameWidth, y);
    ctx.stroke();
  }
}

function createFood() {
  function randomFood(min, max) {
    return Math.round((Math.random() * (max - min) + min) / unitSize) * unitSize;
  }

  let foodCreated = false;
  while (!foodCreated) {
    Xfood = randomFood(0, gameWidth - unitSize);
    Yfood = randomFood(0, gameHeight - unitSize);

    // Food isn't behind snake 
    let foodOnSnake = snake.some(segment => segment.x === Xfood && segment.y === Yfood);
    if (!foodOnSnake) foodCreated = true;
  }
}

function drawFood() {
  // Glow effect
  ctx.shadowColor = foodGlowColor;
  ctx.shadowBlur = 10;
  
  ctx.fillStyle = foodColor;
  ctx.beginPath();
  ctx.roundRect(Xfood, Yfood, unitSize, unitSize, [8]);
  ctx.fill();
  
  ctx.shadowBlur = 0;
  
  // Shine effect
  const gradient = ctx.createLinearGradient(
    Xfood, Yfood, 
    Xfood + unitSize, Yfood + unitSize
  );
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.7)");
  gradient.addColorStop(0.5, "rgba(255, 255, 255, 0)");
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(Xfood + 5, Yfood + 5, unitSize - 10, unitSize - 10, [4]);
  ctx.fill();
}

function drawSnake() {
  snake.forEach((segment, index) => {
    // Fade effect for tail
    const alpha = Math.max(0.5, 1 - (index / (snake.length + 5)));
    
    if (index === 0) {
      // Head
      ctx.fillStyle = snakeHeadColor;
      ctx.shadowColor = snakeHeadColor;
      ctx.shadowBlur = 5;
    } else {
      // Body 
      const r = parseInt(snakeBodyColor.slice(1, 3), 16);
      const g = parseInt(snakeBodyColor.slice(3, 5), 16);
      const b = parseInt(snakeBodyColor.slice(5, 7), 16);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.shadowBlur = 0;
    }

    ctx.beginPath();
    const radius = index === 0 ? 10 : 8;
    ctx.roundRect(segment.x, segment.y, unitSize, unitSize, [radius]);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    ctx.strokeStyle = snakeBorder;
    ctx.lineWidth = 1;
    ctx.stroke();

    if (index === 0) drawEyes(segment);
  });
}

function drawEyes(head) {
  ctx.fillStyle = "#083D77";
  const eyeSize = unitSize / 5;

  let eye1X, eye1Y, eye2X, eye2Y;

  // Eyes based on direction
  if (xVelocity > 0) { 
    eye1X = head.x + unitSize - eyeSize * 2.5;
    eye1Y = head.y + eyeSize * 1.5;
    eye2X = head.x + unitSize - eyeSize * 2.5;
    eye2Y = head.y + unitSize - eyeSize * 1.5;
  } else if (xVelocity < 0) {
    eye1X = head.x + eyeSize * 1.5;
    eye1Y = head.y + eyeSize * 1.5;
    eye2X = head.x + eyeSize * 1.5;
    eye2Y = head.y + unitSize - eyeSize * 1.5;
  } else if (yVelocity > 0) { 
    eye1X = head.x + eyeSize * 1.5;
    eye1Y = head.y + unitSize - eyeSize * 2.5;
    eye2X = head.x + unitSize - eyeSize * 1.5;
    eye2Y = head.y + unitSize - eyeSize * 2.5;
  } else if (yVelocity < 0) {
    eye1X = head.x + eyeSize * 1.5;
    eye1Y = head.y + eyeSize * 1.5;
    eye2X = head.x + unitSize - eyeSize * 1.5;
    eye2Y = head.y + eyeSize * 1.5;
  }

  // Draw the eyes
  ctx.beginPath();
  ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
  ctx.fill();
  
  // Highlights
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(eye1X - eyeSize/3, eye1Y - eyeSize/3, eyeSize/3, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(eye2X - eyeSize/3, eye2Y - eyeSize/3, eyeSize/3, 0, Math.PI * 2);
  ctx.fill();
}

function moveSnake() {
  // Create new head
  const head = {
    x: snake[0].x + xVelocity,
    y: snake[0].y + yVelocity
  };

  snake.unshift(head);
  
  // Check if snake ate food
  if (snake[0].x === Xfood && snake[0].y === Yfood) {
    // Play sound
    if (soundEnabled) {
      try {
        eatSound.currentTime = 0;
        eatSound.play().catch(e => console.log("Audio error:", e));
      } catch (e) {
        console.log("Audio error:", e);
      }
    }
    
    // Increase score
    score++;
    scoreText.textContent = score;
    
    // Speed up every 5 points
    if (score % 5 === 0 && speed > 50) {
      speed -= 5;
    }
    
    createFood();
  } else {
    // Remove tail if no food eaten
    snake.pop();
  }
}

function checkGameOver() {
  let gameOver = false;
  
  // Check wall collision
  if (snake[0].x < 0 || snake[0].x >= gameWidth || 
      snake[0].y < 0 || snake[0].y >= gameHeight) {
    gameOver = true;
  }
  
  // Check self collision
  for (let i = 1; i < snake.length; i++) {
    if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) {
      gameOver = true;
      break;
    }
  }
  
  if (gameOver) {
    running = false;
    paused = false;
    
    // Save high score
    if (score > 0) {
      addHighScore(score);
    }
    
    // Game over sound
    if (soundEnabled) {
      try {
        gameOverSound.currentTime = 0;
        gameOverSound.play().catch(e => console.log("Audio error:", e));
      } catch (e) {
        console.log("Audio error:", e);
      }
    }
  }
}

function changeDirection(event) {
  const keyPressed = event.keyCode;

  // Key codes
  const LEFT = 37, UP = 38, RIGHT = 39, DOWN = 40;
  const W = 87, A = 65, S = 83, D = 68;
  const SPACE = 32;

  // Prevent scrolling
  if ([LEFT, UP, RIGHT, DOWN, SPACE].includes(keyPressed)) {
    event.preventDefault();
  }

  // Current direction
  const goingUp = (yVelocity == -unitSize);
  const goingDown = (yVelocity == unitSize);
  const goingRight = (xVelocity == unitSize);
  const goingLeft = (xVelocity == -unitSize);

  // Pause
  if (keyPressed == SPACE) {
    togglePause();
    return;
  }

 
  if (paused) return;

  // Change direction 
  switch(true) {
    case((keyPressed == LEFT || keyPressed == A) && !goingRight):
      xVelocity = -unitSize;
      yVelocity = 0;
      break;
    case((keyPressed == RIGHT || keyPressed == D) && !goingLeft):
      xVelocity = unitSize;
      yVelocity = 0;
      break;
    case((keyPressed == UP || keyPressed == W) && !goingDown):
      xVelocity = 0;
      yVelocity = -unitSize;
      break;
    case((keyPressed == DOWN || keyPressed == S) && !goingUp):
      xVelocity = 0;
      yVelocity = unitSize;
      break;
  }
}

function handleTouchControls(event) {
  const buttonId = event.target.id;
  
  const goingUp = (yVelocity == -unitSize);
  const goingDown = (yVelocity == unitSize);
  const goingRight = (xVelocity == unitSize);
  const goingLeft = (xVelocity == -unitSize);
  
  if (paused) return;
  
  switch(buttonId) {
    case "leftBtn":
      if (!goingRight) {
        xVelocity = -unitSize;
        yVelocity = 0;
      }
      break;
    case "rightBtn":
      if (!goingLeft) {
        xVelocity = unitSize;
        yVelocity = 0;
      }
      break;
    case "upBtn":
      if (!goingDown) {
        xVelocity = 0;
        yVelocity = -unitSize;
      }
      break;
    case "downBtn":
      if (!goingUp) {
        xVelocity = 0;
        yVelocity = unitSize;
      }
      break;
  }
  
  event.preventDefault();
}

function togglePause() {
  paused = !paused;
  if (!paused) {
    nextTick();
  }
}

function displayPaused() {
  ctx.font = "bold 40px Poppins";
  ctx.fillStyle = snakeHeadColor;
  ctx.textAlign = "center";
  ctx.fillText("PAUSED", gameWidth / 2, gameHeight / 2);
  ctx.font = "20px Poppins";
  ctx.fillText("Press Space to continue", gameWidth / 2, gameHeight / 2 + 40);
}

function displayGameOver() {
  ctx.font = "bold 50px Poppins";
  ctx.fillStyle = foodColor;
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER!", gameWidth / 2, gameHeight / 2 - 40);
  
  ctx.font = "30px Poppins";
  ctx.fillStyle = snakeHeadColor;
  ctx.fillText(`Score: ${score}`, gameWidth / 2, gameHeight / 2 + 10);
  
  // High score message
  let scoreMessage = "Try again to beat the high score!";
  if (highScores.length > 0 && score >= highScores[0].score) {
    scoreMessage = "New High Score!";
    ctx.fillStyle = "#FFD700";
  }
  ctx.font = "20px Poppins";
  ctx.fillText(scoreMessage, gameWidth / 2, gameHeight / 2 + 50);
  
  ctx.font = "20px Poppins";
  ctx.fillStyle = "white";
  ctx.fillText("Press Reset to play again", gameWidth / 2, gameHeight / 2 + 90);
}

function resetGame() {
  score = 0;
  speed = 100;
  xVelocity = unitSize;
  yVelocity = 0;
  snake = [
    {x: unitSize * 4, y: 0},
    {x: unitSize * 3, y: 0},
    {x: unitSize * 2, y: 0},
    {x: unitSize, y: 0},
    {x: 0, y: 0}
  ];
  
  gameStart();
}

// High score functions
function loadHighScores() {
  const savedScores = localStorage.getItem('snakeHighScores');
  highScores = savedScores ? JSON.parse(savedScores) : [];
  updateHighScoreDisplay();
}

function saveHighScores() {
  localStorage.setItem('snakeHighScores', JSON.stringify(highScores));
}

function updateHighScoreDisplay() {
  if (!highScoreElem) return;
  const topScore = highScores.length > 0 ? highScores[0].score : 0;
  highScoreElem.textContent = topScore;
}

function addHighScore(newScore) {
  const scoreEntry = {
    score: newScore,
    date: new Date().toLocaleDateString()
  };
  
  highScores.push(scoreEntry);
  highScores.sort((a, b) => b.score - a.score);
  
  // Keep top 10 scores
  if (highScores.length > 10) {
    highScores = highScores.slice(0, 10);
  }
  
  saveHighScores();
  updateHighScoreDisplay();
}

// Leaderboard functions
function openLeaderboard() {
  updateLeaderboard();
  leaderboardModal.style.display = "block";
}

function closeLeaderboard() {
  leaderboardModal.style.display = "none";
}

function updateLeaderboard() {
  if (!leaderboardList) return;
  
  leaderboardList.innerHTML = '';
  
  if (highScores.length === 0) {
    const emptyItem = document.createElement('li');
    emptyItem.textContent = 'No scores yet!';
    leaderboardList.appendChild(emptyItem);
    return;
  }
  
  highScores.forEach((scoreEntry, index) => {
    const item = document.createElement('li');
    item.className = 'score-item';
    item.innerHTML = `
      <span class="score-rank">${index + 1}</span>
      <span class="score-value">${scoreEntry.score}</span>
      <span class="score-date">${scoreEntry.date}</span>
    `;
    leaderboardList.appendChild(item);
  });
}