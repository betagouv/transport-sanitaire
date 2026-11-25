// Le complément de la commande, après le verrou : il complète, il ne décide
// plus. Ses pages, dans l'ordre, faites de ses questions (`questions/`).

import { afterLock, page } from "../../../../socle/index.ts";
import { ADRESSE } from "./questions/adresse.question.ts";
import { COUVERCLE } from "./questions/couvercle.question.ts";
import { DEBUT } from "./questions/debut.question.ts";
import { EXPEDITION } from "./questions/expedition.question.ts";
import { FACTURATION } from "./questions/facturation.question.ts";
import { FIN } from "./questions/fin.question.ts";
import { JOUR } from "./questions/jour.question.ts";
import { LIEU } from "./questions/lieu.question.ts";
import { NOM } from "./questions/nom.question.ts";
import { QUANTITE } from "./questions/quantite.question.ts";
import { REMARQUE } from "./questions/remarque.question.ts";
import { RETRAIT } from "./questions/retrait.question.ts";
import { TICKET } from "./questions/ticket.question.ts";

/** Posée après le verrou : elle complète, elle ne décide plus. */
export const COMPLEMENT = afterLock({
  id: "complement",
  title: "Compléter la commande",
  pages: [
    page("quantite", QUANTITE, LIEU, NOM, TICKET, COUVERCLE),
    page("facturation", FACTURATION),
    page("adresse", ADRESSE),
    page("expedition", EXPEDITION),
    page("creneau", DEBUT, FIN),
    page("retrait", RETRAIT, JOUR),
    page("remarque", REMARQUE),
  ],
});
