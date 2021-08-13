CREATE VIEW virtual_week_view AS
SELECT
  vw.id,
  vw.start,
  vw.end,
  vw.location_id AS locationId,
  vw.semester_id AS semesterId,
  IFNULL(
    (
      SELECT SUM(pa.hours)
      FROM project_virtual_week_hours pa
      WHERE pa.virtual_week_id = vw.id
    ),
    0
  ) AS 'projectHours'
FROM
  virtual_week vw