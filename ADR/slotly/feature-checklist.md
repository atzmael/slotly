# Slotly - Feature Checklist

> **Lire pour :** cadrer chaque nouvelle feature avant developpement.

**Status :** Canonical draft  
**Derniere mise a jour :** 2026-05-31

---

## Objectif

Chaque feature Slotly doit etre pensee comme une mecanique durable, testable, observable et respectueuse de la vie privee.

Cette checklist est obligatoire avant implementation, que la feature soit developpee par un humain ou par une IA.

---

## Checklist Courte

Avant de coder, repondre a :

1. Domaine : quelle regle pure, framework agnostic ?
2. Service : quelle orchestration DB + domaine ?
3. Acces : cette action reste-t-elle compatible avec un MVP sans compte ?
4. Lien public : comment eviter enumeration, abus et modifications accidentelles ?
5. Realtime : que doit voir une autre personne deja ouverte sur la page ?
6. Side effects : realtime, analytics safe, logs ?
7. Chaining : comment les effets secondaires sont-ils decouples ?
8. Idempotence : que se passe-t-il si l'action est rejouee ?
9. Concurrence : que se passe-t-il si deux acteurs agissent en meme temps ?
10. Tests : unitaires, integration, e2e ?
11. UX : etats, erreurs, textes, fuseaux horaires ?
12. Exploits : quels abus possibles ?
13. Performance : impact a volume realiste ?
14. Data model : tables, index, contraintes, migrations ?
15. Reversibilite : peut-on annuler/reparer ?
16. Resultats : comment cette feature affecte ranking, heatmap ou presents/absents ?
17. Feature flag : comment activer/desactiver par environnement ?
18. Observabilite : quels logs, compteurs et erreurs ?
19. Privacy : quels champs sont autorises, haches, masques ou interdits ?
20. Monetisation : cette feature preserve-t-elle le coeur gratuit et sans compte ?

---

## Domaine Standalone

Chaque mecanique doit avoir un noyau domaine pur.

Interdit dans le domaine :

- React ;
- Next ;
- cookies ;
- Drizzle/Prisma ;
- acces DB ;
- fetch ;
- realtime ;
- analytics ;
- i18n UI.

Le domaine prend une entree typee et retourne un resultat type.

Exemple :

```ts
rankAvailabilitySlots(input: AvailabilityRankingInput): RankedSlot[]
```

---

## Service Applicatif

Le service orchestre :

- acces public ou validation de lien ;
- chargement DB ;
- appel domaine ;
- persistance ;
- emission d'evenements metier ;
- realtime.

Exemple :

```txt
availabilityService.save(command)
  -> load event and participant
  -> domain.normalizeAvailability(input)
  -> persist outcome
  -> emit AvailabilityUpdated
```

---

## Chaining Et Effets Secondaires

Les effets secondaires ne doivent pas etre enfouis dans la fonction domaine.

Effets concernes :

- realtime broadcasts ;
- analytics safe ;
- logs applicatifs ;
- webhooks ;

Pattern cible :

```txt
domain function
  -> returns outcome

service
  -> persists outcome
  -> emits domain events

sideEffectDispatcher
  -> realtime
  -> analytics
  -> logs
```

Les side effects doivent etre encapsules :

- erreurs catchées ;
- retry possible ;
- un echec realtime ne doit pas annuler un changement deja persiste ;
- le resultat doit indiquer quels effets ont reussi/echoue.

---

## Debug Futur

Le MVP ne prevoit pas de panel admin. Les mecaniques importantes doivent toutefois rester testables par unit tests, integration tests, fixtures et scripts locaux.

Exemples :

- creer un event fixture ;
- generer des participants ;
- simuler une double soumission ;
- verifier le ranking ;
- verifier les conversions timezone.

Si des commandes debug sont ajoutees plus tard, elles doivent appeler les memes services applicatifs que le produit normal.
