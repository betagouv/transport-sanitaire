// L'expédition : une seconde adresse, refusée quand elle répète la première.
// L'incohérence se déclare sur la plus tardive des deux questions.

import type { Questions } from "../../catalogue.ts";
import { given, question } from "../../question.ts";

const factureRepetee = given
  .question("adresse")
  .answer()
  .computeWith(given.question("expedition").answer(), (facture, recu) =>
    sameAddress(facture.value, recu.value),
  );

export const EXPEDITION = question
  .address("expedition", "À quelle adresse envoyer le reçu ?")
  .hint(
    "Démontre : une incohérence de deux adresses. Celle de la facture, donnée plus haut, ne peut pas être répétée. Le message s'affiche sous le groupe, tous les champs en rouge. Une erreur de champ passe devant.",
  )
  .inconsistentWhen(
    factureRepetee,
    "Le reçu doit partir à une autre adresse que celle de la facture.",
  );

// ---- implémentation ----

// Deux adresses sont les mêmes quand leur voie, leur code postal et leur
// commune le sont, sans égard aux accents ni à la casse.
function sameAddress(
  first: Questions["adresse"] | undefined,
  second: Questions["expedition"] | undefined,
): boolean {
  if (!first || !second) return false;
  const key = ({ street, postalCode, city }: Questions["adresse"]) =>
    [street, postalCode ?? "", city]
      .map((part) =>
        part
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, "")
          .trim()
          .toLowerCase(),
      )
      .join("|");
  return key(first) === key(second);
}
