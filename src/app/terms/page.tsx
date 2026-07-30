import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = {
  title: "Conditions d’utilisation - Slotly",
};

export default function TermsPage() {
  return (
    <LegalPage title="Conditions d’utilisation" updatedAt="30 July 2026">
      <section>
        <h2>Objet</h2>
        <p>
          Slotly est un service de sondage de disponibilités permettant de créer
          un lien public, de collecter les disponibilités des participants et
          d’identifier les meilleurs créneaux ou dates.
        </p>
      </section>

      <section>
        <h2>Accès au service</h2>
        <p>
          Le service est fourni sans création de compte. Toute personne
          disposant du lien d’un sondage peut accéder au sondage concerné.
          L’utilisateur est responsable du partage de ce lien.
        </p>
      </section>

      <section>
        <h2>Usage autorisé</h2>
        <p>
          L’utilisateur s’engage à utiliser Slotly uniquement pour organiser des
          événements licites et à ne pas publier de contenu illicite, injurieux,
          discriminatoire, trompeur ou portant atteinte aux droits de tiers.
        </p>
        <p>
          Il est interdit de tenter de perturber le service, de contourner les
          mesures de sécurité, d’automatiser abusivement des actions ou
          d’exploiter le service à des fins de spam.
        </p>
      </section>

      <section>
        <h2>Données saisies</h2>
        <p>
          Les noms d’événements et noms de participants sont saisis librement
          par les utilisateurs. Il est recommandé de ne pas renseigner
          d’informations sensibles ou confidentielles dans ces champs.
        </p>
      </section>

      <section>
        <h2>Disponibilité du service</h2>
        <p>
          Slotly est fourni en l’état, dans le cadre d’un MVP public. Des
          interruptions, évolutions ou suppressions de fonctionnalités peuvent
          intervenir, notamment pour maintenance, sécurité ou limitation des
          abus.
        </p>
      </section>

      <section>
        <h2>Suppression des sondages inactifs</h2>
        <p>
          Les sondages sans activité après leur date de fin peuvent être
          supprimés automatiquement afin de limiter la conservation des données
          et de préserver les ressources techniques du service.
        </p>
      </section>

      <section>
        <h2>Absence de vente</h2>
        <p>
          Slotly ne propose actuellement aucun abonnement, commande ou paiement.
          Les présentes conditions ne constituent donc pas des conditions
          générales de vente.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Pour toute question sur le service :{" "}
          <a href="mailto:creadiv.tech+slotly@gmail.com">
            creadiv.tech+slotly@gmail.com
          </a>
          .
        </p>
      </section>
    </LegalPage>
  );
}
