# MySQL SQL scripts

The files in the `init` directory (e.g., `10-stigman-schema.sql`, `30-stigman-data.sql`) are appropriate for use with the [official MySQL 8 image](https://hub.docker.com/_/mysql).

Example Docker command:
```
$ docker run --name some-mysql -v /my/own/initdir:/docker-entrypoint-initdb.d -e MYSQL_ROOT_PASSWORD=my-secret-pw -p 3306:3306 -d mysql:8.0
```

