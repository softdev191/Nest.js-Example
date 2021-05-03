-- SQL statements for the UP migration

CREATE TABLE `follow` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `follower_id` int(11) unsigned NOT NULL,
  `followee_id` int(11) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `follower_id` (`follower_id`,`followee_id`),
  KEY `followee_id` (`followee_id`,`follower_id`),
  UNIQUE KEY `follower_id__followee_id` (`follower_id`, `followee_id`),
  CONSTRAINT `fk__follow__follower_id` FOREIGN KEY (`follower_id`) REFERENCES `user` (`id`),
  CONSTRAINT `fk__follow__followee_id` FOREIGN KEY (`followee_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;