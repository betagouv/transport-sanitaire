// Le mode de transport : les faits que les réponses de P1 établissent, et le
// mode que les règles en tirent avant la fin du questionnaire.
//
// Chaque fait suit `CONTRAT_REPONSES_FAITS.json` et
// `CORRECTIF_FAITS_SANS_REPONSE.md` du paquet de l'éditeur : ce qui le met à
// « oui », ce qui le met à « non », et ce qui le laisse absent. Il ne lit que
// les questions validées.

import { Fait, type GivenAnswer, type ValidatedAnswers } from "../../../socle";
import type { Cibles } from "../declarations/cibles";
import { AUCUN_FAIT, type Faits } from "../declarations/faits";
import type { Questions } from "../declarations/questions";
import { cible } from "../evaluation-des-regles";
import { sansProfessionnel } from "./reponses";

type Valides = ValidatedAnswers<Questions>;
type Critere = Questions["Q1.2"][number];
type Cas = GivenAnswer<Questions["Q1.3"]>;

/** Les faits que Q1.1 à Q1.4 établissent, ou laissent absents. */
export function faitsDuMode(validated: Valides) {
  return {
    ...faitsDeQ11(validated),
    ...faitsDesCriteres(validated),
    ...faitsDeQ13(validated),
    fait_prefere_transport_commun: prefereLeTransportCommun(validated),
  } satisfies Partial<Faits>;
}

/**
 * Le mode que les règles retiennent pour ces réponses. Elles ne le rendent
 * qu'une fois P1 complète : elle est tenue pour telle, le temps de la poser.
 */
export function modeDe(validated: Valides): Cibles["cible_mode_id"] {
  return cible(
    {
      ...AUCUN_FAIT,
      ...faitsDuMode(validated),
      fait_p1_complete: Fait.oui("P1 en cours."),
    },
    "cible_mode_id",
  );
}

// ---- implémentation ----

const PROFESSIONNEL = "3_AVEC_UN_PROFESSIONNEL";

// Les options de Q1.2 qui donnent chaque critère.
const CRITERES = {
  fait_critere_tap: [
    "1_PAS_AUTONOME",
    "2_AIDE_TECHNIQUE",
    "3_TRANSMISSION_PAR_UN_PROFESSIONNEL",
    "4_HYGIENE",
    "5_RISQUE_DE_MALAISE",
  ],
  fait_critere_fauteuil: ["6_FAUTEUIL_SANS_TRANSFERT"],
  fait_critere_allonge: ["7_ALLONGE"],
  fait_critere_brancard: ["8_BRANCARDAGE"],
  fait_critere_surveillance: ["9_SURVEILLANCE"],
  fait_critere_oxygene: ["10_OXYGENE"],
  fait_critere_asepsie: ["11_ASEPSIE"],
} as const satisfies Record<string, readonly Critere[]>;

// Q1.1 dit qui aide le patient : personne, un proche, ou un professionnel.
function faitsDeQ11(validated: Valides) {
  const reponse = validated.question("Q1.1");
  if (!reponse.hasAnswer()) {
    const attente = Fait.inconnu("Q1.1 n'est pas encore validée.");
    return {
      fait_autonomie_professionnel: attente,
      fait_accompagnant: attente,
    };
  }
  const source = `Q1.1 : « ${reponse.value} ».`;
  return {
    fait_autonomie_professionnel: reponse.is(PROFESSIONNEL)
      ? Fait.oui(source)
      : Fait.non(source),
    fait_accompagnant: reponse.is("2_AVEC_UN_PROCHE")
      ? Fait.oui(source)
      : Fait.non(source),
  };
}

// Un critère de Q1.2 est coché, ou ne l'est pas. Q1.2 ne se pose pas sans
// professionnel : aucun critère ne vaut alors.
function faitsDesCriteres(validated: Valides) {
  const qui = validated.question("Q1.1");
  const criteres = validated.question("Q1.2");
  const critere = (options: readonly Critere[]): Fait => {
    if (criteres.hasAnswer()) {
      const coche = options.find((option) => criteres.checked(option));
      return coche
        ? Fait.oui(`Q1.2 : « ${coche} » coché.`)
        : Fait.non(`Q1.2 validée sans « ${options.join(" », « ")} ».`);
    }
    if (sansProfessionnel(qui))
      return Fait.non(
        "Q1.2 ne se pose pas : aucun professionnel n'intervient.",
      );
    return Fait.inconnu("Q1.2 n'est pas encore validée.");
  };
  return Object.fromEntries(
    Object.entries(CRITERES).map(([fait, options]) => [fait, critere(options)]),
  ) as Record<keyof typeof CRITERES, Fait>;
}

// Q1.3 : les cas particuliers. Les séances ne donnent ici que leur « oui » :
// leur « non » attend Q2.1.g, en P2.
function faitsDeQ13(validated: Valides) {
  const cas = validated.question("Q1.3");
  if (!cas.hasAnswer()) {
    const attente = Fait.inconnu("Q1.3 n'est pas encore validée.");
    return {
      fait_partage_incompatible: attente,
      fait_bariatrique: attente,
      fait_ald_liee: attente,
      fait_ald_exonerante_3_ou_4: attente,
      fait_mineur_soins_prolonges_reconnus: attente,
      fait_situation_soins_qualifiante: attente,
      fait_hospitalisation: attente,
    };
  }
  const coche = (option: Questions["Q1.3"][number]) =>
    cas.checked(option)
      ? Fait.oui(`Q1.3 : « ${option} » coché.`)
      : Fait.non(`Q1.3 validée sans « ${option} ».`);
  const seance = seanceQualifiante(validated, cas);
  return {
    fait_partage_incompatible: coche("6_PARTAGE_INCOMPATIBLE"),
    fait_bariatrique: coche("1_FORTE_CORPULENCE"),
    ...faitsDeLAldEtDuMineur(validated, cas),
    fait_situation_soins_qualifiante: seance,
    fait_hospitalisation: seance,
  };
}

// L'ALD et le mineur en soins continus (CONTRAT_Q13_ALD_MINEUR.json). Cochée,
// la réponse 2 dit le 100 % ; non cochée, elle ne dit rien du statut de
// l'ALD, qui reste absent. Le lien de l'ALD, comme la reconnaissance du
// mineur, demande en plus la preuve clinique de P1.
function faitsDeLAldEtDuMineur(validated: Valides, cas: Cas) {
  const preuve = preuveClinique(validated);
  const fondement = (option: Questions["Q1.3"][number]): Fait => {
    if (!cas.checked(option))
      return Fait.non(`Q1.3 validée sans « ${option} ».`);
    return {
      ...preuve,
      provenance: `Q1.3 : « ${option} » coché. ${preuve.provenance}`,
    };
  };
  return {
    fait_ald_liee: fondement("2_ALD"),
    fait_ald_exonerante_3_ou_4: cas.checked("2_ALD")
      ? Fait.oui("Q1.3 : « 2_ALD » coché, pris en charge à 100 %.")
      : Fait.inconnu(
          "Q1.3 validée sans « 2_ALD » : le statut de l'ALD reste inconnu.",
        ),
    fait_mineur_soins_prolonges_reconnus: fondement("8_MINEUR_SOINS_CONTINUS"),
  };
}

// L'aide nécessaire d'un proche (Q1.1 réponse 2), ou un critère de Q1.2. Le
// patient qui se déplace seul n'a pas de déficience. Une Q1.2 qui ne se pose
// pas, après un proche, n'en dit pas l'absence.
function preuveClinique(validated: Valides): Fait {
  const qui = validated.question("Q1.1");
  if (qui.is("2_AVEC_UN_PROCHE"))
    return Fait.oui("Q1.1 : l'aide d'un proche est nécessaire.");
  if (qui.is("1_SEUL")) return Fait.non("Q1.1 : le patient se déplace seul.");
  const [critere] = validated.question("Q1.2").checkedBoxes();
  if (qui.is(PROFESSIONNEL) && critere)
    return Fait.oui(`Q1.2 : « ${critere} » coché.`);
  return Fait.inconnu("Ni Q1.1 ni Q1.2 n'établissent encore une déficience.");
}

// Une chimiothérapie, une radiothérapie, ou une hémodialyse confirmée par
// Q1.3.a. Une autre dialyse, ou une dialyse non précisée, ne suffit pas.
function seanceQualifiante(validated: Valides, cas: Cas): Fait {
  const seance = (["3_CHIMIOTHERAPIE", "4_RADIOTHERAPIE"] as const).find(
    (option) => cas.checked(option),
  );
  if (seance) return Fait.oui(`Q1.3 : « ${seance} » coché.`);
  if (validated.question("Q1.3.a").is("1_OUI"))
    return Fait.oui("Q1.3.a : une séance d'hémodialyse.");
  return Fait.inconnu("Aucune séance qualifiante en P1 : Q2.1.g décidera.");
}

// Q1.4 ne se pose qu'au patient qui se passe d'un professionnel. Sinon, la
// préférence est sans objet : elle vaut « non ».
function prefereLeTransportCommun(validated: Valides): Fait {
  const preference = validated.question("Q1.4");
  if (preference.hasAnswer()) {
    const source = `Q1.4 : « ${preference.value} ».`;
    return preference.is("2_TRANSPORTS_EN_COMMUN")
      ? Fait.oui(source)
      : Fait.non(source);
  }
  if (validated.question("Q1.1").is(PROFESSIONNEL))
    return Fait.non("Q1.4 ne se pose pas : un professionnel intervient.");
  return Fait.inconnu("Q1.4 n'est pas encore validée.");
}
