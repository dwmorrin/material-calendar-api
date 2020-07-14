CREATE VIEW `project_info` AS with `manager_list` as (
  select
    `course`.`id` AS `course_id`,
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
      `course`
      left join `user` on(
        json_contains(
          `course`.`instructor`,
          cast(`user`.`id` as json),
          '$'
        )
      )
    )
  group by
    `course`.`id`
)
select
  `p1`.`id` AS `id`,
  `p1`.`name` AS `title`,
  json_object(
    'id',
    `c`.`id`,
    'title',
    `c`.`original_course_name`
  ) AS `course`,
  `p1`.`start` AS `start`,
  `p1`.`end` AS `end`,
  `p1`.`book_start` AS `reservationStart`,
  json_arrayagg(
    json_object(
      'locationId',
      `p2`.`studio_id`,
      'hours',
      `pa`.`hour`,
      'start',
      `pa`.`start`,
      'end',
      `pa`.`end`
    )
  ) AS `allotments`,
  `p1`.`group_size` AS `groupSize`,
  `p1`.`group_hours` AS `groupAllottedHours`,
  `p1`.`is_open` AS `open`,
  `manager_list`.`managers` AS `managers`
from
  (
    (
      (
        (
          `project` `p1`
          left join `project` `p2` on((`p1`.`id` = `p2`.`parent_id`))
        )
        left join `course` `c` on((`p1`.`course_id` = `c`.`id`))
      )
      left join `project_allotment` `pa` on((`p2`.`id` = `pa`.`project_id`))
    )
    left join `manager_list` on((`c`.`id` = `manager_list`.`course_id`))
  )
where
  (`p2`.`studio_id` is not null)
group by
  `p1`.`name`
union
select
  `p3`.`id` AS `id`,
  `p3`.`name` AS `title`,
  json_object(
    'id',
    `c`.`id`,
    'title',
    `c`.`original_course_name`
  ) AS `course`,
  `p3`.`start` AS `start`,
  `p3`.`end` AS `end`,
  `p3`.`book_start` AS `reservationStart`,
  json_arrayagg(
    json_object(
      'locationId',
      `p3`.`studio_id`,
      'hours',
      `pa`.`hour`,
      'start',
      `pa`.`start`,
      'end',
      `pa`.`end`
    )
  ) AS `allotments`,
  `p3`.`group_size` AS `groupSize`,
  `p3`.`group_hours` AS `groupAllottedHours`,
  `p3`.`is_open` AS `open`,
  `manager_list`.`managers` AS `managers`
from
  (
    (
      (
        `project` `p3`
        left join `course` `c` on((`p3`.`course_id` = `c`.`id`))
      )
      left join `project_allotment` `pa` on((`p3`.`id` = `pa`.`project_id`))
    )
    left join `manager_list` on((`c`.`id` = `manager_list`.`course_id`))
  )
where
  (
    (`p3`.`parent_id` is null)
    and (`p3`.`studio_id` is not null)
  )
group by
  `p3`.`name`