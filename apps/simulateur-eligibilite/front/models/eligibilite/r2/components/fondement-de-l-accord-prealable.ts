// Ce que dit la fiche d'une demande d'accord préalable (#136) : la raison que
// lit le patient, ses motifs (`motif.ts`), le motif administratif que reprend
// le modus, et les portions du trajet que les deux restituent. Des fonctions
// pures de la trace, sans React.
//
// Les mots viennent du catalogue de l'éditeur. La raison suit la page
// « Éligibilité » : le contexte du soin, puis la convocation et la permission
// quand elles sont qualifiées, puis la justification de l'accord préalable,
// séparés par un espace. Un code n'est posé que si la cible qui le prouve vaut
// « oui » : rien n'est jamais déduit. Sans justification pour les motifs
// établis, la phrase manque : rien n'est inventé à la place. Chaque texte
// déclare ce qu'il lit des cibles et des faits (`ce-que-lit-un-texte.ts`).

import type { Cibles } from "../../../../../core/models/eligibilite/cibles/noms";
import { given } from "../../../../../core/models/eligibilite/questions/reponses";
import type { Portion } from "../../../../socle";
import { portionsDesTextes } from "./autres-termes-du-lexique";
import { luPar, type TraceDe } from "./ce-que-lit-un-bloc";
import {
  avecLeLexique,
  codesDeContexte,
  LU_PAR_LE_LEXIQUE,
  LU_PAR_LES_CODES_DE_CONTEXTE,
  motifDuCodeExact,
} from "./contexte-du-resultat";
import type {
  AucunTexte,
  IssuePositive,
  TexteCode,
} from "./forme-du-catalogue";
import { type Motif, motifDe } from "./motif";

/** Pourquoi le transport demande un accord, et le motif que reprend le modus. */
export type FondementDeLAccord = {
  readonly raison: string | undefined;
  readonly motifAdministratif: string | undefined;
  /** Les motifs que la raison affiche : le contexte, puis la justification. */
  readonly motifs: readonly Motif[];
  /** Les portions du trajet que la raison et le motif administratif restituent. */
  readonly portions: readonly Portion[];
};

// Chaque code de motif, et la cible qui le prouve.
const MOTIFS = [
  ["L", "cible_dap_motif_longue_distance"],
  ["S", "cible_dap_motif_serie"],
  ["V", "cible_dap_motif_avion_bateau"],
  ["C", "cible_dap_motif_camsp_cmpp"],
  ["N", "cible_dap_motif_engagement_maternite"],
] as const satisfies readonly (readonly [string, keyof Cibles])[];

/** Ce que lisent les codes des motifs : la cible de chaque motif. */
export const LU_PAR_LES_MOTIFS_DE_L_ACCORD = luPar({
  cibles: given.cibles(...MOTIFS.map(([, cible]) => cible)),
});

/** Ce que lisent la raison et le motif d'une demande d'accord préalable. */
export const LU_PAR_LE_FONDEMENT_DE_L_ACCORD = luPar(
  {
    faits: given.faits(
      "fait_convocation",
      "fait_permission",
      "fait_permission_mineur_admissible",
    ),
  },
  LU_PAR_LES_CODES_DE_CONTEXTE,
  LU_PAR_LES_MOTIFS_DE_L_ACCORD,
  LU_PAR_LE_LEXIQUE,
);

/** Les codes des motifs d'accord préalable établis, dans l'ordre L, S, V, C, N. */
export function codesDeLAccord(
  cibles: TraceDe<typeof LU_PAR_LES_MOTIFS_DE_L_ACCORD>["cibles"],
): readonly string[] {
  return MOTIFS.filter(([, cible]) => cibles[cible].isOui()).map(
    ([code]) => code,
  );
}

/** La raison et le motif de cette issue d'accord préalable pour cette trace. */
export function fondementDeLAccord(
  issue: IssuePositive,
  trace: LuParLeFondement,
): FondementDeLAccord {
  const contexte = motifDuCodeExact(
    issue.contexts,
    codesDeContexte(trace.cibles),
  );
  const justification = motifDuCodeExact(
    issue.dapPhrases,
    codesDeLAccord(trace.cibles),
  );
  const raison = raisonDeLAccord(issue, trace, [contexte, justification]);
  const motif = motifDeLAccord(issue, trace);
  const textes = [raison, motif].filter((texte) => texte !== undefined);
  return {
    raison: raison && avecLeLexique(issue, trace, raison),
    motifAdministratif: motif && avecLeLexique(issue, trace, motif),
    motifs: affiches(contexte, justification),
    portions: portionsDesTextes(trace, textes),
  };
}

// ---- implémentation ----

type LuParLeFondement = TraceDe<typeof LU_PAR_LE_FONDEMENT_DE_L_ACCORD>;

const SANS_COMPLEMENT = "un transport";

type Choisi = TexteCode | undefined;

// Le contexte (vide sans aucun code), la convocation, la permission, puis la
// justification, avant le lexique. Les composantes vides disparaissent.
function raisonDeLAccord(
  issue: IssuePositive,
  trace: LuParLeFondement,
  [contexte, justification]: readonly [Choisi, Choisi],
): string | AucunTexte {
  const raison = [
    contexte?.text,
    ...complements(issue.contextExtras, trace),
    justification?.text,
  ]
    .filter((texte) => texte)
    .join(" ");
  return raison === "" ? undefined : raison;
}

// Les motifs que la raison affiche : ceux qui ont un texte. Le contexte sans
// aucun code est vide, la raison ne le montre pas.
function affiches(...motifs: readonly Choisi[]): Motif[] {
  return motifs
    .filter(
      (motif): motif is TexteCode => motif !== undefined && motif.text !== "",
    )
    .map(motifDe);
}

// La base du contexte, puis les clauses : convocation, permission, motifs
// d'accord, avant le lexique. Après « un transport » seul, un espace ; après
// une base détaillée, une virgule.
function motifDeLAccord(
  issue: IssuePositive,
  trace: LuParLeFondement,
): string | AucunTexte {
  const codes = codesDeContexte(trace.cibles);
  const base = motifDuCodeExact(issue.administrativeBases, codes)?.text;
  if (base === undefined) return undefined;
  const clauses = [
    ...complements(issue.administrativeExtras, trace),
    motifDuCodeExact(issue.administrativeDap, codesDeLAccord(trace.cibles))
      ?.text,
  ].filter((clause): clause is string => !!clause);
  const separateur = base === SANS_COMPLEMENT ? " " : ", ";
  return clauses.length === 0 ? base : `${base}${separateur}${relier(clauses)}`;
}

// Les textes de la convocation (K) et de la permission (P) quand les faits
// les qualifient. Une permission de mineur admissible est la seule qui compte.
function complements(
  extras: IssuePositive["contextExtras"],
  trace: LuParLeFondement,
): string[] {
  const {
    fait_convocation,
    fait_permission,
    fait_permission_mineur_admissible,
  } = trace.faits;
  const qualifies = {
    K: fait_convocation.isOui(),
    P: fait_permission.isOui() && fait_permission_mineur_admissible.isOui(),
  };
  return extras
    .filter(({ code }) => qualifies[code as keyof typeof qualifies])
    .map(({ text }) => text);
}

// Une clause telle quelle, deux reliées par « et », au-delà des virgules et un
// dernier « et ».
function relier(clauses: readonly string[]): string {
  if (clauses.length <= 2) return clauses.join(" et ");
  return `${clauses.slice(0, -1).join(", ")} et ${clauses.at(-1)}`;
}
