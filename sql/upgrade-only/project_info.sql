CREATE VIEW `rmss`.`project_info` AS
SELECT 
  `p1`.`id` AS `id`,
  `p1`.`name` AS `title`,
  JSON_OBJECT('title', `c`.`original_course_name`) AS `course`,
  `p1`.`start` AS `start`,
  `p1`.`end` AS `end`,
  `p1`.`book_start` AS `reservationStart`,
  JSON_ARRAYAGG(
    JSON_OBJECT(
      'locationId', `p2`.`studio_id`,
      'hours', `pa`.`hour`,
      'start', `pa`.`start`,
      'end', `pa`.`end`
    )
  ) AS `allotments`,
  `p1`.`group_size` AS `groupSize`,
  `p1`.`group_hours` AS `groupAllottedHours`,
  `p1`.`is_open` AS `open`,
  JSON_ARRAY(`c`.`instructor`) AS `managers`
FROM
  (((`rmss`.`project` `p1`
  LEFT JOIN `rmss`.`project` `p2` ON ((`p1`.`id` = `p2`.`parent_id`)))
  LEFT JOIN `rmss`.`course` `c` ON ((`p1`.`course_id` = `c`.`id`)))
  LEFT JOIN `rmss`.`project_allotment` `pa` ON ((`p2`.`id` = `pa`.`project_id`)))
WHERE
  (`p2`.`studio_id` IS NOT NULL)
GROUP BY `p1`.`name` 
UNION SELECT 
  `p3`.`id` AS `id`,
  `p3`.`name` AS `title`,
  JSON_OBJECT('title', `c`.`original_course_name`) AS `course`,
  `p3`.`start` AS `start`,
  `p3`.`end` AS `end`,
  `p3`.`book_start` AS `reservationStart`,
  JSON_ARRAYAGG(
    JSON_OBJECT(
      'locationId', `p3`.`studio_id`,
      'hours', `pa`.`hour`,
      'start', `pa`.`start`,
      'end', `pa`.`end`
    )
  ) AS `allotments`,
  `p3`.`group_size` AS `groupSize`,
  `p3`.`group_hours` AS `groupAllottedHours`,
  `p3`.`is_open` AS `open`,
  JSON_ARRAY(`c`.`instructor`) AS `managers`
FROM
  ((`rmss`.`project` `p3`
  LEFT JOIN `rmss`.`course` `c` ON ((`p3`.`course_id` = `c`.`id`)))
  LEFT JOIN `rmss`.`project_allotment` `pa` ON ((`p3`.`id` = `pa`.`project_id`)))
WHERE
  ((`p3`.`parent_id` IS NULL)
      AND (`p3`.`studio_id` IS NOT NULL))
GROUP BY `p3`.`name`