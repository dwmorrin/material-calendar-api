CREATE VIEW event AS
WITH equipment_list AS
(
  SELECT
    er.booking_id,
    IF (
      e.manufacturer IS NOT NULL AND e.model IS NOT NULL,
      concat(e.manufacturer, ' ', e.model),
      e.description
    ) AS name,
    JSON_OBJECT(
      'quantity', sum(er.quantity),
      'items', JSON_ARRAYAGG(
        JSON_OBJECT(
          'id', e.id,
          'quantity',er.quantity
        )
      )
    ) AS gear
  FROM
    equipment_reservation er
    LEFT JOIN equipment e ON e.id = er.equipment_id
    LEFT JOIN booking b ON er.booking_id = b.id
  GROUP BY name, b.id
)

SELECT
  a.id,
  a.start,
  a.end,
  (
    SELECT JSON_OBJECT(
      "id", s.id,
      "title", s.title,
      "restriction", s.restriction,
      "allowsWalkIns", s.allows_walk_ins
    )
    FROM studio s
    WHERE a.studio_id = s.id
  ) AS location,
  IF (g.name IS NOT NULL, g.name, a.description) AS title,
  a.bookable AS reservable,
  IF (
    b.id IS NOT NULL,
    JSON_OBJECT(
      "id", b.id,
      "projectId", b.project_id,
      "description", b.purpose,
      "groupId", b.group_id,
      "liveRoom", b.live_room,
      "guests", b.guests,
      "contact", b.contact_phone,
      "equipment", IF (
        el.gear IS NOT NULL,
        JSON_OBJECTAGG(IFNULL(el.name, "unknown"), el.gear),
        NULL
      )
    ),
    NULL
  ) AS reservation
FROM allotment a
  LEFT JOIN booking b ON a.id = b.allotment_id
  LEFT JOIN equipment_list el ON el.booking_id = b.id
  LEFT JOIN project_group g on g.id = b.group_id
GROUP BY a.id