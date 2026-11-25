// La fabrique des liaisons d'un cerfa : ce qui dit où chaque entrée du DTO va
// dans le gabarit. Aucune méthode n'emploie `this` : un modèle les déstructure en
// tête de fichier (`const { text, box } = CerfaFactory;`).

import type {
  BoxBinding,
  DrawingBinding,
  Position,
  StrictOptions,
  StrictTextBinding,
  TextBinding,
} from "./cerfa.types";

export class CerfaFactory {
  /** Un texte écrit dans le champ `field`. */
  static text(
    field: string,
    options: Omit<TextBinding, "field"> = {},
  ): TextBinding {
    return { field, ...options };
  }

  /**
   * Une date ISO écrite dans le champ `field`, au format de ses cases. Le DTO
   * ne sait pas combien le gabarit en a.
   */
  static date(field: string): TextBinding {
    return { field, date: true };
  }

  /** Un texte strict écrit dans le champ `field`, nommé `label` à l'écran. */
  static strictText(
    field: string,
    label: string,
    options: StrictOptions = {},
  ): StrictTextBinding {
    return { field, strict: { label, ...options } };
  }

  /** Une case du champ `field`, cochée par son état d'export `state`. */
  static box(field: string, state: string): BoxBinding {
    return { field, state };
  }

  /** Une case qui partage son champ : sa marque est dessinée sur la page. */
  static drawnBox(field: string, state: string): BoxBinding {
    return { field, state, drawn: true };
  }

  /**
   * Un texte dessiné à chaque position, là où le gabarit n'a pas de champ : une
   * par volet qui le porte, comme un champ recopié d'un volet à l'autre. Le DTO
   * n'en donne qu'une valeur, et ne sait rien des volets.
   */
  static at(...positions: readonly Position[]): DrawingBinding {
    return { positions };
  }

  /**
   * Le texte dessiné `drawing`, gardé sur une ligne : il rapetisse jusqu'au
   * plancher avant de passer à la ligne, là où une seconde ligne passerait sur
   * le gabarit.
   */
  static onOneLine(drawing: DrawingBinding): DrawingBinding {
    return { ...drawing, singleLine: true };
  }

  /**
   * Le texte dessiné `drawing`, strict : sur une ligne de chaque position, à sa
   * taille, ou il ne se dessine pas, et le prescripteur le réécrit.
   */
  static strictDrawing(
    drawing: DrawingBinding,
    label: string,
    options: Omit<StrictOptions, "oneLine"> = {},
  ): DrawingBinding {
    return { ...drawing, strict: { label, ...options, oneLine: true } };
  }
}
