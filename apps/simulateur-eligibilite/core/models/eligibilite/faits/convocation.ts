// fait_convocation : convocation ou appareillage relevant de R.322-10 2°.
//
// Une catégorie de Q2.10 vérifiée donne « oui », une catégorie négative
// vérifiée donne « non ». Une condition impossible à vérifier laisse le fait
// inconnu : `cible_convocation_inconnue_decisive` envoie alors à la caisse.
// Avant Q2.10, la convocation cochée en Q2.2.1.b reste à qualifier, et écartée
// en Q2.2.1, elle vaut « non ».
//
// Il suit `CORRECTIF_FAITS_SANS_REPONSE.md`, qui prime sur
// `CONTRAT_REPONSES_FAITS.json`.

import { Fait, unFait, type ValidatedAnswers } from "../../../socle/index.ts";
import { ContextesDuTrajet } from "../concepts/contextes-du-trajet.ts";
import {
  type DeclarationDeFait,
  PAS_ENCORE_ETABLI,
} from "../declarations/faits.ts";
import type { Questions } from "../declarations/questions.ts";

export const convocation: DeclarationDeFait = ({ validated }) => {
  const categorie = validated.question("Q2.10");
  return unFait()
    .retient(
      categorie.hasAnswer()
        ? faitDeLaCategorie(validated, categorie.value)
        : undefined,
    )
    .retient(ContextesDuTrajet.of(validated).situation("13_CONVOCATION"))
    .sinon(PAS_ENCORE_ETABLI);
};

// ---- implémentation ----

type Valides = ValidatedAnswers<Questions>;

// Les trois appareillages que vise R.322-10 2°.
const APPAREILLAGES_VISES: readonly Questions["Q2.10.b"][] = [
  "1_PROTHESE_OCULAIRE_FACIALE",
  "2_PODO_ORTHESE",
  "3_ORTHOPROTHESE",
];

function faitDeLaCategorie(
  validated: Valides,
  categorie: Questions["Q2.10"],
): Fait {
  switch (categorie) {
    case "6_APPAREILLAGE":
      return faitDeLAppareillage(validated);
    case "7_AUCUNE":
      return Fait.non(
        "Q2.10 : « 7_AUCUNE », ce motif de convocation ne s'applique pas.",
      );
    default:
      return Fait.oui(`Q2.10 : « ${categorie} ».`);
  }
}

// Un « oui » exige l'agrément et un appareillage visé. Un « non » à l'agrément
// ou un autre appareillage écarte ce seul motif. Sinon, une réponse « je ne
// peux pas » sans rien de négatif laisse le fait absent.
function faitDeLAppareillage(validated: Valides): Fait {
  const agrement = validated.question("Q2.10.a");
  const appareillage = validated.question("Q2.10.b");
  if (agrement.is("2_NON")) {
    return Fait.non(
      "Q2.10.a : « 2_NON » ; le fournisseur n'est pas agréé, ce motif ne s'applique pas.",
    );
  }
  if (appareillage.is("4_AUTRE")) {
    return Fait.non(
      "Q2.10.b : « 4_AUTRE » ; hors des trois appareillages visés par R.322-10 2°, ce motif ne s'applique pas.",
    );
  }
  if (agrement.is("1_OUI") && appareillage.isOneOf(...APPAREILLAGES_VISES)) {
    return Fait.oui(
      `Q2.10.a : « 1_OUI » ; Q2.10.b : « ${appareillage.value} ».`,
    );
  }
  return Fait.inconnu(
    "Q2.10 : « 6_APPAREILLAGE » ; l'agrément ou l'appareillage ne peut pas se vérifier ou se préciser. À vérifier.",
  );
}
