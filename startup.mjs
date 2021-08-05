/* eslint-disable no-console */

import { existsSync, mkdirSync, readFile, unlinkSync, writeFileSync } from "fs";
import { exec } from "child_process";

import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
dotenvExpand(dotenv.config({ path: ".env" }));

import { format, addMonths } from "date-fns";

const sqlDate = (date = new Date()) => format(date, "yyyy-MM-dd");

const {
  ADMIN_FIRST_NAME = "Ad",
  ADMIN_LAST_NAME = "Min",
  ADMIN_PASSWORD = "password",
  AUTH_ID = "admin",
  EMAIL_FROM = "admin@booking.app",
  MYSQL_BACKUP_DIR = "backups",
  MYSQL_DATABASE = "app_data",
  MYSQL_HOST = "127.0.0.1",
  MYSQL_PASSWORD = "password",
  MYSQL_SHA2_PASSPHRASE = "passphrase",
  MYSQL_USER = "root",
  SEMESTER_END = sqlDate(addMonths(new Date(), 3)),
  SEMESTER_START = sqlDate(),
  SEMESTER_TITLE = "Default Semester",
} = process.env;

const words = {
  ADMIN_FIRST_NAME,
  ADMIN_LAST_NAME,
  ADMIN_PASSWORD,
  AUTH_ID,
  EMAIL_FROM,
  MYSQL_DATABASE,
  MYSQL_PASSWORD,
  MYSQL_SHA2_PASSPHRASE,
  SEMESTER_END,
  SEMESTER_START,
  SEMESTER_TITLE,
};

const replaceAllPlaceholders = (str, words) => {
  const regex = /{{(\w+)}}/g;
  const matches = str.matchAll(regex);
  for (const match of matches) {
    const word = words[match[1]];
    str = str.replace(match[0], word);
  }
  return str;
};

// Create the backup directory if it doesn't exist
if (!existsSync(MYSQL_BACKUP_DIR)) mkdirSync(MYSQL_BACKUP_DIR);

// Create the database
readFile("./sql/startup.sql", "utf8", (err, sqlTemplate) => {
  if (err) {
    console.error(err);
    return process.exit(1);
  }
  const sqlScript = replaceAllPlaceholders(sqlTemplate, words);
  const tmp = `${MYSQL_DATABASE}.script.sql`;
  writeFileSync(tmp, sqlScript);
  // using "localhost" doesn't always work. 127.0.0.1 seems to be more reliable.
  exec(
    `mysql -h${
      MYSQL_HOST === "localhost" ? "127.0.0.1" : MYSQL_HOST
    } -u${MYSQL_USER} -p${MYSQL_PASSWORD} < ${tmp}`,
    (err, stdout, stderr) => {
      if (err) console.error(err);
      // ignoring the password warning
      if (stderr && !stderr.includes("Using a password on the command"))
        console.error(stderr);
      if (stdout) console.log(stdout);
      unlinkSync(tmp);
    }
  );
});
