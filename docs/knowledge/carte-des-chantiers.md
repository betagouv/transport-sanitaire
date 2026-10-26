# La carte des chantiers

> Comment lire l'avancement d'un gros chantier sur un seul schéma : ses
> étapes, leur ordre, et où en est chacune. Le skill `carte-des-chantiers`
> la dessine. L'état d'une issue se déduit comme le dit
> [`apps/cli/README.md`](../../apps/cli/README.md#les-chantiers) ; la carte y
> ajoute ce que GitHub ne dit pas : ce que l'éditeur a livré, et ce qui est
> planifié.

## Les cinq couleurs

Une case = une issue (un chantier, une étape, une tâche). Sa couleur dit où
elle en est, de la plus avancée à la moins avancée.

| Couleur | État | Se reconnaît à |
|---|---|---|
| Vert | terminé | l'issue est fermée, et le travail est fusionné dans la ligne du chantier |
| Jaune | en cours | une partie est fusionnée, ou une branche ou une PR ouverte la sert |
| Bleu | plan fait, dév pas commencé | l'issue est découpée en sous-issues, ou son corps a un cadrage avec des critères d'acceptation ; rien n'est codé |
| Violet | package livré, pas de plan | le livrable de l'éditeur couvre l'étape, mais l'issue tient en quelques lignes, sans découpage |
| Gris | pas de package | l'étape attend des pièces que l'éditeur n'a pas livrées : citées dans une réponse, absentes de `tmp/<version>/package/` |

Une case neutre en pointillés est hors échelle, comme la PR d'ensemble d'un
chantier vers `staging`.

## Les cas limites

- **Une issue fermée n'est pas forcément verte.** Le workflow de fermeture
  ferme l'issue à la première PR fusionnée de sa branche, même s'il reste du
  travail. Si une issue de suivi ou un commentaire dit qu'il en reste, la case
  est jaune, et la carte le signale.
- **Un parent prend la couleur de ses enfants.** Tous verts : vert. Au moins
  un vert ou jaune, et pas tous verts : jaune. Sinon, la couleur la moins
  avancée qui couvre la majorité, et la carte le détaille.
- **Une tâche en partie bloquée par l'éditeur** garde la couleur de ce qui
  est faisable, et sa légende dit ce qui manque (« en partie », « manque
  doc »).
- **Un plan remis en cause** (« à replanifier ») n'est plus bleu : violet si
  le livrable couvre la reprise, gris s'il ne la couvre pas.
- **Une tâche annoncée sans issue** figure quand même, en gris ou en violet,
  avec la mention « pas d'issue ».

## La disposition

De haut en bas :

1. **Le socle**, dans un cadre : ce qui ne dépend pas du modèle.
2. **La chaîne du chantier**, dans l'ordre du parcours (P0, P1, P2, R2, P3,
   les cerfa, la recette, la fusion vers `staging`). Une flèche suit l'ordre ;
   une étape qui en débloque une autre (« Étape 0 ») se pose au-dessus de
   celle-ci, avec une flèche.
3. **Le détail de l'étape en cours**, dans un cadre jaune : ses sous-issues.
4. **En parallèle** : ce qui ne s'inscrit pas dans la chaîne (vocabulaire,
   seeds, outillage, skills).
5. **La légende** des cinq couleurs.

Une case porte un titre court et une ligne de cinq mots au plus : le numéro
d'issue, et ce qu'il faut savoir (« manque doc », « à découper »). Le
détail va dans le texte qui accompagne la carte.

Restent hors de la carte les issues qui ne servent aucune étape du chantier
(un nommage, une mesure de l'outillage).
