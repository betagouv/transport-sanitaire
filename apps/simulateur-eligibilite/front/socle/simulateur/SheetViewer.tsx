// La feuille à remettre au patient, dans sa visionneuse : une A4 blanche sur un
// fond gris, sous une barre qui l'imprime et la télécharge. Les logos du
// Ministère et de l'Assurance Maladie sont en tête : ils ne changent pas avec
// le modèle. À l'impression, la feuille passe en papier et sort seule, sur une
// ou deux A4 selon sa mesure (paper-print.ts). Le PDF a les mêmes pages
// (sheet-download.ts). Le pied de la feuille la clôt. Les gabarits de
// l'éditeur en font foi.

import { useRef, useState } from "react";
import { PREPARING } from "../cerfa/pdf-preparation";
import type { Sheet } from "../model";
import assuranceMaladie from "./logos/assurance-maladie.svg";
import ministere from "./logos/ministere-de-la-sante.svg";
import { usePaperPrint } from "./paper-print";
import { useSheetDownload } from "./sheet-download";
import { paperAttributes } from "./sheet-pagination";
import "./sheet-viewer.css";
import "./sheet-viewer-narrow.css";
import "./sheet-numbered-steps.css";
import "./sheet-paper.css";
import "./sheet-viewer-print.css";

export function SheetViewer({ sheet }: { sheet: Sheet }) {
  const article = useRef<HTMLElement>(null);
  const { layout, print } = usePaperPrint(article);
  const download = useSheetDownload(article);
  return (
    <section aria-label="Aperçu de la fiche patient" className="socle-viewer">
      <SheetActions print={print} download={download} />
      <div className="socle-viewer__host">
        <article
          aria-label="Fiche explicative patient"
          className="socle-sheet"
          ref={article}
          {...paperAttributes(layout)}
        >
          <Logos />
          <h2 className="socle-sheet__title">{sheet.title}</h2>
          {sheet.intro && <p className="socle-sheet__intro">{sheet.intro}</p>}
          {sheet.body}
          {sheet.footer && (
            <footer className="socle-sheet__footer">{sheet.footer}</footer>
          )}
        </article>
      </div>
      <p className="socle-viewer__status fr-no-print" role="status">
        {download.status === "failed" ? FAILED : ""}
      </p>
    </section>
  );
}

// ---- implémentation ----

type SheetActionsProps = {
  print: () => void;
  download: ReturnType<typeof useSheetDownload>;
};

// Ce que dit la visionneuse sous la feuille quand le PDF échoue, comme le
// composant de l'éditeur.
const FAILED =
  "Le téléchargement a échoué. Réessayez ou utilisez « Imprimer ».";

// « Imprimer », puis « Télécharger », qui attend pendant que le PDF se
// prépare.
function SheetActions({ print, download }: SheetActionsProps) {
  const preparing = download.status === "preparing";
  return (
    <div className="socle-viewer__actions fr-no-print">
      <button type="button" className="socle-viewer__button" onClick={print}>
        <PrintIcon />
        Imprimer
      </button>
      <button
        type="button"
        className="socle-viewer__button"
        onClick={download.save}
        disabled={preparing}
      >
        <DownloadIcon />
        {preparing ? PREPARING : "Télécharger"}
      </button>
    </div>
  );
}

type LogoProps = { name: string; src: string; className: string };

const LOGOS: readonly LogoProps[] = [
  {
    name: "Ministère de la Santé, des Familles, de l’Autonomie et des Personnes handicapées",
    src: ministere,
    className: "socle-sheet__logo",
  },
  {
    name: "L’Assurance Maladie",
    src: assuranceMaladie,
    className: "socle-sheet__logo socle-sheet__logo--ameli",
  },
];

// Les logos en tête de la feuille.
function Logos() {
  return (
    <header className="socle-sheet__logos">
      {LOGOS.map((logo) => (
        <Logo key={logo.name} {...logo} />
      ))}
    </header>
  );
}

// Un logo qui ne se charge pas laisse son nom à sa place.
function Logo({ name, src, className }: LogoProps) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={className}>
      {failed ? (
        <span className="socle-sheet__logo-fallback">{name}</span>
      ) : (
        <img alt={name} src={src} onError={() => setFailed(true)} />
      )}
    </div>
  );
}

// L'imprimante des gabarits.
function PrintIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M6 8V3h12v5M6 17H3V8h18v9h-3M6 14h12v7H6zM17 11h1" />
    </svg>
  );
}

// La flèche vers le bac des gabarits.
function DownloadIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />
    </svg>
  );
}
