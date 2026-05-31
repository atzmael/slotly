# Slotly - Architecture

> **Lire pour :** stack cible, decoupage technique et strategie d'implementation.

**Status :** Canonical draft  
**Derniere mise a jour :** 2026-05-31

---

## Decision Stack

| Couche | Choix |
|--------|-------|
| Frontend | Next.js + React |
| Langage | TypeScript strict |
| Styling | Tailwind CSS + shadcn/ui |
| Domaine metier | Fonctions TypeScript pures + tests |
| Backend | Supabase |
| DB | Supabase Postgres |
| Realtime | Supabase Realtime |
| Security | Supabase Row Level Security |
| ORM | Aucun ORM en MVP, client Supabase type |
| Auth | Aucun compte en MVP |
| Deploiement | Vercel |
| Acces app | Public by default, optional `APP_ACCESS_MODE` for launch control |

## Architecture Cible

```txt
ADR
  -> domain pure functions + tests
  -> application services
  -> persistence adapters
  -> Next UI / API
```

Decoupage indicatif :

```txt
src/domain/scheduling
src/domain/availability
src/domain/results
src/domain/timezone

src/server/db
src/server/services
src/server/realtime

src/app
src/features/scheduling
src/features/results
src/components/ui
```

## Regles D'Architecture

- Les regles metier doivent etre testables sans Next.js.
- Les routes Next appellent des services applicatifs.
- Les services applicatifs orchestrent Supabase, validation, realtime et domaine.
- Les fonctions domaine ne connaissent pas Supabase, cookies ou React.
- Les tests domaine doivent couvrir les invariants avant l'UI.
- Le MVP reste accountless : pas de login, pas d'onboarding, pas de profils.
- Les liens publics doivent etre difficiles a enumerer.
- Les mutations doivent etre validees cote serveur meme si l'UI est simple.
- Les updates realtime ne remplacent pas la validation et la persistence serveur.
- Toute feature doit passer par la checklist feature avant developpement.

## Realtime

Le MVP doit supporter des updates live sur les pages event et results :

- apparition d'un nouveau participant ;
- mise a jour de disponibilite ;
- recalcul visible du ranking ;
- heatmap mise a jour sans refresh manuel.

Supabase Realtime est le choix cible pour eviter d'implementer un systeme WebSocket maison.

## Modes D'Acces Applicatifs

Variable d'environnement optionnelle pour gerer le lancement :

```txt
APP_ACCESS_MODE=public | landing_only | whitelist | maintenance
```

Comportement :

- `public` : toutes les pages MVP ouvertes.
- `landing_only` : landing ouverte, creation et participation bloquees.
- `whitelist` : reserve a un mecanisme de preview a definir.
- `maintenance` : landing et pages legales ouvertes, creation et mutations bloquees.

Regle canonique :

- aucun mode d'acces applicatif ne doit bloquer les pages publiques necessaires a la decouverte ou aux pages legales ;
- les guards de creation et mutation s'appliquent cote serveur, pas uniquement dans l'UI ;
- les APIs et mutations doivent respecter le meme mode d'acces que les pages ;
- une coupure technique totale du site est hors scope de `APP_ACCESS_MODE` et releve de l'infrastructure.
