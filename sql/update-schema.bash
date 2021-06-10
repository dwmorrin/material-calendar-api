#!/bin/bash

o=material_calendar.sql
mysqldump "${1:?Please use database name as argument}" --compact --no-data > "$o"
t1=tmpfile1
t2=tmpfile2
# not using `sed -i` due to non-portability
sed 's/DEFINER=[^*]*\*/\*/g' "$o" >"$t1"
# wrap output in these SQL commands to disable foreign key checks during import
# this avoid a ERROR 1824 from tables needing to reference foreign keys before they are created
{
  echo "SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS;"
  echo "SET FOREIGN_KEY_CHECKS = 0;"
  cat "$t1"
} >"$t2"
echo "SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;" >>"$t2"
mv -f "$t2" "$o"
rm -f "$t1"