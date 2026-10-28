// Des traces écrites à la main pour les tests du résultat du prescripteur : rien
// n'y est prouvé, sauf ce que le test pose. Elles donnent aux cibles et aux faits
// de la trace les seules valeurs qu'une condition des règles lit.

import {
  CIBLES,
  type Cibles,
} from "../../../core/models/eligibilite/declarations/cibles";
import {
  FAITS,
  type Faits,
} from "../../../core/models/eligibilite/declarations/faits";
import { Cible, Fait, Questionnaire, type Value } from "../../../core/socle";
import type { CibleValues } from "../../../core/socle/decision-engine/cible";
import { resultReading } from "../../../core/socle/questionnaire-engine/result-reading";
import type { Precisions } from "../../../front/models/eligibilite/r2/precisions-du-resultat";
import type { Trace } from "../../../front/models/eligibilite/r2/trace-du-resultat";

/** Des valeurs de cibles écrites à la main, telles que les règles les donnent. */
export type ValeursDesCibles = Partial<CibleValues<Cibles>>;

/** Les cibles de ces valeurs. Les autres restent inconnues. */
export const ciblesValant = (valeurs: ValeursDesCibles = {}): Cibles =>
  Object.fromEntries(
    CIBLES.map((nom) => [nom, Cible.of(valeurs[nom])]),
  ) as Cibles;

// Une trace dont rien n'est prouvé, avec ce que le test pose.
const AUCUN_FAIT = Object.fromEntries(
  FAITS.map((fait) => [fait, Fait.inconnu("test")]),
) as Faits;
/**
 * Ce que vaut cette valeur d'un résultat sur ces cibles et ces faits écrits à
 * la main, sans aucune réponse.
 */
export const lu = <Of>(
  value: Value<Of>,
  cibles: ValeursDesCibles,
  faits: Partial<Faits> = {},
): Of =>
  value.in(
    resultReading({
      validated: new Questionnaire([]).readWith({}).validated,
      faits: { ...AUCUN_FAIT, ...faits },
      cibles: ciblesValant(cibles),
      on: new Date(),
    }),
  );

export const vrai = Fait.oui("test");
export const faux = Fait.non("test");

export const trace = (
  cibles: ValeursDesCibles,
  faits: Partial<Faits> = {},
  precisions: Precisions = {},
): Trace => ({
  cibles: ciblesValant(cibles),
  faits: { ...AUCUN_FAIT, ...faits },
  criteres: [],
  precisions,
});
