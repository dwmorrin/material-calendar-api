CREATE TABLE `tag` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tags` text,
  `category` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tags_category_id_categories_id` (`category`),
  CONSTRAINT `tags_category_id_categories_id` FOREIGN KEY (`category`) REFERENCES `category` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=latin1;
