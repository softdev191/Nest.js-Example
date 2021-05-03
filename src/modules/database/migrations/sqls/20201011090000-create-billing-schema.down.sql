SET
  FOREIGN_KEY_CHECKS = 0;

DROP TABLE `subscriptions`;

DROP TABLE `cards`;

SET
  FOREIGN_KEY_CHECKS = 1;

ALTER TABLE
  `user` DROP COLUMN `billing_status`;
