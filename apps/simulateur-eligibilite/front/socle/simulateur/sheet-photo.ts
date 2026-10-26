// La photo d'un élément de la page, dessinée par le navigateur lui-même, avec
// les CSS de la page, ses polices et ses images. C'est le seul fichier qui
// importe modern-screenshot, chargé à la demande : le remplacer ne touche que
// lui.

/** L'élément en image, à `scale` pixels d'image par pixel CSS, sur du blanc. */
export async function photograph(
  element: HTMLElement,
  scale: number,
): Promise<HTMLCanvasElement> {
  const { domToCanvas } = await import("modern-screenshot");
  return domToCanvas(element, {
    scale,
    backgroundColor: "#fff",
    onCloneEachNode: marginsPassingThrough(),
  });
}

// ---- implémentation ----

// modern-screenshot fige la hauteur de chaque élément qu'il copie. Une marge
// basse qui traversait son parent, fusionnée avec la sienne, reste alors
// dedans, et tout ce qui suit remonte d'autant : la photo ne tombe plus sur
// les coupes mesurées. Les marges des cartes décalaient ainsi la seconde page
// de 5 mm. Sans hauteur, ces parents laissent de nouveau passer la marge. Les
// copies arrivent des feuilles vers la racine : un parent qui laisse passer la
// marge la transmet au sien.
function marginsPassingThrough() {
  const passing = new WeakSet<Node>();
  return (copy: Node) => {
    if (!(copy instanceof HTMLElement)) return;
    const last = copy.lastElementChild;
    if (!(last instanceof HTMLElement) || !letsThrough(copy.style)) return;
    if (!passing.has(last) && !(parseFloat(last.style.marginBottom) > 0))
      return;
    copy.style.removeProperty("height");
    copy.style.removeProperty("block-size");
    passing.add(copy);
  };
}

// Un bloc sans bordure ni marge intérieure en bas, qui ne contient pas ses
// marges : la marge basse de son dernier enfant le traverse.
function letsThrough(style: CSSStyleDeclaration): boolean {
  return (
    ["", "block", "list-item"].includes(style.display) &&
    ["", "visible"].includes(style.overflowY) &&
    !(parseFloat(style.paddingBottom) > 0) &&
    !(parseFloat(style.borderBottomWidth) > 0)
  );
}
