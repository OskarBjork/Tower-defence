const express = require("express");
const { createServer } = require("node:http");
const { join } = require("node:path");
const { disconnect } = require("node:process");
const { Server } = require("socket.io");

const app = express();
const server = createServer(app);
const io = new Server(server);

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
      console.log("two users connected");
      io.emit("start", users);
    }
  });
  socket.on("disconnect", () => {
    console.log("user disconnected");
    users = users.filter((user) => user.id !== socket.id);
    if (users.length < 2) {
      console.log("too few users left");
    }
    console.log(users);
  });
  socket.on("click", (data) => {
    console.log("click", data);
    let thisUser = users.find((user) => user.id === socket.id);
    let thisCanvas = data.canvas;
    if (thisUser.canvas != thisCanvas) {
      return;
    }
    console.log("valid input");
    console.log(thisUser);
    console.log(thisCanvas);
    io.emit("spawnDefender", { ...data, thisUser, thisCanvas });
  });
});

server.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
