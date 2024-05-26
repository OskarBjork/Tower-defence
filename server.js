const express = require("express");
const { createServer } = require("node:http");
const { join } = require("node:path");
const { disconnect } = require("node:process");
const { Server } = require("socket.io");
const mysql = require("mysql2");

const app = express();
const server = createServer(app);
const io = new Server(server);

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "prog 2 projekt db",
});

connection.connect((err) => {
  if (err) throw err;
  console.log("Connected to the database YEAHHHH!");
});

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
  connection. query(
    "SELECT * FROM players ORDER BY score DESC LIMIT 5",
    function (err, results) {
      if (err) throw err;
      console.log(results);
      const users = results.map((user) => {
        return {
          name: user.name,
          score: user.score,
        };
      });
      socket.emit("scoreboard", users);
    }
  );
  socket.on("login", (data) => {
    const username = data.username;
    connection.query(
      'SELECT name, password FROM players WHERE name = "' + username + '"',
      function (err, results) {
        if (err) throw err;
        if (results.length === 0) {
          socket.emit("loginFailed");
          console.log("login failed");
          return;
        }
        connection.query(
          'SELECT password FROM players WHERE name = "' + username + '"',
          function (err, results) {
            if (err) throw err;
            console.log(data.password, results[0].password);
            if (results[0].password !== data.password) {
              socket.emit("loginFailed");
              console.log("login failed");
              return;
            }
            socket.emit("loginSuccess");
            let newUser = {
              ...data,
              id: socket.id,
              credits: 100,
              numOfCollectors: 0,
              numOfShooters: 0,
            };
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
            if (users.length >= 2) {
              io.emit("start", users);
              // TEMPORÄRT
              // setInterval(() => {
              //   const colors = ["red", "blue", "green"];
              //   const color = random(colors);
              //   const row = Math.floor(Math.random() * 5) + 1;
              //   const column = 7;
              //   io.emit("spawnEnemy", {
              //     row: row,
              //     column: column,
              //     color: color,
              //   });
              // }, 3000);
              setInterval(() => {
                const defaultCredits = 10;
                users.forEach((user) => {
                  user.credits += defaultCredits;
                  user.credits += user.numOfCollectors * 10;
                  io.emit("updateCredits", {
                    thisUser: user,
                    thisCanvas: user.canvas,
                  });
                });
              }, 1000);
            }
          }
        );
      }
    );
  });
  socket.on("register", (data) => {
    console.log(data.username, data.password);
    connection.query(
      'INSERT INTO players (name, password) VALUES ("' +
        data.username +
        '", "' +
        data.password +
        '")',
      function (err, results) {
        if (err) {
          socket.emit("registrationFailed");
          console.log("registration failed");
          return;
        }
        console.log(results);
        socket.emit("registrationSuccess");
      }
    );
  });
  socket.on("disconnect", () => {
    users = users.filter((user) => user.id !== socket.id);
    if (users.length < 2) {
    }
    console.log(users);
  });
  socket.on("click", (data) => {
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
    let creditCost = 10;
    if (data.defenderType === "shooter") {
      creditCost = 30;
    }
    if (data.defenderType === "collector") {
      creditCost = 10;
    }
    if (thisUser.credits < creditCost) {
      return;
    }
    if (data.defenderType === "collector") {
      thisUser.numOfCollectors++;
    }
    if (data.defenderType === "shooter") {
      thisUser.numOfShooters++;
    }
    thisUser.credits -= creditCost;
    currentGrid[data.row - 1][data.column - 1] = 1;
    io.emit("updateCredits", { thisUser, thisCanvas });
    io.emit("spawnDefender", {
      ...data,
      thisUser,
      thisCanvas,
      defenderType: data.defenderType,
    });
  });
  socket.on("defenderKilled", (data) => {
    let thisPlayer = data.connectedPlayer;
    let currentGrid = thisPlayer === "player1" ? grid1 : grid2;
    currentGrid[data.row - 1][data.column - 1] = 0;
    const typeOfDefender = data.defenderType;
    let thisUser = users.find((user) => user.id === socket.id);
    if (!thisUser) {
      return;
    }
    if (typeOfDefender === "collector") {
      thisUser.numOfCollectors--;
    }
    if (typeOfDefender === "shooter") {
      thisUser.numOfShooters--;
    }
  });
  socket.on("playerLost", (data) => {
    const thisUser = users.find((user) => user.id === socket.id);
    console.log(thisUser);
    if (!thisUser) {
      return;
    }
    const losingPlayer = thisUser.username;
    const winningPlayer = users.find((user) => user.id !== socket.id).username;
    connection.query(
      'UPDATE players SET score = score + 1 WHERE name = "' +
        winningPlayer +
        '"',
      function (err, results) {
        if (err) throw err;
        console.log(results);
      }
    );
    io.emit("gameOver", { winner: winningPlayer, loser: losingPlayer });
  });
  socket.on("getScoreboard", () => {
    connection.query(
      "SELECT * FROM players ORDER BY score DESC LIMIT 5",
      function (err, results) {
        if (err) throw err;
        console.log(results);
        const users = results.map((user) => {
          return {
            name: user.name,
            score: user.score,
          };
        });
        socket.emit("scoreboard", users);
      }
    );
  });
});

server.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});