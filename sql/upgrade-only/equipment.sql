CREATE TABLE `equipment` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category` int DEFAULT NULL,
  `manufacturer` text,
  `model` text,
  `description` text,
  `sku` text,
  `serial` text,
  `barcode` text,
  `quantity` int DEFAULT NULL,
  `tags` json DEFAULT NULL,
  `consumable` int DEFAULT NULL,
  `reservations` json DEFAULT NULL,
  `notes` text,
  PRIMARY KEY (`id`)
);