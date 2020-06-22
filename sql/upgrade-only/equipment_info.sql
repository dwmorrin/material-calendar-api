CREATE VIEW `equipment_info` AS
SELECT
  `equipment`.`id` AS `id`,
  `equipment`.`manufacturer` AS `manufacturer`,
  `equipment`.`model` AS `model`,
  `equipment`.`description` AS `description`,
  `equipment`.`sku` AS `sku`,
  `equipment`.`quantity` AS `quantity`,
  JSON_OBJECT('id',`c`.`id`,'title',`c`.`title`,'parentId',`c`.`parent_id`) AS `category`,
  JSON_ARRAYAGG(JSON_OBJECT('id',`tag`.`id`,'name',`tag`.`tags`,'category',`c`.`title`)) AS `tags`,
  0 AS `consumable`,
  NULL AS `reservations`
FROM
  ((`equipment`
  LEFT JOIN `category` `c` ON((`c`.`id` = `equipment`.`category`)))
  LEFT JOIN `tag` ON(JSON_CONTAINS(`equipment`.`tags`,CAST(`tag`.`id` AS JSON),'$')))
GROUP BY  `equipment`.`id`;
