CREATE TABLE `bid_pricing` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `bid_id` int(11) unsigned NOT NULL,
  `low_cost` decimal(15,2) NOT NULL,
  `low_schedule` decimal(15,2) NOT NULL,
  `high_cost` decimal(15,2) NOT NULL,
  `high_schedule` decimal(15,2) NOT NULL,
  `good_cost` decimal(15,2) NOT NULL,
  `deleted` tinyint(1) NOT NULL DEFAULT 0,
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk__bid_pricing__bid_id` FOREIGN KEY (`bid_id`) REFERENCES `bid` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
