#!/bin/sh
# Imprime le nom et la description de chaque skill, lus dans l'en-tête de son
# SKILL.md.
#
# Usage : liste-des-skills.sh <dossier des skills>

set -eu

if [ "$#" -ne 1 ]; then
  echo "usage : liste-des-skills.sh <dossier des skills>" >&2
  exit 2
fi

LC_ALL=C find "$1" -name SKILL.md | LC_ALL=C sort | while read -r skill; do
  awk -v chemin="$skill" '
    /^---$/ { barres++; next }
    barres == 1 && /^name: / { nom = substr($0, 7) }
    barres == 1 && /^description: / { description = substr($0, 14) }
    END { printf "- `%s` (`%s`) : %s\n", nom, chemin, description }
  ' "$skill"
done
