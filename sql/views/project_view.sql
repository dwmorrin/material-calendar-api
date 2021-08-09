CREATE VIEW project_view AS
SELECT
  p.id,
  p.title,
  IFNULL(
    (
      SELECT
        JSON_OBJECT(
          'id', c.id,
          'title', c.title,
          'sections', JSON_ARRAYAGG(s.title)
        )
      FROM section_project sp
        INNER JOIN section s ON s.id = sp.section_id
        JOIN course c
          WHERE sp.project_id = p.id AND s.course_id = c.id
      LIMIT 1
    ),
    JSON_OBJECT('id', -1, 'title', '')
  ) AS course,
  p.start,
  p.end,
  p.book_start AS 'reservationStart',
  IFNULL(
    (
      SELECT DISTINCT JSON_ARRAYAGG(
        JSON_OBJECT(
          'locationId', vw.studio_id,
          'virtualWeekId', vw.id,
          'start', IF(vw.start >= p.start, vw.start, p.start),
          'end', IF(vw.end <= p.end, vw.end, p.end),
          'hours', IFNULL(ph.hours, 0)
        )
      )
      FROM project_studio_hours psh
        JOIN virtual_week vw USING (studio_id)
        LEFT JOIN project_virtual_week_hours ph
          ON ph.project_id = psh.project_id
          AND ph.virtual_week_id = vw.id
      WHERE psh.project_id = p.id
          AND vw.end >= p.start
          AND vw.start <= p.end
    ),
    '[]'
  ) AS allotments,
  IFNULL(
    (
      SELECT SUM(ph.hours)
      FROM project_virtual_week_hours ph
      WHERE ph.project_id = p.id
    ),
    0
  ) AS totalAllottedHours,
  IFNULL(
    (
      SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
            'locationId', ps.studio_id,
            'hours', ps.hours
          )
        )
      FROM project_studio_hours ps
      WHERE ps.project_id = p.id
    ),
    '[]'
  ) AS locationHours,
  p.open,
  p.group_size as groupSize,
  p.group_hours AS 'groupAllottedHours'
FROM
  project p
