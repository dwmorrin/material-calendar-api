import { Request, Response } from "express";
import pool, { error500, inflate } from "./db";

export const createOne = (table: string) => (req: Request, res: Response) => {
  pool.query("INSERT INTO ?? SET ?", [table, req.body], (err, results) => {
    const { context } = req.query;
    if (err) return res.status(500).json(error500(err, context));
    res.status(201).json({
      data: { ...req.body, id: results.insertId },
      context,
    });
  });
};

export const getMany = (table: string) => (req: Request, res: Response) => {
  pool.query("SELECT * FROM ??", [table], (err, rows) => {
    const { context } = req.query;
    if (err) return res.status(500).json(error500(err, context));
    res.status(200).json({ data: rows.map(inflate), context });
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
      const { context } = req.query;
      if (err) return res.status(500).json(error500(err, context));
      res.status(200).json({ data: inflate(rows[0]), context });
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
      const { context } = req.query;
      if (err) return res.status(500).json(error500(err, context));
      res.status(200).json({ data: results.affectedRows, context });
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
    (err) => {
      const { context } = req.query;
      if (err) return res.status(500).json(error500(err, context));
      res.status(200).json({ data: req.body, context });
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
