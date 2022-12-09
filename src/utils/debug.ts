/**
 * This file meant to provide a quick API "scratchpad" for development.
 * The route should be protected to only work in development.
 */
import { Connection, MysqlError } from "mysql";
import { Response, Router } from "express";
import pool from "./db";

export const debugRouter = Router();

const onCommit = (db: Connection) => (err: MysqlError) => {
  if (err)
    return db.rollback(() => {
      throw err;
    });
};

const onRollback = (res: Response) => (err: MysqlError) => {
  if (err) return res.json({ error: "can't rollback" });
  return res.json({ data: "rollback successful" });
};

const onResults =
  (res: Response, db: Connection) => (err: MysqlError, result: unknown[]) => {
    if (err) return db.rollback(onRollback(res));
    db.commit(onCommit(db));
    return res.json({ data: { message: "commit successful", result } });
  };

const onTransactionBegin =
  (res: Response, db: Connection) => (err: MysqlError) => {
    if (err) return res.json({ error: "can't begin transaction" });
    db.query("SELECT COUNT(*) FROM user", onResults(res, db));
  };

debugRouter.post("/transaction", (req, res) => {
  const { body } = req;
  if (!body) {
    return res.json({ error: "expected body" });
  }
  pool.getConnection((err, db) => {
    if (err) return res.json({ error: "no connection available" });
    db.beginTransaction(onTransactionBegin(res, db));
  });
});

debugRouter.use((_, res) => {
  pool.query("SELECT 1", (err, results) => {
    if (err) return res.json({ error: "There was an error" });
    return res.json({ data: results });
  });
});
