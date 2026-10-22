// Le mode de transport : les faits que les réponses de P1 établissent, et le
// mode que les règles en tirent avant la fin du questionnaire.
//
// Chaque fait suit `CONTRAT_REPONSES_FAITS.json` et
// `CORRECTIF_FAITS_SANS_REPONSE.md` du paquet de l'éditeur : ce qui le met à
// « oui », ce qui le met à « non », et ce qui le laisse absent. Il ne lit que
// les questions validées.

import { Fait, regles, type ValidatedAnswers } from "../../../socle/index.ts";
import type { Cibles } from "../declarations/cibles.ts";
import type { DeclarationsDeFaits, Faits } from "../declarations/faits.ts";
import type { Questions } from "../declarations/questions.ts";
import { cible } from "../evaluation-des-regles.ts";
import { sansProfessionnel } from "./reponses.ts";

type Valides = ValidatedAnswers<Questions>;
type Critere = Questions["Q1.2"][number];
type Cas = Questions["Q1.3"][number];

/**
 * Le mode que les règles retiennent pour ces faits. Elles ne le donnent
 * qu'une fois P1 complète : elle est tenue pour telle, le temps de la poser.
 */
export function modeDe(faits: Faits): Cibles["cible_mode_id"] {
  return cible(
    { ...faits, fait_p1_complete: Fait.oui("P1 en cours.") },
    "cible_mode_id",
  );
}

/** Les faits que Q1.1 à Q1.4 établissent, ou laissent absents. */
export const FAITS_DU_MODE: DeclarationsDeFaits = {
  fait_autonomie_professionnel: ({ validated }) =>
    regles()
      .selon(validated.question("Q1.1"), {
        "1_SEUL": "non",
        "2_AVEC_UN_PROCHE": "non",
        [PROFESSIONNEL]: "oui",
      })
      .sinon(Q11_EN_ATTENTE),
  fait_accompagnant: ({ validated }) =>
    regles()
      .selon(validated.question("Q1.1"), {
        "1_SEUL": "non",
        "2_AVEC_UN_PROCHE": "oui",
        [PROFESSIONNEL]: "non",
      })
      .sinon(Q11_EN_ATTENTE),
  fait_critere_tap: ({ validated }) =>
    critere(validated, CRITERES.fait_critere_tap),
  fait_critere_fauteuil: ({ validated }) =>
    critere(validated, CRITERES.fait_critere_fauteuil),
  fait_critere_allonge: ({ validated }) =>
    critere(validated, CRITERES.fait_critere_allonge),
  fait_critere_brancard: ({ validated }) =>
    critere(validated, CRITERES.fait_critere_brancard),
  fait_critere_surveillance: ({ validated }) =>
    critere(validated, CRITERES.fait_critere_surveillance),
  fait_critere_oxygene: ({ validated }) =>
    critere(validated, CRITERES.fait_critere_oxygene),
  fait_critere_asepsie: ({ validated }) =>
    critere(validated, CRITERES.fait_critere_asepsie),
  fait_partage_incompatible: ({ validated }) =>
    casCoche(validated, "6_PARTAGE_INCOMPATIBLE"),
  fait_bariatrique: ({ validated }) =>
    casCoche(validated, "1_FORTE_CORPULENCE"),
  fait_ald_liee: ({ validated }) => fondement(validated, "2_ALD"),
  fait_ald_exonerante_3_ou_4: ({ validated }) =>
    regles()
      .ouiSi(
        validated.question("Q1.3").checked("2_ALD"),
        "Q1.3 : « 2_ALD » coché, pris en charge à 100 %.",
      )
      .sinon(
        validated.question("Q1.3").hasAnswer()
          ? "Q1.3 validée sans « 2_ALD » : le statut de l'ALD reste inconnu."
          : Q13_EN_ATTENTE,
      ),
  fait_mineur_soins_prolonges_reconnus: ({ validated }) =>
    fondement(validated, "8_MINEUR_SOINS_CONTINUS"),
  // Q1.3 n'a pas de réponse « je ne peux pas le vérifier » : Q2.2.2 à Q2.2.4,
  // les rattrapages, ne se posent pas (D-109).
  fait_mineur_soins_prolonges_a_verifier: () =>
    Fait.inconnu(
      "Aucune question ne le pose : Q1.3 n'a pas de réponse « je ne peux pas le vérifier » (D-109).",
    ),
  // Q1.4 ne se pose qu'au patient qui se passe d'un professionnel. Sinon, la
  // préférence est sans objet : elle vaut « non ».
  fait_prefere_transport_commun: ({ validated }) =>
    regles()
      .selon(validated.question("Q1.4"), {
        "1_VEHICULE_PERSONNEL": "non",
        "2_TRANSPORTS_EN_COMMUN": "oui",
      })
      .nonSi(
        validated.question("Q1.1").is(PROFESSIONNEL),
        "Q1.4 ne se pose pas : un professionnel intervient.",
      )
      .sinon("Q1.4 n'est pas encore validée."),
};

/**
 * La séance qualifiante que P1 établit : une chimiothérapie, une
 * radiothérapie, ou une hémodialyse confirmée par Q1.3.a. Une autre dialyse,
 * ou une dialyse non précisée, ne suffit pas. Son « non » attend Q2.1.g, en P2.
 */
export function seanceDeP1(validated: Valides): Fait {
  const cas = validated.question("Q1.3");
  const seance = (["3_CHIMIOTHERAPIE", "4_RADIOTHERAPIE"] as const).find(
    (option) => cas.checked(option),
  );
  return regles()
    .ouiSi(seance !== undefined, `Q1.3 : « ${seance} » coché.`)
    .ouiSi(
      validated.question("Q1.3.a").is("1_OUI"),
      "Q1.3.a : une séance d'hémodialyse.",
    )
    .sinon(
      cas.hasAnswer()
        ? "Aucune séance qualifiante en P1 : Q2.1.g décidera."
        : Q13_EN_ATTENTE,
    );
}

// ---- implémentation ----

const PROFESSIONNEL = "3_AVEC_UN_PROFESSIONNEL";
const Q11_EN_ATTENTE = "Q1.1 n'est pas encore validée.";
const Q13_EN_ATTENTE = "Q1.3 n'est pas encore validée.";

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

// Un critère de Q1.2 est coché, ou ne l'est pas. Q1.2 ne se pose pas sans
// professionnel : aucun critère ne vaut alors.
function critere(validated: Valides, options: readonly Critere[]): Fait {
  const criteres = validated.question("Q1.2");
  const coche = options.find((option) => criteres.checked(option));
  return regles()
    .ouiSi(coche !== undefined, `Q1.2 : « ${coche} » coché.`)
    .nonSi(
      criteres.hasAnswer(),
      `Q1.2 validée sans « ${options.join(" », « ")} ».`,
    )
    .nonSi(
      sansProfessionnel(validated.question("Q1.1")),
      "Q1.2 ne se pose pas : aucun professionnel n'intervient.",
    )
    .sinon("Q1.2 n'est pas encore validée.");
}

// Un cas de Q1.3, coché ou non, une fois Q1.3 validée.
function casCoche(validated: Valides, option: Cas): Fait {
  const cas = validated.question("Q1.3");
  return regles()
    .ouiSi(cas.checked(option), `Q1.3 : « ${option} » coché.`)
    .nonSi(cas.hasAnswer(), `Q1.3 validée sans « ${option} ».`)
    .sinon(Q13_EN_ATTENTE);
}

// L'ALD et le mineur en soins continus (CONTRAT_Q13_ALD_MINEUR.json). Le lien
// de l'ALD, comme la reconnaissance du mineur, demande en plus la preuve
// clinique de P1.
function fondement(validated: Valides, option: Cas): Fait {
  const cas = validated.question("Q1.3");
  if (!cas.checked(option)) return casCoche(validated, option);
  const preuve = preuveClinique(validated);
  return preuve.avecProvenance(
    `Q1.3 : « ${option} » coché. ${preuve.provenance}`,
  );
}

// L'aide nécessaire d'un proche (Q1.1 réponse 2), ou un critère de Q1.2. Le
// patient qui se déplace seul n'a pas de déficience. Une Q1.2 qui ne se pose
// pas, après un proche, n'en dit pas l'absence.
function preuveClinique(validated: Valides): Fait {
  const qui = validated.question("Q1.1");
  const [critere] = validated.question("Q1.2").checkedBoxes();
  return regles()
    .ouiSi(
      qui.is("2_AVEC_UN_PROCHE"),
      "Q1.1 : l'aide d'un proche est nécessaire.",
    )
    .nonSi(qui.is("1_SEUL"), "Q1.1 : le patient se déplace seul.")
    .ouiSi(
      qui.is(PROFESSIONNEL) && critere !== undefined,
      `Q1.2 : « ${critere} » coché.`,
    )
    .sinon("Ni Q1.1 ni Q1.2 n'établissent encore une déficience.");
}
