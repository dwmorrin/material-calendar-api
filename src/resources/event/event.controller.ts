import { controllers } from "../../utils/crud";
import { Request, Response } from "express";
import pool, { error500, mapKeysToBool, inflate } from "../../utils/db";
import { compose } from "ramda";

const query = `
  SELECT 
    id,
    start,
    end,
    JSON_OBJECT(
      'id', studioId,
      'title', studio
    ) AS location,
    description AS title,
    open AS reservable,
    IF (
      reservationId IS NOT NULL,
      JSON_OBJECT(
        'id', reservationId,
        'groupId', projectGroupId,
        'equipment', gear 
      ),
      NULL
    ) AS reservation
  FROM
    full_calendar
`;

const process = compose(mapKeysToBool("reservable"), inflate);

const getMany = (req: Request, res: Response) =>
  pool.query(query, (err, rows) => {
    if (err) return res.status(500).json(error500(err));
    res
      .status(200)
      .json({ data: rows.map(process), context: req.query.context });
  });

const getOne = (req: Request, res: Response) =>
  pool.query(query + "WHERE id = ?", [req.params.id], (err, rows) => {
    if (err) return res.status(500).json(error500(err));
    res.status(200).json({
      data: rows.map(process)[0],
      context: req.query.context,
    });
  });

export default { ...controllers("allotment", "id"), getMany, getOne };
