# SQL files

`material_calendar.sql` is the output of

```shell
mysqldump material_calendar --compact --no-data > material_calendar.sql
sed -i '' 's/DEFINER=[^*]*\*/\*/g' material_calendar.sql # for MacOS/BSD sed
```

and is intended for bootstrapping a new instance of the project.

## startup script

```shell
mysql < startup.sql
```

For initializing brand new databases. The script creates the database, loads
the bootstrapping sql file, inserts a single admin user, the walk-in project
and connects the admin user to that project.
