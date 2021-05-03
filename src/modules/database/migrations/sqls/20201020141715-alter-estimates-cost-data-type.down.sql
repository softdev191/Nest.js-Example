ALTER TABLE project_estimates
MODIFY COLUMN division_16 decimal(9,2) NOT NULL,
MODIFY COLUMN profit_margin decimal(9,2) NOT NULL
MODIFY COLUMN total_cost decimal(9,2) NOT NULL,
MODIFY COLUMN cost_per_sq decimal(9,2) NOT NULL;
