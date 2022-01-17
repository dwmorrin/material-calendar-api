/*
 * This is a template file for starting a new SQL database.
 * Use the startup.js script in the project root to run this file.
 * The startup script will read from the .env file to set the {{placeholders}}.
 */

DROP DATABASE IF EXISTS {{MYSQL_DATABASE}};
CREATE DATABASE {{MYSQL_DATABASE}};
USE {{MYSQL_DATABASE}};
SOURCE sql/material_calendar.sql; -- This is the SQL file that contains the schema

/* Inserting minimal needed data for app to startup. */

INSERT INTO user SET
  user_id = '{{AUTH_ID}}',
  restriction = 1000,
  password = AES_ENCRYPT('{{ADMIN_PASSWORD}}', UNHEX(SHA2('{{MYSQL_SHA2_PASSPHRASE}}', 512))),
  first_name = '{{ADMIN_FIRST_NAME}}',
  last_name = '{{ADMIN_LAST_NAME}}',
  email = '{{EMAIL_FROM}}';

INSERT INTO role (title) VALUES ('admin'), ('user');

INSERT INTO user_role (user_id, role_id) VALUES (1, 1);

INSERT INTO semester SET
  title = '{{SEMESTER_TITLE}}',
  start = '{{SEMESTER_START}}',
  end = '{{SEMESTER_END}}';

INSERT INTO active_semester SET semester_id = 1;

INSERT INTO course SET
  title = 'Walk-in',
  catalog_id = 'N/A';

INSERT INTO section SET
  course_id = 1,
  title = 'Walk-in';

INSERT INTO project SET
  title = "Walk-in",
  group_hours = 999,
  open = 1,
  book_start = '2000-01-01',
  start = '2000-01-01',
  end = '9999-12-31',
  group_size = 1;

INSERT INTO section_project SET
  section_id = 1,
  project_id = 1;

INSERT INTO roster SET
  user_id = 1,
  course_id = 1,
  section_id = 1,
  semester_id = 1;

INSERT INTO project_group SET
  title = '{{ADMIN_FIRST_NAME}} {{ADMIN_LAST_NAME}} Walk-in',
  project_id = 1,
  creator_id = 1,
  admin_approved_id = 1,
  pending = FALSE;

INSERT INTO project_group_user SET
  user_id = 1,
  project_group_id = 1,
  invitation_accepted = TRUE;