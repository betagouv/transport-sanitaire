// P3 : les informations qui complètent le cerfa, après le verrou. Elle ne
// décide plus : ses réponses ne touchent ni aux faits ni aux cibles de R2.
//
// Chaque question ne se pose que si le support de l'issue, figé au verrou, la
// réclame (`CATALOGUE_COMPLET_QUESTIONS.md`, « Partie 3 »).

import { page, type QuestionnairePart } from "../../../socle/index.ts";
import type { Cibles } from "../declarations/cibles.ts";
import type { Questions } from "../declarations/questions.ts";
import { questionDuComplement as question } from "../question.ts";
import {
  PAGE_DE_L_EXONERATION,
  PAGE_DES_EVENEMENTS,
} from "./pages-des-evenements.ts";
import { PAGE_DE_L_ARRIVEE, PAGE_DU_DEPART } from "./pages-des-lieux.ts";
import { PAGE_DE_L_URGENCE, PAGE_DU_SOIN } from "./pages-du-soin.ts";
import {
  ALLER_RETOUR_D_UN_TRANSPORT,
  allerRetourDUnSeulTransport,
  frequenceDepassee,
  rappelDesPermissions,
  sensAPoser,
  sensCompatible,
  trajetsAuDelaDeLaFrequence,
  trajetsMensuelsAPoser,
} from "./sens-du-trajet.ts";
import { pmtOuDap } from "./supports-du-complement.ts";

type Partie = QuestionnairePart<Questions, Cibles>;

// Q3.1 : les transports de ce document. La PMT et la DAP demandent leur nombre
// et leur sens. Le S3141 reprend dates et fréquence de Q2.8. Plusieurs
// permissions ne demandent que le nombre mensuel de trajets, une seule son
// sens (D-120). Ce nombre ne recalcule pas la série de P2.
const PAGE_DU_TRAJET = page(
  "P3/trajet",
  question
    .number("Q3.1.1", "Combien de transports faut-il prescrire ?")
    .hint(
      "Ceux de ce document seulement : deux documents de deux transports peuvent former une série de quatre.",
    )
    .integer()
    .min(1)
    .unit("transport(s)")
    .askedIf(({ cibles }) => pmtOuDap(cibles)),
  question
    .singleChoice("Q3.1.2", "Comment ces transports sont-ils organisés ?")
    .askedIf(sensAPoser)
    .inconsistentIf(allerRetourDUnSeulTransport, ALLER_RETOUR_D_UN_TRANSPORT)
    .option("1_ALLER", (option) =>
      option.offeredIf(({ answers }) => sensCompatible("1_ALLER", answers)),
    )
    .option("2_RETOUR", (option) =>
      option.offeredIf(({ answers }) => sensCompatible("2_RETOUR", answers)),
    )
    .option("3_ALLER_RETOUR_EQUIVALENT", (option) =>
      option.offeredIf(({ answers }) =>
        sensCompatible("3_ALLER_RETOUR_EQUIVALENT", answers),
      ),
    )
    .option("4_ALLER_RETOUR_DIFFERENT", (option) =>
      option.blocks(
        "Ces deux trajets nécessitent deux simulations distinctes. Choisissez ici le sens déjà évalué, puis faites une autre simulation pour l’autre sens.",
      ),
    ),
  question
    .number("Q3.1.3", "Combien de trajets faut-il prescrire par mois ?")
    .hint("Chaque permission est un aller-retour : elle compte deux trajets.")
    .integer()
    .min(1)
    .unit("trajet(s) par mois")
    .askedIf(trajetsMensuelsAPoser)
    .reminderFrom(rappelDesPermissions)
    .inconsistentIf(trajetsAuDelaDeLaFrequence, frequenceDepassee),
);

/** P3, posée après le verrou : elle complète le cerfa, elle ne décide plus. */
export const COMPLEMENT: Partie = {
  id: "P3",
  title: "Informations permettant de compléter la prescription",
  pages: [
    PAGE_DU_TRAJET,
    PAGE_DU_DEPART,
    PAGE_DE_L_ARRIVEE,
    PAGE_DU_SOIN,
    PAGE_DE_L_URGENCE,
    PAGE_DES_EVENEMENTS,
    PAGE_DE_L_EXONERATION,
  ],
};
