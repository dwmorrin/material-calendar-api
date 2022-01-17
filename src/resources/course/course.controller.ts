import { crud, controllers } from "../../utils/crud";

/**
 * @deprecated
 * TODO remove all references to this query
 * this is a SECTION query, not a course query
 */
export const query = `
  SELECT
    c.id,
    c.title,
    c.catalog_id AS catalogId,
    s.title AS section,
    s.instructor_id AS instructorId
  FROM
    course c
    INNER JOIN section s ON s.course_id = c.id
`;

const getMany = crud.readMany(`
  SELECT
    c.id,
    c.title,
    c.catalog_id AS catalogId
  FROM
    course c
`);

export default {
  ...controllers("course", "id"),
  createOne: crud.createOne("INSERT INTO course SET ?", (req) => ({
    title: req.body.title,
    catalog_id: req.body.catalogId,
  })),
  getMany,
  updateOne: crud.updateOne("UPDATE course SET ? WHERE id = ?", (req) => [
    { title: req.body.title, catalog_id: req.body.catalogId },
    req.params.id,
  ]),
};
