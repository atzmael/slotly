import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = {
  title: "Confidentialité - Slotly",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Confidentialité" updatedAt="30 July 2026">
      <section>
        <h2>Responsable du traitement</h2>
        <p>
          Le responsable du traitement est Maël Maltete, entrepreneur individuel
          / micro-entrepreneur, joignable à{" "}
          <a href="mailto:creadiv.tech+slotly@gmail.com">
            creadiv.tech+slotly@gmail.com
          </a>
          .
        </p>
      </section>

      <section>
        <h2>Données collectées</h2>
        <p>
          Slotly limite les données collectées au fonctionnement du service :
        </p>
        <ul>
          <li>nom de l’événement ;</li>
          <li>dates, heures et paramètres du sondage ;</li>
          <li>nom saisi par chaque participant ;</li>
          <li>fuseau horaire détecté du participant ;</li>
          <li>disponibilités sélectionnées ;</li>
          <li>
            données techniques nécessaires à la sécurité et au diagnostic.
          </li>
        </ul>
        <p>
          Il est recommandé de ne pas saisir de données sensibles dans les noms
          d’événements ou de participants.
        </p>
      </section>

      <section>
        <h2>Finalités</h2>
        <p>Ces données sont utilisées pour :</p>
        <ul>
          <li>créer et afficher les sondages ;</li>
          <li>enregistrer les participants et leurs disponibilités ;</li>
          <li>calculer les meilleurs créneaux ou dates ;</li>
          <li>prévenir les abus et assurer la sécurité du service ;</li>
          <li>mesurer l’usage du produit de manière agrégée.</li>
        </ul>
      </section>

      <section>
        <h2>Base légale</h2>
        <p>
          Les traitements nécessaires au fonctionnement du service reposent sur
          l’exécution du service demandé par l’utilisateur. Les traitements de
          sécurité et de mesure d’audience limitée reposent sur l’intérêt
          légitime de l’éditeur à maintenir et améliorer le service.
        </p>
      </section>

      <section>
        <h2>Visibilité des sondages</h2>
        <p>
          Les sondages Slotly sont accessibles à toute personne disposant du
          lien. Le lien agit comme un jeton de partage. Ne partagez pas un lien
          avec des personnes qui ne doivent pas accéder au sondage.
        </p>
      </section>

      <section>
        <h2>Conservation</h2>
        <p>
          Les sondages inactifs peuvent être supprimés automatiquement après la
          date de fin du sondage et une période d’inactivité. Les données
          techniques et statistiques peuvent être conservées pour des durées
          différentes selon les contraintes de sécurité, d’hébergement et
          d’analyse agrégée.
        </p>
      </section>

      <section>
        <h2>Analytics et traceurs</h2>
        <p>
          Slotly utilise Vercel Analytics et Vercel Speed Insights pour mesurer
          l’audience et les performances du service de manière agrégée, sans
          finalité publicitaire.
        </p>
        <p>
          PostHog peut être utilisé uniquement s’il est explicitement activé sur
          l’environnement de déploiement. Dans ce cas, il doit rester limité à
          des événements produit non sensibles : aucun nom de participant, titre
          d’événement ou contenu libre ne doit être envoyé dans les événements
          analytics.
        </p>
      </section>

      <section>
        <h2>Sous-traitants</h2>
        <p>Slotly s’appuie notamment sur :</p>
        <ul>
          <li>Vercel, pour l’hébergement et la mesure de performance ;</li>
          <li>Supabase, pour la base de données et le temps réel ;</li>
          <li>
            PostHog, uniquement si l’analytics produit optionnel est activé.
          </li>
        </ul>
      </section>

      <section>
        <h2>Vos droits</h2>
        <p>
          Vous pouvez demander l’accès, la rectification ou la suppression de
          vos données, ainsi que vous opposer à certains traitements, en
          écrivant à{" "}
          <a href="mailto:creadiv.tech+slotly@gmail.com">
            creadiv.tech+slotly@gmail.com
          </a>
          .
        </p>
        <p>
          Si vous estimez que vos droits ne sont pas respectés, vous pouvez
          introduire une réclamation auprès de la CNIL.
        </p>
      </section>
    </LegalPage>
  );
}
