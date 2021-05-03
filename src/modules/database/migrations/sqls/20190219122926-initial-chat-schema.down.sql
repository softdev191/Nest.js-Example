-- SQL statements for the DOWN migration
SET foreign_key_checks = 0;
DROP TABLE IF EXISTS room, message, user_room;
SET foreign_key_checks = 1;
