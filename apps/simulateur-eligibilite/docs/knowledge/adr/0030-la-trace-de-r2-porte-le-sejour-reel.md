# ADR-0030 - La trace de R2 porte le séjour réel ; les précisions restent à l'éditeur

> Statut : **décidé** · 2026-10-23 · Anciennement ADR-19 de `metier-et-ecran.md`
>
> Décidé par l'agent qui a mené le chantier, sur délégation, le 2026-10-22 :
> à relire (issues 202 à 207).

**Contexte.** R2 calculait le « séjour réel » pour l'identifiant du lexique
`H-SEJOUR-…` de ses précisions. Le texte de la fiche négative le redécoupait
par `startsWith("H-SEJOUR")` pour savoir s'il y avait un séjour. L'ADR-0026
annonçait que les précisions resteraient des valeurs nues jusqu'aux concepts.

**Décision.** La trace porte `sejourReel: true` quand `UN_SEJOUR_REEL`
(~~`Sejour.estReel()`~~, ADR-0032) le dit, et rien sinon. La clé n'est pas dans les précisions : leurs clés et leurs
valeurs sont celles de l'éditeur, et `sejourReel` n'en est pas une.
L'identifiant du lexique reste calculé dans les précisions : il mêle le séjour
et les séances, et sa forme est une clé de l'éditeur.

Les précisions restent des valeurs nues : elles suivent le contrat de
l'éditeur, que rien ne lit en dehors des textes de R2.

**Conséquences.** Un texte de R2 ne redécoupe plus un identifiant pour savoir
ce qu'une réponse a dit. Un test de la trace dit le séjour réel et son absence
en HAD à domicile.

## Mises à jour

> **Mise à jour 2026-10-28, le filtrage par le graphe (#255).** L'ADR-0035 écrit
> la phase 2 de #196 : le graphe des règles compilé au build, ce que lit
> chaque morceau du résultat, et le socle qui saute une question dont la
> réponse ne change rien de ce que montre le résultat. L'ADR-0030 est précisé :
> chaque précision de R2 se lit sous les issues de son texte. Décisions de
> Simon, au journal D-216 à D-226.
