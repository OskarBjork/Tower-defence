// TODO: Fix bug where dead shooters still try to shoot

const vec = ex.vec;
const SCALE_2X = vec(2, 2);

const socket = io();

const Actor = ex.Actor;

const ANCHOR_CENTER = vec(0.5, 0.5);
const tileSize = 120;

const gameDiv = document.querySelector("#gameDiv");

const canvas1 = document.querySelector("#canvas1");
const canvas2 = document.querySelector("#canvas2");

const loginDiv = document.querySelector("#loginDiv");
const loginInput = document.querySelector("#usernameInput");
const loginBtn = document.querySelector("#loginBtn");

const shooterBtn = document.querySelector("#shooterBtn");
const collectorBtn = document.querySelector("#collectorBtn");
const player1CreditsDisplay = document.querySelector("#creditsDisplay1");
const player2CreditsDisplay = document.querySelector("#creditsDisplay2");

const defenderTypes = ["shooter", "collector"];

let currentDefenderType = "shooter";

let clientUsername = "not set yet";
let clientCanvas = "not set yet";
let playerNumber = "";
let playerCredits = 100;
const shooterPrice = 30;
const collectorPrice = 20;

const game1 = new ex.Engine({
  width: 800,
  height: 600,
  canvasElementId: "canvas1",
});

const game2 = new ex.Engine({
  width: 800,
  height: 600,
  canvasElementId: "canvas2",
});

const intervals = [];

const grid = [
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
];

shooterBtn.addEventListener("click", () => {
  currentDefenderType = "shooter";
});

collectorBtn.addEventListener("click", () => {
  currentDefenderType = "collector";
});

loginBtn.addEventListener("click", () => {
  loginDiv.style.display = "none";
  console.log("lol");
  console.log(loginInput.value);
  socket.emit("login", { username: loginInput.value });
  clientUsername = loginInput.value;
});

// IO events

socket.on("start", (users) => {
  gameDiv.style.display = "flex";
  users.forEach((user) => {
    if ((user.playerNumber = "player1")) {
      player1CreditsDisplay.textContent = `Credits: ${user.credits}`;
    }
    if ((user.playerNumber = "player2")) {
      player2CreditsDisplay.textContent = `Credits: ${user.credits}`;
    }
  });
  main();
});

socket.on("updateCredits", (data) => {
  let thisCanvas = data.thisCanvas;
  if (thisCanvas === "canvas1") {
    player1CreditsDisplay.textContent = `Credits: ${data.thisUser.credits}`;
  }
  if (thisCanvas === "canvas2") {
    player2CreditsDisplay.textContent = `Credits: ${data.thisUser.credits}`;
  }
});

socket.on("setCanvas", (data) => {
  clientCanvas = data.canvas;
  if (clientCanvas === "canvas1") {
    playerNumber = "player1";
  }
  if (clientCanvas === "canvas2") {
    playerNumber = "player2";
  }
  playerCredits = data.credits;
  if (playerNumber === "player1") {
    player1CreditsDisplay.textContent = `Credits: ${playerCredits}`;
  }
  if (playerNumber === "player2") {
    player2CreditsDisplay.textContent = `Credits: ${playerCredits}`;
  }
});

socket.on("spawnDefender", (data) => {
  const spawnCanvas = data.thisCanvas;
  const playerNumber = data.thisCanvas === "canvas1" ? "player1" : "player2";
  if (spawnCanvas === "canvas1") {
    spawnDefender(data, game1, playerNumber);
  }
  if (spawnCanvas === "canvas2") {
    spawnDefender(data, game2, playerNumber);
  }
});

class Entity extends Actor {
  constructor(config) {
    super({
      x: config.x * tileSize - tileSize / 2,
      y: config.y * tileSize - tileSize / 2,
      width: tileSize,
      height: tileSize,
      color: config.color,
      vel: config.vel,
    });
    this.hp = config.hp;
  }
}

class Bullet extends Actor {
  constructor(config) {
    super({
      x: config.x,
      y: config.y,
      width: 10,
      height: 10,
      color: config.color,
      vel: new vec(200, 0),
    });
  }
}

class Defender extends Entity {
  constructor(config) {
    super(config);
    this.defenderType = config.defenderType ?? "shooter";
    this.attackSpeed = this.defenderType === "shooter" ? 1000 : null;
    this.game = config.game;
    this.color = this.defenderType === "shooter" ? ex.Color.Red : ex.Color.Blue;
    this.creditCost =
      this.defenderType === "shooter" ? shooterPrice : collectorPrice;
    // grid[config.x][config.y] = this;
    this.row = config.y;
    this.column = config.x;
    this.connectedPlayer = config.connectedPlayer;
    if (this.defenderType === "shooter") {
      this.intervalId = setInterval(() => {
        if (this.isKilled()) clearInterval(this.intervalId);
        else this.shoot();
      }, this.attackSpeed);
    }
  }
  kill() {
    super.kill();
    grid[this.row - 1][this.column - 1] = 0;
    clearInterval(this.intervalId);
    socket.emit("defenderKilled", {
      row: this.row,
      column: this.column,
      connectedPlayer: this.connectedPlayer,
    });
  }
  shoot() {
    const bullet = new Bullet({
      x: this.pos.x + this.width / 2,
      y: this.pos.y,
      color: ex.Color.Blue,
    });
    this.game.add(bullet);
  }
}

class BasicDefender extends Defender {
  constructor(config) {}
}

class Attacker extends Entity {
  constructor(config) {
    super(config);
    this.speed = 10;
    this.on("collisionstart", (e) => {
      if (e.other instanceof Bullet) {
        e.other.kill();
        this.hp--;
        if (this.hp < 1) {
          this.kill();
        }
        return;
      }
      if (e.other instanceof Defender) {
        this.kill();
        e.other.kill();
      }
    });
  }

  update(engine, delta) {
    super.update(engine, delta);
    const worldBounds = engine.getWorldBounds();
    if (this.pos.x < worldBounds.left || this.pos.x > worldBounds.right) {
      engine.currentScene.actors.forEach((actor) => {
        actor.kill();
        intervals.forEach((interval) => clearInterval(interval));
      });
      const gameOver = new ex.Label({
        x: 400,
        y: 300,
        text: "Game Over",
        fontSize: 100,
        color: ex.Color.White,
      });
      engine.add(gameOver);
    }
  }
}

function placeEntities(entities) {
  entities.forEach((entity) => {
    grid[entity.x][entity.y] = entity;
  });
}
function random(array) {
  const index = Math.floor(Math.random() * array.length);
  return array[index];
}

function spawnEnemy() {
  const colors = [ex.Color.Red, ex.Color.Blue, ex.Color.Green];
  return new Attacker({
    x: 7,
    y: random([1, 2, 3, 4, 5]),
    color: random(colors),
    hp: 5,
    vel: vec(-100, 0),
  });
}

function spawnEnemies() {
  const enemies = [];
  const colors = [ex.Color.Red, ex.Color.Blue, ex.Color.Green];
  for (let i = 1; i <= 5; i++) {
    enemies.push(
      new Attacker({
        x: 6,
        y: i,
        color: random(colors),
        hp: 5,
        vel: vec(-50, 0),
      })
    );
  }
  return enemies;
}

function spawnDefender(data, game, playerNumber) {
  const defenderType = data.currentDefenderType;
  const column = Math.floor(data.y / tileSize) + 1;
  const row = Math.floor(data.x / tileSize) + 1;
  let price = 10;
  if (currentDefenderType === "shooter") {
    price = shooterPrice;
  }
  if (currentDefenderType === "collector") {
    price = collectorPrice;
  }
  if (playerCredits < price) {
    return;
  }
  if (checkIfDefenderExists(row, column)) {
    return;
  }
  const newDefender = new Defender({
    x: row,
    y: column,
    color: ex.Color.Red,
    game: game,
    defenderType: currentDefenderType,
    connectedPlayer: playerNumber,
  });
  console.log(newDefender);
  game.add(newDefender);
  console.log(newDefender.pos);
}

function checkIfDefenderExists(row, column) {
  console.log("row", row);
  console.log("column", column);
  console.log(grid);
  return grid[column - 1][row - 1] instanceof Defender;
}

function addMouseClickEvent(game) {
  game.input.pointers.primary.on("down", (evt) => {
    const row = Math.floor(evt.worldPos.y / tileSize) + 1;
    const column = Math.floor(evt.worldPos.x / tileSize) + 1;
    socket.emit("click", {
      x: evt.worldPos.x,
      y: evt.worldPos.y,
      currentDefenderType: currentDefenderType,
      canvas: game.canvasElementId,
      row: row,
      column: column,
      playerNumber: playerNumber,
    });
  });
}

function createIntervals(game) {
  let spawnEnemyIntervalId = setInterval(() => {
    const newEnemy = spawnEnemy();
    game.add(newEnemy);
  }, 3000);
  intervals.push(spawnEnemyIntervalId);

  let collectorIntervalId = setInterval(() => {
    const actors = game.currentScene.actors;
    const collectors = actors.filter(
      (actor) => actor instanceof Defender && actor.defenderType === "collector"
    );
    collectors.forEach((collector) => {
      playerCredits += 10;
      creditsDisplay.textContent = `Credits: ${playerCredits}`;
    });
  }, 1000);
  intervals.push(collectorIntervalId);
}

async function main() {
  gameDiv.style.display = "flex";

  addMouseClickEvent(game1);
  addMouseClickEvent(game2);
  // const myDefender = new Defender({
  //   x: 1,
  //   y: 2,
  //   color: ex.Color.Red,
  //   game: game,
  // });

  const firstEnemy = spawnEnemy();

  createIntervals(game1);
  createIntervals(game2);
  // game.add(myDefender);
  // game.add(myEnemy);
  const loader = new ex.Loader();
  loader.suppressPlayButton = true;
  await game1.start(loader);
  await game2.start(loader);
}

socket.on("gameStart", () => {
  main();
});
