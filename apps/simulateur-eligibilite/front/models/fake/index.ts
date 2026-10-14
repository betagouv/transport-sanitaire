// Le modèle de démonstration : un questionnaire sans rapport avec le transport
// sanitaire, où chaque capacité du socle se voit à l'écran. `main.tsx` le passe au
// socle.

import { defineModel, templateAt, textFrom } from "../../socle";
import bonDeCommande from "./bon-de-commande.pdf?url";
import type { Cibles } from "./declarations/cibles";
import type { Faits } from "./declarations/faits";
import type { Questions } from "./declarations/questions";
import { cibles, faits, SANS_COMMANDE } from "./preconisation";
import { COMPLEMENT, PARTS } from "./questionnaire";
import { Commande, CommandeCompletee } from "./Resultats";

export const model = defineModel<Questions, Faits, Cibles>({
  preconisation: { faits, cibles },
  transportAndEligibility: {
    parts: PARTS,
    title: "Résultat",
    Resultat: Commande,
    printLabel: "Imprimer la commande",
  },
  cerfa: {
    part: COMPLEMENT,
    // Sans boisson, il n'y a rien à compléter : le premier résultat est le
    // dernier écran.
    form: ({ commande }) =>
      commande === SANS_COMMANDE
        ? null
        : {
            template: templateAt(bonDeCommande),
            fileName: "bon-de-commande",
            mapping: {
              commande: textFrom(({ cibles }) => cibles.commande),
              quantite: textFrom(({ answers }) => String(answers.quantite)),
              date: textFrom(({ completedAt }) => enFrancais(completedAt)),
            },
          },
    title: "Commande complétée",
    Resultat: CommandeCompletee,
    startLabel: "Compléter la commande",
    downloadLabel: "Télécharger et imprimer le bon de commande",
  },
  seeds: () => import("./seeds-catalogue").then((m) => m.SEEDS),
});

// ---- implémentation ----

// Le jour de la commande, à Paris : « 14/10/2026 ».
function enFrancais(date: Date): string {
  return date.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });
}
