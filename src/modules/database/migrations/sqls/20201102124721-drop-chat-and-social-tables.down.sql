-- SQL statements for the UP migration -- repeat of "20190219122926-initial-chat-schema.up.sql"

CREATE TABLE `follow` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `follower_id` int(11) unsigned NOT NULL,
  `followee_id` int(11) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `follower_id` (`follower_id`,`followee_id`),
  KEY `followee_id` (`followee_id`,`follower_id`),
  UNIQUE KEY `follower_id__followee_id` (`follower_id`, `followee_id`),
  CONSTRAINT `fk__follow__follower_id` FOREIGN KEY (`follower_id`) REFERENCES `user` (`id`),
  CONSTRAINT `fk__follow__followee_id` FOREIGN KEY (`followee_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `block` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `blocker_id` int(11) unsigned NOT NULL,
  `blockee_id` int(11) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `blocker_id` (`blocker_id`,`blockee_id`),
  KEY `blockee_id` (`blockee_id`,`blocker_id`),
  UNIQUE KEY `blocker_id__blockee_id` (`blocker_id`, `blockee_id`),
  CONSTRAINT `fk__block__blocker_id` FOREIGN KEY (`blocker_id`) REFERENCES `user` (`id`),
  CONSTRAINT `fk__block__blockee_id` FOREIGN KEY (`blockee_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE room (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(32) NOT NULL,
  description TEXT
);

CREATE TABLE message (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  message TEXT NOT NULL,
  created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  room_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  INDEX fk_message_room1_idx (room_id),
  INDEX fk_message_user1_idx (user_id),
  CONSTRAINT fk_message_room1
    FOREIGN KEY (room_id)
    REFERENCES room (id),
  CONSTRAINT fk_message_user1
    FOREIGN KEY (user_id)
    REFERENCES user (id)
);

CREATE TABLE user_room (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  last_read_message INT UNSIGNED,
  room_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  INDEX fk_user_room_message_idx (last_read_message),
  INDEX fk_user_room_room1_idx (room_id),
  INDEX fk_user_room_user1_idx (user_id),
  UNIQUE KEY room_member (room_id, user_id),
  CONSTRAINT fk_user_room_message
    FOREIGN KEY (last_read_message)
    REFERENCES message (id),
  CONSTRAINT fk_user_room_room1
    FOREIGN KEY (room_id)
    REFERENCES room (id),
  CONSTRAINT fk_user_room_user1
    FOREIGN KEy (user_id)
    REFERENCES user (id)
);
