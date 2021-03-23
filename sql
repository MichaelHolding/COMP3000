CREATE TABLE `comp3000`.`users` ( `username` VARCHAR(40) NOT NULL , `password` VARCHAR(40) NOT NULL ) ENGINE = InnoDB;
ALTER TABLE `users` ADD PRIMARY KEY(`username`);

CREATE TABLE `comp3000`.`actvie_machines` ( `active_machine_id` INT NOT NULL AUTO_INCREMENT , `username` VARCHAR(40) NOT NULL ,
 `vm_type_id` INT NOT NULL , PRIMARY KEY (`active_machine_id`)) ENGINE = InnoDB;

ALTER TABLE `actvie_machines` ADD CONSTRAINT `FK_vm_ID` FOREIGN KEY (`vm_type_id`) REFERENCES `vm_type`(`vm_type_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE `actvie_machines` ADD CONSTRAINT `FK_username` FOREIGN KEY (`username`) REFERENCES `users`(`username`) ON DELETE NO ACTION ON UPDATE NO ACTION;

CREATE TABLE `comp3000`.`vm_type` ( `vm_type_id` INT NOT NULL AUTO_INCREMENT , `vm_name` VARCHAR(25) NOT NULL , `vm_hdd` INT NOT NULL ,
 `vm_cpus` INT NOT NULL , `vm_ram` INT NOT NULL , PRIMARY KEY (`vm_type_id`)) ENGINE = InnoDB;
