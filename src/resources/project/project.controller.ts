import { Request, Response } from "express";
import pool, { error500, inflate } from "../../utils/db";
import { controllers, onResult } from "../../utils/crud";
import { MysqlError } from "mysql";
import { getManyQuery } from "./project.query";

const groupQuery = (where = "") => `
SELECT
  g.id,
  g.projectId,
  g.members,
  IF(r.reservedHours IS NULL, 0, r.reservedHours) AS reservedHours
FROM
  (
    SELECT
      rg.id,
      rg.project_id AS projectId,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'username', u.user_id,
          'name', JSON_OBJECT('first', u.first_name,'last',u.last_name)
        )
      ) AS members
    FROM
      user u
      INNER JOIN student_group sg ON sg.student_id = u.id
      INNER JOIN rm_group rg ON rg.id = sg.group_id
    GROUP BY
      rg.id
  ) g
  LEFT JOIN
  (
    SELECT
      rg.id,
      CAST(SUM(TIME_TO_SEC(TIMEDIFF(a.end, a.start))) / 3600 AS DECIMAL(8,2)) as reservedHours
    FROM
      rm_group rg
	  INNER JOIN booking b on b.group_id = rg.id
      INNER JOIN allotment a on a.id = b.allotment_id
    GROUP BY
      rg.id
  ) r ON g.id = r.id
  ${where}
`;
export const getGroupsByProject = (req: Request, res: Response) => {
  pool.query(
    groupQuery("WHERE g.projectId = ?"),
    [req.params.id],
    onResult({ req, res, dataMapFn: inflate }).read
  );
};

export const getOneLocationAllotment = (req: Request, res: Response) => {
  pool.query(
    `
      SELECT
        *
      FROM
        project_allotment
      WHERE
        project_id = ?
     `,
    [req.params.id],
    onResult({ req, res, dataMapFn: inflate, take: 1 }).read
  );
};

export const getMany = (req: Request, res: Response): void => {
  pool.query(getManyQuery, onResult({ req, res, dataMapFn: inflate }).read);
};

export const createOne = (req: Request, res: Response): void => {
  const {
    course,
    end,
    groupAllottedHours,
    groupSize,
    locationIds,
    open,
    reservationStart,
    start,
    title,
  } = req.body;
  const project = {
    book_start: reservationStart,
    end,
    group_hours: groupAllottedHours,
    group_size: groupSize,
    open,
    start,
    title,
  };

  const locationIdsMap =
    (projectId: string | number) => (locationId: string | number) =>
      [projectId, locationId];

  pool.query(`INSERT INTO project SET ?`, [project], (error, results) => {
    if (error) return onError(error);
    const projectId = results.insertId;
    const projectLocations = locationIds.map(locationIdsMap(projectId));
    if (Number(course?.id) > 0) {
      createCourseProjectAndProjectLocations(projectId, projectLocations);
    } else {
      if (locationIds.length)
        createProjectLocations(projectId, projectLocations);
      else onSuccess(projectId);
    }
  });

  function createCourseProjectAndProjectLocations(
    projectId: string | number,
    projectLocations: { [k: string]: string | number }[]
  ) {
    pool.query(
      `INSERT INTO course_project SET ?`,
      [{ course_id: course.id, project_id: projectId }],
      (error) => {
        if (error) return onError(error);
        if (locationIds.length)
          createProjectLocations(projectId, projectLocations);
        else onSuccess(projectId);
      }
    );
  }

  function onError(error: MysqlError) {
    res.status(500).json(error500(error, req.query.context));
  }

  function createProjectLocations(
    projectId: string | number,
    projectLocations: { [k: string]: string | number }[]
  ) {
    pool.query(
      `REPLACE INTO project_studio (project_id, studio_id) VALUES ?`,
      [projectLocations],
      (error) => {
        if (error) return onError(error);
        onSuccess(projectId);
      }
    );
  }

  function onSuccess(projectId: string | number) {
    res.status(201).json({
      data: { ...req.body, id: projectId },
      context: req.query.context,
    });
  }
};

export default {
  ...controllers("project", "id"),
  createOne,
  getMany,
  getOneLocationAllotment,
  getGroupsByProject,
};
