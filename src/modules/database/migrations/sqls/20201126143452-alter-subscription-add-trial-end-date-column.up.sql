ALTER TABLE `subscriptions`
  ADD  COLUMN `trial_end_date` datetime DEFAULT NULL AFTER `exp_date`;
