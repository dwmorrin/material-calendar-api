#!/bin/bash

# should replace current database with one downloaded from the production server
# for testing a snapshot of the production database locally

db_name=${1:?Please use database name as argument}
dump_file=${2:?Please use dump file as argument}

if [[ ! -f "$dump_file" ]]; then
  echo "File $dump_file does not exist"
  exit 1
fi

# removing definer lines in case user names are different
tmp_dump_file=tmp_dump_file

grep -v 'DEFINER' "$dump_file" >"$tmp_dump_file"

cast_to_bool_file="./cast_to_bool.sql"

if [[ ! -f "$cast_to_bool_file" ]]; then
  echo "File $cast_to_bool_file does not exist "\
       "(expected to be in the same directory as this script)"
  exit 1
fi

mysql -e "DROP DATABASE IF EXISTS $db_name"
mysql -e "CREATE DATABASE $db_name"

# if we can get the dumps to include this function, this can be removed
mysql "$db_name" < "./cast_to_bool.sql"

mysql "$db_name" < "$tmp_dump_file"

rm -f "$tmp_dump_file"