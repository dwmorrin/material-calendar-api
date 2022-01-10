import app from "./app";
import http from "http";
import { Server } from "socket.io";

const server = http.createServer(app);

const io = new Server(server);

io.on("connection", (socket) => {
  /**
   * Broadcast to all users
   * Currently no inspection of the message and data. (Just a repeater.)
   * Could have the server do some work here if needed.
   * TODO: authentication & authorization for sockets
   * https://stackoverflow.com/questions/26224377/authentication-with-node-express-socket-io
   */
  socket.on("broadcast", (...args: unknown[]) => {
    console.log(`SOCKET event: broadcast, kind: ${args[0]}`);
    socket.broadcast.emit("broadcast", ...args);
  });

  socket.on("get-client-count", () => {
    console.log(`SOCKET event: get-client-count`);
    socket.emit("client-count", io.engine.clientsCount);
  });
});

export default server;
