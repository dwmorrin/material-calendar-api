/*
For instructors to see
  - the students in each group
*/
CREATE VIEW project_group_report_view AS
SELECT
  g.project_id,
  g.id AS group_id,
  g.title AS group_title,
  g.pending AS group_pending,
  GROUP_CONCAT(CONCAT_WS(' ', stu.first_name, stu.last_name, stu.user_id) SEPARATOR ', ') AS students
FROM
  project_group g
JOIN
  project_group_user pgu ON pgu.project_group_id = g.id
JOIN
  user stu ON stu.id = pgu.user_id
GROUP BY
  g.id
ORDER BY
  g.project_id,
  g.title