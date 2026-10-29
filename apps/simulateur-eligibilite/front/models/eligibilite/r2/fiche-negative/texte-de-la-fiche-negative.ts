// Le texte de la fiche patient négative (#134), pour `ISSUE_NON_ELIGIBLE`.
// Une fonction pure, sans React.
//
// Tous les mots viennent du catalogue de l'éditeur, recopiés tels quels. Ce
// fichier choisit la raison, puis range les textes de la fiche : il n'en écrit
// aucun. Elle lit ce que lit la raison (`ce-que-lit-un-texte.ts`). Depuis la
// v10.1.4 (TS1014-J05), ni cartes ni conseil sur l'ALD : le bloc de ce que
// l'Assurance Maladie ne rembourse pas les remplace.

import type {
  CatalogueResultats,
  IssueNegative,
} from "../../../../../core/models/eligibilite/declarations/catalogue-resultats";
import { type BlocDeConsigne, blocsDuTexte } from "../blocs-de-consigne";
import type { TraceDe } from "../ce-que-lit-un-texte";
import { LU_PAR_LA_RAISON, raisonNonEligible } from "./raison-non-eligible";

/** Ce que lit la fiche négative : ce que lit sa raison. */
export const LU_PAR_LA_FICHE_NEGATIVE = LU_PAR_LA_RAISON;

type Bloc = IssueNegative["finance"];

/** La fiche patient négative, et le titre que le prescripteur lit au-dessus. */
export type TexteDeLaFicheNegative = {
  readonly titreDuPrescripteur: string;
  readonly titreDuPatient: string;
  readonly raison: string;
  readonly informationInstitutionnelle: IssueNegative["institutionalInformation"];
  readonly consignes: {
    readonly titre: string;
    /** Absent quand le catalogue le laisse vide. */
    readonly sousTitre?: string;
    readonly blocs: readonly BlocDeConsigne[];
  };
  readonly finance: Bloc;
};

/** Le texte de la fiche négative pour cette trace. */
export function texteDeLaFicheNegative(
  catalogue: CatalogueResultats,
  trace: TraceDe<typeof LU_PAR_LA_FICHE_NEGATIVE>,
): TexteDeLaFicheNegative {
  const issue = catalogue.issues.ISSUE_NON_ELIGIBLE;
  const { intro, body } = issue.instructions;
  return {
    titreDuPrescripteur: issue.prescriberTitle,
    titreDuPatient: issue.title,
    raison: raisonNonEligible(issue, trace).text,
    informationInstitutionnelle: issue.institutionalInformation,
    consignes: {
      titre: intro.title,
      ...(intro.subtitle !== "" && { sousTitre: intro.subtitle }),
      blocs: blocsDuTexte(body),
    },
    finance: issue.finance,
  };
}
