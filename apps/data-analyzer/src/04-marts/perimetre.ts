// Le périmètre d'une cible : ses seules plateformes. On retire des trajets réconciliés
// ceux des autres plateformes, et le référentiel reste entier pour servir de dénominateur.
// Restreindre les marts aux entités que ces plateformes couvrent est l'affaire de chaque
// mart (cf. `seulementCouvertes` dans `MartRatio`).

import type { TrajetReconcilieRow } from "../contrats.ts";

/** `sources` : les labels des plateformes de la cible, tels que `mapping.json` les nomme. */
export function restreindre(
  trajets: TrajetReconcilieRow[],
  sources: Set<string>,
): TrajetReconcilieRow[] {
  return trajets.filter(
    (t) => t.role !== "plateforme" || sources.has(t.source),
  );
}
