// Les questions du modèle, sous l'identifiant que l'éditeur leur donne, et le
// type de la réponse de chacune.
//
// Une option se répond par un slug : son numéro dans le catalogue de l'éditeur,
// puis ce qu'elle veut dire. Le libellé est celui du catalogue, mot pour mot.
// Les options se déclarent dans l'ordre du catalogue : c'est l'ordre de l'écran.

/** Les options de chaque question à choix : leur slug, et leur libellé. */
export const OPTIONS = {
  /** Quel est votre besoin ? */
  "Q0.1": {
    "1_VERIFIER": "Vérifier une éligibilité",
    "2_VERIFIER_ET_PRESCRIRE":
      "Vérifier et prescrire si la situation le permet",
  },
} as const;

type Option<Id extends keyof typeof OPTIONS> = keyof (typeof OPTIONS)[Id];

export type Questions = {
  "Q0.1": Option<"Q0.1">;
};
