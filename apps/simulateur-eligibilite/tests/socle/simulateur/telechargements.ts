// Ce que le navigateur aurait téléchargé : le nom du fichier, et son contenu.
//
// Le socle télécharge par un lien `download` vers une URL de blob, qu'il libère
// aussitôt après le clic. On relit le blob pendant le clic, par Node, qui a créé
// l'URL. Rien du socle n'est remplacé.

import { resolveObjectURL } from "node:buffer";

type Telechargement = { nom: string; contenu: () => Promise<Uint8Array> };

/** Écoute les téléchargements jusqu'à `arreter()`. */
export function ecouterLesTelechargements() {
  const telechargements: Telechargement[] = [];
  const surClic = (event: Event) => {
    const lien = event.target;
    if (!(lien instanceof HTMLAnchorElement) || !lien.download) return;
    // Le navigateur de test ne sait pas suivre le lien : on s'en charge.
    event.preventDefault();
    const blob = resolveObjectURL(lien.href);
    if (!blob) throw new Error(`Aucun blob derrière ${lien.href}.`);
    telechargements.push({
      nom: lien.download,
      contenu: async () => new Uint8Array(await blob.arrayBuffer()),
    });
  };
  document.addEventListener("click", surClic, true);
  return {
    telechargements,
    arreter: () => document.removeEventListener("click", surClic, true),
  };
}
