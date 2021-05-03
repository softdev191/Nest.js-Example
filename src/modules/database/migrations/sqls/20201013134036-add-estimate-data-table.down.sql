ALTER TABLE `bid`
  DROP FOREIGN KEY `fk__bid__estimate_data_id`,
  DROP COLUMN `estimate_data_id`;

DROP TABLE `estimate_data`;
DROP TABLE `project_estimates`;
