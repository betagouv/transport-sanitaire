# ADR-0048 - La taille des champs du document R3

> Statut : **décidé** · 2026-11-13 · Anciennement ADR-12 de `analytics.md`

**Contexte.** Le dashboard suit la plus petite taille imprimée d'un document R3,
la taille de chacun de ses champs, et leur évolution (K10 à K12, #389). Le
contrat de l'éditeur a les colonnes `field_group` et `font_size_pt`, mais aucun
événement de mesure. Son plan de marquage nomme `document_typography_measured`,
avec un identifiant de version, un état de la mesure, le nombre de champs
remplis, les champs mesurés et ceux qui ne le sont pas. Le cerfa rapetisse un
texte qui ne tient pas dans son cadre, jusqu'au plancher de 6 pt, ou le dessine
dessous : la taille de départ ne dit pas ce qui s'imprime.

**Décision.**

1. **Un événement par version.** `document_typography_measured` part avec
   `document_displayed`, une fois par version, avec `screen` (`R3`),
   `document_id`, `revision` et `support`. Il se relie aux impressions de la
   même version par `document_id`.
2. **Le champ.** Un champ rempli est une entrée de texte du DTO du cerfa qui a
   une valeur : un texte, une date, ou un texte dessiné hors des champs. Les
   cases n'en sont pas. `field_id` est sa clé dans le DTO (`depart_structure`),
   et `support` dit de quel cerfa. Un commentaire s'imprime dans le champ de son
   texte : il se mesure sous la clé de ce texte.
3. **La taille.** `font_size_pt` est la taille où le texte s'imprime, après le
   calcul qui le fait tenir : dans son champ, ou dessiné dessous. Un texte porté
   par plusieurs volets garde sa plus petite taille.
4. **La couverture.** `status` vaut `complete` quand chaque champ rempli a sa
   taille, et `partial` sinon. `unmeasured_field_ids` nomme les champs sans
   taille, qui ne figurent pas dans `fields`. Pas de nombre de champs remplis :
   il se lit dans les deux listes.
5. **L'empreinte.** La taille imprimée fait partie de l'empreinte d'une version
   (ADR-0046) : un rendu qui change, à DTO égal, ouvre la version suivante.

**Pourquoi.** La mesure appartient à la version, pas à l'impression : deux
impressions de la même version donnent un seul document et ses champs. La clé du
DTO est stable d'une version du modèle à l'autre, et c'est un nom écrit par le
code : le journal le borne à une forme d'identifiant, et refuse un texte saisi.
La plus petite taille est celle que le lecteur subit. Un champ sans taille fausserait
la classe du document : la mesure se dit incomplète plutôt que de la placer.

**Conséquences.** Le contrat de nos compléments reste en version 2 : `fields`,
`unmeasured_field_ids` et un type s'y ajoutent, et `status` reprend la colonne de
l'éditeur. Les noms du plan de marquage se lisent ainsi : `artifact_version_id`
est `document_id`, `measurement_status` est `status`. Aucun texte, aucune
longueur de texte ne part.

## Mises à jour

> **Mise à jour 2026-11-17, la taille des champs sous leur identifiant fermé (#508).**
> Le contrat v10.2.2 (ANA22-03) **révise** les points 2 et 4. Un champ se nomme
> par un identifiant de la liste fermée de l'éditeur, `<support>.<champ>`
> (`shared/analytics/typographic-fields.ts`), que chaque cerfa du modèle donne à
> ses textes : la structure et l'autre adresse d'une extrémité sont un seul
> champ, `*_adresse_native`, à la plus petite taille. `expected_field_ids` nomme
> les champs remplis, `field_measurements` la taille de ceux qui se sont
> mesurés : `status`, `fields` et `unmeasured_field_ids` disparaissent. La mesure
> porte aussi `document_revision`, qui vaut `document_id` en attendant la
> révision du document (#497), et ne part que pour un document d'un support
> connu. Le collecteur refuse un champ hors liste, d'un autre support, en double,
> ou mesuré sans être attendu. Un `document_id` n'a qu'une mesure : la même,
> rejouée sous un autre `event_id`, est ignorée, une autre est mise à part comme
> une collision.

> **Mise à jour 2026-11-13, la taille des champs du document R3 (#389).** Le journal
> reçoit, pour chaque version du document R3, la taille réellement imprimée de
> chaque champ rempli, sous la clé du champ dans le DTO, jamais son texte. Une
> mesure incomplète le dit. Voir l'ADR-0048. Cela **étend** l'ADR-0046 : la taille
> imprimée fait partie de l'empreinte d'une version.
