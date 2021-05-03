CREATE TABLE IF NOT EXISTS `estimate_data` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `data` blob DEFAULT NULL,
  `name`  varchar(50) DEFAULT NULL,
  `deleted` tinyint(1) NOT NULL DEFAULT 0,
  `created` datetime DEFAULT CURRENT_TIMESTAMP,
  `modified` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `project_estimates` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `bid_id` int(11) unsigned NOT NULL,
  `division_1` decimal(9,2) NOT NULL,
  `division_2` decimal(9,2) NOT NULL,
  `division_3_4` decimal(9,2) NOT NULL,
  `division_5_7` decimal(9,2) NOT NULL,
  `division_8` decimal(9,2) NOT NULL,
  `division_9` decimal(9,2) NOT NULL,
  `division_10` decimal(9,2) NOT NULL,
  `division_11_12` decimal(9,2) NOT NULL,
  `division_13` decimal(9,2) NOT NULL,
  `division_15` decimal(9,2) NOT NULL,
  `division_15_1` decimal(9,2) NOT NULL,
  `division_16` decimal(9,2) NOT NULL,
  `profit_margin` decimal(9,2) NOT NULL,
  `total_cost` decimal(9,2) NOT NULL,
  `days_to_complete` int(5) unsigned NOT NULL,
  `cost_per_sq` decimal(9,2) NOT NULL,
  `deleted` tinyint(1) NOT NULL DEFAULT 0,
  `created` datetime DEFAULT CURRENT_TIMESTAMP,
  `modified` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `bid`
  ADD COLUMN `estimate_data_id` int(11) unsigned AFTER `name`;

ALTER TABLE `bid` ADD CONSTRAINT `fk__bid__estimate_data_id` FOREIGN KEY (`estimate_data_id`) REFERENCES `estimate_data` (`id`);


