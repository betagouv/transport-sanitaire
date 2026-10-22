// La trace du résultat : ce que les textes de R2 lisent (D-111). Une fonction
// pure des réponses et des cibles, sans React.
//
// Elle suit le « Contrat de trace » du README de l'éditeur, moins ce que nous
// ne portons pas : la version du paquet, l'empreinte du modèle et la révision
// (D-104 : une simulation se fait en une fois, sur le modèle chargé à
// l'ouverture). Un fait inconnu est une clé absente, jamais un « non ».

import { Permission } from "../../../../core/models/eligibilite/concepts/permission";
import type { Cibles } from "../../../../core/models/eligibilite/declarations/cibles";
import type { Faits } from "../../../../core/models/eligibilite/declarations/faits";
import type { Questions } from "../../../../core/models/eligibilite/declarations/questions";
import { faits } from "../../../../core/models/eligibilite/preconisation";
import type { GivenAnswers, ValidatedAnswers } from "../../../../core/socle";
import {
  type Precisions,
  precisionsDuResultat,
} from "./precisions-du-resultat";

/** Ce que R2 reçoit du socle : les réponses, les questions validées, les cibles. */
export type ReponsesEtCibles = {
  answers: GivenAnswers<Questions>;
  validated: ValidatedAnswers<Questions>;
  cibles: Cibles;
};

/** Ce que les textes de R2 lisent, pour des réponses et leurs cibles. */
export type Trace = {
  readonly cibles: Cibles;
  /** Les faits tels que les réponses les établissent. */
  readonly faits: Faits;
  /**
   * Les numéros de Q1.2 réellement choisis, tels que les réponses les disent.
   * Vide si Q1.2 ne s'est pas posée (Q1.1 prouve alors qu'elle ne s'applique
   * pas). Jamais refaits depuis `fait_critere_tap`, qui les regroupe.
   */
  readonly criteres: readonly number[];
  /** La réponse à Q2.8.5, si elle est validée. */
  readonly permissionRepeated?: boolean;
  /**
   * Une partie terrestre d'un trajet en ligne régulière est prouvée. Aucune
   * question ne la pose : Q2.3.2 dit la ligne régulière, pas ce qui l'entoure.
   * La clé reste donc absente.
   */
  readonly partieTerrestre?: true;
  readonly precisions: Precisions;
};

/** La trace de ces réponses : elle relit les questions validées. */
export function traceDuResultat({
  answers,
  validated,
  cibles,
}: ReponsesEtCibles): Trace {
  return {
    cibles,
    faits: faits(answers, validated),
    criteres: validated.question("Q1.2").checkedBoxes().map(numeroDuCritere),
    ...repetition(Permission.of(validated)),
    precisions: precisionsDuResultat(validated),
  };
}

// Q2.8.5 dit si la permission se répète. Sans réponse, la clé reste absente.
function repetition(permission: Permission): { permissionRepeated?: boolean } {
  if (permission.estRepetee()) return { permissionRepeated: true };
  if (permission.estUnique()) return { permissionRepeated: false };
  return {};
}

// Le numéro de l'option au catalogue, que porte son identifiant (D-75).
function numeroDuCritere(option: string): number {
  return Number.parseInt(option, 10);
}
