// Les aides des tests du texte de la fiche patient positive (#135) : des traces
// écrites à la main, et la lecture de la fiche qu'elles donnent.

import type { Faits } from "../../../core/models/eligibilite/declarations/faits";
import { catalogueResultats } from "../../../front/models/eligibilite/r2/catalogue-resultats";
import {
  type IssueAvecFichePositive,
  type TexteDeLaFichePositive,
  texteDeLaFichePositive,
} from "../../../front/models/eligibilite/r2/fiche-positive/texte-de-la-fiche-positive";
import type { Trace } from "../../../front/models/eligibilite/r2/trace-du-resultat";
import { trace, type ValeursDesCibles } from "./traces-du-prescripteur";

export const catalogue = await catalogueResultats();
export const pmt = catalogue.issues.ISSUE_PMT;
export const dapSansUrgence = catalogue.issues.ISSUE_DAP_SANS_URGENCE;
export const dapUrgence = catalogue.issues.ISSUE_DAP_URGENCE_ATTESTEE;
export const s3141 = catalogue.issues.ISSUE_S3141;

export type Ajouts = {
  readonly criteres?: readonly number[];
  readonly permissionRepeated?: boolean;
  readonly precisions?: Trace["precisions"];
  readonly faits?: Partial<Faits>;
};

const tracer = (cibles: ValeursDesCibles, ajouts: Ajouts = {}): Trace => ({
  ...trace(cibles, ajouts.faits, ajouts.precisions),
  criteres: ajouts.criteres ?? [],
  ...(ajouts.permissionRepeated !== undefined && {
    permissionRepeated: ajouts.permissionRepeated,
  }),
});

export const fiche = (
  cibles: ValeursDesCibles,
  ajouts: Ajouts = {},
  issue: IssueAvecFichePositive = "ISSUE_PMT",
): TexteDeLaFichePositive | undefined =>
  texteDeLaFichePositive(catalogue, tracer(cibles, ajouts), issue);

export const puces = (texte: TexteDeLaFichePositive | undefined) =>
  texte?.consignes.etapes
    .flatMap(({ blocs }) => blocs)
    .flatMap((bloc) => (bloc.type === "liste" ? bloc.puces : [])) ?? [];

export const badges = (texte: TexteDeLaFichePositive | undefined) =>
  puces(texte).flatMap((puce) => puce.badges ?? []);

export const carteRetenue = (texte: TexteDeLaFichePositive | undefined) =>
  texte?.cartes.find((carte) => carte.retenue);

export const carteDuCatalogue = (id: string) => {
  const trouvee = pmt.cards.find((carte) => carte.id === id);
  if (!trouvee) throw new Error(`Carte inconnue : ${id}`);
  return trouvee.text;
};

export const VEHICULE_PERSONNEL = {
  cible_mode_id: "VEHICULE_PERSONNEL",
  cible_mode_individual: true,
} as const;
export const TRANSPORT_COMMUN = {
  cible_mode_id: "TRANSPORT_COMMUN",
  cible_mode_public: true,
} as const;
export const TAP = { cible_mode_id: "TAP" } as const;
export const NON_PARTAGE = {
  cible_transport_partage_incompatible: true,
} as const;
export const PARTAGE = { cible_transport_partage_incompatible: false } as const;
export const TPMR = {
  cible_mode_id: "TPMR",
  cible_fauteuil_roulant: true,
} as const;
export const AMBULANCE = { cible_mode_id: "AMBULANCE" } as const;

export const AMBULANCE_NECESSAIRE = {
  ...AMBULANCE,
  cible_mode_ambulance: true,
} as const;
