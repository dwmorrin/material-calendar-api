CREATE VIEW `rmss`.`full_calendar` AS
SELECT
    `a`.`id` AS `id`,
    `a`.`start` AS `start`,
    `a`.`end` AS `end`,
    `s`.`name` AS `studio`,
    (
        CASE
            WHEN (`g`.`name` IS NULL) THEN `a`.`description`
            ELSE `g`.`name`
        END
    ) AS `description`,
    (
        CASE
            WHEN (`g`.`name` IS NOT NULL) THEN GROUP_CONCAT(
                DISTINCT CONCAT(`u`.`first_name`, ' ', `u`.`last_name`) SEPARATOR ', '
            )
            ELSE NULL
        END
    ) AS `students`,
    GROUP_CONCAT(DISTINCT `u`.`email` SEPARATOR ', ') AS `email`,
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
    GROUP_CONCAT(
        DISTINCT CONCAT(
            `e`.`model`,
            ';',
            `e`.`serial`,
            ';',
            `r`.`quantity`
        ) SEPARATOR ','
    ) AS `gear`,
    `a`.`bookable` AS `open`,
    `s`.`id` AS `studioId`,
    `b`.`id` AS `reservationId`,
    `p`.`id` AS `projectId`,
    `g`.`id` AS `projectGroupId`
FROM
    (
        (
            (
                (
                    (
                        (
                            (
                                (
                                    `rmss`.`allotment` `a`
                                    LEFT JOIN `rmss`.`booking` `b` ON (
                                        (
                                            (`a`.`id` = `b`.`allotment_id`)
                                            AND (`b`.`confirmed` = 1)
                                        )
                                    )
                                )
                                LEFT JOIN `rmss`.`rm_group` `g` ON ((`b`.`group_id` = `g`.`id`))
                            )
                            LEFT JOIN `rmss`.`student_group` `sg` ON ((`g`.`id` = `sg`.`group_id`))
                        )
                        LEFT JOIN `rmss`.`user` `u` ON ((`sg`.`student_id` = `u`.`id`))
                    )
                    LEFT JOIN `rmss`.`studio` `s` ON ((`a`.`studio_id` = `s`.`id`))
                )
                LEFT JOIN `rmss`.`equipment_reservation` `r` ON ((`r`.`booking_id` = `b`.`id`))
            )
            LEFT JOIN `rmss`.`equipment_old` `e` ON ((`e`.`id` = `r`.`equipment_id`))
        )
        LEFT JOIN `rmss`.`project` `p` ON ((`p`.`id` = `g`.`project_id`))
    )
WHERE
    (`s`.`name` <> 'Staff Only')
GROUP BY
    `a`.`id`
ORDER BY
    `studio`,
    `a`.`start`