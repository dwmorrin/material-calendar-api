import app from "./app";
import http from "http";
import { Server } from "socket.io";

const server = http.createServer(app);

const io = new Server(server);

const formattedError = (event: string, error: unknown): void =>
  console.error(new Date().toLocaleString(), "SOCKET error on", event, error);

io.on("connection", (socket) => {
  /**
   * Broadcast to all users
   * Currently no inspection of the message and data. (Just a repeater.)
   * Could have the server do some work here if needed.
   * TODO: authentication & authorization for sockets
   * https://stackoverflow.com/questions/26224377/authentication-with-node-express-socket-io
   */
  socket.on("broadcast", (...args: unknown[]) => {
    try {
      console.log(`SOCKET event: broadcast, kind: ${args[0]}`);
      socket.broadcast.emit("broadcast", ...args);
    } catch (error) {
      formattedError("broadcast", error);
    }
  });

  socket.on("get-client-count", () => {
    try {
      console.log(`SOCKET event: get-client-count`);
      socket.emit("client-count", io.engine.clientsCount);
    } catch (error) {
      formattedError("get-client-count", error);
    }
  });

  socket.on("disconnect", () => {
    try {
      console.log(`SOCKET event: disconnect`);
    } catch (error) {
      formattedError("disconnect", error);
    }
  });
});

export default server;
