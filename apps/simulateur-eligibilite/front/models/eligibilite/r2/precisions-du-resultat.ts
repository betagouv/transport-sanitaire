// Les précisions éditoriales de la trace : ce que le texte de R2 sait dire en
// plus de l'issue, quand une réponse le prouve (D-111).
//
// Les clés et les valeurs sont celles de l'éditeur (README, « Précisions
// éditoriales utiles »). Une précision qu'aucune réponse ne prouve n'a pas de
// clé : le texte prend alors son repli générique, et rien n'est jamais
// deviné. Ces fonctions ne lisent que les questions validées. Chaque précision
// déclare les siennes (#196) : `unePrecision("dialysisType").lit("Q1.3.a")`.

import { numeroDeLOption } from "../../../../core/models/eligibilite/concepts/numero-de-l-option";
import { Sejour } from "../../../../core/models/eligibilite/concepts/sejour";
import type { Questions } from "../../../../core/models/eligibilite/declarations/questions";
import type { ValidatedAnswers } from "../../../../core/socle";
import { DeclaredReads, forConcept } from "../../../socle";
import type { QuestionsLues } from "../lectures";
import {
  type Contexte,
  contexteDeLArticle80,
  contexteDeLaConvocation,
  contexteDeLaPermission,
  QUESTIONS_DE_LA_PERMISSION,
} from "./contextes-de-scenario";

/** Les réponses ne prouvent pas ce cas : la précision ne s'écrit pas. */
export type NonProuve = undefined;

type Valides = ValidatedAnswers<Questions>;

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
  dialysisType?: "non-hemodialyse" | "inconnu";
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

/** Une précision, ou le séjour réel qu'un texte de R2 lit avec elles. */
export type Prouvables = Precisions & { sejourReel?: true };

/** Une précision : son nom, les questions qu'elle lit, et sa valeur. */
export type UnePrecision<Nom extends keyof Prouvables> = {
  readonly nom: Nom;
  readonly lit: readonly (keyof Questions)[];
  readonly de: (validated: Valides) => Prouvables[Nom] | NonProuve;
};

/** Les précisions que ces questions validées prouvent. */
export function precisionsDuResultat(validated: Valides): Precisions {
  return Object.fromEntries(
    Object.values(PRECISIONS)
      .map(({ nom, de }) => [nom, de(validated)])
      .filter(([, valeur]) => valeur !== undefined),
  );
}

/**
 * Un séjour réel est prouvé (Q2.1.g ou Q2.2.1). Ce n'est pas une clé de
 * l'éditeur : la trace le porte à part, et un texte de R2 le lit.
 */
export const SEJOUR_REEL = unePrecision("sejourReel")
  .lit("Q2.1.g", "Q2.2.1")
  .vaut(({ validated }) =>
    Sejour.of(forConcept(validated)).estReel() ? true : undefined,
  );

// Dans l'ordre de la trace. Les quatre dernières n'ont aucune question qui
// les pose : elles ne lisent rien et restent absentes.
export const PRECISIONS: {
  readonly [Nom in keyof Precisions]-?: UnePrecision<Nom>;
} = {
  hospitalisation: unePrecision("hospitalisation")
    .lit("Q1.3", "Q1.3.a", "Q2.1.f", ...SEJOUR_REEL.lit)
    .vaut(({ validated }) => hospitalisation(validated)),
  atmp: unePrecision("atmp")
    .lit("Q2.2.1.b")
    .vaut(({ validated }) => atmp(validated)),
  careFamily: unePrecision("careFamily")
    .lit("Q2.1")
    .vaut(({ validated }) => familleDeSoin(validated)),
  dialysisType: unePrecision("dialysisType")
    .lit("Q1.3.a")
    .vaut(({ validated }) => typeDeDialyse(validated)),
  deviceCategory: unePrecision("deviceCategory")
    .lit("Q2.10.b")
    .vaut(({ validated }) => categorieDAppareil(validated)),
  repeatedTripsPlanned: unePrecision("repeatedTripsPlanned")
    .lit("Q2.3.3")
    .vaut(({ validated }) => seriePrevue(validated)),
  aldRecognized: unePrecision("aldRecognized")
    .lit("Q1.3")
    .vaut(({ validated }) => aldDeQ13(validated)),
  aldRelated: unePrecision("aldRelated")
    .lit("Q1.3")
    .vaut(({ validated }) => aldDeQ13(validated)),
  article80Context: unePrecision("article80Context")
    .lit("Q2.5", "Q2.6.a", "Q2.1.g")
    .vaut(({ validated }) => contexteDeLArticle80(validated)),
  permissionContext: unePrecision("permissionContext")
    .lit(...QUESTIONS_DE_LA_PERMISSION)
    .vaut(({ validated }) => contexteDeLaPermission(validated)),
  convocationContext: unePrecision("convocationContext")
    .lit("Q2.10", "Q2.10.b")
    .vaut(({ validated }) => contexteDeLaConvocation(validated)),
  lineType: unePrecision("lineType")
    .lit()
    .vaut(() => undefined),
  camspType: unePrecision("camspType")
    .lit()
    .vaut(() => undefined),
  eventFinalityClarified: unePrecision("eventFinalityClarified")
    .lit()
    .vaut(() => undefined),
  transportExclusionRule: unePrecision("transportExclusionRule")
    .lit()
    .vaut(() => undefined),
};

// ---- implémentation ----

type Lues<Lus extends keyof Questions> = {
  readonly validated: QuestionsLues<Lus>;
};

// Une précision, nommée pour les erreurs de lecture. Elle ne lit que des
// questions : aucun fait ni aucune cible n'en prouve une.
function unePrecision<Nom extends keyof Prouvables>(nom: Nom) {
  return {
    lit: <const Lus extends readonly (keyof Questions)[]>(...lus: Lus) => ({
      vaut: (
        valeur: (lues: Lues<Lus[number]>) => Prouvables[Nom] | NonProuve,
      ): UnePrecision<Nom> => {
        const lecteur = new DeclaredReads(`La précision ${nom}`, lus);
        return {
          nom,
          lit: lecteur.reads,
          de: (validated) => valeur({ validated: lecteur.answers(validated) }),
        };
      },
    }),
  };
}

// La famille de séances retenues, dans l'ordre du lexique : CH, RA, HE. Une
// hémodialyse demande Q1.3.a. Plusieurs séances demandent que Q2.1.f les dise
// vers le même lieu de soins.
function seancesRetenues(
  validated: QuestionsLues<"Q1.3" | "Q1.3.a" | "Q2.1.f">,
): readonly string[] {
  const cas = validated.question("Q1.3");
  const seances = [
    cas.checked("3_CHIMIOTHERAPIE") && "CH",
    cas.checked("4_RADIOTHERAPIE") && "RA",
    cas.checked("5_DIALYSE") &&
      validated.question("Q1.3.a").is("1_OUI") &&
      "HE",
  ].filter((seance) => seance !== false);
  const memeDeplacement = validated.question("Q2.1.f").is("1_OUI");
  return seances.length >= 2 && !memeDeplacement ? [] : seances;
}

// L'identifiant du lexique : le séjour ou les séances, puis leurs familles.
function hospitalisation(
  validated: QuestionsLues<"Q1.3" | "Q1.3.a" | "Q2.1.f" | "Q2.1.g" | "Q2.2.1">,
): string | NonProuve {
  const seances = seancesRetenues(validated);
  const sejour = Sejour.of(forConcept(validated)).estReel();
  if (!sejour && seances.length === 0) return undefined;
  return [sejour ? "H-SEJOUR" : "H-SEANCE", ...seances].join("-");
}

// « Accident du travail ou maladie professionnelle » : Q2.2.1.b ne les
// sépare pas, seul l'identifiant commun est prouvé.
function atmp(validated: QuestionsLues<"Q2.2.1.b">): "ATMP" | NonProuve {
  return validated.question("Q2.2.1.b").checked("1_ATMP") ? "ATMP" : undefined;
}

// Le numéro de l'option de Q2.1, pour les soins qui ont une phrase de famille.
const FAMILLES_DE_SOIN = [1, 2, 3, 4, 5, 6, 7, 14, 15];

function familleDeSoin(validated: QuestionsLues<"Q2.1">): number | NonProuve {
  const motif = validated.question("Q2.1");
  if (!motif.hasAnswer()) return undefined;
  const numero = numeroDeLOption(motif.value);
  return FAMILLES_DE_SOIN.includes(numero) ? numero : undefined;
}

// Q1.3.a dit une dialyse qui n'est pas de l'hémodialyse, ou ne le dit pas.
function typeDeDialyse(
  validated: QuestionsLues<"Q1.3.a">,
): Precisions["dialysisType"] {
  const reponse = validated.question("Q1.3.a");
  if (reponse.is("2_AUTRE_DIALYSE")) return "non-hemodialyse";
  return reponse.is("3_NE_SAIT_PAS") ? "inconnu" : undefined;
}

// Q2.10.b : un appareillage qui n'est pas l'un des trois que vise R.322-10 2°.
function categorieDAppareil(
  validated: QuestionsLues<"Q2.10.b">,
): "hors-categories" | NonProuve {
  return validated.question("Q2.10.b").is("4_AUTRE")
    ? "hors-categories"
    : undefined;
}

// Q2.3.3 « Oui » prouve des transports répétés. « Non » ne dit pas quelle
// condition de la série manque : rien n'en est inféré.
function seriePrevue(validated: QuestionsLues<"Q2.3.3">): true | NonProuve {
  return validated.question("Q2.3.3").is("1_OUI") ? true : undefined;
}

// Q1.3 option 2 dit `aldRecognized` et `aldRelated` à la fois : l'ALD est
// reconnue, et les soins de ce déplacement y sont liés. Non cochée, elle ne
// dit rien de l'ALD.
function aldDeQ13(validated: QuestionsLues<"Q1.3">): true | NonProuve {
  return validated.question("Q1.3").checked("2_ALD") ? true : undefined;
}
