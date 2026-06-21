# Slotly - Schema Conceptuel

> **Lire pour :** modele de donnees cible.

**Status :** Canonical draft  
**Derniere mise a jour :** 2026-05-31

---

## Decision

L'implementation cible Supabase Postgres avec Supabase Realtime.

Le schema doit rester lisible par domaine :

- events ;
- participants ;
- availability ;
- computed result windows ;
- feature flags ;
- optional audit/debug tables later.

## Tables MVP

### Events

Table canonique : `events`.

Champs cibles :

- `id`: public id non enumerable ;
- `title`: nom de l'evenement ;
- `start_date`: date locale de debut ;
- `end_date`: date locale de fin ;
- `start_time`: heure locale de debut de la fenetre quotidienne ;
- `end_time`: heure locale de fin de la fenetre quotidienne ;
- `duration_minutes`: 30, 60, 120, 180 ou 240 ;
- `slot_size_minutes`: 30 ou 60 ;
- `created_at`.

Regles :

- Pas de compte createur en MVP.
- Le lien `/e/{eventId}` est l'identifiant de partage.
- La page resultats est `/e/{eventId}/results`.
- La fenetre horaire quotidienne est configurable a la creation et remplace
  toute plage horaire hardcodee cote UI.

### Participants

Table canonique : `participants`.

Champs cibles :

- `id` ;
- `event_id` ;
- `name` ;
- `normalized_name` ;
- `timezone` ;
- `created_at` ;
- `updated_at`.

Regles :

- Aucun compte requis.
- Le nom est libre mais doit etre limite, nettoye et masque dans les logs.
- `normalized_name` est calcule par trim, collapse des espaces, suppression des
  accents et comparaison case-insensitive.
- Un poll ne peut avoir qu'un participant par `normalized_name`.
- Si le nom trimme correspond exactement a un participant existant, le join
  reconnecte ce participant accountless ; si seulement le nom normalise
  correspond, l'interface demande de choisir un nom plus specifique.
- Le fuseau horaire est detecte automatiquement cote client et persiste avec le participant.

### Availability

Table canonique : `availability_windows`.

Champs cibles :

- `id` ;
- `participant_id` ;
- `start_at` ;
- `end_at`.

Regles :

- Les disponibilites sont stockees en instants normalises.
- Le MVP ne gere que deux etats : available / not available.
- L'absence de fenetre disponible signifie not available.
- Les fenetres peuvent etre fusionnees ou normalisees a l'ecriture pour reduire le volume.

## Engine De Disponibilite

Le domaine transforme les fenetres de disponibilite en creneaux valides selon :

- date range de l'event ;
- `duration_minutes` ;
- `slot_size_minutes` ;
- disponibilites participants normalisees.

Pour chaque creneau candidat :

- `availableCount` ;
- `availableParticipants` ;
- `missingParticipants`.

Exemple :

```txt
availability: 18:00 -> 22:00
duration: 2h
slot size: 1h

valid slots:
- 18:00 -> 20:00
- 19:00 -> 21:00
- 20:00 -> 22:00
```

## Supabase RLS

Le MVP est public mais doit rester protege contre l'abus trivial.

Principes :

- lecture publique via RPC ciblee par event id public ;
- pas de lecture directe anon des tables MVP par defaut ;
- insertion event/participant/availability via services serveur et `SUPABASE_SECRET_KEY` ;
- event ids non enumerables ;
- rate limiting applicatif si necessaire ;
- aucune donnee sensible stockee hors nom libre et timezone.

Migration initiale :

- [`../../supabase/migrations/202605310001_initial_mvp.sql`](../../supabase/migrations/202605310001_initial_mvp.sql)
