// import the database schema and create the initial admin user

import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createConnection } from "mysql";
import { prompt, schema } from "./startup-prompt.mjs";
import { genSaltSync, hashSync } from "bcrypt";
import { promisify } from "util";
import { exec as _exec } from "child_process";
const exec = promisify(_exec);
import { config } from "dotenv";
import dotenvExpand from "dotenv-expand";
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenvExpand(config({ path: join(__dirname, "..", ".env") }));

// get mysql connection info from .env
const {
  MYSQL_USER = "",
  MYSQL_PASSWORD = "",
  MYSQL_DATABASE = "",
  MYSQL_HOST = "",
  NET_ID = "",
  ADMIN_PASSWORD = "",
  ADMIN_FIRST_NAME = "",
  ADMIN_LAST_NAME = "",
  ADMIN_EMAIL = "",
} = process.env;
if (![MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE].every(String)) {
  fatal(".env variables not set");
}

if (
  [
    NET_ID,
    ADMIN_PASSWORD,
    ADMIN_FIRST_NAME,
    ADMIN_LAST_NAME,
    ADMIN_EMAIL,
  ].every(String)
) {
  initializeDatabase(undefined, {
    user: NET_ID,
    password: ADMIN_PASSWORD,
    first: ADMIN_FIRST_NAME,
    last: ADMIN_LAST_NAME,
    email: ADMIN_EMAIL,
  });
} else
  try {
    prompt.get(schema, initializeDatabase);
  } catch (error) {
    fatal(error);
  }

/**
 * @param error error from prompt
 * @param responses user's responses from prompt
 * @throws await exec throws errors if exit code not 0
 */
async function initializeDatabase(error, responses) {
  if (error) fatal(error);
  const { user, password, first, last, email } = responses;
  const mysqlCli = `mysql -u${MYSQL_USER} -p${MYSQL_PASSWORD}`;
  // using mysql utility to prepare database for mysqljs lib
  const mysqlCmd = (statement) => `${mysqlCli} -e "${statement}"`;

  /**
   * my.cnf should have the following:
   *   default_authentication_plugin=mysql_native_password
   * if not, then uncomment the lines below if you get the following error:
   * errno 1251 ER_NOT_SUPPORT_AUTH_MODE
   */
  // await exec(
  //   mysqlCmd(
  //     `ALTER USER '${MYSQL_USER}'@'%' IDENTIFIED WITH mysql_native_password by '${MYSQL_PASSWORD}'`
  //   )
  // );

  // convenient to run this command here; could be done with mysqljs lib
  await exec(mysqlCmd(`DROP DATABASE IF EXISTS ${MYSQL_DATABASE}`));
  await exec(mysqlCmd(`CREATE DATABASE ${MYSQL_DATABASE}`));
  await exec(
    `${mysqlCli} ${MYSQL_DATABASE} < "${join(
      __dirname,
      "material_calendar.sql"
    )}"`
  );

  // now we should be able to test/use the mysqljs library
  // and add an new entry to the "user" table
  const connection = createConnection({
    host: MYSQL_HOST,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
  });
  connection.query(
    insertNewUserQuery({
      user,
      password: encrypt(password),
      first,
      last,
      email,
    }),
    (error) => {
      if (error) fatal(error);
      else console.log("user added");
    }
  );
  connection.end();
}

function encrypt(plaintext) {
  return hashSync(plaintext, genSaltSync(10));
}

function fatal(error) {
  console.error(error);
  process.exit(1);
}

function insertNewUserQuery({ user, password, first, last, email }) {
  return `
    INSERT INTO user (
      user_id, password, first_name, last_name, email, user_type
    ) VALUES (
      '${user}', '${password}', '${first}', '${last}', '${email}', 1
    )`;
}
