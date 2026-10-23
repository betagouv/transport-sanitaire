// fait_permission : permission temporaire.
//
// Le séjour coché, seule Q2.2.1.a la dit : elle ne se pose qu'alors. Sinon,
// Q2.1 la dit. Le séjour écarté, l'entrée en établissement (Q2.1.g) ou la
// sortie vers la prison l'excluent.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { regles } from "../../../socle/index.ts";
import { RetourPenitentiaire } from "../concepts/retour-penitentiaire.ts";
import { Sejour } from "../concepts/sejour.ts";
import type { DeclarationDeFait } from "../declarations/faits.ts";

export const permission: DeclarationDeFait = ({ validated }) =>
  regles()
    .retient(RetourPenitentiaire.of(validated).nonSiSortieVersLaPrison())
    .nonSi(
      validated.question("Q2.2.1").hasAnswer() &&
        Sejour.of(validated).commenceAvecCeTrajet(),
      "Q2.1.g : « 1_ENTREE » ; aucun séjour en cours, donc aucune permission.",
    )
    .retient(Sejour.of(validated).nonSiEcarte())
    .selon(validated.question("Q2.2.1.a"), { "1_OUI": "oui", "2_NON": "non" })
    .selon(validated.question("Q2.1"), { "11_PERMISSION": "oui" })
    .sinon("Ni Q2.1, ni Q2.2.1 n'établissent encore de permission.");
