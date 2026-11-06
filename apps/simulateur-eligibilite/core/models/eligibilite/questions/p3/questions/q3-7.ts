// Q3.7 : l'exonération du ticket modérateur. Le cerfa n'a qu'une case
// Oui / Non. Les cas aident à la cocher. Ils ne se proposent que dans un
// contexte hospitalier, chacun pour les supports dont la notice le cite. Aucun
// cas n'est encore acquis en P2 : « Aucun » n'a rien d'autre à préserver que
// les cases de cette page.

import { given, question } from "../../question.ts";
import {
  avecUnDocument,
  uneDap,
} from "../conditions/supports-du-complement.ts";

export const Q3_7 = question
  .multipleChoice(
    "Q3.7",
    "Un cas particulier d’exonération du ticket modérateur doit-il être reporté ?",
  )
  // Les cas reprennent les notices des cerfa, seuils compris (D-123). Les cas
  // 3 et 4 sont ceux de la PMT et du S3141, le cas 6 celui de la DAP.
  .options({
    "1_ACTE_LOURD":
      "Un acte réalisé lors de l’hospitalisation a un coefficient égal ou supérieur à K60, ou un tarif égal ou supérieur à 120 euros.",
    "2_TRANSFERT_CONSECUTIF":
      "Un transfert en lien direct et consécutif avec une première hospitalisation exonérée en raison d’un K60 ou d’un tarif de 120 euros.",
    "3_URGENCE_HOSPITALIERE":
      "Un transport d’urgence pour une hospitalisation où est effectué un acte coûteux, ou pour une hospitalisation qui en découle directement.",
    "4_HAD_OU_RADIOTHERAPIE":
      "Un transport entre l’établissement et le domicile en Hospitalisation à Domicile (HAD), prescrit hors protocole HAD, ou pour des séances de radiothérapie en structure libérale ou en centre de santé.",
    "5_NOUVEAU_NE":
      "Un transport lié à l’hospitalisation d’un nouveau-né de moins de trente jours.",
    "6_TRAITEMENT_MIEUX_ADAPTE":
      "Un transfert vers un autre établissement d’hospitalisation, pour un traitement mieux adapté à l’état de santé, sauf vers un établissement de soins de suite et de réadaptation.",
    "7_AUCUN": "Non, aucun autre cas",
  })
  .mattersWhile(
    avecUnDocument.and(
      given.cible("cible_hospitalisation_ou_seances_assimilees").isOui(),
    ),
  )
  // La notice de la DAP n'a ni l'urgence hospitalière, ni la HAD ou la
  // radiothérapie. Elle seule a le traitement mieux adapté.
  .option("3_URGENCE_HOSPITALIERE", (option) =>
    option.offeredWhen(uneDap.not()),
  )
  .option("4_HAD_OU_RADIOTHERAPIE", (option) =>
    option.offeredWhen(uneDap.not()),
  )
  .option("6_TRAITEMENT_MIEUX_ADAPTE", (option) => option.offeredWhen(uneDap))
  .exclusive("7_AUCUN");
