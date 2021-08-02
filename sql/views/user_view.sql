CREATE VIEW user_view AS
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
  IFNULL (
    (
      SELECT JSON_ARRAYAGG(r.title)
      FROM
        role r
        INNER JOIN user_role ur ON ur.role_id = r.id
      WHERE ur.user_id = u.id
    ),
    JSON_ARRAY()
  ) AS roles,
  IFNULL (
    (
      SELECT JSON_ARRAYAGG(JSON_OBJECT(
            'id', rg.project_id,
            'title', p.title,
            'groupId', rg.id,
            'course', JSON_OBJECT(
              'id', IFNULL (c.id, 0),
              'title', IFNULL (c.title, '')
            )
          )
      )
      FROM student_group sg
        LEFT JOIN project_group rg ON rg.id = sg.group_id
        LEFT JOIN course c ON c.id = rg.course_id
        LEFT JOIN project p ON rg.project_id = p.id
      WHERE sg.student_id = u.id
    ),
    JSON_ARRAY()
  ) as projects
FROM
  user u
GROUP BY
  u.id
