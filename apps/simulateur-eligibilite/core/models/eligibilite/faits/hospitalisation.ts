// fait_hospitalisation : hospitalisation ou séance assimilée établie.
//
// Un transfert depuis un séjour coché, ou un autre déplacement pendant le
// séjour (Q2.5), l'établit. Sans séance ni séjour, et « déjà hospitalisé »
// écarté en Q2.2.1, il vaut « non ». Une entrée ou une sortie d'établissement
// (Q2.1.g) l'établit aussi. Sinon, la séance de P1 décide : l'admission en HAD
// à domicile ne l'établit pas seule.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import {
  Fait,
  type PassesOn,
  regles,
  type ValidatedAnswers,
} from "../../../socle/index.ts";
import { Sejour } from "../concepts/sejour.ts";
import { Soin } from "../concepts/soin.ts";
import type { DeclarationDeFait } from "../declarations/faits.ts";
import type { Questions } from "../declarations/questions.ts";

export const hospitalisation: DeclarationDeFait = ({ validated }) => {
  const soin = Soin.of(validated);
  return regles()
    .retient(parLeDeplacement(validated))
    .retient(sansSejourEnCours(validated, soin))
    .retient(soin.parEntreeOuSortie())
    .sinon(soin.seanceDeP1());
};

// ---- implémentation ----

type Valides = ValidatedAnswers<Questions>;

// Un séjour coché avant un transfert entre établissements, ou un autre
// déplacement pendant le séjour. Un transfert depuis les urgences n'établit pas
// de séjour.
function parLeDeplacement(validated: Valides): Fait | PassesOn {
  const deplacement = validated.question("Q2.5");
  if (deplacement.is("1_TRANSFERT") && Sejour.of(validated).estCoche())
    return Fait.oui("Q2.2.1 : séjour coché, Q2.5 : « 1_TRANSFERT ».");
  if (deplacement.is("2_AUTRE_DEPLACEMENT"))
    return Fait.oui("Q2.5 : « 2_AUTRE_DEPLACEMENT ».");
  return undefined;
}

// Une simple consultation, l'HAD à domicile ou un autre motif, sans séjour en
// cours, ne sont pas une hospitalisation (`non_ou_absence` du contrat). Il faut
// que Q2.2.1 ait proposé « déjà hospitalisé » et qu'il soit écarté. Le
// transfert et la permission se qualifient dans leur branche.
function sansSejourEnCours(validated: Valides, soin: Soin): Fait | PassesOn {
  const sansSejour = soin.sansSeanceNiSejour();
  if (
    !sansSejour ||
    validated.question("Q2.1").isOneOf("9_TRANSFERT", "11_PERMISSION") ||
    !validated.question("Q2.2.1").hasAnswer() ||
    !Sejour.of(validated).estEcarte()
  )
    return undefined;
  return Fait.non(
    `${sansSejour.provenance} Q2.2.1 : « déjà hospitalisé » écarté.`,
  );
}
