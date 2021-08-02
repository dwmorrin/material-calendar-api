CREATE VIEW user_group AS
SELECT
  g.id,
  g.projectId,
  r.name AS title,
  g.members,
  IFNULL (r.reservedHours, 0) AS reservedHours
FROM
  (
    SELECT
      rg.id,
      rg.project_id AS projectId,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'id', u.id,
          'username', u.user_id,
          'name', JSON_OBJECT('first', u.first_name,'last',u.last_name),
          'email', u.email
        )
      ) AS members
    FROM
      user u
      INNER JOIN student_group sg ON sg.student_id = u.id
      INNER JOIN project_group rg ON rg.id = sg.group_id
    GROUP BY
      rg.id
  ) g
  LEFT JOIN
  (
    SELECT
      rg.id,
      rg.name,
      CAST(
        SUM(TIME_TO_SEC(TIMEDIFF(a.end, a.start))) / 3600
        AS DECIMAL(8,2)
      ) AS reservedHours
    FROM
      project_group rg
	    LEFT JOIN booking b on b.group_id = rg.id
      LEFT JOIN allotment a on a.id = b.allotment_id
    GROUP BY
      rg.id
  ) r ON g.id = r.id