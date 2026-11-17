# ADR-0046 - Le document R3 et ses versions

> Statut : **décidé** · 2026-11-13 · Anciennement ADR-10 de `analytics.md`

**Contexte.** Le dashboard compte une simulation menée jusqu'au bout quand le
document R3 affiché appartient au R2 encore valide (#387). Le contrat de
l'éditeur donne `document_displayed`, avec `document_id` et `revision`, et
`document_generation_failed`. Il dit qu'une modification de P1 ou de P2 invalide
le R2 et ses documents, et qu'une modification documentaire remplace
`document_id`. Il ne dit ni d'où vient cet identifiant, ni quand un document est
affiché, ni ce qu'un échec porte.

**Décision.**

1. **La version.** Un document est une version : `d1`, `d2`… dans une
   simulation. Son contenu, le nom du fichier daté et le DTO du cerfa, et la
   révision du R2 dont il vient, en font l'empreinte. Une empreinte nouvelle
   ouvre la version suivante ; la même empreinte, au retour sur R3 sans
   changement, garde la version et ne repart pas.
2. **L'affichage.** `document_displayed` part quand le PDF est prêt et affiché,
   une fois par version, avec `document_id`, `revision`, et le `support` et le
   `mode` de la révision courante quand ils ont une valeur.
3. **L'invalidation.** Aucun événement de plus : un document tombe avec son R2
   (`result_invalidated`), et une modification de P3 le remplace par la version
   suivante.
4. **L'échec.** `document_generation_failed` part à chaque tentative ratée, la
   première et chaque nouvel essai, avec la révision et le support, sans cause.
   Un échec n'ouvre aucune version.
5. **Sans révision.** Rien ne part d'un document sans R2 courant.

**Pourquoi.** Le journal ne survit pas à l'onglet (R-14 de l'[ADR-0049](./0049-le-journal-dit-comment-la-page-s-est-chargee.md)) : une version n'a pas à
se retrouver d'une session à l'autre, un compteur suffit. L'empreinte suit ce que
le PDF montre : le prescripteur qui revient sur R3 sans rien changer voit le même
document. Le reducer de l'éditeur ne lit que la révision d'un document : un
événement d'invalidation de plus ne changerait aucun compte. La cause d'un échec
viendrait des réponses, que le journal ne prend pas.

**Conséquences.** La ligne de #387 sur « l'invalidation d'un artefact » se lit
comme ci-dessus : remplacé, ou tombé avec son R2. Un R3 d'une révision ne complète
pas la suivante, puisque sa révision ne vaut plus la révision courante.

## Mises à jour

> **Mise à jour 2026-11-17, la révision du document (#497).** Cela **révise**
> les points 1, 2 et 3, d'après R13 du référentiel v10.2.1. Une révision du
> document, `dr1`, `dr2`… dans une simulation, naît sous la révision du R2 au
> premier document affiché. Une page de P3 validée qui change les réponses
> l'invalide : `document_invalidated` part, avec la `revision` du R2 et la
> nouvelle `document_revision` attendue. Revalider sans rien changer, ou
> reculer, n'invalide rien, et sans document affiché il n'y a rien à
> invalider. La version garde son rôle : elle change dès que le PDF change, même
> rendu autrement sous la même révision du document, dont l'identifiant entre
> dans son empreinte. `document_displayed`, la mesure, les gestes sur le
> document, ses boutons et l'avis en R3 portent `document_revision` et
> `document_id`. `document_displayed` exige un support de cerfa : sans lui,
> aucune version ne s'ouvre.

> **Mise à jour 2026-11-17, la composition du transport (#509).**
> `document_displayed` porte aussi `transport_composition`, celle de sa
> révision : un document garde la composition de son propre R2, jamais celle
> d'un R2 plus récent (ANA22-04). Son `mode` suit les règles de l'ADR-0045.

> **Mise à jour 2026-11-13, le document R3 et ses versions (#387).** Le journal reçoit
> chaque version du document R3 affichée, `d1`, `d2`…, avec la révision du R2 dont
> elle vient, et chaque échec de sa génération. Une version tombe avec son R2, et
> une modification de P3 la remplace. Voir l'ADR-0046.
