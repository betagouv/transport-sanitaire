// Les modules d'adaptateur (ARCH-004), déclarés : ce que `clean-architecture.test.ts`
// et `modules-d-adaptateur.test.ts` en savent. Aucune assertion ici.

import { dirname } from "node:path";
import { sources } from "./inspection-des-sources";

// Les modules d'adaptateur (ARCH-004) : un dossier dont le point d'entrée est un
// `.adapter.ts`, et dont les autres fichiers sont ses pièces. Un dossier n'en est
// un que s'il est déclaré ici : `server/grist`, `server/journal` et
// `server/postgres` portent aussi un adaptateur, à côté de fichiers du domaine
// que d'autres importent. Le module dit le paquet qu'il masque, et son port.
export type ModuleDAdaptateur = {
  readonly dossier: string;
  readonly adaptateur: string;
  readonly paquets: readonly string[];
};
export const MODULES_D_ADAPTATEUR: readonly ModuleDAdaptateur[] = [
  {
    dossier: "front/socle/cerfa/pdf-lib",
    adaptateur: "pdf-lib-cerfa.adapter.ts",
    paquets: ["pdf-lib"],
  },
];

// Le port d'un module et ce qui le décrit, à côté de lui : ses types et ses
// constantes, que le module lit aussi.
export const contratDe = (module: ModuleDAdaptateur) =>
  sources(dirname(module.dossier)).filter(
    (f) =>
      dirname(f) === dirname(module.dossier) &&
      /\.(port|types|constants)\.ts$/.test(f),
  );
export const estDansLeModule = (module: ModuleDAdaptateur, fichier: string) =>
  fichier.startsWith(`${module.dossier}/`);
export const pointDEntree = (module: ModuleDAdaptateur) =>
  `${module.dossier}/${module.adaptateur}`;
const moduleDe = (fichier: string) =>
  MODULES_D_ADAPTATEUR.find((module) => estDansLeModule(module, fichier));
export const estUnImportDuPaquetDeSonModule = (
  fichier: string,
  paquet: string | undefined,
) => paquet !== undefined && moduleDe(fichier)?.paquets.includes(paquet);

// Exemption provisoire : le PDF de la fiche importe encore `pdf-lib` sans
// passer par un port. Il aura son module d'adaptateur dans la PR qui le porte.
export const PDF_LIB_DE_LA_FICHE = [
  "front/socle/simulateur/sheet/assemble-the-pdf.ts",
];
