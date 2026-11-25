// La fiche patient d'une demande d'accord préalable dont une partie du trajet
// se fait en avion ou en bateau de ligne régulière. Les seeds suivent la
// projection de l'éditeur (`projection-positive.mjs`, v10.2.1) :
// - `issue-dap-avion-ou-bateau` et `issue-dap-avion-ou-bateau-urgence-attestee`,
//   sans partie terrestre : titres et modus de la ligne régulière, ni cartes ni
//   étapes (TS1014-J04), aucun badge terrestre, la ligne dite comme mode avant
//   la raison (R03) ;
// - `issue-dap-trajet-mixte`, avec une partie terrestre : les titres de la
//   ligne régulière, sans cartes, la partie terrestre en texte après la
//   raison, puis ses étapes à part, sans badge (R01, `rendu-resultats.mjs`).
// Les textes sont ceux du catalogue, recopiés ici.

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { catalogueResultats } from "../../../../../core/models/eligibilite/r2/catalogue";
import { SEEDS } from "../../../../../core/models/eligibilite/seeds-catalogue";
import { pageDeR2 } from "../../../../../front/models/eligibilite/r2/r2";
import { SheetViewer } from "../../../../../front/socle/simulateur";
import { lectureDe, type Reponses } from "../../p2/reponses-de-la-permission";

await catalogueResultats();

// Affiche la feuille du résultat de la seed dans la liseuse, et donne le titre
// de la page.
const afficher = async (id: string) => {
  const seed = SEEDS.find((candidate) => candidate.id === id);
  if (!seed) throw new Error(`Seed inconnue : ${id}`);
  const resultat = await pageDeR2(lectureDe(seed.answers as Reponses));
  if (!resultat.sheet) throw new Error(`Pas de feuille : ${id}`);
  render(<SheetViewer sheet={resultat.sheet} />);
  return resultat.title;
};

const fiche = () =>
  within(screen.getByRole("article", { name: "Fiche explicative patient" }));

const SANS_URGENCE = "issue-dap-avion-ou-bateau";
const URGENCE = "issue-dap-avion-ou-bateau-urgence-attestee";
const MIXTE = "issue-dap-trajet-mixte";

const MODE_EN_LIGNE_REGULIERE =
  "Mode de transport : Avion ou bateau de ligne régulière";
const BESOINS = "Besoins particuliers à signaler lors de la réservation";
const RAISON = /^Votre déplacement est lié à une séance de dialyse/;

// Vrai si `avant` précède `apres` dans la fiche.
const precede = (avant: Element, apres: Element) =>
  Boolean(
    avant.compareDocumentPosition(apres) & Node.DOCUMENT_POSITION_FOLLOWING,
  );

const CARTES = [
  "Véhicule personnel ou transports en commun",
  "Véhicule Sanitaire Léger (VSL) ou taxi conventionné",
  "Ambulance",
];

// Les titres des cartes de mode que montre la fiche.
const cartes = () =>
  fiche()
    .queryAllByRole("heading", { level: 3 })
    .filter((titre) => CARTES.includes(titre.textContent ?? ""));

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

  it("n'a pas de cartes de mode", async () => {
    await afficher(SANS_URGENCE);
    expect(cartes()).toEqual([]);
  });

  // Le modus de la ligne régulière n'est plus que l'introduction (v10.1.4).
  it("donne le modus de la ligne régulière : l'introduction, sans étape", async () => {
    await afficher(SANS_URGENCE);
    expect(
      fiche().getByText("Attendez l’accord avant d’effectuer votre transport."),
    ).toBeInTheDocument();
    expect(fiche().queryByRole("heading", { name: /^\d\. / })).toBeNull();
  });

  it("dit la ligne régulière comme mode, avant la raison, sans partie terrestre", async () => {
    await afficher(SANS_URGENCE);
    const mode = fiche().getByText(MODE_EN_LIGNE_REGULIERE);
    expect(precede(mode, fiche().getByText(RAISON))).toBe(true);
    expect(fiche().queryByText(/^Partie terrestre/)).toBeNull();
    expect(
      fiche().queryByRole("region", {
        name: "Pour la partie terrestre du trajet",
      }),
    ).toBeNull();
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

  it("n'a ni cartes de mode, ni badge terrestre", async () => {
    await afficher(URGENCE);
    expect(cartes()).toEqual([]);
    expect(
      fiche().queryByRole("list", {
        name: "Besoins particuliers à signaler lors de la réservation",
      }),
    ).toBeNull();
  });
});

describe("la fiche de la seed issue-dap-trajet-mixte (avec une partie terrestre)", () => {
  it("garde les titres de la ligne régulière", async () => {
    expect(await afficher(MIXTE)).toBe(
      "Le transport de votre patient peut être pris en charge sous réserve de l’accord préalable de l’Assurance Maladie",
    );
    expect(
      fiche().getByRole("heading", {
        level: 2,
        name: "Votre transport peut être pris en charge sous réserve de l’accord préalable de l’Assurance Maladie",
      }),
    ).toBeInTheDocument();
  });

  it("n'a pas de cartes de mode, même pour la partie terrestre", async () => {
    await afficher(MIXTE);
    expect(cartes()).toEqual([]);
  });

  it("dit la ligne régulière comme mode, la raison, puis la partie terrestre", async () => {
    await afficher(MIXTE);
    const mode = fiche().getByText(MODE_EN_LIGNE_REGULIERE);
    const raison = fiche().getByText(RAISON);
    const terrestre = fiche().getByText("Partie terrestre : TAP non partagé");
    expect(precede(mode, raison)).toBe(true);
    expect(precede(raison, terrestre)).toBe(true);
  });

  it("donne les étapes du mode terrestre à part, avant les consignes de l'accord", async () => {
    await afficher(MIXTE);
    const partie = fiche().getByRole("region", {
      name: "Pour la partie terrestre du trajet",
    });
    expect(
      within(partie).getAllByRole("heading", { name: /^\d\. / }),
    ).toHaveLength(2);
    expect(
      within(partie).getByText(/transport assis professionnalisé/),
    ).toBeInTheDocument();
    const accord = fiche().getByText(
      "Attendez l’accord avant d’effectuer votre transport.",
    );
    expect(precede(partie, accord)).toBe(true);
    expect(
      within(accord.closest("section") as HTMLElement).queryByRole("heading", {
        name: /^\d\. /,
      }),
    ).toBeNull();
  });

  it("ne signale aucun besoin : l'éditeur n'a pas de badge en ligne régulière", async () => {
    await afficher(MIXTE);
    expect(fiche().queryByRole("list", { name: BESOINS })).toBeNull();
    expect(fiche().queryByText(/besoins particuliers/)).toBeNull();
  });
});

describe("une demande d'accord préalable sur un trajet terrestre", () => {
  it.each(["issue-dap-sans-urgence", "issue-dap-urgence-attestee"])(
    "%s : garde ses trois cartes, sans préfixe",
    async (id) => {
      await afficher(id);
      expect(cartes()).toHaveLength(3);
      expect(fiche().queryByText(/éventuelles parties terrestres/)).toBeNull();
      expect(fiche().queryByText(/^Mode de transport/)).toBeNull();
    },
  );
});
