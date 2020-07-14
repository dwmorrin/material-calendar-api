CREATE VIEW `equipment_info` AS
select
  `equipment`.`id` AS `id`,
  `equipment`.`manufacturer` AS `manufacturer`,
  `equipment`.`model` AS `model`,
  `equipment`.`description` AS `description`,
  `equipment`.`sku` AS `sku`,
  `equipment`.`quantity` AS `quantity`,
  json_object(
    'id',
    `c`.`id`,
    'title',
    `c`.`title`,
    'parentId',
    `c`.`parent_id`
  ) AS `category`,
  '[]' AS `tags`,
  0 AS `consumable`,
  NULL AS `reservations`
from
  (
    (
      `equipment`
      left join `category` `c` on((`c`.`id` = `equipment`.`category`))
    )
    left join `tag` on(
      json_contains(
        `equipment`.`tags`,
        cast(`tag`.`id` as json),
        '$'
      )
    )
  )
group by
  `equipment`.`id`;