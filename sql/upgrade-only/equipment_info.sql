CREATE VIEW `equipment_info` AS with `reservation_list` as (
  select
    `r`.`equipment_id` AS `id`,
    json_object(
      'quantity',
      `r`.`quantity`,
      'bookingId',
      `r`.`booking_id`,
      'start',
      `a`.`start`,
      'end',
      `a`.`end`
    ) AS `booking`
  from
    (
      (
        `equipment_reservation` `r`
        left join `booking` `b` on((`b`.`id` = `r`.`booking_id`))
      )
      left join `allotment` `a` on((`b`.`allotment_id` = `a`.`id`))
    )
)
select
  `equipment`.`id` AS `id`,
  `equipment`.`model_id` AS `modelId`,
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
  (
    case
      when (`r`.`booking` is not null) then json_arrayagg(`r`.`booking`)
      else '[]'
    end
  ) AS `reservations`
from
  (
    (
      (
        equipment `
        left join ` category ` ` c ` on((` c `.` id ` = ` equipment `.` category `))
      )
      left join ` tag ` on(
        json_contains(
          ` equipment `.` tags `,
          cast(` tag `.` id ` as json),
          '$'
        )
      )
    )
    left join ` reservation_list ` ` r ` on((` r `.` id ` = ` equipment `.` id `))
  )
group by
  ` equipment `.` id `;