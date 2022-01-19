import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "process";
import { writeFileSync } from "fs";

const sqlDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addMonths = (date, months) => {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
};

const defaultEnv = {
  ADMIN_FIRST_NAME: "Ad",
  ADMIN_LAST_NAME: "Min",
  ADMIN_PASSWORD: "password",
  AUTH_ID: "admin",
  AUTH_METHOD: "DOT_ENV_AUTH_ID",
  EMAIL_FROM: "Calendar App <admin@calendar.app>",
  EMAIL_PORT: 2525,
  MYSQL_BACKUP_DIR: "database-backups",
  MYSQL_DATABASE: "booking",
  MYSQL_HOST: "localhost",
  MYSQL_PASSWORD: "password",
  MYSQL_SHA2_PASSPHRASE: "passphrase",
  MYSQL_USER: "root",
  NODE_ENV: "development",
  PORT: 3001,
  SEMESTER_END: sqlDate(addMonths(new Date(), 6)),
  SEMESTER_START: sqlDate(),
  SEMESTER_TITLE: `Semester ${new Date().getFullYear()}`,
  SESSION_SECRET: "session-secret",
};

const rl = readline.createInterface({ input, output });

const result = {};
for (const key in defaultEnv) {
  const defaultValue = defaultEnv[key];
  const answer = await rl.question(`${key} [${defaultValue}]: `);
  result[key] = answer || defaultValue;
}

const answer = await rl.question(
  `${JSON.stringify(
    result,
    null,
    2
  )}\nAre you sure you want to import this environment? (y/n) `
);

rl.close();

if (answer.toLowerCase() !== "y") {
  process.exit(0);
}

const envFile = Object.entries(result)
  .map(([key, value]) => `${key}="${value}"`)
  .join("\n");

writeFileSync(".env", envFile);
