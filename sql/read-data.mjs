/**
 * Optionally insert data from a JSON file
 */
import { readFile } from "fs";
import { createPool } from "mysql";

const filename = process.argv[2];
if (typeof filename !== "string") {
  console.error("which data file?");
  process.exit(1);
}

readFile(filename, "utf8", (error, data) => {
  if (error) throw error;
  insertRecords(JSON.parse(data));
});

function insertRecords(schema) {
  const pool = createPool({
    host: schema.host,
    user: schema.user,
    password: schema.password,
    database: schema.database,
  });
  // end pool after all records have been inserted
  const onInsert = withCountInserts(schema, () => pool.end());
  Object.entries(schema.tables).forEach(([table, records]) => {
    records.forEach((record) => {
      pool.query(`INSERT INTO ?? SET ?`, [table, record], onInsert);
    });
  });
}

/**
 * Queries run in parallel, so if we know how many records there are,
 * we can execute a callback after all records have been read.
 */
function withCountInserts(schema, cb) {
  let inserts = 0;
  const totalInserts = countRecords(schema);
  return (error) => {
    ++inserts;
    if (error) console.error(error);
    if (inserts === totalInserts) cb();
  };
}

function countRecords(schema) {
  return Object.values(schema.tables).reduce(
    (total, records) => total + records.length,
    0
  );
}
