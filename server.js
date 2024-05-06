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
    let newUser = { ...data, id: socket.id };
    users.push(newUser);
    console.log(users);
  });
  socket.on("disconnect", () => {
    console.log("user disconnected");
    users = users.filter((user) => user.id !== socket.id);
    if (users.length < 2) {
      console.log("too few users left");
    }
    console.log(users);
  });
});

server.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
