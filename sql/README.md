# SQL files

`material_calendar.sql` is the output of

```shell
mysqldump material_calendar --compact --no-data > material_calendar.sql
sed -i '' 's/DEFINER=[^*]*\*/\*/g' material_calendar.sql # for MacOS/BSD sed
```

and is intended for bootstrapping a new instance of the project.

## startup script

```shell
node startup.mjs
```

For initializing brand new databases. The script creates the database, loads
the bootstrapping sql file, and enters a single admin user based on
answers to prompts. Also creates the walk-in project and joins the admin user to
that project.

## JSON data import script

```shell
node read-data.mjs data.json
```

This utility reads JSON files into the database, if JSON files are preferable to SQL files.
See the contents of the script file for JSON file structure.
The script loads the records in the JSON file in parallel.
To load records sequentially, create multiple files and run them in sequence.

```shell
for file in basic-tables.data.json join-tables.data.json; do
  node read-data.mjs "$file"
done
```
