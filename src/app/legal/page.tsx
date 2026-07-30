import type { Metadata } from "next";
import { getRequestLocale } from "@/i18n/locale";
import { messages } from "@/i18n/messages";
import { LegalPage } from "../legal-page";
import { createPageMetadata } from "../site-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const t = messages[locale].meta;

  return createPageMetadata({
    locale,
    title: t.legalTitle,
    description: t.legalDescription,
    path: "/legal",
  });
}

export default function LegalNoticePage() {
  return (
    <LegalPage title="Mentions légales" updatedAt="30 juillet 2026">
      <section>
        <h2>Éditeur du site</h2>
        <p>
          Slotly est édité par Maël Maltete, entrepreneur individuel /
          micro-entrepreneur, domicilié au 73 Rue de Malnoue, 93160
          Noisy-le-Grand, France.
        </p>
        <p>
          L’entreprise individuelle est inscrite au R.C.S. de Bobigny sous le
          numéro Bobigny A 953 748 159.
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
          Les contenus éditoriaux publics de Slotly peuvent être réutilisés sous
          licence Creative Commons lorsque cette licence est explicitement
          indiquée sur le support concerné. À défaut d’indication, toute
          réutilisation non autorisée reste interdite.
        </p>
        <p>
          Le nom Slotly, le logo, les éléments d’interface, le code source, les
          éléments techniques et les signes distinctifs restent protégés par les
          droits applicables.
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
