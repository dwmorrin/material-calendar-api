SELECT
  inv.id AS id,
  inv.project_id AS projectId,
  JSON_OBJECT(
    'id', inv.invitor,
    'name', JSON_OBJECT('first', uin.first_name, 'last', uin.last_name),
    'email',uin.email
  ) AS invitor,
  IFNULL (tv.invitee, JSON_ARRAY()) AS invitees,
  /* can we use the IF instead of CASE? */
  -- (SELECT IF (COUNT(iv.accepted) = SUM(iv.accepted), 1, 0)) AS confirmed,
  (SELECT (CASE WHEN COUNT(iv.accepted) = SUM(iv.accepted) THEN 1 ELSE 0 END)) AS confirmed,
  rm.id AS group_id,
  inv.approved_id AS approvedId
  inv.denied_id AS deniedId
FROM
  invitation inv
  LEFT JOIN invitee iv ON inv.id = iv.invitation_id 
  LEFT JOIN (
    SELECT
      vt.invitation_id AS invitation_id,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'id', vt.invitee,
          'name', JSON_OBJECT('first', uiv.first_name, 'last', uiv.last_name),
          'email',uiv.email,
          'accepted', vt.accepted,
          'rejected',vt.rejected
        )
      ) AS invitee 
    FROM invitee vt 
      LEFT JOIN user uiv ON uiv.id = vt.invitee 
    GROUP BY vt.invitation_id
  ) tv ON tv.invitation_id = inv.id
  LEFT JOIN user uin ON uin.id=inv.invitor
  LEFT JOIN project_group rm
    ON uin.id = rm.creator AND inv.project_id = rm.project_id
  -- WHERE (iv.invitee=? or inv.invitor=?) group by inv.id