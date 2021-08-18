/* gets project groups that are not pending and not abandoned */
CREATE VIEW project_group_user_active_count AS
SELECT
  COUNT(pg.id) AS active_count,
  pg.project_id,
  pg.id AS project_group_id,
  pgu.user_id AS user_id
FROM project_group pg
INNER JOIN project_group_user pgu ON pgu.project_group_id = pg.id
WHERE NOT pg.pending AND NOT pg.abandoned 
GROUP BY pg.id, pgu.user_id