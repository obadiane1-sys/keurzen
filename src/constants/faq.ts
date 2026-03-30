export interface FaqItem {
  question: string;
  answer: string;
}

export const faqData: FaqItem[] = [
  {
    question: "Comment creer un foyer ?",
    answer:
      "Allez dans Profil > Mon foyer, puis appuyez sur \"Creer un foyer\". Donnez-lui un nom et c'est parti ! Vous deviendrez automatiquement le proprietaire du foyer.",
  },
  {
    question: "Comment inviter quelqu'un dans mon foyer ?",
    answer:
      "Allez dans Profil > Invitations. Entrez l'adresse email de la personne et envoyez l'invitation. Elle recevra un email avec un lien pour rejoindre votre foyer.",
  },
  {
    question: "Comment rejoindre un foyer existant ?",
    answer:
      "Deux options : soit en utilisant le code d'invitation (Profil > Mon foyer > Rejoindre), soit en cliquant sur le lien d'invitation recu par email.",
  },
  {
    question: "Comment fonctionne le calcul d'equite ?",
    answer:
      "Keurzen calcule chaque semaine la repartition des taches et du temps entre les membres du foyer. L'objectif est une repartition equitable (50/50 pour 2 personnes, 33/33/33 pour 3, etc.). Le tableau de bord affiche les ecarts.",
  },
  {
    question: "Qu'est-ce que le score TLX ?",
    answer:
      "Le NASA-TLX est un questionnaire scientifique qui mesure la charge mentale. Il evalue 6 dimensions : exigence mentale, physique, temporelle, performance, effort et frustration. Remplissez-le chaque semaine pour suivre votre charge.",
  },
  {
    question: "Comment fonctionnent les notifications ?",
    answer:
      "Keurzen peut vous envoyer des rappels de taches, des alertes de retard et un digest matinal. Configurez vos preferences dans Profil > Notifications.",
  },
  {
    question: "Mes donnees sont-elles en securite ?",
    answer:
      "Oui. Vos donnees sont hebergees par Supabase (infrastructure AWS, region Europe), chiffrees en transit et au repos. L'acces est protege par des regles de securite au niveau de chaque ligne de la base de donnees.",
  },
  {
    question: "Comment supprimer mon compte ?",
    answer:
      "Contactez-nous a contact@keurzen.app. Nous supprimerons votre compte et toutes vos donnees sous 30 jours conformement au RGPD.",
  },
  {
    question: "L'application est-elle gratuite ?",
    answer:
      "Oui, Keurzen est entierement gratuit pendant la phase de lancement. Nous vous informerons a l'avance de tout changement eventuel.",
  },
];
