import { Request, Response } from "express";
import pool, { error500, inflate } from "../../utils/db";
import { controllers } from "../../utils/crud";

const groupQueryFn = (where = "group_id IS NOT NULL") => `
  SELECT 
    sg.group_id AS id,
    rg.project_id AS projectId,
 	  JSON_ARRAYAGG(
      JSON_OBJECT(
        'username', u.user_id,
        'name', JSON_OBJECT('first', u.first_name,'last',u.last_name)
      )
    ) AS members
  FROM
    rmss.user u
    LEFT JOIN rmss.student_group sg ON sg.student_id = u.id
    LEFT JOIN rmss.rm_group rg ON rg.id = sg.group_id
  WHERE
    sg.${where}
  GROUP BY
    sg.group_id
`;

export const getGroups = (req: Request, res: Response) => {
  pool.query(groupQueryFn(), (err, rows) => {
    if (err) return res.status(500).json(error500(err));
    res
      .status(200)
      .json({ data: rows.map(inflate), context: req.query.context });
  });
};

export const getOneGroup = (req: Request, res: Response) => {
  pool.query(groupQueryFn("group_id = ?"), [req.params.id], (err, rows) => {
    if (err) return res.status(500).json(error500(err));
    res
      .status(200)
      .json({ data: inflate(rows[0]), context: req.query.context });
  });
};

export const userQueryFn = (where = "") => `
  SELECT 
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
      IF(rg.project_id IS NOT NULL,
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', rg.project_id,
              'groupId', rg.id,
              'projectGroup', JSON_OBJECT(
                'id', c.id,
                'title', c.original_course_name
              )
            )
          ),
          JSON_ARRAY()) AS projects
  FROM
      user u
          LEFT JOIN
      student_group sg ON sg.student_id = u.id
          LEFT JOIN
      rm_group rg ON rg.id = sg.group_id
          LEFT JOIN
      course c ON c.id = rg.course_id
  ${where}
  GROUP BY u.id
`;

export const getOne = (req: Request, res: Response) => {
  pool.query(
    userQueryFn("WHERE u.user_id = ?"),
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json(error500(err));
      res
        .status(200)
        .json({ data: inflate(rows[0]), context: req.query.context });
    }
  );
};

export const getMany = (req: Request, res: Response) => {
  pool.query(userQueryFn(), (err, rows) => {
    if (err) return res.status(500).json(error500(err));
    res.status(200).json({ data: inflate(rows), context: req.query.context });
  });
};

export default {
  ...controllers("user", "user_id"),
  getOne,
  getMany,
  getGroups,
  getOneGroup,
};
