import mysql, { MysqlError } from "mysql";

/**
 * returns generic JSON response for MySQL errors for production
 * and the raw MySQL errors for development
 */
export const error500 = (rawDbError: MysqlError) =>
  process.env.NODE_ENV === "development"
    ? rawDbError
    : {
        error: {
          code: 500,
          message: "could not start session, try back later",
        },
      };

/**
 * Pool reuses connections, up to the connection limit.
 * Creates connectiontions lazily.  When no connections are available, requests
 * a put in a queue.
 *
 * Use
 *   pool.query()
 * for simple queries as it implicity gets and releases connections.
 *
 * Use explicit
 *   pool.getConnection() -> connection.query() -> connection.release()
 * pattern when you are doing complex queries such as transactions or doing
 * serial queries where the next query depends upon the previous results.
 */
const pool = mysql.createPool({
  connectionLimit: 10,
  // debug: process.env.NODE_ENV === "development",
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});

export default pool;
