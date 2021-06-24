export const getManyQuery = `
    SELECT
      p.id,
      p.title,
      IFNULL(
        (
          SELECT JSON_OBJECT('id', c.id, 'title', c.title)
          FROM course_project cp
          JOIN course c
          WHERE cp.project_id = p.id AND cp.course_id = c.id
        ),
        JSON_OBJECT('id', -1, 'title', '')
      ) AS course,
      p.start,
      p.end,
      p.book_start AS 'reservationStart',
      IFNULL(
	(
          SELECT
	  JSON_ARRAYAGG(
	    JSON_OBJECT(
        'locationId', vw.studio_id,
        'virtualWeekId', vw.id,
        'start', vw.start,
        'end', vw.end,
        'hours', ph.hours
	    )
	  )
	  FROM project_virtual_week_hours ph
    LEFT JOIN virtual_week vw on ph.virtual_week_id = vw.id
	  WHERE ph.project_id = p.id
	),
	'[]'
      ) AS allotments,
      IFNULL(
        (
          SELECT
            json_arrayagg(
              json_object(
                'locationId', ps.studio_id,
                'hours', ps.hours
              )
            )
          FROM project_studio_hours ps where ps.project_id = p.id
	),
	'[]'
      ) AS locationHours,
    p.open,
    p.group_size as groupSize,
    p.group_hours AS 'groupAllottedHours'
  FROM
    project p
  `;
