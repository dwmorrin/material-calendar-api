# SQL files

`material_calendar.sql` is the output of

```shell
mysqldump material_calendar --compact --no-data
```

and is intended for bootstrapping a new instance of the project.

## startup script
For initializing brand new databases.  The script creates the database, loads
the bootstrapping sql file, and enters a single admin user based on
answers to prompts.

## upgrade-only directory

These files are only of interest for the initial development test database.
This directory will probably be deleted in a future commit.
