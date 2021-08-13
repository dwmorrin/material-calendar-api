CREATE VIEW reservation_pending_view AS
SELECT
  b.id,
  b.purpose AS description,
  b.event_id AS eventId,
  b.group_id AS groupId,
  IFNULL (b.project_id, 0) AS projectId,
  b.guests,
    IF (
      b.cancelled = 1,
      IF (
        b.refund_request = 1,
        JSON_OBJECT(
          'canceled', JSON_OBJECT(
            'on', DATE_FORMAT(b.cancelled_time,"%Y-%m-%d %T"),
            'by', b.cancelled_user_id,
            'comment', b.refund_request_comment
        ),
        'refund',JSON_OBJECT(
          'approved', JSON_OBJECT(
            'on', IF (
              b.refund_approval_id IS NOT NULL,
              DATE_FORMAT(refund_response_time,"%Y-%m-%d %T"),
              ""
            ),
            'by', refund_approval_id
          ),
          'rejected', JSON_OBJECT(
            'on', IF (
               refund_denial_id IS NOT NULL,
               DATE_FORMAT(refund_response_time,"%Y-%m-%d %T"),
               ""
            ),
            'by', refund_denial_id
          )
        )
      ),
      JSON_OBJECT(
        'canceled', JSON_OBJECT(
          'on', date_format(b.cancelled_time,"%Y-%m-%d %T"),
          'by', b.cancelled_user_id,
          'comment', b.refund_request_comment
        )
      )
    ),
    NULL
  ) AS cancellation,
  JSON_OBJECT(
    'start', date_format(a.start,"%Y-%m-%d %T"),
    'end', date_format(a.end,"%Y-%m-%d %T"),
    'location', s.title
  ) as event,
  u.members,
  p.title as projectTitle
FROM
  reservation b
    LEFT JOIN event a on a.id=b.event_id
    LEFT JOIN location s on a.location_id=s.id
    LEFT JOIN project_group_view u on b.group_id=u.id
    LEFT JOIN project p on u.projectId=p.id
WHERE (
  refund_request = 1 AND
  refund_approval_id IS NULL AND
  refund_denial_id IS NULL
)