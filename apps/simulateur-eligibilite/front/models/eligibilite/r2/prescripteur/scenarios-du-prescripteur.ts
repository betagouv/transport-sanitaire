// Le scénario du résultat du prescripteur qui convient à une trace, pour les
// quatre issues qui en ont un (D-112). Une fonction pure, sans React.
//
// L'établissement, la permission et la convocation se choisissent par leur
// contexte. La caisse se choisit par les raisons que les règles laissent
// ouvertes (`scenarios-de-la-caisse.ts`).

import type {
  AucunScenario,
  IssuePrescripteur,
  ScenarioPrescripteur,
} from "../../../../../core/models/eligibilite/declarations/catalogue-resultats";
import type { NonProuve } from "../precisions-du-resultat";
import type { Trace } from "../trace-du-resultat";
import { scenariosDeLaCaisse } from "./scenarios-de-la-caisse";

/** Les issues dont le texte est un scénario de l'éditeur. */
export type IssueDuPrescripteur =
  | "ISSUE_CAISSE"
  | "ISSUE_ETABLISSEMENT"
  | "ISSUE_PERMISSION_PATIENT"
  | "ISSUE_CONVOCATION";

/**
 * Les scénarios que la trace montre, dans l'ordre. Un seul pour
 * l'établissement, la permission et la convocation. Aucun pour la caisse
 * quand les règles ne laissent aucune raison que le catalogue sait nommer :
 * rien n'est alors deviné.
 */
export function scenariosDuPrescripteur(
  issue: IssueDuPrescripteur,
  catalogue: IssuePrescripteur,
  trace: Trace,
): readonly ScenarioPrescripteur[] {
  if (issue === "ISSUE_CAISSE") return scenariosDeLaCaisse(catalogue, trace);
  const scenario = scenarioDuContexte(catalogue, contexteDe(issue, trace));
  return scenario ? [scenario] : [];
}

// ---- implémentation ----

type Contexte = Readonly<Record<string, string | undefined>>;

function contexteDe(
  issue: Exclude<IssueDuPrescripteur, "ISSUE_CAISSE">,
  { precisions }: Trace,
): Contexte | NonProuve {
  if (issue === "ISSUE_ETABLISSEMENT") return precisions.article80Context;
  if (issue === "ISSUE_PERMISSION_PATIENT") return precisions.permissionContext;
  return precisions.convocationContext;
}

// Le scénario le plus précis dont tous les paramètres sont prouvés par le
// contexte ; à défaut, le repli. Un scénario inactif n'est jamais choisi.
function scenarioDuContexte(
  { scenarios }: IssuePrescripteur,
  contexte: Contexte | undefined,
): ScenarioPrescripteur | AucunScenario {
  const actifs = scenarios.filter(({ inactive }) => !inactive);
  const prouves = actifs.filter((scenario) =>
    estProuve(scenario, contexte ?? {}),
  );
  const precis = prouves.reduce<ScenarioPrescripteur | undefined>(
    (meilleur, scenario) =>
      !meilleur || parametres(scenario).length > parametres(meilleur).length
        ? scenario
        : meilleur,
    undefined,
  );
  return precis ?? actifs.find(({ params }) => params.kind === "fallback");
}

// Le repli n'est pas un contexte : il se prend quand aucun autre ne tient.
function estProuve(
  scenario: ScenarioPrescripteur,
  contexte: Contexte,
): boolean {
  if (scenario.params.kind === "fallback") return false;
  return parametres(scenario).every(
    ([nom, valeur]) => contexte[nom] === valeur,
  );
}

// Les paramètres dont le scénario demande la preuve.
function parametres({ params }: ScenarioPrescripteur): [string, string][] {
  return Object.entries(params).flatMap(([nom, valeur]) =>
    nom !== "scenario_id" && valeur !== null ? [[nom, valeur]] : [],
  );
}
