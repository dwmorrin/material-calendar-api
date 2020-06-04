import { Request, Response } from "express";
import pool, { error500, inflate } from "./db";

export const createOne = (table: string) => (req: Request, res: Response) => {
  pool.query("INSERT INTO ?? SET ?", [table, req.body], (err, results) => {
    if (err) return results.status(500).json(error500(err));
    res
      .status(201)
      .json({ data: results.insertId, context: req.query.context });
  });
};

export const getMany = (table: string) => (req: Request, res: Response) => {
  pool.query("SELECT * FROM ??", [table], (err, rows) => {
    if (err) return res.status(500).json(error500(err));
    res
      .status(200)
      .json({ data: rows.map(inflate), context: req.query.context });
  });
};

export const getOne = (table: string, key: string) => (
  req: Request,
  res: Response
) => {
  pool.query(
    "SELECT * FROM ?? WHERE ?? = ?",
    [table, key, req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json(error500(err));
      res
        .status(200)
        .json({ data: inflate(rows[0]), context: req.query.context });
    }
  );
};

export const removeOne = (table: string, key: string) => (
  req: Request,
  res: Response
) => {
  pool.query(
    "DELETE FROM ?? WHERE ?? = ?",
    [table, key, req.params.id],
    (err, results) => {
      if (err) return res.status(500).json(error500(err));
      res
        .status(200)
        .json({ data: results.affectedRows, context: req.query.context });
    }
  );
};

export const updateOne = (table: string, key: string) => (
  req: Request,
  res: Response
) => {
  pool.query(
    "UPDATE ?? SET ? WHERE ?? = ?",
    [table, req.body, key, req.params.id],
    (err, results) => {
      if (err) return res.status(500).json(error500(err));
      res
        .status(200)
        .json({ data: results.affectedRows, context: req.query.context });
    }
  );
};

export const controllers = (table: string, key: string) => ({
  createOne: createOne(table),
  getMany: getMany(table),
  getOne: getOne(table, key),
  removeOne: removeOne(table, key),
  updateOne: updateOne(table, key),
});
