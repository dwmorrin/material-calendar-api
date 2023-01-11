import { Connection, MysqlError } from "mysql";
import { Request, Response } from "express";
import { EC } from "../../utils/types";
import pool from "../../utils/db";

type SqlFn = (
  req: Request,
  res: Response,
  conn: Connection
) => (err: MysqlError | null, results?: unknown[]) => void;

export const lockHandler: EC = (req, res, next) => {
  const eventId = Number(req.params.id);
  if (isNaN(eventId) || eventId < 1) return next("invalid event ID");
  res.locals.eventId = eventId;
  pool.getConnection((err, conn) => {
    if (err) return res.json({ error: "no database connection available" });
    conn.beginTransaction(getLock(req, res, conn));
  });
};

const onRollback: SqlFn = (_, res) => (err) => {
  if (err) return res.json({ error: "database error: could not rollback" });
  return res.json({ error: "Something went wrong. Try again." });
};

const getLock: SqlFn = (req, res, conn) => (err) => {
  if (err) return res.json({ error: "could not get lock" });
  conn.query(
    "SELECT lock_user_id FROM event WHERE id = ?",
    res.locals.eventId,
    tryLock(req, res, conn)
  );
};

const tryLock: SqlFn = (req, res, conn) => (err, results) => {
  if (err || !(Array.isArray(results) && results.length))
    return conn.rollback(onRollback(req, res, conn));
  const lockUserId: number | null = results[0].lock_user_id;
  if (/\/lock$/.test(req.path)) {
    // req.path === "/:id/lock"
    if (lockUserId) {
      conn.commit();
      return res.json({ data: {} });
    }
    conn.query(
      "UPDATE event SET lock_user_id = ?, locked_time = NOW() WHERE id = ?",
      [res.locals.user.id, res.locals.eventId],
      () => {
        conn.commit();
        if (err) return res.status(500).json({ error: err });
        return res.status(200).json({ data: {} });
      }
    );
  } else {
    // req.path === "/:id/unlock"
    if (!lockUserId) {
      conn.commit();
      return res.status(400).json({ error: "event is not locked" });
    }
    if (lockUserId !== res.locals.user.id) {
      conn.commit();
      return res.status(400).json({ error: "not owner of event lock" });
    }
    conn.query(
      "UPDATE event SET lock_user_id = NULL, locked_time = NULL WHERE id = ?",
      [res.locals.eventId],
      () => {
        conn.commit();
        if (err) return res.status(500).json({ error: err });
        return res.status(200).json({ data: {} });
      }
    );
  }
};
