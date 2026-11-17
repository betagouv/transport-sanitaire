// Les éditeurs des textes stricts d'un cerfa (D-302, D-304) : un par texte qui
// déborde du PDF généré, ou qui a un brouillon. Le brouillon de départ est le
// texte du document ; chaque frappe le remonte à qui l'affiche, et « Valider »
// le lui confie. Sans éditeur, rien ne s'affiche.
//
// La mesure se charge avec le premier éditeur, une fois : `pdf-lib` et le
// gabarit, comme pour la génération.

import { useEffect, useState } from "react";
import type { Cerfa, CerfaDto } from "./cerfa";
import {
  measureOf,
  type Overflowing,
  strictEntriesOf,
} from "./generate-the-cerfa/generate-the-cerfa";
import type { StrictMeasure } from "./generate-the-cerfa/strict-text";
import { StrictTextEditor } from "./StrictTextEditor";

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
  readonly label: string;
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
  return strictEntriesOf(cerfa).flatMap(({ entry, label }) => {
    const overflow = overflowing?.find((found) => found.entry === entry);
    const draft = drafts[entry];
    if (draft === undefined && !overflow) return [];
    const text = draft ?? String(dto.fields[entry] ?? "");
    return [{ entry, label, text, fallback: overflow?.maximum ?? 0 }];
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
  return editors.map(({ entry, label, text, fallback }) => (
    <StrictTextEditor
      key={entry}
      label={label}
      text={text}
      measured={measure?.(entry, text) ?? estimate(text, fallback)}
      onEdit={(edited) => edits.onEdit(entry, edited)}
      onValidate={() => edits.onValidate(entry)}
    />
  ));
}

// ---- implémentation ----

type Measure = (entry: string, text: string) => StrictMeasure;

// La mesure du cerfa, chargée au premier éditeur.
function useMeasure(cerfa: Cerfa<CerfaDto>, wanted: boolean) {
  const [measure, setMeasure] = useState<Measure>();
  useEffect(() => {
    if (!wanted || measure) return;
    let current = true;
    measureOf(cerfa).then(
      (loaded) => current && setMeasure(() => loaded),
      (cause) => console.error("[cerfa] Mesure impossible.", cause),
    );
    return () => {
      current = false;
    };
  }, [cerfa, wanted, measure]);
  return measure;
}

// Tant que la mesure se charge : le maximum de la génération, et rien ne se
// valide.
function estimate(text: string, maximum: number): StrictMeasure {
  return { fits: false, maximum: maximum || Array.from(text).length };
}
