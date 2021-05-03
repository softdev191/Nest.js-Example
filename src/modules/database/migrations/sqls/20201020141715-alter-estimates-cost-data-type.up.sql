ALTER TABLE project_estimates
MODIFY COLUMN division_16 decimal(15,2) NOT NULL,
MODIFY COLUMN profit_margin decimal(15,2) NOT NULL,
MODIFY COLUMN total_cost decimal(15,2) NOT NULL,
MODIFY COLUMN cost_per_sq decimal(15,2) NOT NULL;
