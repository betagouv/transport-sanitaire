// Le périmètre d'une cible : ses seules plateformes. On retire des trajets réconciliés
// ceux des autres plateformes, et le référentiel reste entier pour servir de dénominateur.
// Restreindre les marts aux entités que ces plateformes couvrent est l'affaire de chaque
// mart (cf. `seulementCouvertes` dans `MartRatio`).
//
// Une cible qui réunit **toutes** les plateformes n'est pas restreinte : elle reçoit le
// périmètre complet, celui du document interne, dans son propre document.

import type { TrajetReconcilieRow } from "../contrats.ts";
import type { MappingEntry } from "../types.ts";

/**
 * Les labels des plateformes auxquelles une cible est restreinte, d'après `mapping.json`.
 * `undefined` s'il n'y a pas de restriction : pas de cible, ou une cible qui les réunit
 * toutes.
 */
export function restriction(
  mapping: MappingEntry[],
  cible: string,
): Set<string> | undefined {
  if (!cible) return undefined;
  const plateformes = mapping.filter((e) => e.role === "plateforme");
  const sources = plateformes.filter((e) => e.cibles.includes(cible));
  if (sources.length === 0)
    throw new Error(
      `Aucune plateforme de mapping.json ne déclare la cible « ${cible} ». ` +
        `Ajoutez-la au champ "cibles" des plateformes qu'elle doit contenir.`,
    );
  if (sources.length === plateformes.length) return undefined;
  return new Set(sources.map((e) => e.label));
}

/** `sources` : les labels des plateformes de la cible, tels que `mapping.json` les nomme. */
export function restreindre(
  trajets: TrajetReconcilieRow[],
  sources: Set<string>,
): TrajetReconcilieRow[] {
  return trajets.filter(
    (t) => t.role !== "plateforme" || sources.has(t.source),
  );
}
