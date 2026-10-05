// Une **cible** est un document Grist destinataire, restreint à certaines plateformes.
//
// Le périmètre complet, toutes plateformes, est celui du document interne : il n'a pas de
// nom et se publie sans option. Une cible, elle, se nomme sur la ligne de commande
// (`--cible <nom>`) et se déclare à deux endroits non versionnés :
//   - `mapping.json` : chaque plateforme liste dans `cibles` les cibles où elle figure ;
//   - `.env` : `GRIST_DOC_URL_<NOM>` porte l'adresse du document de la cible.
// Ses marts sont recalculés sur ses seules plateformes et ne listent que les entités où
// elles déclarent des trajets (cf. `04-marts/perimetre.ts`).

export interface Arguments {
  cible: string; // "" pour le périmètre complet
  reste: string[]; // les arguments positionnels, dans l'ordre
}

/** Sépare `--cible <nom>` des arguments positionnels d'une ligne de commande. */
export function lireArguments(argv: string[]): Arguments {
  const position = argv.indexOf("--cible");
  if (position === -1) return { cible: "", reste: argv };
  const cible = argv[position + 1]?.trim() ?? "";
  if (!cible || cible.startsWith("--"))
    throw new Error("--cible attend un nom, par exemple --cible partenaire-a.");
  return { cible, reste: argv.toSpliced(position, 2) };
}

/** Variable d'environnement qui porte l'adresse du document Grist d'une cible. */
export function variableDocUrl(cible: string): string {
  if (!cible) return "GRIST_DOC_URL";
  return `GRIST_DOC_URL_${cible.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;
}

/**
 * L'adresse à ouvrir dans un navigateur pour un document dont on connaît la base API.
 * `https://hôte/o/org/api/docs/<id>` s'ouvre à `https://hôte/o/org/<12 premiers caractères>` :
 * Grist abrège l'identifiant d'un document à ses 12 premiers caractères dans ses liens.
 */
export function lienDocument(docUrl: string): string {
  const [base, id] = docUrl.replace(/\/+$/, "").split("/api/docs/");
  return id ? `${base}/${id.slice(0, 12)}` : docUrl;
}
