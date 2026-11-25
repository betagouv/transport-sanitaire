// La première liste de l'écran : les établissements, un trait, « Autre
// établissement », puis les structures. Une seule liste pour trois sortes de
// choix : ce fichier les encode en valeurs d'option, et les décode.

import type { Etablissement, Service } from "../../../shared/referentiel.port";

export type Choix =
  | { type: "etablissement"; etabId: string }
  | { type: "structure"; serviceId: string }
  | { type: "autre-etablissement" };

type Option = { value: string; label: string; disabled?: boolean };

export class ChoixService {
  /** Les options de la liste, dans l'ordre de l'écran. Les listes arrivent triées. */
  static optionsDuChoix(
    etablissements: Etablissement[],
    structures: Service[],
  ): Option[] {
    return [
      ...etablissements.map((e) => ({ value: `e:${e.id}`, label: e.libelle })),
      ChoixService.#SEPARATEUR,
      {
        value: ChoixService.#AUTRE_ETABLISSEMENT,
        label: "Autre établissement",
      },
      ...structures.map((s) => ({ value: `s:${s.id}`, label: s.libelle })),
    ];
  }

  /** Ce que vaut une option choisie. `null` tant que rien n'est choisi. */
  static decoderChoix(valeur: string): Choix | null {
    if (valeur === ChoixService.#AUTRE_ETABLISSEMENT) {
      return { type: "autre-etablissement" };
    }
    if (valeur.startsWith("e:")) {
      return { type: "etablissement", etabId: valeur.slice(2) };
    }
    if (valeur.startsWith("s:")) {
      return { type: "structure", serviceId: valeur.slice(2) };
    }
    return null;
  }

  static readonly #AUTRE_ETABLISSEMENT = "autre-etablissement";

  // Le trait de séparation : une option qu'on ne peut pas choisir.
  static readonly #SEPARATEUR: Option = {
    value: "separateur",
    label: "──────────",
    disabled: true,
  };
}
