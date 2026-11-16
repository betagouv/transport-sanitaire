# ADR-0052 - Le domaine n'importe pas un adaptateur

> Statut : **décidé** · 2026-11-16

**Contexte.** L'app passe en clean architecture, dossier après dossier (#414).
Chaque fichier dit son rôle par son suffixe (QUAL-018). Les suffixes ne disent
pas qui a le droit d'importer qui : une entité pouvait importer publicodes, ou
un use case l'adaptateur Grist, sans qu'aucune règle ne s'y oppose. Le journal
des parcours avait déjà la sienne (ADR-0043), pour lui seul.

**Décision.** Les dépendances vont de l'extérieur vers le domaine, jamais
l'inverse.

- Le domaine, c'est-à-dire les entités, les value objects, les services, les
  use cases, les erreurs et les ports, n'importe aucun adaptateur.
- Une bibliothèque externe reste derrière un port : seul un adaptateur
  l'importe. Le domaine dit ce qu'il attend dans le port, et reçoit
  l'adaptateur en paramètre.
- L'index d'un module (ADR-0039) peut exporter un adaptateur : c'est par lui
  que le point d'entrée de l'app le branche.

Exemple : le moteur de décision déclare `DecisionEngine` dans un port.
publicodes n'est importé que par les deux adaptateurs qui l'implémentent. Le
reste du socle ne sait pas que les règles sont écrites en publicodes.

**Conséquences.** Changer de bibliothèque ne touche que ses adaptateurs. Le
domaine se teste sans elle. La règle est gardée par un test dans `core/socle/` ;
les autres racines y entrent à mesure qu'elles prennent leurs suffixes (#414).
L'ADR-0043 reste la règle du journal, plus stricte : son domaine n'importe que
lui-même et le contrat partagé.
