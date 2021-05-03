ALTER TABLE `bid_pricing` ADD COLUMN `selected` tinyint(1) NOT NULL DEFAULT 0 AFTER `good_cost`;
ALTER TABLE `bid_pricing` MODIFY `low_schedule` int(2) NOT NULL;
ALTER TABLE `bid_pricing` MODIFY `high_schedule` int(2) NOT NULL;
