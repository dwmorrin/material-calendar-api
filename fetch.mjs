#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * a tool for quickly pinging the development app's API
 * usage: node path/to/thisFile.js apiPath
 *
 * example: node fetch.js
 * example: node fetch.js /api/data
 *
 * uses the project's .env file for auto-configuration
 */
import { program } from "commander";
import { config } from "dotenv";
import dotenvExpand from "dotenv-expand";
import { request } from "http";

dotenvExpand(config({ path: ".env" }));

program
  .version("0.0.1")
  .arguments("[path]")
  .action(function (path) {
    this.path = path;
  })
  .option("-h|--host <url>", "host", "localhost")
  .option("-d|--data <body>", "data")
  .option("-m|--method <method>", "HTTP method")
  .option("-1|--one ", "limit output to one result");

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
  let rawData = "";
  res.on("data", (chunk) => {
    rawData += chunk;
  });
  res.on("end", () => {
    try {
      const parsed = JSON.parse(rawData);
      const data = parsed.data;
      if (!data) {
        console.log("(No data property in response.)");
      } else {
        console.dir(Array.isArray(data) && program.one ? data[0] : data, {
          depth: null,
          colors: true,
        });
      }
      delete parsed.data;
      if (Object.keys(parsed).length > 0) {
        console.dir(parsed, { depth: null, colors: true });
      }
    } catch (error) {
      console.log("hit an error in parsing, dumping data");
      console.log(rawData);
      console.log("Parsing hit this error:", error);
    }
  });
};
const req = request(options, onResponse);

req.on("error", console.error);

program.data && req.write(program.data);

req.end();
