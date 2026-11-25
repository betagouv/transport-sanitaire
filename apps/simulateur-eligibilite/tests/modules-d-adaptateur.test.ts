// Un module d'adaptateur (ARCH-004), rendu exécutable : son point d'entrée est
// un `.adapter.ts`, ses pièces ne regardent que lui, son paquet et son port, et
// on n'y entre que par l'adaptateur.

import { describe, expect, it } from "vitest";
import { importsDe, paquetsDe, sources } from "./inspection-des-sources";
import {
  contratDe,
  estDansLeModule,
  MODULES_D_ADAPTATEUR,
  PDF_LIB_DE_LA_FICHE,
  pointDEntree,
} from "./modules-d-adaptateur";

const RACINES = ["core", "front", "server", "shared"];
const estUnAdaptateur = (fichier: string) => /\.adapter(\.ts)?$/.test(fichier);
// Une feuille de style, un gabarit : pas du code.
const unAutreFichier = (cible: string) => /\.(?!tsx?$)\w+$/.test(cible);

describe("un module d'adaptateur", () => {
  it("a son point d'entrée, et lui seul est un adaptateur", () => {
    const fautifs = MODULES_D_ADAPTATEUR.flatMap((module) => {
      const adaptateurs = sources(module.dossier).filter(estUnAdaptateur);
      return adaptateurs.length === 1 && adaptateurs[0] === pointDEntree(module)
        ? []
        : [
            `${module.dossier} : ${adaptateurs.join(", ") || "aucun adaptateur"}`,
          ];
    });
    expect(
      fautifs,
      "Un module d'adaptateur est un dossier dont le point d'entrée est un " +
        "`.adapter.ts` et un seul : il répond au port, et délègue le détail à " +
        "ses pièces (ARCH-004). Un second adaptateur dans le dossier en fait " +
        "un autre module.",
    ).toEqual([]);
  });

  it("ses fichiers n'importent que son paquet, ses pièces et le port", () => {
    const fautifs = MODULES_D_ADAPTATEUR.flatMap((module) =>
      sources(module.dossier).flatMap((f) => [
        ...importsDe(f)
          .filter((cible) => !estDansLeModule(module, cible))
          .filter((cible) => !contratDe(module).includes(cible))
          .filter((cible) => !unAutreFichier(cible))
          .map((cible) => `${f} → ${cible}`),
        ...paquetsDe(f)
          .filter((paquet) => !module.paquets.includes(paquet))
          .map((paquet) => `${f} → ${paquet}`),
      ]),
    );
    expect(
      fautifs,
      "Un adaptateur ne connaît son appelant que par la signature du port " +
        "qu'il implémente (ARCH-004). Les fichiers de son module importent le " +
        "paquet qu'il masque, les autres pièces du module, et le port avec " +
        "ses types et ses constantes. Ni l'écran, ni le cas d'usage, ni un " +
        "service du domaine : ce qu'il lui faut lui arrive en paramètre par le port.",
    ).toEqual([]);
  });

  it("on n'y entre que par l'adaptateur", () => {
    const fautifs = MODULES_D_ADAPTATEUR.flatMap((module) =>
      sources("core", "front", "server", "shared", "tooling")
        .filter((f) => !estDansLeModule(module, f))
        .flatMap((f) =>
          importsDe(f)
            .filter(
              (cible) =>
                estDansLeModule(module, cible) &&
                cible.replace(/\.tsx?$/, "") !==
                  pointDEntree(module).replace(/\.ts$/, ""),
            )
            .map((cible) => `${f} → ${cible}`),
        ),
    );
    expect(
      fautifs,
      "Seul l'adaptateur est la porte d'un module d'adaptateur (ARCH-004) : " +
        "une pièce interne qu'on importe de l'extérieur lie l'appelant à un " +
        "détail, et au paquet que le module masque. Passe par le port, et " +
        "que seul un assembleur (`container.ts`, `index.ts`) instancie l'adaptateur.",
    ).toEqual([]);
  });

  it("seul son module importe son paquet", () => {
    const fautifs = MODULES_D_ADAPTATEUR.flatMap((module) =>
      sources(...RACINES)
        .filter((f) => !estDansLeModule(module, f))
        .filter((f) => !PDF_LIB_DE_LA_FICHE.includes(f))
        .flatMap((f) =>
          paquetsDe(f)
            .filter((paquet) => module.paquets.includes(paquet))
            .map((paquet) => `${f} → ${paquet}`),
        ),
    );
    expect(
      fautifs,
      "C'est le module qui a le droit d'importer la dépendance, pas seulement " +
        "le fichier `.adapter.ts` (ARCH-004). Un fichier hors du module, " +
        "même un hook ou un composant, passe par le port.",
    ).toEqual([]);
  });
});
