import type { ReactElement, ReactNode } from "react";
import Link from "next/link";

function P({ children }: { children: ReactNode }) {
  return <p className="text-elsai-ink/85 mb-5 leading-relaxed">{children}</p>;
}

function H2({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2
      id={id}
      className="text-elsai-pin-dark mt-12 mb-4 scroll-mt-24 font-serif text-2xl md:text-3xl"
    >
      {children}
    </h2>
  );
}

function H3({ children }: { children: ReactNode }) {
  return <h3 className="text-elsai-pin-dark mt-8 mb-3 font-serif text-xl">{children}</h3>;
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-organic border-elsai-pin/15 bg-elsai-creme border p-5">
      <p className="text-elsai-pin-dark font-serif text-3xl">{value}</p>
      <p className="text-elsai-ink/70 mt-1 text-sm leading-relaxed">{label}</p>
    </div>
  );
}

function Callout({ children }: { children: ReactNode }) {
  return (
    <aside className="bg-elsai-pin/5 rounded-organic border-elsai-pin/20 my-6 border-l-4 p-5 text-sm leading-relaxed">
      {children}
    </aside>
  );
}

function ArticleDrees() {
  return (
    <>
      <P>
        <strong>10 milliards d'euros.</strong> C'est le montant estimé, chaque année en France,
        des aides sociales qui ne sont pas réclamées par les personnes qui y ont pourtant droit.
        Ce chiffre n'est pas une estimation militante&nbsp;: il provient de la DREES, l'organisme
        statistique officiel rattaché aux ministères des Affaires sociales. Et il raconte un
        phénomène massif, silencieux, qui touche toutes les catégories de population — y compris
        vos salariés.
      </P>

      <P>
        Cet article fait le tour du sujet&nbsp;: <strong>de quoi parle-t-on exactement</strong>,{" "}
        <strong>pourquoi ce non-recours existe</strong>, <strong>qui il concerne</strong>, et{" "}
        <strong>quels leviers d'action</strong> existent — tant côté politique publique que
        côté employeur.
      </P>

      <H2 id="chiffres">Le non-recours en chiffres</H2>

      <P>
        Le non-recours, c'est le fait de ne pas demander une prestation sociale à laquelle on est
        éligible. Il se mesure par des enquêtes statistiques qui croisent les droits théoriques
        des ménages (calculés à partir des revenus, de la composition familiale, du logement)
        avec les prestations effectivement perçues.
      </P>

      <P>Quelques prestations emblématiques, d'après la DREES&nbsp;:</P>

      <div className="my-6 grid gap-3 sm:grid-cols-2">
        <Stat value="34 %" label="de non-recours au RSA (Revenu de Solidarité Active)" />
        <Stat value="39 %" label="de non-recours à la Prime d'activité" />
        <Stat value="44 %" label="de non-recours à la Complémentaire Santé Solidaire" />
        <Stat value="50 %" label="de non-recours au minimum vieillesse (ASPA)" />
      </div>

      <P>
        Un ayant droit sur deux, pour certaines prestations, ne fait pas la demande. Agrégé sur
        l'ensemble des aides (logement, santé, famille, emploi, vieillesse), le montant total
        représente près de 10 milliards d'euros par an — c'est-à-dire des dizaines de milliers
        d'euros perdus pour certains ménages au cours d'une vie.
      </P>

      <H2 id="pourquoi">Pourquoi ce non-recours existe</H2>

      <P>
        Les enquêtes qualitatives identifient quatre causes principales. Elles se cumulent
        souvent chez les mêmes personnes.
      </P>

      <H3>1. Le manque d'information (37 % des cas)</H3>
      <P>
        La première cause, de loin. Beaucoup de personnes ignorent simplement qu'elles ont droit
        à une aide. Les dispositifs sont nombreux, fragmentés, et chacun relève d'une
        administration différente&nbsp;: CAF, CPAM, Pôle emploi (aujourd'hui France Travail),
        CNAV, Département, Ville…
      </P>

      <H3>2. La complexité des démarches (22 % des cas)</H3>
      <P>
        Formulaires longs, pièces justificatives multiples, allers-retours entre guichets, délais
        de réponse, contentieux. Chaque étape est un filtre qui décourage. Les personnes les
        plus vulnérables (isolement, handicap, précarité numérique, barrière linguistique) sont
        les premières à abandonner.
      </P>

      <H3>3. La non-proposition par les services</H3>
      <P>
        Certains droits ne sont pas systématiquement proposés lors de demandes connexes — par
        exemple, une personne qui renouvelle un droit peut ne pas se voir suggérer une nouvelle
        prestation à laquelle elle est devenue éligible.
      </P>

      <H3>4. La peur du stigmate</H3>
      <P>
        Demander une aide sociale reste, pour une partie de la population, un acte chargé
        symboliquement. Crainte du jugement, peur d'être étiqueté·e, refus de « vivre des aides
        ». Ce facteur est particulièrement documenté pour le RSA et la Complémentaire Santé
        Solidaire.
      </P>

      <Callout>
        <strong>Ce qu'on observe sur le terrain&nbsp;:</strong> la majorité des situations de
        non-recours ne sont pas un choix délibéré. Ce sont des personnes qui auraient demandé
        l'aide si on leur avait dit qu'elle existait — ou si quelqu'un les avait accompagnées
        dans la démarche.
      </Callout>

      <H2 id="qui">Qui est concerné ?</H2>

      <P>
        Le non-recours touche certes les publics précaires — mais pas seulement. Trois profils
        sont particulièrement exposés&nbsp;:
      </P>

      <H3>Les jeunes qui arrivent à la majorité</H3>
      <P>
        Premier logement, premier emploi, changement de statut fiscal&nbsp;: la transition vers
        l'autonomie ouvre des droits (APL, prime d'activité, CSS, aides jeunesse) qui ne sont
        pas toujours activés faute d'information.
      </P>

      <H3>Les actifs précaires</H3>
      <P>
        CDD, intérim, temps partiels subis, micro-entrepreneurs. Leurs revenus variables les
        rendent éligibles à la Prime d'activité — dispositif le plus « non-recours » de France
        avec 39 % de taux. Les fluctuations mensuelles compliquent la déclaration et découragent
        la demande.
      </P>

      <H3>Les personnes âgées à revenus modestes</H3>
      <P>
        La moitié des personnes éligibles au minimum vieillesse (ASPA) ne le demande pas. La
        crainte du recours sur succession (remboursement sur patrimoine après le décès) est un
        frein documenté, souvent surévalué par rapport à ses conditions réelles.
      </P>

      <H2 id="entreprise">Pourquoi ça concerne aussi les entreprises</H2>

      <P>
        La frontière entre « vie perso » et « vie pro » n'existe pas vraiment. Un salarié en
        difficulté administrative ou financière est un salarié moins disponible mentalement, plus
        absent, plus à risque de désengagement.
      </P>

      <P>
        Les travaux sur la QVT (Qualité de Vie au Travail) convergent sur un point&nbsp;: les
        soucis extra-professionnels non résolus — logement, dette, aides refusées, démarches
        bloquées — sont une cause majeure de baisse de productivité. Pour l'entreprise, c'est un
        coût diffus mais réel, difficile à quantifier, qui se lit dans les arrêts maladie, les
        retards, les conflits internes, le turn-over.
      </P>

      <P>
        Par ailleurs, les PME n'ont quasiment jamais de service social interne. Les grandes
        entreprises peuvent se payer une assistante sociale du travail, un EAP (Employee
        Assistance Program), une mutuelle avec services renforcés. Les structures de moins de 250
        salariés, elles, laissent souvent leurs équipes se débrouiller seules.
      </P>

      <H2 id="leviers">Les leviers d'action qui fonctionnent</H2>

      <H3>Côté politique publique&nbsp;: les « Territoires zéro non-recours »</H3>
      <P>
        Lancé en 2024, le dispositif expérimental déployé dans 39 territoires vise à aller
        chercher les ayants droit plutôt qu'à attendre qu'ils viennent. Croisement de fichiers,
        campagnes d'information ciblées, permanences avancées dans les quartiers. Les premiers
        résultats montrent que <strong>l'information proactive</strong> et{" "}
        <strong>l'accompagnement humain</strong> sont les deux leviers qui marchent vraiment.
      </P>

      <H3>Côté numérique&nbsp;: simplifier le premier contact</H3>
      <P>
        Les simulateurs officiels (mes-aides.fr, anciennement intégré à service-public.fr) ont
        ouvert la voie. Ils se heurtent cependant à leurs limites&nbsp;: ils répondent bien à
        « combien », mal à « comment faire concrètement ». Les personnes qui les utilisent
        apprennent qu'elles ont des droits, mais restent souvent seules pour les activer.
      </P>
      <P>
        C'est précisément là qu'un accueil social numérique, disponible 24/7, spécialisé et
        supervisé par des assistantes sociales diplômées, peut compléter le dispositif existant
        — sans jamais le remplacer.
      </P>

      <H3>Côté employeur&nbsp;: soutenir sans s'immiscer</H3>
      <P>
        La bonne posture n'est pas de mettre en place un « service social RH » qui verrait tout
        de la vie privée des salariés — c'est exactement l'inverse de ce que les salariés
        souhaitent. La bonne posture, c'est de <strong>financer un service extérieur,
        confidentiel et anonyme</strong>, auquel les salariés peuvent s'adresser sans que
        l'entreprise en sache rien.
      </P>

      <P>
        C'est le modèle qu'ELSAI propose aux entreprises&nbsp;: l'entreprise souscrit, l'ensemble
        des salariés a accès, l'employeur reçoit uniquement des statistiques agrégées
        anonymisées. Personne ne sait qui consulte. Tout le monde y gagne.
      </P>

      <Callout>
        En pratique, chez les premières entreprises pilotes, les thématiques les plus consultées
        sont&nbsp;: logement (30 %), droits familiaux et parentalité (22 %), santé et
        complémentaire (18 %), puis emploi, handicap et surendettement. Des sujets qui pèsent
        lourdement sur la sérénité au travail, sans qu'un DRH en ait jamais connaissance.
      </Callout>

      <H2 id="conclusion">Ce qu'il faut retenir</H2>

      <P>
        Le non-recours aux droits sociaux est un problème majeur, mesurable, documenté. Il coûte
        des milliards aux ménages concernés. Il n'est pas une fatalité&nbsp;: il répond à trois
        causes concrètes (manque d'information, complexité, stigmate) et à trois leviers
        concrets (proactivité, simplification, accompagnement humain).
      </P>

      <P>
        Pour une entreprise, soutenir ses salariés sur ce terrain n'est pas un geste de charité.
        C'est un investissement dans la sérénité des équipes, avec un impact direct sur
        l'absentéisme et l'engagement. À un coût modique — quelques euros par salarié et par
        mois — c'est probablement l'un des avantages sociaux avec le meilleur ratio
        impact/dépense disponible aujourd'hui.
      </P>

      <div className="bg-elsai-creme rounded-organic border-elsai-pin/20 mt-10 border p-6 md:p-8">
        <p className="text-elsai-pin text-xs font-semibold tracking-[0.2em] uppercase">
          Aller plus loin
        </p>
        <p className="text-elsai-pin-dark mt-3 font-serif text-2xl">
          Offrez ELSAI à vos équipes, à partir de 3 € par salarié et par mois.
        </p>
        <p className="text-elsai-ink/80 mt-3 leading-relaxed">
          Un accueil social confidentiel, disponible 24h/24, supervisé par des assistantes
          sociales diplômées. Vos salariés reprennent la main sur leurs droits, vous voyez
          l'impact sur votre QVT.
        </p>
        <Link
          href="/offre"
          className="rounded-organic bg-elsai-pin text-elsai-creme shadow-organic hover:bg-elsai-pin-dark mt-5 inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold"
        >
          Voir l'offre entreprises →
        </Link>
      </div>
    </>
  );
}

const POST_MAP: Record<string, () => ReactElement> = {
  "10-milliards-aides-sociales-non-reclamees": ArticleDrees,
};

export function PostContent({ slug }: { slug: string }) {
  const Component = POST_MAP[slug];
  if (!Component) return null;
  return <Component />;
}
