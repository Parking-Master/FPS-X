const app = require("express")();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  path: "/",
  cors: {
    origin: "*"
  }
});

io.on("connection", (socket) => {
  socket.on("data", (data) => {
    io.emit("data", data);
  });
});

io.engine.on("connection", (rawSocket) => {
  rawSocket.request = null;
});


server.listen(4444);
