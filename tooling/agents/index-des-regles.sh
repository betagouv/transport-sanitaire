#!/bin/sh
# Imprime l'index (le tableau « Id, Règle, Garde » de tête) de chaque recueil de
# règles donné, avec le chemin du fichier à lire. Les règles retirées, barrées,
# n'y figurent pas. Le texte des règles reste dans le recueil.
#
# Usage : index-des-regles.sh <recueil.md>...

set -eu

if [ "$#" -eq 0 ]; then
  echo "usage : index-des-regles.sh <recueil.md>..." >&2
  exit 2
fi

premier=1
for recueil in "$@"; do
  [ "$premier" -eq 1 ] || echo
  premier=0
  titre=$(awk '/^# / { sub(/^# /, ""); print; exit }' "$recueil")
  printf '### %s\n\nÀ lire : `%s`\n\n' "$titre" "$recueil"
  awk '
    /^\| Id / { dedans = 1 }
    dedans && !/^\|/ { exit }
    dedans && !/~~/ { print }
  ' "$recueil"
done
