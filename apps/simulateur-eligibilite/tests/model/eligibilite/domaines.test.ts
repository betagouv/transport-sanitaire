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

// Les parties sont au métier. Un résultat est dans les deux : ce qu'il dit
// (ses lectures, ses textes, ses valeurs) au métier, son rendu à l'écran.
const METIER = "core/models/eligibilite";
const ECRAN = "front/models/eligibilite";
const P1 = `${METIER}/questions/p1`;
const P2 = `${METIER}/questions/p2`;
const R2 = [`${METIER}/r2`, `${ECRAN}/r2`];
const P3 = `${METIER}/questions/p3`;
const R3 = [`${METIER}/r3`, `${ECRAN}/r3`];
const FAITS = `${METIER}/faits`;
// L'évaluation des faits impose la complétude de P1 et de P2 : elle lit leurs
// pages. Les faits eux-mêmes ne lisent aucune partie.
const EVALUATION_DES_FAITS = `${FAITS}/preconisation.ts`;
const RUBRIQUES = R3.map((dossier) => `${dossier}/rubriques`);
// Chaque cerfa rempli a deux pieds : ses valeurs au métier (un fichier), ses
// endroits à l'écran (un dossier). Un fichier se désigne sans son extension,
// que l'écran n'écrit pas dans ses imports.
const CERFA_DE_R3 = ["s3141", "s3138g", "s3139h"].map((cerfa) => ({
  valeurs: `${METIER}/r3/${cerfa}`,
  endroits: `${ECRAN}/r3/${cerfa}`,
}));
const TOUS_LES_CERFA_DE_R3 = CERFA_DE_R3.flatMap((cerfa) => [
  cerfa.valeurs,
  cerfa.endroits,
]);
// Un cas de R2 : ses issues, ce qu'elles lisent (au métier), leur page (à
// l'écran).
const CAS_DE_R2 = ["acceptee", "refusee", "orientee"].map((cas) => [
  `${METIER}/r2/${cas}`,
  `${ECRAN}/r2/layouts/${cas}`,
]);
const DOSSIERS_DES_CAS = CAS_DE_R2.flat();
// Ce que les cas partagent : les blocs au métier, les composants à l'écran.
const BLOCS_DE_R2 = [`${METIER}/r2/blocs`, `${ECRAN}/r2/components`];
// La racine de R2 au métier assemble ses cas et ses blocs en un `ResultatR2`.
const RACINE_DE_R2 = `${METIER}/r2/r2`;

// Un dossier contient ce qui commence par son chemin suivi d'un « / ». Un
// fichier ne contient que lui, avec ou sans son extension.
const dans =
  (...chemins: string[]) =>
  (cible: string) =>
    chemins.some(
      (chemin) =>
        cible.replace(/\.tsx?$/, "") === chemin ||
        cible.startsWith(`${chemin}/`),
    );

describe("les domaines du modèle de l'éditeur", () => {
  it("une partie ne lit pas celles qui la suivent", () => {
    expect(
      [
        ...franchissements([P1], dans(P2, ...R2, P3, ...R3)),
        ...franchissements([P2], dans(...R2, P3, ...R3)),
        ...franchissements(R2, dans(P3, ...R3)),
        ...franchissements([P3], dans(...R3)),
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
      franchissements([FAITS], dans(P1, P2, ...R2, P3, ...R3)).filter(
        (lien) => !lien.startsWith(`${EVALUATION_DES_FAITS} →`),
      ),
      "Les gardes des parties lisent les faits. Un fait qui lirait une " +
        "partie la ferait dépendre de ses propres gardes. Il ne lit que le " +
        "socle, les déclarations et les concepts : une page ne garde que ses " +
        "questions et ses gardes.",
    ).toEqual([]);
  });

  it("les cas de R2 ne s'importent pas entre eux", () => {
    const croisements = CAS_DE_R2.flatMap((cas) =>
      franchissements(
        cas,
        (cible) => dans(...DOSSIERS_DES_CAS)(cible) && !dans(...cas)(cible),
      ),
    );
    expect(
      croisements,
      "Les cas acceptée, refusée et orientée lisent chacun leurs textes " +
        "dans le catalogue. Ce qu'ils partagent (la page de la fiche, le " +
        "texte enrichi, les précisions) est un bloc de `r2/blocs/` au métier, " +
        "ou un composant de `r2/components/` à l'écran.",
    ).toEqual([]);
  });

  it("rien sous la racine de R2 ne la lit", () => {
    expect(
      franchissements(
        [
          `${METIER}/r2/blocs`,
          ...DOSSIERS_DES_CAS.filter((dossier) => dossier.startsWith(METIER)),
        ],
        dans(RACINE_DE_R2),
      ),
      "`r2.ts` choisit le cas et assemble ses blocs : un bloc ou un cas du " +
        "métier qui l'importerait en dépendrait en retour. Ce qu'ils " +
        "partagent est un bloc de `r2/blocs/`.",
    ).toEqual([]);
  });

  it("un bloc de R2 ne lit aucun cas", () => {
    expect(
      franchissements(BLOCS_DE_R2, dans(...DOSSIERS_DES_CAS)),
      "Un bloc se lit sur la trace, sans savoir quel cas l'affiche : " +
        "`r2.ts` choisit le cas au métier, `r2.tsx` lui donne sa page, le cas " +
        "assemble ses blocs et ses composants.",
    ).toEqual([]);
  });

  it("les rubriques des cerfa ne lisent aucun cerfa", () => {
    expect(
      franchissements(RUBRIQUES, dans(...TOUS_LES_CERFA_DE_R3)),
      "Une rubrique se lit sur les réponses et les cibles, sans savoir quel " +
        "cerfa la reçoit : chaque cerfa assemble celles qu'il porte. Faire " +
        "évoluer ou retirer un cerfa ne touche pas les autres.",
    ).toEqual([]);
  });

  it("les cerfa de R3 ne s'importent pas entre eux", () => {
    const croisements = CERFA_DE_R3.flatMap(({ valeurs, endroits }) =>
      franchissements(
        [`${valeurs}.ts`, endroits],
        (cible) =>
          dans(...TOUS_LES_CERFA_DE_R3)(cible) &&
          !dans(valeurs, endroits)(cible),
      ),
    );
    expect(
      croisements,
      "Ce que deux cerfa partagent est une rubrique, dans `r3/rubriques/` : " +
        "ses valeurs au métier, ses endroits à l'écran.",
    ).toEqual([]);
  });
});
