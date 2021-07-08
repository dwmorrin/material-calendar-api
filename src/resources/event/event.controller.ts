import { controllers, onResult } from "../../utils/crud";
import { Request, Response } from "express";
import pool, { error500, mapKeysToBool, inflate } from "../../utils/db";
import { compose } from "ramda";
import { Query } from "mysql";

const query = `
  SELECT 
    id,
    start,
    end,
    JSON_OBJECT(
      'id', studioId,
      'title', studio,
      'restriction', (select studio.restriction from studio where studio.id=studioId)
    ) AS location,
    description AS title,
    open AS reservable,
    IF (
      reservationId IS NOT NULL,
      JSON_OBJECT(
        'id', reservationId,
        'projectId', projectId,
        'description', purpose,
        'groupId', projectGroupId,
        'liveRoom', \`live room\`,
        'guests', guests,
        'contact', phone,
        'equipment', gear,
        'notes', notes
      ),
      NULL
    ) AS reservation
  FROM
    full_calendar
`;

const process = compose(mapKeysToBool("reservable"), inflate);

const getMany = (req: Request, res: Response): Query =>
  pool.query(query, onResult({ req, res, dataMapFn: process }).read);

const getOne = (req: Request, res: Response): Query =>
  pool.query(
    query + "WHERE id = ?",
    [req.params.id],
    onResult({ req, res, dataMapFn: process, take: 1 }).read
  );

/**
 * mysql does not accept key-value objects for bulk imports;
 * values must be an array of arrays.
 * Adjust the ordering here as needed.
 * @param event Event object
 */
const flattenEvent = (event: {
  [k: string]: string | number | boolean;
}): (string | number | boolean)[] => [
  event.start,
  event.end,
  event.locationId,
  event.reservable || false,
  event.title,
];

const replaceManyQuery = `
  REPLACE INTO allotment
    (start, end, studio_id, bookable, description)
  VALUES ?
`;

const createMany = (req: Request, res: Response): Query =>
  pool.query(replaceManyQuery, [req.body.map(flattenEvent)], (err) => {
    const { context } = req.query;
    if (err) return res.status(500).json(error500(err, context));
    res.status(201).json({
      data: "OK",
      context,
    });
  });

const updateOne = (req: Request, res: Response): void => {
  pool.query(
    `UPDATE allotment SET ? WHERE id = ?`,
    [
      {
        start: req.body.start,
        end: req.body.end,
        studio_id: req.body.locationId,
        bookable: req.body.reservable,
        description: req.body.title,
      },
      req.params.id,
    ],
    (err) => {
      const { context } = req.query;
      if (err) return res.status(500).json(error500(err, context));
      res.status(201).json({
        data: { ...req.body },
        context,
      });
    }
  );
};

export default {
  ...controllers("allotment", "id"),
  createMany,
  getMany,
  getOne,
  updateOne,
};
