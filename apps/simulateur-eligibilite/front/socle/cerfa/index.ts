// Ce que le cerfa promet au reste de l'écran et au modèle : décrire un
// formulaire, le relier aux réponses, le générer, et les boutons qui le
// téléchargent.

export { CerfaDocument } from "./CerfaDocument";
export {
  at,
  box,
  type Cerfa,
  type CerfaDto,
  commentOn,
  date,
  drawnBox,
  onOneLine,
  templateAt,
  text,
} from "./cerfa";
export {
  type BoundCerfa,
  bindCerfa,
  type CerfaMapping,
  cerfaValue,
  dtoFrom,
} from "./generate-the-cerfa/compute-the-dto";
export { generateCerfa } from "./generate-the-cerfa/generate-the-cerfa";
export { download, fileNameOf } from "./pdf/download-a-pdf";
export {
  PdfActionButton,
  type PdfSignals,
  useShown,
} from "./pdf/PdfActionButton";
