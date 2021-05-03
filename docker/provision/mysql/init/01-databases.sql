CREATE DATABASE bidvita;
CREATE USER 'bidvita'@'%' IDENTIFIED BY 'bidvita123!';
GRANT ALL PRIVILEGES ON bidvita.* to 'bidvita'@'%';
CREATE DATABASE bidvita_test;
GRANT ALL PRIVILEGES ON bidvita_test.* to 'bidvita'@'%';
