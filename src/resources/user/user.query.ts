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
              'title', p.title,
              'groupId', rg.id,
              'course', JSON_OBJECT(
                'id', c.id,
                'title', c.title
              )
            )
          ),
          JSON_ARRAY()) AS projects, 
          u.restriction as restriction
  FROM
      user u
          LEFT JOIN
      student_group sg ON sg.student_id = u.id
          LEFT JOIN
      rm_group rg ON rg.id = sg.group_id
          LEFT JOIN
      course c ON c.id = rg.course_id
          LEFT JOIN
      project p ON rg.project_id = p.id
  ${where}
  GROUP BY u.id
`;
