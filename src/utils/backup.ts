/**
 * API for creating and downloading MySQL database backups using mysqldump.
 *
 * GET requests without params returns a list of downloadable files.
 * GET requests with a valid filename can download that file.
 * POST requests create a new backup.  File name contains date & time.
 *
 * All config info, including absolute path to the backup directory,
 * should be contained in the .env file.
 *
 * @packageDocumentation
 */

import fs from "fs";
import path from "path";
import { exec, spawn } from "child_process";
import { Router } from "express";
import { EC } from "./types";

const withBackupConfig: EC = (_, res, next) => {
  const {
    MYSQL_BACKUP_DIR = "",
    MYSQL_USER = "",
    MYSQL_PASSWORD = "",
    MYSQL_DATABASE = "",
  } = process.env;
  const configError = "backup not configured; contact admin";
  if (
    [MYSQL_BACKUP_DIR, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE].some(
      (string) => string === ""
    )
  )
    return next(configError);
  if (!fs.existsSync(MYSQL_BACKUP_DIR)) return next(configError);
  res.locals.config = {
    directory: MYSQL_BACKUP_DIR,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
  };
  next();
};

//-------- backup.controller ---- //

/**
 * getTimestamp returns a "YYYY-mm-dd_HH:MM:SS" format string in local time
 */
const getTimestamp = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 1000 * 60)
    .toJSON()
    .replace("T", "_")
    .split(".")[0];
};

const createBackup: EC = (_, res, next) => {
  const { database, directory, password, user } = res.locals.config;
  const filename = `db_backup_${getTimestamp()}.sql`;
  const stream = fs.createWriteStream(path.join(directory, filename));
  const schemaFile = spawn("mysqldump", [
    "--single-transaction",
    `-u${user}`,
    `-p${password}`,
    database,
  ]);

  schemaFile.stdout.pipe(stream).on("finish", next).on("error", next);
};

const getBackup: EC = (req, res) => {
  const { directory } = res.locals.config;
  const { filename = "" } = req.params;
  const filepath = path.join(directory, filename);
  if (filename === "" || !fs.existsSync(filepath)) {
    return res.status(404).json({
      error: {
        code: 404,
        message: "no backup to get with that name",
      },
    });
  }
  res.download(filepath);
};

const getListOfBackups: EC = (_, res, next) => {
  const { directory } = res.locals.config;
  fs.readdir(directory, (err, files) => {
    if (err) return next(err);
    return res.status(200).json({ data: files });
  });
};

/**
 * restoreFromFilename accepts a user supplied filename, then looks that
 * filename up in the backups directory to verify it is valid and not an
 * injection attack.
 * WARNING: this runs the commands DROP DATABASE, CREATE DATABASE then imports
 * the file.  It does not backup first and just sends back err, stdout, stderr
 * for the client to figure out what to do next in case of catastrophic failure.
 */
const restoreFromFilename: EC = (req, res, next) => {
  const { directory } = res.locals.config;
  fs.readdir(directory, (err, files) => {
    if (err) return next(err);
    const { filename } = req.params;
    const foundFilename = files.find((f) => f === filename);
    if (!filename || !foundFilename) {
      return res.status(400).json({
        error: {
          code: 400,
          message: `given filename "${filename}", does not exist`,
        },
      });
    }
    res.locals.filename = filename;
    next();
  });
};

const execDropDatabase: EC = (_, res, next) => {
  const { user, password, database } = res.locals.config;
  exec(
    `mysql -u${user} -p${password} -e 'DROP DATABASE ${database}'`,
    (err) => {
      if (err) return next(err);
      next();
    }
  );
};

const execCreateDatabase: EC = (_, res, next) => {
  const { user, password, database } = res.locals.config;
  exec(
    `mysql -u${user} -p${password} -e 'CREATE DATABASE ${database}'`,
    (err) => {
      if (err) return next(err);
      next();
    }
  );
};

const execRestoreDatabase: EC = (_, res, next) => {
  const { user, password, database, directory } = res.locals.config;
  const filepath = path.join(directory, res.locals.filename);
  exec(
    `mysql -u${user} -p${password} ${database} < ${filepath}`,
    (err, stdout, stderr) => {
      if (err) return next(err);
      res.status(201).json({ data: { stdout, stderr } });
    }
  );
};

//----- backup.router -----//
const router = Router();

router.use(withBackupConfig);

router.get("/", getListOfBackups);
router.get("/:filename", getBackup);
router.post("/", createBackup, getListOfBackups);
router.post(
  "/restore/:filename",
  restoreFromFilename,
  execDropDatabase,
  execCreateDatabase,
  execRestoreDatabase
);

export default router;
