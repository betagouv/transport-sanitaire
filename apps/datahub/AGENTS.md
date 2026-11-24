# AGENTS.md - datahub

> Les conventions du dépôt sont dans [`../../AGENTS.md`](../../AGENTS.md). Ici,
> ce qui est propre à cette app.

## À lire en premier : confidentialité

**Le monorepo est public ; les données et l'identité des fournisseurs ne le sont
pas.**

Le code de l'ETL est générique. Il ne connaît que deux choses :

- des **rôles** : `plateforme`, `referentiel-national`, `referentiel-ght` ;
- des **formats de fichier**.

Jamais l'identité d'un fournisseur, jamais la moindre donnée. L'association entre
les fichiers réels et ces formats vit dans `mapping.json`, **non versionné**. Son
gabarit neutre est `mapping.example.json`.

| Statut | Fichiers |
|---|---|
| **Jamais versionnés** | `data/` (sources brutes), `build/` (tous les artefacts, dont des marts contenant de vrais établissements), `mapping.json`, `.env` |
| **Versionnés** | `src/` (code générique), `ref/` (open data figé + mappings manuels), `mapping.example.json` |

Un nom de fournisseur fuite par cinq chemins :

- un commentaire,
- un nom de variable,
- un fichier de test,
- **un message de commit**,
- **une issue ou une PR**, par son titre, son corps ou un commentaire. Elles
  sont publiques, comme le dépôt.

Relis le diff *et* le message avant de commiter, et le texte d'une issue avant
de l'ouvrir. Les libellés de véhicule et les
noms de colonnes des adaptateurs décrivent des **formats**, jamais des
fournisseurs. Garde-le ainsi en ajoutant un adaptateur.

## Ce que ça calcule

La **part des trajets réalisés via les plateformes** (numérateur), rapportée au
**référentiel national de remboursement** (dénominateur). Ventilée par
établissement ou GHT, par année, par type de transport et par enveloppe.

Trois sources écrites, dans cet ordre d'autorité :

1. [`spec/`](spec/), qui fait autorité sur le métier : `livrables.md` décrit les
   dix-huit marts, `points-attention-metier.md` les dix propriétés de la donnée à
   connaître avant de citer un chiffre ;
2. le [README](README.md), qui ne traite que de l'exécution du pipeline ;
3. [`docs/knowledge/domain/etl-part-plateformes.md`](docs/knowledge/domain/etl-part-plateformes.md),
   qui porte le cadrage d'origine.

**Le cadrage est le moins à jour des trois** : il annonce 5 marts, il y en a 18.
Le métier ne s'écrit plus dans le README : il va dans `spec/`.

## Le pipeline

Du **TypeScript exécuté directement par Node 24**, sans build. Les dossiers
`src/01-extract/` à `src/05-publish/` portent l'ordre des étapes, et le
[README](README.md) dit comment les lancer.

- **Un format de fichier = un adaptateur**, déclaré dans
  `src/01-extract/adapteurs/registry.ts`. Le code ne connaît jamais un fournisseur.
- **Le référentiel fait autorité** : l'étape `03-reconcile` aligne les finess sur lui.
- **Le document Grist cible est privé** (`05-publish`).
- **`pnpm fetch-ght` est hors chaîne** parce que `ref/` est versionné : l'ETL
  tourne donc sans réseau.

## Tests

**Sans mock**, et **aucune donnée réelle dans les fixtures**.

## Dette nommée

**Des modules déguisés en classes.** `Csv`, `Xlsx`, `Paths` et `Mapping` sont des
classes à membres uniquement statiques, ce que Biome signale
(`noStaticOnlyClass`, en avertissement). Les convertir en fonctions exportées
touche une centaine d'appels. **À payer quand un de ces modules sera rouvert.**
Pas avant, et pas par un `off` dans la configuration.

**`noNonNullAssertion` est éteinte dans `src/`**, pour une raison précise. Le
tsconfig active `noUncheckedIndexedAccess`, qui rend `ligne[colonne]`
potentiellement `undefined`.

C'est la garantie forte, on la garde. Le `!` en est le prix sur une colonne qu'on
vient de lire dans l'en-tête. On éteint la règle faible pour tenir la forte.
