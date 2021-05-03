CREATE TABLE IF NOT EXISTS `user_detail` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(11) unsigned NOT NULL,
  `first_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `business_name` varchar(255) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `business_type` tinyint(1) DEFAULT NULL,
  `account_type` tinyint(1) DEFAULT NULL,
  `sub_contractor_category` tinyint(1) DEFAULT NULL,
  `sub_contractor_name` varchar(255) DEFAULT NULL,
  `created` datetime DEFAULT CURRENT_TIMESTAMP,
  `modified` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk__user_detail__user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE
  `user`
ADD
  COLUMN `user_detail_id` int(11) unsigned
AFTER
  `modified`;

CREATE TABLE IF NOT EXISTS  `states` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `abbreviation` varchar(5) DEFAULT NULL,
  `name` varchar(32) DEFAULT NULL,
  `created` datetime DEFAULT CURRENT_TIMESTAMP,
  `modified` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `addresses` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `address_line_1` varchar(120) NOT NULL,
  `address_line_2` varchar(120) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state_id` varchar(2) DEFAULT NULL,
  `zip` varchar(16) DEFAULT NULL,
  `created` datetime DEFAULT CURRENT_TIMESTAMP,
  `modified` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `bid` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(11) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `address_id` int(11) unsigned NULL,
  `project_type` tinyint(1) DEFAULT 0,
  `region` tinyint(1) DEFAULT NULL,
  `business_type` tinyint(1) DEFAULT NULL,
  `media_id` int(11) unsigned,
  `plansUploaded` tinyint(1) NOT NULL DEFAULT 0,
  `deleted` tinyint(1) NOT NULL DEFAULT 0,
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk__bid__user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
  CONSTRAINT `fk__bid__address_id` FOREIGN KEY (`address_id`) REFERENCES `addresses` (`id`),
  CONSTRAINT `fk__bid__media_id` FOREIGN KEY (`media_id`) REFERENCES `media` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `project_details`(
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `bid_id` int(11) unsigned NOT NULL,
  `square_foot` int(11) unsigned NOT NULL,
  `profit_margin` ENUM('0', '500', '1000', '1500') NOT NULL,
  `workscope` tinyint(1) DEFAULT NULL,
  `structural` tinyint(1) DEFAULT NULL,
  `building_type` tinyint(1) DEFAULT NULL,
  `floor` ENUM('first', 'second', 'higher') DEFAULT NULL,
  `storefront` ENUM('existing', 'new') DEFAULT NULL,
  `ac_hvac_units` ENUM('existing', 'new') DEFAULT NULL,
  `finishes` tinyint(1) DEFAULT 0,
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk__project_details__bid_id` FOREIGN KEY (`bid_id`) REFERENCES `bid` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
