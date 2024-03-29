CREATE VIEW section_view AS
SELECT
  s.id,
  s.semester_id AS semesterId,
  s.course_id AS courseId,
  s.title,
  IF (
    s.instructor_id IS NOT NULL,
    CONCAT(u.first_name, ' ', u.last_name),
    'TBA'
  ) AS instructor
FROM section s
LEFT JOIN user u ON s.instructor_id = u.id