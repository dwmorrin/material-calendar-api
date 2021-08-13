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
  CONSTRAINT `virtual_week_semester_semester_id` FOREIGN KEY (`semester_id`) REFERENCES `semester` (`id`),
  CONSTRAINT `virtual_week_location_id_location_id` FOREIGN KEY (`location_id`) REFERENCES `location` (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1;