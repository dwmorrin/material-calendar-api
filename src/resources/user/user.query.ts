import * as project from "../project/project.query";

export const userCourseQuery = (id = ""): string => `
  SELECT
    c.id,
    c.title
  FROM
    course c
    INNER JOIN roster r ON r.course_id = c.id
    INNER JOIN user u ON u.id = r.student_id
  WHERE
    u.id = "${id}"
  GROUP BY
    c.title;
`;

export const userProjectQuery = (id = ""): string => `
  (${project.getManyQuery}
    INNER JOIN course_project cp ON cp.project_id = p.id
    INNER JOIN roster r ON r.course_id = cp.course_id
    INNER JOIN user u ON u.id = r.student_id 
  WHERE u.id = "${id}"
  group by p.id)
  UNION
  (${project.getManyQuery} WHERE p.title = "Walk-in" )
`;

export const userQueryFn = (where = ""): string => `
  SELECT
    u.id,
    u.user_id AS username,
    JSON_OBJECT(
      'first', u.first_name,
      'middle', u.middle_name,
      'last', u.last_name
    ) AS name,
    u.email,
    u.phone,
    u.restriction,
    IFNULL((
      SELECT JSON_ARRAYAGG(r.title)
      FROM role r inner join user_role ur on ur.role_id = r.id
      WHERE ur.user_id = u.id
    ), JSON_ARRAY()) as roles,
    (
      SELECT JSON_ARRAYAGG(JSON_OBJECT(
            'id', rg.project_id,
            'title', p.title,
            'groupId', rg.id,
            'course', JSON_OBJECT(
              'id', c.id,
              'title', c.title
            )
          )
      )
      FROM student_group sg
        LEFT JOIN rm_group rg ON rg.id = sg.group_id
        LEFT JOIN course c ON c.id = rg.course_id
        LEFT JOIN project p ON rg.project_id = p.id
      WHERE sg.student_id = u.id
    ) as projects
  FROM
    user u
  ${where}
  GROUP BY u.id
`;
