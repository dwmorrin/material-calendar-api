import app from "./app";
import http from "http";
import { Server } from "socket.io";

const server = http.createServer(app);

const io = new Server(server);

io.on("connection", (socket) => {
  socket.on("broadcast", (message: string) => {
    socket.broadcast.emit("broadcast", message);
  });
});

export default server;
