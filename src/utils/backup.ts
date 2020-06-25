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
import { spawn } from "child_process";
import { Request, Response, Router } from "express";

const getBackupConfig = () => {
  const {
    MYSQL_BACKUP_DIR = "",
    MYSQL_USER = "",
    MYSQL_PASSWORD = "",
    MYSQL_DATABASE = "",
  } = process.env;
  if (
    [MYSQL_BACKUP_DIR, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE].some(
      (string) => string === ""
    )
  )
    return null;
  if (!fs.existsSync(MYSQL_BACKUP_DIR)) return null;
  return {
    directory: MYSQL_BACKUP_DIR,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
  };
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
const createBackup = (_: Request, res: Response) => {
  const config = getBackupConfig();
  if (!config) {
    return res.status(500).json({
      error: { code: 500, message: "backup not setup; contact admin" },
    });
  }
  const filename = `db_backup_${getTimestamp()}.sql`;
  const wstream = fs.createWriteStream(path.join(config.directory, filename));
  const mysqldump = spawn("mysqldump", [
    "--single-transaction",
    `-u${config.user}`,
    `-p${config.password}`,
    config.database,
  ]);

  mysqldump.stdout
    .pipe(wstream)
    .on("finish", () => {
      getListOfBackups(_, res);
    })
    .on("error", (err) => {
      res.status(500).json(err);
    });
};

const getBackup = (req: Request, res: Response) => {
  const config = getBackupConfig();
  if (!config) {
    return res.status(500).json({
      error: { code: 500, message: "backup not setup; contact admin" },
    });
  }

  const { filename = "" } = req.params;
  const filepath = path.join(config.directory, filename);
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

const getListOfBackups = (_: Request, res: Response) => {
  const config = getBackupConfig();
  if (!config) {
    return res.status(500).json({
      error: { code: 500, message: "backup not setup; contact admin" },
    });
  }

  fs.readdir(config.directory, (err, files) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json({ data: files });
  });
};

//----- backup.router -----//
const router = Router();

router.get("/", getListOfBackups);
router.get("/:filename", getBackup);
router.post("/", createBackup);

export default router;
