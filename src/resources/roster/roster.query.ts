// only need limited set of info about users
export const userQuery = `
  SELECT
    id,
    user_id as username,
    JSON_OBJECT(
      'first', first_name,
      'middle', middle_name,
      'last', last_name
    ) as name,
    restriction
  FROM user
`;

// need to get course titles for each section
export const sectionQuery = `
  SELECT
    s.id,
    s.title,
    s.instructor,
    JSON_OBJECT(
      'title', c.title,
      'id', c.id
    ) as course
  FROM section s
  JOIN course c ON s.course_id = c.id
`;

// recreate the input records from the database
export const rosterInputQuery = `
  SELECT
    c.title AS Course,
    c.catalog_id AS Catalog,
    s.title AS Section,
    s.instructor AS Instructor,
    IF (
      u.first_name <> '',
      CONCAT(u.last_name, ", ", u.first_name),
      u.last_name
    ) AS student,
    u.user_id AS NetID,
    u.restriction AS Restriction
  FROM roster r
    JOIN course c on c.id = r.course_id
    JOIN section s on s.id = r.section_id
    JOIN user u on u.id = r.user_id
  WHERE r.semester_id = ?
`;

// need to match projects to sections
export const projectQuery = `
  SELECT
    p.id,
    IFNULL(
      JSON_ARRAYAGG(sp.section_id),
      JSON_ARRAY()
    ) as sectionIds,
    p.title
  FROM project p
    INNER JOIN section_project sp ON sp.project_id = p.id
  GROUP BY p.id
`;
