CREATE VIEW active_project_view AS
SELECT *
FROM project
WHERE end > (SELECT start FROM active_semester_view)