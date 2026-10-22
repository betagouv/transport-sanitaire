// Les domaines du modèle de l'éditeur, dans l'ordre du parcours : P1 dit le
// mode, P2 l'éligibilité, R2 son résultat, P3 complète le cerfa,
// R3 le récapitule. La racine du
// modèle les assemble. Les concepts sont lus par toutes les parties.
//
// Comme dans `tests/architecture.test.ts`, chaque règle donne son pourquoi
// dans son message d'échec.

import { describe, expect, it } from "vitest";
import { franchissements } from "../../inspection-des-sources";

// Les parties sont au métier, les résultats à l'écran.
const METIER = "core/models/eligibilite";
const ECRAN = "front/models/eligibilite";
const P1 = `${METIER}/p1`;
const P2 = `${METIER}/p2`;
const R2 = `${ECRAN}/r2`;
const P3 = `${METIER}/p3`;
const R3 = `${ECRAN}/r3`;
const CONCEPTS = `${METIER}/concepts`;
const FAMILLES_DE_R2 = ["praticien", "fiche-negative", "fiche-positive"].map(
  (famille) => `${R2}/${famille}`,
);

// Un dossier contient ce qui commence par son chemin suivi d'un « / ».
const dans = (dossier: string) => (cible: string) =>
  cible.startsWith(`${dossier}/`);

describe("les domaines du modèle de l'éditeur", () => {
  it("une partie ne lit pas celles qui la suivent", () => {
    expect(
      [
        ...franchissements([P1], (cible) =>
          [P2, R2, P3, R3].some((suite) => dans(suite)(cible)),
        ),
        ...franchissements([P2], (cible) =>
          [R2, P3, R3].some((suite) => dans(suite)(cible)),
        ),
        ...franchissements([R2], (cible) =>
          [P3, R3].some((suite) => dans(suite)(cible)),
        ),
        ...franchissements([P3], dans(R3)),
      ],
      "P1 établit le mode avant P2, P2 l'éligibilité avant R2, et R2 l'issue " +
        "que P3 complète avant R3. Une partie " +
        "qui lit la suivante dépend d'une question qu'on ne lui a pas encore " +
        "posée. Ce qu'elles partagent va à la racine du modèle, dans " +
        "`declarations/` ou dans `concepts/`.",
    ).toEqual([]);
  });

  it("un concept ne lit aucune partie", () => {
    expect(
      franchissements([CONCEPTS], (cible) =>
        [P1, P2, R2, P3, R3].some((partie) => dans(partie)(cible)),
      ),
      "Toutes les parties lisent les concepts. Un concept qui lirait une " +
        "partie la ferait dépendre d'elle-même, ou d'une partie qui la suit. " +
        "Il ne lit que le socle et les déclarations.",
    ).toEqual([]);
  });

  it("les familles d'issues de R2 ne s'importent pas entre elles", () => {
    const croisements = FAMILLES_DE_R2.flatMap((famille) =>
      franchissements(
        [famille],
        (cible) =>
          FAMILLES_DE_R2.some((autre) => dans(autre)(cible)) &&
          !dans(famille)(cible),
      ),
    );
    expect(
      croisements,
      "Le praticien, la fiche négative et la fiche positive lisent chacun " +
        "leurs textes dans le catalogue. Ce qu'ils partagent (la trace, la " +
        "page de la fiche, le texte enrichi) vit à la racine de `r2/`.",
    ).toEqual([]);
  });
});
