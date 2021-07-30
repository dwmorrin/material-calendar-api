CREATE VIEW reservation AS
SELECT
  b.id,
  b.purpose AS description,
  b.allotment_id AS eventId,
  b.group_id AS groupId,
  IFNULL (b.project_id, 0) AS projectId,
  b.guests,
  IF (
    b.cancelled = 1,
    IF (b.refund_request = 1,
      JSON_OBJECT(
        'canceled', JSON_OBJECT(
          'on', DATE_FORMAT(b.cancelled_time, "%Y-%m-%d %T"),
          'by', b.cancelled_user_id,
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
      JSON_OBJECT(
        'canceled', JSON_OBJECT(
          'on', DATE_FORMAT(b.cancelled_time, "%Y-%m-%d %T"),
          'by', b.cancelled_user_id,
          'comment', b.refund_request_comment
        )
      )
    ),
    NULL
  ) AS cancellation
FROM
  booking b
    LEFT JOIN allotment a ON a.id = b.allotment_id
    LEFT JOIN studio s ON a.studio_id = s.id
    LEFT JOIN user_group u ON b.group_id = u.id
    LEFT JOIN project p ON u.projectId = p.id;