// P3 : les informations qui complètent le cerfa, après le verrou. Elle ne
// décide plus : ses réponses ne touchent ni aux faits ni aux cibles de R2.
//
// Chaque question ne se pose que si le support de l'issue, figé au verrou, la
// réclame (`CATALOGUE_COMPLET_QUESTIONS.md`, « Partie 3 »).

import {
  afterLock,
  page,
  type QuestionnairePart,
} from "../../../socle/index.ts";
import type { Cibles } from "../declarations/cibles.ts";
import type { Questions } from "../declarations/questions.ts";
import { question } from "../question.ts";
import { PAGE_DE_LA_MATERNITE } from "./page-de-la-maternite.ts";
import {
  PAGE_DE_L_EXONERATION,
  PAGE_DES_EVENEMENTS,
} from "./pages-des-evenements.ts";
import { PAGE_DE_L_ARRIVEE, PAGE_DU_DEPART } from "./pages-des-lieux.ts";
import { PAGE_DE_L_URGENCE, PAGE_DU_SOIN } from "./pages-du-soin.ts";
import {
  aideDuSens,
  desTrajetsAuDelaDeLaFrequence,
  desTrajetsMensuelsAPoser,
  FREQUENCE_DEPASSEE,
  quantiteDuSens,
  rappelDesPermissions,
  SENS_COMPATIBLES,
  uneQuantiteAPoser,
  unSensAPoser,
} from "./sens-du-trajet.ts";

type Partie = QuestionnairePart<Questions, Cibles>;

// Q3.1 : les trajets de ce document. Le sens vient d'abord, puis le nombre,
// que le sens dit en allers simples, retours simples ou allers-retours. Le
// S3141 reprend la fréquence de Q2.8. Plusieurs permissions ne demandent que
// le nombre mensuel d'allers-retours, une seule son sens (D-120, D-246). Ce
// nombre ne recalcule pas la série de P2.
const PAGE_DU_TRAJET = page(
  "P3/trajet",
  question
    .singleChoice(
      "Q3.1.2",
      "Quel trajet cette prescription doit-elle couvrir ?",
    )
    .mattersWhile(unSensAPoser)
    .option("1_ALLER", (option) =>
      option.offeredWhen(SENS_COMPATIBLES["1_ALLER"]),
    )
    .option("2_RETOUR", (option) =>
      option.offeredWhen(SENS_COMPATIBLES["2_RETOUR"]),
    )
    .option("3_ALLER_RETOUR_EQUIVALENT", (option) =>
      option.offeredWhen(SENS_COMPATIBLES["3_ALLER_RETOUR_EQUIVALENT"]),
    )
    .option("4_ALLER_RETOUR_DIFFERENT", (option) =>
      option.blocks(
        "Ces deux trajets nécessitent deux simulations distinctes. Choisissez ici le sens déjà évalué, puis faites une autre simulation pour l’autre sens.",
      ),
    ),
  question
    .number(
      "Q3.1.1",
      "Combien de trajets cette prescription doit-elle couvrir ?",
    )
    .labelFrom(quantiteDuSens)
    .hintFrom(aideDuSens)
    .integer()
    .min(1)
    .mattersWhile(uneQuantiteAPoser)
    // Un autre sens change l'unité : le nombre se ressaisit.
    .dependsOn("Q3.1.2"),
  question
    .number(
      "Q3.1.3",
      "Combien d’allers-retours faut-il prescrire par mois pour ces permissions de sortie ?",
    )
    .hint(
      "Exemple : 2 allers-retours par mois = 2 allers et 2 retours par mois.",
    )
    .integer()
    .min(1)
    .unit("aller(s)-retour(s) par mois")
    .mattersWhile(desTrajetsMensuelsAPoser)
    .reminderFrom(rappelDesPermissions)
    .inconsistentWhen(desTrajetsAuDelaDeLaFrequence, FREQUENCE_DEPASSEE),
);

/** P3, posée après le verrou : elle complète le cerfa, elle ne décide plus. */
export const COMPLEMENT: Partie = afterLock({
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
    PAGE_DE_LA_MATERNITE,
  ],
});
