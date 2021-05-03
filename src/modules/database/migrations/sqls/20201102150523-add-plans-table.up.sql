CREATE TABLE IF NOT EXISTS `plans` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `bid_id` int(11) unsigned NOT NULL,
  `filename` varchar(1024) DEFAULT NULL,
  `url` varchar(1024) DEFAULT NULL,
  `deleted` tinyint(1) DEFAULT 0,
  `created` datetime DEFAULT NULL,
  `modified` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk__plans__bid_id` FOREIGN KEY (`bid_id`) REFERENCES `bid` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
