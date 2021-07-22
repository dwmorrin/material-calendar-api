CREATE VIEW location AS
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
  s.allows_walk_ins AS allowsWalkIns
FROM
  studio s
  LEFT JOIN
    studio_hours sh ON s.id = sh.studio_id
GROUP BY
  s.id