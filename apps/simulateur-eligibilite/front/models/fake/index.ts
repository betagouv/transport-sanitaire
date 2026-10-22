// Le modèle de démonstration : un questionnaire sans rapport avec le transport
// sanitaire, où chaque capacité du socle se voit à l'écran. Son métier est dans
// `core/models/fake/`. `main.tsx` le passe au socle.

import { model as core } from "../../../core/models/fake";
import type { Cibles } from "../../../core/models/fake/declarations/cibles";
import type { Faits } from "../../../core/models/fake/declarations/faits";
import type { Questions } from "../../../core/models/fake/declarations/questions";
import { SANS_COMMANDE } from "../../../core/models/fake/preconisation";
import { defineModel } from "../../socle";
import { bonDeCommande } from "./bon-de-commande";
import { CommandeCompletee, resultatDeLaCommande } from "./Resultats";

export const model = defineModel<Questions, Faits, Cibles>({
  core,
  result: { title: "Résultat", content: resultatDeLaCommande },
  cerfa: {
    // Sans boisson, il n'y a rien à compléter : le premier résultat est le
    // dernier écran.
    form: ({ commande }) => (commande === SANS_COMMANDE ? null : bonDeCommande),
    title: "Commande complétée",
    Resultat: CommandeCompletee,
    startLabel: ({ commande }) =>
      commande === SANS_COMMANDE ? null : "Compléter la commande",
    downloadLabel: "Télécharger et imprimer le bon de commande",
  },
});
