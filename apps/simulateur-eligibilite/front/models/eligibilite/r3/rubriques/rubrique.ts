// Une rubrique : des cellules que plusieurs cerfa partagent, et le calcul de
// chacune. Elle ne connaît aucun gabarit. Chaque cerfa prend les rubriques
// qu'il a, en tout ou en partie, et dit dans quel champ va chaque cellule : un
// cerfa qui change ou disparaît ne touche ni les rubriques ni les autres.
//
// Une cellule porte le nom que lui donne l'éditeur (`mapping_documents.json`).
// Une case vaut `true` cochée. Une valeur inconnue vaut `undefined` et laisse
// sa cellule vide : elle ne coche jamais « Non ».
//
// Une rubrique déclare ce qu'elle lit (#196) :
// `uneRubrique("Accident").lit("Q3.6.2", "Q3.6.3").cellules({…})`. Ses
// cellules ne reçoivent que ces questions, ces faits et ces cibles. Elle lit
// les questions validées : une réponse restée d'une question qui ne se pose
// plus, après un retour en arrière, ne s'écrit pas.

import type { Cibles } from "../../../../../core/models/eligibilite/declarations/cibles";
import type { Faits } from "../../../../../core/models/eligibilite/declarations/faits";
import type { Questions } from "../../../../../core/models/eligibilite/declarations/questions";
import { type CerfaInput, DeclaredReads } from "../../../../socle";
import type {
  CiblesLues,
  FaitsLus,
  Lisible,
  QuestionsLues,
} from "../../lectures";

/** Ce que le simulateur sait au moment de remplir le cerfa. */
export type Donnees = CerfaInput<Questions, Faits, Cibles>;

/** Ce que reçoit une cellule d'une rubrique qui déclare lire `Lus`. */
export type Lues<Lus extends Lisible> = {
  readonly validated: QuestionsLues<Lus>;
  readonly faits: FaitsLus<Lus>;
  readonly cibles: CiblesLues<Lus>;
  // Hors de `lit` : une date de validation, pas une réponse.
  readonly completedAt: Date;
};

/** Le calcul de chaque cellule, sur ce que la rubrique déclare lire. */
export type Calculs<Cellules, Lus extends Lisible> = {
  readonly [Cellule in keyof Cellules]-?: (
    lues: Lues<Lus>,
  ) => Cellules[Cellule];
};

/** Une rubrique : son nom, ce qu'elle lit, et ses cellules. */
export type Rubrique<Cellules, Lus extends Lisible = Lisible> = {
  readonly nom: string;
  readonly lit: readonly Lus[];
  readonly cellules: Calculs<Cellules, Lus>;
};

/** Une rubrique, nommée pour les erreurs de lecture. */
export function uneRubrique(nom: string) {
  return {
    lit: <const Lus extends readonly Lisible[]>(...lus: Lus) => ({
      cellules: <Cellules>(
        calculs: Calculs<Cellules, Lus[number]>,
      ): Rubrique<Cellules, Lus[number]> => {
        const lecteur = new DeclaredReads(`La rubrique « ${nom} »`, lus);
        return { nom, lit: lecteur.reads, cellules: gardees(lecteur, calculs) };
      },
    }),
  };
}

// ---- implémentation ----

// Chaque calcul reçoit ce que la rubrique déclare, et rien d'autre.
function gardees<Cellules, Lus extends Lisible>(
  lecteur: DeclaredReads<Lus>,
  calculs: Calculs<Cellules, Lus>,
): Calculs<Cellules, Lus> {
  const lire = (lues: Lues<Lus>): Lues<Lus> => ({
    validated: lecteur.answers(lues.validated),
    faits: lecteur.record(lues.faits),
    cibles: lecteur.record(lues.cibles),
    completedAt: lues.completedAt,
  });
  return Object.fromEntries(
    Object.entries(calculs).map(([cellule, calcul]) => [
      cellule,
      (lues: Lues<Lus>) => (calcul as (lues: Lues<Lus>) => unknown)(lire(lues)),
    ]),
  ) as Calculs<Cellules, Lus>;
}
