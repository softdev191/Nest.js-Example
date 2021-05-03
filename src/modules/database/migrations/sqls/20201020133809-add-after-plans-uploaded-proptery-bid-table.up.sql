ALTER TABLE `bid`
  ADD COLUMN `amep_plan` tinyint(1) DEFAULT 0 AFTER `plansUploaded`,
  ADD COLUMN `m_plan` tinyint(1) DEFAULT 0 AFTER `amep_plan`,
  ADD COLUMN `e_plan` tinyint(1) DEFAULT 0 AFTER `m_plan`,
  ADD COLUMN `p_plan` tinyint(1) DEFAULT 0 AFTER `e_plan`;

ALTER TABLE `project_details` MODIFY  `profit_margin` ENUM('0', '3', '5', '7', '10') NOT NULL;
