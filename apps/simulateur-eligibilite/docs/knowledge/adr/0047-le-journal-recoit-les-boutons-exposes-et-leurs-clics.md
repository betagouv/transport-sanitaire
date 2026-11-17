# ADR-0047 - Les boutons exposés, et leurs clics

> Statut : **décidé** · 2026-11-13 · Anciennement ADR-11 de `analytics.md`

**Contexte.** Le dashboard calcule, par simulation et par affichage, le taux de
clic de cinq boutons (#388) : « Imprimer » et « Télécharger » sur la fiche patient
de R2, les mêmes sur le document R3, et « Donner mon avis » en R2 ou en R3. Le
contrat de l'éditeur donne `feedback_exposed` et `feedback_clicked` pour l'avis.
Pour le document, il donne `document_print_requested`,
`document_download_requested` et `document_download_succeeded`. Il n'a rien pour
exposer les boutons du document, ni pour la fiche. R2 et R3 n'ouvraient aucun
affichage (ADR-0044), et la fiche n'avait pas d'identité.

**Décision.**

1. **L'affichage.** Chaque montage de R2 ou de R3 ouvre un affichage, numéroté
   comme ceux des pages (`page_view_id`), sans question ni phase. Revenir sur le
   même R2 en ouvre un nouveau, avec la même révision.
2. **La fiche.** Une fiche patient est une version : `f1`, `f2`… dans une
   simulation, une par révision qui en montre une. Le complément `sheet_id` la
   porte.
3. **L'exposition.** Un bouton est exposé quand il est posé et utilisable, une
   fois par affichage et par version d'objet, sous
   `exposure_id = page_view_id:bouton:objet`. Pour la fiche, c'est au chargement
   du R2. Pour le document, c'est quand sa version est prête, avec
   `document_displayed`. Un bouton grisé n'est pas exposé. La position dans la
   fenêtre ne compte pas.
4. **Les types.** Les boutons de la fiche et du document sont exposés par le
   complément `action_exposed`, avec `action` (`print` ou `download`) et
   `sheet_id` ou `document_id`. La fiche a trois compléments :
   `sheet_print_requested`, `sheet_download_requested` et
   `sheet_download_succeeded`. Le document et l'avis gardent les types de
   l'éditeur. Chaque exposition et chaque clic portent `screen`,
   `page_view_id`, `exposure_id` et `revision`. L'avis porte aussi
   `document_id` en R3.
5. **Le clic.** Chaque clic envoie sa demande, avec l'exposition du bouton
   cliqué : le dashboard compte un clic par exposition. Un clic qui relance une
   génération ratée du document n'a pas de version, et n'envoie rien.
6. **La réussite.** `…_download_succeeded` part quand le PDF est remis au
   navigateur, avec l'exposition de sa demande. Une préparation ratée, ou une
   page quittée avant la fin, n'envoie rien de plus.

**Pourquoi.** Le `page_view_id` garde un seul sens, « cette page, cette fois ».
Une exposition tenue par le bouton rattache son clic à l'affichage où il est
né, jamais à un autre. Toute modification qui changerait la fiche fait tomber la
révision : une empreinte n'ajouterait rien. Mettre la fiche dans `document_id`
fausserait le funnel R3 de l'éditeur. Un bouton offert est une mesure stable,
qui ne dépend ni de l'écran ni du défilement. Le code ne voit pas plus loin
que le fichier remis : il ne certifie pas un enregistrement.

**Conséquences.** Le contrat de nos compléments reste en version 2, qui n'est pas
encore livrée : `sheet_id`, `action` et quatre types s'y ajoutent. Le reducer de
l'éditeur lit ses types tels quels. Un taux « vu dans la fenêtre » serait un
autre fait, à décider s'il est demandé.

## Mises à jour

> **Mise à jour 2026-11-17, les boutons exposés et cliqués du contrat (#507).** Le
> contrat v10.2.2 (ANA22-02) **révise** les points 2 à 6. Les boutons de la fiche
> et du document sont exposés par `button_exposed` et cliqués par
> `button_clicked`, sous quatre `button_id` fermés (`patient_sheet_print`,
> `patient_sheet_download`, `document_print`, `document_download`) ;
> `action_exposed`, `action` et les trois `sheet_*` disparaissent. L'objet du
> bouton est `artifact_id` : la version de la fiche en R2, le document en R3, où
> il vaut `document_id` et porte `document_revision`. Le clic porte
> `activity_origin = user`. Une exposition ne change plus à chaque affichage :
> `exposure_id` (`<simulation>:b<n>`) n'est nouveau qu'après une vraie
> disparition (écran quitté, document en édition ou en aperçu, régénéré), une
> autre version de l'objet ou une autre révision. Un remontage technique garde
> la sienne. Un bouton grisé n'est ni exposé ni cliqué. Sur R3,
> `document_print_requested` et `document_download_requested` partent quand
> l'app lance vraiment l'impression ou le téléchargement, avec le même
> `document_id`, après le `button_clicked`. Le clic qui relance une génération
> ratée ne part pas, mais l'impression ou le téléchargement qu'il lance, une fois
> le document prêt, oui. Hypothèse du point 21 du retour à l'éditeur, à valider.

> **Mise à jour 2026-11-13, les boutons exposés et leurs clics (#388).** Le journal
> reçoit l'exposition et le clic d'« Imprimer » et de « Télécharger », sur la fiche
> patient de R2 et sur le document R3, et de « Donner mon avis ». R2 et R3 ouvrent
> désormais un affichage, et la fiche une version, `f1`, `f2`… Voir l'ADR-0047. Cela
> **étend** l'ADR-0044 aux écrans de résultat.
