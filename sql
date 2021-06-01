CREATE TABLE `vm_template` (
  `template_name` varchar(40) NOT NULL,
  `vm_item` varchar(50) NOT NULL,
  `cpu` int NOT NULL,
  `storage` int NOT NULL,
  `ram` int NOT NULL,
  `os` varchar(40) NOT NULL
);

PROCEDURE `AddTemplate`(IN `name` VARCHAR(40), IN `id` VARCHAR(50), IN `inCPU` INT(4), IN `inhdd` INT(6), IN `inram` INT(4), IN `inOS` VARCHAR(30)) 
BEGIN 
INSERT INTO vm_template(template_id, template_name,vm_item,cpu,storage,ram,os) 
VALUES(null,name,id,inCPU,inhdd,inram,inOS); 
END

PROCEDURE `UpdateTemplate`(IN `inID` INT, IN `inName` VARCHAR(40), IN `inCPU` INT, IN `inHDD` INT, IN `inRAM` INT, IN `inLib` VARCHAR(50), IN `inOS` VARCHAR(40)) 
BEGIN 
UPDATE vm_template 
SET template_name = inName,vm_item = inlib ,cpu = inCPU, storage = inHDD, ram = inRam, os = inOS WHERE vm_template.template_id = inID; 
END

PROCEDURE `RemoveTemplate`(IN `inID` INT)
BEGIN 
DELETE FROM vm_template WHERE vm_template.template_id = inID; 
END

