#!/bin/sh
# Imprime le corps d'une section H2 d'un fichier Markdown, sans son titre.
# Sert aux sections « Commandes » des README, reprises dans les AGENTS.md
# générés (voir ADR-0011). Un bloc de code n'ouvre ni ne ferme une section.
#
# Usage : section.sh <fichier> <titre>

set -eu

if [ "$#" -ne 2 ]; then
  echo "usage : section.sh <fichier> <titre>" >&2
  exit 2
fi

corps=$(awk -v titre="$2" '
  /^(```|~~~)/ { fence = !fence }
  !fence && /^## / {
    dedans = ($0 == "## " titre)
    next
  }
  dedans { print }
' "$1")

if [ -z "$(printf '%s' "$corps" | tr -d '[:space:]')" ]; then
  echo "section.sh : la section « $2 » est absente ou vide dans $1" >&2
  exit 1
fi

# Retire les lignes vides de tête et de queue.
printf '%s\n' "$corps" | awk '
  !NF && !debut { next }
  { debut = 1 }
  !NF { tampon = tampon "\n"; next }
  { printf "%s%s\n", tampon, $0; tampon = "" }
'
