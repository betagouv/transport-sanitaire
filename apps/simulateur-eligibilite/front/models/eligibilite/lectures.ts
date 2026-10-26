// Les noms qu'une partie du résultat (R2) ou du cerfa (R3) déclare lire du
// parcours, et ce qu'elle reçoit une fois déclarés (#196). Les builders de
// chaque partie (`uneRubrique`, `unePrecision`…) s'écrivent sur ces types.

import type { Cibles } from "../../../core/models/eligibilite/declarations/cibles";
import type { Faits } from "../../../core/models/eligibilite/declarations/faits";
import type { Questions } from "../../../core/models/eligibilite/declarations/questions";
import type { DeclaredAnswers } from "../../socle";

/** Une question, un fait ou une cible : ce qu'une partie peut déclarer lire. */
export type Lisible = keyof Questions | keyof Faits | keyof Cibles;

/** Les questions validées que ces noms déclarent. */
export type QuestionsLues<Lus> = DeclaredAnswers<
  Questions,
  Extract<Lus, keyof Questions>
>;

/** Les faits que ces noms déclarent. */
export type FaitsLus<Lus> = Pick<Faits, Extract<Lus, keyof Faits>>;

/** Les cibles que ces noms déclarent. */
export type CiblesLues<Lus> = Pick<Cibles, Extract<Lus, keyof Cibles>>;
