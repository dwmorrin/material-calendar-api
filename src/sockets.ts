import app from "./app";
import http from "http";
import io from "socket.io";

const server = http.createServer(app);
const sockets = io(server);

sockets.on("connection", (_) => console.log("user connected"));

export default server;
