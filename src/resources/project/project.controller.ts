import pool from "../../utils/db";
import {
  addResultsToResponse,
  controllers,
  crud,
  CrudAction,
  query,
  respond,
  respondWith,
  withResource,
} from "../../utils/crud";
import { EC } from "../../utils/types";
import { Project } from "./project.type";
import { isValidSQLDateInterval } from "../../utils/date";

/**
 * Reading: use `project_view` view.
 * Writing: use `project` table.
 */

export const projectMembersQuery =
  "SELECT * FROM project_group_user_view WHERE projectId = ?";

const getProjectMembers = crud.readMany(projectMembersQuery, (req) =>
  Number(req.params.id)
);

const getOneLocationAllotment = crud.readOne(
  "SELECT * FROM project_virtual_week_hours WHERE project_id = ?",
  (req) => Number(req.params.id)
);

const getMany = crud.readMany("SELECT * from project_view");

const getOne = crud.readOne("SELECT * from project_view WHERE id = ?", (req) =>
  Number(req.params.id)
);

const createOrUpdateOne: EC = (req, res, next) => {
  const {
    body: {
      end,
      groupAllottedHours,
      groupSize,
      id,
      open,
      reservationStart,
      start,
      title,
    },
    method,
  } = req;

  if (!isValidSQLDateInterval({ start, end }))
    return res.status(400).json({
      error: { message: "Invalid: Project end is after start" },
    });

  const query =
    method === CrudAction.Create
      ? `INSERT INTO project SET ?`
      : `UPDATE project SET ? WHERE id = ?`;

  const project = {
    book_start: reservationStart,
    end,
    group_hours: groupAllottedHours,
    group_size: groupSize,
    open,
    start,
    title,
  };

  pool.query(
    query,
    method === CrudAction.Create ? [project] : [project, id],
    addResultsToResponse(res, next, { one: true, key: "project" })
  );
};

const createOrUpdateProjectLocationHours: EC = (req, res, next) => {
  const {
    body: { id, locationHours },
    method,
  } = req;
  if (!locationHours || !locationHours.length) return next();
  pool.query(
    "REPLACE INTO project_location_hours (project_id, location_id, hours) VALUES ?",
    [
      locationHours.map(({ locationId, hours }: Record<string, unknown>) => [
        method === CrudAction.Create ? res.locals.project.insertId : id,
        locationId,
        hours,
      ]),
    ],
    addResultsToResponse(res, next)
  );
};

const deleteProjectLocationHours: EC = (req, res, next) => {
  const {
    body: { id, locationHours },
  } = req;
  const query = !(Array.isArray(locationHours) && locationHours.length)
    ? `DELETE FROM project_location_hours WHERE project_id = ${pool.escape(id)}`
    : `DELETE FROM project_location_hours WHERE location_id NOT IN (${pool.escape(
        (locationHours as { locationId: number }[]).map(
          ({ locationId }) => locationId
        )
      )})`;
  pool.query(query, addResultsToResponse(res, next, { key: "ignore" }));
};

const createOrUpdateSectionProject = query({
  assert: (_, res) => {
    if (!Array.isArray(res.locals.sections) || !res.locals.sections.length)
      throw "continue";
  },
  sql: "REPLACE INTO section_project (section_id, project_id) VALUES ?",
  using: (req, res) => {
    const method = req.method;
    const project = req.body as Project;
    const id =
      method === CrudAction.Create ? res.locals.project.insertId : project.id;
    const sections = (
      res.locals.sections as { id: number; title: string }[]
    ).filter(({ title }) => project.course.sections.includes(title));
    return [sections.map(({ id: sectionId }) => [sectionId, id])];
  },
});

const deleteSectionProject: EC = (req, res, next) => {
  const method = req.method;
  const project = req.body as Project;
  const id =
    method === CrudAction.Create ? res.locals.project.insertId : project.id;
  if (!Array.isArray(res.locals.sections) || !res.locals.sections.length) {
    // clear all section_project entries for this project
    const sql = "DELETE FROM section_project WHERE project_id = ?";
    pool.query(sql, id, addResultsToResponse(res, next, { key: "ignore" }));
  } else {
    const sections = (
      res.locals.sections as { id: number; title: string }[]
    ).filter(({ title }) => project.course.sections.includes(title));
    const id =
      method === CrudAction.Create ? res.locals.project.insertId : project.id;
    const values = [id, [sections.map(({ id: sectionId }) => sectionId)]];
    const sql =
      "DELETE FROM section_project WHERE project_id = ? AND section_id NOT IN ?";
    pool.query(sql, values, addResultsToResponse(res, next, { key: "ignore" }));
  }
};

const updateAllotment = query({
  sql: `REPLACE INTO project_virtual_week_hours (
      project_id, virtual_week_id, hours
     ) VALUES ?`,
  using: (req) => [
    [[req.body.projectId, req.body.virtualWeekId, req.body.hours]],
  ],
});

interface ProjectLocationHours {
  project: string; // title
  locationId: number;
  hours: number;
}

const createLocationHours = [
  query({
    sql: "SELECT id, title FROM project",
    then: (results, _, res) => (res.locals.projects = results),
  }),
  query({
    assert: (req) => {
      if (!Array.isArray(req.body) || !req.body.length) throw "no input given";
    },
    sql: "REPLACE INTO project_location_hours (project_id, location_id, hours) VALUES ?",
    using: (req, res) => [
      (req.body as ProjectLocationHours[]).map(
        ({ project, locationId, hours }) => [
          (res.locals.projects as { id: number; title: string }[]).find(
            (p) => p.title === project
          )?.id,
          locationId,
          hours,
        ]
      ),
    ],
  }),
  query({
    sql: "SELECT * FROM project_view",
    then: (results, _, res) => (res.locals.projects = results),
  }),
  query({
    sql: "SELECT * FROM location_view",
    then: (results, _, res) => (res.locals.locations = results),
  }),
  query({
    sql: "SELECT * FROM virtual_week_view",
    then: (results, _, res) => (res.locals.weeks = results),
  }),
  respond({
    status: 201,
    data: (_, res) => ({
      projects: res.locals.projects,
      locations: res.locals.locations,
      weeks: res.locals.weeks,
    }),
  }),
];

const withSelectedCourseSections = query({
  assert: (req) => {
    const courseId = Number((req.body as Project).course.id);
    if (isNaN(courseId) || courseId < 1) throw "continue";
  },
  sql: "SELECT id, title FROM section WHERE course_id = ?",
  using: (req) => (req.body as Project).course.id,
  then: (results, _, res) => (res.locals.sections = results),
});

export default {
  ...controllers("project", "id"),
  createOne: [
    createOrUpdateOne,
    createOrUpdateProjectLocationHours,
    withSelectedCourseSections,
    createOrUpdateSectionProject,
    respond({
      status: 201,
      data: (req, res) => ({ ...req.body, id: res.locals.project.insertId }),
    }),
  ],
  createLocationHours,
  getMany,
  getOne,
  getOneLocationAllotment,
  getGroupDashboard: getProjectMembers,
  updateAllotment: [
    updateAllotment,
    withResource("projects", "SELECT * FROM project_view"),
    withResource("weeks", "SELECT * FROM virtual_week_view"),
    respondWith("projects", "weeks"),
  ],
  updateOne: [
    createOrUpdateOne,
    withSelectedCourseSections,
    createOrUpdateProjectLocationHours,
    createOrUpdateSectionProject,
    deleteProjectLocationHours,
    deleteSectionProject,
    respond({
      status: 201,
      data: (req) => ({ ...req.body }),
    }),
  ],
};
