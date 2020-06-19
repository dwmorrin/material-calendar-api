CREATE TABLE `equipment` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category` int DEFAULT NULL,
  `manufacturer` text,
  `model` text,
  `description` text,
  `sku` text,
  `quantity` int DEFAULT NULL,
  `tags` json DEFAULT NULL,
  `consumable` int DEFAULT NULL,
  `reservations` json DEFAULT NULL,
  `equipment_listcol` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=94 DEFAULT CHARSET=latin1;
