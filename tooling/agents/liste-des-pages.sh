#!/bin/sh
# Imprime les pages Markdown des dossiers donnés, chacune avec son titre. Les
# ADR ont leur propre liste, et le journal des décisions est clos : ni l'un ni
# l'autre n'y figure.
#
# Usage : liste-des-pages.sh <dossier>...

set -eu

if [ "$#" -eq 0 ]; then
  echo "usage : liste-des-pages.sh <dossier>..." >&2
  exit 2
fi

for dossier in "$@"; do
  LC_ALL=C find "$dossier" -name '*.md' -not -path '*/adr/*' | LC_ALL=C sort | while read -r page; do
    titre=$(awk '/^# / { sub(/^# /, ""); print; exit }' "$page")
    printf -- '- `%s` : %s\n' "$page" "$titre"
  done
done
