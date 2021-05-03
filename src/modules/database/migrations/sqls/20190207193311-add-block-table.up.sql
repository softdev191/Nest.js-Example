-- SQL statements for the UP migration

CREATE TABLE `block` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `blocker_id` int(11) unsigned NOT NULL,
  `blockee_id` int(11) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `blocker_id` (`blocker_id`,`blockee_id`),
  KEY `blockee_id` (`blockee_id`,`blocker_id`),
  UNIQUE KEY `blocker_id__blockee_id` (`blocker_id`, `blockee_id`),
  CONSTRAINT `fk__block__blocker_id` FOREIGN KEY (`blocker_id`) REFERENCES `user` (`id`),
  CONSTRAINT `fk__block__blockee_id` FOREIGN KEY (`blockee_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
