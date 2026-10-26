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
    form: ({ commande }) => (commande.is(SANS_COMMANDE) ? null : bonDeCommande),
    title: ({ commande }) => `Commande complétée : ${commande.value}`,
    Resultat: CommandeCompletee,
    startLabel: ({ commande }) =>
      commande.is(SANS_COMMANDE) ? null : "Compléter la commande",
    printLabel: "Imprimer le bon de commande",
    downloadLabel: "Télécharger le bon de commande",
  },
  // L'avis : sous le premier résultat pour un thé, qu'on vient seulement
  // goûter, et sous le second pour un café, qu'on vient commander. Sans
  // boisson, rien ne se complète : il suit le premier résultat.
  feedback: {
    url: "https://example.com/avis",
    label: "Donnez votre avis sur cette démonstration",
    intent: (answers) =>
      answers.question("boisson").is("cafe") ? "prescribe" : "check",
  },
});
