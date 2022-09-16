CREATE VIEW reservation_same_day_count AS
SELECT
  count(*) AS count,
  u.id AS user_id,
  l.location AS location
FROM
  reservation r
JOIN
  event e ON e.id = r.event_id
JOIN
  location l on l.id = e.location_id
JOIN
  project_group pg ON pg.id = r.group_id
JOIN
  project_group_user pgu ON pgu.project_group_id = pg.id
JOIN
  user u ON u.id = pgu.user_id
WHERE pg.project_id = 1
AND DATE(e.start) = DATE(NOW())
AND (TO_SECONDS(NOW()) - TO_SECONDS(r.created)) < 7200
AND NOT r.canceled
GROUP BY r.group_id, l.location;
  