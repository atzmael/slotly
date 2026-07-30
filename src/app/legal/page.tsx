import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = {
  title: "Mentions légales - Slotly",
};

export default function LegalNoticePage() {
  return (
    <LegalPage title="Mentions légales" updatedAt="30 July 2026">
      <section>
        <h2>Éditeur du site</h2>
        <p>
          Slotly est édité par Maël Maltete, entrepreneur individuel /
          micro-entrepreneur, domicilié au 73 Rue de Malnoue, 93160
          Noisy-le-Grand, France.
        </p>
        <p>
          L’entreprise est inscrite au R.C.S. de Bobigny sous le numéro Bobigny
          A 953 748 159.
        </p>
        <p>
          Contact :{" "}
          <a href="mailto:creadiv.tech+slotly@gmail.com">
            creadiv.tech+slotly@gmail.com
          </a>
        </p>
      </section>

      <section>
        <h2>Directeur de publication</h2>
        <p>Le directeur de publication est Maël Maltete.</p>
      </section>

      <section>
        <h2>Hébergement</h2>
        <p>
          Le site est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina,
          CA 91723, États-Unis.
        </p>
      </section>

      <section>
        <h2>Propriété intellectuelle</h2>
        <p>
          Sauf mention contraire, les contenus textuels publics de Slotly sont
          mis à disposition sous licence Creative Commons. Les marques, logos,
          noms de domaine, éléments d’interface et éléments techniques restent
          protégés par les droits applicables.
        </p>
      </section>

      <section>
        <h2>Signalement</h2>
        <p>
          Pour signaler un bug, un contenu illicite ou une demande liée à vos
          données personnelles, contactez{" "}
          <a href="mailto:creadiv.tech+slotly@gmail.com">
            creadiv.tech+slotly@gmail.com
          </a>
          .
        </p>
      </section>
    </LegalPage>
  );
}
