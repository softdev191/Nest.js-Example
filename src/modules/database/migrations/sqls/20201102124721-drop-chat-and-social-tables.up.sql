-- Discard Social/Chat unused tables
SET foreign_key_checks = 0;
DROP TABLE IF EXISTS room, message, user_room;
DROP TABLE IF EXISTS `follow`;
DROP TABLE IF EXISTS `block`;
SET foreign_key_checks = 1;
