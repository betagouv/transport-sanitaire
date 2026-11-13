// La permission déroulée dans le formulaire du socle, comme à l'écran : celle
// du mineur et sa période, celle de l'adulte et ses exceptions. Voir
// `parcours.test.tsx`.

import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  choisir,
  choisirDans,
  cocher,
  jusquAQ21,
  page,
  suivant,
} from "./formulaire-du-modele";

const Q221 = /^L’une de ces situations concerne-t-elle le transport/;
const Q221A = /^Ce trajet correspond-il à une permission/;
const Q221B = /^L’un de ces soins ou rendez-vous/;
const Q231 = /^Quelle distance sépare les lieux de départ/;
const Q26 = /^Quelle situation précise et quelles exceptions/;
const Q27 = /^Âge du patient pendant la période prescrite/;
const Q284 = /^Cette permission a-t-elle été autorisée/;
const Q2848H = /^Cette permission dure-t-elle au maximum 48 heures/;
const Q285 = /^La prescription couvre-t-elle plusieurs permissions/;
const Q286B = /^Le patient restera-t-il âgé de moins de 20 ans/;
const HOSPITALISE = /^Hospitalisation en cours/;

const champ = (libelle: RegExp) => screen.getByLabelText(libelle);

// Le parcours du mineur remplit une vingtaine de champs : sous la charge de la
// suite entière, il dépasse les 5 s par défaut.
const PARCOURS_LONG = 15_000;

describe("la permission, déroulée dans le formulaire", () => {
  it(
    "pose la permission du mineur sur une page, et révèle la période quand il y en a plusieurs",
    async () => {
      const user = await enPermission();

      await page(Q27);
      await choisir(user, /^Moins de 16 ans/);
      await page(Q284);
      expect(
        screen.queryByLabelText(/^Jusqu’à quelle date ces permissions/),
      ).toBeNull();

      await user.type(champ(/^Depuis quelle date/), "2026-10-01");
      await user.type(champ(/^Quand commence la première/), "2026-10-14");
      await user.type(champ(/^Quand se termine cette première/), "2026-10-15");
      await choisirDans(user, Q2848H, /^Oui\./);
      await choisirDans(user, Q284, /^Oui\./);
      await choisirDans(user, Q285, /^Oui\./);

      expect(champ(/^Jusqu’à quelle date ces permissions/)).toBeInTheDocument();
      expect(champ(/^Une permission aller-retour/)).toBeInTheDocument();
      expect(screen.getByRole("group", { name: Q286B })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Suivant" })).toBeDisabled();

      await user.type(
        champ(/^Jusqu’à quelle date ces permissions/),
        "2026-12-01",
      );
      await user.type(champ(/^Une permission aller-retour/), "2");
      await choisirDans(user, Q286B, /^Non\./);
      expect(
        await screen.findByText(
          /La période doit se terminer avant le vingtième/,
        ),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Suivant" })).toBeDisabled();

      await choisirDans(user, Q286B, /^Oui\./);
      expect(
        await screen.findByRole("button", { name: "Voir le résultat" }),
      ).toBeEnabled();
    },
    PARCOURS_LONG,
  );

  it(
    "pose à la permission d'un adulte ses seules exceptions, et attend leur réponse pour décider",
    async () => {
      const user = await enPermission();

      await page(Q27);
      await choisir(user, /^20 ans ou plus : permission autorisée/);

      // Une exception encore inconnue empêche de décider (correctif du
      // 13 novembre) : ni l'admission sans séjour, ni le Centre 15.
      expect(await page(Q26)).toBeInTheDocument();
      expect(
        screen.queryByRole("checkbox", { name: /^Admission dans un nouvel/ }),
      ).toBeNull();
      expect(
        screen.queryByRole("checkbox", {
          name: /^Transport sanitaire demandé par le Centre 15/,
        }),
      ).toBeNull();
      expect(screen.getByRole("button", { name: "Suivant" })).toBeDisabled();

      await cocher(user, /^Aucune de ces exceptions/);
      expect(
        await screen.findByRole("button", { name: "Voir le résultat" }),
      ).toBeEnabled();
    },
    PARCOURS_LONG,
  );
});

// ---- implémentation ----

// Un autre motif, en séjour dans un établissement : seule Q2.2.1.a dit la
// permission (D-272). Puis aucun soin, et 50 km ou moins : jusqu'à Q2.7.
async function enPermission() {
  const user = await jusquAQ21();
  await choisir(user, /^Autre motif de déplacement/);
  await page(Q221);
  await cocher(user, HOSPITALISE);
  await choisir(user, /^En séjour dans un établissement de santé/);
  await choisirDans(user, Q221A, /^Oui\.$/);
  await suivant(user);
  await page(Q221B);
  await cocher(user, /^Non, aucun\./);
  await suivant(user);
  await page(Q231);
  await choisir(user, /^50 km ou moins/);
  await suivant(user);
  return user;
}
