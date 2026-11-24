# ADR-0011 - Opt-out tenu par le CMS, transmis à l'iframe par `postMessage`

> Statut : **décidé** · 2026-09-30

**Décision (2026-09-30).** L'opt-out est un bouton du pied de page de Sites Conformes,
ajouté par un script que le CMS exécute sur toutes ses pages. Ce script garde le
choix sur le domaine du CMS et le transmet au simulateur par `postMessage` : quand
l'iframe le demande au démarrage, puis à chaque changement. Le traceur n'émet rien et
ne charge pas matomo.js tant que le choix n'est pas connu. Sur refus, il ne charge
rien ; sur un refus en cours de session, il cesse d'émettre. Sans réponse de la page
parente dans un court délai (app ouverte hors du CMS, script absent), la mesure suit
son cours. Le script du CMS est versionné dans ce dépôt et testé comme le reste.

**Pourquoi.** L'opt-out se place dans le pied de page du CMS pour l'UX : c'est là que
le prescripteur cherche ce réglage, et le simulateur n'a pas de pied de page propre
dans l'iframe. Or le navigateur isole le stockage de chaque origine, et range à part
celui d'une iframe tierce : aucun des opt-out natifs de Matomo (cookie posé par la
page du CMS, cookie tiers sur le domaine de Matomo) n'atteint notre traceur. Seul un
message entre les deux fenêtres franchit cette frontière. Le code de Sites Conformes
le permet : ses réglages « Scripts personnalisés » injectent un script sur chaque
page, sa CSP se limite à `frame-ancestors`, et son bloc iframe n'impose pas de
`sandbox` (voir R-1 de l'[ADR-0005](./0005-le-simulateur-s-integre-au-cms-par-une-iframe.md)). Seule la page
parente est écoutée, sans vérifier son origine : le message ne porte aucune donnée
et ne fait qu'arrêter ou reprendre notre propre mesure.

**Conséquences.** La page vue part avec un décalage d'au plus une seconde, le temps de
la réponse. Le suivi automatique des liens sortants est retiré : il aurait continué
après un refus en cours de session, `optUserOut` reposant sur un cookie que le
traceur n'écrit pas. Le bouton est inséré dans la liste du pied de page DSFR : si
Sites Conformes change cette structure, il disparaît sans erreur, et la recette doit
le vérifier après chaque montée de version du CMS. Le script vit dans les réglages du
CMS, hors de tout déploiement : sa mise à jour se fait à la main, depuis le fichier du
dépôt. Le refus est mémorisé dans le stockage du CMS, ce que l'exemption autorise pour
retenir une opposition.

Depuis le 2026-11-12, le même choix vaut pour le journal des parcours (ADR-0042) : sur
refus, le navigateur n'envoie rien au backend, et cesse d'envoyer sur un refus en
cours de session.
