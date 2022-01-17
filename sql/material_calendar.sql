SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `active_semester` (
  `id` tinyint(1) NOT NULL DEFAULT '1',
  `semester_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_active_semester_semester` (`semester_id`),
  CONSTRAINT `FK_active_semester_semester` FOREIGN KEY (`semester_id`) REFERENCES `semester` (`id`),
  CONSTRAINT `active_semester_only_one` CHECK ((`id` = 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `active_semester_view` AS SELECT 
 1 AS `id`,
 1 AS `title`,
 1 AS `start`,
 1 AS `end`,
 1 AS `active`*/;
SET character_set_client = @saved_cs_client;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(128) NOT NULL,
  `catalog_id` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_course` (`title`,`catalog_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipment` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category` int DEFAULT NULL,
  `manufacturer` varchar(255) DEFAULT NULL,
  `model` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `sku` varchar(255) DEFAULT NULL,
  `serial` varchar(255) DEFAULT NULL,
  `barcode` varchar(255) DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  `consumable` tinyint(1) NOT NULL DEFAULT '0',
  `notes` text,
  `restriction` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipment_category` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` text,
  `parent_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipment_location` (
  `equipment_id` int NOT NULL DEFAULT '0',
  `studio_id` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`equipment_id`,`studio_id`),
  KEY `gear_studio_studio_id_studio_id` (`studio_id`),
  CONSTRAINT `gear_studio_studio_id_studio_id` FOREIGN KEY (`studio_id`) REFERENCES `location` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipment_reservation` (
  `equipment_id` int NOT NULL DEFAULT '0',
  `booking_id` int NOT NULL DEFAULT '0',
  `quantity` int DEFAULT '1',
  `checkin_status` tinyint(1) DEFAULT '1',
  `checkout_status` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`equipment_id`,`booking_id`),
  KEY `FK_booking_equipment_reservation` (`booking_id`),
  CONSTRAINT `FK_booking_equipment_reservation` FOREIGN KEY (`booking_id`) REFERENCES `reservation` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_equipment_equipment_reservation` FOREIGN KEY (`equipment_id`) REFERENCES `equipment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipment_tag` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` text,
  `category` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `equipment_view` AS SELECT 
 1 AS `id`,
 1 AS `manufacturer`,
 1 AS `model`,
 1 AS `serial`,
 1 AS `description`,
 1 AS `sku`,
 1 AS `barcode`,
 1 AS `restriction`,
 1 AS `quantity`,
 1 AS `category`,
 1 AS `tags`,
 1 AS `consumable`,
 1 AS `reservations`,
 1 AS `notes`*/;
SET character_set_client = @saved_cs_client;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event` (
  `id` int NOT NULL AUTO_INCREMENT,
  `start` datetime DEFAULT NULL,
  `end` datetime DEFAULT NULL,
  `location_id` int NOT NULL,
  `bookable` tinyint(1) DEFAULT '1',
  `description` text,
  `lock_user_id` int DEFAULT NULL,
  `locked_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `start_studio_idx` (`start`,`location_id`),
  KEY `studio_id_idx` (`location_id`),
  KEY `user_foreign_key` (`lock_user_id`),
  CONSTRAINT `allotment_studio_id_studio_id` FOREIGN KEY (`location_id`) REFERENCES `location` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `user_foreign_key` FOREIGN KEY (`lock_user_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB  DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `event_view` AS SELECT 
 1 AS `id`,
 1 AS `start`,
 1 AS `end`,
 1 AS `location`,
 1 AS `title`,
 1 AS `reservable`,
 1 AS `reservation`,
 1 AS `locked`*/;
SET character_set_client = @saved_cs_client;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `invitation_view` AS SELECT 
 1 AS `confirmed`,
 1 AS `projectId`,
 1 AS `invitorId`,
 1 AS `invitees`,
 1 AS `groupId`,
 1 AS `approveId`,
 1 AS `deniedId`*/;
SET character_set_client = @saved_cs_client;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `location` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `location` varchar(255) DEFAULT '',
  `restriction` int NOT NULL DEFAULT '0',
  `allows_walk_ins` tinyint(1) NOT NULL DEFAULT '0',
  `default_hours_monday` int NOT NULL DEFAULT '0',
  `default_hours_tuesday` int NOT NULL DEFAULT '0',
  `default_hours_wednesday` int NOT NULL DEFAULT '0',
  `default_hours_thursday` int NOT NULL DEFAULT '0',
  `default_hours_friday` int NOT NULL DEFAULT '0',
  `default_hours_saturday` int NOT NULL DEFAULT '0',
  `default_hours_sunday` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `location_hours` (
  `location_id` int NOT NULL,
  `date` date NOT NULL,
  `hours` int NOT NULL,
  PRIMARY KEY (`location_id`,`date`),
  CONSTRAINT `FK_studio_hours_studio` FOREIGN KEY (`location_id`) REFERENCES `location` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `location_view` AS SELECT 
 1 AS `id`,
 1 AS `title`,
 1 AS `groupId`,
 1 AS `hours`,
 1 AS `restriction`,
 1 AS `allowsWalkIns`,
 1 AS `defaultHours`*/;
SET character_set_client = @saved_cs_client;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `group_hours` decimal(18,2) NOT NULL DEFAULT '0.00',
  `open` tinyint(1) NOT NULL DEFAULT '1',
  `book_start` date NOT NULL,
  `start` date NOT NULL,
  `end` date NOT NULL,
  `brief` varchar(255) NOT NULL DEFAULT '',
  `description` varchar(255) NOT NULL DEFAULT '',
  `group_size` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_group` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `project_id` int NOT NULL,
  `creator_id` int NOT NULL,
  `admin_created_id` int DEFAULT NULL,
  `admin_approved_id` int DEFAULT NULL,
  `admin_rejected_id` int DEFAULT NULL,
  `pending` tinyint(1) NOT NULL DEFAULT '1',
  `abandoned` tinyint(1) NOT NULL DEFAULT '0',
  `exception_size` tinyint(1) NOT NULL DEFAULT '0',
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `creator_idx` (`creator_id`),
  KEY `project_id_idx` (`project_id`),
  KEY `admin_id_idx` (`admin_created_id`),
  CONSTRAINT `rm_group_admin_id_user_id` FOREIGN KEY (`admin_created_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `rm_group_creator_user_id` FOREIGN KEY (`creator_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `rm_group_project_id_project_id` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB  DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_group_user` (
  `user_id` int NOT NULL,
  `project_group_id` int NOT NULL,
  `invitation_accepted` tinyint(1) NOT NULL DEFAULT '0',
  `invitation_rejected` tinyint(1) NOT NULL DEFAULT '0',
  `updated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`project_group_id`),
  KEY `student_group_group_id_rm_group_id` (`project_group_id`),
  CONSTRAINT `student_group_group_id_rm_group_id` FOREIGN KEY (`project_group_id`) REFERENCES `project_group` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `student_group_student_id_user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `project_group_user_active_count` AS SELECT 
 1 AS `active_count`,
 1 AS `project_id`,
 1 AS `project_group_id`,
 1 AS `user_id`*/;
SET character_set_client = @saved_cs_client;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `project_group_user_view` AS SELECT 
 1 AS `id`,
 1 AS `projectId`,
 1 AS `name`,
 1 AS `email`,
 1 AS `phone`,
 1 AS `invitations`,
 1 AS `hasGroup`*/;
SET character_set_client = @saved_cs_client;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `project_group_view` AS SELECT 
 1 AS `id`,
 1 AS `projectId`,
 1 AS `creatorId`,
 1 AS `title`,
 1 AS `pending`,
 1 AS `members`,
 1 AS `exceptionalSize`,
 1 AS `reservedHours`*/;
SET character_set_client = @saved_cs_client;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_location_hours` (
  `project_id` int NOT NULL,
  `location_id` int NOT NULL,
  `hours` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`project_id`,`location_id`),
  KEY `FK_project_studio_studio` (`location_id`),
  CONSTRAINT `FK_project_studio_project` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_project_studio_studio` FOREIGN KEY (`location_id`) REFERENCES `location` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `project_view` AS SELECT 
 1 AS `id`,
 1 AS `title`,
 1 AS `course`,
 1 AS `start`,
 1 AS `end`,
 1 AS `reservationStart`,
 1 AS `allotments`,
 1 AS `totalAllottedHours`,
 1 AS `locationHours`,
 1 AS `open`,
 1 AS `groupSize`,
 1 AS `groupAllottedHours`*/;
SET character_set_client = @saved_cs_client;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_virtual_week_hours` (
  `project_id` int NOT NULL,
  `virtual_week_id` int NOT NULL,
  `hours` int DEFAULT '0',
  PRIMARY KEY (`project_id`,`virtual_week_id`),
  KEY `FK_project_allotment_virtual_week` (`virtual_week_id`),
  CONSTRAINT `FK_project_virtual_week` FOREIGN KEY (`virtual_week_id`) REFERENCES `virtual_week` (`id`) ON DELETE CASCADE,
  CONSTRAINT `project_allotment_project_id_project_id` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservation` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `group_id` int NOT NULL,
  `project_id` int DEFAULT NULL,
  `confirmed` tinyint(1) DEFAULT '1',
  `confirmed_time` datetime DEFAULT NULL,
  `reject_reason` text,
  `purpose` text,
  `checkin` datetime DEFAULT NULL,
  `checkout` datetime DEFAULT NULL,
  `absent_logtime` datetime DEFAULT NULL,
  `canceled` tinyint(1) NOT NULL DEFAULT '0',
  `canceled_user_id` int DEFAULT NULL,
  `canceled_time` datetime DEFAULT NULL,
  `refund_request` tinyint(1) DEFAULT '0',
  `refund_request_comment` text,
  `refund_approval_id` int DEFAULT NULL,
  `refund_denial_id` int DEFAULT NULL,
  `refund_response_time` datetime DEFAULT NULL,
  `live_room` tinyint(1) DEFAULT '0',
  `multitrack` tinyint(1) DEFAULT '0',
  `format_analog` tinyint(1) DEFAULT '0',
  `format_dolby` tinyint(1) DEFAULT '0',
  `contact_phone` varchar(20) DEFAULT NULL,
  `guests` text,
  `created` datetime DEFAULT CURRENT_TIMESTAMP,
  `modified` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `notes` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `group_id_idx` (`group_id`),
  KEY `allotment_id_idx` (`event_id`),
  KEY `project_id_idx` (`project_id`),
  KEY `refund_approval_idx` (`refund_approval_id`),
  CONSTRAINT `booking_allotment_id_allotment_id` FOREIGN KEY (`event_id`) REFERENCES `event` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `booking_group_id_rm_group_id` FOREIGN KEY (`group_id`) REFERENCES `project_group` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `booking_project_id_project_id` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `booking_refund_approval_user_id` FOREIGN KEY (`refund_approval_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB  DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `reservation_view` AS SELECT 
 1 AS `id`,
 1 AS `description`,
 1 AS `eventId`,
 1 AS `groupId`,
 1 AS `projectId`,
 1 AS `guests`,
 1 AS `created`,
 1 AS `cancelation`*/;
SET character_set_client = @saved_cs_client;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `title` (`title`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roster` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `course_id` int DEFAULT NULL,
  `semester_id` int DEFAULT NULL,
  `section_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_course_idx` (`user_id`,`course_id`,`semester_id`,`section_id`),
  KEY `student_id_idx` (`user_id`),
  KEY `course_id_idx` (`course_id`),
  KEY `semester_id_idx` (`semester_id`),
  KEY `section_id_idx` (`section_id`),
  CONSTRAINT `roster_course_id_course_id` FOREIGN KEY (`course_id`) REFERENCES `course` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `roster_section_id_section_id` FOREIGN KEY (`section_id`) REFERENCES `section` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `roster_semester_id_semester_id` FOREIGN KEY (`semester_id`) REFERENCES `semester` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `roster_student_id_user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB  DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `roster_view` AS SELECT 
 1 AS `id`,
 1 AS `course`,
 1 AS `student`*/;
SET character_set_client = @saved_cs_client;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `section` (
  `id` int NOT NULL AUTO_INCREMENT,
  `course_id` int DEFAULT NULL,
  `title` varchar(50) NOT NULL,
  `instructor_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `course_id_idx` (`course_id`),
  KEY `section_fk_user` (`instructor_id`),
  CONSTRAINT `section_course_id_course_id` FOREIGN KEY (`course_id`) REFERENCES `course` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `section_fk_user` FOREIGN KEY (`instructor_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `section_project` (
  `section_id` int NOT NULL,
  `project_id` int NOT NULL,
  PRIMARY KEY (`section_id`,`project_id`),
  KEY `FK_section_project_project` (`project_id`),
  CONSTRAINT `FK_section_project_project` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_section_project_section` FOREIGN KEY (`section_id`) REFERENCES `section` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `section_view` AS SELECT 
 1 AS `id`,
 1 AS `courseId`,
 1 AS `title`,
 1 AS `instructor`*/;
SET character_set_client = @saved_cs_client;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `semester` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(32) DEFAULT NULL,
  `start` date DEFAULT NULL,
  `end` date DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `semester_view` AS SELECT 
 1 AS `id`,
 1 AS `title`,
 1 AS `start`,
 1 AS `end`,
 1 AS `active`*/;
SET character_set_client = @saved_cs_client;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(20) NOT NULL,
  `restriction` int NOT NULL DEFAULT '0',
  `password` varchar(128) DEFAULT NULL,
  `first_name` varchar(50) NOT NULL DEFAULT '',
  `last_name` varchar(50) NOT NULL DEFAULT '',
  `middle_name` varchar(50) NOT NULL DEFAULT '',
  `email` varchar(255) NOT NULL DEFAULT '',
  `phone` varchar(50) NOT NULL DEFAULT '',
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_role` (
  `user_id` int NOT NULL,
  `role_id` int NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `user_role_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_role_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `user_view` AS SELECT 
 1 AS `id`,
 1 AS `username`,
 1 AS `name`,
 1 AS `email`,
 1 AS `phone`,
 1 AS `restriction`,
 1 AS `roles`,
 1 AS `projects`*/;
SET character_set_client = @saved_cs_client;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `virtual_week` (
  `id` int NOT NULL AUTO_INCREMENT,
  `start` date NOT NULL,
  `end` date NOT NULL,
  `location_id` int NOT NULL,
  `semester_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `start_location_idx` (`start`,`location_id`),
  KEY `location_id_idx` (`location_id`),
  KEY `semester_idx` (`semester_id`),
  CONSTRAINT `virtual_week_location_id_location_id` FOREIGN KEY (`location_id`) REFERENCES `location` (`id`),
  CONSTRAINT `virtual_week_semester_semester_id` FOREIGN KEY (`semester_id`) REFERENCES `semester` (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `virtual_week_view` AS SELECT 
 1 AS `id`,
 1 AS `start`,
 1 AS `end`,
 1 AS `locationId`,
 1 AS `semesterId`,
 1 AS `projectHours`*/;
SET character_set_client = @saved_cs_client;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE  FUNCTION `cast_to_bool`(n INT) RETURNS tinyint(1)
    READS SQL DATA
    DETERMINISTIC
BEGIN
    RETURN n;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50001 DROP VIEW IF EXISTS `active_semester_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 */
/*!50001 VIEW `active_semester_view` AS select `semester`.`id` AS `id`,`semester`.`title` AS `title`,`semester`.`start` AS `start`,`semester`.`end` AS `end`,`cast_to_bool`(1) AS `active` from `semester` where (`semester`.`id` = (select `active_semester`.`semester_id` from `active_semester`)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `equipment_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 */
/*!50001 VIEW `equipment_view` AS with `reservation_list` as (select `r`.`equipment_id` AS `id`,json_object('quantity',`r`.`quantity`,'bookingId',`r`.`booking_id`,'start',`a`.`start`,'end',`a`.`end`) AS `booking` from ((`equipment_reservation` `r` left join `reservation` `b` on((`b`.`id` = `r`.`booking_id`))) left join `event` `a` on((`b`.`event_id` = `a`.`id`)))) select `e`.`id` AS `id`,`e`.`manufacturer` AS `manufacturer`,`e`.`model` AS `model`,`e`.`serial` AS `serial`,`e`.`description` AS `description`,`e`.`sku` AS `sku`,`e`.`barcode` AS `barcode`,`e`.`restriction` AS `restriction`,`e`.`quantity` AS `quantity`,json_object('id',`c`.`id`,'title',`c`.`title`,'parentId',`c`.`parent_id`) AS `category`,'[]' AS `tags`,`e`.`consumable` AS `consumable`,if((`r`.`booking` is not null),json_arrayagg(`r`.`booking`),json_array()) AS `reservations`,`e`.`notes` AS `notes` from ((`equipment` `e` left join `equipment_category` `c` on((`c`.`id` = `e`.`category`))) left join `reservation_list` `r` on((`r`.`id` = `e`.`id`))) group by `e`.`id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `event_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 */
/*!50001 VIEW `event_view` AS with `equipment_list` as (select `er`.`booking_id` AS `booking_id`,if(((`e`.`manufacturer` is not null) and (`e`.`model` is not null)),concat(`e`.`manufacturer`,' ',`e`.`model`),`e`.`description`) AS `name`,json_object('quantity',sum(`er`.`quantity`),'items',json_arrayagg(json_object('id',`e`.`id`,'quantity',`er`.`quantity`))) AS `gear` from ((`equipment_reservation` `er` left join `equipment` `e` on((`e`.`id` = `er`.`equipment_id`))) left join `reservation` `b` on(((`er`.`booking_id` = `b`.`id`) and (0 = `b`.`canceled`)))) group by `name`,`b`.`id`) select `a`.`id` AS `id`,`a`.`start` AS `start`,`a`.`end` AS `end`,(select json_object('id',`s`.`id`,'groupId',`s`.`location`,'title',`s`.`title`,'restriction',`s`.`restriction`,'allowsWalkIns',`s`.`allows_walk_ins`) from `location` `s` where (`a`.`location_id` = `s`.`id`)) AS `location`,if((`g`.`title` is not null),`g`.`title`,`a`.`description`) AS `title`,`a`.`bookable` AS `reservable`,if((`b`.`id` is not null),json_object('id',`b`.`id`,'projectId',`b`.`project_id`,'description',`b`.`purpose`,'groupId',`b`.`group_id`,'liveRoom',`b`.`live_room`,'guests',`b`.`guests`,'contact',`b`.`contact_phone`,'created',date_format(`b`.`created`,'%Y-%m-%d %T'),'equipment',if((`el`.`gear` is not null),json_objectagg(ifnull(`el`.`name`,'unknown'),`el`.`gear`),NULL)),NULL) AS `reservation`,`cast_to_bool`(if((`a`.`lock_user_id` is null),0,1)) AS `locked` from (((`event` `a` left join `reservation` `b` on(((`a`.`id` = `b`.`event_id`) and (0 = `b`.`canceled`)))) left join `equipment_list` `el` on((`el`.`booking_id` = `b`.`id`))) left join `project_group` `g` on((`g`.`id` = `b`.`group_id`))) group by `a`.`id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `invitation_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 */
/*!50001 VIEW `invitation_view` AS select `cast_to_bool`((0 = `pg`.`pending`)) AS `confirmed`,`pgu`.`project_group_id` AS `projectId`,`pg`.`creator_id` AS `invitorId`,json_arrayagg(json_object('id',`pgu`.`user_id`,'accepted',`pgu`.`invitation_accepted`,'rejected',`pgu`.`invitation_rejected`,'name',json_object('first',`u`.`first_name`,'last',`u`.`last_name`),'email',`u`.`email`)) AS `invitees`,`pgu`.`project_group_id` AS `groupId`,ifnull(`pg`.`admin_approved_id`,0) AS `approveId`,ifnull(`pg`.`admin_rejected_id`,0) AS `deniedId` from ((`project_group_user` `pgu` join `project_group` `pg` on((`pgu`.`project_group_id` = `pg`.`id`))) join `user` `u` on((`pgu`.`user_id` = `u`.`id`))) where ((0 <> `pg`.`pending`) and (0 = `pg`.`abandoned`)) group by `pgu`.`project_group_id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `location_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 */
/*!50001 VIEW `location_view` AS select `s`.`id` AS `id`,`s`.`title` AS `title`,`s`.`location` AS `groupId`,if((`sh`.`date` is null),'[]',json_arrayagg(json_object('date',`sh`.`date`,'hours',`sh`.`hours`))) AS `hours`,`s`.`restriction` AS `restriction`,`s`.`allows_walk_ins` AS `allowsWalkIns`,json_object('monday',`s`.`default_hours_monday`,'tuesday',`s`.`default_hours_tuesday`,'wednesday',`s`.`default_hours_wednesday`,'thursday',`s`.`default_hours_thursday`,'friday',`s`.`default_hours_friday`,'saturday',`s`.`default_hours_saturday`,'sunday',`s`.`default_hours_sunday`) AS `defaultHours` from (`location` `s` left join `location_hours` `sh` on((`s`.`id` = `sh`.`location_id`))) group by `s`.`id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `project_group_user_active_count`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 */
/*!50001 VIEW `project_group_user_active_count` AS select count(`pg`.`id`) AS `active_count`,`pg`.`project_id` AS `project_id`,`pg`.`id` AS `project_group_id`,`pgu`.`user_id` AS `user_id` from (`project_group` `pg` join `project_group_user` `pgu` on((`pgu`.`project_group_id` = `pg`.`id`))) where ((0 = `pg`.`pending`) and (0 = `pg`.`abandoned`)) group by `pg`.`id`,`pgu`.`user_id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `project_group_user_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 */
/*!50001 VIEW `project_group_user_view` AS select `u`.`id` AS `id`,`p`.`id` AS `projectId`,json_object('first',`u`.`first_name`,'middle',`u`.`middle_name`,'last',`u`.`last_name`) AS `name`,`u`.`email` AS `email`,`u`.`phone` AS `phone`,(select count(0) from (`project_group` `pg` join `project_group_user` `pgu` on((`pgu`.`project_group_id` = `pg`.`id`))) where ((`pg`.`project_id` = `p`.`id`) and (0 <> `pg`.`pending`) and (0 = `pg`.`abandoned`) and (`pgu`.`user_id` = `u`.`id`))) AS `invitations`,`cast_to_bool`(ifnull((select `ac`.`active_count` from `project_group_user_active_count` `ac` where ((`ac`.`user_id` = `u`.`id`) and (`ac`.`project_id` = `p`.`id`))),0)) AS `hasGroup` from (((`roster` `r` join `user` `u` on((`r`.`user_id` = `u`.`id`))) join `section_project` `sp` on((`sp`.`section_id` = `r`.`course_id`))) join `project` `p` on((`p`.`id` = `sp`.`project_id`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `project_group_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 */
/*!50001 VIEW `project_group_view` AS select `g`.`id` AS `id`,`g`.`projectId` AS `projectId`,`g`.`creatorId` AS `creatorId`,`g`.`title` AS `title`,`g`.`pending` AS `pending`,`g`.`members` AS `members`,`g`.`exceptionalSize` AS `exceptionalSize`,ifnull(`r`.`reservedHours`,0) AS `reservedHours` from ((select `pg`.`id` AS `id`,`pg`.`project_id` AS `projectId`,`pg`.`creator_id` AS `creatorId`,`pg`.`title` AS `title`,`pg`.`pending` AS `pending`,json_arrayagg(json_object('id',`u`.`id`,'username',`u`.`user_id`,'name',json_object('first',`u`.`first_name`,'middle',`u`.`middle_name`,'last',`u`.`last_name`),'invitation',json_object('accepted',`pgu`.`invitation_accepted`,'rejected',`pgu`.`invitation_rejected`),'email',`u`.`email`)) AS `members`,if(((0 <> `pg`.`exception_size`) and (0 = `pg`.`admin_approved_id`)),`cast_to_bool`(1),`cast_to_bool`(0)) AS `exceptionalSize` from ((`project_group_user` `pgu` join `user` `u` on((`pgu`.`user_id` = `u`.`id`))) join `project_group` `pg` on((`pg`.`id` = `pgu`.`project_group_id`))) where (0 = `pg`.`abandoned`) group by `pg`.`id`) `g` left join (select `pg`.`id` AS `id`,cast((sum(time_to_sec(timediff(`a`.`end`,`a`.`start`))) / 3600) as decimal(8,2)) AS `reservedHours` from ((`project_group` `pg` left join `reservation` `b` on((`b`.`group_id` = `pg`.`id`))) left join `event` `a` on((`a`.`id` = `b`.`event_id`))) where ((0 = `pg`.`abandoned`) and (`b`.`refund_approval_id` is null)) group by `pg`.`id`) `r` on((`g`.`id` = `r`.`id`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `project_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 */
/*!50001 VIEW `project_view` AS select `p`.`id` AS `id`,`p`.`title` AS `title`,ifnull((select json_object('id',`c`.`id`,'title',`c`.`title`,'sections',json_arrayagg(`s`.`title`)) from ((`section_project` `sp` join `section` `s` on((`s`.`id` = `sp`.`section_id`))) join `course` `c`) where ((`sp`.`project_id` = `p`.`id`) and (`s`.`course_id` = `c`.`id`)) limit 1),json_object('id',-(1),'title','')) AS `course`,`p`.`start` AS `start`,`p`.`end` AS `end`,`p`.`book_start` AS `reservationStart`,ifnull((select json_arrayagg(json_object('locationId',`vw`.`location_id`,'virtualWeekId',`vw`.`id`,'start',if((`vw`.`start` >= `p`.`start`),`vw`.`start`,`p`.`start`),'end',if((`vw`.`end` <= `p`.`end`),`vw`.`end`,`p`.`end`),'hours',ifnull(`ph`.`hours`,0))) from ((`project_location_hours` `psh` join `virtual_week` `vw` on((`psh`.`location_id` = `vw`.`location_id`))) left join `project_virtual_week_hours` `ph` on(((`ph`.`project_id` = `psh`.`project_id`) and (`ph`.`virtual_week_id` = `vw`.`id`)))) where ((`psh`.`project_id` = `p`.`id`) and (`vw`.`end` >= `p`.`start`) and (`vw`.`start` <= `p`.`end`))),'[]') AS `allotments`,ifnull((select sum(`ph`.`hours`) from `project_virtual_week_hours` `ph` where (`ph`.`project_id` = `p`.`id`)),0) AS `totalAllottedHours`,ifnull((select json_arrayagg(json_object('locationId',`ps`.`location_id`,'hours',`ps`.`hours`)) from `project_location_hours` `ps` where (`ps`.`project_id` = `p`.`id`)),'[]') AS `locationHours`,`p`.`open` AS `open`,`p`.`group_size` AS `groupSize`,`p`.`group_hours` AS `groupAllottedHours` from `project` `p` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `reservation_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 */
/*!50001 VIEW `reservation_view` AS select `b`.`id` AS `id`,`b`.`purpose` AS `description`,`b`.`event_id` AS `eventId`,`b`.`group_id` AS `groupId`,ifnull(`b`.`project_id`,0) AS `projectId`,`b`.`guests` AS `guests`,`b`.`created` AS `created`,if(`b`.`canceled`,json_object('canceled',json_object('on',date_format(`b`.`canceled_time`,'%Y-%m-%d %T'),'by',`b`.`canceled_user_id`,'requestsRefund',`b`.`refund_request`,'comment',`b`.`refund_request_comment`),'refund',json_object('approved',json_object('on',if((`b`.`refund_approval_id` is not null),date_format(`b`.`refund_response_time`,'%Y-%m-%d %T'),''),'by',`b`.`refund_approval_id`),'rejected',json_object('on',if((`b`.`refund_denial_id` is not null),date_format(`b`.`refund_response_time`,'%Y-%m-%d %T'),''),'by',`b`.`refund_denial_id`))),NULL) AS `cancelation` from ((((`reservation` `b` left join `event` `a` on((`a`.`id` = `b`.`event_id`))) left join `location` `s` on((`a`.`location_id` = `s`.`id`))) left join `project_group_view` `u` on((`b`.`group_id` = `u`.`id`))) left join `project` `p` on((`u`.`projectId` = `p`.`id`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `roster_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 */
/*!50001 VIEW `roster_view` AS select `r`.`id` AS `id`,json_object('title',`c`.`title`,'catalogId',`c`.`catalog_id`,'section',`s`.`title`,'instructor',if((`s`.`instructor_id` is not null),(select concat(`user`.`first_name`,' ',`user`.`last_name`) from `user` where (`user`.`id` = `s`.`instructor_id`)),'TBA')) AS `course`,json_object('id',`u`.`id`,'username',`u`.`user_id`,'name',json_object('first',`u`.`first_name`,'middle',`u`.`middle_name`,'last',`u`.`last_name`)) AS `student` from (((`roster` `r` join `user` `u` on((`r`.`user_id` = `u`.`id`))) join `section` `s` on((`r`.`section_id` = `s`.`id`))) join `course` `c` on((`s`.`course_id` = `c`.`id`))) order by `c`.`catalog_id`,`s`.`title`,`u`.`last_name`,`u`.`first_name` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `section_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 */
/*!50001 VIEW `section_view` AS select `s`.`id` AS `id`,`s`.`course_id` AS `courseId`,`s`.`title` AS `title`,if((`s`.`instructor_id` is not null),concat(`u`.`first_name`,' ',`u`.`last_name`),'TBA') AS `instructor` from (`section` `s` left join `user` `u` on((`s`.`instructor_id` = `u`.`id`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `semester_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 */
/*!50001 VIEW `semester_view` AS select `semester`.`id` AS `id`,`semester`.`title` AS `title`,`semester`.`start` AS `start`,`semester`.`end` AS `end`,`cast_to_bool`(if((`semester`.`id` = (select `active_semester`.`semester_id` from `active_semester`)),1,0)) AS `active` from `semester` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `user_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 */
/*!50001 VIEW `user_view` AS select `u`.`id` AS `id`,`u`.`user_id` AS `username`,json_object('first',`u`.`first_name`,'middle',`u`.`middle_name`,'last',`u`.`last_name`) AS `name`,`u`.`email` AS `email`,`u`.`phone` AS `phone`,`u`.`restriction` AS `restriction`,ifnull((select json_arrayagg(`r`.`title`) from (`role` `r` join `user_role` `ur` on((`ur`.`role_id` = `r`.`id`))) where (`ur`.`user_id` = `u`.`id`)),json_array()) AS `roles`,ifnull((select json_arrayagg(json_object('id',`p`.`id`,'title',`p`.`title`)) from (((`roster` `rst` join `section` `sec` on((`rst`.`section_id` = `sec`.`id`))) join `section_project` on((`sec`.`id` = `section_project`.`section_id`))) join `project` `p` on((`section_project`.`project_id` = `p`.`id`))) where (`rst`.`user_id` = `u`.`id`)),json_array()) AS `projects` from `user` `u` group by `u`.`id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `virtual_week_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 */
/*!50001 VIEW `virtual_week_view` AS select `vw`.`id` AS `id`,`vw`.`start` AS `start`,`vw`.`end` AS `end`,`vw`.`location_id` AS `locationId`,`vw`.`semester_id` AS `semesterId`,ifnull((select sum(`pa`.`hours`) from `project_virtual_week_hours` `pa` where (`pa`.`virtual_week_id` = `vw`.`id`)),0) AS `projectHours` from `virtual_week` `vw` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;
