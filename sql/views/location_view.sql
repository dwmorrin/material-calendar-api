CREATE VIEW location_view AS
SELECT
  s.id,
  s.title,
  s.location AS groupId,
  IF (
    sh.date IS NULL,
    '[]',
    JSON_ARRAYAGG(JSON_OBJECT(
      'date', sh.date,
      'hours', sh.hours
    ))
  ) AS hours,
  s.restriction AS restriction,
  s.allows_walk_ins AS allowsWalkIns,
  JSON_OBJECT(
    'monday', s.default_hours_monday,
    'tuesday', s.default_hours_tuesday,
    'wednesday', s.default_hours_wednesday,
    'thursday', s.default_hours_thursday,
    'friday', s.default_hours_friday,
    'saturday', s.default_hours_saturday,
    'sunday', s.default_hours_sunday
  ) AS defaultHours
FROM
  location s
  LEFT JOIN
    location_hours sh ON s.id = sh.location_id
GROUP BY
  s.id