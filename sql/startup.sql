/*
 * This is a template file for starting a new SQL database.
 * Replace all strings with curly braces with your own values.
 */

DROP DATABASE IF EXISTS {database};
CREATE DATABASE {database};
USE {database};
SOURCE material_calendar.sql; -- This is the SQL file that contains the schema

/* Inserting minimal needed data for app to startup. */

INSERT INTO user SET
  user_id = '{user}',
  first_name = '{first}',
  last_name = '{last}',
  email = '{email}';

INSERT INTO role (title) VALUES ('admin'), ('user');

INSERT INTO user_role (user_id, role_id) VALUES (1, 1);

INSERT INTO semester SET
  title = '{semester}',
  start = '{start}',
  end = '{end}';

INSERT INTO active_semester SET semester_id = 1;

INSERT INTO project SET
  title = "Walk-in",
  group_hours = 999,
  open = 1,
  start = '2000-01-01',
  end = '9999-12-31',
  group_size = 1;

INSERT INTO rm_group SET
  name = '{first} {last}',
  project_id = 1,
  status = 1,
  group_size = 1;

INSERT INTO student_group SET student_id = 1, group_id = 1;