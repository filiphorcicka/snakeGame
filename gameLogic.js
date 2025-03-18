// Game elements
const gameBoard = document.querySelector("#gameBoard");
const ctx = gameBoard.getContext("2d"); 
const scoreText = document.querySelector("#score");
const resetButton = document.querySelector("#resetButton");
const gameWidth = gameBoard.width;
const gameHeight = gameBoard.height;

// Game settings - enhanced visuals
const boardBackground = "#0F0F1B";
const gridColor = "rgba(125, 249, 255, 0.1)";
const snakeBodyColor = "#50C5B7";
const snakeHeadColor = "#7DF9FF";
const snakeBorder = "#084C61";
const foodColor = "#FF6B6B";
const foodGlowColor = "rgba(255, 107, 107, 0.7)";
const unitSize = 25;

// Game state variables
let gameLoop;
let running = false;
let paused = false;
let xVelocity = unitSize;
let yVelocity = 0;
let Xfood;
let Yfood;
let score = 0;
let speed = 100; // Initial game speed
let snake = [
  {x:unitSize*4, y:0},
  {x:unitSize*3, y:0},
  {x:unitSize*2, y:0},
  {x:unitSize, y:0},
  {x:0, y:0}
];

// Sound effects
let eatSound, gameOverSound, moveSound;
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
document.addEventListener("DOMContentLoaded", setupGame);

// Game initialization
function setupGame() {
  // Create audio elements
  eatSound = new Audio('https://assets.mixkit.co/active_storage/sfx/1561/1561-preview.mp3');
  gameOverSound = new Audio('https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3');
  moveSound = new Audio('https://assets.mixkit.co/active_storage/sfx/350/350-preview.mp3');
  
  // Adjust sounds volume
  eatSound.volume = 0.3;
  gameOverSound.volume = 0.3;
  moveSound.volume = 0.1;
  
  // Start game
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
      nextTick();
    }, speed); // Game speed - decreases as score increases
  } else if (paused) {
    displayPaused();
  } else {
    displayGameOver();
  }
}

function clearBoard() {
  ctx.fillStyle = boardBackground;
  ctx.fillRect(0, 0, gameWidth, gameHeight);

};
function drawGrid() {
  ctx.strokeStyle = "black"; // Grid line color
  ctx.lineWidth = 0.1; // Line thickness

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
    // Play eat sound
    if (soundEnabled) {
      eatSound.currentTime = 0;
      eatSound.play().catch(e => console.log("Audio play error:", e));
    }
    
    // Increase score
    score++;
    scoreText.textContent = score;
    
    // Speed up the game every 5 points
    if (score % 5 === 0 && speed > 50) {
      speed -= 5;
    }
    
    createFood();
  } else {
    snake.pop();
    
    // Play move sound occasionally (not every move to avoid noise)
    if (soundEnabled && Math.random() < 0.1) {
      moveSound.currentTime = 0;
      moveSound.play().catch(e => console.log("Audio play error:", e));
    }
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
  ctx.fillStyle = "#7DF9FF";
  ctx.textAlign = "center";
  ctx.fillText("PAUSED", gameWidth / 2, gameHeight / 2);
  ctx.font = "20px Poppins";
  ctx.fillText("Press Space to continue", gameWidth / 2, gameHeight / 2 + 40);
}

function checkGameOver() {
  // Check wall collision with boundary effect
  switch(true) {
    case(snake[0].x < 0):
      running = false;
      break;

    case(snake[0].x >= gameWidth):
      running = false;
      break;

    case(snake[0].y < 0):
      running = false;
      break;

    case(snake[0].y >= gameHeight):
      running = false;
      break;
  }
  
  // Check self collision
  for(let i = 1; i < snake.length; i++) {
    if(snake[i].x === snake[0].x && snake[i].y === snake[0].y) {
      running = false;
    }
  }
  
  // Play game over sound
  if (!running && soundEnabled) {
    gameOverSound.play().catch(e => console.log("Audio play error:", e));
  }
}

function displayGameOver() {
  // Show game over text
  ctx.font = "bold 50px Poppins";
  ctx.fillStyle = "#FF5555";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER!", gameWidth / 2, gameHeight / 2 - 20);
  
  // Show score
  ctx.font = "30px Poppins";
  ctx.fillStyle = "#7DF9FF";
  ctx.fillText(`Score: ${score}`, gameWidth / 2, gameHeight / 2 + 30);
  
  // Show restart instruction
  ctx.font = "20px Poppins";
  ctx.fillStyle = "white";
  ctx.fillText("Press Reset to play again", gameWidth / 2, gameHeight / 2 + 70);
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