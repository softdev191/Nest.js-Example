-- SQL statements for the UP migration
ALTER TABLE `user`
ADD `deleted` tinyint(1) NOT NULL DEFAULT 0 AFTER `verified`
