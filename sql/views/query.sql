SELECT 
  u.id,
  p.id AS projectId,
  JSON_OBJECT(
    'first', u.first_name,
    'middle', u.middle_name,
    'last', u.last_name
  ) AS name,
  u.email,
  u.phone,
  (
    SELECT COUNT(*)
    FROM project_group pg
    INNER JOIN project_group_user pgu ON pgu.project_group_id = pg.id
    WHERE pg.project_id = p.id
      AND pg.pending
      AND NOT pg.abandoned
      AND pgu.user_id = u.id
  ) AS invitations,
  cast_to_bool(IFNULL(
    (
      SELECT active_count
      FROM project_group_user_active_count ac
      WHERE ac.user_id = u.id AND ac.project_id = p.id
    ),
    0
  )) AS hasGroup
FROM
  roster r 
  INNER JOIN user u ON r.user_id = u.id 
  INNER JOIN section_project sp ON sp.section_id = r.course_id
  INNER JOIN project p ON p.id = sp.project_id
WHERE p.id = 2