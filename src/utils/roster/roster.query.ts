const query = `
  SELECT
    JSON_OBJECT(
      'title', c.title,
      'catalogId', c.catalog_id,
      'section', s.title,
      'instructor', s.instructor
    ) as course,
    JSON_OBJECT(
      'name', JSON_OBJECT(
        'first', u.first_name,
        'middle', u.middle_name,
        'last', u.last_name
      ),
      'id', u.id
    ) AS student
  FROM
    roster r LEFT JOIN user u ON r.student_id = u.id
    LEFT JOIN course c ON r.course_id = c.id
    LEFT JOIN section s ON s.course_id = c.id
`;

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
    JOIN user u on u.id = r.student_id
  WHERE r.semester_id = ?
`;

export default query;
