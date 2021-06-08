#!/bin/bash

if [[ $(uname) == Darwin ]]; then
  mysqldump "${1:?Please use database name as argument}" --compact --no-data > material_calendar.sql
  # MacOS/BSD sed and Linux sed have different options
  sed -i '' 's/DEFINER=[^*]*\*/\*/g' material_calendar.sql
else
  echo "TODO: update this script for $(uname)"
fi