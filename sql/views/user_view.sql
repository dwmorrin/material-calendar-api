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
  /**
   * Roles are an array of strings, e.g. ['admin', 'user']
   */
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
  /**
   * Projects are assigned by the roster table.
   * Just getting enough info to list available projects.
   */
  IFNULL (
    (
      SELECT JSON_ARRAYAGG(JSON_OBJECT(
            'id', p.id,
            'title', p.title
          )
      )
      FROM
        roster rst
        INNER JOIN section sec ON rst.section_id = sec.id
        INNER JOIN section_project ON sec.id = section_project.section_id
        INNER JOIN project p ON section_project.project_id = p.id
      WHERE rst.user_id = u.id
    ),
    JSON_ARRAY()
  ) as projects
FROM
  user u
GROUP BY
  u.id
