export const getActiveId = "SELECT semester_id FROM active_semester";

export const getSemester = `
  SELECT
    id,
    name AS title,
    start,
    end
  FROM
    semester
`;

export const getActive = `
  ${getSemester}
  WHERE id = (${getActiveId})
`;
