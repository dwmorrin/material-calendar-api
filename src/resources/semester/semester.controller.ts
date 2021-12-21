import {
  CrudAction,
  controllers,
  crud,
  query,
  respond,
} from "../../utils/crud";

const getCurrent = crud.readOne("SELECT * FROM active_semester_view");
const getMany = crud.readMany("SELECT * FROM semester_view");

const updateActive = query({
  assert: (req) => {
    if (!req.body.active) throw "continue";
  },
  sql: "REPLACE INTO active_semester SET id = 1, semester_id = ?",
  using: (req, res) =>
    req.method === CrudAction.Create
      ? res.locals.results.insertId
      : req.params.id,
});

const createOne = query({
  sql: "INSERT INTO semester SET ?",
  using: (req) => ({
    title: req.body.title,
    start: req.body.start,
    end: req.body.end,
  }),
});

const updateOne = query({
  sql: "UPDATE semester SET ? WHERE id = ?",
  using: (req) => [
    { title: req.body.title, start: req.body.start, end: req.body.end },
    req.params.id,
  ],
});

const updateAll = [
  query({
    sql: "SELECT * FROM semester_view",
  }),
  respond({ data: (_, res) => res.locals.results, kind: "UPDATE_ALL" }),
];

export default {
  ...controllers("semester", "id"),
  createOne: [createOne, updateActive, updateAll],
  getCurrent,
  getMany,
  updateOne: [updateOne, updateActive, updateAll],
};
