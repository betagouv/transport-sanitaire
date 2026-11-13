// Le modèle de démonstration : un questionnaire sans rapport avec le transport
// sanitaire, où chaque capacité du socle se voit à l'écran. Son métier est dans
// `core/models/fake/`. `main.tsx` le passe au socle.

import { model as core } from "../../../core/models/fake";
import type { Cibles } from "../../../core/models/fake/cibles/noms";
import type { Faits } from "../../../core/models/fake/faits/noms";
import type { Questions } from "../../../core/models/fake/questions/reponses";
import { given } from "../../../core/models/fake/questions/reponses";
import { defineModel } from "../../socle";
import { type Lecture as LectureDeR2, R2 } from "./r2";
import { type Lecture as LectureDeR3, R3 } from "./r3";

export const model = defineModel<
  Questions,
  Faits,
  Cibles,
  LectureDeR2["reading"],
  LectureDeR3["reading"]
>({
  core,
  result: {
    title: "Résultat",
    reading: R2.lit,
    content: (lecture) => R2.of(lecture).page(),
  },
  cerfa: {
    form: R3.document,
    title: R3.titre,
    reading: R3.lit,
    Resultat: R3.Page,
    startLabel: R3.boutonDeDepart,
    printLabel: "Imprimer le bon de commande",
    downloadLabel: "Télécharger le bon de commande",
  },
  // On vient goûter un thé, et commander un café. L'avis suit : sous le
  // premier résultat pour un thé, sous le second pour un café. Sans boisson,
  // rien ne se complète : il suit le premier résultat.
  intent: given
    .question("boisson")
    .answer()
    .is("cafe")
    .compute((cafe) => (cafe ? "prescribe" : "check")),
  feedback: {
    url: "https://example.com/avis",
    label: "Donnez votre avis sur cette démonstration",
  },
});
