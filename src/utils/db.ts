import mysql from "mysql";
import { map, tryCatch } from "ramda";

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
});

export default pool;
