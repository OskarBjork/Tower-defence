const express = require("express");
const { createServer } = require("node:http");
const { join } = require("node:path");
const { disconnect } = require("node:process");
const { Server } = require("socket.io");

const app = express();
const server = createServer(app);
const io = new Server(server);

const grid1 = [
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
];

const grid2 = [
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
];

function random(array) {
  const index = Math.floor(Math.random() * array.length);
  return array[index];
}

let users = [];

const path = require("path");

app.use(express.static(path.join(__dirname)));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("login", (data) => {
    console.log("login", data);
    let newUser = { ...data, id: socket.id, credits: 100 };
    if (users.length === 0) {
      newUser.canvas = "canvas1";
      socket.emit("setCanvas", {
        canvas: "canvas1",
        credits: newUser.credits,
        playerNumber: "player1",
      });
    }
    if (users.length === 1) {
      newUser.canvas = "canvas2";
      socket.emit("setCanvas", {
        canvas: "canvas2",
        credits: newUser.credits,
        playerNumber: "player2",
      });
    }
    if (users.length < 2) {
      users.push(newUser);
    }
    console.log(users);
    if (users.length >= 2) {
      io.emit("start", users);
      setInterval(() => {
        const colors = ["red", "blue", "green"];
        const color = random(colors);
        const row = Math.floor(Math.random() * 5) + 1;
        const column = 7;
        io.emit("spawnEnemy", { row: row, column: column, color: color });
      }, 3000);
    }
  });
  socket.on("disconnect", () => {
    users = users.filter((user) => user.id !== socket.id);
    if (users.length < 2) {
    }
    console.log(users);
  });
  socket.on("click", (data) => {
    console.log("click", data);
    let thisUser = users.find((user) => user.id === socket.id);
    if (!thisUser) {
      return;
    }
    let thisCanvas = data.canvas;
    if (thisUser.canvas != thisCanvas) {
      return;
    }
    let currentGrid = data.playerNumber === "player1" ? grid1 : grid2;
    if (currentGrid[data.row - 1][data.column - 1] !== 0) {
      console.log("cell is occupied");
      return;
    }
    thisUser.credits -= 10;
    currentGrid[data.row - 1][data.column - 1] = 1;
    io.emit("updateCredits", { thisUser, thisCanvas });
    io.emit("spawnDefender", { ...data, thisUser, thisCanvas });
  });
  socket.on("defenderKilled", (data) => {
    let thisPlayer = data.connectedPlayer;
    let currentGrid = thisPlayer === "player1" ? grid1 : grid2;
    currentGrid[data.row - 1][data.column - 1] = 0;
  });
});

server.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
