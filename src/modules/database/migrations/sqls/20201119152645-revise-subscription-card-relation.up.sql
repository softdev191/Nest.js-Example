-- SQL statements for the UP migration

ALTER TABLE `subscriptions`
  DROP FOREIGN KEY `fk__subscriptions__card_id`,
  DROP COLUMN `card_id`;
