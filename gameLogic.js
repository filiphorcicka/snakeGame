const gameBoard = document.querySelector("#gameBoard");
const ctx = gameBoard.getContext("2d"); 
const scoreText = document.querySelector("#score");
const resetButton = document.querySelector("#resetButton");
const gameWidth = gameBoard.width;
const gameHeight = gameBoard.height;
const boardBackground = "magenta";
const snakeColor = "blue";
const snakeHeadColor = "lightGreen"
const snakeBorder = "black";
const foodColor = "red";
const unitSize = 25;
let gameLoop;
let running = false;
let xVelocity = unitSize;
let yVelocity = 0;
let Xfood;
let yfood;
let score = 0;
let snake = [
  {x:unitSize*4, y:0},
  {x:unitSize*3, y:0},
  {x:unitSize*2, y:0},
  {x:unitSize, y:0},
  {x:0, y:0}
]

window.addEventListener("keydown", changeDirection);
resetButton.addEventListener("click", resetGame)

gameStart();

function gameStart(){
  running = true;
  scoreText.textContent = score;
  createFood();
  drawFood();
  nextTick();
};
function nextTick() {
  if (running) {
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
    }, 100); // Game speed
  } else {
    displayGameOver();
  }
}
function clearBoard(){
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
function createFood(){
  function randomFood(min, max) {
    return Math.round((Math.random() * (max - min) + min) / unitSize) * unitSize;
  }

  let foodCreated = false;
  while (!foodCreated) {
    Xfood = randomFood(0, gameWidth - unitSize);
    Yfood = randomFood(0, gameHeight - unitSize);

    // Store the result of the check
    let foodOnSnake = snake.some(function (segment) {
      return segment.x === Xfood && segment.y === Yfood;
    });

    // If food is not on the snake, set foodCreated to true
    if (!foodOnSnake) {
      foodCreated = true;
    }
  }
};
function drawFood() {
  // Draw the food
  ctx.fillStyle = foodColor;
  ctx.fillRect(Xfood, Yfood, unitSize, unitSize);

  // Add a border around the food
  ctx.strokeStyle = snakeBorder; // Border color
  ctx.lineWidth = 1; // Border thickness
  ctx.strokeRect(Xfood, Yfood, unitSize, unitSize);
}
function moveSnake(){
  const head = {x: snake[0].x + xVelocity,
                y: snake[0].y + yVelocity};

  snake.unshift(head);
  if(snake[0].x == Xfood && snake[0].y == Yfood){
    score++;
    scoreText.textContent = score;
    createFood();
  }else{
    snake.pop();
  }
};
function drawSnake() {
  snake.forEach(function (snakePart, index) {
    if (index === 0) {
      ctx.fillStyle = snakeHeadColor;
    } else {
      ctx.fillStyle = snakeColor;
    }

    // Draw the snake part
    ctx.strokeStyle = snakeBorder;
    ctx.fillRect(snakePart.x, snakePart.y, unitSize, unitSize);
    ctx.strokeRect(snakePart.x, snakePart.y, unitSize, unitSize);

    // Draw eyes only on the head
    if (index === 0) {
      drawEyes(snakePart);
    }
  });
}
function drawEyes(head) {
  ctx.fillStyle = snakeColor; // Eye color
  const eyeSize = unitSize / 5; // Eye size

  let eye1X, eye1Y, eye2X, eye2Y;

  // Position eyes based on snake's direction
  if (xVelocity > 0) { // Moving right
    eye1X = head.x + unitSize - eyeSize * 2;
    eye1Y = head.y + eyeSize;
    eye2X = head.x + unitSize - eyeSize * 2;
    eye2Y = head.y + unitSize - eyeSize * 2;
  } else if (xVelocity < 0) { // Moving left
    eye1X = head.x + eyeSize;
    eye1Y = head.y + eyeSize;
    eye2X = head.x + eyeSize;
    eye2Y = head.y + unitSize - eyeSize * 2;
  } else if (yVelocity > 0) { // Moving down
    eye1X = head.x + eyeSize;
    eye1Y = head.y + unitSize - eyeSize * 2;
    eye2X = head.x + unitSize - eyeSize * 2;
    eye2Y = head.y + unitSize - eyeSize * 2;
  } else if (yVelocity < 0) { // Moving up
    eye1X = head.x + eyeSize;
    eye1Y = head.y + eyeSize;
    eye2X = head.x + unitSize - eyeSize * 2;
    eye2Y = head.y + eyeSize;
  }

  // Draw two eyes
  ctx.beginPath();
  ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
  ctx.fill();
}
function changeDirection(event){
  const keyPressed = event.keyCode;

  const LEFT = 37;
  const UP = 38;
  const RIGHT = 39;
  const DOWN = 40;

  const goingUp = (yVelocity == -unitSize);
  const goingDown = (yVelocity == unitSize);
  const goingRight = (xVelocity == unitSize);
  const goingLeft = (xVelocity == -unitSize);

  switch(true){
      case(keyPressed == LEFT && !goingRight):
        xVelocity = -unitSize;
        yVelocity = 0;
        break;

      case(keyPressed == RIGHT && !goingLeft):
        xVelocity = unitSize;
        yVelocity = 0;
        break;

      case(keyPressed == UP && !goingDown):
        xVelocity = 0;
        yVelocity = -unitSize;
        break;

      case(keyPressed == DOWN && !goingUp):
        xVelocity = 0;
        yVelocity = unitSize;
        break;




  }
};
function checkGameOver(){
  switch(true){
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
  for(let i = 1; i < snake.length; i++){
    if(snake[i].x == snake[0].x && snake[i].y == snake[0].y){
      running = false;
    }
  }
};
function displayGameOver(){
  ctx.font = "50px MV Boli"  //change later
  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER!", gameWidth / 2, gameHeight / 2)
};
function resetGame(){
  score = 0;
  xVelocity = unitSize;
  yVelocity = 0;
  snake = [
    {x:unitSize*4, y:0},
    {x:unitSize*3, y:0},
    {x:unitSize*2, y:0},
    {x:unitSize, y:0},
    {x:0, y:0}
  ]
  running = false;
  gameStart();
}; 
