---
name: ecrire-une-decision
description: Écrire une décision : une ligne du journal des décisions d'un chantier, ou un ADR d'un document de docs/knowledge/adr/. À charger dès qu'une décision structurante est prise, révisée ou révoquée, qu'on la note au journal, ou qu'on demande de « documenter l'archi ».
---

# Écrire une décision

Ce skill ne porte que la marche à suivre. Les règles sont ailleurs :

| Ce qu'il faut savoir | Où |
|---|---|
| le journal ou l'ADR, la forme d'une ligne du journal, la forme et le nom d'un ADR, ce qui n'y entre pas, les décisions renversées | [`docs/knowledge/contributing/ecrire-une-decision.md`](../../../docs/knowledge/contributing/ecrire-une-decision.md) |
| ce qui n'est pas une décision d'architecture, et où ça va | `AGENTS.md` § « Où écrire quoi » |

## 1. Choisir où l'écrire

```bash
ls docs/knowledge/adr apps/*/docs/knowledge/adr
```

| La décision | Où |
|---|---|
| prise pendant le chantier de la v10 du simulateur | `apps/simulateur-eligibilite/docs/knowledge/adr/journal-des-decisions-v10.md` |
| d'architecture, sur une app | un nouveau fichier dans son `docs/knowledge/adr/` |
| d'architecture, sur ce qui traverse les apps | un nouveau fichier dans `docs/knowledge/adr/` de la racine |

Lis les titres du dossier, puis les ADR du même sujet : une décision en précise
ou en renverse souvent une autre.

```bash
grep -h '^# ADR' apps/simulateur-eligibilite/docs/knowledge/adr/*.md
```

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

- **Un nouvel ADR** prend le numéro qui suit le dernier du dossier, dans son
  propre fichier. Il cite les `D-<n>` dont il vient.
- **Un ADR révisé** reçoit un encart daté sous son en-tête.
- **Un ADR révoqué** garde son fichier : change son statut, et cite l'ADR qui
  le remplace.

Ce qui touche le métier va dans `docs/knowledge/domain/`, pas dans l'ADR.

## 4. Vérifier

Chaque renvoi relatif doit ouvrir un fichier qui existe :

```bash
cd <dossier de l'ADR>
grep -oE '\]\(\.[^)#]+' <fichier>.md | cut -c3- | while read -r f; do [ -e "$f" ] || echo "mort : $f"; done
```

Si la décision change ce que fait le code, le commit qui la porte cite son
numéro : « (D-194) ».
