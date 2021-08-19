CREATE VIEW reservation_view AS
SELECT
  b.id,
  b.purpose AS description,
  b.event_id AS eventId,
  b.group_id AS groupId,
  IFNULL (b.project_id, 0) AS projectId,
  b.guests,
  b.created as created, 
  IF (
    b.canceled,
    JSON_OBJECT(
      'canceled', JSON_OBJECT(
        'on', DATE_FORMAT(b.canceled_time, "%Y-%m-%d %T"),
        'by', b.canceled_user_id,
        'requestsRefund', b.refund_request,
        'comment', b.refund_request_comment
      ),
      'refund',JSON_OBJECT(
        'approved', JSON_OBJECT(
          'on', IF (
            b.refund_approval_id IS NOT NULL,
            DATE_FORMAT(refund_response_time, "%Y-%m-%d %T"),
            ""
          ),
          'by', refund_approval_id
        ),
        'rejected', JSON_OBJECT(
          'on', IF (
            refund_denial_id IS NOT NULL,
            DATE_FORMAT(refund_response_time, "%Y-%m-%d %T"),
            ""
          ),
          'by', refund_denial_id
        )
      )
    ),
    NULL
  ) AS cancelation
FROM
  reservation b
    LEFT JOIN event a ON a.id = b.event_id
    LEFT JOIN location s ON a.location_id = s.id
    LEFT JOIN project_group_view u ON b.group_id = u.id
    LEFT JOIN project p ON u.projectId = p.id;