// La fiche patient positive, telle qu'elle s'affiche (#135). Les seeds
// `issue-pmt` et `issue-s3141` donnent les textes des aperçus de l'éditeur
// (recopiés de leurs PDF). `eligibilite` donne le titre du prescripteur et sa
// phrase ; la fiche est le corps, que le socle place.

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { catalogueResultats } from "../../../front/models/eligibilite/r2/catalogue-resultats";
import { eligibilite } from "../../../front/models/eligibilite/r2/resultat";
import { SEEDS } from "../../../front/models/eligibilite/seeds-catalogue";
import { lectureDe, type Reponses } from "./reponses-de-la-permission";

// Le catalogue est chargé une fois : le premier test n'attend pas 750 ko.
await catalogueResultats();

// Affiche le corps du résultat de la seed, et en donne le titre.
const afficher = async (id: string) => {
  const seed = SEEDS.find((candidate) => candidate.id === id);
  if (!seed) throw new Error(`Seed inconnue : ${id}`);
  const answers = seed.answers as Reponses;
  const resultat = await eligibilite(lectureDe(answers));
  render(resultat.body);
  return resultat.title;
};

const fiche = () =>
  within(screen.getByRole("article", { name: "Fiche explicative patient" }));

const BADGES = [
  "Transport non partagé",
  "Aide professionnelle pour se déplacer",
  "Risque de malaise ou de complications pendant le trajet",
];

describe("la fiche de la seed issue-pmt (dialyse, TAP non partagé)", () => {
  it("donne le titre du prescripteur à la page, et celui du patient à la fiche", async () => {
    expect(await afficher("issue-pmt")).toBe(
      "Votre patient est éligible à un transport sanitaire",
    );
    expect(
      fiche().getByRole("heading", {
        level: 2,
        name: "Vous êtes éligible à un transport sanitaire",
      }),
    ).toBeInTheDocument();
  });

  it("dit pourquoi la dialyse est prise en charge", async () => {
    await afficher("issue-pmt");
    expect(
      fiche().getByText(
        "Votre déplacement est lié à une séance de dialyse, prise en compte comme une hospitalisation pour le transport. Cette situation permet la prise en charge de vos frais de transport par l’Assurance Maladie.",
      ),
    ).toBeInTheDocument();
  });

  it("marque la carte du TAP comme la situation du patient", async () => {
    await afficher("issue-pmt");
    const retenues = fiche()
      .getAllByRole("heading", { level: 3 })
      .filter((titre) => titre.closest("[aria-current='true']"));
    expect(retenues.map((titre) => titre.textContent)).toEqual([
      "VSL (Véhicule Sanitaire Léger) ou taxi conventionné",
    ]);
    expect(fiche().getByText("Votre situation")).toBeInTheDocument();
  });

  it("donne l'introduction, les deux étapes et les badges", async () => {
    await afficher("issue-pmt");
    expect(
      fiche().getByRole("heading", {
        name: "Une prescription médicale de transport va vous être remise.",
      }),
    ).toBeInTheDocument();
    expect(
      fiche().getByRole("heading", { name: "1. Dès votre rendez-vous fixé" }),
    ).toBeInTheDocument();
    expect(
      fiche().getByRole("heading", { name: "2. Le jour du transport" }),
    ).toBeInTheDocument();
    const liste = fiche().getByRole("list", {
      name: "Besoins particuliers à signaler lors de la réservation",
    });
    expect(
      within(liste)
        .getAllByRole("listitem")
        .map((badge) => badge.textContent),
    ).toEqual(BADGES);
  });

  it("reprend le motif dans la consigne de réservation", async () => {
    await afficher("issue-pmt");
    expect(
      fiche().getByText(
        /que votre transport sera pris en charge par l’Assurance Maladie au titre d’un transport lié à une séance de dialyse/,
      ),
    ).toBeInTheDocument();
  });

  it("ouvre les liens dans une nouvelle fenêtre, sans HTML injecté", async () => {
    await afficher("issue-pmt");
    const lien = fiche().getByRole("link", {
      name: /annuairesante\.ameli\.fr/,
    });
    expect(lien).toHaveAttribute("target", "_blank");
    expect(lien).toHaveAttribute("rel", "noopener noreferrer");
    expect(fiche().queryByText(/<br>/)).toBeNull();
  });

  it("donne le bloc des frais", async () => {
    await afficher("issue-pmt");
    expect(
      fiche().getByRole("heading", { name: "Le saviez-vous ?" }),
    ).toBeInTheDocument();
  });
});

describe("la fiche de la seed issue-s3141 (permission d'un mineur)", () => {
  it("donne le titre de la permission de sortie", async () => {
    await afficher("issue-s3141");
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Vous êtes éligible à un transport sanitaire pour une permission de sortie",
      }),
    ).toBeInTheDocument();
  });

  it("donne la phrase d'une permission unique (Q2.8.5)", async () => {
    await afficher("issue-s3141");
    expect(
      fiche().getByText(
        "Vous avez moins de 20 ans et votre permission de sortie a été autorisée pendant votre hospitalisation, à compter du quatorzième jour. Cette permission, d’une durée maximale de 48 heures, permet la prise en charge des frais de votre aller-retour par l’Assurance Maladie, dans la limite d’un aller-retour par semaine.",
      ),
    ).toBeInTheDocument();
  });

  // Le PDF de l'éditeur montre aussi « Transport non partagé » : sa fixture le
  // pose d'office. La seed ne coche pas Q1.3 « partage incompatible » : le
  // badge manque, faute de son fait.
  it("donne l'introduction du formulaire S3141 et les badges prouvés", async () => {
    await afficher("issue-s3141");
    expect(
      fiche().getByRole("heading", {
        name: "Une prescription médicale de transport pour permission de sortie (formulaire S3141) va vous être remise.",
      }),
    ).toBeInTheDocument();
    const liste = fiche().getByRole("list", {
      name: "Besoins particuliers à signaler lors de la réservation",
    });
    expect(
      within(liste)
        .getAllByRole("listitem")
        .map((badge) => badge.textContent),
    ).toEqual(BADGES.slice(1));
  });

  it("reprend le motif de la permission dans la consigne", async () => {
    await afficher("issue-s3141");
    expect(
      fiche().getByText(
        /au titre d’un transport lié à une permission de sortie autorisée pendant votre hospitalisation/,
      ),
    ).toBeInTheDocument();
  });
});
