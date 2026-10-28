// Ce que change une question : les faits que sa réponse peut faire changer
// (#196, #254). Rien ne se déclare : tout se lit sur ce que lisent les faits et
// les gardes (`reads`).
//
// Une question change les faits qui la lisent. Elle change aussi ceux d'une
// question dont une garde la lit, ou lit un fait qu'elle change : sa réponse
// décide si l'autre se pose, ou ce qu'elle propose. Et un fait qui lit un fait
// changé change à son tour. Le calcul suit ces liens de proche en proche.
//
// Ex. : la garde de Q2.2.1 lit Q2.1.g, qui retire « déjà hospitalisé » à une
// entrée. Q2.1.g change donc les faits qui lisent Q2.2.1.
//
// Une garde qui lit une cible lit les faits dont la cible dépend : le graphe de
// décision les connaît. Ex. : la garde de Q2.3.4 lit
// `cible_question_urgence_a_afficher`, qui dépend de `fait_distance_plus_50`.
// Q2.3.1, la distance, change donc les faits qui lisent Q2.3.4.
//
// Un fait qui ne lit rien est une constante : aucune question ne le change.

import type { Reads } from "./condition.ts";
import type { Question } from "./question.ts";

/** Pour chaque question, les faits qu'elle change, dans l'ordre du modèle. */
export function faitsChangedBy(
  questions: readonly Question[],
  faits: { readonly reads: ReadonlyMap<string, Reads> },
  graph: { faitsTestedBy(cible: string): readonly string[] },
): ReadonlyMap<string, readonly string[]> {
  const read = viaCibles(graph);
  const links: Links = {
    faits: new Map([...faits.reads].map(([nom, lu]) => [nom, read(lu)])),
    guards: questions.map(({ id, guardReads }) => [id, read(guardReads)]),
  };
  return new Map(
    questions.map(({ id }) => [id, changedFrom(id, links)] as const),
  );
}

// ---- implémentation ----

// Ce que lisent les faits et les gardes, une cible remplacée par ses faits.
type Lu = {
  readonly questions: readonly string[];
  readonly faits: Set<string>;
};
type Links = {
  readonly faits: ReadonlyMap<string, Lu>;
  readonly guards: readonly (readonly [string, Lu])[];
};

// Plusieurs gardes lisent la même cible : le graphe ne se parcourt qu'une fois
// pour elle.
function viaCibles(graph: {
  faitsTestedBy(cible: string): readonly string[];
}): (lu: Reads) => Lu {
  const known = new Map<string, readonly string[]>();
  function faitsOf(cible: string): readonly string[] {
    const faits = known.get(cible) ?? graph.faitsTestedBy(cible);
    known.set(cible, faits);
    return faits;
  }
  return (lu) => ({
    questions: lu.questions,
    faits: new Set([...lu.faits, ...lu.cibles.flatMap(faitsOf)]),
  });
}

// Les faits que change `id`. Chaque tour ajoute ce qu'atteint le précédent,
// jusqu'à ce que plus rien ne s'ajoute.
function changedFrom(id: string, links: Links): readonly string[] {
  const reached = { questions: new Set([id]), faits: new Set<string>() };
  let grew = true;
  while (grew) {
    grew = reachFaits(reached, links.faits) || reachQuestions(reached, links);
  }
  return [...links.faits.keys()].filter((nom) => reached.faits.has(nom));
}

type Reached = { readonly questions: Set<string>; readonly faits: Set<string> };

// Un fait qui lit une question atteinte, ou un fait atteint, change.
function reachFaits(reached: Reached, reads: ReadonlyMap<string, Lu>): boolean {
  let grew = false;
  for (const [nom, lu] of reads) {
    if (!reached.faits.has(nom) && touches(lu, reached)) {
      reached.faits.add(nom);
      grew = true;
    }
  }
  return grew;
}

// Une question dont une garde lit ce qui est atteint se pose, ou propose,
// autrement : ses faits changent aussi.
function reachQuestions(reached: Reached, links: Links): boolean {
  let grew = false;
  for (const [id, lu] of links.guards) {
    if (!reached.questions.has(id) && touches(lu, reached)) {
      reached.questions.add(id);
      grew = true;
    }
  }
  return grew;
}

function touches(lu: Lu, reached: Reached): boolean {
  return (
    lu.questions.some((id) => reached.questions.has(id)) ||
    [...reached.faits].some((nom) => lu.faits.has(nom))
  );
}
