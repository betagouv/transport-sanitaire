// Le modèle de démonstration : un questionnaire sans rapport avec le transport
// sanitaire, où chaque capacité du socle se voit à l'écran. Son métier est dans
// `core/models/fake/`. `main.tsx` le passe au socle.

import { model as core } from "../../../core/models/fake";
import { ModelFactory } from "../../socle";
import { pageDeR2 } from "./r2";
import { R3 } from "./r3";

export const model = ModelFactory.define({
  core,
  version: "1.0.0",
  result: { title: "Résultat", content: pageDeR2 },
  cerfa: {
    places: R3.endroits,
    Resultat: R3.Page,
    printLabel: "Imprimer le bon de commande",
    downloadLabel: "Télécharger le bon de commande",
  },
  feedback: {
    url: "https://example.com/avis",
    label: "Donnez votre avis sur cette démonstration",
  },
});
