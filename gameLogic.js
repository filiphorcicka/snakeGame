const gameBoard = document.querySelector("#gameBoard");
const ctx = gameBoard.getContext("2d"); 
const scoreText = document.querySelector("#score");
const resetButton = document.querySelector("#resetButton");
const gameWidth = gameBoard.width;
const gameHeight = gameBoard.height;
const boardBackground = "purple";
const snakeColor = "lightGreen";
const snakeBorder = "black";
const foodColor = "red";
const unitSize = 25;
let running = false;
let xVelocity = unitSize;
let yVelocity = 0;
let Xfood;
let yfood;
let score = 0;
let snake = [
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
function nextTick(){
  if(running){
    setTimeout(()=>{
      clearBoard();
      drawFood();
      moveSnake();
      drawSnake();
      checkGameOver();
      nextTick();
    }, 100 /*speed number*/)
  }else{
    displayGameOver();
  }
};
function clearBoard(){
  ctx.fillStyle = boardBackground;
  ctx.fillRect(0, 0, gameWidth, gameHeight);

};
function createFood(){
  function randomFood(min, max){
    const rndmNum = Math.round((Math.random() * (max-min) + min)/unitSize) * unitSize; 
    return rndmNum;
  }
  Xfood = randomFood(0, gameWidth-unitSize);
  Yfood = randomFood(0, gameWidth-unitSize);
};
function drawFood(){
  ctx.fillStyle = foodColor;
  ctx.fillRect(Xfood, Yfood, unitSize, unitSize); 
};
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
function drawSnake(){
  ctx.fillStyle = snakeColor;
  ctx.strokeStyle = snakeBorder;
  snake.forEach(snakePart => {
    ctx.fillRect(snakePart.x, snakePart.y, unitSize, unitSize);
    ctx.strokeRect(snakePart.x, snakePart.y, unitSize, unitSize); 
  })
};
function changeDirection(event){
  const keyPressed = event.keyCode;

  const DOWN = 37;
  const UP = 38;
  const RIGHT = 39;
  const LEFT = 40;

  const goingUp = (yVelocity == -unitSize);
  const goingDown = (yVelocity == unitSize);
  const goingRight = (xVelocity == unitSize);
  const goingLeft = (yVelocity == -unitSize);

  switch(true){
    case(keyPressed == LEFT && !goingRight):
      xVelocity = -unitSize;
      yVelocity = 0;
      break;

      case(keyPressed == RIGHT && !goingLeft):
      xVelocity = unitSize;
      yVelocity = 0;
      break;

      case(keyPressed == LEFT && !goingRight):
      xVelocity = -unitSize;
      yVelocity = 0;
      break;

      case(keyPressed == LEFT && !goingRight):
      xVelocity = -unitSize;
      yVelocity = 0;
      break;




  }
};
function checkGameOver(){};
function displayGameOver(){};
function resetGame(){}; 
