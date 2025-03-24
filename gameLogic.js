// Game elements
const gameBoard = document.querySelector("#gameBoard");
const ctx = gameBoard.getContext("2d"); 
const scoreText = document.querySelector("#score");
const resetButton = document.querySelector("#resetButton");
const soundToggleBtn = document.querySelector("#soundToggle");
const themeToggleBtn = document.querySelector("#themeToggle");
const gameWidth = gameBoard.width;
const gameHeight = gameBoard.height;
const unitSize = 25;

// Theme variables
let currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
let boardBackground, gridColor, snakeBodyColor, snakeHeadColor, snakeBorder, foodColor, foodGlowColor;

// Game state variables
let gameLoop;
let running = false;
let paused = false;
let xVelocity = unitSize;
let yVelocity = 0;
let Xfood;
let Yfood;
let score = 0;
let highScores = [];
let speed = 100; // Initial game speed
let snake = [
  {x:unitSize*4, y:0},
  {x:unitSize*3, y:0},
  {x:unitSize*2, y:0},
  {x:unitSize, y:0},
  {x:0, y:0}
];

// Sound effects
let eatSound, gameOverSound;
let soundEnabled = true;

// Touch controls for mobile
let touchControls = false;
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
  touchControls = true;
  document.querySelectorAll('.touchBtn').forEach(btn => {
    btn.addEventListener('touchstart', handleTouchControls);
  });
}

// Event listeners
window.addEventListener("keydown", changeDirection);
resetButton.addEventListener("click", resetGame);
soundToggleBtn.addEventListener("click", toggleSound);
themeToggleBtn.addEventListener("click", toggleTheme);
document.addEventListener("DOMContentLoaded", setupGame);

// Leaderboard modal functionality
const viewLeaderboardBtn = document.getElementById("viewLeaderboard");
const leaderboardModal = document.getElementById("leaderboardModal");
const closeModalBtn = document.querySelector(".close-modal");

if (viewLeaderboardBtn) {
  viewLeaderboardBtn.addEventListener("click", () => {
    updateLeaderboard(); // Refresh leaderboard data
    leaderboardModal.style.display = "block";
  });
}

if (closeModalBtn) {
  closeModalBtn.addEventListener("click", () => {
    leaderboardModal.style.display = "none";
  });
}

// Close modal when clicking outside of it
window.addEventListener("click", (event) => {
  if (event.target === leaderboardModal) {
    leaderboardModal.style.display = "none";
  }
});

// Function to set game colors based on current theme
function updateGameColors() {
  if (currentTheme === 'dark') {
    // Dark theme colors
    boardBackground = "#0F0F1B";
    gridColor = "rgba(125, 249, 255, 0.1)";
    snakeBodyColor = "#50C5B7";
    snakeHeadColor = "#7DF9FF";
    snakeBorder = "#084C61";
    foodColor = "#FF6B6B";
    foodGlowColor = "rgba(255, 107, 107, 0.7)";
  } else {
    // Light theme colors
    boardBackground = "#ffffff";
    gridColor = "rgba(128, 0, 128, 0.1)";
    snakeBodyColor = "#9370DB";
    snakeHeadColor = "#8A2BE2";
    snakeBorder = "#5E35B1";
    foodColor = "#D8336E";
    foodGlowColor = "rgba(216, 51, 110, 0.7)";
  }
  
  // If the game is running, immediately redraw with new colors
  if (gameBoard) {
    clearBoard();
    drawGrid();
    if (typeof Xfood !== 'undefined' && typeof Yfood !== 'undefined') {
      drawFood();
    }
    if (snake && snake.length > 0) {
      drawSnake();
    }
    
    // Redraw game state overlays if needed
    if (paused) {
      displayPaused();
    } else if (!running && document.readyState === 'complete') {
      displayGameOver();
    }
  }
}

// Theme toggle function
function toggleTheme() {
  // Switch theme
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  // Update HTML attribute
  document.documentElement.setAttribute('data-theme', currentTheme);
  
  // Update colors
  updateGameColors();
  
  // Update button text
  if (currentTheme === 'dark') {
    themeToggleBtn.innerHTML = '<span class="theme-icon">🌙</span> Dark';
  } else {
    themeToggleBtn.innerHTML = '<span class="theme-icon">☀️</span> Light';
  }
  
  // Redraw the game elements with new colors immediately
  clearBoard();
  drawGrid();
  drawFood();
  drawSnake();
  
  // If game is over, redraw game over screen
  if (!running && !paused) {
    displayGameOver();
  }
  
  // If game is paused, redraw pause screen
  if (paused) {
    displayPaused();
  }
}

// Sound toggle function
function toggleSound() {
  soundEnabled = !soundEnabled;
  
  // Toggle muted class for visual indication
  if (soundEnabled) {
    soundToggleBtn.textContent = "🔊 Sound ON";
    soundToggleBtn.classList.remove("muted");
  } else {
    soundToggleBtn.textContent = "🔇 Sound OFF";
    soundToggleBtn.classList.add("muted");
  }
}

// Game initialization
function setupGame() {
  // Load high scores from local storage
  loadHighScores();
  
  // Set initial theme colors
  updateGameColors();
  
  // Create audio elements
  // Swapped eat and game over sounds as requested
  eatSound = new Audio('https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3');
  gameOverSound = new Audio('https://assets.mixkit.co/active_storage/sfx/240/240-preview.mp3');
  
  // Adjust sounds volume - lower volume for better game experience
  eatSound.volume = 0.3;
  gameOverSound.volume = 0.2;
  
  // Pre-load sounds to prevent delay on first play
  eatSound.load();
  gameOverSound.load();
  
  // Update leaderboard display
  updateLeaderboard();
  
  // Start game
  gameStart();
}

// Load high scores from local storage
function loadHighScores() {
  const savedScores = localStorage.getItem('snakeHighScores');
  if (savedScores) {
    highScores = JSON.parse(savedScores);
  } else {
    highScores = [];
  }
  
  // Update high score display
  updateHighScoreDisplay();
}

// Save high scores to local storage
function saveHighScores() {
  localStorage.setItem('snakeHighScores', JSON.stringify(highScores));
}

// Update the high score display
function updateHighScoreDisplay() {
  const highScoreElement = document.getElementById('highScore');
  if (!highScoreElement) return;
  
  // Display the highest score or 0 if no scores yet
  const topScore = highScores.length > 0 ? highScores[0].score : 0;
  highScoreElement.textContent = topScore;
}

// Add a new score to high scores
function addHighScore(newScore) {
  // Add the new score with a timestamp
  const scoreEntry = {
    score: newScore,
    date: new Date().toLocaleDateString()
  };
  
  highScores.push(scoreEntry);
  
  // Sort scores highest to lowest
  highScores.sort((a, b) => b.score - a.score);
  
  // Keep only the top 10 scores
  if (highScores.length > 10) {
    highScores = highScores.slice(0, 10);
  }
  
  // Save to local storage
  saveHighScores();
  
  // Update the high score display
  updateHighScoreDisplay();
}

// Update the leaderboard display
function updateLeaderboard() {
  const leaderboardList = document.getElementById('leaderboardList');
  if (!leaderboardList) return;
  
  // Clear existing scores
  leaderboardList.innerHTML = '';
  
  // No scores yet
  if (highScores.length === 0) {
    const emptyItem = document.createElement('li');
    emptyItem.textContent = 'No scores yet!';
    leaderboardList.appendChild(emptyItem);
    return;
  }
  
  // Add each score to the list
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

function nextTick() {
  if (running && !paused) {
    // Clear any previous loop before starting a new one
    clearTimeout(gameLoop);
    gameLoop = setTimeout(function () {
      clearBoard();
      drawGrid();
      drawFood();
      moveSnake();
      drawSnake();
      checkGameOver();
      
      // Only continue the game loop if game isn't over
      if (running) {
        nextTick();
      } else {
        displayGameOver(); // Show game over screen if game ended
      }
    }, speed); // Game speed - decreases as score increases
  } else if (paused && running) {
    // Only show pause screen if the game is still running
    displayPaused();
  } else if (!running) {
    // If game is over, show game over regardless of pause state
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

  // Draw vertical grid lines
  for (let x = 0; x <= gameWidth; x += unitSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, gameHeight);
    ctx.stroke();
  }

  // Draw horizontal grid lines
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

    // Check if food is on snake
    let foodOnSnake = snake.some(function (segment) {
      return segment.x === Xfood && segment.y === Yfood;
    });

    // If food is not on the snake, set foodCreated to true
    if (!foodOnSnake) {
      foodCreated = true;
    }
  }
}

function drawFood() {
  // Add glow effect
  ctx.shadowColor = foodGlowColor;
  ctx.shadowBlur = 10;
  
  // Draw the food with rounded corners
  ctx.fillStyle = foodColor;
  ctx.beginPath();
  ctx.roundRect(Xfood, Yfood, unitSize, unitSize, [8]);
  ctx.fill();
  
  // Reset the shadow
  ctx.shadowBlur = 0;
  
  // Create a shine effect
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

function moveSnake() {
  const head = {
    x: snake[0].x + xVelocity,
    y: snake[0].y + yVelocity
  };

  snake.unshift(head);
  
  // Check if snake ate food
  if (snake[0].x === Xfood && snake[0].y === Yfood) {
    // Play eat sound with error handling
    if (soundEnabled && eatSound) {
      try {
        // Reset sound to start (handles rapid eating)
        eatSound.pause();
        eatSound.currentTime = 0;
        
        // Play the eating sound with a promise to catch any errors
        let playPromise = eatSound.play();
        
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log("Audio play error:", error);
          });
        }
      } catch (e) {
        console.log("Error with audio playback:", e);
      }
    }
    
    // Increase score
    score++;
    scoreText.textContent = score;
    
    // Update final score display for game over overlay
    const finalScoreElement = document.getElementById("finalScore");
    if (finalScoreElement) {
      finalScoreElement.textContent = score;
    }
    
    // Speed up the game every 5 points
    if (score % 5 === 0 && speed > 50) {
      speed -= 5;
    }
    
    createFood();
  } else {
    snake.pop();
  }
}

function drawSnake() {
  snake.forEach(function (snakePart, index) {
    // Calculate transparency for tail effect
    const alpha = Math.max(0.5, 1 - (index / (snake.length + 5)));
    
    if (index === 0) {
      // Head
      ctx.fillStyle = snakeHeadColor;
      
      // Add glow effect to head
      ctx.shadowColor = snakeHeadColor;
      ctx.shadowBlur = 5;
    } else {
      // Body segments with gradient
      const r = parseInt(snakeBodyColor.slice(1, 3), 16);
      const g = parseInt(snakeBodyColor.slice(3, 5), 16);
      const b = parseInt(snakeBodyColor.slice(5, 7), 16);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.shadowBlur = 0;
    }

    // Draw rounded rectangle for snake parts
    ctx.beginPath();
    const radius = index === 0 ? 10 : 8; // Head is more rounded
    ctx.roundRect(snakePart.x, snakePart.y, unitSize, unitSize, [radius]);
    ctx.fill();
    
    // Reset shadow
    ctx.shadowBlur = 0;
    
    // Add border
    ctx.strokeStyle = snakeBorder;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw eyes only on the head
    if (index === 0) {
      drawEyes(snakePart);
    }
  });
}

function drawEyes(head) {
  ctx.fillStyle = "#083D77"; // Eye color
  const eyeSize = unitSize / 5; // Eye size

  let eye1X, eye1Y, eye2X, eye2Y;

  // Position eyes based on snake's direction
  if (xVelocity > 0) { // Moving right
    eye1X = head.x + unitSize - eyeSize * 2.5;
    eye1Y = head.y + eyeSize * 1.5;
    eye2X = head.x + unitSize - eyeSize * 2.5;
    eye2Y = head.y + unitSize - eyeSize * 1.5;
  } else if (xVelocity < 0) { // Moving left
    eye1X = head.x + eyeSize * 1.5;
    eye1Y = head.y + eyeSize * 1.5;
    eye2X = head.x + eyeSize * 1.5;
    eye2Y = head.y + unitSize - eyeSize * 1.5;
  } else if (yVelocity > 0) { // Moving down
    eye1X = head.x + eyeSize * 1.5;
    eye1Y = head.y + unitSize - eyeSize * 2.5;
    eye2X = head.x + unitSize - eyeSize * 1.5;
    eye2Y = head.y + unitSize - eyeSize * 2.5;
  } else if (yVelocity < 0) { // Moving up
    eye1X = head.x + eyeSize * 1.5;
    eye1Y = head.y + eyeSize * 1.5;
    eye2X = head.x + unitSize - eyeSize * 1.5;
    eye2Y = head.y + eyeSize * 1.5;
  }

  // Draw main eye circles
  ctx.beginPath();
  ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
  ctx.fill();
  
  // Add white highlights to eyes
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(eye1X - eyeSize/3, eye1Y - eyeSize/3, eyeSize/3, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(eye2X - eyeSize/3, eye2Y - eyeSize/3, eyeSize/3, 0, Math.PI * 2);
  ctx.fill();
}

function changeDirection(event) {
  const keyPressed = event.keyCode;

  const LEFT = 37;
  const UP = 38;
  const RIGHT = 39;
  const DOWN = 40;
  
  // WASD keys
  const W = 87;
  const A = 65;
  const S = 83;
  const D = 68;
  
  // Spacebar for pause
  const SPACE = 32;

  // Prevent default scrolling behavior for arrow keys and space
  if ([LEFT, UP, RIGHT, DOWN, SPACE].includes(keyPressed)) {
    event.preventDefault();
  }

  const goingUp = (yVelocity == -unitSize);
  const goingDown = (yVelocity == unitSize);
  const goingRight = (xVelocity == unitSize);
  const goingLeft = (xVelocity == -unitSize);

  // Handle pause
  if (keyPressed == SPACE) {
    togglePause();
    return;
  }

  // If game is paused, don't change direction
  if (paused) return;

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
  
  // If game is paused, don't change direction
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
  
  // Prevent default behavior to avoid scrolling
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

function checkGameOver() {
  let gameOverDetected = false;
  
  // Check wall collision with boundary effect
  switch(true) {
    case(snake[0].x < 0):
      gameOverDetected = true;
      break;

    case(snake[0].x >= gameWidth):
      gameOverDetected = true;
      break;

    case(snake[0].y < 0):
      gameOverDetected = true;
      break;

    case(snake[0].y >= gameHeight):
      gameOverDetected = true;
      break;
  }
  
  // Check self collision
  for(let i = 1; i < snake.length; i++) {
    if(snake[i].x === snake[0].x && snake[i].y === snake[0].y) {
      gameOverDetected = true;
    }
  }
  
  if (gameOverDetected) {
    running = false;
    paused = false; // Ensure we're not paused when game is over
    
    // Add score to high scores
    if (score > 0) {
      addHighScore(score);
    }
    
    // Play game over sound with error handling
    if (soundEnabled && gameOverSound) {
      try {
        gameOverSound.currentTime = 0;
        let playPromise = gameOverSound.play();
        
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log("Audio play error:", error);
          });
        }
      } catch (e) {
        console.log("Error with audio playback:", e);
      }
    }
  }
}

function displayGameOver() {
  // Show game over text
  ctx.font = "bold 50px Poppins";
  ctx.fillStyle = foodColor;
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER!", gameWidth / 2, gameHeight / 2 - 40);
  
  // Show score
  ctx.font = "30px Poppins";
  ctx.fillStyle = snakeHeadColor;
  ctx.fillText(`Score: ${score}`, gameWidth / 2, gameHeight / 2 + 10);
  
  // Show high score status
  let scoreMessage = "Try again to beat the high score!";
  if (highScores.length > 0 && score >= highScores[0].score) {
    scoreMessage = "New High Score!";
    ctx.fillStyle = "#FFD700"; // Gold color for high score
  }
  ctx.font = "20px Poppins";
  ctx.fillText(scoreMessage, gameWidth / 2, gameHeight / 2 + 50);
  
  // Show restart instruction
  ctx.font = "20px Poppins";
  ctx.fillStyle = "white";
  ctx.fillText("Press Reset to play again", gameWidth / 2, gameHeight / 2 + 90);
}

function resetGame() {
  // Reset game parameters
  score = 0;
  speed = 100;
  xVelocity = unitSize;
  yVelocity = 0;
  snake = [
    {x:unitSize*4, y:0},
    {x:unitSize*3, y:0},
    {x:unitSize*2, y:0},
    {x:unitSize, y:0},
    {x:0, y:0}
  ];
  
  // Start fresh game
  gameStart();
}