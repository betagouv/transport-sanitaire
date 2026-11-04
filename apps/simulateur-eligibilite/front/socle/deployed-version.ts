// Ce qui tourne : la version de l'app et le commit déployé.
//
// Vite remplace ces valeurs à la construction. Les replis servent aux outils
// qui compilent ce fichier sans Vite.

export const VERSION_APP: string =
  import.meta.env.VITE_VERSION_APP ?? "inconnue";

export const SHA_COMMIT: string = import.meta.env.VITE_SHA_COMMIT ?? "inconnu";
