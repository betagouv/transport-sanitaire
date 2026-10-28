// Le texte du résultat pour les cinq issues qui n'ont pas de fiche patient
// (D-112) : la caisse, l'établissement, la permission à la charge du patient,
// la convocation, et le transport à l'étranger. Une fonction pure, sans React.
//
// Tous les mots viennent du catalogue de l'éditeur, recopiés tels quels. Ce
// fichier choisit le scénario, puis range ses textes dans la page : il n'en
// écrit aucun.
// `factsReference` n'est pas repris : l'éditeur le dit phrase de démonstrateur,
// que le prescripteur ne doit pas lire comme des faits du dossier. Il lit ce
// que lisent les scénarios (`ce-que-lit-un-texte.ts`).

import type {
  AucunScenario,
  CatalogueResultats,
  IssueDeLaCaisse,
  IssueEtranger,
  IssuePrescripteur,
  ScenarioPrescripteur,
} from "../../../../../core/models/eligibilite/declarations/catalogue-resultats";
import type { TraceDe } from "../ce-que-lit-un-texte";
import { issuesDuTexte } from "../texte-de-l-issue";
import {
  type IssueDuPrescripteur,
  LU_PAR_LES_SCENARIOS,
  scenariosDuPrescripteur,
} from "./scenarios-du-prescripteur";

/** Ce que lit le texte du prescripteur : ce que lisent ses scénarios. */
export const LU_PAR_LE_PRESCRIPTEUR = LU_PAR_LES_SCENARIOS;

/** Les issues dont la page est celle du prescripteur, sans fiche patient. */
export type IssueSansFiche =
  | IssueDuPrescripteur
  | "ISSUE_DAP_ETRANGER_A_EXAMINER";

/** Un point de « Pourquoi ce résultat ? » : un titre, s'il en a un, et son texte. */
export type ElementDuPourquoi = {
  readonly titre?: string;
  readonly texte: string;
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

/** Cette issue a-t-elle la page du prescripteur, et pas de fiche patient ? */
export function estSansFiche(
  issue: string | null | undefined,
): issue is IssueSansFiche {
  const issues: readonly (string | null | undefined)[] =
    issuesDuTexte("prescripteur");
  return issues.includes(issue);
}

/** Le texte de cette issue, pour cette trace. */
export function texteDuPrescripteur(
  catalogue: CatalogueResultats,
  issue: IssueSansFiche,
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
        texte: body,
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
): TexteDuPrescripteur {
  return {
    titre,
    introduction: scenario.intro,
    pourquoi: {
      titre: scenario.whyTitle,
      elements: elementsDuPourquoi(scenario.whyText),
    },
    questions: scenario.questions,
    actions: scenario.actions,
  };
}

// Aucun point : le titre seul. Un point : son scénario. Plusieurs : le
// scénario de cumul que l'éditeur a écrit pour ces points, s'il existe ; sinon
// son introduction pour « plusieurs points », puis chaque scénario. Le titre
// compte les points, une fois chacun (point 27).
function texteDesRaisons(
  issue: IssueDeLaCaisse,
  points: readonly ScenarioPrescripteur[],
): TexteDuPrescripteur {
  const [premier, deuxieme] = points;
  if (!premier) return { ...SANS_TEXTE, titre: issue.title };
  if (!deuxieme) return texteDUnScenario(issue.titles.single, premier);
  const titre = issue.titles.multiple;
  const cumul = scenarioDeCumul(issue, points);
  if (cumul) return texteDUnScenario(titre, cumul);
  return {
    titre,
    introduction: issue.multipleIntro,
    pourquoi: {
      titre: titreAuPluriel(issue, premier),
      elements: points.flatMap(({ whyText }) => elementsDuPourquoi(whyText)),
    },
    questions: points.flatMap(({ questions }) => questions),
    actions: sansDoublon(points.flatMap(({ actions }) => actions)),
  };
}

// Le scénario dont les codes sont exactement ceux de ces points.
function scenarioDeCumul(
  { scenarios }: IssuePrescripteur,
  points: readonly ScenarioPrescripteur[],
): ScenarioPrescripteur | AucunScenario {
  const codes = points.flatMap((point) => point.codes).sort();
  return scenarios.find(
    (scenario) =>
      !scenario.inactive &&
      scenario.codes.length > 1 &&
      [...scenario.codes].sort().join() === codes.join(),
  );
}

// Le titre de l'éditeur pour plusieurs points ; à défaut, celui du premier.
function titreAuPluriel(
  { scenarios }: IssuePrescripteur,
  premier: ScenarioPrescripteur,
): string {
  return (
    scenarios.find(({ codes, inactive }) => !inactive && codes.length > 1)
      ?.whyTitle ?? premier.whyTitle
  );
}

function sansDoublon(textes: readonly string[]): string[] {
  return [...new Set(textes)];
}

// « Titre : texte », ou plusieurs, numérotés « 1. … 2. … » sans espace entre
// eux : les seules marques que le catalogue met dans `whyText`.
function elementsDuPourquoi(whyText: string): ElementDuPourquoi[] {
  const parties = whyText.startsWith("1. ")
    ? whyText.slice(3).split(/(?<=[.!?])\s*\d+\.\s+/)
    : [whyText];
  return parties.map(titreEtTexte);
}

function titreEtTexte(partie: string): ElementDuPourquoi {
  const separation = partie.indexOf(" : ");
  if (separation < 0) return { texte: partie };
  return {
    titre: partie.slice(0, separation),
    texte: partie.slice(separation + 3),
  };
}
