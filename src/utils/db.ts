/* eslint-disable no-console */
import mysql, { Connection, ConnectionConfig, PoolConfig } from "mysql";
import { map, tryCatch } from "ramda";
import { EC, EEH } from "./types";

/**
 * Tries to parse each data as JSON.  If there's no data, or the datum is not
 * JSON, the input is just echoed back out.
 * @param strOrJSON
 */
const jsonParseSafe = (strOrJSON: string) =>
  tryCatch(JSON.parse, () => strOrJSON)(strOrJSON);

/**
 * Expands records that have JSON fields.
 * @param data a single record returned from MySQL
 */
export const inflate = (data = {}): Record<string, unknown> =>
  map(jsonParseSafe, data);

/**
 * Pool reuses connections, up to the connection limit.
 * Creates connections lazily.  When no connections are available, requests
 * a put in a queue.
 *
 * Use
 *   pool.query()
 * for simple queries as it implicitly gets and releases connections.
 *
 * Use explicit
 *   pool.getConnection() -> connection.query() -> connection.release()
 * pattern when you are doing complex queries such as transactions or doing
 * serial queries where the next query depends upon the previous results.
 */
const config: PoolConfig & ConnectionConfig = {
  //timezone: "Z",
  dateStrings: true,
  connectionLimit: 10,
  // debug: process.env.NODE_ENV === "development",
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  typeCast(field, next) {
    if (field.type === "TINY" && field.length === 1) {
      return field.string() === "1"; // 1 = true, 0 = false
    } else {
      return next();
    }
  },
};

export const getUnsafeMultipleStatementConnection = (): Connection =>
  mysql.createConnection({
    ...config,
    multipleStatements: true,
  });

const commitTransaction: EC = (_, res, next) => {
  const connection: Connection = res.locals.connection;
  connection.commit((err) => {
    if (err) return next(err);
    connection.end((error) => {
      if (error) return next(error);
      delete res.locals.connection;
      next();
    });
  });
};

const rollbackGuard: EEH = (error, _, res, next) => {
  const connection: Connection = res.locals.connection;
  if (!connection) return next(error);
  console.log("error during transaction; calling rollback");
  connection.rollback(() => next(error));
};

const unsafeConnectionErrorHandler: EEH = (error, _, res, next) => {
  const connection: Connection = res.locals.connection;
  if (!connection) return next(error);
  console.log("terminating unsafe connection due to error:");
  console.log(error);
  connection.end((error2) => {
    if (error2) return next(error2);
    delete res.locals.unsafeConnection;
    next(error);
  });
};

const _startTransaction: EC = (_, res, next) => {
  const unsafeConnection = getUnsafeMultipleStatementConnection();
  res.locals.connection = unsafeConnection;
  unsafeConnection.beginTransaction((err) => {
    if (err) return next(err);
    next();
  });
};

// wrapped in an array for consistency with endTransaction
// usage: router.method(path, [...startTransaction, doStuff, ...endTransaction])
export const startTransaction = [_startTransaction];

// requires res.locals.connection is a Connection
export const endTransaction = [
  commitTransaction,
  rollbackGuard,
  unsafeConnectionErrorHandler,
];

const pool = mysql.createPool(config);

export default pool;
