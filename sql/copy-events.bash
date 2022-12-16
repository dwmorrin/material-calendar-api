getLocationIdByTitle() {
mysql -sN booking <<EOF
SELECT id FROM location WHERE title like '$1%';
EOF
}

isSQLDate() {
  if [[ $1 =~ ^20[0-9]{2}-[0-1][0-9]-[0-3][0-9]$ ]]; then
    return
  fi
  if [[ $1 =~ ^20[0-9]{2}-[0-1][0-9]-[0-3][0-9]\ [0-9]{2}:[0-9]{2}:[0-9]{2}$ ]]; then
    return
  fi
  echo "bad SQL date: $1. use yyyy-mm-dd or yyyy-mm-dd MM:HH:SS format."
  exit 1
}

read -rp "Source location: " srcLocationTitle
srcLocationId="$(getLocationIdByTitle "$srcLocationTitle")"

if [[ ! $srcLocationId ]]; then
  echo "No location starts with: $srcLocationTitle"
  mysql booking -e 'SELECT id, title FROM location'
  exit 1
fi

read -rp "Destination location: " destLocationTitle
destLocationId="$(getLocationIdByTitle "$destLocationTitle")"

if [[ ! $destLocationId ]]; then
  echo "No location starts with: $destLocationTitle"
  mysql booking -e 'SELECT id, title FROM location'
  exit 1
fi

read -rp "Source start on or after: " start
isSQLDate "$start"

read -rp "and end on or before: " end
isSQLDate "$end"

printf "Destination offset (days): "
read -r offset
if [[ ! $offset =~ ^[0-9]+$ ]]; then
  echo "offset needs to be a number"
  exit 1
fi

printf "Destination repeat (days): "
read -r repeat
if [[ ! $repeat =~ ^[0-9]+$ ]]; then
  echo "repeat needs to be a number"
  exit 1
fi

srcTableSQL=$(cat <<EOF
SELECT * FROM event
WHERE location_id = $srcLocationId
AND start >= '$start'
AND end <= '$end'
ORDER BY start;
EOF
)

echo
mysql booking <<<"$srcTableSQL"
echo

read -rp "Review the source table results and enter y to continue "
if [[ $REPLY != y ]]; then
  echo "aborted!"
  exit 1
fi

tableName="temp$$"
finalSQL=$(cat <<EOF
CREATE TEMPORARY TABLE $tableName
$srcTableSQL

EOF
)

for ((i=0; i < repeat; ++i)); do
  days=$((offset + i))
  finalSQL+=$(cat <<EOF
INSERT INTO event (location_id, description, bookable, start, end)
SELECT
  $destLocationId,
  description,
  bookable,
  ADDDATE(start, $days),
  ADDDATE(end, $days)
FROM $tableName;

EOF
)
done

echo "$finalSQL"
echo
read -rp "Review the generated SQL and enter y to continue "
if [[ $REPLY != y ]]; then
  echo "aborted!"
  exit 1
fi

mysql booking <<<"$finalSQL"

