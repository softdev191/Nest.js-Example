ALTER TABLE `project_estimates`
  ADD COLUMN `total_inspections` int(2) NOT NULL DEFAULT 0 AFTER `cost_per_sq`,
  ADD COLUMN `rough_inspections` int(2) NOT NULL DEFAULT 0 AFTER `total_inspections`,
  ADD COLUMN `final_inspections` int(2) NOT NULL DEFAULT 0 AFTER `rough_inspections`,
  ADD COLUMN `grease_duct_inspections` int(2) NOT NULL DEFAULT 0 AFTER `final_inspections`,
  ADD COLUMN `pre_health_inspections` int(2) NOT NULL DEFAULT 0 AFTER `grease_duct_inspections`,
  ADD COLUMN `final_bldg_inspections` int(2) NOT NULL DEFAULT 0 AFTER `pre_health_inspections`,
  ADD COLUMN `fire_dept_inspections` int(2) NOT NULL DEFAULT 0 AFTER `final_bldg_inspections`,
  ADD COLUMN `final_health_inspections` int(2) NOT NULL DEFAULT 0 AFTER `fire_dept_inspections`;
