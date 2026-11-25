// Le modèle factice : un questionnaire sans rapport avec le transport
// sanitaire, écrit dans le contrat `Model`. Les tests du socle tournent sur lui.
// Il donne au journal les codes d'une PMT terrestre, ou d'un refus quand rien
// n'est commandé, et mesure son bon sous les identifiants de la PMT.

import type { ValueOf } from "../../../../core/socle";
import {
  bindCerfa,
  ModelFactory,
  type ResultCodes,
  text,
} from "../../../../front/socle";
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
  LA_COMMANDE,
  LA_QUANTITE,
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
    typographicIds: {
      commande: "S3138g.elements_medicaux",
      quantite: "S3138g.nombre",
      date: "S3138g.date_prescription",
    },
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

// La boisson commandée, que lisent le choix du bon, son titre et le bouton.
const COMMANDE = given.cible("commande");

// Une boisson commandée donne une PMT en taxi ; rien de commandé, un refus.
const PMT: ResultCodes = {
  issue: "ISSUE_PMT",
  mode: "TAP",
  transportComposition: "terrestrial_only",
  reasonCodes: [],
  support: "S3138g",
};
const REFUS: ResultCodes = {
  issue: "ISSUE_NON_ELIGIBLE",
  mode: null,
  transportComposition: "not_applicable",
  reasonCodes: ["SANS_COMMANDE"],
  support: "AUCUN",
};

export const model = ModelFactory.define<
  Questions,
  Faits,
  Cibles,
  ValueOf<typeof LA_COMMANDE>,
  ValueOf<typeof LA_QUANTITE>
>({
  version: "2.4.0",
  core: {
    preconisation: { faits, cibles, reads: CATALOGUE_DES_FAITS.reads },
    questionnaire: PARTS,
    complement: COMPLEMENT,
    seeds: () => import("./seeds-catalogue").then((m) => m.SEEDS),
  },
  resultCodes: COMMANDE.compute((commande) =>
    commande.is(SANS_COMMANDE) ? REFUS : PMT,
  ),
  result: {
    title: "Résultat",
    reading: LA_COMMANDE,
    content: resultatDeLaCommande,
  },
  cerfa: {
    // Sans boisson, il n'y a rien à compléter : le premier résultat est le
    // dernier écran.
    form: COMMANDE.compute((commande) =>
      commande.is(SANS_COMMANDE) ? null : BON_DE_COMMANDE,
    ),
    title: COMMANDE.compute(({ value }) => `Commande complétée : ${value}`),
    reading: LA_QUANTITE,
    Resultat: CommandeCompletee,
    startLabel: COMMANDE.compute((commande) =>
      commande.is(SANS_COMMANDE) ? null : "Compléter la commande",
    ),
    printLabel: "Imprimer le bon de commande",
    downloadLabel: "Télécharger le bon de commande",
  },
});
