# assumes a sqlfile exists that contains the basic database skeleton
sqlfile=material_calendar.sql
if [[ ! -f $sqlfile ]]; then
  echo "Requires file ($sqlfile) to be in the script's working directory."
  exit 1
fi

# abort script if string is empty
verify() {
  if [[ -z $1 ]]; then { echo "you must answer all the questions"; exit 1; } fi
}

read -rp "username? " user; verify "$user"
read -rp "password? " password; verify "$password"
read -rp "database name? " database; verify "$database"
read -rp "user first name? " first; verify "$first"
read -rp "user last name? " last; verify "$last"
read -rp "user email? " email; verify "$email"

# required by nodejs mysql library when using mysql 8
mysql -e \
  "ALTER USER '$user'@'%' IDENTIFIED WITH mysql_native_password by '$password'"

# create database, input sqlfile
mysql -e "CREATE DATABASE $database"
mysql "$database" < "$sqlfile"
# TODO update sqlfile so these commands are not needed
mysql "$database" -e \
  'ALTER TABLE user CHANGE `created` `created` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP'
mysql "$database" -e \
  'ALTER TABLE user CHANGE `last_login` `last_login` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP'

# create the admin user based on answers to prompts
mysql "$database" -e \
  "insert into user "\
  "(user_id, password, first_name, last_name, email, user_type) "\
  "values ('$user', '$password', '$first', '$last', '$email', 1)"
