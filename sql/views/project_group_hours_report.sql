CREATE VIEW project_group_hours_report_view AS
SELECT
  g.group_title,
  g.group_pending,
  g.students,
  IFNULL(
    CAST(
      SUM(TIME_TO_SEC(TIMEDIFF(e.end, e.start))) / 3600
      AS DECIMAL(8,2)
    ),
    0
  ) AS hours
FROM
  project_group_report_view g
LEFT JOIN
  reservation r USING (group_id)
LEFT JOIN
  event e ON e.id = r.event_id
GROUP BY
  g.group_id