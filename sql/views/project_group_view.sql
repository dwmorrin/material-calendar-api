CREATE VIEW project_group_view AS
SELECT
  g.id,
  g.projectId,
  g.creatorId,
  g.title,
  g.pending,
  g.members,
  g.exceptionalSize,
  IFNULL (r.reservedHours, 0) AS reservedHours
FROM
  (
    SELECT
      pg.id,
      pg.project_id AS projectId,
      pg.creator_id AS creatorId,
      pg.title,
      pg.pending,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'id', u.id,
          'username', u.user_id,
          'name', JSON_OBJECT(
            'first', u.first_name,
            'middle', u.middle_name,
            'last',u.last_name
          ),
          'invitation', JSON_OBJECT(
            'accepted', pgu.invitation_accepted,
            'rejected', pgu.invitation_rejected
          ),
          'email', u.email
        )
      ) AS members,
      IF (
        pg.exception_size AND (pg.admin_approved_id is null and pg.admin_rejected_id is null),
        cast_to_bool(1),
        cast_to_bool(0)
      ) AS exceptionalSize
    FROM
      project_group_user pgu
      INNER JOIN user u ON pgu.user_id = u.id
      INNER JOIN project_group pg ON pg.id = pgu.project_group_id
    WHERE NOT pg.abandoned
    GROUP BY
      pg.id
  ) g
  LEFT JOIN
    (
      SELECT
        pg.id,
        CAST(
          SUM(TIME_TO_SEC(TIMEDIFF(a.end, a.start))) / 3600
          AS DECIMAL(8,2)
        ) AS reservedHours
      FROM
        project_group pg
        LEFT JOIN reservation b on b.group_id = pg.id
        LEFT JOIN event a on a.id = b.event_id
      WHERE NOT pg.abandoned
        AND b.refund_approval_id IS NULL
      GROUP BY
        pg.id
    ) r ON g.id = r.id