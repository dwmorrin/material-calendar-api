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
CREATE TABLE `allotment` (
  `id` int NOT NULL AUTO_INCREMENT,
  `start` datetime DEFAULT NULL,
  `end` datetime DEFAULT NULL,
  `studio_id` int DEFAULT NULL,
  `bookable` tinyint(1) DEFAULT '1',
  `description` text,
  `lock_user_id` int DEFAULT NULL,
  `locked_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `start_studio_idx` (`start`,`studio_id`),
  KEY `studio_id_idx` (`studio_id`),
  KEY `user_foreign_key` (`lock_user_id`),
  CONSTRAINT `allotment_studio_id_studio_id` FOREIGN KEY (`studio_id`) REFERENCES `studio` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `user_foreign_key` FOREIGN KEY (`lock_user_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `booking` (
  `id` int NOT NULL AUTO_INCREMENT,
  `allotment_id` int DEFAULT NULL,
  `group_id` int NOT NULL,
  `project_id` int DEFAULT NULL,
  `confirmed` tinyint(1) DEFAULT '1',
  `confirmed_time` datetime DEFAULT NULL,
  `reject_reason` text,
  `purpose` text,
  `checkin` datetime DEFAULT NULL,
  `checkout` datetime DEFAULT NULL,
  `absent_logtime` datetime DEFAULT NULL,
  `cancelled` tinyint(1) DEFAULT '0',
  `cancelled_user_id` int DEFAULT NULL,
  `cancelled_time` datetime DEFAULT NULL,
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
  KEY `allotment_id_idx` (`allotment_id`),
  KEY `project_id_idx` (`project_id`),
  KEY `refund_approval_idx` (`refund_approval_id`),
  CONSTRAINT `booking_allotment_id_allotment_id` FOREIGN KEY (`allotment_id`) REFERENCES `allotment` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `booking_group_id_rm_group_id` FOREIGN KEY (`group_id`) REFERENCES `project_group` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `booking_project_id_project_id` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `booking_refund_approval_user_id` FOREIGN KEY (`refund_approval_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `booking_guest` (
  `id` int NOT NULL AUTO_INCREMENT,
  `booking_id` int DEFAULT NULL,
  `guest` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `booking_id_idx` (`booking_id`),
  CONSTRAINT `booking_guest_booking_id_booking_id` FOREIGN KEY (`booking_id`) REFERENCES `booking` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `booking_trading_request` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `booking_id` int DEFAULT NULL,
  `project_id` int DEFAULT NULL,
  `request_time` datetime DEFAULT NULL,
  `request_id` int DEFAULT NULL,
  `request_comment` text,
  `reject_reason` text,
  `request_status` tinyint(1) DEFAULT '0',
  `confirm_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `request_id_idx` (`request_id`),
  KEY `booking_id_idx` (`booking_id`),
  KEY `confirm_id_idx` (`confirm_id`),
  KEY `project_id_idx` (`project_id`),
  CONSTRAINT `booking_trading_request_booking_id_booking_id` FOREIGN KEY (`booking_id`) REFERENCES `booking` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `booking_trading_request_confirm_id_user_id` FOREIGN KEY (`confirm_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `booking_trading_request_project_id_project_id` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `booking_trading_request_request_id_user_id` FOREIGN KEY (`request_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` text,
  `parent_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `category_path` AS SELECT 
 1 AS `id`,
 1 AS `title`,
 1 AS `path`*/;
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
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `equipment_info` AS SELECT 
 1 AS `id`,
 1 AS `manufacturer`,
 1 AS `model`,
 1 AS `description`,
 1 AS `sku`,
 1 AS `quantity`,
 1 AS `category`,
 1 AS `tags`,
 1 AS `consumable`,
 1 AS `reservations`,
 1 AS `restriction`*/;
SET character_set_client = @saved_cs_client;
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
  CONSTRAINT `FK_booking_equipment_reservation` FOREIGN KEY (`booking_id`) REFERENCES `booking` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_equipment_equipment_reservation` FOREIGN KEY (`equipment_id`) REFERENCES `equipment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `event` AS SELECT 
 1 AS `id`,
 1 AS `start`,
 1 AS `end`,
 1 AS `location`,
 1 AS `title`,
 1 AS `reservable`,
 1 AS `reservation`*/;
SET character_set_client = @saved_cs_client;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gear_studio` (
  `equipment_id` int NOT NULL DEFAULT '0',
  `studio_id` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`equipment_id`,`studio_id`),
  KEY `gear_studio_studio_id_studio_id` (`studio_id`),
  CONSTRAINT `gear_studio_studio_id_studio_id` FOREIGN KEY (`studio_id`) REFERENCES `studio` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `group_project_hours` (
  `group_id` int NOT NULL DEFAULT '0',
  `project_id` int NOT NULL DEFAULT '0',
  `hours` int DEFAULT NULL,
  PRIMARY KEY (`group_id`,`project_id`),
  KEY `group_project_hours_project_id_project_id` (`project_id`),
  CONSTRAINT `group_project_hours_group_id_rm_group_id` FOREIGN KEY (`group_id`) REFERENCES `project_group` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `group_project_hours_project_id_project_id` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `group_request` (
  `id` int NOT NULL AUTO_INCREMENT,
  `requestor` int DEFAULT NULL,
  `group_id` int DEFAULT NULL,
  `message` text,
  `status` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `requestor_idx` (`requestor`),
  KEY `group_id_idx` (`group_id`),
  CONSTRAINT `group_request_group_id_rm_group_id` FOREIGN KEY (`group_id`) REFERENCES `project_group` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `group_request_requestor_user_id` FOREIGN KEY (`requestor`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invitation` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invitor` int DEFAULT NULL,
  `hash` varchar(32) DEFAULT NULL,
  `message` text,
  `project_id` int DEFAULT NULL,
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `approved_id` int DEFAULT NULL,
  `denied_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `invitor_idx` (`invitor`),
  KEY `project_id_idx` (`project_id`),
  CONSTRAINT `invitation_invitor_user_id` FOREIGN KEY (`invitor`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `invitation_project_id_project_id` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invitee` (
  `invitation_id` int NOT NULL,
  `invitee` int NOT NULL,
  `accepted` tinyint(1) NOT NULL DEFAULT '0',
  `rejected` tinyint(1) NOT NULL DEFAULT '0',
  `sent_timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`invitation_id`,`invitee`),
  UNIQUE KEY `invitation_invitee_idx` (`invitation_id`,`invitee`,`accepted`),
  KEY `invitee_idx` (`invitee`),
  KEY `invitation_id_idx` (`invitation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `location` AS SELECT 
 1 AS `id`,
 1 AS `title`,
 1 AS `groupId`,
 1 AS `hours`,
 1 AS `restriction`,
 1 AS `allowsWalkIns`*/;
SET character_set_client = @saved_cs_client;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `message` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `message` text,
  `sender` int DEFAULT NULL,
  `broadcast` tinyint(1) DEFAULT '0',
  `sent_time` datetime NOT NULL,
  `created` datetime NOT NULL,
  `modified` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sender_idx` (`sender`),
  CONSTRAINT `message_sender_user_id` FOREIGN KEY (`sender`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `message_receiver` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `receiver_group` int DEFAULT NULL,
  `receiver_user` int DEFAULT '0',
  `message_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `receiver_group_idx` (`receiver_group`),
  KEY `receiver_user_idx` (`receiver_user`),
  KEY `message_id_idx` (`message_id`),
  CONSTRAINT `message_receiver_message_id_message_id` FOREIGN KEY (`message_id`) REFERENCES `message` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `message_receiver_receiver_group_rm_group_id` FOREIGN KEY (`receiver_group`) REFERENCES `project_group` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `message_receiver_receiver_user_user_id` FOREIGN KEY (`receiver_user`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
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
  `name` text,
  `project_id` int DEFAULT NULL,
  `course_id` int DEFAULT NULL,
  `creator` int DEFAULT NULL,
  `byadmin` tinyint(1) DEFAULT '0',
  `admin_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `creator_idx` (`creator`),
  KEY `project_id_idx` (`project_id`),
  KEY `admin_id_idx` (`admin_id`),
  CONSTRAINT `rm_group_admin_id_user_id` FOREIGN KEY (`admin_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `rm_group_creator_user_id` FOREIGN KEY (`creator`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `rm_group_project_id_project_id` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB  DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_studio_hours` (
  `project_id` int NOT NULL,
  `studio_id` int NOT NULL,
  `hours` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`project_id`,`studio_id`),
  KEY `FK_project_studio_studio` (`studio_id`),
  CONSTRAINT `FK_project_studio_project` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_project_studio_studio` FOREIGN KEY (`studio_id`) REFERENCES `studio` (`id`) ON DELETE CASCADE
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
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `reservation` AS SELECT 
 1 AS `id`,
 1 AS `description`,
 1 AS `eventId`,
 1 AS `groupId`,
 1 AS `projectId`,
 1 AS `guests`,
 1 AS `cancellation`*/;
SET character_set_client = @saved_cs_client;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `reservation_pending` AS SELECT 
 1 AS `id`,
 1 AS `description`,
 1 AS `eventId`,
 1 AS `groupId`,
 1 AS `projectId`,
 1 AS `guests`,
 1 AS `cancellation`,
 1 AS `event`,
 1 AS `members`,
 1 AS `projectTitle`*/;
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
  CONSTRAINT `roster_student_id_user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB  DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `section` (
  `id` int NOT NULL AUTO_INCREMENT,
  `course_id` int DEFAULT NULL,
  `title` varchar(50) NOT NULL,
  `instructor` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `course_id_idx` (`course_id`),
  CONSTRAINT `section_course_id_course_id` FOREIGN KEY (`course_id`) REFERENCES `course` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
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
CREATE TABLE `student_group` (
  `student_id` int NOT NULL DEFAULT '0',
  `group_id` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`student_id`,`group_id`),
  KEY `student_group_group_id_rm_group_id` (`group_id`),
  CONSTRAINT `student_group_group_id_rm_group_id` FOREIGN KEY (`group_id`) REFERENCES `project_group` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `student_group_student_id_user_id` FOREIGN KEY (`student_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `studio` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `location` varchar(255) DEFAULT '',
  `restriction` int NOT NULL DEFAULT '0',
  `allows_walk_ins` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `studio_hours` (
  `studio_id` int NOT NULL,
  `date` date NOT NULL,
  `hours` int NOT NULL,
  PRIMARY KEY (`studio_id`,`date`),
  CONSTRAINT `FK_studio_hours_studio` FOREIGN KEY (`studio_id`) REFERENCES `studio` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tag` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` text,
  `category` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
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
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `user_group` AS SELECT 
 1 AS `id`,
 1 AS `projectId`,
 1 AS `members`,
 1 AS `reservedHours`*/;
SET character_set_client = @saved_cs_client;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_role` (
  `user_id` int NOT NULL,
  `role_id` int NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `user_role_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
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
  `studio_id` int NOT NULL,
  `semester_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `start_studio_idx` (`start`,`studio_id`),
  KEY `studio_id_idx` (`studio_id`),
  KEY `semester_idx` (`semester_id`),
  CONSTRAINT `virtual_week_semester_semester_id` FOREIGN KEY (`semester_id`) REFERENCES `semester` (`id`),
  CONSTRAINT `virtual_week_studio_id_studio_id` FOREIGN KEY (`studio_id`) REFERENCES `studio` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `virtual_week_view` AS SELECT 
 1 AS `id`,
 1 AS `start`,
 1 AS `end`,
 1 AS `locationId`,
 1 AS `semesterId`,
 1 AS `locationHours`,
 1 AS `projectHours`*/;
SET character_set_client = @saved_cs_client;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `week_name` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) DEFAULT NULL,
  `start` date DEFAULT NULL,
  `end` date DEFAULT NULL,
  `studio_id` int DEFAULT NULL,
  `semester` int DEFAULT NULL,
  `background` varchar(10) DEFAULT NULL,
  `color` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `start_studio_idx` (`start`,`studio_id`),
  KEY `studio_id_idx` (`studio_id`),
  KEY `semester_idx` (`semester`),
  CONSTRAINT `week_name_semester_semester_id` FOREIGN KEY (`semester`) REFERENCES `semester` (`id`),
  CONSTRAINT `week_name_studio_id_studio_id` FOREIGN KEY (`studio_id`) REFERENCES `studio` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
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
/*!50001 DROP VIEW IF EXISTS `category_path`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 */
/*!50001 VIEW `category_path` AS with recursive `category_path` (`id`,`title`,`path`) as (select `category`.`id` AS `id`,`category`.`title` AS `title`,`category`.`title` AS `path` from `category` where (`category`.`parent_id` is null) union all select `c`.`id` AS `id`,`c`.`title` AS `title`,concat(`cp`.`path`,'/',`c`.`title`) AS `CONCAT(cp.path, '/', c.title)` from (`category_path` `cp` join `category` `c` on((`cp`.`id` = `c`.`parent_id`)))) select `category_path`.`id` AS `id`,`category_path`.`title` AS `title`,`category_path`.`path` AS `path` from `category_path` order by `category_path`.`path` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `equipment_info`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 */
/*!50001 VIEW `equipment_info` AS with `reservation_list` as (select `r`.`equipment_id` AS `id`,json_object('quantity',`r`.`quantity`,'bookingId',`r`.`booking_id`,'start',`a`.`start`,'end',`a`.`end`) AS `booking` from ((`equipment_reservation` `r` left join `booking` `b` on((`b`.`id` = `r`.`booking_id`))) left join `allotment` `a` on((`b`.`allotment_id` = `a`.`id`)))) select `equipment`.`id` AS `id`,`equipment`.`manufacturer` AS `manufacturer`,`equipment`.`model` AS `model`,`equipment`.`description` AS `description`,`equipment`.`sku` AS `sku`,`equipment`.`quantity` AS `quantity`,json_object('id',`c`.`id`,'title',`c`.`title`,'parentId',`c`.`parent_id`) AS `category`,'[]' AS `tags`,0 AS `consumable`,(case when (`r`.`booking` is not null) then json_arrayagg(`r`.`booking`) else '[]' end) AS `reservations`,`equipment`.`restriction` AS `restriction` from ((`equipment` left join `category` `c` on((`c`.`id` = `equipment`.`category`))) left join `reservation_list` `r` on((`r`.`id` = `equipment`.`id`))) group by `equipment`.`id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `event`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 */
/*!50001 VIEW `event` AS with `equipment_list` as (select `er`.`booking_id` AS `booking_id`,if(((`e`.`manufacturer` is not null) and (`e`.`model` is not null)),concat(`e`.`manufacturer`,' ',`e`.`model`),`e`.`description`) AS `name`,json_object('quantity',sum(`er`.`quantity`),'items',json_arrayagg(json_object('id',`e`.`id`,'quantity',`er`.`quantity`))) AS `gear` from ((`equipment_reservation` `er` left join `equipment` `e` on((`e`.`id` = `er`.`equipment_id`))) left join `booking` `b` on((`er`.`booking_id` = `b`.`id`))) group by `name`,`b`.`id`) select `a`.`id` AS `id`,`a`.`start` AS `start`,`a`.`end` AS `end`,(select json_object('id',`s`.`id`,'title',`s`.`title`,'restriction',`s`.`restriction`,'allowsWalkIns',`s`.`allows_walk_ins`) from `studio` `s` where (`a`.`studio_id` = `s`.`id`)) AS `location`,if((`g`.`name` is not null),`g`.`name`,`a`.`description`) AS `title`,`a`.`bookable` AS `reservable`,if((`b`.`id` is not null),json_object('id',`b`.`id`,'projectId',`b`.`project_id`,'description',`b`.`purpose`,'groupId',`b`.`group_id`,'liveRoom',`b`.`live_room`,'guests',`b`.`guests`,'contact',`b`.`contact_phone`,'equipment',if((`el`.`gear` is not null),json_objectagg(ifnull(`el`.`name`,'unknown'),`el`.`gear`),NULL)),NULL) AS `reservation` from (((`allotment` `a` left join `booking` `b` on((`a`.`id` = `b`.`allotment_id`))) left join `equipment_list` `el` on((`el`.`booking_id` = `b`.`id`))) left join `project_group` `g` on((`g`.`id` = `b`.`group_id`))) group by `a`.`id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `location`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 */
/*!50001 VIEW `location` AS select `s`.`id` AS `id`,`s`.`title` AS `title`,`s`.`location` AS `groupId`,if((`sh`.`date` is null),'[]',json_arrayagg(json_object('date',`sh`.`date`,'hours',`sh`.`hours`))) AS `hours`,`s`.`restriction` AS `restriction`,`s`.`allows_walk_ins` AS `allowsWalkIns` from (`studio` `s` left join `studio_hours` `sh` on((`s`.`id` = `sh`.`studio_id`))) group by `s`.`id` */;
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
/*!50001 VIEW `project_view` AS select `p`.`id` AS `id`,`p`.`title` AS `title`,ifnull((select json_object('id',`c`.`id`,'title',`c`.`title`,'sections',json_arrayagg(`s`.`title`)) from ((`section_project` `sp` join `section` `s` on((`s`.`id` = `sp`.`section_id`))) join `course` `c`) where ((`sp`.`project_id` = `p`.`id`) and (`s`.`course_id` = `c`.`id`)) limit 1),json_object('id',-(1),'title','')) AS `course`,`p`.`start` AS `start`,`p`.`end` AS `end`,`p`.`book_start` AS `reservationStart`,ifnull((select json_arrayagg(json_object('locationId',`vw`.`studio_id`,'virtualWeekId',`vw`.`id`,'start',`vw`.`start`,'end',`vw`.`end`,'hours',`ph`.`hours`)) from (`project_virtual_week_hours` `ph` left join `virtual_week` `vw` on((`ph`.`virtual_week_id` = `vw`.`id`))) where (`ph`.`project_id` = `p`.`id`)),'[]') AS `allotments`,ifnull((select json_arrayagg(json_object('locationId',`ps`.`studio_id`,'hours',`ps`.`hours`)) from `project_studio_hours` `ps` where (`ps`.`project_id` = `p`.`id`)),'[]') AS `locationHours`,`p`.`open` AS `open`,`p`.`group_size` AS `groupSize`,`p`.`group_hours` AS `groupAllottedHours` from `project` `p` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `reservation`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 */
/*!50001 VIEW `reservation` AS select `b`.`id` AS `id`,`b`.`purpose` AS `description`,`b`.`allotment_id` AS `eventId`,`b`.`group_id` AS `groupId`,ifnull(`b`.`project_id`,0) AS `projectId`,`b`.`guests` AS `guests`,if((`b`.`cancelled` = 1),if((`b`.`refund_request` = 1),json_object('canceled',json_object('on',date_format(`b`.`cancelled_time`,'%Y-%m-%d %T'),'by',`b`.`cancelled_user_id`,'comment',`b`.`refund_request_comment`),'refund',json_object('approved',json_object('on',if((`b`.`refund_approval_id` is not null),date_format(`b`.`refund_response_time`,'%Y-%m-%d %T'),''),'by',`b`.`refund_approval_id`),'rejected',json_object('on',if((`b`.`refund_denial_id` is not null),date_format(`b`.`refund_response_time`,'%Y-%m-%d %T'),''),'by',`b`.`refund_denial_id`))),json_object('canceled',json_object('on',date_format(`b`.`cancelled_time`,'%Y-%m-%d %T'),'by',`b`.`cancelled_user_id`,'comment',`b`.`refund_request_comment`))),NULL) AS `cancellation` from ((((`booking` `b` left join `allotment` `a` on((`a`.`id` = `b`.`allotment_id`))) left join `studio` `s` on((`a`.`studio_id` = `s`.`id`))) left join `user_group` `u` on((`b`.`group_id` = `u`.`id`))) left join `project` `p` on((`u`.`projectId` = `p`.`id`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `reservation_pending`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 */
/*!50001 VIEW `reservation_pending` AS select `b`.`id` AS `id`,`b`.`purpose` AS `description`,`b`.`allotment_id` AS `eventId`,`b`.`group_id` AS `groupId`,ifnull(`b`.`project_id`,0) AS `projectId`,`b`.`guests` AS `guests`,if((`b`.`cancelled` = 1),if((`b`.`refund_request` = 1),json_object('canceled',json_object('on',date_format(`b`.`cancelled_time`,'%Y-%m-%d %T'),'by',`b`.`cancelled_user_id`,'comment',`b`.`refund_request_comment`),'refund',json_object('approved',json_object('on',if((`b`.`refund_approval_id` is not null),date_format(`b`.`refund_response_time`,'%Y-%m-%d %T'),''),'by',`b`.`refund_approval_id`),'rejected',json_object('on',if((`b`.`refund_denial_id` is not null),date_format(`b`.`refund_response_time`,'%Y-%m-%d %T'),''),'by',`b`.`refund_denial_id`))),json_object('canceled',json_object('on',date_format(`b`.`cancelled_time`,'%Y-%m-%d %T'),'by',`b`.`cancelled_user_id`,'comment',`b`.`refund_request_comment`))),NULL) AS `cancellation`,json_object('start',date_format(`a`.`start`,'%Y-%m-%d %T'),'end',date_format(`a`.`end`,'%Y-%m-%d %T'),'location',`s`.`title`) AS `event`,`u`.`members` AS `members`,`p`.`title` AS `projectTitle` from ((((`booking` `b` left join `allotment` `a` on((`a`.`id` = `b`.`allotment_id`))) left join `studio` `s` on((`a`.`studio_id` = `s`.`id`))) left join `user_group` `u` on((`b`.`group_id` = `u`.`id`))) left join `project` `p` on((`u`.`projectId` = `p`.`id`))) where ((`b`.`refund_request` = 1) and (`b`.`refund_approval_id` is null) and (`b`.`refund_denial_id` is null)) */;
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
/*!50001 DROP VIEW IF EXISTS `user_group`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 */
/*!50001 VIEW `user_group` AS select `g`.`id` AS `id`,`g`.`projectId` AS `projectId`,`g`.`members` AS `members`,ifnull(`r`.`reservedHours`,0) AS `reservedHours` from ((select `rg`.`id` AS `id`,`rg`.`project_id` AS `projectId`,json_arrayagg(json_object('id',`u`.`id`,'username',`u`.`user_id`,'name',json_object('first',`u`.`first_name`,'last',`u`.`last_name`),'email',`u`.`email`)) AS `members` from ((`user` `u` join `student_group` `sg` on((`sg`.`student_id` = `u`.`id`))) join `project_group` `rg` on((`rg`.`id` = `sg`.`group_id`))) group by `rg`.`id`) `g` left join (select `rg`.`id` AS `id`,cast((sum(time_to_sec(timediff(`a`.`end`,`a`.`start`))) / 3600) as decimal(8,2)) AS `reservedHours` from ((`project_group` `rg` join `booking` `b` on((`b`.`group_id` = `rg`.`id`))) join `allotment` `a` on((`a`.`id` = `b`.`allotment_id`))) group by `rg`.`id`) `r` on((`g`.`id` = `r`.`id`))) */;
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
/*!50001 VIEW `user_view` AS select `u`.`id` AS `id`,`u`.`user_id` AS `username`,json_object('first',`u`.`first_name`,'middle',`u`.`middle_name`,'last',`u`.`last_name`) AS `name`,`u`.`email` AS `email`,`u`.`phone` AS `phone`,`u`.`restriction` AS `restriction`,ifnull((select json_arrayagg(`r`.`title`) from (`role` `r` join `user_role` `ur` on((`ur`.`role_id` = `r`.`id`))) where (`ur`.`user_id` = `u`.`id`)),json_array()) AS `roles`,(select json_arrayagg(json_object('id',`rg`.`project_id`,'title',`p`.`title`,'groupId',`rg`.`id`,'course',json_object('id',ifnull(`c`.`id`,0),'title',ifnull(`c`.`title`,'')))) from (((`student_group` `sg` left join `project_group` `rg` on((`rg`.`id` = `sg`.`group_id`))) left join `course` `c` on((`c`.`id` = `rg`.`course_id`))) left join `project` `p` on((`rg`.`project_id` = `p`.`id`))) where (`sg`.`student_id` = `u`.`id`)) AS `projects` from `user` `u` group by `u`.`id` */;
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
/*!50001 VIEW `virtual_week_view` AS select `vw`.`id` AS `id`,`vw`.`start` AS `start`,`vw`.`end` AS `end`,`vw`.`studio_id` AS `locationId`,`vw`.`semester_id` AS `semesterId`,ifnull((select sum(`sh`.`hours`) from `studio_hours` `sh` where ((`vw`.`studio_id` = `sh`.`studio_id`) and (`sh`.`date` between `vw`.`start` and `vw`.`end`))),0) AS `locationHours`,ifnull((select sum(`pa`.`hours`) from `project_virtual_week_hours` `pa` where (`pa`.`virtual_week_id` = `vw`.`id`)),0) AS `projectHours` from `virtual_week` `vw` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;
