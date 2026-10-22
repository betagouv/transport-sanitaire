// Les contextes du trajet : les situations particulières de Q2.2.1, et leurs
// précisions sur la même page, la permission (Q2.2.1.a), l'autre cadre
// (Q2.2.1.b) et l'étranger (Q2.2.5).
//
// Chaque fait suit `CONTRAT_REPONSES_FAITS.json` et `CONTRAT_NEGATIONS_PROUVEES.json`
// du paquet de l'éditeur. Une situation proposée et écartée vaut « non ». Une
// situation qui ne se propose pas n'établit rien, et un groupe coché n'établit
// rien avant sa précision. Rien ne s'établit avant la réponse à Q2.2.1.
//
// La page déclare les faits qui ne viennent que d'elle. Pour les autres, elle
// donne sa règle au fait qui la reprend : le séjour écarté au transfert, au
// Centre 15 et à la permission, et chaque situation de l'autre cadre.

import { Fait, regles, type ValidatedAnswers } from "../../../socle/index.ts";
import { Sejour } from "../concepts/sejour.ts";
import {
  type DeclarationsDeFaits,
  PAS_ENCORE_ETABLI,
} from "../declarations/faits.ts";
import { OPTIONS, type Questions } from "../declarations/questions.ts";

type Valides = ValidatedAnswers<Questions>;
type Motif = Questions["Q2.1"];
type Contexte = Questions["Q2.2.1.b"][number];

/**
 * Les situations de l'autre cadre qui se proposent, en Q2.2.1.b comme dans
 * l'aide de Q2.2.1. Une situation déjà indiquée en Q2.1 en est retirée (D-98).
 */
export function contextesAProposer(validated: Valides): readonly Contexte[] {
  const motif = validated.question("Q2.1").value;
  const retires = (motif && RETIRES_PAR_Q21[motif]) || [];
  return CONTEXTES.filter((contexte) => !retires.includes(contexte));
}

/**
 * Le séjour en cours, proposé et écarté : il exclut le transfert, le Centre 15
 * et la permission. Coché, seule Q2.2.1.a dit la permission.
 */
export function sejourEcarte(validated: Valides): Fait | undefined {
  if (!Sejour.of(validated).estEcarte()) return undefined;
  return Fait.non("Q2.2.1 : « déjà hospitalisé » proposé, non coché.");
}

/**
 * Ce qu'une situation de l'autre cadre établit. Écartée, elle vaut « non ».
 * Cochée, elle vaut « oui », ou reste à qualifier dans sa branche (la
 * maternité, la convocation). Le retour pénitentiaire n'a pas de fait : il
 * qualifie son circuit (`retour-penitentiaire.ts`).
 */
export function situationDuCadre(
  validated: Valides,
  contexte: Exclude<Contexte, "10_RETOUR_PENITENTIAIRE">,
): Fait | undefined {
  const { propose, coche } = groupe(validated, "3_AUTRE_CADRE");
  const precision = validated.question("Q2.2.1.b");
  if (!propose || (coche && !precision.hasAnswer())) return undefined;
  const proposes = coche
    ? precision.offeredOptions()
    : contextesAProposer(validated);
  if (!proposes.includes(contexte)) return undefined;
  if (!coche)
    return Fait.non("Q2.2.1 : « autre situation » proposée, non cochée.");
  if (!precision.checked(contexte))
    return Fait.non(`Q2.2.1.b : « ${contexte} » proposée, non cochée.`);
  const source = `Q2.2.1.b : « ${contexte} ».`;
  return A_QUALIFIER.includes(contexte)
    ? Fait.inconnu(`${source} À qualifier dans sa branche.`)
    : Fait.oui(source);
}

/** Les faits que seule la page des contextes établit. */
export const FAITS_DES_CONTEXTES: DeclarationsDeFaits = {
  fait_trajet_etranger: ({ validated }) => trajetEtranger(validated),
  fait_atmp_lie: ({ validated }) =>
    regles()
      .retient(situationDuCadre(validated, "1_ATMP"))
      .sinon(PAS_ENCORE_ETABLI),
  fait_motif_samsah: ({ validated }) =>
    regles()
      .retient(situationDuCadre(validated, "7_SAMSAH"))
      .sinon(PAS_ENCORE_ETABLI),
  fait_motif_pension: ({ validated }) =>
    regles()
      .retient(situationDuCadre(validated, "9_PENSION_MILITAIRE"))
      .sinon(PAS_ENCORE_ETABLI),
  // Q2.1 = 13 décrit un trajet de l'Engagement maternité. Les options 4 et 5
  // s'excluent pour un même trajet (`CONTRAT_CONTEXTES_DECISIFS.md`) : il n'est
  // pas un HTNM hors maternité. Le HTNM se dit hors Engagement maternité dans
  // son libellé même (point 11).
  fait_htnm_hors_maternite: ({ validated }) =>
    regles()
      .nonSi(
        validated.question("Q2.2.1").hasAnswer() &&
          validated.question("Q2.1").is("13_MATERNITE"),
        "Q2.1 : « 13_MATERNITE » ; le même trajet n'est pas un HTNM hors maternité.",
      )
      .retient(situationDuCadre(validated, "5_HTNM"))
      .sinon(PAS_ENCORE_ETABLI),
  // Hors Engagement maternité, aucune règle du segment d'un HTNM n'est
  // vérifiée : la caisse tranche (`CONTRAT_REPONSES_FAITS.json`).
  fait_htnm_segment_verifie: ({ validated }) => {
    const htnm = situationDuCadre(validated, "5_HTNM");
    return regles()
      .nonSi(
        htnm?.isOui() === true,
        `${htnm?.provenance} Le segment du HTNM hors Engagement n'est pas vérifié.`,
      )
      .sinon(PAS_ENCORE_ETABLI);
  },
};

// ---- implémentation ----

const CONTEXTES = Object.keys(OPTIONS["Q2.2.1.b"]) as Contexte[];

// Les situations que Q2.1 indique déjà. Elles sont retirées sans rappel
// (TS1012-01). Le groupe « déjà hospitalisé », que la permission retire, se lit
// dans le séjour (`Sejour.estAProposer`).
const RETIRES_PAR_Q21: Partial<Record<Motif, readonly Contexte[]>> = {
  "10_CAMSP": ["6_CAMSP"],
  "11_PERMISSION": [],
  "12_CONVOCATION": ["13_CONVOCATION"],
  "13_MATERNITE": ["4_MATERNITE_ELOIGNEE", "5_HTNM"],
};

// Les situations que leur branche qualifie (Q2.10, Q2.14) : cochées, elles
// restent à qualifier.
const A_QUALIFIER: readonly Contexte[] = [
  "4_MATERNITE_ELOIGNEE",
  "13_CONVOCATION",
];

// Le groupe que Q2.2.1 a proposé, s'il est coché, et s'il est écarté.
function groupe(validated: Valides, valeur: Questions["Q2.2.1"][number]) {
  const contextes = validated.question("Q2.2.1");
  return {
    propose: contextes.offers(valeur),
    coche: contextes.checked(valeur),
    ecarte: contextes.declined(valeur),
  };
}

// Une extrémité à l'étranger, et non le seul lieu des soins (Q2.2.5).
function trajetEtranger(validated: Valides): Fait {
  const { ecarte } = groupe(validated, "2_ETRANGER");
  const lieux = validated.question("Q2.2.5");
  const extremite = lieux
    .checkedBoxes()
    .some((lieu) => lieu !== "3_LIEU_DES_SOINS");
  const source = `Q2.2.5 : « ${lieux.value?.join(" », « ")} ».`;
  return regles()
    .nonSi(ecarte, "Q2.2.1 : « l'étranger » proposé, non coché.")
    .ouiSi(lieux.hasAnswer() && extremite, source)
    .nonSi(lieux.hasAnswer(), source)
    .sinon(PAS_ENCORE_ETABLI);
}
