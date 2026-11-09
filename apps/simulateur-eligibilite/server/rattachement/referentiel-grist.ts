// Le référentiel, lu et complété dans un doc Grist. Côté serveur uniquement.
// Voir docs/knowledge/adr/identification.md, ADR-5.
//
// Tables Grist :
//   Etablissements   : Id2 (Int), Nom (Text), Origine (Text)
//   Services_Unites  : Id2, Nom, Etablissement (Ref:Etablissements), Origine
//
// `etabId` et `serviceId` sont la colonne Id2. Une colonne de référence stocke le
// rowId Grist, pas l'Id2 : on convertit donc l'Id2 en rowId avant de filtrer.

import {
  enrichitLeReferentiel,
  normalise,
  type RattachementSaisi,
} from "../../shared/rattachement-saisi.ts";
import type {
  Etablissement,
  Referentiel,
  Service,
} from "../../shared/referentiel.ts";
import type { DocGrist, LigneGrist } from "./lignes-grist.ts";
import { creerLigne, lignes, ouvrirDoc, texte } from "./lignes-grist.ts";

export type GristConfig = {
  /** Base API du doc, ex. https://…/api/docs/<docId> */
  docUrl: string;
  cleApi: string;
};

export function creerReferentielGrist({
  docUrl,
  cleApi,
}: GristConfig): Referentiel {
  const doc = ouvrirDoc(docUrl, cleApi);
  return {
    listerEtablissements: () => etablissements(doc),
    listerServices: (etabId) => services(doc, etabId),
    enrichirDepuisSaisie: (saisie) => enrichir(doc, saisie),
  };
}

// ---- implémentation ----

async function etablissements(doc: DocGrist): Promise<Etablissement[]> {
  return (await lignes(doc, TABLE.etablissements))
    .map((r) => ({
      id: texte(r.fields[COL.id]),
      libelle: texte(r.fields[COL.nom]),
    }))
    .filter((e) => e.id && e.libelle);
}

async function services(doc: DocGrist, etabId: string): Promise<Service[]> {
  const rowId = await rowIdDeId2(doc, TABLE.etablissements, etabId);
  if (rowId == null) return [];
  const trouvees = await lignes(doc, TABLE.services, {
    [COL.refEtablissement]: [rowId],
  });
  return trouvees
    .map((r) => ({
      id: texte(r.fields[COL.id]),
      libelle: texte(r.fields[COL.nom]),
    }))
    .filter((s) => s.id && s.libelle);
}

// Ce que la saisie apprend au référentiel : le vrai service saisi sous
// « Autre », ou l'établissement saisi et son service. On les crée, ou on
// réutilise leurs homonymes, avec `Origine=formulaire`. Ils apparaissent dans
// les listes à la visite suivante. Une sélection issue des listes n'écrit rien.
// Voir docs/knowledge/domain/enrichissement-referentiel-rattachement.md.
async function enrichir(
  doc: DocGrist,
  saisie: RattachementSaisi,
): Promise<void> {
  const service = saisie.serviceLibre?.trim();
  if (!enrichitLeReferentiel(saisie) || !service) return;
  const etabRowId = await etablissementDeLaSaisie(doc, saisie);
  if (etabRowId == null) return;
  await assurerService(doc, etabRowId, service);
}

// L'établissement sous lequel ranger le service : celui du référentiel, ou
// celui que la saisie nomme, créé ou réutilisé.
async function etablissementDeLaSaisie(
  doc: DocGrist,
  saisie: RattachementSaisi,
): Promise<number | null> {
  if (!saisie.etabEstAutre) {
    return rowIdDeId2(doc, TABLE.etablissements, saisie.etabId);
  }
  const nom = saisie.etabLibre?.trim();
  return nom ? assurerEtablissement(doc, nom) : null;
}

// Résout un Id2 métier vers le rowId interne Grist de la table donnée.
async function rowIdDeId2(
  doc: DocGrist,
  table: string,
  id: string,
): Promise<number | null> {
  const trouvees = await lignes(doc, table, { [COL.id]: [Number(id)] });
  return trouvees[0]?.id ?? null;
}

// Le prochain Id2 métier libre de la table (max + 1). La ligne créée est ainsi
// visible aussitôt : la lecture ne garde que les Id2 non nuls.
async function prochainId2(doc: DocGrist, table: string): Promise<number> {
  const trouvees = await lignes(doc, table);
  const max = trouvees.reduce(
    (m, r) => Math.max(m, Number(r.fields[COL.id]) || 0),
    0,
  );
  return max + 1;
}

// Réutilise l'établissement homonyme (Nom normalisé), sinon le crée avec son
// service « Autre », comme ceux de l'admin : le prescripteur suivant qui n'y
// trouve pas son service peut alors le saisir.
async function assurerEtablissement(
  doc: DocGrist,
  nom: string,
): Promise<number> {
  const deja = homonyme(await lignes(doc, TABLE.etablissements), nom);
  if (deja != null) return deja;
  const etabRowId = await creerLigne(doc, TABLE.etablissements, {
    [COL.id]: await prochainId2(doc, TABLE.etablissements),
    [COL.nom]: nom.trim(),
    [COL.origine]: ORIGINE_FORMULAIRE,
  });
  await creerService(doc, etabRowId, SERVICE_AUTRE);
  return etabRowId;
}

// Réutilise le service homonyme (Nom normalisé) de l'établissement, sinon le crée.
async function assurerService(
  doc: DocGrist,
  etabRowId: number,
  nom: string,
): Promise<number> {
  const existants = await lignes(doc, TABLE.services, {
    [COL.refEtablissement]: [etabRowId],
  });
  const deja = homonyme(existants, nom);
  if (deja != null) return deja;
  return creerService(doc, etabRowId, nom);
}

async function creerService(
  doc: DocGrist,
  etabRowId: number,
  nom: string,
): Promise<number> {
  return creerLigne(doc, TABLE.services, {
    [COL.id]: await prochainId2(doc, TABLE.services),
    [COL.nom]: nom.trim(),
    [COL.refEtablissement]: etabRowId,
    [COL.origine]: ORIGINE_FORMULAIRE,
  });
}

// Le rowId de la ligne qui porte déjà ce nom, à la casse et aux espaces près.
function homonyme(existantes: LigneGrist[], nom: string): number | null {
  const cherche = normalise(nom);
  const deja = existantes.find(
    (r) => normalise(texte(r.fields[COL.nom])) === cherche,
  );
  return deja?.id ?? null;
}

const TABLE = {
  etablissements: "Etablissements",
  services: "Services_Unites",
} as const;

const COL = {
  id: "Id2",
  nom: "Nom",
  refEtablissement: "Etablissement",
  origine: "Origine",
} as const;

// Écrit dans la colonne `Origine` des lignes créées par le formulaire, pour les
// distinguer de celles de l'admin.
const ORIGINE_FORMULAIRE = "formulaire";

// Le libellé du service par lequel l'écran propose de saisir un service non
// listé (`estAutre`, dans `front/socle/rattachement/listes.ts`).
const SERVICE_AUTRE = "Autre";
