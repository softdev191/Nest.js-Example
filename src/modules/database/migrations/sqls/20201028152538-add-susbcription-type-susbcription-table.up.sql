ALTER TABLE `subscriptions`
  ADD COLUMN `type` tinyint(1) NOT NULL DEFAULT 0 AFTER `card_id`,
  ADD COLUMN `exp_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `type`;
