// Les termes du lexique de l'accord préalable (#136) : le segment en ligne
// régulière, le cadre CAMSP ou CMPP, et l'ambulance. Une fonction pure de la
// trace, sans React.
//
// Le catalogue range ces termes dans `lexicon.other`, par nom. Une précision
// que les réponses ne prouvent pas prend la valeur commune, la dernière de
// chaque nom : Q2.3.2 ne distingue pas l'avion du bateau, et aucune question
// ne dit CAMSP ou CMPP. Rien n'est jamais deviné. Elle déclare ce qu'elle lit
// des cibles (`ce-que-lit-un-texte.ts`).

import type { IssuePositive } from "../../../../../core/models/eligibilite/declarations/catalogue-resultats";
import { given } from "../../../../../core/models/eligibilite/question";
import { luPar, type TraceDe } from "../ce-que-lit-un-texte";
import type { ReponsesLues } from "../trace-du-resultat";

/** Ce que lisent les autres termes : l'avion ou le bateau de l'accord. */
export const LU_PAR_LES_AUTRES_TERMES = luPar({
  cibles: given.cibles("cible_dap_motif_avion_bateau"),
});

/**
 * Remplace `{segment_ligne_reguliere}`, `{cadre_camsp_cmpp}`,
 * `{motif_ambulance}` et `{portee_ambulance}` dans ce texte.
 */
export function avecLesAutresTermes(
  issue: IssuePositive,
  trace: TraceDe<typeof LU_PAR_LES_AUTRES_TERMES>,
  texte: string,
): string {
  const avionBateau = trace.cibles.cible_dap_motif_avion_bateau.isOui();
  return texte
    .replaceAll(
      "{segment_ligne_reguliere}",
      terme(issue, "segment_ligne_reguliere", rangDuSegment(trace)),
    )
    .replaceAll(
      "{cadre_camsp_cmpp}",
      terme(issue, "cadre_camsp_cmpp", rangDuCadre(trace)),
    )
    .replaceAll(
      "{motif_ambulance}",
      terme(issue, "motif_ambulance", avionBateau ? 1 : 0),
    )
    .replaceAll("{portee_ambulance}", avionBateau ? PORTEE_TERRESTRE : "");
}

// ---- implémentation ----

// La portée de l'ambulance quand le trajet comprend un avion ou un bateau.
// Le catalogue ne la porte pas : la valeur est celle de la page « Modus
// Operandi » de l'éditeur (`sources/s_modus.md`), espace compris. Sans avion
// ni bateau, la portée est vide.
const PORTEE_TERRESTRE = " pour les portions terrestres concernées";

// Le rang du terme voulu parmi ceux du même nom ; sans rang prouvé, le dernier.
function terme(issue: IssuePositive, nom: string, rang: number | null): string {
  const termes = (issue.lexicon.other ?? []).filter(
    (entree) => entree.name === nom,
  );
  return (rang === null ? termes.at(-1) : termes[rang])?.text ?? "";
}

// L'avion, le bateau, ou les deux : seulement si une précision le prouve.
function rangDuSegment(trace: ReponsesLues): number | null {
  switch (trace.precisions.lineType) {
    case "avion":
      return 0;
    case "bateau":
      return 1;
    case "both":
      return 2;
    default:
      return null;
  }
}

function rangDuCadre(trace: ReponsesLues): number | null {
  switch (trace.precisions.camspType) {
    case "CAMSP":
      return 0;
    case "CMPP":
      return 1;
    default:
      return null;
  }
}
