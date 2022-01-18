/* For class meetings: take course, section, user info and construct class names
   of the format COURSE_TITLE INSTRUCTOR_LAST_NAME CATALOG_ID.SECTION_TITLE

   assumes project ID is hardcoded to 2 - see startup.sql
   assumes admin ID associated with this setup is hardcoded to 1 - see startup.sql
   TODO - remove hardcoded project ID and admin ID
*/

INSERT INTO project_group (title, project_id, creator_id, admin_approved_id, pending)
SELECT
  CONCAT(c.title, ' ', s.title, ' ', u.last_name, ' ', c.catalog_id, '.', s.title),
  2,
  1,
  1,
  FALSE
FROM section s
JOIN course c on s.course_id = c.id
JOIN user u on s.instructor_id = u.id;

INSERT INTO project_group_user (user_id, project_group_id)
SELECT
  u.id,
  pg.id
FROM section s
JOIN course c on s.course_id = c.id
JOIN user u on s.instructor_id = u.id
JOIN project_group pg on pg.title = CONCAT(c.title, ' ', s.title, ' ', u.last_name, ' ', c.catalog_id, '.', s.title);
