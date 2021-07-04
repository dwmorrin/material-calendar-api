import { Request, Response } from "express";
import pool, { error500, inflate, mapKeysToBool } from "../../utils/db";
import { controllers, onResult } from "../../utils/crud";
import { MysqlError, Query } from "mysql";
import { getManyQuery } from "./project.query";

const makeOpenBool = mapKeysToBool("open");
const inflateAndOpenBool = (data: Record<string, unknown>) =>
  inflate(makeOpenBool(data));

export const getUsersByProject = (req: Request, res: Response) => {
  pool.query(
    `
    SELECT 
    u.id,
    u.user_id AS username,
    JSON_OBJECT('first',
            u.first_name,
            'last',
            u.last_name) AS name,
    JSON_ARRAY(CASE u.user_type
                WHEN 1 THEN 'admin'
                WHEN 2 THEN 'admin'
                WHEN 3 THEN 'user'
                WHEN 4 THEN 'staff'
            END) AS roles,
    JSON_OBJECT('email', JSON_ARRAY(u.email)) AS contact,
        u.restriction as restriction
        from
  roster r 
  left join user u on r.student_id=u.id 
  left join course_project cp on 
    cp.course_id=r.course_id
  left join project p on 
    p.id=cp.project_id
  where p.id=?
  group by u.id;
     `,
    [req.params.id],
    onResult({ req, res, dataMapFn: inflate }).read
  );
};

export const getOneLocationAllotment = (req: Request, res: Response): Query =>
  pool.query(
    `
      SELECT
        *
      FROM
        project_virtual_week_hours
      WHERE
        project_id = ?
     `,
    [req.params.id],
    onResult({ req, res, dataMapFn: inflate, take: 1 }).read
  );

export const getMany = (req: Request, res: Response): void => {
  pool.query(
    getManyQuery,
    onResult({ req, res, dataMapFn: inflateAndOpenBool }).read
  );
};

export const createOrUpdateOne = (req: Request, res: Response): void => {
  const {
    course,
    end,
    groupAllottedHours,
    groupSize,
    id,
    locationHours,
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

  interface locationHours {
    locationId: number;
    hours: number;
  }

  const locationHoursMap =
    (projectId: string | number) =>
    ({ locationId, hours }: locationHours) =>
      [projectId, locationId, hours];

  const creating = id < 1;

  const query = creating
    ? `INSERT INTO project SET ?`
    : `UPDATE project SET ? WHERE id = ?`;

  pool.query(query, creating ? [project] : [project, id], (error, results) => {
    if (error) return onError(error);
    const projectId = creating ? results.insertId : id;
    const projectLocations = locationHours.map(locationHoursMap(projectId));
    if (Number(course?.id) > 0) {
      createCourseProjectAndProjectLocations(projectId, projectLocations);
    } else {
      if (locationHours.length)
        createProjectLocations(projectId, projectLocations);
      else onSuccess(projectId);
    }
  });

  function createCourseProjectAndProjectLocations(
    projectId: string | number,
    projectLocations: { [k: string]: string | number }[]
  ) {
    pool.query(
      `${creating ? "INSERT" : "REPLACE"} INTO course_project SET ?`,
      [{ course_id: course.id, project_id: projectId }],
      (error) => {
        if (error) return onError(error);
        if (locationHours.length)
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
      `REPLACE INTO project_studio_hours (project_id, studio_id, hours) VALUES ?`,
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

export const updateAllotment = (req: Request, res: Response): Query =>
  pool.query(
    `REPLACE INTO project_virtual_week_hours (
      project_id, virtual_week_id, hours
     ) VALUES ?`,
    [[[req.body.projectId, req.body.virtualWeekId, req.body.hours]]],
    (error: MysqlError | null): Response => {
      if (error)
        return res.status(500).json(error500(error, req.query.context));
      return res.status(201).json({});
    }
  );

export default {
  ...controllers("project", "id"),
  createOne: createOrUpdateOne,
  getMany,
  getOneLocationAllotment,
  getUsersByProject,
  updateAllotment,
  updateOne: createOrUpdateOne,
};
