import app from "./app";
import server from "./sockets";

const port = app.get("port");
const env = app.get("env");

server.listen(port, () => {
  console.log(`
  App is running at http://localhost:${port} in mode ${env}

  press CTRL-C to stop
  `);
});

export default server;
