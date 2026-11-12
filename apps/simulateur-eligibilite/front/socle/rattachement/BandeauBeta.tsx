// Le bandeau qui prévient, sur l'écran de rattachement, que le simulateur est
// en bêta et que les données sont des données de test (#376). Il ne s'affiche
// que sur un environnement qui le demande, par `VITE_BANDEAU_BETA=true`.

import { Notice } from "@codegouvfr/react-dsfr/Notice";

/**
 * Vrai si l'environnement demande le bandeau. La variable est lue au build,
 * comme toute variable `VITE_*` : la changer demande un nouveau déploiement.
 */
export function bandeauBetaDemande(env: Env = import.meta.env): boolean {
  const valeur = env.VITE_BANDEAU_BETA;
  return typeof valeur === "string" && valeur.trim() === "true";
}

export function BandeauBeta() {
  return (
    <Notice
      title="Version bêta : l'ensemble des données sont des données de test."
      severity="info"
      className="fr-mb-3w"
    />
  );
}

// ---- implémentation ----

// Ce que Vite expose du build. La clé n'y est pas déclarée : une variable
// `VITE_*` absente du `.env` n'existe pas.
type Env = { readonly [variable: string]: unknown };
