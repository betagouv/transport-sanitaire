// La prestation : ce qui motive le déplacement (Q2.1), et les faits que sa page
// établit, avec ses sous-questions f, g et h.
//
// Chaque fait suit `CONTRAT_REPONSES_FAITS.json` et son correctif. Il ne lit que
// les questions validées. Les sous-questions a à e et i à l, et le régime, ne
// changent aucune sortie : elles ne sont pas posées (D-102).

import {
  Fait,
  type GivenAnswer,
  type PassesOn,
  regles,
  type ValidatedAnswers,
} from "../../../socle/index.ts";
import { CasParticuliers } from "../concepts/cas-particuliers.ts";
import { Sejour } from "../concepts/sejour.ts";
import type { DeclarationsDeFaits, Faits } from "../declarations/faits.ts";
import type { Questions } from "../declarations/questions.ts";
import { cible } from "../evaluation-des-regles.ts";
import { situationDuCadre } from "./contextes.ts";
import { hospitalisationDuTransfert } from "./transfert.ts";

type Valides = ValidatedAnswers<Questions>;
type Motif = Questions["Q2.1"];

/**
 * P1 prouve-t-elle déjà un motif de transport ? L'ambulance, une séance
 * qualifiante, une ALD à 100 % liée au soin, ou le mineur reconnu en soins
 * continus. Q2.1 n'est alors pas posée (D-102), et son saut ne donne aucun
 * « non ».
 */
export function motifDeP1(faits: Faits): boolean {
  if (faits.fait_situation_soins_qualifiante.isOui()) return true;
  return MOTIFS_DE_P1.some((motif) => cible(faits, motif).isOui());
}

/** Les faits que la page de Q2.1 établit, avec ses sous-questions f, g et h. */
export const FAITS_DE_LA_PRESTATION: DeclarationsDeFaits = {
  fait_evenement_sans_soin: ({ validated }) =>
    evenementSansSoin(validated.question("Q2.1")),
  // Q2.1 = 10, puis Q2.1.h : la séance est-elle dans le parcours de l'enfant ?
  // Q2.2.1.b le dit aussi.
  fait_motif_camsp: ({ validated }) =>
    regles()
      .retient(situationDuCadre(validated, "6_CAMSP"))
      .seulementSi(validated.question("Q2.1").is("10_CAMSP"))
      .selon(validated.question("Q2.1.h"), {
        "1_OUI": "oui",
        "2_NON": "non",
        "3_NE_SAIT_PAS": "inconnu",
      })
      .sinon("Ni Q2.1.h, ni Q2.2.1 n'établissent encore le CAMSP."),
  // Une entrée ou une sortie d'établissement prouve le séjour qualifiant.
  // Sinon, P1 garde sa séance.
  fait_situation_soins_qualifiante: ({ validated }) =>
    regles()
      .retient(sansSeanceNiSejour(validated))
      .selon(validated.question("Q2.1.g"), SEJOUR)
      .sinon(CasParticuliers.of(validated).seance()),
  // Le transfert le prouve, et le séjour écarté l'exclut. Une entrée ou une
  // sortie d'établissement le prouve aussi. L'admission en HAD à domicile ne
  // le prouve pas seule.
  fait_hospitalisation: ({ validated }) =>
    regles()
      .retient(hospitalisationDuTransfert(validated))
      .retient(sansSejourEnCours(validated))
      .selon(validated.question("Q2.1.g"), SEJOUR)
      .sinon(CasParticuliers.of(validated).seance()),
};

// ---- implémentation ----

// Les cibles qui, à la fin de P1, prouvent déjà un motif de transport.
const MOTIFS_DE_P1 = [
  "cible_mode_ambulance",
  "cible_ald_qualifiante",
  "cible_mineur_soins_prolonges",
] as const;

// Les soins et examens ordinaires : ils ne sont pas un événement autonome.
const SOINS: readonly Motif[] = [
  "1_CONSULTATION",
  "2_DENTISTE_OU_SAGE_FEMME",
  "3_IMAGERIE",
  "4_BIOLOGIE",
  "5_PARAMEDICAL",
  "6_SEANCE",
  "7_PSYCHOLOGUE",
  "8_HOSPITALISATION",
  "9_TRANSFERT",
  "10_CAMSP",
  "14_AUTRE",
];

// Un soin ordinaire n'est pas un événement autonome. Une permission, une
// convocation ou la maternité ne le deviennent qu'une fois leur branche
// qualifiée (Q2.7, Q2.10, Q2.14).
function evenementSansSoin(motif: GivenAnswer<Motif>): Fait {
  if (!motif.hasAnswer()) return Fait.inconnu("Q2.1 n'est pas validée.");
  const source = `Q2.1 : « ${motif.value} »`;
  if (motif.isOneOf(...SOINS)) return Fait.non(`${source}, un soin.`);
  return Fait.inconnu(`${source}, à qualifier dans sa branche.`);
}

// Q2.1.g : une entrée ou une sortie d'établissement.
const SEJOUR = { "1_ENTREE": "oui", "2_SORTIE": "oui" } as const;

// Ni séance qualifiante en Q1.3, ni séjour en Q2.1 : le soin ne qualifie pas
// le transport. Q2.1 est un choix unique : un autre motif écarte
// l'hospitalisation, et l'admission en HAD (Q2.1.g) n'est pas un séjour
// (`negation_precise_v1002` de `fait_situation_soins_qualifiante`).
function sansSeanceNiSejour(validated: Valides): Fait | PassesOn {
  const motif = validated.question("Q2.1");
  const sousType = validated.question("Q2.1.g");
  if (!motif.hasAnswer() || !CasParticuliers.of(validated).sansSeance())
    return undefined;
  const hospitalise = motif.is("8_HOSPITALISATION");
  if (hospitalise && sousType.isNot("3_ADMISSION_HAD")) return undefined;
  return Fait.non(
    hospitalise
      ? `Q2.1.g : « ${sousType.value} », pas un séjour ; Q1.3 sans séance.`
      : `Q2.1 : « ${motif.value} », pas une hospitalisation ; Q1.3 sans séance.`,
  );
}

// Une simple consultation, l'HAD à domicile ou un autre motif, sans séjour en
// cours, ne sont pas une hospitalisation (`non_ou_absence` du contrat). Il faut
// que Q2.2.1 ait proposé « déjà hospitalisé » et qu'il soit écarté. Le
// transfert et la permission se qualifient dans leur branche.
function sansSejourEnCours(validated: Valides): Fait | PassesOn {
  const sansSejour = sansSeanceNiSejour(validated);
  const contextes = validated.question("Q2.2.1");
  if (
    !sansSejour ||
    validated.question("Q2.1").isOneOf("9_TRANSFERT", "11_PERMISSION") ||
    !contextes.hasAnswer() ||
    !Sejour.of(validated).estEcarte()
  )
    return undefined;
  return Fait.non(
    `${sansSejour.provenance} Q2.2.1 : « déjà hospitalisé » écarté.`,
  );
}
