import app from "./app";

const port = app.get("port");
const env = app.get("env");
const server = app.listen(port, () => {
  console.log(`
  App is running at http://localhost:${port} in mode ${env}

  press CTRL-C to stop
  `);
});

export default server;
