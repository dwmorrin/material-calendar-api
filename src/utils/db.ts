import mysql, { MysqlError } from "mysql";
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
export const inflate = (data = {}): {} => map(jsonParseSafe, data);

/**
 * Helper function to translate MySQL values (TINYINT) to JS booleans.
 * Keys given that do not exist in the source object are silently ignored.
 * @param obj data from MySQL
 * @param keys array of string keys to map to bool
 */
export const mapKeysToBool = (...keys: string[]) => (
  obj: { [key: string]: unknown } = {}
) => ({
  ...obj,
  ...keys.reduce(
    (result, key) => (key in obj ? { ...result, [key]: !!obj[key] } : result),
    {}
  ),
});

/**
 * turns column_name => columnName
 * @param str snake_case style string
 * @returns camelCase style string
 */
export const snakeToCamel = (str: string) =>
  str.replace(/(_[a-z])/g, (underscoreLetter) =>
    underscoreLetter.toUpperCase().replace("_", "")
  );

/**
 * returns generic JSON response for MySQL errors for production
 * and the raw MySQL errors for development
 */
export const error500 = (rawDbError: MysqlError, context: unknown) => {
  console.error(rawDbError);
  return process.env.NODE_ENV === "development"
    ? {
        error: { message: rawDbError.sqlMessage || rawDbError.message },
        context,
      }
    : {
        error: {
          code: 500,
          message: "uh-oh, the server encountered an error, try back later",
        },
        context,
      };
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
  timezone: "Z",
  connectionLimit: 10,
  // debug: process.env.NODE_ENV === "development",
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});

export default pool;
