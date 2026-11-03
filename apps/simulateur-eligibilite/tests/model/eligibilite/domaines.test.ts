// Les domaines du modèle de l'éditeur, dans l'ordre du parcours : P1 dit le
// mode, P2 l'éligibilité, R2 son résultat, P3 complète le cerfa,
// R3 le récapitule. La racine du
// modèle les assemble. Les déclarations sont lues par toutes les parties, et
// les faits par leurs gardes.
//
// Comme dans `tests/architecture.test.ts`, chaque règle donne son pourquoi
// dans son message d'échec.

import { describe, expect, it } from "vitest";
import { franchissements } from "../../inspection-des-sources";

// Les parties sont au métier, les résultats à l'écran.
const METIER = "core/models/eligibilite";
const ECRAN = "front/models/eligibilite";
const P1 = `${METIER}/questions/p1`;
const P2 = `${METIER}/questions/p2`;
const R2 = `${ECRAN}/r2`;
const P3 = `${METIER}/questions/p3`;
const R3 = `${ECRAN}/r3`;
const FAITS = `${METIER}/faits`;
// L'évaluation des faits impose la complétude de P1 et de P2 : elle lit leurs
// pages. Les faits eux-mêmes ne lisent aucune partie.
const EVALUATION_DES_FAITS = `${FAITS}/preconisation.ts`;
const RUBRIQUES = `${R3}/rubriques`;
// Un dossier par cerfa rempli (#158, #160, #161).
const CERFA_DE_R3 = ["s3141", "s3138g", "s3139h"].map(
  (cerfa) => `${R3}/${cerfa}`,
);
// Un dossier par cas de R2 : ses issues, ce qu'elles lisent, leur page.
const CAS_DE_R2 = ["acceptee", "refusee", "orientee"].map(
  (cas) => `${R2}/layouts/${cas}`,
);
const COMPOSANTS_DE_R2 = `${R2}/components`;

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
        "posée. Une donnée de l'éditeur qu'elles partagent va dans " +
        "le catalogue de son étape ; une lecture de réponse s'écrit dans chacune.",
    ).toEqual([]);
  });

  it("un fait ne lit aucune partie", () => {
    expect(
      franchissements([FAITS], (cible) =>
        [P1, P2, R2, P3, R3].some((partie) => dans(partie)(cible)),
      ).filter((lien) => !lien.startsWith(`${EVALUATION_DES_FAITS} →`)),
      "Les gardes des parties lisent les faits. Un fait qui lirait une " +
        "partie la ferait dépendre de ses propres gardes. Il ne lit que le " +
        "socle, les déclarations et les concepts : une page ne garde que ses " +
        "questions et ses gardes.",
    ).toEqual([]);
  });

  it("les cas de R2 ne s'importent pas entre eux", () => {
    const croisements = CAS_DE_R2.flatMap((cas) =>
      franchissements(
        [cas],
        (cible) =>
          CAS_DE_R2.some((autre) => dans(autre)(cible)) && !dans(cas)(cible),
      ),
    );
    expect(
      croisements,
      "Les cas acceptée, refusée et orientée lisent chacun leurs textes " +
        "dans le catalogue. Ce qu'ils partagent (la page de la fiche, le " +
        "texte enrichi, les précisions) est un composant de `r2/components/`.",
    ).toEqual([]);
  });

  it("un composant de R2 ne lit aucun cas", () => {
    expect(
      franchissements([COMPOSANTS_DE_R2], (cible) =>
        CAS_DE_R2.some((cas) => dans(cas)(cible)),
      ),
      "Un composant se lit sur la trace, sans savoir quel cas l'affiche : " +
        "`r2.tsx` choisit le cas, le cas assemble ses composants.",
    ).toEqual([]);
  });

  it("les rubriques des cerfa ne lisent aucun cerfa", () => {
    expect(
      franchissements([RUBRIQUES], (cible) =>
        CERFA_DE_R3.some((cerfa) => dans(cerfa)(cible)),
      ),
      "Une rubrique se lit sur les réponses et les cibles, sans savoir quel " +
        "cerfa la reçoit : chaque cerfa assemble celles qu'il porte. Faire " +
        "évoluer ou retirer un cerfa ne touche pas les autres (D-138).",
    ).toEqual([]);
  });

  it("les cerfa de R3 ne s'importent pas entre eux", () => {
    const croisements = CERFA_DE_R3.flatMap((cerfa) =>
      franchissements(
        [cerfa],
        (cible) =>
          CERFA_DE_R3.some((autre) => dans(autre)(cible)) &&
          !dans(cerfa)(cible),
      ),
    );
    expect(
      croisements,
      "Ce que deux cerfa partagent est une rubrique, dans `r3/rubriques/`.",
    ).toEqual([]);
  });
});
