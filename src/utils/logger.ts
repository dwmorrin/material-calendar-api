/**
 * Middleware to inject logging for debugging purposes
 *
 * Example:
 *
 * [
 *   databaseQuery,
 *   logger((req, res) => `Query results: ${res.locals.results}`),
 *   responseHandler,
 * ]
 */

import { EC } from "./types";

import { request } from "http";

// basic http request example
export const fetchTest: (url: string) => EC = (url) => (_, res) => {
  const { port, hostname } = new URL(url);
  request(
    {
      hostname,
      port,
      method: "GET",
    },
    (response) => {
      res
        .status(response.statusCode || 500)
        .json({ data: response.statusMessage });
    }
  )
    .on("error", (err) => {
      res.status(500).json({ error: err.message });
    })
    .end();
};

type LoggerCB = (...args: Parameters<EC>) => string;

const stringifyBody: LoggerCB = (req) => JSON.stringify(req.body);

const stringifyLocals: LoggerCB = (_, res) => JSON.stringify(res.locals);

const logger: (cb: LoggerCB) => EC = (cb) => (req, res, next) => {
  // eslint-disable-next-line no-console
  console.log(cb(req, res, next));
  next();
};

const responder: (cb: LoggerCB) => EC = (cb) => (req, res, next) => {
  res.status(200).json({ data: cb(req, res, next) });
};

const makeLogAndRespondStack = (logCB: LoggerCB, dataCB: LoggerCB): EC[] => [
  logger(logCB),
  responder(dataCB),
];

// debugging aid
export const checkResLocals = makeLogAndRespondStack(
  stringifyLocals,
  stringifyLocals
);

// debugging aid
export const checkBody = makeLogAndRespondStack(stringifyBody, stringifyBody);

export default logger;
