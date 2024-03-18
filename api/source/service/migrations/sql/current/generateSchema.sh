#!/bin/bash



static_data_tables="result status _migrations"
mysqldump -h 127.0.0.1 -P 50001 -u root -prootpw --no-data --no-create-db stigman | sed --expression='s/ AUTO_INCREMENT=[0-9]\+//' > 10-stigman-tables.sql
mysqldump -h 127.0.0.1 -P 50001 -u root -prootpw --no-create-info stigman $static_data_tables > 20-stigman-static.sql
