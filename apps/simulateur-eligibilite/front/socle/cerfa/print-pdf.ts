// Imprime un PDF sans quitter la page. Il se charge dans un cadre invisible,
// qui ouvre le dialogue d'impression du navigateur sur le PDF, pas sur la page :
// le prescripteur imprime le document même qu'il télécharge.
//
// Chrome, Edge et Firefox impriment un PDF dans un cadre. Safari le fait mal :
// la recette le vérifie, et un repli par un nouvel onglet suivra s'il le faut.

/**
 * Ouvre le dialogue d'impression sur `pdf`. Rend de quoi retirer le cadre et
 * libérer son URL, une fois l'impression passée.
 */
export function printPdf(pdf: Blob): () => void {
  const url = URL.createObjectURL(pdf);
  const frame = document.createElement("iframe");
  frame.title = "Document à imprimer";
  frame.tabIndex = -1;
  frame.setAttribute("aria-hidden", "true");
  // Un cadre masqué par `display: none` ne s'imprime pas : il est seulement
  // invisible, et sans taille.
  frame.style.cssText =
    "visibility: hidden; position: absolute; width: 0; height: 0; border: 0";
  frame.addEventListener("load", () => frame.contentWindow?.print(), {
    once: true,
  });
  frame.src = url;
  document.body.append(frame);
  return () => {
    frame.remove();
    URL.revokeObjectURL(url);
  };
}
