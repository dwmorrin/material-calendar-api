import { addResultsToResponse, controllers } from "../../utils/crud";
import pool from "../../utils/db";
import { EC } from "../../utils/types";

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

const getMany: EC = (_, res, next) =>
  pool.query(query, addResultsToResponse(res, next));

const getOne: EC = (req, res, next) =>
  pool.query(
    query + "WHERE id = ?",
    [req.params.id],
    addResultsToResponse(res, next, { one: true })
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

const createMany: EC = (req, res, next) =>
  pool.query(replaceManyQuery, [req.body.map(flattenEvent)], (err) => {
    const { context } = req.query;
    if (err) return next(err);
    res.status(201).json({
      data: "OK",
      context,
    });
  });

const updateOne: EC = (req, res, next) =>
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
    addResultsToResponse(res, next)
  );

export default {
  ...controllers("allotment", "id"),
  createMany,
  getMany,
  getOne,
  updateOne,
};
