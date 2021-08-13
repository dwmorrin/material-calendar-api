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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1;
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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1;
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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1;
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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1;
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
  CONSTRAINT `FK_booking_equipment_reservation` FOREIGN KEY (`booking_id`) REFERENCES `booking` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_equipment_equipment_reservation` FOREIGN KEY (`equipment_id`) REFERENCES `equipment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
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
  `invitor` int NOT NULL,
  `group_id` int NOT NULL,
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `approved_id` int DEFAULT NULL,
  `denied_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `invitor_idx` (`invitor`),
  KEY `invitation_group_id` (`group_id`),
  CONSTRAINT `invitation_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `project_group` (`id`),
  CONSTRAINT `invitation_invitor_user_id` FOREIGN KEY (`invitor`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
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
 1 AS `allowsWalkIns`,
 1 AS `defaultHours`*/;
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
  `title` varchar(255) NOT NULL,
  `project_id` int NOT NULL,
  `creator` int DEFAULT NULL,
  `admin_id` int DEFAULT NULL,
  `pending` tinyint(1) NOT NULL DEFAULT '1',
  `abandoned` tinyint(1) NOT NULL DEFAULT '0',
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
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `reservation` AS SELECT 
 1 AS `id`,
 1 AS `description`,
 1 AS `eventId`,
 1 AS `groupId`,
 1 AS `projectId`,
 1 AS `guests`,
 1 AS `created`,
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
 1 AS `title`,
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
SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;
