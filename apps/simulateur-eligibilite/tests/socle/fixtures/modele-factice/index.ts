// Le modèle factice : un questionnaire sans rapport avec le transport
// sanitaire, écrit dans le contrat `Model`. Les tests du socle tournent sur lui.
// Il donne au journal les codes d'une PMT terrestre, ou d'un refus quand rien
// n'est commandé, et mesure son bon sous les identifiants de la PMT.

import { CoreModelFactory, type ValueOf } from "../../../../core/socle";
import {
  type Cerfa,
  CerfaFactory,
  ModelFactory,
  type ResultCodes,
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

// Le bon de commande : son DTO, ce que vaut chaque entrée (le métier), et le
// gabarit fabriqué où elle s'écrit (l'écran) : le test relit ce qu'il dessine
// sans servir d'asset.
type BonDeCommande = {
  fields: { commande: string; quantite: string; date: string };
  drawings: Record<never, never>;
};

const VALEURS_DU_BON = {
  fields: {
    commande: given.cible("commande").compute(({ value }) => String(value)),
    quantite: given
      .question("quantite")
      .answer()
      .compute(({ value }) => String(value)),
    date: given.today().compute((jour) => jour.day() ?? ""),
  },
  drawings: {},
};

const BON_DE_COMMANDE: Cerfa<BonDeCommande> = {
  template: () =>
    import("../../cerfa/test-form").then((m) => m.bonDeCommande()),
  fileName: "bon-de-commande",
  fields: {
    commande: CerfaFactory.text("commande"),
    quantite: CerfaFactory.text("quantite"),
    date: CerfaFactory.text("date"),
  },
  drawings: {},
  typographicIds: {
    commande: "S3138g.elements_medicaux",
    quantite: "S3138g.nombre",
    date: "S3138g.date_prescription",
  },
};

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

const core = CoreModelFactory.define<
  Questions,
  Faits,
  Cibles,
  ValueOf<typeof LA_COMMANDE>,
  ValueOf<typeof LA_QUANTITE>,
  { readonly "bon-de-commande": BonDeCommande }
>({
  preconisation: { faits, cibles, reads: CATALOGUE_DES_FAITS.reads },
  questionnaire: PARTS,
  complement: COMPLEMENT,
  seeds: () => import("./seeds-catalogue").then((m) => m.SEEDS),
  result: { reading: LA_COMMANDE },
  cerfa: {
    // Sans boisson, il n'y a rien à compléter : le premier résultat est le
    // dernier écran.
    document: COMMANDE.compute((commande): "bon-de-commande" | null =>
      commande.is(SANS_COMMANDE) ? null : "bon-de-commande",
    ),
    values: { "bon-de-commande": VALEURS_DU_BON },
    title: COMMANDE.compute(({ value }) => `Commande complétée : ${value}`),
    reading: LA_QUANTITE,
    startLabel: COMMANDE.compute((commande) =>
      commande.is(SANS_COMMANDE) ? null : "Compléter la commande",
    ),
  },
});

export const model = ModelFactory.define({
  core,
  version: "2.4.0",
  resultCodes: COMMANDE.compute((commande) =>
    commande.is(SANS_COMMANDE) ? REFUS : PMT,
  ),
  result: { title: "Résultat", content: resultatDeLaCommande },
  cerfa: {
    places: { "bon-de-commande": BON_DE_COMMANDE },
    Resultat: CommandeCompletee,
    printLabel: "Imprimer le bon de commande",
    downloadLabel: "Télécharger le bon de commande",
  },
});
