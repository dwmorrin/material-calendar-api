import { Request, Response } from "express";
import { Query } from "mysql";
import { controllers, onResult } from "../../utils/crud";
import pool, { inflate, error500 } from "../../utils/db";

const queryFn = (where = "") => `
  SELECT
    s.id,
    s.name AS title,
    s.location AS groupId,
    JSON_ARRAYAGG(JSON_OBJECT(
      'date', wh.date,
      'hours', wh.hours
    )) AS hours,
    s.restriction as restriction
  FROM
    studio s
    LEFT JOIN studio_hours wh ON s.id = wh.studio_id
  ${where}
  GROUP BY s.id
`;

export const getMany = (req: Request, res: Response): Query =>
  pool.query(queryFn(), onResult({ req, res, dataMapFn: inflate }).read);

export const getOne = (req: Request, res: Response): Query =>
  pool.query(
    queryFn("WHERE s.id = ?"),
    [req.params.id],
    onResult({ req, res, take: 1, dataMapFn: inflate }).read
  );

export const getDefaultId = (req: Request, res: Response): Query =>
  pool.query(
    "SELECT id FROM studio WHERE id = (SELECT MIN(id) FROM studio)",
    onResult({ req, res, take: 1 }).read
  );

const calculatedVirtualWeekHoursQuery = `
SELECT
  v.id,
  v.start,
  v.end,
  v.studio_id AS locationId,
  (
    SELECT
      SUM(IF(w.date BETWEEN v2.start AND v2.end, w.hours, 0)) as hours
    FROM
      virtual_week v2
      JOIN studio_hours w ON w.studio_id = v2.studio_id
    WHERE
      v2.studio_id = ? AND v.id = v2.id
    GROUP BY
      v2.id
  ) AS 'locationHours',
  SUM(IF(
	pa.start = v.start AND pa.end = v.end,
    pa.hours,
    0
  )) AS 'projectHours'
FROM
  virtual_week v
  JOIN project_allotment pa ON pa.studio_id = v.studio_id
WHERE
  v.studio_id = ?
GROUP BY v.id
`;

export const getVirtualWeeks = (req: Request, res: Response): Query =>
  pool.query(
    calculatedVirtualWeekHoursQuery,
    [req.params.id, req.params.id],
    onResult({ req, res }).read
  );

const replaceHoursQuery = `
REPLACE INTO studio_hours
  (studio_id, date, hours)
VALUES ?
`;

const flattenHours =
  (locationId: string | number) =>
  ({ date, hours }: { [k: string]: string | number }) =>
    [locationId, date, hours];

export const createOrUpdateHours = (req: Request, res: Response): Query =>
  pool.query(
    replaceHoursQuery,
    [req.body.map(flattenHours(req.params.id))],
    (err, data) => {
      if (err) return res.status(500).json(error500(err, req.query.context));
      res.status(201).json({ data, context: req.query.context });
    }
  );

const adapter = ({
  title,
  groupId,
}: {
  id: number;
  title: string;
  groupId: string;
  hours: unknown;
}) => ({
  name: title,
  location: groupId,
});

export const createOne = (req: Request, res: Response): Query =>
  pool.query(
    "INSERT INTO studio SET ?",
    adapter(req.body),
    onResult({ req, res }).create
  );

export default {
  ...controllers("studio", "id"),
  createOne,
  createOrUpdateHours,
  getMany,
  getOne,
  getDefaultId,
  getVirtualWeeks,
};
