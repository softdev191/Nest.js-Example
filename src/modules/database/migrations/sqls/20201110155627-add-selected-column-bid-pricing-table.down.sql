ALTER TABLE `bid_pricing` MODIFY `low_schedule` decimal(15,2) NOT NULL;
ALTER TABLE `bid_pricing` MODIFY `high_schedule` decimal(15,2) NOT NULL;
ALTER TABLE `bid_pricing` DROP COLUMN `selected`;
