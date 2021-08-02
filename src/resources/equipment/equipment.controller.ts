import { controllers, addResultsToResponse } from "../../utils/crud";
import pool from "../../utils/db";
import { EC } from "../../utils/types";

const getByCategory: EC = (req, res, next) =>
  pool.query(
    `SELECT * FROM equipment_view
    WHERE JSON_SEARCH(category, 'one', ?)
    GROUP BY id`,
    [req.params.id],
    addResultsToResponse(res, next)
  );

// TODO implement tags
const updateOne: EC = (req, res, next) => {
  const {
    category: { id },
    manufacturer,
    model,
    description,
    sku,
    serial,
    barcode,
    quantity,
    consumable,
    notes,
    restriction,
  } = req.body;
  pool.query(
    "UPDATE equipment SET ? WHERE id = ?",
    [
      {
        category: id,
        manufacturer,
        model,
        description,
        sku,
        serial,
        barcode,
        quantity,
        consumable,
        notes,
        restriction,
      },
      req.params.id,
    ],
    addResultsToResponse(res, next, { one: true })
  );
};

export default {
  ...controllers("equipment_view", "id"),
  getByCategory,
  updateOne,
};
