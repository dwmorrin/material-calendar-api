import { Request, Response } from "express";
import pool, { error500, inflate, mapKeysToBool } from "../../utils/db";
import { controllers, onResult } from "../../utils/crud";
import { MysqlError, Query } from "mysql";
import { getManyQuery } from "./project.query";

const makeOpenBool = mapKeysToBool("open");
const inflateAndOpenBool = (data: Record<string, unknown>) =>
  inflate(makeOpenBool(data));

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
export const getGroupsByProject = (req: Request, res: Response): Query =>
  pool.query(
    groupQuery("WHERE g.projectId = ?"),
    [req.params.id],
    onResult({ req, res, dataMapFn: inflate }).read
  );

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

export const getInvitations = (req: Request, res: Response): void => {
  pool.query(
    `select inv.id as id,
    inv.project_id as project,
    JSON_OBJECT('id',
           inv.invitor,
           'name',
           JSON_OBJECT('first',
            uin.first_name,
            'last',
            uin.last_name)) as invitor,
            JSON_ARRAYAGG(JSON_OBJECT('id',
           iv.invitee,
           'name',
           JSON_OBJECT('first',
            uiv.first_name,
            'last',
            uiv.last_name),
            'accepted',
            iv.accepted,'rejected',iv.rejected)) AS invitees,
            (SELECT (CASE WHEN COUNT(iv.accepted)=SUM(iv.accepted) THEN 1 ELSE 0 END)) as confirmed,
            rm.id as group_id
            from invitation inv left join invitee iv on inv.id=iv.invitation_id 
            left join user uiv on uiv.id=iv.invitee
            left join user uin on uin.id=inv.invitor
            left join rm_group rm on uin.id=rm.creator and inv.project_id=rm.project_id
            where inv.project_id=? and (iv.invitee=? or inv.invitor=?) group by inv.id;`,
    [req.params.id, req.params.user_id, req.params.user_id],
    onResult({ req, res, dataMapFn: inflateAndOpenBool }).read
  );
};

export const createInvitations = (req: Request, res: Response): void => {
  pool.query(
    `insert into invitation (project_id,invitor) VALUES (?,?)`,
    [req.params.id, req.body.invitor, req.body.invitor],
    (error, results) => {
      if (error) return onError(error);
      pool.query(
        `replace into invitee (invitation_id,invitee) VALUES ?`,
        [createInvitees(results.insertId, req.body.invitees)],
        onResult({ req, res }).update
      );
    }
  );
  function onError(error: MysqlError) {
    res.status(500).json(error500(error, req.query.context));
  }
  function createInvitees(invitationId: number, invitees: []) {
    return invitees.map((invitee) => [invitationId, invitee]);
  }
};

export const updateInvitation = (req: Request, res: Response): void => {
  if (req.body.rejected) {
    pool.query(
      `update invitee set accepted=0, rejected=1 where invitation_id=? and invitee=?`,
      [req.params.invitation_id, req.body.userId],
      onResult({ req, res, dataMapFn: inflateAndOpenBool }).update
    );
  }
  if (req.body.accepted) {
    pool.query(
      `update invitee set accepted=1, rejected=0 where invitation_id=? and invitee=?`,
      [req.params.invitation_id, req.body.userId],
      onResult({ req, res, dataMapFn: inflateAndOpenBool }).update
    );
  }
};

export const removeInvitation = (req: Request, res: Response): void => {
  pool.query(
    `delete from invitation where id=?`,
    [req.params.invitation_id],
    onResult({ req, res }).delete
  );
};

export const formGroup = (req: Request, res: Response): void => {
  pool.query(
    `replace into rm_group (project_id, course_id, creator, status, group_type, group_size) 
    select invitation.project_id,course.id,invitation.invitor as creator,1 as status,1 as 
    group_type,count(invitee.accepted)+1 as group_size 
    from invitation 
    left join invitee on invitation.id=invitee.invitation_id 
    left join project on invitation.project_id=project.id 
    left join course_project on project.id=course_project.project_id 
    left join course on course_project.course_id=course.id 
    where invitation.id=? and invitee.accepted=1`,
    [req.params.id],
    (error, results) => {
      if (error) return onError(error);
      pool.query(
        `replace into invitee (invitation_id,invitee) VALUES ?`,
        [req.params.id],
        onResult({ req, res }).update
      );
    }
  );
  function onError(error: MysqlError) {
    res.status(500).json(error500(error, req.query.context));
  }
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
  getGroupsByProject,
  getUsersByProject,
  updateAllotment,
  updateOne: createOrUpdateOne,
  getInvitations,
  createInvitations,
  updateInvitation,
  removeInvitation,
};
