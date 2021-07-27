CREATE VIEW semester_view AS
SELECT
  id,
  title,
  start,
  end,
  cast_to_bool(
    IF (id = (SELECT semester_id FROM active_semester), 1, 0)
  ) AS active
FROM
  semester;

CREATE VIEW active_semester_view AS
SELECT
  id,
  title,
  start,
  end,
  cast_to_bool(1) AS active
FROM
  semester
WHERE id = (SELECT semester_id FROM active_semester)