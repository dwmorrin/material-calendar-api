/* eslint-disable no-console */
// load files with Node and submit to the server locally
// just importing tsv files for now

import { readFile } from "fs";
import { createInterface } from "readline";
import { request } from "http";
import { tsvParse } from "d3-dsv";
import { config } from "dotenv";
import dotenvExpand from "dotenv-expand";

dotenvExpand(config({ path: ".env" }));

const blankLine = /^\s*$/;

const removeBlankLines = (s) =>
  s
    .split("\n")
    .filter((l) => !blankLine.test(l))
    .join("\n");

if (process.argv.length < 4) {
  console.log("Usage: node fileImport.mjs <apiPath> <file>");
  process.exit(1);
}

const apiPath = process.argv[2];
if (!apiPath) {
  console.error("No url provided to import to");
  process.exit(1);
}

const filename = process.argv[3];

if (!filename) {
  console.error("No filename provided to import from");
  process.exit(1);
}

const rl = createInterface({ input: process.stdin, output: process.stdout });

const onHttpResponse = (res) => {
  res.setEncoding("utf8");
  let rawData = "";
  res.on("data", (chunk) => {
    rawData += chunk;
  });
  res.on("end", () => {
    console.log("received: " + rawData.length + " characters");
    console.log("done");
    process.exit(0);
  });
};

const afterConfirmed = (parsed) => (answer) => {
  if (answer.toLowerCase()[0] !== "y") {
    process.exit(1);
  } else {
    const body = JSON.stringify(parsed);
    const httpOptions = {
      host: "localhost",
      port: process.env.PORT,
      path: apiPath,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": body.length,
      },
    };

    const req = request(httpOptions, onHttpResponse);
    req.on("error", (err) => {
      console.error(err);
      req.end();
      process.exit(1);
    });
    req.write(body);
    req.end();
  }
};

readFile(filename, (err, data) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  const parsed = tsvParse(removeBlankLines(data.toString()));
  // verify headers and first parsed data row with user
  if (parsed.length < 1) {
    console.error("expected at least 1 header row and 1 data row.");
    process.exit(1);
  }
  const headers = parsed[0];
  console.log(headers);
  console.log("sending to " + apiPath);
  rl.question("Is this correct? (y/n): ", afterConfirmed(parsed));
});
