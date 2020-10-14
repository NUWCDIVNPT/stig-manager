ALTER TABLE `user_data` 
DROP COLUMN `display`,
DROP COLUMN `email`,
DROP COLUMN `globalAccess`,
DROP COLUMN `canCreateCollection`,
DROP COLUMN `canAdmin`,
DROP COLUMN `metadata`,
DROP COLUMN `disabled`;

ALTER TABLE `user_data` ADD COLUMN `lastClaims` json DEFAULT ('{}');
