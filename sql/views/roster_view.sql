CREATE VIEW roster_view AS
SELECT
  r.id,
  JSON_OBJECT(
    'id', c.id,
    'title', c.title,
    'catalogId', c.catalog_id,
    'section', s.title,
    'instructor', IF (
      s.instructor_id IS NOT NULL,
      (
        SELECT CONCAT(first_name, ' ', last_name)
        FROM user
        WHERE id = s.instructor_id
      ),
      'TBA'
    )
  ) AS course,
  JSON_OBJECT(
    'id', u.id,
    'username', u.user_id,
    'name', JSON_OBJECT(
      'first', u.first_name,
      'middle', u.middle_name,
      'last', u.last_name
    )
  ) AS student,
  s.semester_id AS semesterId
FROM
  roster r
  INNER JOIN user u ON r.user_id = u.id
  INNER JOIN section s ON r.section_id = s.id
  INNER JOIN course c ON s.course_id = c.id
ORDER BY c.catalog_id, s.title, u.last_name, u.first_name