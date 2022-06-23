CREATE VIEW `active_semester_view` AS
SELECT
  id,
  title,
  start,
  end,
  cast_to_bool(1) AS active
FROM
  semester
WHERE
  id = (select semester_id from active_semester)