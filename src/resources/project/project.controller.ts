import pool from "../../utils/db";
import {
  addResultsToResponse,
  controllers,
  CrudAction,
  withResource,
} from "../../utils/crud";
import { userQueryFn } from "../user/user.query";
import { EC } from "../../utils/types";
import { Project } from "./project.type";

/**
 * Reading: use `project_view` view.
 * Writing: use `project` table.
 */

const getUserIdsBySection: EC = (req, res, next) =>
  pool.query(
    `SELECT 
      u.id
    FROM
      roster r 
      INNER JOIN user u ON r.user_id = u.id 
      INNER JOIN section_project sp ON sp.section_id = r.course_id
      INNER JOIN project p ON p.id = sp.project_id
    WHERE p.id = ?`,
    [req.params.id],
    addResultsToResponse(res, next)
  );

const getUsersByIdList: EC = (req, res, next) => {
  const { results } = res.locals;
  if (results.length)
    pool.query(
      userQueryFn("WHERE u.id IN (?)"),
      [(results as { id: number }[]).map(({ id }) => id)],
      addResultsToResponse(res, next)
    );
  else res.status(200).json({ data: [], context: req.query.context });
};

export const getOneLocationAllotment: EC = (req, res, next) =>
  pool.query(
    "SELECT * FROM project_virtual_week_hours WHERE project_id = ?",
    [req.params.id],
    addResultsToResponse(res, next, { one: true })
  );

export const getMany: EC = (_, res, next) => {
  pool.query("SELECT * from project_view", addResultsToResponse(res, next));
};

const getOne: EC = (req, res, next) => {
  const { id } = req.params;
  pool.query(
    "SELECT * from project_view WHERE id = ?",
    id,
    addResultsToResponse(res, next)
  );
};

export const createOrUpdateOne: EC = (req, res, next): void => {
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
    `REPLACE INTO project_studio_hours (project_id, studio_id, hours) VALUES ?`,
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

// update will require deletions of old sections
const createOrUpdateSectionProject: EC = (req, res, next) => {
  if (!Array.isArray(res.locals.sections) || !res.locals.sections.length)
    return next();
  const method = req.method;
  const project = req.body as Project;
  const id =
    method === CrudAction.Create ? res.locals.project.insertId : project.id;
  const sections = (
    res.locals.sections as { id: number; title: string }[]
  ).filter(({ title }) => project.course.sections.includes(title));
  pool.query(
    "REPLACE INTO section_project (section_id, project_id) VALUES ?",
    [sections.map(({ id: sectionId }) => [sectionId, id])],
    addResultsToResponse(res, next, { key: "ignore" })
  );
};

const deleteSectionProject: EC = (req, res, next) => {
  if (!Array.isArray(res.locals.sections) || !res.locals.sections.length)
    return next();
  const method = req.method;
  const project = req.body as Project;
  const sections = (
    res.locals.sections as { id: number; title: string }[]
  ).filter(({ title }) => project.course.sections.includes(title));
  const id =
    method === CrudAction.Create ? res.locals.project.insertId : project.id;
  pool.query(
    "DELETE FROM section_project WHERE project_id = ? AND section_id NOT IN ?",
    [id, sections.map(({ id: sectionId }) => sectionId)],
    addResultsToResponse(res, next, { key: "ignore" })
  );
};

export const updateAllotment: EC = (req, res, next) =>
  pool.query(
    `REPLACE INTO project_virtual_week_hours (
      project_id, virtual_week_id, hours
     ) VALUES ?`,
    [[[req.body.projectId, req.body.virtualWeekId, req.body.hours]]],
    addResultsToResponse(res, next)
  );

interface ProjectLocationHours {
  project: string; // title
  locationId: number;
  hours: number;
}

const createLocationHours: EC = (req, res, next) => {
  const locationHours = req.body as ProjectLocationHours[];
  if (!Array.isArray(locationHours) || !locationHours.length)
    return next("no input given");
  const { projects } = res.locals as {
    projects: { id: number; title: string }[];
  };
  const query =
    "REPLACE INTO project_studio_hours (project_id, studio_id, hours) VALUES ?";
  pool.query(
    query,
    [
      locationHours.map(({ project, locationId, hours }) => [
        projects.find((p) => p.title === project)?.id,
        locationId,
        hours,
      ]),
    ],
    addResultsToResponse(res, next, { key: "ignore" })
  );
};

const respondWithUpdatedProjectsAndLocations: EC = (_, res) => {
  res.status(201).json({
    data: {
      projects: res.locals.projects,
      locations: res.locals.locations,
    },
  });
};

const withSelectedCourseSections: EC = (req, res, next) => {
  const project = req.body as Project;
  pool.query(
    "SELECT id, title FROM section WHERE course_id = ?",
    [project.courseId],
    addResultsToResponse(res, next, { key: "sections" })
  );
};

const createOneResponse: EC = (req, res) => {
  res.status(201).json({
    data: { id: res.locals.project.id, ...req.body },
    context: req.query.context,
  });
};

const updateOneResponse: EC = (req, res) => {
  res.status(201).json({ data: { ...req.body }, context: req.query.context });
};

export default {
  ...controllers("project", "id"),
  createOne: [
    createOrUpdateOne,
    createOrUpdateProjectLocationHours,
    withSelectedCourseSections,
    createOrUpdateSectionProject,
    createOneResponse,
  ],
  createLocationHours: [
    withResource("projects", "SELECT id, title FROM project"),
    createLocationHours,
    withResource("projects", "SELECT * FROM project_view"),
    withResource("locations", "SELECT * FROM location"),
    respondWithUpdatedProjectsAndLocations,
  ],
  getMany,
  getOne,
  getOneLocationAllotment,
  getUsersByProject: [getUserIdsBySection, getUsersByIdList],
  updateAllotment,
  updateOne: [
    createOrUpdateOne,
    withSelectedCourseSections,
    createOrUpdateProjectLocationHours,
    createOrUpdateSectionProject,
    deleteSectionProject,
    updateOneResponse,
  ],
};
