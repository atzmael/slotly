# Slotly - Index ADR Specialises

> **Lire pour :** naviguer dans les regles canoniques de Slotly.

## Documents

| Fichier | Responsabilite |
|---------|----------------|
| [`architecture.md`](./architecture.md) | Stack, architecture cible, strategie d'implementation |
| [`feature-checklist.md`](./feature-checklist.md) | Checklist obligatoire pour developper une feature |
| [`schema.md`](./schema.md) | Modele conceptuel DB |
| [`admin-testing.md`](./admin-testing.md) | Debug futur, fixtures, tests unitaires, tests e2e |
| [`observability.md`](./observability.md) | Erreurs production, logs serveur, analytics, privacy |
| [`monetization.md`](./monetization.md) | Strategie de monetisation future et protections du coeur gratuit |

## Regles De Maintenance

- Chaque regle detaillee doit vivre dans un seul fichier specialise.
- Le hub [`../slotly.md`](../slotly.md) ne doit pas devenir un monolithe.
- Les ADR specialises decrivent le resultat canonique, pas l'historique des discussions.
- Une regle non tranchee ne doit pas etre melangee aux regles canoniques.
- L'implementation doit etre ecrite contre ces ADR et des tests domaine.
- Chaque feature doit etre concue avec [`feature-checklist.md`](./feature-checklist.md).

## Statut

Ces ADR sont en **canonical draft** jusqu'a relecture manuelle complete.
