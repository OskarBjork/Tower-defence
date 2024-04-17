const vec = ex.vec;

const Engine = ex.Engine;
const Actor = ex.Actor;
const Color = ex.Color;

const padding = 20;
const xoffset = 65;
const yoffset = 20;
const columns = 5;
const rows = 3;

const brickColor = [Color.Violet, Color.Orange, Color.Yellow];

const game = new Engine({
  width: 800,
  height: 600,
});

const paddle = new Actor({
  x: 150,
  y: game.drawHeight - 40,
  width: 200,
  height: 20,
  color: Color.Chartreuse,
});

const ball = new Actor({
  x: 100,
  y: 300,
  radius: 10,
  color: Color.White,
});

const ballSpeed = vec(100, 100);

setTimeout(() => {
  ball.vel = ballSpeed;
}, 1000);

ball.body.collisionType = ex.CollisionType.Passive;

paddle.body.collisionType = ex.CollisionType.Fixed;

const brickWidth = game.drawWidth / columns - padding - padding / columns;
const brickHeight = 30;
const bricks = [];
for (let i = 0; i < rows; i++) {
  for (let j = 0; j < columns; j++) {
    bricks.push(
      new Actor({
        x: xoffset + j * (brickWidth + padding) + padding,
        y: yoffset + i * (brickHeight + padding) + padding,
        width: brickWidth,
        height: brickHeight,
        color: brickColor[i % brickColor.length],
      })
    );
  }
}

let colliding = false;
ball.on("collisionstart", (ev) => {
  if (bricks.indexOf(ev.other) > -1) {
    ev.other.kill();
  }

  var intersection = ev.contact.mtv.normalize();

  if (!colliding) {
    colliding = true;
    if (Math.abs(intersection.x) > Math.abs(intersection.y)) {
      ball.vel.x *= -1;
    } else {
      ball.vel.y *= -1;
    }
  }
});

ball.on("collisionend", () => {
  colliding = false;
});

ball.on("exitviewport", () => {
  alert("Game Over!");
});

game.add(paddle);
game.add(ball);

game.input.pointers.primary.on("move", (evt) => {
  paddle.pos.x = evt.worldPos.x;
});

ball.on("postupdate", () => {
  if (ball.pos.x < ball.width / 2) {
    ball.vel.x *= -1;
  }
  if (ball.pos.x + ball.width / 2 > game.drawWidth) {
    ball.vel.x *= -1;
  }
  if (ball.pos.y < ball.height / 2) {
    ball.vel.y *= -1;
  }
  if (ball.pos.y + ball.height / 2 > game.drawHeight) {
    ball.vel.y *= -1;
  }
});

bricks.forEach((brick) => {
  brick.body.collisionType = ex.CollisionType.Active;
  game.add(brick);
});
game.start();
