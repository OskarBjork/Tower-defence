const vec = ex.vec;
const SCALE_2X = vec(2, 2);

const Actor = ex.Actor;

const ANCHOR_CENTER = vec(0.5, 0.5);
const tileSize = 120;

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
    this.attackSpeed = 10;
  }
  shoot(game) {
    const bullet = new Bullet({
      x: this.pos.x + this.width / 2,
      y: this.pos.y,
      color: ex.Color.Blue,
    });
    game.add(bullet);
  }
}

class BasicDefender extends Defender {
  constructor(config) {}
}

class Attacker extends Entity {
  constructor(config) {
    super(config);
    this.speed = 10;
  }
}

const grid = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
];

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

async function main() {
  const game = new ex.Engine({
    width: 800,
    height: 600,
  });
  const myDefender = new Defender({
    x: 1,
    y: 2,
    color: ex.Color.Red,
  });

  setInterval(() => {
    const newEnemy = spawnEnemy();
    game.add(newEnemy);
  }, 3000);

  myDefender.on("pointerdown", function () {
    myDefender.shoot(game);
  });
  console.log(myDefender);
  // myEnemy.on("collisionstart", (e) => {
  //   e.other.kill();
  //   e.target.hp--;
  //   if (e.target.hp < 1) {
  //     e.target.kill();
  //   }
  // });
  game.add(myDefender);
  // game.add(myEnemy);
  const loader = new ex.Loader();
  loader.suppressPlayButton = true;
  await game.start(loader);
}

main();
