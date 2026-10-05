// Étape 5 — publication : pousse les marts dans Grist pour la dataviz.
//
// Générique : chaque mart déclare son fichier source, sa table Grist et ses colonnes
// (dans `marts()` ci-dessous) ; le moteur — garantir la table + remplacer son contenu — est
// mutualisé (voir grist.ts). Ajouter un mart publiable = ajouter une ligne à `marts()`.
//
// Config (env, .env lu automatiquement s'il existe) :
//   GRIST_DOC_URL — base API du doc cible, ex. https://…/api/docs/<docId>
//   GRIST_API_KEY — clé API Grist
//
//   pnpm publish-grist            # tous les marts publiables
//   pnpm publish-grist ght_2025   # un seul (par son nom court)

import { join } from "node:path";
import { ANNEES_ROLLUP } from "../04-marts/mart-rollup-annuel.ts";
import { Csv } from "../csv.ts";
import { Paths } from "../paths.ts";
import { type ColumnSpec, coerce, GristDoc } from "./grist.ts";

export class PublishMart {
  readonly #doc: GristDoc;

  constructor(doc: GristDoc) {
    this.#doc = doc;
  }

  async execute(spec: MartSpec): Promise<void> {
    const source = Csv.read(join(Paths.MARTS, spec.fichier));
    const rows = source.map((row) =>
      Object.fromEntries(
        spec.columns.map((c) => [c.id, coerce(row[c.id] ?? "", c.type)]),
      ),
    );
    await this.#doc.ensureTable(spec.table, spec.columns);
    await this.#doc.replaceAll(spec.table, rows);
    console.log(
      `Grist ${spec.table.padEnd(16)} ← ${rows.length} lignes publiées.`,
    );
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    process.loadEnvFile();
  } catch {
    // Pas de .env : on se rabat sur l'environnement du shell.
  }
  const docUrl = process.env.GRIST_DOC_URL?.trim();
  const apiKey = process.env.GRIST_API_KEY?.trim();
  if (!docUrl || !apiKey) {
    console.error("GRIST_DOC_URL et GRIST_API_KEY sont requis (voir .env).");
    process.exit(1);
  }
  const filtre = process.argv[2]?.trim();
  const specs = filtre ? marts().filter((m) => m.nom === filtre) : marts();
  if (specs.length === 0) {
    console.error(
      `Mart inconnu : « ${filtre} ». Disponibles : ${marts()
        .map((m) => m.nom)
        .join(", ")}.`,
    );
    process.exit(1);
  }
  const publisher = new PublishMart(new GristDoc(docUrl, apiKey));
  for (const spec of specs) await publisher.execute(spec);
}

// ---- implémentation ----

interface MartSpec {
  nom: string; // nom court : sélection en CLI + log
  fichier: string; // CSV source dans build/marts/
  table: string; // table Grist cible
  columns: ColumnSpec[]; // ordre = ordre des colonnes à la création de la table
}

// Hoistée, et non un `const` : le bloc CLI ci-dessus s'exécute au chargement du
// module, donc une constante déclarée ici serait lue en TDZ. Il en va de même des
// fonctions de colonnes plus bas.
function marts(): MartSpec[] {
  const annuels = (
    nom: string,
    identite: ColumnSpec[],
    mesures: ColumnSpec[],
  ) => ANNEES_ROLLUP.map((annee) => spec(`${nom}_${annee}`, identite, mesures));
  return [
    spec("ght", ght(), ratio()),
    ...annuels("ght", ght(), rollup()),
    spec("juridique", juridique(), ratio()),
    ...annuels("juridique", juridique(), rollup()),
    spec(
      "geographique",
      [...texte("finess_geographique"), ...juridique()],
      ratio(),
    ),
    spec("hors_ght", juridique(), ratio()),
    spec("article80", texte("grain", "cle", "libelle"), article80()),
    spec("juridique_plateforme", juridique(), ratio()),
    ...annuels("juridique_plateforme", juridique(), rollup()),
    spec("ght_plateforme", ght(), ratio()),
    ...annuels("ght_plateforme", ght(), rollup()),
    spec("taux_plateforme", texte("plateforme"), tauxPlateforme()),
    spec("synthese", [], synthese()),
  ];
}

// Le fichier et la table se déduisent du nom court : `hors_ght` lit `mart_hors_ght.csv`
// et alimente `Mart_Hors_Ght`.
function spec(
  nom: string,
  identite: ColumnSpec[],
  mesures: ColumnSpec[],
): MartSpec {
  const table = nom
    .split("_")
    .map((mot) => mot.charAt(0).toUpperCase() + mot.slice(1))
    .join("_");
  return {
    nom,
    fichier: `mart_${nom}.csv`,
    table: `Mart_${table}`,
    columns: [...identite, ...mesures],
  };
}

function texte(...ids: string[]): ColumnSpec[] {
  return ids.map((id) => ({ id, type: "Text" }));
}

function ght(): ColumnSpec[] {
  return texte("ght_code", "region", "ght_libelle");
}

function juridique(): ColumnSpec[] {
  return texte("finess_juridique", "nom", "ville", "departement");
}

// Les mesures d'un mart de ratio, par véhicule.
function ratio(): ColumnSpec[] {
  return [
    { id: "annee", type: "Int" },
    ...texte("vehicule", "plateforme"),
    { id: "nb_plateforme", type: "Int" },
    { id: "nb_reference", type: "Int" },
    { id: "part", type: "Numeric" },
    ...texte("alerte_qualite"),
  ];
}

// Les mesures d'un rollup annuel : une ligne par véhicule plus leur somme, et les mêmes
// colonnes d'une année à l'autre.
function rollup(): ColumnSpec[] {
  return [
    { id: "annee", type: "Int" },
    ...texte("vehicule", "plateforme"),
    { id: "nb_plateforme", type: "Int" },
    { id: "nb_cnam", type: "Int" },
    { id: "ratio", type: "Numeric" },
    ...texte("alerte_qualite"),
  ];
}

// Dans l'ordre du CSV : les volumes puis leur taux, la distribution à la fin.
function tauxPlateforme(): ColumnSpec[] {
  const entier = (id: string): ColumnSpec => ({ id, type: "Int" });
  const decimal = (id: string): ColumnSpec => ({ id, type: "Numeric" });
  return [
    entier("annee"),
    ...texte("vehicule"),
    entier("nb_etablissements"),
    entier("nb_plateforme"),
    entier("nb_plateforme_sans_finess"),
    entier("nb_cnam_etablissements"),
    decimal("taux_etablissements"),
    entier("nb_cnam_national"),
    decimal("taux_national"),
    decimal("ratio_q1"),
    decimal("ratio_mediane"),
    decimal("ratio_q3"),
  ];
}

function synthese(): ColumnSpec[] {
  const entier = (id: string): ColumnSpec => ({ id, type: "Int" });
  const decimal = (id: string): ColumnSpec => ({ id, type: "Numeric" });
  return [
    entier("annee"),
    ...texte("grain", "taille"),
    entier("nb_entites"),
    entier("nb_avec_remboursement"),
    entier("nb_avec_plateforme"),
    decimal("part_entites_couvertes"),
    entier("nb_cnam"),
    entier("nb_cnam_couvert"),
    decimal("part_cnam_couvert"),
    entier("nb_plateforme"),
    decimal("ratio"),
    decimal("ratio_couvert"),
  ];
}

function article80(): ColumnSpec[] {
  return [
    { id: "annee", type: "Int" },
    ...texte("vehicule", "plateforme"),
    { id: "nb", type: "Int" },
    { id: "part_plateforme", type: "Numeric" },
  ];
}
