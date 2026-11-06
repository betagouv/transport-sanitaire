// Le texte du résultat pour les cinq issues qui n'ont pas de fiche patient
// (D-112) : la caisse, l'établissement, la permission à la charge du patient,
// la convocation, et le transport à l'étranger. Une fonction pure, sans React.
//
// Tous les mots viennent du catalogue de l'éditeur, recopiés tels quels. Ce
// fichier choisit le scénario, puis range ses textes dans la page : il n'en
// écrit aucun.
// `factsReference` n'est pas repris : l'éditeur le dit phrase de démonstrateur,
// que le prescripteur ne doit pas lire comme des faits du dossier. Il lit ce
// que lisent les scénarios (`ce-que-lit-un-bloc.ts`).

import type { TraceDe } from "../../components/ce-que-lit-un-bloc";
import type {
  AffichageDuPrescripteur,
  CatalogueResultats,
  IssueDeLaCaisse,
  IssueEtranger,
  ScenarioPrescripteur,
} from "../../components/forme-du-catalogue";
import { sansBlancsDeTrop } from "../../components/sans-blancs-de-trop";
import {
  LU_PAR_LES_SCENARIOS,
  scenariosDuPrescripteur,
} from "../../components/scenarios-du-prescripteur";
import type { IssueOrientee } from "./issues";

/** Ce que lit le texte du prescripteur : ce que lisent ses scénarios. */
export const LU_PAR_LE_PRESCRIPTEUR = LU_PAR_LES_SCENARIOS;

/**
 * Un point de « Pourquoi ce résultat ? » : un titre, s'il en a un, et ses
 * paragraphes.
 */
export type ElementDuPourquoi = {
  readonly titre?: string;
  readonly paragraphes: readonly string[];
};

/**
 * La page du prescripteur. Une section sans texte manque : rien n'est inventé.
 */
export type TexteDuPrescripteur = {
  readonly titre: string;
  readonly introduction?: string;
  readonly pourquoi?: {
    readonly titre: string;
    readonly elements: readonly ElementDuPourquoi[];
  };
  readonly questions: readonly string[];
  readonly actions: readonly string[];
  readonly avertissement?: string;
};

/** Le texte de cette issue, pour cette trace. */
export function texteDuPrescripteur(
  catalogue: CatalogueResultats,
  issue: IssueOrientee,
  trace: TraceDe<typeof LU_PAR_LE_PRESCRIPTEUR>,
): TexteDuPrescripteur {
  if (issue === "ISSUE_DAP_ETRANGER_A_EXAMINER") {
    return texteDeLEtranger(catalogue.issues[issue]);
  }
  const { issues } = catalogue;
  const scenarios = scenariosDuPrescripteur(issue, issues[issue], trace);
  if (issue === "ISSUE_CAISSE") {
    return texteDesRaisons(issues[issue], scenarios);
  }
  const [scenario] = scenarios;
  return scenario
    ? texteDUnScenario(issues[issue].title, scenario)
    : { ...SANS_TEXTE, titre: issues[issue].title };
}

/**
 * Le texte réduit aux sections que le catalogue montre (`REFERENTIEL/03`
 * §4.2, D08). Sans les raisons, il ne reste que le titre et l'introduction.
 */
export function selonLAffichage(
  texte: TexteDuPrescripteur,
  affichage: AffichageDuPrescripteur,
): TexteDuPrescripteur {
  const raisons = affichage.renderReasonPanels !== false;
  const actions = raisons && affichage.renderNextSteps !== false;
  return {
    titre: texte.titre,
    introduction:
      affichage.renderPractitionerIntro === false
        ? undefined
        : texte.introduction,
    pourquoi: raisons ? texte.pourquoi : undefined,
    questions: raisons ? texte.questions : [],
    actions: actions ? texte.actions : [],
    avertissement: raisons ? texte.avertissement : undefined,
  };
}

// ---- implémentation ----

const SANS_TEXTE = { questions: [], actions: [] } as const;

function texteDeLEtranger(issue: IssueEtranger): TexteDuPrescripteur {
  return {
    titre: issue.title,
    introduction: issue.intro,
    pourquoi: {
      titre: issue.whyTitle,
      elements: issue.whyItems.map(({ title, body }) => ({
        titre: title,
        paragraphes: paragraphesDe(body),
      })),
    },
    questions: issue.questions,
    actions: issue.actions,
    avertissement: issue.notice,
  };
}

function texteDUnScenario(
  titre: string,
  scenario: ScenarioPrescripteur,
  titreDuPourquoi = scenario.whyTitle,
): TexteDuPrescripteur {
  return {
    titre,
    introduction: scenario.intro,
    pourquoi: {
      titre: titreDuPourquoi,
      elements: elementsDuPourquoi(scenario.whyText),
    },
    questions: scenario.questions,
    actions: scenario.actions,
  };
}

// Aucun point : le titre seul. Un point : son scénario. Plusieurs : son
// introduction pour « plusieurs points », puis chaque scénario. Le titre
// compte les points, une fois chacun (point 27), et celui du pourquoi aussi,
// lu dans les clés communes de la caisse : aucun scénario n'en est la source
// (TS1017-16, REFERENTIEL/03).
function texteDesRaisons(
  issue: IssueDeLaCaisse,
  points: readonly ScenarioPrescripteur[],
): TexteDuPrescripteur {
  const [premier, deuxieme] = points;
  const { titles, whyTitles } = issue;
  if (!premier) return { ...SANS_TEXTE, titre: issue.title };
  if (!deuxieme) {
    return texteDUnScenario(titles.single, premier, whyTitles.single);
  }
  return {
    titre: titles.multiple,
    introduction: issue.multipleIntro,
    pourquoi: {
      titre: whyTitles.multiple,
      elements: points.flatMap(({ whyText }) => elementsDuPourquoi(whyText)),
    },
    questions: points.flatMap(({ questions }) => questions),
    actions: sansDoublon(points.flatMap(({ actions }) => actions)),
  };
}

function sansDoublon(textes: readonly string[]): string[] {
  return [...new Set(textes)];
}

// « Titre : texte », ou plusieurs, numérotés « 1. … 2. … » sans espace entre
// eux : les seules marques que le catalogue met dans `whyText`. Une ligne vide
// y sépare deux paragraphes.
function elementsDuPourquoi(whyText: string): ElementDuPourquoi[] {
  const texte = whyText.trim();
  const parties = texte.startsWith("1. ")
    ? texte.slice(3).split(/(?<=[.!?])\s*\d+\.\s+/)
    : [texte];
  return parties.map(titreEtParagraphes);
}

function titreEtParagraphes(partie: string): ElementDuPourquoi {
  const separation = partie.indexOf(" : ");
  if (separation < 0) return { paragraphes: paragraphesDe(partie) };
  return {
    titre: sansBlancsDeTrop(partie.slice(0, separation)),
    paragraphes: paragraphesDe(partie.slice(separation + 3)),
  };
}

function paragraphesDe(texte: string): string[] {
  return texte
    .split(/\n\s*\n/)
    .map(sansBlancsDeTrop)
    .filter((paragraphe) => paragraphe !== "");
}
