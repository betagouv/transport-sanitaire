// fait_exclusion_transport_prouvee : exclusion juridique applicable à ce
// transport, source et conditions vérifiées.
//
// Aucune question ne la pose au médecin : le logiciel la constate dans les
// règles qu'il a chargées (D-105). Les règles de l'éditeur ne portent aucune
// règle d'exclusion du transport. Le fait vaut donc « non » : rien ne
// l'interdit. Ce n'est pas la preuve de l'éligibilité. Une simulation se fait
// en une fois, sur le modèle chargé à l'ouverture : le constat vaut pour toute
// la simulation.
//
// Il suit `CORRECTIF_FAITS_SANS_REPONSE.md`, qui prime sur
// `CONTRAT_REPONSES_FAITS.json`.

import { constant, Fait, unFait } from "../../../socle/index.ts";

export const exclusionTransportProuvee = unFait(
  "fait_exclusion_transport_prouvee",
).vaut(
  constant(
    Fait.non(
      "Contrôle du logiciel : les règles chargées ne portent aucune règle d'exclusion du transport.",
    ),
  ),
);
