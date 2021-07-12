/**
 * Optionally insert data from a JSON file
 */
import { readFile } from "fs";
import { createPool } from "mysql";
import { addMonths, formatISO9075 } from "date-fns";

/**
 * A table name mapped to an array of table records.
 * @typedef {Record<string,unknown[]>} Tables
 */
/**
 * Structure of the JSON data file
 * @typedef {Object} Schema
 * @property {string} host
 * @property {number} port
 * @property {string} user
 * @property {string} password
 * @property {string} database
 * @property {Tables} tables
 */

const filename = process.argv[2];
if (!filename) {
  console.error("which data file?");
  process.exit(1);
}

readFile(filename, "utf8", (error, data) => {
  if (error) throw error;
  insertRecords(JSON.parse(data));
});

/**
 * @param {Schema} schema
 */
function insertRecords(schema) {
  const { tables } = schema;
  const totalRecords = countRecords(tables);
  if (!totalRecords) {
    console.error("no records found. nothing to do.");
    process.exit(1);
  }
  const pool = createPool({
    host: schema.host,
    user: schema.user,
    password: schema.password,
    database: schema.database,
  });
  // end pool after all records have been inserted
  const onInsert = withCountTo(totalRecords, () => pool.end());
  Object.entries(schema.tables).forEach(([table, records]) => {
    records.forEach((record) => {
      pool.query(
        `INSERT INTO ?? SET ?`,
        [table, replaceVariableDates(record, schema.defaults)],
        onInsert
      );
    });
  });
}

/**
 * @param {Record<string, unknown>} record
 * @returns {Record<string, unknown>}
 */
function replaceVariableDates(record, defaults = {}) {
  const replaced = {};
  for (const key in record) {
    let value = record[key];
    if (typeof value !== "string") continue;
    if (value.startsWith("$")) {
      value = value.slice(1);
      if (value === "DEFAULT") replaced[key] = defaults[key];
      else if (value === "NOW")
        replaced[key] = formatISO9075(new Date(), { representation: "date" });
      else if (value.startsWith("MONTHS")) {
        const months = Number(value.slice(6));
        replaced[key] = formatISO9075(addMonths(new Date(), months), {
          representation: "date",
        });
      }
    }
  }
  return { ...record, ...replaced };
}

/**
 * Returns a function that counts each time the return function is called.
 * When the return function is called `count` times, the provided callback
 * function is executed.
 * @param {number} count execute callback
 * @param {() => void} cb callback function
 * @returns {(error: MysqlError) => void}
 */
function withCountTo(count, cb) {
  if (count < 1) throw new Error("count must be greater than zero");
  let fnCallCount = 0;
  return (error) => {
    ++fnCallCount;
    if (error) console.error(error);
    if (fnCallCount === count) cb();
  };
}

/**
 * @param {Tables} tables
 * @returns {number}
 */
function countRecords(tables) {
  return Object.values(tables).reduce(
    (total, records) => total + records.length,
    0
  );
}
