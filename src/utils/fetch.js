/**
 * a tool for quickly pinging the development app's API
 * usage: node path/to/thisFile.js apiPath
 *
 * example: node fetch.js
 * example: node fetch.js /api/data
 *
 * uses the project's .env file for auto-configuration
 * TODO add authentication options (cookies, jwt, etc)
 */
const { program } = require("commander");
const dotenv = require("dotenv");
const dotenvExpand = require("dotenv-expand");
const http = require("http");

dotenvExpand(dotenv.config({ path: ".env" }));

program
  .version("0.0.1")
  .arguments("[path]")
  .action(function (path) {
    this.path = path;
  })
  .option("-h|--host <url>", "host", "localhost")
  .option("-d|--data <body>", "data")
  .option("-m|--method <method>", "HTTP method");

program.parse(process.argv);

const options = {
  host: program.host,
  port: process.env.PORT,
  path: program.path || "/",
  method: program.method || "GET",
};

if (program.data) {
  options.headers = {
    "Content-Type": "application/json",
    "Content-Length": program.data.length,
  };
}

const onResponse = (res) => {
  console.log(
    `STATUS: ${res.statusCode}\n\n`,
    `HEADERS: ${JSON.stringify(res.headers, null, 2)}\n\n`,
    "DATA:"
  );
  res.setEncoding("utf8");
  res.on("data", (chunk) => {
    try {
      console.log(JSON.parse(chunk));
    } catch (error) {
      console.log(chunk);
    }
  });
};
const req = http.request(options, onResponse);

req.on("error", console.error);

program.data && req.write(program.data);

req.end();
