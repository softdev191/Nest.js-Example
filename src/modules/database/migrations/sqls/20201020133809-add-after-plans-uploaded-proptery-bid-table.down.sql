ALTER TABLE `project_details` MODIFY  `profit_margin` ENUM('0', '500', '1000', '1500') NOT NULL;

ALTER TABLE `bid`
  DROP COLUMN `amep_plan`,
  DROP COLUMN `m_plan`,
  DROP COLUMN `e_plan`,
  DROP COLUMN `p_plan`;
