// Le référentiel, lu et complété dans un doc Grist. Côté serveur uniquement.
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
  RattachementEnregistre,
  Referentiel,
  Service,
} from "../../shared/referentiel.ts";
import {
  cellText,
  type GristApiClient,
  type GristRow,
} from "../grist/grist-api.client.ts";

export function creerReferentielGrist(grist: GristApiClient): Referentiel {
  return {
    listerEtablissements: () => etablissements(grist),
    listerServices: (etabId) => services(grist, etabId),
    enrichirDepuisSaisie: (saisie) => enrichir(grist, saisie),
  };
}

// ---- implémentation ----

async function etablissements(grist: GristApiClient): Promise<Etablissement[]> {
  return (await grist.rows(TABLE.etablissements))
    .map((r) => ({
      id: cellText(r.fields[COL.id]),
      libelle: cellText(r.fields[COL.nom]),
    }))
    .filter((e) => e.id && e.libelle);
}

async function services(
  grist: GristApiClient,
  etabId: string,
): Promise<Service[]> {
  const rowId = await rowIdDeId2(grist, TABLE.etablissements, etabId);
  if (rowId == null) return [];
  const trouvees = await grist.rows(TABLE.services, {
    [COL.refEtablissement]: [rowId],
  });
  return trouvees
    .map((r) => ({
      id: cellText(r.fields[COL.id]),
      libelle: cellText(r.fields[COL.nom]),
    }))
    .filter((s) => s.id && s.libelle);
}

// Ce que la saisie apprend au référentiel : le vrai service saisi sous
// « Autre », ou l'établissement saisi et son service. On les crée, ou on
// réutilise leurs homonymes, avec `Origine=formulaire`, et on donne leurs Id2 :
// le parcours les porte dès cette visite. Une sélection issue des listes
// n'apprend rien : elle est refusée, comme un établissement absent.
async function enrichir(
  grist: GristApiClient,
  saisie: RattachementSaisi,
): Promise<RattachementEnregistre> {
  const service = saisie.serviceLibre?.trim();
  if (!enrichitLeReferentiel(saisie) || !service) {
    throw new Error("la saisie n'apprend rien au référentiel");
  }
  const etab = await etablissementDeLaSaisie(grist, saisie);
  if (!etab) throw new Error("établissement absent du référentiel");
  const serviceId = await assurerService(grist, etab.rowId, service);
  return { etabId: etab.id2, serviceId };
}

// Une ligne du référentiel : son rowId Grist, pour les références, et son Id2,
// pour le parcours.
type Ligne = { rowId: number; id2: string };

/** Aucune ligne ne porte cet Id2, ou ce nom. */
type Absente = undefined;

// L'établissement sous lequel ranger le service : celui du référentiel, ou
// celui que la saisie nomme, créé ou réutilisé.
async function etablissementDeLaSaisie(
  grist: GristApiClient,
  saisie: RattachementSaisi,
): Promise<Ligne | Absente> {
  if (!saisie.etabEstAutre) {
    const rowId = await rowIdDeId2(grist, TABLE.etablissements, saisie.etabId);
    return rowId == null ? undefined : { rowId, id2: saisie.etabId };
  }
  const nom = saisie.etabLibre?.trim();
  return nom ? assurerEtablissement(grist, nom) : undefined;
}

// Résout un Id2 métier vers le rowId interne Grist de la table donnée.
async function rowIdDeId2(
  grist: GristApiClient,
  table: string,
  id: string,
): Promise<number | null> {
  const trouvees = await grist.rows(table, { [COL.id]: [Number(id)] });
  return trouvees[0]?.id ?? null;
}

// Le prochain Id2 métier libre de la table (max + 1). La ligne créée est ainsi
// visible aussitôt : la lecture ne garde que les Id2 non nuls.
async function prochainId2(
  grist: GristApiClient,
  table: string,
): Promise<number> {
  const trouvees = await grist.rows(table);
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
  grist: GristApiClient,
  nom: string,
): Promise<Ligne> {
  const deja = homonyme(await grist.rows(TABLE.etablissements), nom);
  if (deja) return deja;
  const id2 = await prochainId2(grist, TABLE.etablissements);
  const rowId = await grist.addRow(TABLE.etablissements, {
    [COL.id]: id2,
    [COL.nom]: nom.trim(),
    [COL.origine]: ORIGINE_FORMULAIRE,
  });
  await creerService(grist, rowId, SERVICE_AUTRE);
  return { rowId, id2: String(id2) };
}

// Réutilise le service homonyme (Nom normalisé) de l'établissement, sinon le
// crée. Donne son Id2.
async function assurerService(
  grist: GristApiClient,
  etabRowId: number,
  nom: string,
): Promise<string> {
  const existants = await grist.rows(TABLE.services, {
    [COL.refEtablissement]: [etabRowId],
  });
  const deja = homonyme(existants, nom);
  if (deja) return deja.id2;
  return creerService(grist, etabRowId, nom);
}

async function creerService(
  grist: GristApiClient,
  etabRowId: number,
  nom: string,
): Promise<string> {
  const id2 = await prochainId2(grist, TABLE.services);
  await grist.addRow(TABLE.services, {
    [COL.id]: id2,
    [COL.nom]: nom.trim(),
    [COL.refEtablissement]: etabRowId,
    [COL.origine]: ORIGINE_FORMULAIRE,
  });
  return String(id2);
}

// La ligne qui porte déjà ce nom, à la casse et aux espaces près.
function homonyme(existantes: GristRow[], nom: string): Ligne | Absente {
  const cherche = normalise(nom);
  const deja = existantes.find(
    (r) => normalise(cellText(r.fields[COL.nom])) === cherche,
  );
  return deja && { rowId: deja.id, id2: cellText(deja.fields[COL.id]) };
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
