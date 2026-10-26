---
name: ecrire-une-decision
description: Écrire une décision : une ligne du journal des décisions d'un chantier, ou un ADR d'un document de docs/knowledge/adr/. À charger dès qu'une décision structurante est prise, révisée ou révoquée, qu'on la note au journal, ou qu'on demande de « documenter l'archi ».
---

# Écrire une décision

Ce skill ne porte que la marche à suivre. Les règles sont ailleurs :

| Ce qu'il faut savoir | Où |
|---|---|
| le journal ou le document, la forme d'une ligne du journal, le squelette d'un document, les décisions renversées | [`docs/knowledge/contributing/ecrire-une-decision.md`](../../../docs/knowledge/contributing/ecrire-une-decision.md) |
| ce qui n'est pas une décision d'architecture, et où ça va | `AGENTS.md` § « Où écrire quoi » |

## 1. Choisir où l'écrire

```bash
ls docs/knowledge/adr apps/*/docs/knowledge/adr
```

| La décision | Où |
|---|---|
| prise pendant le chantier de la v10 du simulateur | `apps/simulateur-eligibilite/docs/knowledge/adr/journal-des-decisions-v10.md` |
| sur le partage entre le métier et l'écran, le socle et les modèles | `apps/simulateur-eligibilite/docs/knowledge/adr/metier-et-ecran.md` |
| sur un autre sujet d'une app | le document de ce sujet dans son `docs/knowledge/adr/`, ou un nouveau |
| sur ce qui traverse les apps | `docs/knowledge/adr/` de la racine |

Lis le document en entier avant d'y écrire : une décision en précise ou en
renverse souvent une autre.

## 2. Ajouter une ligne au journal

Prends le numéro au journal de `staging`, pas à celui de ta branche :

```bash
git fetch origin
git show origin/staging:apps/simulateur-eligibilite/docs/knowledge/adr/journal-des-decisions-v10.md |
  grep -o '^| D-[0-9]*' | tail -1
```

Écris la ligne à la fin du tableau. Dis d'où vient la décision, et ce qu'elle
précise ou remplace. Si elle en remplace une, barre l'ancienne et ajoute
« Remplacé par D-<n> ».

Mets à jour la date de l'en-tête du journal.

## 3. Écrire ou réviser un ADR

- **Un nouvel ADR** prend le numéro qui suit, dans la section « Décisions
  (ADR) », avec ses trois paragraphes. Il cite les `D-<n>` dont il vient.
- **Un ADR renversé** garde sa place. Barre ce qui ne vaut plus dans son titre,
  et écris l'encart daté en tête du document.
- **Un nouveau document** part du squelette de `ecrire-une-decision.md`.

Puis suis ce qui en dépend dans le même document : le tableau des composants, le
découpage, les risques, et la date de l'en-tête.

## 4. Vérifier

Chaque renvoi relatif doit ouvrir un fichier qui existe :

```bash
cd <dossier du document>
grep -oE '\]\(\.[^)#]+' <document>.md | cut -c3- | while read -r f; do [ -e "$f" ] || echo "mort : $f"; done
```

Lance ensuite les commandes de la section « Vérification » du document, s'il en
a une.

Si la décision change ce que fait le code, le commit qui la porte cite son
numéro : « (D-194) ».
