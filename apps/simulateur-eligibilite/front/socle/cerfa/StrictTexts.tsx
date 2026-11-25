// Les éditeurs des textes stricts d'un cerfa : un par texte qui
// déborde du PDF généré, ou qui a un brouillon. Le brouillon de départ est le
// texte du document ; chaque frappe le remonte à qui l'affiche, et « Valider »
// le lui confie. Sans éditeur, rien ne s'affiche.
//
// La mesure se charge avec le premier éditeur, une fois : `pdf-lib` et le
// gabarit, comme pour la génération.

import type { CerfaDto } from "../../../core/socle/cerfa";
import type { Cerfa, Strict, StrictMeasure } from "./cerfa.types";
import type { Overflowing } from "./generate-the-cerfa/generate-the-cerfa";
import { useMeasure } from "./measure.hook";
import { StrictTextEditor } from "./StrictTextEditor";
import { StrictEntriesService } from "./strict-entries.service";

/** Les brouillons des textes stricts, par entrée du DTO. */
export type Drafts = Readonly<Record<string, string>>;

/** Ce que l'écran fait d'un texte strict réécrit. */
export type StrictTextEdits = {
  readonly drafts: Drafts;
  readonly onEdit: (entry: string, text: string) => void;
  readonly onValidate: (entry: string) => void;
};

type Editor = {
  readonly entry: string;
  readonly strict: Strict;
  readonly text: string;
  readonly fallback: number;
};

/**
 * Les textes stricts à réécrire : ceux qui débordent de `overflowing`, et ceux
 * qui ont un brouillon. `overflowing` manque tant que le PDF n'est pas généré.
 */
export function editorsOf(
  cerfa: Cerfa<CerfaDto>,
  dto: CerfaDto,
  drafts: Drafts,
  overflowing: readonly Overflowing[] | undefined,
): Editor[] {
  return StrictEntriesService.of(cerfa).flatMap(({ entry, strict }) => {
    const overflow = overflowing?.find((found) => found.entry === entry);
    const draft = drafts[entry];
    if (draft === undefined && !overflow) return [];
    const text = draft ?? StrictEntriesService.textOf(dto, entry);
    return [{ entry, strict, text, fallback: overflow?.maximum ?? 0 }];
  });
}

export function StrictTexts({
  cerfa,
  editors,
  edits,
}: {
  cerfa: Cerfa<CerfaDto>;
  editors: readonly Editor[];
  edits: StrictTextEdits;
}) {
  const measure = useMeasure(cerfa, editors.length > 0);
  return editors.map(({ entry, strict, text, fallback }) => (
    <StrictTextEditor
      key={entry}
      strict={strict}
      text={text}
      measured={measure?.(entry, text) ?? estimate(text, fallback)}
      onEdit={(edited) => edits.onEdit(entry, edited)}
      onValidate={() => edits.onValidate(entry)}
    />
  ));
}

// ---- implémentation ----

// Tant que la mesure se charge : le maximum de la génération, et rien ne se
// valide.
function estimate(text: string, maximum: number): StrictMeasure {
  return { fits: false, maximum: maximum || Array.from(text).length };
}
