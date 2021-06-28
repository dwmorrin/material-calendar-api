import { Request, Response } from "express";
import pool, { inflate } from "../../utils/db";
import { onResult } from "../../utils/crud";
import {
  groupQueryFn,
  userCourseQuery,
  userProjectQuery,
  userQueryFn,
} from "./user.query";
import adapter from "./user.adapter";

export const createGroup = (req: Request, res: Response) =>
  pool.query(
    "insert into rm_group (project_id, course_id, creator, status, group_type, group_size) select invitation.project_id,course.id,invitation.invitor as creator,1 as status,1 as group_type,count(invitee.accepted)+1 as group_size from invitation left join invitee on invitation.id=invitee.invitation_id left join project on invitation.project_id=project.id left join course_project on project.id=course_project.project_id left join course on course_project.course_id=course.id left join user on invitation.invitor=user.id where invitation.id=?",
    [req.params.invitation_id],
    onResult({ req, res }).create
  );

export const joinGroup = (req: Request, res: Response) =>
  pool.query(
    "replace into student_group (SELECT invitee.invitee as student_id, ? as group_id FROM invitee left join invitation on invitation.id=invitee.invitation_id where invitation_id=? and invitee.accepted=1 UNION DISTINCT SELECT invitation.invitor AS student_id, ? as group_id FROM invitation where invitation.id=?)",
    [
      req.params.groupId,
      req.params.invitation_id,
      req.params.groupId,
      req.params.invitation_id,
    ],
    onResult({ req, res }).create
  );

export const removeOneGroup = (req: Request, res: Response) =>
  pool.query(
    "DELETE FROM rm_group WHERE id=?",
    [req.params.groupId],
    onResult({ req, res }).delete
  );

export const leaveGroup = (req: Request, res: Response) =>
  pool.query(
    "DELETE FROM student_group WHERE student_id=? AND group_id=?",
    [req.params.id, req.params.groupId],
    onResult({ req, res }).delete
  );

export const getGroups = (req: Request, res: Response) =>
  pool.query(groupQueryFn(), onResult({ req, res, dataMapFn: inflate }).read);

export const getGroupsForOne = (req: Request, res: Response) =>
  pool.query(
    groupQueryFn("WHERE JSON_SEARCH(g.members, 'all', ?)"),
    [req.params.id],
    onResult({ req, res, dataMapFn: inflate }).read
  );

export const getOneGroup = (req: Request, res: Response) =>
  pool.query(
    groupQueryFn("WHERE g.id = ?"),
    [req.params.id],
    onResult({ req, res, dataMapFn: inflate, take: 1 }).read
  );

export const getCourses = (req: Request, res: Response) =>
  pool.query(
    userCourseQuery(req.params.id),
    [req.params.id],
    onResult({ req, res, dataMapFn: inflate }).read
  );

export const getProjects = (req: Request, res: Response) =>
  pool.query(
    userProjectQuery(req.params.id),
    [req.params.id],
    onResult({ req, res, dataMapFn: inflate }).read
  );

export const getOne = (req: Request, res: Response) => {
  pool.query(
    userQueryFn("WHERE u.user_id = ?"),
    [req.params.id],
    onResult({ req, res, dataMapFn: inflate, take: 1 }).read
  );
};

export const getMany = (req: Request, res: Response) =>
  pool.query(userQueryFn(), onResult({ req, res, dataMapFn: inflate }).read);

export const createOne = (req: Request, res: Response) =>
  pool.query(
    "INSERT INTO user SET ?",
    adapter(req.body),
    onResult({ req, res }).create
  );

export const updateOne = (req: Request, res: Response) =>
  pool.query(
    "UPDATE user SET ? WHERE id = ?",
    [adapter(req.body), req.params.id],
    onResult({ req, res }).update
  );

export const removeOne = (req: Request, res: Response) =>
  pool.query(
    "DELETE FROM user WHERE id = ?",
    req.params.id,
    onResult({ req, res }).delete
  );

export default {
  createGroup,
  removeOneGroup,
  createOne,
  getOne,
  updateOne,
  removeOne,
  getMany,
  getCourses,
  getGroups,
  getGroupsForOne,
  getOneGroup,
  getProjects,
  joinGroup,
  leaveGroup,
};
