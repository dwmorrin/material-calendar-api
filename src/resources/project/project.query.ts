export const getManyQuery = `
    SELECT
      p.id,
      p.title,
      IFNULL(
        (
          SELECT JSON_OBJECT('id', c.id, 'title', c.title)
          FROM course_project cp
          JOIN course c
          WHERE cp.project_id = p.id
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
		'locationId', pa.studio_id,
		'start', pa.start,
		'end', pa.end,
		'hours', pa.hours
	    )
	  )
	  FROM project_allotment pa
	  WHERE pa.project_id = p.id
	),
	'[]'
      ) AS allotments,
      IFNULL(
        (
	  SELECT
            json_arrayagg(ps.studio_id)
          FROM project_studio ps where ps.project_id = p.id
	),
	'[]'
      ) AS locationIds,
      p.open,
      p.group_size as groupSize,
      p.group_hours AS 'groupAllottedHours'
    FROM
      project p
  `;
