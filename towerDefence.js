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
    });
    this.hp = config.hp
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
  constructor(config){
    super(config)
    this.attackSpeed = 10
  }
}

class BasicDefender extends Defender {
  constructor(config){

  }
}

class Attacker extends Entity {
  constructor(config){
    super(config)
    this.speed = 10
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
  const myEnemy = new Attacker({
    x: 5,
    y: 2,
    color: ex.Color.Green,
    hp: 5
  });

  myDefender.on("pointerdown", (e) => {
    const bullet = new Bullet({
      x: myDefender.center._x + myDefender.width / 2,
      y: myDefender.center._y,
      color: ex.Color.Blue,
    });
    game.add(bullet);
  });
  myEnemy.on("collisionstart", (e) => {
    e.other.kill();
    e.target.hp --     
    if(e.target.hp < 1){
      e.target.kill();
    }
  });
  game.add(myDefender);
  game.add(myEnemy);
  const loader = new ex.Loader();
  loader.suppressPlayButton = true;
  await game.start(loader);
}

main();
