import { addResultsToResponse, controllers, crud } from "../../utils/crud";
import pool from "../../utils/db";
import { EC } from "../../utils/types";

const getMany = crud.readMany(`
  SELECT
    id,
    title,
    parent_id AS parentId
  FROM
    equipment_category
`);

const createOne = crud.createOne(
  "INSERT INTO equipment_category SET ?",
  (req) => ({
    title: req.body.title,
  })
);

const updateOne: EC = (req, res, next) => {
  const { id } = req.params;
  const { title, parentId } = req.body;
  pool.query(
    "UPDATE equipment_category SET ? WHERE id = ?",
    [{ title, parent_id: parentId }, id],
    addResultsToResponse(res, next, { one: true })
  );
};

export default {
  ...controllers("equipment_category", "id"),
  createOne,
  getMany,
  updateOne,
};
