export const getActiveId = "SELECT semester_id FROM active_semester";

export const getSemester = `
  SELECT
    id,
    title,
    start,
    end,
    IF (id = (${getActiveId}), 1, 0) AS active
  FROM
    semester
`;

export const getActive = `
  SELECT
    id,
    title,
    start,
    end,
    1 AS active
  FROM
    semester
  WHERE id = (${getActiveId})
`;
