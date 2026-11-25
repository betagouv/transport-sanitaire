// La mesure des textes stricts d'un cerfa, chargée une fois, quand on la veut :
// `pdf-lib` et le gabarit viennent avec elle, comme pour la génération. Elle
// suit le cerfa par son nom de fichier : un modèle peut en redonner une copie
// à chaque rendu.

import { useEffect, useRef, useState } from "react";
import type { Cerfa, CerfaDto, StrictMeasure } from "./cerfa.types";
import { measureOf } from "./generate-the-cerfa/generate-the-cerfa";

/** Mesure un texte destiné à un texte strict, par son entrée du DTO. */
export type Measure = (entry: string, text: string) => StrictMeasure;

/** La mesure se charge encore, ou n'est pas voulue. */
export type NotLoaded = undefined;

/** La mesure de `cerfa`, une fois chargée. Sans cerfa, ou pas voulue : aucune. */
export function useMeasure(
  cerfa: Cerfa<CerfaDto> | null,
  wanted: boolean,
): Measure | NotLoaded {
  const [loaded, setLoaded] = useState<{ file: string; measure: Measure }>();
  const latest = useRef(cerfa);
  latest.current = cerfa;
  const file = cerfa?.fileName;
  const measure = loaded?.file === file ? loaded?.measure : undefined;
  useEffect(() => {
    const current = latest.current;
    if (!current || !file || !wanted || measure) return;
    let live = true;
    measureOf(current).then(
      (found) => live && setLoaded({ file, measure: found }),
      (cause) => console.error("[cerfa] Mesure impossible.", cause),
    );
    return () => {
      live = false;
    };
  }, [file, wanted, measure]);
  return measure;
}
