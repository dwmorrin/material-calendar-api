CREATE VIEW `equipment_info` AS
SELECT
  `equipment`.`id` AS `id`,
  JSON_OBJECT(
    'id',`category`.`id`,
    'name',`category`.`sub_category`,
    'path',`category`.`category`
  ) AS `category`,
  `equipment`.`manufacturer` AS `manufacturer`,
  `equipment`.`model` AS `model`,
  `equipment`.`description` AS `description`,
  `equipment`.`sku` AS `sku`,
  `equipment`.`quantity` AS `quantity`,
  JSON_ARRAYAGG(
    JSON_OBJECT(
      'id',`tag`.`id`,
      'name',`tag`.`tags`,
      'category',`category`.`category`
    )
  ) AS `tags`,
  0 AS `consumable`,
  NULL AS `reservations`
FROM
  ((`equipment` LEFT JOIN `category` on ((`category`.`id` = `equipment`.`category`)))
  LEFT JOIN `tag` ON (JSON_CONTAINS(`equipment`.`tags`, CAST(`tag`.`id` AS JSON), '$')))
GROUP BY
  `equipment`.`id`;
