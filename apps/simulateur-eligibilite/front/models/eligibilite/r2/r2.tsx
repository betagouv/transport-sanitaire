// Le résultat de l'éligibilité (R2) à l'écran : il reçoit le `ResultatR2` que
// le métier calcule (`core/models/eligibilite/r2/r2.ts`) et en fait la page
// que le socle compose. Un cas, une page ; un cas ajouté au métier sans page
// ne compile pas.
//
// Trois cas ont une page (`layouts/`) : acceptée et refusée, une fiche patient ;
// orientée, la page du prescripteur. Les trois autres n'ont que leur phrase.
// Celles de l'éditeur sont dans le résultat ; celles qu'écrit l'écran (le
// questionnaire incomplet, les textes qui n'ont pas chargé) sont ici.

import {
  type Lecture,
  R2,
  type ResultatR2,
} from "../../../../core/models/eligibilite/r2/r2";
import type { FirstResult } from "../../../socle";
import { catalogueDeLaSession } from "./components/textes-de-l-editeur";
import { pageAcceptee } from "./layouts/acceptee/page";
import { pageOrientee } from "./layouts/orientee/page";
import { pageRefusee } from "./layouts/refusee/page";

/**
 * La page de R2 pour cette lecture. Une promesse quand le résultat a besoin des
 * textes de l'éditeur : elle ne rejette pas, un échec de chargement est une page
 * comme une autre.
 */
export function pageDeR2(lecture: Lecture): FirstResult | Promise<FirstResult> {
  const r2 = R2.of(lecture);
  const sansCatalogue = r2.sansCatalogue;
  if (sansCatalogue) return pageDuResultat(sansCatalogue);
  return catalogueDeLaSession().then((chargement) =>
    "echec" in chargement
      ? CHARGEMENT_EN_ECHEC
      : pageDuResultat(r2.resultat(chargement.catalogue)),
  );
}

// ---- implémentation ----

function pageDuResultat(resultat: ResultatR2): FirstResult {
  switch (resultat.cas) {
    case "hors circuit":
      return { title: resultat.titre, body: <p>{resultat.texte}</p> };
    case "sans issue":
      return SANS_ISSUE;
    case "sans mode":
      return SANS_MODE;
    case "acceptée":
      return pageAcceptee(resultat);
    case "refusée":
      return pageRefusee(resultat);
    case "orientée":
      return pageOrientee(resultat);
    default:
      return resultat satisfies never;
  }
}

// Sans issue, les règles n'ont pas pu conclure.
const SANS_ISSUE: FirstResult = {
  title: "L’éligibilité n’a pas pu être calculée",
  body: (
    <p>
      Les réponses données ne suffisent pas à calculer l’éligibilité : le
      questionnaire n’est pas complet.
    </p>
  ),
};

// Sans mode, les règles n'ont pas pu choisir le transport. Rien n'est alors à
// compléter.
const SANS_MODE: FirstResult = {
  title: "Le mode de transport n’a pas pu être choisi",
  terminal: true,
  body: (
    <p>
      Les réponses données ne suffisent pas à choisir le mode de transport : le
      questionnaire n’est pas complet.
    </p>
  ),
};

// Le chargement en échec donne un titre et une phrase, sans rien inventer.
// Rien ne le suit : sans textes, rien n'est à compléter.
const CHARGEMENT_EN_ECHEC: FirstResult = {
  title: "Le résultat n’a pas pu être affiché",
  terminal: true,
  body: (
    <p role="alert">
      Les textes du résultat n’ont pas pu être chargés. Rechargez la page.
    </p>
  ),
};
