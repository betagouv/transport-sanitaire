// Ce que les fiches patient ne portent pas (N4-09 et N4-11 de la recette de
// l'éditeur, `Recette_documents_N4.json`) : aucun identifiant technique, aucun
// bouton, aucun avis dans les cinq fiches, et aucune fiche pour les quatre
// issues sans document. Que l'avis, le stepper et les boutons de la page ne
// s'impriment pas se teste avec le socle (`avis.test.tsx`).

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SEEDS } from "../../../../../core/models/eligibilite/seeds-catalogue";
import { catalogueResultats } from "../../../../../front/models/eligibilite/r2/components/textes-de-l-editeur";
import { R2 } from "../../../../../front/models/eligibilite/r2/r2";
import { SheetViewer } from "../../../../../front/socle/simulateur";
import { lectureDe, type Reponses } from "../../p2/reponses-de-la-permission";

// Le catalogue est chargé une fois : le premier test n'attend pas ses 900 ko.
await catalogueResultats();

const AVEC_FICHE = [
  "issue-pmt",
  "issue-dap-sans-urgence",
  "issue-dap-urgence-attestee",
  "issue-s3141",
  "issue-non-eligible",
];
const SANS_DOCUMENT = [
  "issue-caisse",
  "issue-etablissement",
  "issue-permission-patient",
  "issue-convocation",
];

// Un nom de règle, une question, une valeur absente ou une variable non
// remplacée.
const TECHNIQUE =
  /ISSUE_|cible_|fait_|\bQ\d+\.\d|undefined|\bnull\b|NaN|[[\]{}]/;

describe("les cinq fiches patient (N4-09)", () => {
  it.each(AVEC_FICHE)(
    "%s : ni identifiant technique, ni bouton, ni avis",
    async (id) => {
      const { sheet } = await resultatDe(id);
      if (!sheet) throw new Error(`Pas de fiche : ${id}`);
      render(<SheetViewer sheet={sheet} />);
      const fiche = screen.getByRole("article", {
        name: "Fiche explicative patient",
      });

      expect(fiche.textContent).not.toMatch(TECHNIQUE);
      expect(within(fiche).queryAllByRole("button")).toEqual([]);
      expect(within(fiche).queryByText(/Donner mon avis/)).toBeNull();
    },
  );
});

describe("les issues sans document (N4-11)", () => {
  it.each(SANS_DOCUMENT)("%s : pas de fiche patient", async (id) => {
    expect(await resultatDe(id)).not.toHaveProperty("sheet");
  });
});

// ---- implémentation ----

// Le résultat de la seed `id`.
async function resultatDe(id: string) {
  const seed = SEEDS.find((candidate) => candidate.id === id);
  if (!seed) throw new Error(`Seed inconnue : ${id}`);
  return R2.of(lectureDe(seed.answers as Reponses)).page();
}
