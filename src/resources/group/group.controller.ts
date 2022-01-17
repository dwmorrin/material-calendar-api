import { Connection } from "mysql";
import pool, { startTransaction, endTransaction } from "../../utils/db";
import { addResultsToResponse, crud, query, respond } from "../../utils/crud";
import { EC } from "../../utils/types";
import { useMailbox } from "../../utils/mailer";
import { UserGroup, UserGroupRecord, CreateGroupRequest } from "./types";
import { projectMembersQuery } from "../project/project.controller";

/**
 * Reading: use the `project_group_view` view.
 * Writing: use the `project_group` table.
 */

// this is when an admin creates a group manually
const createOne: EC = (req, res, next) => {
  pool.query(
    "INSERT INTO project_group SET ?",
    {
      title: req.body.title,
      project_id: req.body.projectId,
      creator_id: res.locals.user.id,
      admin_created_id: res.locals.user.id,
      admin_approved_id: res.locals.user.id,
      pending: req.body.pending,
    },
    (err, results) => {
      if (err) return next(err);
      pool.query(
        `
        REPLACE INTO project_group_user (
          user_id, project_group_id, invitation_accepted
        ) VALUES ?`,
        [
          (req.body.members as { id: number }[]).map(({ id }) => [
            id,
            results.insertId,
            true,
          ]),
        ],
        (err) => {
          if (err) return next(err);
          res.status(200).json({ data: { ...req.body, id: results.insertId } });
        }
      );
    }
  );
};

const getGroups = crud.readMany("SELECT * FROM project_group_view");

const getOneGroup = crud.readOne(
  "SELECT * FROM project_group_view WHERE id = ?",
  (req) => Number(req.params.groupId)
);

const getGroupsByUserQuery =
  "SELECT * FROM project_group_view WHERE JSON_CONTAINS(members, JSON_OBJECT('id', ?))";

const getGroupsByUser = crud.readMany(
  getGroupsByUserQuery,
  (_, res) => res.locals.user.id
);

const getGroupsByProject = crud.readMany(
  "SELECT * FROM project_group_view WHERE projectId = ?",
  (req) => Number(req.params.projectId)
);

const removeOneGroup = crud.deleteOne(
  "UPDATE project_group SET abandoned = TRUE WHERE id = ?",
  (req) => Number(req.params.groupId)
);

// TODO this one needs to be updated to use the new group model
const updateOneGroup = crud.updateOne(
  "UPDATE project_group SET ? WHERE id = ?",
  (req) => [
    { project_id: req.body.projectId, title: req.body.title },
    Number(req.params.groupId),
  ]
);

const withGroupSize = query({
  sql: "SELECT group_size FROM project WHERE id = ?",
  using: (req) => req.body.projectId,
  then: (results, _, res) => {
    const groupSize = results[0].group_size;
    if (!(typeof groupSize === "number")) throw new Error("Invalid group size");
    res.locals.groupSize = groupSize;
  },
});

const createPendingGroup: EC = (req, res, next) => {
  const request: CreateGroupRequest = req.body;
  const groupSize: number = res.locals.groupSize;
  const members: number[] = request.members;
  if (!Array.isArray(members) || !members.length) next("no group members");
  res.locals.members = members;
  // assuming that only group size === 1 can be auto-approved
  const pending = !(
    groupSize === 1 &&
    members.length === 1 &&
    request.approved
  );
  const userGroup: UserGroupRecord = {
    title: request.title,
    project_id: request.projectId,
    creator_id: res.locals.user.id,
    admin_created_id: res.locals.admin ? res.locals.user.id : null,
    pending,
    exception_size: groupSize !== members.length,
  };
  pool.query(
    "INSERT INTO project_group SET ?",
    userGroup,
    addResultsToResponse(res, next, { key: "group" })
  );
};

const createProjectGroupUsers = query({
  sql: "REPLACE INTO project_group_user (user_id, project_group_id) VALUES ?",
  using: (_, res) => [
    (res.locals.members as number[]).map((id) => [
      id,
      res.locals.group.insertId,
    ]),
  ],
});

const acceptOwnInvitation = query({
  sql: `UPDATE project_group_user SET invitation_accepted = TRUE
        WHERE user_id = ? AND project_group_id = ?`,
  using: (_, res) => [res.locals.user.id, res.locals.group.insertId],
});

// using transaction
const cancelInvite: EC = (req, res, next) => {
  const connection: Connection = res.locals.connection;
  const groupId = Number(req.params.groupId);
  if (isNaN(groupId)) return next("invalid group ID");
  const userId: number = res.locals.user.id;
  connection.query(
    [
      "UPDATE project_group_user SET invitation_rejected = TRUE",
      "WHERE project_group_id = ? AND user_id = ?;",
      "UPDATE project_group SET abandoned = TRUE",
      "WHERE id = ?",
    ].join(" "),
    [groupId, userId, groupId],
    addResultsToResponse(res, next)
  );
};

const adminExceptionalSize: EC = (req, res, next) => {
  const approve: boolean = req.body.approve;
  if (!(typeof approve === "boolean"))
    return next("invalid: requires 'approve' to be set");
  const currentGroup: UserGroup = res.locals.group;
  if (!currentGroup.pending) return next("cannot update settled group");
  const userId: number = res.locals.user.id;
  if (!approve) {
    pool.query(
      "UPDATE project_group SET ? WHERE id = ?;",
      [
        {
          abandoned: true,
          pending: false,
          admin_rejected_id: userId,
        },
        currentGroup.id,
      ],
      addResultsToResponse(res, next)
    );
  } else if (approve) {
    const allAccepted = currentGroup.members
      .filter(({ id }) => id !== userId)
      .every(({ invitation }) => invitation.accepted && !invitation.rejected);
    pool.query(
      "UPDATE project_group SET ? WHERE id = ?",
      [
        {
          pending: !allAccepted,
          admin_approved_id: userId,
        },
        currentGroup.id,
      ],
      addResultsToResponse(res, next)
    );
  }
};

/**
 * Group invitees can accept or reject the invite.
 * On reject, the group is marked as abandoned.
 * On accept, the group can be auto-approved (pending = false) if
 *   * no existing exceptions or all exceptions have admin approval
 *   * all invitees have accepted
 * Otherwise, the group remains pending.
 */
const updateInvite: EC = (req, res, next) => {
  const update: { accepted?: boolean; rejected?: boolean } = req.body;
  const currentGroup: UserGroup = res.locals.group;
  if (!currentGroup.pending) return next("cannot update settled group");
  const connection: Connection = res.locals.connection;
  const userId: number = res.locals.user.id;
  if (update.rejected) {
    connection.query(
      [
        "UPDATE project_group SET abandoned = TRUE, pending = FALSE WHERE id = ?;",
        "UPDATE project_group_user SET invitation_rejected = TRUE",
        "WHERE project_group_id = ? AND user_id = ?",
      ].join(" "),
      [currentGroup.id, currentGroup.id, userId],
      addResultsToResponse(res, next)
    );
  } else if (update.accepted) {
    const query: string[] = [
      "UPDATE project_group_user SET invitation_accepted = TRUE",
      "WHERE project_group_id = ? AND user_id = ?;",
    ];
    const params: number[] = [currentGroup.id, userId];
    // check if all members have accepted
    const allAccepted = currentGroup.members
      .filter(({ id }) => id !== userId)
      .every(({ invitation }) => invitation.accepted && !invitation.rejected);
    if (!currentGroup.exceptionalSize && allAccepted) {
      query.push("UPDATE project_group SET pending = FALSE WHERE id = ?");
      params.push(currentGroup.id);
    }
    connection.query(query.join(" "), params, addResultsToResponse(res, next));
  } else {
    next("invite update was neither accepted or rejected");
  }
};

const abandonGroup = query({
  sql: "UPDATE project_group SET abandoned = TRUE WHERE id = ?",
  using: (req) => Number(req.params.groupId),
});

const withGroup = query({
  sql: "SELECT * FROM project_group_view WHERE id = ?",
  using: (req) => Number(req.params.id),
  then: (results, _, res) => (res.locals.group = results[0]),
});

const respondWithGroupsAndProjectMembersAndMail = [
  query({
    sql: getGroupsByUserQuery,
    using: (_, res) => res.locals.user.id,
    then: (results, _, res) => (res.locals.groups = results),
  }),
  query({
    sql: projectMembersQuery,
    using: (req) => req.body.projectId,
    then: (results, _, res) => (res.locals.members = results),
  }),
  respond({
    status: 201,
    data: (_, res) => ({
      groups: res.locals.groups,
      members: res.locals.members,
    }),
    callNext: true,
  }),
  useMailbox,
];

export default {
  createOne,
  createOneWithInvitation: [
    withGroupSize,
    createPendingGroup,
    createProjectGroupUsers,
    acceptOwnInvitation,
    ...respondWithGroupsAndProjectMembersAndMail,
  ],
  cancelInvite: [
    ...startTransaction,
    cancelInvite,
    ...endTransaction,
    ...respondWithGroupsAndProjectMembersAndMail,
  ],
  exceptionalSize: [
    withGroup,
    adminExceptionalSize,
    query({
      sql: "SELECT * FROM project_group_view",
      then: (results, _, res) => (res.locals.groups = results),
    }),
    respond({
      status: 201,
      data: (_, res) => ({ groups: res.locals.groups }),
      callNext: true,
    }),
    useMailbox,
  ],
  getGroups,
  getGroupsByUser,
  getGroupsByProject,
  getOneGroup,
  removeOneGroup,
  leaveGroup: [abandonGroup, ...respondWithGroupsAndProjectMembersAndMail],
  updateInvite: [
    withGroup,
    ...startTransaction,
    updateInvite,
    ...endTransaction,
    ...respondWithGroupsAndProjectMembersAndMail,
  ],
  updateOneGroup,
};
