// La première liste de l'écran : les établissements, un trait, « Autre
// établissement », puis les structures. Une seule liste pour trois sortes de
// choix : ce fichier les encode en valeurs d'option, et les décode.

import type { Etablissement, Service } from "../../../shared/referentiel";

export type Choix =
  | { type: "etablissement"; etabId: string }
  | { type: "structure"; serviceId: string }
  | { type: "autre-etablissement" };

type Option = { value: string; label: string; disabled?: boolean };

/** Les options de la liste, dans l'ordre de l'écran. Les listes arrivent triées. */
export function optionsDuChoix(
  etablissements: Etablissement[],
  structures: Service[],
): Option[] {
  return [
    ...etablissements.map((e) => ({ value: `e:${e.id}`, label: e.libelle })),
    SEPARATEUR,
    { value: AUTRE_ETABLISSEMENT, label: "Autre établissement" },
    ...structures.map((s) => ({ value: `s:${s.id}`, label: s.libelle })),
  ];
}

/** Ce que vaut une option choisie. `null` tant que rien n'est choisi. */
export function decoderChoix(valeur: string): Choix | null {
  if (valeur === AUTRE_ETABLISSEMENT) return { type: "autre-etablissement" };
  if (valeur.startsWith("e:")) {
    return { type: "etablissement", etabId: valeur.slice(2) };
  }
  if (valeur.startsWith("s:")) {
    return { type: "structure", serviceId: valeur.slice(2) };
  }
  return null;
}

// ---- implémentation ----

const AUTRE_ETABLISSEMENT = "autre-etablissement";

// Le trait de séparation : une option qu'on ne peut pas choisir.
const SEPARATEUR: Option = {
  value: "separateur",
  label: "──────────",
  disabled: true,
};
