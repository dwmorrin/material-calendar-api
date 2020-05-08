/**
 * a tool for quickly pinging the development app's API
 * usage: node path/to/thisFile.js apiPath
 * example: node fetch.js # if PORT=3000, tries localhost:3000/
 * example: node fetch.js /api/data # tries localhost:3000/api/data
 * !WIP
 * TODO add POST
 * TODO add support for auth (cookies, tokens)
 */
const dotenv = require("dotenv");
const dotenvExpand = require("dotenv-expand");
const http = require("http");

dotenvExpand(dotenv.config({ path: ".env" }));

const args = process.argv.slice(2);
const path = args[0] || "";
const options = {
  host: "localhost",
  port: process.env.PORT,
  path,
  method: "GET",
};

const onResponse = (res) => {
  console.log(`STATUS: ${res.statusCode}
  HEADERS: ${JSON.stringify(res.headers)}
  `);
  res.setEncoding("utf8");
  res.on("data", (chunk) => console.log(`BODY: ${chunk}`));
};
const req = http.request(options, onResponse);

req.on("error", console.error);

req.end();
