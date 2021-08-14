CREATE VIEW roster_view AS
SELECT
  r.id,
  JSON_OBJECT(
    'title', c.title,
    'catalogId', c.catalog_id,
    'section', s.title,
    'instructor', s.instructor
  ) as course,
  JSON_OBJECT(
    'id', u.id,
    'username', u.user_id,
    'name', JSON_OBJECT(
      'first', u.first_name,
      'middle', u.middle_name,
      'last', u.last_name
    )
  ) AS student
FROM
  roster r
  INNER JOIN user u ON r.user_id = u.id
  INNER JOIN section s ON r.section_id = s.id
  INNER JOIN course c on s.course_id = c.id
ORDER BY c.catalog_id, s.title, u.last_name, u.first_name