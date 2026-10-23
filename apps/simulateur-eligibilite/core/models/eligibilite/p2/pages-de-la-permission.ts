// Les deux pages de la permission, après les exceptions de l'article 80 : Q2.7
// pour la tranche d'âge et le cadre, puis Q2.8 pour le patient de moins de
// 20 ans, sur une seule page (D-107).

import { page } from "../../../socle/index.ts";
import { Permission } from "../concepts/permission.ts";
import { type Context, question } from "../question.ts";
import { optionsAdultesAProposer } from "./permission.ts";

// Q2.7 se pose dès que la permission est un fait, par Q2.1 ou par Q2.2.1.a. Un
// patient de moins de 18 ans en Q1.3 ne se propose pas adulte. Q2.7.a confirme
// la facturation d'un transport exceptionnel, sous le choix qui l'ouvre.
export const PAGE_DE_LA_PERMISSION = page(
  "P2/permission",
  question
    .singleChoice(
      "Q2.7",
      "Dans quelle tranche d’âge se situe le patient pendant la période prescrite et quel est le cadre de la permission ?",
    )
    .askedIf(({ faits }) => faits.fait_permission.isOui())
    .option("3_ADULTE_AUTORISEE", (option) =>
      option.offeredIf(adultesAProposer),
    )
    .option("4_ADULTE_A_SA_CHARGE", (option) =>
      option.offeredIf(adultesAProposer),
    ),
  question
    .singleChoice(
      "Q2.7.a",
      "L’établissement confirme-t-il que ce transport correspond à une prestation exceptionnelle facturable au patient ?",
    )
    .hint(
      "La seule préférence personnelle ne suffit pas. Vérifier la demande écrite, l’absence de fondement médical, l’absence de couverture par les tarifs de l’établissement et l’information du patient sur le prix et la facturation.",
    )
    .askedIf(({ answers }) => Permission.of(answers).estAChargeDuPatient())
    .dependsOn("Q2.7"),
);

// Les caractéristiques de la permission d'un patient de moins de 20 ans : tout
// le lot sur une page. Chaque contrôle se déclare sur la plus tardive des
// deux questions qu'il compare.
export const PAGE_DE_LA_PERMISSION_DU_MINEUR = page(
  "P2/permission-mineur",
  question
    .date("Q2.8.1", "Depuis quelle date le patient est-il hospitalisé ?")
    .askedIf(mineurAPoser),
  question
    .datetime("Q2.8.2", "Quand commence la première permission ?")
    .askedIf(mineurAPoser)
    .inconsistentIf(
      ({ answers }) => Permission.of(answers).commenceAvantLHospitalisation(),
      "La permission ne peut pas commencer avant le début de l’hospitalisation.",
    )
    .inconsistentIf(
      ({ answers }) => Permission.of(answers).commenceAvantLeQuatorziemeJour(),
      "La première permission doit commencer au 14e jour d’hospitalisation ou après.",
    ),
  question
    .datetime("Q2.8.3", "Quand se termine cette première permission ?")
    .askedIf(mineurAPoser)
    .inconsistentIf(
      ({ answers }) => Permission.of(answers).neFinitPasApresSonDebut(),
      "La fin de la permission doit venir après son début.",
    )
    .inconsistentIf(
      ({ answers }) => Permission.of(answers).depasseQuaranteHuitHeures(),
      "Une permission dure au plus 48 heures.",
    ),
  question
    .singleChoice(
      "Q2.8.4",
      "Cette permission a-t-elle été autorisée par l’établissement après avis favorable du médecin chef de service ?",
    )
    .askedIf(mineurAPoser),
  question
    .singleChoice("Q2.8.4.a", "Quel est le cadre de cette permission ?")
    .hint(
      "Chez un patient de moins de 20 ans, une demande personnelle n’établit pas à elle seule une charge patient ; appliquer les conditions S3141.",
    )
    .askedIf(mineurAPoser),
  question
    .singleChoice(
      "Q2.8.5",
      "La prescription couvre-t-elle plusieurs permissions ?",
    )
    .askedIf(mineurAPoser),
  question
    .date("Q2.8.6", "Jusqu’à quelle date ces permissions sont-elles prévues ?")
    .askedIf(plusieursPermissions)
    .dependsOn("Q2.8.5")
    .inconsistentIf(
      ({ answers }) => Permission.of(answers).periodeFinitAvantLaPremiere(),
      "La période ne peut pas se terminer avant la fin de la première permission.",
    ),
  question
    .number(
      "Q2.8.6.a",
      "Une permission aller-retour est prévue toutes les combien de semaines ?",
    )
    .hint(
      "1 = chaque semaine ; 2 = toutes les deux semaines. Pour des permissions irrégulières, qualifier séparément les périodes concernées.",
    )
    .integer()
    .min(1)
    .unit("semaine(s)")
    .askedIf(plusieursPermissions)
    .dependsOn("Q2.8.5"),
  question
    .singleChoice(
      "Q2.8.6.b",
      "Le patient restera-t-il âgé de moins de 20 ans durant toute la période ?",
    )
    .askedIf(plusieursPermissions)
    .dependsOn("Q2.8.5")
    .option("2_NON", (option) =>
      option.blocks(
        "La période doit se terminer avant le vingtième anniversaire du patient. Raccourcissez-la, puis faites une autre simulation pour la période suivante.",
      ),
    ),
);

// ---- implémentation ----

function adultesAProposer({ validated }: Context): boolean {
  return optionsAdultesAProposer(validated);
}

function mineurAPoser({ validated }: Context): boolean {
  return Permission.of(validated).estDUnMineurDeVingtAns();
}

function plusieursPermissions(context: Context): boolean {
  return mineurAPoser(context) && Permission.of(context.answers).estRepetee();
}
