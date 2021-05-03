-- SQL statements for the UP migration
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