# ADR-0013 - Les règles en JSON versionné (~~YAML converti par Vite~~)

> Statut : **décidé** · 2026-10-23 · Anciennement ADR-2 de `metier-et-ecran.md`
>
> Décidé par l'agent qui a mené le chantier, sur délégation, le 2026-10-22 :
> à relire (issues 202 à 207).

**Contexte.** D-71 faisait convertir le YAML de l'éditeur par Vite, à la
compilation, pour qu'aucun analyseur YAML ne parte dans le navigateur. Node ne
passe pas par Vite : le métier n'y aurait pas trouvé ses règles.

Trois options :

| Option | Pour | Contre |
|---|---|---|
| un analyseur YAML dans `core/` | rien à générer | l'analyseur part dans le bundle, ce que D-71 refuse |
| un chargeur Node pour le YAML | rien à générer | un réglage de plus pour Node, les tests et le serveur |
| un JSON calculé du YAML, versionné | Node et le navigateur l'importent tels quels | un fichier généré à tenir à jour |

**Décision.** La troisième. `pnpm regles` écrit `regles.json` à côté du YAML
livré, et le JSON est versionné. Un test vérifie qu'il dit les mêmes règles que
le YAML. Le JSON est marqué comme généré pour GitHub.

**Conséquences.** Le YAML reste la pièce livrée, recopiée telle quelle. Une
livraison demande une commande de plus, que les skills d'intégration disent, et
que le test rappelle si on l'oublie. D-71 tient pour le reste : aucun analyseur
YAML dans le navigateur.

## Risques

| Id | Risque | Mesure |
|---|---|---|
| R-2 | Le JSON des règles oublié après une livraison | un test compare le JSON au YAML ; les skills d'intégration disent la commande |
