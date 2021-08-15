CREATE VIEW invitation_view AS
SELECT
  cast_to_bool(NOT pg.pending) AS confirmed,
  pgu.project_group_id AS projectId,
  pg.creator_id AS invitorId, -- client can figure this one out from the invitees list
  /* invitees - will include self in this list */
  JSON_ARRAYAGG(
    JSON_OBJECT(
      'id', pgu.user_id,
      'accepted', pgu.invitation_accepted,
      'rejected', pgu.invitation_rejected,
      'name', JSON_OBJECT('first', u.first_name, 'last', u.last_name),
      'email', u.email
    )
  ) AS invitees,
  pgu.project_group_id AS groupId,
  IFNULL(pg.admin_approved_id, 0) AS approveId,
  IFNULL(pg.admin_rejected_id, 0) AS deniedId
FROM project_group_user pgu
INNER JOIN project_group pg ON pgu.project_group_id = pg.id
INNER JOIN user u ON pgu.user_id = u.id
WHERE pg.pending AND NOT pg.abandoned
GROUP BY pgu.project_group_id