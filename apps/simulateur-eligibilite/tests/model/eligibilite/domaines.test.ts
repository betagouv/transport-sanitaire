// Les domaines du modèle de l'éditeur, dans l'ordre du parcours : P1 dit le
// mode, P2 l'éligibilité, R2 son résultat. La racine du modèle les assemble.
//
// Comme dans `tests/architecture.test.ts`, chaque règle donne son pourquoi
// dans son message d'échec.

import { describe, expect, it } from "vitest";
import { franchissements } from "../../inspection-des-sources";

const EDITEUR = "front/models/eligibilite";
const P1 = `${EDITEUR}/p1`;
const P2 = `${EDITEUR}/p2`;
const R2 = `${EDITEUR}/r2`;
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
          [P2, R2].some((suite) => dans(suite)(cible)),
        ),
        ...franchissements([P2], dans(R2)),
      ],
      "P1 établit le mode avant P2, et P2 l'éligibilité avant R2. Une partie " +
        "qui lit la suivante dépend d'une question qu'on ne lui a pas encore " +
        "posée. Ce qu'elles partagent va à la racine du modèle ou dans " +
        "`declarations/`.",
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
