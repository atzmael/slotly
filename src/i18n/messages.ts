export const locales = ["en", "fr"] as const;

export type Locale = (typeof locales)[number];

export const localeCookieName = "slotly_locale";

const en = {
  meta: {
    siteTitle: "Slotly - Find the right time, together",
    siteDescription:
      "Create a simple availability poll for friends, clubs, volunteer teams, and small teams. No account required.",
    ogImageAlt: "Slotly - Find the right time, together",
    createTitle: "Create a poll - Slotly",
    createDescription:
      "Create a Slotly availability poll in seconds and share one link with your group.",
    legalTitle: "Legal notice - Slotly",
    legalDescription:
      "Legal information for Slotly: publisher, hosting, intellectual property, and contact.",
    privacyTitle: "Privacy - Slotly",
    privacyDescription:
      "Slotly privacy policy: collected data, retention, analytics, processors, and user rights.",
    termsTitle: "Terms - Slotly",
    termsDescription:
      "Slotly terms: service access, authorized use, availability, poll deletion, and contact.",
    eventTitle: (eventTitle: string) => `${eventTitle} - Slotly`,
    eventDescription:
      "Add your availability to this Slotly poll. No account required.",
    resultsTitle: (eventTitle: string) =>
      `Best times for ${eventTitle} - Slotly`,
    fullDayResultsTitle: (eventTitle: string) =>
      `Best dates for ${eventTitle} - Slotly`,
    resultsDescription:
      "See the best availability options for this Slotly poll.",
    unavailableEventTitle: "Poll unavailable - Slotly",
  },
  common: {
    brand: "Slotly",
    languageLabel: "Language",
    languageEnglish: "EN",
    languageFrench: "FR",
    fallbackError: "Something went wrong.",
    legalNotice: "Legal notice",
    terms: "Terms",
    privacy: "Privacy",
    feedback: "Feedback or bug",
  },
  home: {
    createPoll: "Create Poll",
    eyebrow: "For friends, clubs, volunteer teams, and small crews",
    title: "Find the right time, together.",
    subtitle:
      "Plan dinners, weekends, association meetings, or lightweight team sessions with one simple availability link.",
    bestSlots: "Best slots",
    live: "Live",
    valueProps: [
      "No accounts",
      "Made for group chats",
      "Useful for small teams too",
    ],
    demoSlots: [
      ["Tue 20:00", "12 available", "w-full"],
      ["Wed 20:00", "11 available", "w-11/12"],
      ["Thu 21:00", "10 available", "w-10/12"],
    ],
  },
  create: {
    backlink: "Slotly",
    title: "Create a poll",
    subtitle: "Set the basics now. Sharing and live availability come next.",
    fields: {
      title: "Event name",
      titlePlaceholder: "Communication team meeting, Family restaurant, ...",
      startDate: "Start date",
      startDateHelp: "First day participants can pick availability.",
      endDate: "End date",
      endDateHelp: "Last day included in the poll.",
      startTime: "Start time",
      startTimeHelp: "Earliest time shown each day.",
      endTime: "End time",
      endTimeHelp: "Latest time shown each day.",
      fullDay: "Full day",
      fullDayHelp: "Participants pick dates only, without hourly slots.",
      duration: "Event duration",
      durationHelp: "Length of the meeting you want to schedule.",
      slotSize: "Slot size",
      slotSizeHelp: "Precision of the availability grid.",
    },
    durations: {
      minutes30: "30 min",
      hour1: "1 hour",
      hours2: "2 hours",
      hours3: "3 hours",
      hours4: "4 hours",
    },
    creating: "Creating...",
    submit: "Create Event",
    errors: {
      title_required: "Add an event name.",
      title_too_long: "Keep the event name under 80 characters.",
      start_date_invalid: "Choose a valid start date.",
      end_date_invalid: "Choose a valid end date.",
      date_range_invalid: "End date must be after the start date.",
      date_range_too_long: "Keep the date range to 31 days or less.",
      start_time_invalid: "Choose a valid start time.",
      end_time_invalid: "Choose a valid end time.",
      time_range_invalid: "End time must be after the start time.",
      duration_exceeds_time_range:
        "Event duration must fit inside the time range.",
      duration_invalid: "Choose a supported event duration.",
      slot_size_invalid: "Choose a supported slot size.",
      database_migration_required:
        "The database is not up to date. Apply the latest Supabase migration, then try again.",
      rate_limited: "Too many attempts. Wait a few minutes, then try again.",
      create_event_failed: "The poll could not be created. Try again.",
    },
  },
  event: {
    participantCount: (count: number) =>
      `${count} participant${count === 1 ? "" : "s"} joined`,
    viewResults: "View results",
    addAvailability: "Add availability",
    join: {
      errors: {
        event_id_invalid: "This event link is invalid.",
        name_required: "Add your name.",
        name_too_long: "Keep your name under 60 characters.",
        participant_name_taken:
          "This name is already used in this poll. Add an initial or another detail.",
        timezone_invalid: "Your timezone could not be detected.",
        event_finalized:
          "This poll is closed. The final date has already been chosen.",
        rate_limited: "Too many attempts. Wait a few minutes, then try again.",
        join_event_failed: "Could not join this poll. Try again.",
      },
      joined: "You joined this poll. Pick your availability next.",
      welcomeBack: (name: string) =>
        `Welcome back, ${name}. Update your availability below.`,
      nameLabel: "Your name",
      namePlaceholder: "John Doe",
      timezoneNotice: (timezone: string) =>
        `Times are shown in ${timezone}. Availability selection comes next.`,
      joining: "Joining...",
      submit: "Join poll",
    },
    share: {
      button: "Share link",
      copied: "Link copied",
      failed: "Copy failed",
    },
    availability: {
      title: "Pick availability",
      help: "Tap or drag across every slot that works for you.",
      fullDayHelp: "Tap every date that works for you.",
      selected: (count: number, dirty: boolean) =>
        `${count} selected${dirty ? " - unsaved" : ""}`,
      errors: {
        participant_id_invalid:
          "Join the poll again before saving availability.",
        availability_required: "Select at least one slot.",
        availability_too_large: "Too many slots selected.",
        availability_window_invalid: "One selected slot is invalid.",
        event_finalized:
          "This poll is closed. Availability can no longer be changed.",
        rate_limited: "Too many attempts. Wait a few minutes, then try again.",
        save_availability_failed: "Could not save availability. Try again.",
      },
      saved: "Availability saved.",
      quickActions: "Quick actions",
      quickActionsHelp: "Fill the same time range across several days at once.",
      from: "From",
      to: "To",
      applyAll: "Apply to all days",
      applyWeekdays: "Apply to weekdays",
      clearAll: "Deselect all",
      cancelChanges: "Cancel changes",
      cancelChangesShort: "Cancel",
      timeHeader: "Time",
      saving: "Saving...",
      savingShort: "Saving...",
      save: "Save availability",
      saveShort: "Save",
    },
  },
  results: {
    title: (eventTitle: string) => `Best times for ${eventTitle}`,
    fullDayTitle: (eventTitle: string) => `Best dates for ${eventTitle}`,
    emptyNoParticipantsTitle: "No one has joined yet",
    emptyNoParticipantsDescription:
      "Share the event link so people can add their name and slots.",
    emptyNoAvailabilityTitle: "No availability yet",
    emptyNoAvailabilityDescription:
      "Ask participants to add availability, then the best times will appear here.",
    nothingToRankTitle: "Nothing to rank yet",
    nothingToRankDescription:
      "Results are calculated as soon as at least one participant saves availability.",
    availableCount: (count: number) => `${count} available`,
    selectedRecommendation: "Selected recommendation",
    creatorActionsTitle: "Creator action",
    finalizeSelected: "Select this final date",
    finalizeConfirm:
      "Close this poll and choose this date as the final option?",
    finalizing: "Selecting...",
    cancelFinalDate: "Cancel final date",
    cancelFinalDateConfirm: "Reopen voting for this poll?",
    cancelingFinalDate: "Canceling...",
    finalizedTitle: "Final date selected",
    finalizedDescription:
      "Voting is closed. Add the final date to your calendar.",
    addToGoogleCalendar: "Add to Google Calendar",
    addToIcloudCalendar: "Add to iCloud Calendar",
    finalizationSaved: "Final date selected.",
    finalizationCanceled: "Final date canceled. Voting is open again.",
    creatorOnlyNotice:
      "Only the poll creator can select or cancel the final date.",
    finalizationErrors: {
      event_id_invalid: "This poll link is invalid.",
      creator_token_invalid: "Only the poll creator can do this.",
      event_finalized:
        "This poll already has a final date. Cancel it before choosing another one.",
      final_window_invalid: "Choose a valid ranked option.",
      rate_limited: "Too many attempts. Wait a few minutes, then try again.",
      finalize_event_failed: "The final date could not be selected. Try again.",
      cancel_finalization_failed:
        "The final date could not be canceled. Try again.",
    },
    attendance: (available: number, total: number) =>
      `${available} of ${total} participant${total === 1 ? "" : "s"} can attend.`,
    displayedIn: (timezone: string) => `Displayed in ${timezone}`,
    available: "Available",
    missing: "Missing",
    noOne: "No one",
  },
};

type Messages = typeof en;

const fr: Messages = {
  meta: {
    siteTitle: "Slotly - Trouvez le bon moment, ensemble",
    siteDescription:
      "Créez un sondage de disponibilités simple pour vos amis, assos, clubs, équipes bénévoles et petites équipes. Aucun compte requis.",
    ogImageAlt: "Slotly - Trouvez le bon moment, ensemble",
    createTitle: "Créer un sondage - Slotly",
    createDescription:
      "Créez un sondage de disponibilités Slotly en quelques secondes et partagez un lien avec votre groupe.",
    legalTitle: "Mentions légales - Slotly",
    legalDescription:
      "Informations légales de Slotly : éditeur, hébergement, propriété intellectuelle et contact.",
    privacyTitle: "Confidentialité - Slotly",
    privacyDescription:
      "Politique de confidentialité de Slotly : données collectées, conservation, analytics, sous-traitants et droits des utilisateurs.",
    termsTitle: "Conditions d’utilisation - Slotly",
    termsDescription:
      "Conditions d’utilisation de Slotly : accès au service, usages autorisés, disponibilité, suppression des sondages et contact.",
    eventTitle: (eventTitle: string) => `${eventTitle} - Slotly`,
    eventDescription:
      "Ajoutez vos disponibilités à ce sondage Slotly. Aucun compte requis.",
    resultsTitle: (eventTitle: string) =>
      `Meilleurs créneaux pour ${eventTitle} - Slotly`,
    fullDayResultsTitle: (eventTitle: string) =>
      `Meilleures dates pour ${eventTitle} - Slotly`,
    resultsDescription:
      "Consultez les meilleures options de disponibilité pour ce sondage Slotly.",
    unavailableEventTitle: "Sondage indisponible - Slotly",
  },
  common: {
    brand: "Slotly",
    languageLabel: "Langue",
    languageEnglish: "EN",
    languageFrench: "FR",
    fallbackError: "Une erreur est survenue.",
    legalNotice: "Mentions légales",
    terms: "Conditions d’utilisation",
    privacy: "Confidentialité",
    feedback: "Feedback ou bug",
  },
  home: {
    createPoll: "Créer un sondage",
    eyebrow: "Pour amis, assos, clubs et petites équipes",
    title: "Trouvez le bon moment, ensemble.",
    subtitle:
      "Organisez un dîner, un week-end, une réunion d’asso ou un point d’équipe avec un simple lien de disponibilités.",
    bestSlots: "Meilleurs créneaux",
    live: "Live",
    valueProps: [
      "Aucun compte",
      "Pensé pour les groupes",
      "Utile aussi en petite équipe",
    ],
    demoSlots: [
      ["Mar 20:00", "12 disponibles", "w-full"],
      ["Mer 20:00", "11 disponibles", "w-11/12"],
      ["Jeu 21:00", "10 disponibles", "w-10/12"],
    ],
  },
  create: {
    backlink: "Slotly",
    title: "Créer un sondage",
    subtitle:
      "Définissez les bases maintenant. Le partage et les disponibilités viennent ensuite.",
    fields: {
      title: "Nom de l’événement",
      titlePlaceholder:
        "Réunion pôle communication, Restaurant avec la famille, ...",
      startDate: "Date de début",
      startDateHelp: "Premier jour où les participants peuvent répondre.",
      endDate: "Date de fin",
      endDateHelp: "Dernier jour inclus dans le sondage.",
      startTime: "Heure de début",
      startTimeHelp: "Première heure affichée chaque jour.",
      endTime: "Heure de fin",
      endTimeHelp: "Dernière heure affichée chaque jour.",
      fullDay: "Journée complète",
      fullDayHelp:
        "Les participants choisissent uniquement des dates, sans créneaux horaires.",
      duration: "Durée de l’événement",
      durationHelp: "Durée du rendez-vous à planifier.",
      slotSize: "Taille des créneaux",
      slotSizeHelp: "Précision de la grille de disponibilités.",
    },
    durations: {
      minutes30: "30 min",
      hour1: "1 heure",
      hours2: "2 heures",
      hours3: "3 heures",
      hours4: "4 heures",
    },
    creating: "Création...",
    submit: "Créer l’événement",
    errors: {
      title_required: "Ajoutez un nom d’événement.",
      title_too_long: "Gardez un nom de moins de 80 caractères.",
      start_date_invalid: "Choisissez une date de début valide.",
      end_date_invalid: "Choisissez une date de fin valide.",
      date_range_invalid: "La date de fin doit être après la date de début.",
      date_range_too_long: "Limitez la période à 31 jours maximum.",
      start_time_invalid: "Choisissez une heure de début valide.",
      end_time_invalid: "Choisissez une heure de fin valide.",
      time_range_invalid: "L’heure de fin doit être après l’heure de début.",
      duration_exceeds_time_range: "La durée doit tenir dans la plage horaire.",
      duration_invalid: "Choisissez une durée prise en charge.",
      slot_size_invalid: "Choisissez une taille de créneau prise en charge.",
      database_migration_required:
        "La base de données n’est pas à jour. Appliquez la dernière migration Supabase, puis réessayez.",
      rate_limited:
        "Trop de tentatives. Attendez quelques minutes, puis réessayez.",
      create_event_failed: "Le sondage n’a pas pu être créé. Réessayez.",
    },
  },
  event: {
    participantCount: (count: number) =>
      `${count} participant${count === 1 ? "" : "s"} inscrit${count === 1 ? "" : "s"}`,
    viewResults: "Voir les résultats",
    addAvailability: "Ajouter mes dispos",
    join: {
      errors: {
        event_id_invalid: "Ce lien d’événement est invalide.",
        name_required: "Ajoutez votre nom.",
        name_too_long: "Gardez un nom de moins de 60 caractères.",
        participant_name_taken:
          "Ce nom est déjà utilisé dans ce sondage. Ajoutez une initiale ou un détail.",
        timezone_invalid: "Votre fuseau horaire n’a pas pu être détecté.",
        event_finalized:
          "Ce sondage est fermé. La date définitive a déjà été choisie.",
        rate_limited:
          "Trop de tentatives. Attendez quelques minutes, puis réessayez.",
        join_event_failed: "Impossible de rejoindre ce sondage. Réessayez.",
      },
      joined: "Vous avez rejoint ce sondage. Ajoutez vos disponibilités.",
      welcomeBack: (name: string) =>
        `Bon retour, ${name}. Modifiez vos disponibilités ci-dessous.`,
      nameLabel: "Votre nom",
      namePlaceholder: "John Doe",
      timezoneNotice: (timezone: string) =>
        `Les horaires sont affichés en ${timezone}. La sélection vient ensuite.`,
      joining: "Inscription...",
      submit: "Rejoindre",
    },
    share: {
      button: "Partager le lien",
      copied: "Lien copié",
      failed: "Copie impossible",
    },
    availability: {
      title: "Choisir mes disponibilités",
      help: "Touchez ou glissez sur tous les créneaux qui vous conviennent.",
      fullDayHelp: "Touchez toutes les dates qui vous conviennent.",
      selected: (count: number, dirty: boolean) =>
        `${count} sélectionné${count > 1 ? "s" : ""}${dirty ? " - non enregistré" : ""}`,
      errors: {
        participant_id_invalid:
          "Rejoignez à nouveau le sondage avant d’enregistrer vos disponibilités.",
        availability_required: "Sélectionnez au moins un créneau.",
        availability_too_large: "Trop de créneaux sélectionnés.",
        availability_window_invalid: "Un créneau sélectionné est invalide.",
        event_finalized:
          "Ce sondage est fermé. Les disponibilités ne peuvent plus être modifiées.",
        rate_limited:
          "Trop de tentatives. Attendez quelques minutes, puis réessayez.",
        save_availability_failed:
          "Impossible d’enregistrer les disponibilités. Réessayez.",
      },
      saved: "Disponibilités enregistrées.",
      quickActions: "Actions rapides",
      quickActionsHelp:
        "Remplissez une même plage horaire sur plusieurs jours d’un coup.",
      from: "De",
      to: "À",
      applyAll: "Tous les jours",
      applyWeekdays: "Jours ouvrés",
      clearAll: "Tout désélectionner",
      cancelChanges: "Annuler les modifications",
      cancelChangesShort: "Annuler",
      timeHeader: "Heure",
      saving: "Enregistrement...",
      savingShort: "Enregistrement...",
      save: "Enregistrer mes disponibilités",
      saveShort: "Enregistrer",
    },
  },
  results: {
    title: (eventTitle: string) => `Meilleurs créneaux pour ${eventTitle}`,
    fullDayTitle: (eventTitle: string) => `Meilleures dates pour ${eventTitle}`,
    emptyNoParticipantsTitle: "Personne n’a encore rejoint",
    emptyNoParticipantsDescription:
      "Partagez le lien pour que les participants ajoutent leur nom et leurs créneaux.",
    emptyNoAvailabilityTitle: "Aucune disponibilité pour l’instant",
    emptyNoAvailabilityDescription:
      "Demandez aux participants d’ajouter leurs disponibilités, puis les meilleurs créneaux apparaîtront ici.",
    nothingToRankTitle: "Rien à classer pour l’instant",
    nothingToRankDescription:
      "Les résultats sont calculés dès qu’au moins un participant enregistre ses disponibilités.",
    availableCount: (count: number) =>
      `${count} disponible${count > 1 ? "s" : ""}`,
    selectedRecommendation: "Recommandation sélectionnée",
    creatorActionsTitle: "Action créateur",
    finalizeSelected: "Sélectionner cette date définitive",
    finalizeConfirm:
      "Fermer ce sondage et choisir cette date comme option définitive ?",
    finalizing: "Sélection...",
    cancelFinalDate: "Annuler la date définitive",
    cancelFinalDateConfirm: "Rouvrir les votes pour ce sondage ?",
    cancelingFinalDate: "Annulation...",
    finalizedTitle: "Date définitive sélectionnée",
    finalizedDescription:
      "Le vote est fermé. Ajoutez la date définitive à votre agenda.",
    addToGoogleCalendar: "Ajouter à Google Calendar",
    addToIcloudCalendar: "Ajouter à iCloud Agenda",
    finalizationSaved: "Date définitive sélectionnée.",
    finalizationCanceled: "Date définitive annulée. Le vote est rouvert.",
    creatorOnlyNotice:
      "Seul le créateur du sondage peut sélectionner ou annuler la date définitive.",
    finalizationErrors: {
      event_id_invalid: "Ce lien de sondage est invalide.",
      creator_token_invalid: "Seul le créateur du sondage peut faire cela.",
      event_finalized:
        "Ce sondage a déjà une date définitive. Annulez-la avant d’en choisir une autre.",
      final_window_invalid: "Choisissez une option classée valide.",
      rate_limited:
        "Trop de tentatives. Attendez quelques minutes, puis réessayez.",
      finalize_event_failed:
        "La date définitive n’a pas pu être sélectionnée. Réessayez.",
      cancel_finalization_failed:
        "La date définitive n’a pas pu être annulée. Réessayez.",
    },
    attendance: (available: number, total: number) =>
      `${available} sur ${total} participant${total === 1 ? "" : "s"} peut${available > 1 ? "vent" : ""} venir.`,
    displayedIn: (timezone: string) => `Affiché en ${timezone}`,
    available: "Disponibles",
    missing: "Manquants",
    noOne: "Personne",
  },
};

export const messages: Record<Locale, Messages> = {
  en,
  fr,
};
