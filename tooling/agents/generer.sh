#!/bin/sh
# Régénère les quatre AGENTS.md depuis leurs sources (ADR-0011). Chaque dossier
# a son agent-smith.toml. L'outil vient de `mise.toml`, version comprise.
#
# Usage : generer.sh

set -eu

racine=$(cd "$(dirname "$0")/../.." && pwd)

if ! command -v agent-smith >/dev/null 2>&1; then
  echo "agent-smith est absent : lance 'tsp setup', qui installe le toolchain de mise.toml." >&2
  exit 1
fi

for dossier in . apps/simulateur-eligibilite apps/datahub apps/cli; do
  (cd "$racine/$dossier" && agent-smith)
done
