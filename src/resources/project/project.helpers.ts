// These would be in a Project class, but none exists yet.
// Migrate to a Project class if one is created.

/**
 * Shared by project controller and reservation controller.
 * Used to validate reservations.
 * Sums up hours used by all reservations in the project in a virtual week.
 * (virtual week hours, a.k.a. "allotment")
 */
export const makeUsedHoursQuery = ({ echoId = false } = {}): string => `
  SELECT
    ${echoId ? "? AS id," : ""}
    IFNULL(
      SUM(TIMESTAMPDIFF(MINUTE, start, end)/60),
      0
    ) AS hours
  FROM event
  JOIN reservation ON event.id = reservation.event_id
  WHERE reservation.project_id = ?
  AND event.location_id = ?
  AND date(event.start) >= ?
  AND date(event.end) <= ?
  AND reservation.confirmed
  AND NOT reservation.canceled`;
