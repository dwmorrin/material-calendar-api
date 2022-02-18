/* End user readable report that expands event & user info for a reservation */
CREATE VIEW reservation_info_view AS
SELECT
  r.id AS `Id`,
  l.title AS `Location`,
  DATE_FORMAT(e.start, '%Y-%m-%d %r') AS `Start`,
  DATE_FORMAT(e.end, '%Y-%m-%d %r') AS `End`,
  e.description AS `Event Description`,
  g.title AS `Group`,
  IF (
    r.canceled, "Canceled", "Active"
  ) AS `Status`
FROM
  reservation r
JOIN
  event e ON r.event_id = e.id
JOIN
  location l ON e.location_id = l.id
JOIN
  project_group g ON r.group_id = g.id;