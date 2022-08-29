CREATE VIEW section_project_view AS
SELECT
  s.semester_id,
  c.id AS course_id,
  s.id AS section_id,
  concat(c.catalog_id, '.', s.title, ' ', c.title) AS section_title,
  p.title AS project_title
FROM project p
JOIN section_project sp ON p.id = sp.project_id
JOIN section s ON s.id = sp.section_id
JOIN course c on c.id = s.course_id;