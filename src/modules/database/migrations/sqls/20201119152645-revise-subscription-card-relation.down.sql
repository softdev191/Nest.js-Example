-- SQL statements for the DOWN migration


ALTER TABLE `subscriptions`
  ADD  COLUMN `card_id` int(11) unsigned NOT NULL,
  ADD CONSTRAINT `fk__subscriptions__card_id` FOREIGN KEY (`card_id`) REFERENCES `cards` (`id`);
