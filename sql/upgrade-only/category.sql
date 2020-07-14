CREATE TABLE `category` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` text,
  `parent_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
);