CREATE VIEW equipment_view AS
WITH reservation_list AS (
  SELECT
    r.equipment_id AS id,
    JSON_OBJECT(
      'quantity', r.quantity,
      'bookingId', r.booking_id,
      'start', a.start,
      'end', a.end
    ) AS booking
  FROM
    equipment_reservation r
    LEFT JOIN reservation b ON b.id = r.booking_id
    LEFT JOIN event a ON b.event_id = a.id
)

SELECT
  e.id,
  e.manufacturer,
  e.model,
  e.serial,
  e.description,
  e.sku,
  e.barcode,
  e.restriction,
  e.quantity,
  JSON_OBJECT(
    'id', c.id,
    'title', c.title,
    'parentId', c.parent_id
  ) AS category,
  '[]' AS tags,
  e.consumable,
  IF (r.booking IS NOT NULL, JSON_ARRAYAGG(r.booking), JSON_ARRAY()) AS reservations,
  e.notes
FROM
  equipment e
  LEFT JOIN equipment_category c ON c.id = e.category
  LEFT JOIN reservation_list r on r.id = e.id
GROUP BY e.id