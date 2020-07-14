CREATE TABLE `course` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(128) DEFAULT NULL,
  `is_open` tinyint DEFAULT '1',
  `course_type` int DEFAULT NULL,
  `original_course_name` varchar(128) DEFAULT NULL,
  `instructor` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `course_type_idx` (`course_type`),
  CONSTRAINT `course_course_type_course_type_id` FOREIGN KEY (`course_type`) REFERENCES `course_type` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
);