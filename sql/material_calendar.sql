SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `active_semester` (
  `id` tinyint NOT NULL DEFAULT '1',
  `semester_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_active_semester_semester` (`semester_id`),
  CONSTRAINT `FK_active_semester_semester` FOREIGN KEY (`semester_id`) REFERENCES `semester` (`id`),
  CONSTRAINT `active_semester_only_one` CHECK ((`id` = 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `allotment` (
  `id` int NOT NULL AUTO_INCREMENT,
  `start` datetime DEFAULT NULL,
  `end` datetime DEFAULT NULL,
  `studio_id` int DEFAULT NULL,
  `bookable` tinyint DEFAULT '1',
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
  `confirmed` tinyint DEFAULT '1',
  `confirmed_time` datetime DEFAULT NULL,
  `reject_reason` text,
  `purpose` text,
  `checkin` datetime DEFAULT NULL,
  `checkout` datetime DEFAULT NULL,
  `absent_logtime` datetime DEFAULT NULL,
  `cancelled` tinyint DEFAULT '0',
  `cancelled_time` datetime DEFAULT NULL,
  `cancel_request` tinyint DEFAULT '0',
  `cancel_request_userid` int DEFAULT NULL,
  `cancel_request_time` datetime DEFAULT NULL,
  `cancel_request_comment` text,
  `cancelled_approval` int DEFAULT NULL,
  `living_room` tinyint DEFAULT '0',
  `multitrack` tinyint DEFAULT '0',
  `format_analog` tinyint DEFAULT '0',
  `format_dolby` tinyint DEFAULT '0',
  `contact_phone` varchar(20) DEFAULT NULL,
  `guests` text,
  `refundable` tinyint DEFAULT '0',
  `checked_in` tinyint DEFAULT '0',
  `checked_out` tinyint DEFAULT '0',
  `absent` tinyint DEFAULT '0',
  `checkin_comment` text,
  `checkout_comment` text,
  `checkin_id` int DEFAULT NULL,
  `checkout_id` int DEFAULT NULL,
  `absent_id` int DEFAULT NULL,
  `created` datetime DEFAULT CURRENT_TIMESTAMP,
  `modified` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `notes` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `group_id_idx` (`group_id`),
  KEY `allotment_id_idx` (`allotment_id`),
  KEY `project_id_idx` (`project_id`),
  KEY `cancelled_approval_idx` (`cancelled_approval`),
  KEY `cancel_request_userid_idx` (`cancel_request_userid`),
  KEY `checkin_id_idx` (`checkin_id`),
  KEY `checkout_id_idx` (`checkout_id`),
  KEY `absent_id_idx` (`absent_id`),
  CONSTRAINT `booking_absent_id_user_id` FOREIGN KEY (`absent_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `booking_allotment_id_allotment_id` FOREIGN KEY (`allotment_id`) REFERENCES `allotment` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `booking_cancel_request_userid_user_id` FOREIGN KEY (`cancel_request_userid`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `booking_cancelled_approval_user_id` FOREIGN KEY (`cancelled_approval`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `booking_checkin_id_user_id` FOREIGN KEY (`checkin_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `booking_checkout_id_user_id` FOREIGN KEY (`checkout_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `booking_group_id_rm_group_id` FOREIGN KEY (`group_id`) REFERENCES `rm_group` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `booking_project_id_project_id` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
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
  `request_status` tinyint DEFAULT '0',
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
  `title` varchar(128) DEFAULT NULL,
  `instructor` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_project` (
  `course_id` int NOT NULL,
  `project_id` int NOT NULL,
  PRIMARY KEY (`course_id`,`project_id`),
  KEY `FK_course_project_project` (`project_id`),
  CONSTRAINT `FK_course_project_course` FOREIGN KEY (`course_id`) REFERENCES `course` (`id`),
  CONSTRAINT `FK_course_project_project` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
  `consumable` int DEFAULT NULL,
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
  `checkin_status` tinyint DEFAULT '1',
  `checkout_status` tinyint DEFAULT '1',
  PRIMARY KEY (`equipment_id`,`booking_id`),
  KEY `FK_booking_equipment_reservation` (`booking_id`),
  CONSTRAINT `FK_booking_equipment_reservation` FOREIGN KEY (`booking_id`) REFERENCES `booking` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_equipment_equipment_reservation` FOREIGN KEY (`equipment_id`) REFERENCES `equipment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `full_calendar` AS SELECT 
 1 AS `id`,
 1 AS `start`,
 1 AS `end`,
 1 AS `studio`,
 1 AS `description`,
 1 AS `students`,
 1 AS `email`,
 1 AS `phone`,
 1 AS `project`,
 1 AS `tape`,
 1 AS `dolby`,
 1 AS `live room`,
 1 AS `purpose`,
 1 AS `guests`,
 1 AS `cancel_request`,
 1 AS `cancel_request_time`,
 1 AS `cancel_request_comment`,
 1 AS `gear`,
 1 AS `open`,
 1 AS `studioId`,
 1 AS `reservationId`,
 1 AS `projectId`,
 1 AS `projectGroupId`,
 1 AS `notes`*/;
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
  CONSTRAINT `group_project_hours_group_id_rm_group_id` FOREIGN KEY (`group_id`) REFERENCES `rm_group` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
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
  `status` tinyint DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `requestor_idx` (`requestor`),
  KEY `group_id_idx` (`group_id`),
  CONSTRAINT `group_request_group_id_rm_group_id` FOREIGN KEY (`group_id`) REFERENCES `rm_group` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `group_request_requestor_user_id` FOREIGN KEY (`requestor`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invitation` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invitor` int DEFAULT NULL,
  `group_id` int DEFAULT NULL,
  `hash` varchar(32) DEFAULT NULL,
  `message` text,
  `project_id` int DEFAULT NULL,
  `created` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `invitor_idx` (`invitor`),
  KEY `group_id_idx` (`group_id`),
  KEY `project_id_idx` (`project_id`),
  CONSTRAINT `invitation_group_id_rm_group_id` FOREIGN KEY (`group_id`) REFERENCES `rm_group` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `invitation_invitor_user_id` FOREIGN KEY (`invitor`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `invitation_project_id_project_id` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invitee` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invitation_id` int DEFAULT NULL,
  `invitee` int DEFAULT NULL,
  `status` tinyint DEFAULT '1',
  `sent_timestamp` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invitation_invitee_idx` (`invitation_id`,`invitee`,`status`),
  KEY `invitee_idx` (`invitee`),
  KEY `invitation_id_idx` (`invitation_id`),
  CONSTRAINT `invitee_invitation_id_invitation_id` FOREIGN KEY (`invitation_id`) REFERENCES `invitation` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `invitee_invitee_user_id` FOREIGN KEY (`invitee`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `message` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `message` text,
  `sender` int DEFAULT NULL,
  `broadcast` tinyint DEFAULT '0',
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
  CONSTRAINT `message_receiver_receiver_group_rm_group_id` FOREIGN KEY (`receiver_group`) REFERENCES `rm_group` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `message_receiver_receiver_user_user_id` FOREIGN KEY (`receiver_user`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL,
  `group_hours` decimal(18,2) DEFAULT NULL,
  `open` tinyint DEFAULT NULL,
  `book_start` date DEFAULT NULL,
  `start` date DEFAULT NULL,
  `end` date DEFAULT NULL,
  `brief` varchar(255) DEFAULT NULL,
  `description` text,
  `group_size` int DEFAULT NULL,
  PRIMARY KEY (`id`)
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
  CONSTRAINT `FK_project_studio_project` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`),
  CONSTRAINT `FK_project_studio_studio` FOREIGN KEY (`studio_id`) REFERENCES `studio` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
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
CREATE TABLE `rm_group` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` text,
  `project_id` int DEFAULT NULL,
  `course_id` int DEFAULT NULL,
  `creator` int DEFAULT NULL,
  `status` tinyint DEFAULT '0',
  `byadmin` tinyint DEFAULT '0',
  `admin_id` int DEFAULT NULL,
  `group_type` tinyint DEFAULT '1',
  `group_size` int DEFAULT NULL,
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
CREATE TABLE `roster` (
  `roster_id` int NOT NULL AUTO_INCREMENT,
  `student_id` int DEFAULT NULL,
  `course_id` int DEFAULT NULL,
  `semester_id` int DEFAULT NULL,
  `section_id` int DEFAULT NULL,
  PRIMARY KEY (`roster_id`),
  UNIQUE KEY `student_course_idx` (`student_id`,`course_id`,`semester_id`,`section_id`),
  KEY `student_id_idx` (`student_id`),
  KEY `course_id_idx` (`course_id`),
  KEY `semester_id_idx` (`semester_id`),
  KEY `section_id_idx` (`section_id`),
  CONSTRAINT `roster_course_id_course_id` FOREIGN KEY (`course_id`) REFERENCES `course` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `roster_section_id_section_id` FOREIGN KEY (`section_id`) REFERENCES `section` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `roster_semester_id_semester_id` FOREIGN KEY (`semester_id`) REFERENCES `semester` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `roster_student_id_user_id` FOREIGN KEY (`student_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB  DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `scheduler_sheet` (
  `studio_id` int NOT NULL DEFAULT '0',
  `semester_id` int NOT NULL DEFAULT '0',
  `course_id` int NOT NULL DEFAULT '0',
  `status` tinyint DEFAULT '1',
  PRIMARY KEY (`studio_id`,`semester_id`,`course_id`),
  KEY `scheduler_sheet_semester_id_semester_id` (`semester_id`),
  KEY `scheduler_sheet_course_id_course_id` (`course_id`),
  CONSTRAINT `scheduler_sheet_course_id_course_id` FOREIGN KEY (`course_id`) REFERENCES `course` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `scheduler_sheet_semester_id_semester_id` FOREIGN KEY (`semester_id`) REFERENCES `semester` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `scheduler_sheet_studio_id_studio_id` FOREIGN KEY (`studio_id`) REFERENCES `studio` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `section` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(80) DEFAULT NULL,
  `course_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `course_id_idx` (`course_id`),
  CONSTRAINT `section_course_id_course_id` FOREIGN KEY (`course_id`) REFERENCES `course` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB  DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `semester` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(32) DEFAULT NULL,
  `start` date DEFAULT NULL,
  `end` date DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_group` (
  `student_id` int NOT NULL DEFAULT '0',
  `group_id` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`student_id`,`group_id`),
  KEY `student_group_group_id_rm_group_id` (`group_id`),
  CONSTRAINT `student_group_group_id_rm_group_id` FOREIGN KEY (`group_id`) REFERENCES `rm_group` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `student_group_student_id_user_id` FOREIGN KEY (`student_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `studio` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `max_time` decimal(18,2) DEFAULT NULL,
  `mon_hour` smallint DEFAULT NULL,
  `tue_hour` smallint DEFAULT NULL,
  `wed_hour` smallint DEFAULT NULL,
  `thur_hour` smallint DEFAULT NULL,
  `fri_hour` smallint DEFAULT NULL,
  `sat_hour` smallint DEFAULT NULL,
  `sun_hour` smallint DEFAULT NULL,
  `restriction` int NOT NULL DEFAULT '0',
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
  `password` varchar(128) DEFAULT NULL,
  `first_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `middle_name` varchar(20) DEFAULT NULL,
  `email` varchar(252) DEFAULT NULL,
  `user_type` tinyint DEFAULT NULL,
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `restriction` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
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
) ENGINE=InnoDB  DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
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
/*!50001 DROP VIEW IF EXISTS `full_calendar`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 */
/*!50001 VIEW `full_calendar` AS with `equipment_list` as (select `r`.`booking_id` AS `booking_id`,(case when ((`e`.`manufacturer` is not null) and (`e`.`model` is not null)) then concat(`e`.`manufacturer`,' ',`e`.`model`) else `e`.`description` end) AS `name`,json_object('quantity',sum(`r`.`quantity`),'items',json_arrayagg(json_object('id',`e`.`id`,'quantity',`r`.`quantity`))) AS `gear` from ((`equipment_reservation` `r` left join `equipment` `e` on((`e`.`id` = `r`.`equipment_id`))) left join `booking` `b` on((`r`.`booking_id` = `b`.`id`))) group by `name`,`b`.`id`) select `a`.`id` AS `id`,`a`.`start` AS `start`,`a`.`end` AS `end`,`s`.`name` AS `studio`,(case when (`g`.`name` is null) then `a`.`description` else `g`.`name` end) AS `description`,(case when (`g`.`name` is not null) then group_concat(distinct concat(`u`.`first_name`,' ',`u`.`last_name`) separator ', ') else NULL end) AS `students`,group_concat(distinct `u`.`email` separator ', ') AS `email`,`b`.`contact_phone` AS `phone`,`p`.`title` AS `project`,`b`.`format_analog` AS `tape`,`b`.`format_dolby` AS `dolby`,`b`.`living_room` AS `live room`,`b`.`purpose` AS `purpose`,`b`.`guests` AS `guests`,`b`.`cancel_request` AS `cancel_request`,`b`.`cancel_request_time` AS `cancel_request_time`,`b`.`cancel_request_comment` AS `cancel_request_comment`,(case when (`el`.`gear` is not null) then json_objectagg(ifnull(`el`.`name`,'UNKNOWNITEM'),`el`.`gear`) else NULL end) AS `gear`,`a`.`bookable` AS `open`,`s`.`id` AS `studioId`,`b`.`id` AS `reservationId`,`p`.`id` AS `projectId`,`g`.`id` AS `projectGroupId`,`b`.`notes` AS `notes` from (((((((`allotment` `a` left join `booking` `b` on(((`a`.`id` = `b`.`allotment_id`) and (`b`.`confirmed` = 1)))) left join `rm_group` `g` on((`b`.`group_id` = `g`.`id`))) left join `student_group` `sg` on((`g`.`id` = `sg`.`group_id`))) left join `user` `u` on((`sg`.`student_id` = `u`.`id`))) left join `studio` `s` on((`a`.`studio_id` = `s`.`id`))) left join `equipment_list` `el` on((`el`.`booking_id` = `b`.`id`))) left join `project` `p` on((`p`.`id` = `g`.`project_id`))) where (`s`.`name` <> 'Staff Only') group by `a`.`id` order by `studio`,`a`.`start` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;
