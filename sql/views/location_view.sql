CREATE VIEW location_view AS
SELECT
  l.id,
  l.title,
  l.location AS groupId,
  IF (
    sh.date IS NULL,
    '[]',
    JSON_ARRAYAGG(JSON_OBJECT(
      'date', sh.date,
      'hours', sh.hours
    ))
  ) AS hours,
  l.restriction AS restriction,
  l.allows_walk_ins AS allowsWalkIns,
  l.allows_equipment AS allowsEquipment,
  JSON_OBJECT(
    'monday', l.default_hours_monday,
    'tuesday', l.default_hours_tuesday,
    'wednesday', l.default_hours_wednesday,
    'thursday', l.default_hours_thursday,
    'friday', l.default_hours_friday,
    'saturday', l.default_hours_saturday,
    'sunday', l.default_hours_sunday
  ) AS defaultHours
FROM
  location l
  LEFT JOIN
    location_hours sh ON l.id = sh.location_id
GROUP BY
  l.id