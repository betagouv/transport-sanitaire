// Les précisions éditoriales de la trace : ce que le texte de R2 sait dire en
// plus de l'issue, quand une réponse le prouve (D-111).
//
// Les clés et les valeurs sont celles de l'éditeur (README, « Précisions
// éditoriales utiles »). Une précision qu'aucune réponse ne prouve n'a pas de
// clé : le texte prend alors son repli générique, et rien n'est jamais
// deviné. Elles se lisent sur les questions validées.
//
// Chaque texte a ses précisions, et chacune ne se lit que sous les issues du
// texte qui la montre (D-224). Ex. : Q2.3.3 ne dit la série qu'à la fiche
// négative ; pour une issue positive, elle ne compte pas.

import type { Questions } from "../../../../core/models/eligibilite/declarations/questions";
import { given } from "../../../../core/models/eligibilite/question";
import type { Condition, Value } from "../../../../core/socle";

/** Les réponses ne prouvent pas ce cas : la précision ne s'écrit pas. */
export type NonProuve = undefined;

/**
 * Un contexte de scénario du catalogue : les seuls paramètres non nuls que
 * les réponses prouvent. Le `kind` est toujours prouvé ; les autres, quand
 * une réponse les dit.
 */
type Contexte = {
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
 * « déjà hospitalisé » coché. L'admission en HAD à domicile n'en est pas un.
 */
export const UN_SEJOUR_REEL: Condition = given
  .question("Q2.1.g")
  .answer()
  .isOneOf("1_ENTREE", "2_SORTIE")
  .or(given.question("Q2.2.1").answer().checked("1_HOSPITALISATION"));

// Les réponses que lisent les précisions.
const LUES = {
  soins: given.question("Q1.3").answer(),
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

/** Les précisions de la fiche positive : le séjour ou les séances, l'AT-MP. */
export const PRECISIONS_DE_LA_FICHE_POSITIVE: Value<Precisions> = lues(
  "soins",
  "dialyse",
  "memeDeplacement",
  "sejourReel",
  "autreCadre",
).compute((entrees) => ({
  ...cle("hospitalisation", hospitalisation(entrees)),
  ...cle("atmp", atmp(entrees)),
}));

/** Les précisions de la fiche négative : ce qui dit pourquoi. */
export const PRECISIONS_DE_LA_FICHE_NEGATIVE: Value<Precisions> = lues(
  "motif",
  "dialyse",
  "appareil",
  "serie",
  "soins",
).compute((entrees) => ({
  ...cle("careFamily", familleDeSoin(entrees)),
  ...cle("dialysisType", typeDeDialyse(entrees)),
  ...cle("deviceCategory", categorieDAppareil(entrees)),
  ...cle("repeatedTripsPlanned", seriePrevue(entrees)),
  ...aldDeQ13(entrees),
}));

/** Les précisions du prescripteur : le contexte de chaque scénario. */
export const PRECISIONS_DU_PRESCRIPTEUR: Value<Precisions> = lues(
  "deplacement",
  "transfert",
  "sousType",
  "tranche",
  "convocation",
  "appareil",
).compute((entrees) => ({
  ...cle("article80Context", contexteDeLArticle80(entrees)),
  ...cle("permissionContext", contexteDeLaPermission(entrees)),
  ...cle("convocationContext", contexteDeLaConvocation(entrees)),
}));

// ---- implémentation ----

type Lues = typeof LUES;
type Entrees = {
  [K in keyof Lues]: Lues[K] extends Value<infer V> ? V : never;
};

// Les seules entrées que lit une précision.
function lues<K extends keyof Lues>(...noms: K[]): Value<Pick<Entrees, K>> {
  const choisies = Object.fromEntries(noms.map((nom) => [nom, LUES[nom]]));
  return given.all(choisies as Pick<Lues, K>) as Value<Pick<Entrees, K>>;
}

// Une clé n'existe que si sa valeur est prouvée : jamais `undefined`.
function cle<K extends keyof Precisions>(
  nom: K,
  valeur: Precisions[K],
): Partial<Precisions> {
  return valeur === undefined ? {} : { [nom]: valeur };
}

// La famille de séances retenues, dans l'ordre du lexique : CH, RA, HE. Une
// hémodialyse demande Q1.3.a. Plusieurs séances demandent que Q2.1.f les dise
// vers le même lieu de soins.
function seancesRetenues({
  soins,
  dialyse,
  memeDeplacement,
}: Pick<Entrees, "soins" | "dialyse" | "memeDeplacement">): readonly string[] {
  const seances = [
    soins.checked("3_CHIMIOTHERAPIE") && "CH",
    soins.checked("4_RADIOTHERAPIE") && "RA",
    soins.checked("5_DIALYSE") && dialyse.is("1_OUI") && "HE",
  ].filter((seance) => seance !== false);
  return seances.length >= 2 && !memeDeplacement.is("1_OUI") ? [] : seances;
}

// L'identifiant du lexique : le séjour ou les séances, puis leurs familles.
function hospitalisation(
  entrees: Pick<
    Entrees,
    "soins" | "dialyse" | "memeDeplacement" | "sejourReel"
  >,
): string | NonProuve {
  const seances = seancesRetenues(entrees);
  if (!entrees.sejourReel && seances.length === 0) return undefined;
  return [entrees.sejourReel ? "H-SEJOUR" : "H-SEANCE", ...seances].join("-");
}

// « Accident du travail ou maladie professionnelle » : Q2.2.1.b ne les
// sépare pas, seul l'identifiant commun est prouvé.
function atmp({ autreCadre }: Pick<Entrees, "autreCadre">): "ATMP" | NonProuve {
  return autreCadre.checked("1_ATMP") ? "ATMP" : undefined;
}

// Le numéro de l'option de Q2.1, pour les soins qui ont une phrase de famille.
const FAMILLES_DE_SOIN = [1, 2, 3, 4, 5, 6, 7, 14, 15];

function familleDeSoin({ motif }: Pick<Entrees, "motif">): number | NonProuve {
  if (!motif.hasAnswer()) return undefined;
  // Le slug porte en tête le numéro de l'option au catalogue (D-75).
  const numero = Number.parseInt(motif.value, 10);
  return FAMILLES_DE_SOIN.includes(numero) ? numero : undefined;
}

// Q1.3.a dit une dialyse qui n'est pas de l'hémodialyse.
function typeDeDialyse({
  dialyse,
}: Pick<Entrees, "dialyse">): Precisions["dialysisType"] {
  return dialyse.is("2_AUTRE_DIALYSE") ? "non-hemodialyse" : undefined;
}

// Q2.10.b : un appareillage qui n'est pas l'un des trois que vise R.322-10 2°.
function categorieDAppareil({
  appareil,
}: Pick<Entrees, "appareil">): "hors-categories" | NonProuve {
  return appareil.is("4_AUTRE") ? "hors-categories" : undefined;
}

// Q2.3.3 « Oui » prouve des transports répétés. « Non » ne dit pas quelle
// condition de la série manque : rien n'en est inféré.
function seriePrevue({ serie }: Pick<Entrees, "serie">): true | NonProuve {
  return serie.is("1_OUI") ? true : undefined;
}

// Q1.3 option 2 dit les deux à la fois : l'ALD est reconnue, et les soins de
// ce déplacement y sont liés. Non cochée, elle ne dit rien de l'ALD.
function aldDeQ13({
  soins,
}: Pick<Entrees, "soins">): Pick<Precisions, "aldRecognized" | "aldRelated"> {
  return soins.checked("2_ALD")
    ? { aldRecognized: true, aldRelated: true }
    : {};
}

// Q2.5 dit le genre du déplacement, Q2.6.a sa durée. Le même site, l'USLD et
// l'EHPAD n'ont pas de question qui les prouve. Un autre déplacement pendant
// le séjour est provisoire (D-106). L'admission en HAD à domicile prouve le
// genre « had » seul.
function contexteDeLArticle80({
  deplacement,
  transfert,
  sousType,
}: Pick<Entrees, "deplacement" | "transfert" | "sousType">):
  | Contexte
  | NonProuve {
  if (deplacement.is("2_AUTRE_DEPLACEMENT"))
    return { kind: "inpatient", duration: "temporary" };
  if (deplacement.is("1_TRANSFERT")) {
    if (transfert.is("1_DEFINITIF"))
      return { kind: "transfer", duration: "permanent" };
    return transfert.is("2_PROVISOIRE")
      ? { kind: "transfer", duration: "temporary" }
      : { kind: "transfer" };
  }
  return sousType.is("3_ADMISSION_HAD") ? { kind: "had" } : undefined;
}

// Q2.7 option 4 : un transport exceptionnel demandé par écrit par le patient.
function contexteDeLaPermission({
  tranche,
}: Pick<Entrees, "tranche">): Contexte | NonProuve {
  return tranche.is("4_ADULTE_A_SA_CHARGE")
    ? { kind: "adult-explicit" }
    : undefined;
}

const GENRE_DE_CONVOCATION: Partial<Record<Questions["Q2.10"], string>> = {
  "1_CONTROLE_MEDICAL": "control",
  "2_EXPERT_JURIDICTION": "expert",
  "3_AUDIENCE_CONSULTATION": "audience",
  "4_EXPERT_CONTESTATION": "dispute",
  "5_COMMISSION_RECOURS": "commission",
  "6_APPAREILLAGE": "equipment",
};

const APPAREIL: Partial<Record<string, string>> = {
  "1_PROTHESE_OCULAIRE_FACIALE": "prothèse oculaire ou faciale",
  "2_PODO_ORTHESE": "podo-orthèse",
  "3_ORTHOPROTHESE": "orthoprothèse",
};

// Q2.10 dit le genre ; Q2.10.b l'appareil, pour un appareillage seulement.
function contexteDeLaConvocation({
  convocation,
  appareil,
}: Pick<Entrees, "convocation" | "appareil">): Contexte | NonProuve {
  const categorie = convocation.value;
  const kind = categorie && GENRE_DE_CONVOCATION[categorie];
  if (!kind) return undefined;
  const device = APPAREIL[appareil.value ?? ""];
  return categorie === "6_APPAREILLAGE" && device ? { kind, device } : { kind };
}
