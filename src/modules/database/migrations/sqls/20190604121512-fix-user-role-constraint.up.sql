-- SQL statements for the UP migration

ALTER TABLE `user_role` DROP FOREIGN KEY `fk__user_role__user_id`;
ALTER TABLE `user_role` ADD CONSTRAINT `fk__user_role__user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
