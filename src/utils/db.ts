/* eslint-disable no-console */
import mysql, {
  Connection,
  PoolConnection,
  ConnectionConfig,
  MysqlError,
  PoolConfig,
} from "mysql";
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

export const getUnsafeMultipleStatementConnection = (): Connection => {
  const connection = mysql.createConnection({
    ...config,
    multipleStatements: true,
  });
  connection.on("error", (error) => {
    console.error(
      new Date().toLocaleString(),
      "[unhandled error in multi statement connection]",
      error
    );
  });
  return connection;
};

const commitMultiStatementTransaction: EC = (_, res, next) => {
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

const commit: EC = (_, res, next) => {
  const connection: PoolConnection = res.locals.connection;
  connection.commit((err) => {
    connection.release();
    delete res.locals.connection;
    if (err) return next(err);
    next();
  });
};

const rollbackGuard: EEH = (error, _, res, next) => {
  const connection: Connection | PoolConnection = res.locals.connection;
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

const _startMultiStatementTransaction: EC = (_, res, next) => {
  const unsafeConnection = getUnsafeMultipleStatementConnection();
  res.locals.connection = unsafeConnection;
  unsafeConnection.beginTransaction((err) => {
    if (err) return next(err);
    next();
  });
};

// wrapped in an array for consistency with endTransaction
// usage: router.method(path, [...startTransaction, doStuff, ...endTransaction])
export const startMultiStatementTransaction = [_startMultiStatementTransaction];

// requires res.locals.connection is a Connection
export const endMultiStatementTransaction = [
  commitMultiStatementTransaction,
  rollbackGuard,
  unsafeConnectionErrorHandler,
];

const pool = mysql.createPool(config);
pool.on("error", (error) => {
  console.error(
    new Date().toLocaleString(),
    "[unhandled mysqljs error on pool connection]",
    error
  );
});

const putConnectionOnRes: EC = (_, res, next) => {
  pool.getConnection((err, connection) => {
    if (err) return res.json({ error: "no connection available" });
    res.locals.connection = connection;
    next();
  });
};

const beginTransaction: EC = (_, res, next) => {
  const db = res.locals.connection;
  db.beginTransaction((err: MysqlError) => {
    if (err) return next(err);
    next();
  });
};

export const useTransaction = (
  guardedFns: EC[],
  responseFns: EC[]
): (EC | EEH)[] => [
  putConnectionOnRes,
  beginTransaction,
  ...guardedFns,
  commit,
  ...responseFns,
  rollbackGuard,
];

export default pool;
