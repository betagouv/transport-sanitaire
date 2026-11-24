#!/bin/sh
# Imprime le dossier d'ADR donné et les noms de ses fichiers, sans extension.
# Le nom dit la décision : le contenu n'est pas lu. Le journal des décisions de
# la v10, clos, n'est pas un ADR.
#
# Usage : liste-des-adr.sh <dossier>

set -eu

if [ "$#" -ne 1 ]; then
  echo "usage : liste-des-adr.sh <dossier>" >&2
  exit 2
fi

printf 'Dossier : `%s`\n\n' "$1"
LC_ALL=C find "$1" -maxdepth 1 -name '[0-9]*.md' | LC_ALL=C sort | while read -r fichier; do
  nom=$(basename "$fichier" .md)
  printf -- '- `%s`\n' "$nom"
done
