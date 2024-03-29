import pool, {
  inflate,
  getUnsafeMultipleStatementConnection,
} from "../../utils/db";
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
import { makeUsedHoursQuery } from "./project.helpers";
import { isValidSQLDateInterval } from "../../utils/date";
import withActiveSemester from "../../utils/withActiveSemester";

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

interface LocationHours {
  locationId: number;
  hours: number;
}

interface ProjectLocationHoursRecord {
  location_id: number;
  hours: number;
  project_id: number;
}

const createOrUpdateProjectLocationHours: EC = (req, res, next) => {
  const method: string = req.method;
  const id: number =
    method === CrudAction.Create ? res.locals.project.insertId : req.body.id;
  if (typeof id !== "number" || id < 1) return next("Invalid project id");
  const locationHours: LocationHours[] = req.body.locationHours;
  if (!locationHours || !locationHours.length) return next();
  const existing:
    | { project_id: number; location_id: number; hours: number }[]
    | undefined = res.locals.projectLocationHours;
  const connection = getUnsafeMultipleStatementConnection();
  let sql = "";
  let values: (
    | { location_id: number; project_id: number; hours: number }
    | number
  )[] = [];
  const insertMap = (lh: LocationHours): ProjectLocationHoursRecord => ({
    location_id: lh.locationId,
    project_id: id,
    hours: lh.hours,
  });
  if (!existing || !existing.length) {
    sql = "INSERT INTO project_location_hours SET ?;".repeat(
      locationHours.length
    );
    values = locationHours.map(insertMap);
  } else {
    const inserts: LocationHours[] = [];
    const updates: LocationHours[] = [];
    for (const { locationId, hours } of locationHours) {
      if (existing.find((lh) => lh.location_id === locationId)) {
        updates.push({ locationId, hours });
      } else {
        inserts.push({ locationId, hours });
      }
    }
    sql = "INSERT INTO project_location_hours SET ?;".repeat(inserts.length);
    sql +=
      "UPDATE project_location_hours SET hours = ? WHERE project_id = ? AND location_id = ?;".repeat(
        updates.length
      );
    values = [
      ...inserts.map(insertMap),
      ...updates.map(({ hours, locationId }) => [hours, id, locationId]).flat(),
    ];
  }
  connection.query(sql, values, addResultsToResponse(res, next));
};

const deleteProjectLocationHours: EC = (req, res, next) => {
  const id: number = req.body.id;
  const locationHours: LocationHours[] = req.body.locationHours;
  let sql = `DELETE FROM project_location_hours WHERE project_id = ${pool.escape(
    id
  )}`;
  if (Array.isArray(locationHours) && locationHours.length)
    sql += ` AND location_id NOT IN (${pool.escape(
      (locationHours as { locationId: number }[]).map(
        ({ locationId }) => locationId
      )
    )})`;
  pool.query(sql, addResultsToResponse(res, next, { key: "ignore" }));
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
  assert: (req, res) => {
    const courseId = Number((req.body as Project).course.id);
    if (isNaN(courseId) || courseId < 1) throw "continue";
    const { id } = res.locals.semester;
    if (isNaN(id) || id < 1)
      throw "Internal error: no active semester ID found";
  },
  sql: "SELECT id, title FROM section WHERE semester_id = ? AND course_id = ?",
  using: (req, res) => [
    res.locals.semester.id,
    (req.body as Project).course.id,
  ],
  then: (results, _, res) => {
    // title is string in db, but mysqljs can return number, e.g. title = '1'
    // could be a mysqljs config option to force string - did not investigate
    // fixing here for now
    res.locals.sections = (
      results as { id: number; title: number | string }[]
    ).map(({ id, title }) => ({ id, title: String(title) }));
  },
});

/**
 * @api GET {project}/availableHours
 * required query params:
 *   projectId
 *   locationId
 *   start
 *   end
 */
const usedHours = [
  query({
    sql: makeUsedHoursQuery({ echoId: true }),
    using: (req) => [
      Number(req.query.projectId as string),
      req.query.projectId,
      req.query.locationId,
      req.query.start,
      req.query.end,
    ],
  }),
  respond({ data: (_, res) => res.locals.results[0] }),
];

/**
 * minimum required query params:
 * - title
 * - book_start
 * - start
 * - end
 */
interface ProjectRaw {
  id: number;
  title: string;
  group_hours: number;
  open: boolean;
  book_start: string;
  start: string;
  end: string;
  brief: string;
  description: string;
  group_size: number;
}

interface ProjectBulkRow {
  title: string;
  reservationStart: string;
  start: string;
  end: string;
  groupSize: number | string;
  groupHours: number | string;
}
interface ProjectBulkUpdate extends ProjectBulkRow {
  id: number;
}

function isProjectBulkRow(x: ProjectBulkRow): x is ProjectBulkRow {
  if (!x) return false;
  if (typeof x !== "object") return false;
  if (!("title" in x)) return false;
  if (!("reservationStart" in x)) return false;
  if (!("start" in x)) return false;
  if (!("end" in x)) return false;
  if (!("groupSize" in x)) return false;
  if (!("groupHours" in x)) return false;
  return true;
}

const startImport: EC = (req, res, next) => {
  const projectsRaw: ProjectRaw[] = res.locals.projectsRaw;
  if (!Array.isArray(projectsRaw))
    return next("existing projects not found, aborting import");
  const projects: ProjectBulkRow[] = req.body;
  if (!Array.isArray(projects) || !projects.length)
    return next("no projects to import");
  if (!projects.every(isProjectBulkRow)) return next("invalid project data");
  const sameProjects: (pbr: ProjectBulkRow) => ProjectRaw | undefined = ({
    title,
    start,
    end,
  }) =>
    projectsRaw.find(
      (p) => p.title === title && p.start === start && p.end === end
    );
  const updates: ProjectBulkUpdate[] = projects.reduce((acc, pbr) => {
    const p = sameProjects(pbr);
    if (!p) return acc;
    acc.push({ ...pbr, id: p.id });
    return acc;
  }, [] as ProjectBulkUpdate[]);
  const inserts: ProjectBulkRow[] = projects.filter(
    (pbr) => !sameProjects(pbr)
  );
  const connection = getUnsafeMultipleStatementConnection();
  connection.beginTransaction((err) => {
    if (err) return next(err);
    connection.query(
      inserts.length
        ? "INSERT INTO project SET ?;".repeat(inserts.length)
        : "SELECT 1",
      inserts.map(
        ({ title, reservationStart, start, end, groupHours, groupSize }) => ({
          title,
          book_start: reservationStart,
          start,
          end,
          group_hours: groupHours,
          group_size: groupSize,
        })
      ),
      (err) => {
        if (err) return next(err);
        connection.query(
          updates.length
            ? "UPDATE project SET ? WHERE id = ?;".repeat(updates.length)
            : "SELECT 1",
          updates
            .map(
              ({
                title,
                start,
                end,
                id,
                reservationStart,
                groupSize,
                groupHours,
              }) => [
                {
                  title,
                  start,
                  end,
                  book_start: reservationStart,
                  group_size: groupSize,
                  group_hours: groupHours,
                },
                id,
              ]
            )
            .flat(),
          (err) => {
            if (err) return next(err);
            connection.commit((err) => {
              if (err) return next(err);
              connection.query("SELECT * FROM project_view", (err, results) => {
                if (err) return next(err);
                return res.status(201).json({ data: results.map(inflate) });
              });
            });
          }
        );
      }
    );
  });
};

const importProjects = [
  withResource("projectsRaw", "SELECT * FROM project"), // not the view
  startImport,
];

export default {
  ...controllers("project", "id"),
  usedHours,
  createOne: [
    withActiveSemester,
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
  importProjects,
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
    withActiveSemester,
    createOrUpdateOne,
    withSelectedCourseSections,
    query({
      sql: "SELECT * FROM project_location_hours WHERE project_id = ?",
      using: (req) => Number(req.body.id),
      then: (results, _, res) => (res.locals.projectLocationHours = results),
    }),
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
