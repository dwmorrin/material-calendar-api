CREATE VIEW `course_info` AS with `project_list` as (
  select
    `course`.`id` AS `id`,
    json_arrayagg(`project`.`id`) AS `project_ids`
  from
    (
      `course`
      left join `project` on((`course`.`id` = `project`.`course_id`))
    )
  group by
    `course`.`id`
)
select
  `course`.`id` AS `id`,
  `course`.`name` AS `name`,
  `course`.`is_open` AS `is_open`,
  `course`.`course_type` AS `course_type`,
  `course`.`original_course_name` AS `original_course_name`,
  `project_list`.`project_ids` AS `projectIds`,
  json_arrayagg(
    json_object(
      'id',
      `user`.`id`,
      'username',
      `user`.`user_id`,
      'name',
      json_object(
        'first',
        `user`.`first_name`,
        'last',
        `user`.`last_name`
      )
    )
  ) AS `managers`
from
  (
    (
      `course`
      left join `user` on(
        json_contains(
          `course`.`instructor`,
          cast(`user`.`id` as json),
          '$'
        )
      )
    )
    left join `project_list` on((`course`.`id` = `project_list`.`id`))
  )
group by
  `course`.`id`;