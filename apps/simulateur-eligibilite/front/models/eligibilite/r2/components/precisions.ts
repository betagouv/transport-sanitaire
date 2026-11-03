// Ce qu'une précision lit : ce que le texte de R2 sait dire en plus de
// l'issue, quand une réponse le prouve (D-111). Chaque cas écrit les siennes
// (`layouts/*/precisions.ts`) sur les réponses déclarées ici.
//
// Les clés et les valeurs sont celles de l'éditeur (README, « Précisions
// éditoriales utiles »). Une précision qu'aucune réponse ne prouve n'a pas de
// clé : le texte prend alors son repli générique, et rien n'est jamais
// deviné. Elles se lisent sur les questions validées.
//
// Chaque cas a ses précisions, et chacune ne se lit que sous les issues du
// cas qui la montre (D-224). Ex. : Q2.3.3 ne dit la série qu'à la fiche
// négative ; pour une issue acceptée, elle ne compte pas.

import { given } from "../../../../../core/models/eligibilite/questions/question";
import type { Condition, Value } from "../../../../../core/socle";

/** Les réponses ne prouvent pas ce cas : la précision ne s'écrit pas. */
export type NonProuve = undefined;

/**
 * Un contexte de scénario du catalogue : les seuls paramètres non nuls que
 * les réponses prouvent. Le `kind` est toujours prouvé ; les autres, quand
 * une réponse les dit.
 */
export type Contexte = {
  kind: string;
  duration?: "temporary" | "permanent";
  place?: "same-site";
  extra?: string;
  device?: string;
};

/**
 * Les précisions que les réponses prouvent. Sans réponse qui les prouve : la
 * clé manque. `lineType`, `camspType`, `eventFinalityClarified` et
 * `transportExclusionRule` n'ont aucune question qui les pose : elles restent
 * absentes.
 */
export type Precisions = {
  hospitalisation?: string;
  atmp?: "ATMP";
  lineType?: "avion" | "bateau" | "both";
  camspType?: "CAMSP" | "CMPP";
  careFamily?: number;
  aldRecognized?: boolean;
  aldRelated?: boolean;
  dialysisType?: "non-hemodialyse";
  deviceCategory?: "hors-categories";
  repeatedTripsPlanned?: boolean;
  eventFinalityClarified?: boolean;
  transportExclusionRule?: {
    reference: string;
    version: string;
    conditionsVerified: true;
  };
  article80Context?: Contexte;
  permissionContext?: Contexte;
  convocationContext?: Contexte;
};

/**
 * Un séjour réel : une entrée ou une sortie d'établissement (Q2.1.g), ou
 * « déjà hospitalisé » coché hors HAD. Ni l'admission en HAD à domicile ni un
 * séjour en HAD n'en sont un (TS1014-B01).
 */
export const UN_SEJOUR_REEL: Condition = given
  .question("Q2.1.g")
  .answer()
  .isOneOf("1_ENTREE", "2_SORTIE")
  .or(
    given
      .question("Q2.2.1")
      .answer()
      .checked("1_HOSPITALISATION")
      .and(given.question("Q2.2.1.cadre").answer().is("2_HAD").not()),
  );

// Les réponses que lisent les précisions.
const LUES = {
  soins: given.question("Q1.3").answer(),
  lienAld: given.question("Q1.3.b").answer(),
  dialyse: given.question("Q1.3.a").answer(),
  memeDeplacement: given.question("Q2.1.f").answer(),
  motif: given.question("Q2.1").answer(),
  sousType: given.question("Q2.1.g").answer(),
  autreCadre: given.question("Q2.2.1.b").answer(),
  serie: given.question("Q2.3.3").answer(),
  deplacement: given.question("Q2.5").answer(),
  transfert: given.question("Q2.6.a").answer(),
  tranche: given.question("Q2.7").answer(),
  convocation: given.question("Q2.10").answer(),
  appareil: given.question("Q2.10.b").answer(),
  sejourReel: UN_SEJOUR_REEL,
};

type Lues = typeof LUES;

/** La valeur de chaque réponse lue. */
export type Entrees = {
  [K in keyof Lues]: Lues[K] extends Value<infer V> ? V : never;
};

/** Les seules entrées que lit une précision. */
export function lues<K extends keyof Lues>(
  ...noms: K[]
): Value<Pick<Entrees, K>> {
  const choisies = Object.fromEntries(noms.map((nom) => [nom, LUES[nom]]));
  return given.all(choisies as Pick<Lues, K>) as Value<Pick<Entrees, K>>;
}

/** Une clé n'existe que si sa valeur est prouvée : jamais `undefined`. */
export function cle<K extends keyof Precisions>(
  nom: K,
  valeur: Precisions[K],
): Partial<Precisions> {
  return valeur === undefined ? {} : { [nom]: valeur };
}
