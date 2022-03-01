start=${1?arg 1 is start}
end=${2?arg 2 is end}
project_ids=${3?arg 3 is list of project IDs with parens}
mysql booking <<EOF
SELECT
  Location,
  Start,
  End,
  \`Group\`,
  Contact
FROM reservation_info_view
WHERE date(Start) BETWEEN '$start' AND '$end'
AND \`Project Id\` in $project_ids;
EOF
