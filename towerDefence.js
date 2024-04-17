class Entity extends ex.Actor {
  constructor(hp, damage, speed, attackSpeed, x, y) {
    super({
      x: x,
      y: y,
    });
    this.hp = hp;
    this.damage = damage;
    this.speed = speed;
    this.attackSpeed = attackSpeed;
  }
  move(x, y) {
    this.x = x;
    this.y = y;
  }
}

class Defender extends Entity {
  constructor(hp, damage, speed, attackSpeed, x, y, range) {
    super(hp, damage, speed, attackSpeed, x, y);
    this.range = range;
    this.speed = 0;
  }
  attack(enemy) {
    if (
      this.range >=
      Math.sqrt(Math.pow(this.x - enemy.x, 2) + Math.pow(this.y - enemy.y, 2))
    ) {
      enemy.hp -= this.damage;
    }
  }
}

class Enemy extends Entity {
  constructor(hp, damage, speed, attackSpeed, x, y) {
    super(hp, damage, speed, attackSpeed, x, y);
  }

  attack(defender) {
    defender.hp -= this.damage;
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

function main() {
  const defender = new Defender(100, 10, 0, 1, 0, 0, 3);
  const enemy = new Enemy(100, 10, 1, 1, 8, 4);
  console.log("hello world");
  var running = true;
  // const canvas1 = document.getElementById("player1Canvas");
  // const ctx1 = canvas1.getContext("2d");

  // ctx1.fillRect(0, 0, 100, 100);
}

main();
