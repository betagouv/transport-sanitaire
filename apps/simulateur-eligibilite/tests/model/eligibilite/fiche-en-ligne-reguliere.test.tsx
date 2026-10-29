// La fiche patient d'une demande d'accord préalable dont une partie du trajet
// se fait en avion ou en bateau de ligne régulière (#221). Les seeds
// `issue-dap-avion-ou-bateau` et `issue-dap-avion-ou-bateau-urgence-attestee`
// suivent la projection de l'éditeur (`projection-positive.mjs`) : titres et
// modus de la ligne régulière, cartes préfixées, aucun badge terrestre. Les
// textes sont ceux du catalogue, recopiés ici.

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SEEDS } from "../../../core/models/eligibilite/seeds-catalogue";
import { catalogueResultats } from "../../../front/models/eligibilite/r2/catalogue-resultats";
import { eligibilite } from "../../../front/models/eligibilite/r2/resultat";
import { SheetViewer } from "../../../front/socle/simulateur/SheetViewer";
import { lectureDe, type Reponses } from "./reponses-de-la-permission";

await catalogueResultats();

// Affiche la feuille du résultat de la seed dans la liseuse, et donne le titre
// de la page.
const afficher = async (id: string) => {
  const seed = SEEDS.find((candidate) => candidate.id === id);
  if (!seed) throw new Error(`Seed inconnue : ${id}`);
  const resultat = await eligibilite(lectureDe(seed.answers as Reponses));
  if (!resultat.sheet) throw new Error(`Pas de feuille : ${id}`);
  render(<SheetViewer sheet={resultat.sheet} />);
  return resultat.title;
};

const fiche = () =>
  within(screen.getByRole("article", { name: "Fiche explicative patient" }));

const SANS_URGENCE = "issue-dap-avion-ou-bateau";
const URGENCE = "issue-dap-avion-ou-bateau-urgence-attestee";

const PREFIXE = "Pour les éventuelles parties terrestres du trajet :";
const CARTES = [
  "Véhicule personnel ou transports en commun",
  "Véhicule Sanitaire Léger (VSL) ou taxi conventionné",
  "Ambulance",
];

// Le texte de chaque carte, titre compris, dans l'ordre du catalogue.
const cartes = () =>
  fiche()
    .getAllByRole("heading", { level: 3 })
    .filter((titre) => CARTES.includes(titre.textContent ?? ""))
    .map((titre) => titre.closest("li")?.textContent ?? "");

// Chaque carte ouvre son texte sur le préfixe, juste après son titre.
const attendrePrefixe = () => {
  const textes = cartes();
  expect(textes).toHaveLength(CARTES.length);
  CARTES.forEach((titre, rang) => {
    expect(textes[rang]).toContain(`${titre}${PREFIXE}`);
  });
  return textes;
};

describe("la fiche de la seed issue-dap-avion-ou-bateau (sans urgence attestée)", () => {
  it("donne au prescripteur le titre du transport, pas celui du transport sanitaire", async () => {
    expect(await afficher(SANS_URGENCE)).toBe(
      "Le transport de votre patient peut être pris en charge sous réserve de l’accord préalable de l’Assurance Maladie",
    );
  });

  it("donne au patient le titre de la ligne régulière", async () => {
    await afficher(SANS_URGENCE);
    expect(
      fiche().getByRole("heading", {
        level: 2,
        name: "Votre transport peut être pris en charge sous réserve de l’accord préalable de l’Assurance Maladie",
      }),
    ).toBeInTheDocument();
  });

  it("préfixe les trois cartes, et garde celle du mode comme situation", async () => {
    await afficher(SANS_URGENCE);
    const textes = attendrePrefixe();
    expect(textes[1]).toContain("Votre situation");
    expect(textes[1]).toContain(
      "Votre état de santé ne permet pas de partager ce transport.",
    );
  });

  // Le modus de la ligne régulière n'est plus que l'introduction (v10.1.4).
  it("donne le modus de la ligne régulière : l'introduction, sans étape", async () => {
    await afficher(SANS_URGENCE);
    expect(
      fiche().getByText("Attendez l’accord avant d’effectuer votre transport."),
    ).toBeInTheDocument();
    expect(fiche().queryByRole("heading", { name: /^\d\. / })).toBeNull();
  });

  it("n'a aucun badge terrestre, ni la puce des besoins", async () => {
    await afficher(SANS_URGENCE);
    expect(
      fiche().queryByRole("list", {
        name: "Besoins particuliers à signaler lors de la réservation",
      }),
    ).toBeNull();
    expect(fiche().queryByText(/besoins particuliers/)).toBeNull();
    expect(fiche().queryByText("Transport non partagé")).toBeNull();
  });
});

describe("la fiche de la seed issue-dap-avion-ou-bateau-urgence-attestee", () => {
  it("donne les titres sans réserve d'accord, sans dire le transport sanitaire", async () => {
    expect(await afficher(URGENCE)).toBe(
      "Le transport de votre patient peut être pris en charge par l’Assurance Maladie",
    );
    expect(
      fiche().getByRole("heading", {
        level: 2,
        name: "Votre transport peut être pris en charge par l’Assurance Maladie",
      }),
    ).toBeInTheDocument();
  });

  it("donne l'introduction de l'urgence, sans délai d'attente", async () => {
    await afficher(URGENCE);
    expect(
      fiche().getByText(/^L’urgence de votre transport étant attestée/),
    ).toHaveTextContent(
      "L’urgence de votre transport étant attestée, vous pouvez effectuer ce transport sans attendre l’accord de l’Assurance Maladie.",
    );
    expect(fiche().queryByText(/15 jours/)).toBeNull();
  });

  it("donne le modus de la ligne régulière dans l'urgence, sans étape", async () => {
    await afficher(URGENCE);
    expect(fiche().queryByRole("heading", { name: /^\d\. / })).toBeNull();
  });

  it("préfixe les cartes, sans badge terrestre", async () => {
    await afficher(URGENCE);
    attendrePrefixe();
    expect(
      fiche().queryByRole("list", {
        name: "Besoins particuliers à signaler lors de la réservation",
      }),
    ).toBeNull();
  });
});

describe("une demande d'accord préalable sur un trajet terrestre", () => {
  it.each(["issue-dap-sans-urgence", "issue-dap-urgence-attestee"])(
    "%s : aucune carte préfixée",
    async (id) => {
      await afficher(id);
      expect(fiche().queryByText(/éventuelles parties terrestres/)).toBeNull();
    },
  );
});
