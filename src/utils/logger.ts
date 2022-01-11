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

type LoggerCB = (...args: Parameters<EC>) => string;

const logger: (cb: LoggerCB) => EC = (cb) => (req, res, next) => {
  // eslint-disable-next-line no-console
  console.log(cb(req, res, next));
  next();
};

export default logger;
