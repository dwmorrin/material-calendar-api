CREATE ALGORITHM = UNDEFINED DEFINER = `rmss` @`192.168.50.10` SQL SECURITY DEFINER VIEW `rmss`.`full_calendar` AS with `equipment_list` as (
    select
        `r`.`booking_id` AS `booking_id`,
        `e`.`model_id` AS `model_id`,
        json_object(
            'name',
            (
                case
                    when (
                        (`e`.`manufacturer` is not null)
                        and (`e`.`model` is not null)
                    ) then concat(`e`.`manufacturer`, ' ', `e`.`model`)
                    else `e`.`description`
                end
            ),
            'quantity',
            sum(`r`.`quantity`),
            'items',
            json_arrayagg(
                json_object('id', `e`.`id`, 'quantity', `r`.`quantity`)
            )
        ) AS `gear`
    from
        (
            `rmss`.`equipment_reservation` `r`
            left join `rmss`.`equipment` `e` on((`e`.`id` = `r`.`equipment_id`))
        )
    group by
        `e`.`model_id`
)
select
    `a`.`id` AS `id`,
    `a`.`start` AS `start`,
    `a`.`end` AS `end`,
    `s`.`name` AS `studio`,
    (
        case
            when (`g`.`name` is null) then `a`.`description`
            else `g`.`name`
        end
    ) AS `description`,
    (
        case
            when (`g`.`name` is not null) then group_concat(
                distinct concat(`u`.`first_name`, ' ', `u`.`last_name`) separator ', '
            )
            else NULL
        end
    ) AS `students`,
    group_concat(distinct `u`.`email` separator ', ') AS `email`,
    `b`.`contact_phone` AS `phone`,
    `p`.`name` AS `project`,
    `b`.`format_analog` AS `tape`,
    `b`.`format_dolby` AS `dolby`,
    `b`.`living_room` AS `live room`,
    `b`.`purpose` AS `purpose`,
    `b`.`guests` AS `guests`,
    `b`.`cancel_request` AS `cancel_request`,
    `b`.`cancel_request_time` AS `cancel_request_time`,
    `b`.`cancel_request_comment` AS `cancel_request_comment`,
    (
        case
            when (`el`.`gear` is not null) then json_objectagg(ifnull(`el`.`model_id`, '0'), `el`.`gear`)
            else NULL
        end
    ) AS `gear`,
    `a`.`bookable` AS `open`,
    `s`.`id` AS `studioId`,
    `b`.`id` AS `reservationId`,
    `p`.`id` AS `projectId`,
    `g`.`id` AS `projectGroupId`,
    `b`.`notes` AS `notes`
from
    (
        (
            (
                (
                    (
                        (
                            (
                                `rmss`.`allotment` `a`
                                left join `rmss`.`booking` `b` on(
                                    (
                                        (`a`.`id` = `b`.`allotment_id`)
                                        and (`b`.`confirmed` = 1)
                                    )
                                )
                            )
                            left join `rmss`.`rm_group` `g` on((`b`.`group_id` = `g`.`id`))
                        )
                        left join `rmss`.`student_group` `sg` on((`g`.`id` = `sg`.`group_id`))
                    )
                    left join `rmss`.`user` `u` on((`sg`.`student_id` = `u`.`id`))
                )
                left join `rmss`.`studio` `s` on((`a`.`studio_id` = `s`.`id`))
            )
            left join `equipment_list` `el` on((`el`.`booking_id` = `b`.`id`))
        )
        left join `rmss`.`project` `p` on((`p`.`id` = `g`.`project_id`))
    )
where
    (`s`.`name` <> 'Staff Only')
group by
    `a`.`id`
order by
    `studio`,
    `a`.`start`;