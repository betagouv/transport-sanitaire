// Ce que le cerfa promet au reste de l'écran et au modèle : décrire un
// formulaire, le relier aux réponses, le générer, et les boutons qui le
// téléchargent.

export { CerfaDocument } from "./CerfaDocument";
export { CerfaFactory } from "./cerfa.factory";
export type {
  BoundCerfa,
  Cerfa,
  CerfaDto,
  CerfaMapping,
  StrictOptions,
} from "./cerfa.types";
export { CerfaDtoService } from "./cerfa-dto.service";
export {
  type GeneratedCerfa,
  generateCerfa,
  type Overflowing,
} from "./generate-the-cerfa/generate-the-cerfa";
export { DownloadAPdfService } from "./pdf/download-a-pdf.service";
export {
  PdfActionButton,
  type PdfSignals,
  useShown,
} from "./pdf/PdfActionButton";
export { PdfFileName } from "./pdf/pdf-file-name.vo";
export type { StrictTextEdits } from "./StrictTexts";
export { templateAt } from "./template";
export { useTextCounters } from "./text-counters.hook";
