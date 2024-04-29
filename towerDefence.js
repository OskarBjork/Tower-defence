// TODO: Fix bug where dead shooters still try to shoot

const vec = ex.vec;
const SCALE_2X = vec(2, 2);

const Actor = ex.Actor;

const ANCHOR_CENTER = vec(0.5, 0.5);
const tileSize = 120;

const canvas1 = document.querySelector("#canvas1");

const shooterBtn = document.querySelector("#shooterBtn");
const collectorBtn = document.querySelector("#collectorBtn");
const creditsDisplay = document.querySelector("#creditsDisplay");

const defenderTypes = ["shooter", "collector"];

let currentDefenderType = "shooter";

let playerCredits = 100;
const shooterPrice = 30;
const collectorPrice = 20;

creditsDisplay.textContent = `Credits: ${playerCredits}`;

shooterBtn.addEventListener("click", () => {
  currentDefenderType = "shooter";
});

collectorBtn.addEventListener("click", () => {
  currentDefenderType = "collector";
});

const intervals = [];

const grid = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
];

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
    grid[config.x][config.y] = this;
    this.row = config.y;
    this.column = config.x;
    if (this.defenderType === "shooter") {
      this.intervalId = setInterval(() => {
        if (this.isKilled()) clearInterval(this.intervalId);
        else this.shoot();
      }, this.attackSpeed);
    }
  }
  kill() {
    super.kill();
    grid[this.column][this.row] = 0;
    clearInterval(this.intervalId);
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

function checkIfDefenderExists(x, y) {
  return grid[x][y] instanceof Defender;
}

function addMouseClickEvent(game) {
  game.input.pointers.primary.on("down", (evt) => {
    const row = Math.floor(evt.worldPos.y / tileSize) + 1;
    const column = Math.floor(evt.worldPos.x / tileSize) + 1;
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
    if (checkIfDefenderExists(column, row)) {
      return;
    }
    const newDefender = new Defender({
      x: column,
      y: row,
      color: ex.Color.Red,
      game: game,
      defenderType: currentDefenderType,
    });
    game.add(newDefender);
    playerCredits -= newDefender.creditCost;
    creditsDisplay.textContent = `Credits: ${playerCredits}`;
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

  addMouseClickEvent(game1);
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

main();
