// Le modèle factice : un questionnaire sans rapport avec le transport
// sanitaire, écrit dans le contrat `Model`. Les tests du socle tournent sur lui.

import { bindCerfa, defineModel, text } from "../../../../front/socle";
import type { Cibles } from "./declarations/cibles";
import type { Faits } from "./declarations/faits";
import type { Questions } from "./declarations/questions";
import {
  CATALOGUE_DES_FAITS,
  cibles,
  faits,
  SANS_COMMANDE,
} from "./preconisation";
import { COMPLEMENT, given, PARTS } from "./questionnaire";
import {
  CommandeCompletee,
  LA_QUANTITE,
  RIEN_DES_REPONSES,
  resultatDeLaCommande,
} from "./Resultats";

// Un gabarit fabriqué : le test relit ce qu'il dessine sans servir d'asset.
const BON_DE_COMMANDE = bindCerfa<{
  fields: { commande: string; quantite: string; date: string };
  drawings: Record<never, never>;
}>(
  {
    template: () =>
      import("../../cerfa/test-form").then((m) => m.bonDeCommande()),
    fileName: "bon-de-commande",
    fields: {
      commande: text("commande"),
      quantite: text("quantite"),
      date: text("date"),
    },
    drawings: {},
  },
  {
    fields: {
      commande: given.cible("commande").compute(({ value }) => String(value)),
      quantite: given
        .question("quantite")
        .answer()
        .compute(({ value }) => String(value)),
      date: given.today().compute((jour) => jour.day() ?? ""),
    },
    drawings: {},
  },
);

export const model = defineModel<
  Questions,
  Faits,
  Cibles,
  object,
  { readonly quantite: string }
>({
  core: {
    preconisation: { faits, cibles, reads: CATALOGUE_DES_FAITS.reads },
    questionnaire: PARTS,
    complement: COMPLEMENT,
    seeds: () => import("./seeds-catalogue").then((m) => m.SEEDS),
  },
  result: {
    title: "Résultat",
    reading: RIEN_DES_REPONSES,
    content: resultatDeLaCommande,
  },
  cerfa: {
    // Sans boisson, il n'y a rien à compléter : le premier résultat est le
    // dernier écran.
    form: ({ commande }) =>
      commande.is(SANS_COMMANDE) ? null : BON_DE_COMMANDE,
    title: ({ commande }) => `Commande complétée : ${commande.value}`,
    reading: LA_QUANTITE,
    Resultat: CommandeCompletee,
    startLabel: ({ commande }) =>
      commande.is(SANS_COMMANDE) ? null : "Compléter la commande",
    printLabel: "Imprimer le bon de commande",
    downloadLabel: "Télécharger le bon de commande",
  },
});
