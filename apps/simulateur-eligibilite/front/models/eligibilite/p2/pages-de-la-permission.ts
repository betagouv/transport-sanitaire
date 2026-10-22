// Les deux pages de la permission, après les exceptions de l'article 80 : Q2.7
// pour la tranche d'âge et le cadre, puis Q2.8 pour le patient de moins de
// 20 ans, sur une seule page (D-107).

import type { QuestionnairePart } from "../../../socle";
import type { Questions } from "../declarations/questions";
import { type Context, question } from "../question";
import {
  commenceAvantLeQuatorzieme,
  commenceAvantLHospitalisation,
  depasseQuaranteHuitHeures,
  finNonPosterieure,
  periodeAvantLaFinDeLaPermission,
} from "./dates-de-la-permission";
import { mineurDeVingtAns, optionsAdultesAProposer } from "./permission";

type Page = QuestionnairePart<Questions, undefined>["pages"][number];

// Q2.7 se pose dès que la permission est un fait, par Q2.1 ou par Q2.2.1.a. Un patient de moins de 18
// ans en Q1.3 ne se propose pas adulte. Q2.7.a confirme la facturation d'un
// transport exceptionnel, sous le choix qui l'ouvre.
export const PAGE_DE_LA_PERMISSION: Page = {
  id: "P2/permission",
  questions: [
    question.singleChoice("Q2.7", {
      label:
        "Dans quelle tranche d’âge se situe le patient pendant la période prescrite et quel est le cadre de la permission ?",
      askedIf: ({ faits }) => faits.fait_permission.value === true,
      options: {
        "3_ADULTE_AUTORISEE": { offeredIf: adultesAProposer },
        "4_ADULTE_A_SA_CHARGE": { offeredIf: adultesAProposer },
      },
    }),
    question.singleChoice("Q2.7.a", {
      label:
        "L’établissement confirme-t-il que ce transport correspond à une prestation exceptionnelle facturable au patient ?",
      hint: "La seule préférence personnelle ne suffit pas. Vérifier la demande écrite, l’absence de fondement médical, l’absence de couverture par les tarifs de l’établissement et l’information du patient sur le prix et la facturation.",
      askedIf: ({ answers }) =>
        answers.question("Q2.7").is("4_ADULTE_A_SA_CHARGE"),
      dependsOn: ["Q2.7"],
    }),
  ],
};

// Les caractéristiques de la permission d'un patient de moins de 20 ans : tout
// le lot sur une page. Chaque contrôle se déclare sur la plus tardive des
// deux questions qu'il compare.
export const PAGE_DE_LA_PERMISSION_DU_MINEUR: Page = {
  id: "P2/permission-mineur",
  questions: [
    question.date("Q2.8.1", {
      label: "Depuis quelle date le patient est-il hospitalisé ?",
      askedIf: mineurAPoser,
    }),
    question.datetime("Q2.8.2", {
      label: "Quand commence la première permission ?",
      askedIf: mineurAPoser,
      inconsistenciesFrom: ({ answers }) => [
        ...(commenceAvantLHospitalisation(
          answers.question("Q2.8.1").value,
          answers.question("Q2.8.2").value,
        )
          ? [
              "La permission ne peut pas commencer avant le début de l’hospitalisation.",
            ]
          : []),
        ...(commenceAvantLeQuatorzieme(
          answers.question("Q2.8.1").value,
          answers.question("Q2.8.2").value,
        )
          ? [
              "La première permission doit commencer au 14e jour d’hospitalisation ou après.",
            ]
          : []),
      ],
    }),
    question.datetime("Q2.8.3", {
      label: "Quand se termine cette première permission ?",
      askedIf: mineurAPoser,
      inconsistenciesFrom: ({ answers }) => [
        ...(finNonPosterieure(
          answers.question("Q2.8.2").value,
          answers.question("Q2.8.3").value,
        )
          ? ["La fin de la permission doit venir après son début."]
          : []),
        ...(depasseQuaranteHuitHeures(
          answers.question("Q2.8.2").value,
          answers.question("Q2.8.3").value,
        )
          ? ["Une permission dure au plus 48 heures."]
          : []),
      ],
    }),
    question.singleChoice("Q2.8.4", {
      label:
        "Cette permission a-t-elle été autorisée par l’établissement après avis favorable du médecin chef de service ?",
      askedIf: mineurAPoser,
    }),
    question.singleChoice("Q2.8.4.a", {
      label: "Quel est le cadre de cette permission ?",
      hint: "Chez un patient de moins de 20 ans, une demande personnelle n’établit pas à elle seule une charge patient ; appliquer les conditions S3141.",
      askedIf: mineurAPoser,
    }),
    question.singleChoice("Q2.8.5", {
      label: "La prescription couvre-t-elle plusieurs permissions ?",
      askedIf: mineurAPoser,
    }),
    question.date("Q2.8.6", {
      label: "Jusqu’à quelle date ces permissions sont-elles prévues ?",
      askedIf: plusieursPermissions,
      dependsOn: ["Q2.8.5"],
      inconsistenciesFrom: ({ answers }) =>
        periodeAvantLaFinDeLaPermission(
          answers.question("Q2.8.6").value,
          answers.question("Q2.8.3").value,
        )
          ? [
              "La période ne peut pas se terminer avant la fin de la première permission.",
            ]
          : [],
    }),
    question.number("Q2.8.6.a", {
      label:
        "Une permission aller-retour est prévue toutes les combien de semaines ?",
      hint: "1 = chaque semaine ; 2 = toutes les deux semaines. Pour des permissions irrégulières, qualifier séparément les périodes concernées.",
      integer: true,
      min: 1,
      unit: "semaine(s)",
      askedIf: plusieursPermissions,
      dependsOn: ["Q2.8.5"],
    }),
    question.singleChoice("Q2.8.6.b", {
      label:
        "Le patient restera-t-il âgé de moins de 20 ans durant toute la période ?",
      askedIf: plusieursPermissions,
      dependsOn: ["Q2.8.5"],
      options: {
        "2_NON": {
          blocks:
            "La période doit se terminer avant le vingtième anniversaire du patient. Raccourcissez-la, puis faites une autre simulation pour la période suivante.",
        },
      },
    }),
  ],
};

// ---- implémentation ----

function adultesAProposer({ validated }: Context): boolean {
  return optionsAdultesAProposer(validated);
}

function mineurAPoser({ validated }: Context): boolean {
  return mineurDeVingtAns(validated);
}

function plusieursPermissions(context: Context): boolean {
  return (
    mineurAPoser(context) && context.answers.question("Q2.8.5").is("1_OUI")
  );
}
