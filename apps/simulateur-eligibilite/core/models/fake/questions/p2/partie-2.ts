// Le complément de la commande, après le verrou : il complète, il ne décide
// plus. Ses pages, dans l'ordre, faites de ses questions (`questions/`).

import {
  afterLock,
  page,
  type QuestionnairePart,
} from "../../../../socle/index.ts";
import type { Cibles } from "../../cibles/noms.ts";
import type { Questions } from "../catalogue.ts";
import { ADRESSE } from "./questions/adresse.ts";
import { COUVERCLE } from "./questions/couvercle.ts";
import { DEBUT } from "./questions/debut.ts";
import { EXPEDITION } from "./questions/expedition.ts";
import { FACTURATION } from "./questions/facturation.ts";
import { FIN } from "./questions/fin.ts";
import { JOUR } from "./questions/jour.ts";
import { LIEU } from "./questions/lieu.ts";
import { NOM } from "./questions/nom.ts";
import { QUANTITE } from "./questions/quantite.ts";
import { REMARQUE } from "./questions/remarque.ts";
import { RETRAIT } from "./questions/retrait.ts";
import { TICKET } from "./questions/ticket.ts";

/** Posée après le verrou : elle complète, elle ne décide plus. */
export const COMPLEMENT: QuestionnairePart<Questions, Cibles> = afterLock({
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
