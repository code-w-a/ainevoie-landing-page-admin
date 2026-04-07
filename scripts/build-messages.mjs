import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const ro = {
  Metadata: {
    homeTitle: "AInevoie — conectează rapid clienții cu firme de curățenie",
    homeDescription:
      "AInevoie este o platformă care conectează persoane și companii cu firme de curățenie: cauți, compari, programezi și plătești simplu, direct din aplicație.",
  },
  LanguageSwitcher: { ro: "RO", en: "EN", label: "Limbă" },
  Header: {
    navHome: "Acasă",
    navFeatures: "Beneficii",
    navAbout: "Despre",
    navWork: "Cum funcționează",
    navPricing: "Planuri",
    navScreens: "Capturi",
    navTestimonials: "Recenzii",
    navFaq: "Întrebări",
    navContact: "Contact",
    ctaProvider: "Devino prestator",
    openMenu: "deschide meniul",
    closeMenu: "închide meniul",
  },
  Footer: {
    tagline:
      "AInevoie conectează clienții cu furnizori de servicii locali. Simplu, rapid și transparent: cerere, programare, plată și feedback.",
    colProduct: "Produs",
    colClients: "Pentru clienți",
    colProviders: "Pentru furnizori",
    navProduct: "Produs",
    navBenefits: "Beneficii",
    navHow: "Cum funcționează",
    navPlans: "Planuri",
    navScreens: "Capturi",
    navClients: "Pentru clienți",
    navChooseProvider: "Cum alegi un furnizor",
    navSafety: "Siguranță & recenzii",
    navFaq: "Întrebări frecvente",
    navContact: "Contact",
    navBecome: "Devino prestator",
    navOnboarding: "Începe onboardingul",
    navRequests: "Primește cereri",
    navScheduling: "Gestionare programări",
    newsletter: "Newsletter",
    emailPlaceholder: "Email",
    subscribe: "Abonează-te",
    subscribing: "...",
    copyright: "© 2026 AInevoie. Toate drepturile rezervate",
    privacy: "Politica de confidențialitate",
    terms: "Termeni și condiții",
  },
  Hero: {
    badge: "AInevoie • Market Servicii",
    titleBefore: "De la",
    titleHighlight: "nevoie",
    titleAfter: "la rezolvare.",
    subtitle:
      "Găsești servicii sau primești comenzi, într-o singură aplicație.",
    ctaNewsletter: "Înscrie-te pe lista de lansare",
    ctaProvider: "Devino prestator",
    toastEmailRequired: "Scrie adresa de email ca să te înscrii.",
    toastAlreadyList:
      "Ești deja pe listă. Îți dăm un semn la lansare.",
    toastSubscribed:
      "Super! Ești pe listă. Îți scriem când lansăm în zona ta.",
    toastNewsletterDown: "Înscrierea la newsletter e indisponibilă momentan.",
    toastSubscribeFail: "Nu am reușit să te înscriem. Încearcă din nou.",
    toastNetwork: "Eroare de rețea. Încearcă din nou.",
    dialogTitle: "Înscrie-te pe lista de lansare",
    dialogBody:
      "Fii printre primii care află când lansăm aplicația. Fără spam, doar update-uri importante.",
    dialogEmailPh: "Email-ul tău",
    dialogSubmit: "Înscrie-te",
    dialogSubmitting: "Se trimite…",
    dialogClose: "Închide",
    mockupAlt: "Ecranul principal al aplicației AInevoie",
  },
  Features: {
    title: "Tot ce îți trebuie ca să rezolvi sau să oferi un serviciu",
    subtitle:
      "AInevoie face lucrurile simple: ceri, programezi, plătești și la final evaluezi.",
    i1t: "Căutare rapidă",
    i1d:
      "Găsești rapid furnizori după categorie, zonă și recenzii. Alegi informat, fără să pierzi timp.",
    i2t: "Programări fără stres",
    i2d:
      "Alegi ora potrivită, iar furnizorul confirmă sau propune rapid o alternativă.",
    i3t: "Plăți în aplicație",
    i3d:
      "Plătești simplu și sigur. Vezi statusul plății și istoricul comenzilor, pentru ambele părți.",
    i4t: "Mesaje & notificări",
    i4d:
      "Comunici direct în aplicație și primești notificări pentru cereri, confirmări și actualizări.",
    i5t: "Profil profesional",
    i5d:
      "Furnizorii își prezintă serviciile, tarifele și zona de lucru. Clienții văd recenzii reale.",
    i6t: "Evaluări & încredere",
    i6d:
      "După finalizare, lași o recenzie. Așa crește calitatea și scade timpul de căutare.",
  },
  About: {
    clientBadge: "Pentru clienți",
    clientTitle: "Alegi serviciul potrivit, fără să pierzi timp",
    clientLead:
      "Nu mai pierzi timp cu recomandări la întâmplare. Vezi servicii disponibile în zona ta, compari și programezi când îți convine.",
    clientS1t: "Totul clar din start",
    clientS1d:
      "Vezi detalii, tarife, recenzii și disponibilitate, ca să iei rapid decizia corectă.",
    clientS2t: "Control total asupra programării",
    clientS2d:
      "Alegi ziua și ora, primești confirmare, iar tot istoricul rămâne în contul tău.",
    mockupClientAlt: "Detalii prestator și rezervare pentru client",
    providerBadge: "Pentru furnizori",
    providerTitle: "Transformi cererile în comenzi, simplu și rapid",
    providerLead:
      "Îți creezi profilul, publici serviciile și primești solicitări cu detalii clare: locație, interval și cerințe. Confirmi ușor și îți organizezi mai bine programul.",
    ctaOnboarding: "Începe onboardingul",
    mockupProviderAlt: "Cereri noi pentru prestator",
  },
  WorkProcess: {
    title: "Cum funcționează Alnevoie, în 3 pași",
    subtitle: "Simplu pentru clienți. Eficient pentru furnizori.",
    s1t: "Spui de ce ai nevoie",
    s1d:
      "Alegi categoria, explici ce cauți și adaugi locația și intervalul dorit.",
    s2t: "Primești opțiuni și confirmare",
    s2d:
      "Vezi furnizorii disponibili, alegi varianta potrivită, iar programarea este confirmată.",
    s3t: "Finalizezi și evaluezi",
    s3d:
      "Plătești în aplicație, iar la final lași o recenzie. Experiențele reale contează.",
  },
  Screens: {
    title: "Arată bine. Se folosește ușor.",
    subtitle:
      "De la căutare și programare, până la plăți și recenzii — totul e gândit să fie intuitiv.",
    alt0: "Ecran splash AInevoie",
    alt1: "Primul ecran de onboarding",
    alt2: "Al doilea ecran de onboarding",
    alt3: "Al treilea ecran de onboarding",
    alt4: "Ecranul principal pentru utilizator",
    alt5: "Ecran cu profilul prestatorului",
    alt6: "Ecran de confirmare rezervare",
    alt7: "Ecran de chat între utilizator și prestator",
    alt8: "Ecran cu cereri pentru prestator",
    alt9: "Ecran calendar pentru prestator",
    alt10: "Ecran cu recenzii pentru prestator",
  },
  Cta: {
    title: "Instalează AInevoie și rezolvă mai repede",
    subtitle:
      "Cauți servicii sau oferi servicii? Aplicația te ajută să te conectezi, să programezi și să finalizezi fără complicații.",
    soon: "Disponibil în curând",
    googlePlay: "Google Play",
    appStore: "App Store",
  },
  Testimonials: {
    title: "Ce spun utilizatorii",
    subtitle: "Experiențe reale din comunitatea AInevoie.",
    t1: "Am găsit rapid un instalator disponibil în aceeași zi. Programarea a fost simplă și totul a fost clar din start.",
    t1name: "Andreea M.",
    t1role: "Client",
    t2: "Cereri mai bine organizate și mult mai puține apeluri. Confirm programările din aplicație și am o evidență curată.",
    t2name: "Marius I.",
    t2role: "Furnizor servicii",
    t3: "Mi-a plăcut că am văzut recenziile și tarifele înainte. Am ales repede și am economisit timp.",
    t3name: "Elena P.",
    t3role: "Client",
    t4: "Profilul meu arată profesionist, iar clienții vin cu cereri clare. Asta face diferența.",
    t4name: "Cristian D.",
    t4role: "Furnizor",
  },
  Contact: {
    title: "Ai întrebări? Îți răspundem rapid.",
    subtitle:
      "Spune-ne dacă ești client sau furnizor și ce ai nevoie. Revenim cu un răspuns cât mai repede.",
    namePh: "Numele tău",
    companyPh: "Companie (opțional)",
    emailPh: "email@exemplu.ro",
    phonePh: "Telefon (opțional)",
    messagePh: "Scrie pe scurt ce ai nevoie…",
    consent:
      "Prin trimiterea mesajului ești de acord să te contactăm pentru a răspunde solicitării. Nu trimitem spam.",
    submit: "Trimite mesajul",
  },
  Pricing: {
    title: "Planuri simple. Fără surprize.",
    subtitle:
      "Alege planul potrivit în funcție de cât folosești aplicația. Poți schimba oricând.",
    monthly: "Lunar",
    yearly: "Anual",
    popular: "Cel mai ales",
    perMonth: "/ lună",
    billedYearly: "(facturat anual)",
    choosePlan: "alege acest plan",
  },
  Faq: {
    title: "Întrebări frecvente",
    subtitle: "Răspunsuri rapide, ca să începi fără dubii.",
    q1t: "AInevoie este pentru clienți sau pentru firme?",
    q1d:
      "Pentru ambele. Clienții găsesc servicii și fac programări, iar furnizorii primesc cereri și își gestionează activitatea din aplicație.",
    q2t: "Cum aleg furnizorul potrivit?",
    q2d:
      "Poți vedea recenzii, servicii, tarife și disponibilitate. Alegi în funcție de ce contează pentru tine.",
    q3t: "Cum trimit o cerere ca și client?",
    q3d:
      "Alegi categoria, descrii ce ai nevoie și selectezi locația + intervalul dorit. Apoi alegi un furnizor disponibil.",
    q4t: "În ce orașe este disponibilă aplicația?",
    q4d:
      "Lansăm etapizat. Înscrie-te pe lista de lansare și îți spunem imediat când este disponibilă în zona ta.",
    q5t: "Pot reprograma sau anula o solicitare?",
    q5d:
      "Da. Poți reprograma/anula din aplicație, iar furnizorul primește notificare. Unele opțiuni pot fi disponibile etapizat (în curând).",
    q6t: "Cum funcționează plățile?",
    q6d:
      "Plata se face în aplicație (dacă este activată la momentul lansării). Vezi statusul și istoricul fiecărei comenzi.",
    q7t: "Dacă nu vreau plată în aplicație, există alternativă?",
    q7d:
      "La lansare vom comunica opțiunile disponibile. Scopul este să fie cât mai simplu și transparent pentru ambele părți.",
    q8t: "Furnizorii sunt verificați?",
    q8d:
      "Furnizorii își creează cont și completează datele necesare pentru profil. În funcție de categorie, pot exista pași suplimentari de validare.",
    q9t: "Cum devin furnizor pe AInevoie?",
    q9d:
      "Îți faci cont, completezi profilul (servicii, zonă, disponibilitate) și ești gata să primești cereri.",
    q10t: "Abonamentele sunt pentru clienți sau pentru furnizori?",
    q10d:
      "Abonamentele sunt în principal pentru furnizori, în funcție de volum și nevoi. Pentru clienți, folosirea aplicației este gratuită.",
    q11t: "Cum funcționează recenziile?",
    q11d:
      "După finalizarea serviciului, clientul poate lăsa o evaluare. Recenziile ajută la menținerea calității în platformă.",
    q12t: "Cum iau legătura cu suportul?",
    q12d:
      "Ne scrii din formularul de contact, iar noi revenim cât mai rapid cu un răspuns.",
  },
  Blog: {
    localeNote:
      "Articolele sunt disponibile în limba în care au fost publicate. Conținut în română din blogul nostru.",
  },
  ErrorPage: {
    title: "Ceva nu a mers bine",
    back: "Înapoi acasă",
  },
  Legal: {
    termsTitle: "Termeni și condiții",
    privacyTitle: "Politica de confidențialitate",
    cookiesTitle: "Politica cookies",
    gdprTitle: "GDPR",
  },
};

const en = {
  Metadata: {
    homeTitle: "AInevoie — connect customers with cleaning businesses fast",
    homeDescription:
      "AInevoie is a platform that connects people and companies with cleaning providers: search, compare, book and pay simply, right in the app.",
  },
  LanguageSwitcher: { ro: "RO", en: "EN", label: "Language" },
  Header: {
    navHome: "Home",
    navFeatures: "Benefits",
    navAbout: "About",
    navWork: "How it works",
    navPricing: "Plans",
    navScreens: "Screenshots",
    navTestimonials: "Reviews",
    navFaq: "FAQ",
    navContact: "Contact",
    ctaProvider: "Become a provider",
    openMenu: "open menu",
    closeMenu: "close menu",
  },
  Footer: {
    tagline:
      "AInevoie connects customers with local service providers. Simple, fast and transparent: request, booking, payment and feedback.",
    colProduct: "Product",
    colClients: "For customers",
    colProviders: "For providers",
    navProduct: "Product",
    navBenefits: "Benefits",
    navHow: "How it works",
    navPlans: "Plans",
    navScreens: "Screenshots",
    navClients: "For customers",
    navChooseProvider: "How to choose a provider",
    navSafety: "Safety & reviews",
    navFaq: "FAQ",
    navContact: "Contact",
    navBecome: "Become a provider",
    navOnboarding: "Start onboarding",
    navRequests: "Receive requests",
    navScheduling: "Manage bookings",
    newsletter: "Newsletter",
    emailPlaceholder: "Email",
    subscribe: "Subscribe",
    subscribing: "...",
    copyright: "© 2026 AInevoie. All rights reserved",
    privacy: "Privacy policy",
    terms: "Terms & conditions",
  },
  Hero: {
    badge: "AInevoie • Services marketplace",
    titleBefore: "From",
    titleHighlight: "need",
    titleAfter: "to done.",
    subtitle:
      "Find services or receive orders — in one app.",
    ctaNewsletter: "Join the launch list",
    ctaProvider: "Become a provider",
    toastEmailRequired: "Enter your email to subscribe.",
    toastAlreadyList: "You are already on the list. We will notify you at launch.",
    toastSubscribed: "Great! You are on the list. We will write when we launch in your area.",
    toastNewsletterDown: "Newsletter signup is temporarily unavailable.",
    toastSubscribeFail: "We could not subscribe you. Please try again.",
    toastNetwork: "Network error. Please try again.",
    dialogTitle: "Join the launch list",
    dialogBody:
      "Be among the first to know when the app launches. No spam — only important updates.",
    dialogEmailPh: "Your email",
    dialogSubmit: "Subscribe",
    dialogSubmitting: "Sending…",
    dialogClose: "Close",
    mockupAlt: "AInevoie app home screen",
  },
  Features: {
    title: "Everything you need to book or offer a service",
    subtitle:
      "AInevoie keeps it simple: request, schedule, pay and review.",
    i1t: "Fast search",
    i1d:
      "Find providers by category, area and reviews. Decide with confidence, without wasting time.",
    i2t: "Stress-free scheduling",
    i2d:
      "Pick a time that works; the provider confirms or suggests an alternative quickly.",
    i3t: "In-app payments",
    i3d:
      "Pay simply and securely. See payment status and order history for both sides.",
    i4t: "Messages & notifications",
    i4d:
      "Chat in the app and get notified about requests, confirmations and updates.",
    i5t: "Professional profile",
    i5d:
      "Providers showcase services, rates and area. Customers see real reviews.",
    i6t: "Ratings & trust",
    i6d:
      "After completion, leave a review. Quality grows and search gets easier.",
  },
  About: {
    clientBadge: "For customers",
    clientTitle: "Pick the right service without wasting time",
    clientLead:
      "No more random recommendations. See what is available near you, compare and book when it suits you.",
    clientS1t: "Clear from the start",
    clientS1d:
      "See details, rates, reviews and availability so you can decide quickly.",
    clientS2t: "Full control of your booking",
    clientS2d:
      "Choose day and time, get confirmation, and keep history in your account.",
    mockupClientAlt: "Provider details and booking for customer",
    providerBadge: "For providers",
    providerTitle: "Turn requests into jobs, simply and fast",
    providerLead:
      "Create your profile, publish services and receive requests with clear details: location, time window and requirements. Confirm easily and organise your schedule.",
    ctaOnboarding: "Start onboarding",
    mockupProviderAlt: "New requests for provider",
  },
  WorkProcess: {
    title: "How AInevoie works in 3 steps",
    subtitle: "Simple for customers. Efficient for providers.",
    s1t: "Say what you need",
    s1d:
      "Choose a category, describe what you need and add location and time window.",
    s2t: "Get options and confirmation",
    s2d:
      "See available providers, pick the best fit, and the booking is confirmed.",
    s3t: "Finish and review",
    s3d:
      "Pay in the app and leave a review. Real experiences matter.",
  },
  Screens: {
    title: "Looks good. Easy to use.",
    subtitle:
      "From search and booking to payments and reviews — designed to be intuitive.",
    alt0: "AInevoie splash screen",
    alt1: "First onboarding screen",
    alt2: "Second onboarding screen",
    alt3: "Third onboarding screen",
    alt4: "User home screen",
    alt5: "Provider profile screen",
    alt6: "Booking confirmation screen",
    alt7: "Chat between user and provider",
    alt8: "Provider requests screen",
    alt9: "Provider calendar screen",
    alt10: "Provider reviews screen",
  },
  Cta: {
    title: "Install AInevoie and get things done faster",
    subtitle:
      "Looking for services or offering them? The app helps you connect, schedule and finish without hassle.",
    soon: "Coming soon",
    googlePlay: "Google Play",
    appStore: "App Store",
  },
  Testimonials: {
    title: "What users say",
    subtitle: "Real experiences from the AInevoie community.",
    t1: "I quickly found an installer available the same day. Booking was simple and everything was clear from the start.",
    t1name: "Andreea M.",
    t1role: "Customer",
    t2: "Better organised requests and far fewer calls. I confirm bookings in the app and keep a clean record.",
    t2name: "Marius I.",
    t2role: "Service provider",
    t3: "I liked seeing reviews and rates upfront. I chose quickly and saved time.",
    t3name: "Elena P.",
    t3role: "Customer",
    t4: "My profile looks professional and clients come with clear requests. That makes the difference.",
    t4name: "Cristian D.",
    t4role: "Provider",
  },
  Contact: {
    title: "Questions? We reply quickly.",
    subtitle:
      "Tell us if you are a customer or provider and what you need. We will get back as soon as we can.",
    namePh: "Your name",
    companyPh: "Company (optional)",
    emailPh: "you@example.com",
    phonePh: "Phone (optional)",
    messagePh: "Briefly describe what you need…",
    consent:
      "By sending this message you agree we may contact you about your request. No spam.",
    submit: "Send message",
  },
  Pricing: {
    title: "Simple plans. No surprises.",
    subtitle:
      "Pick the plan that matches how you use the app. Change anytime.",
    monthly: "Monthly",
    yearly: "Yearly",
    popular: "Most popular",
    perMonth: "/ month",
    billedYearly: "(billed annually)",
    choosePlan: "choose this plan",
  },
  Faq: {
    title: "Frequently asked questions",
    subtitle: "Quick answers so you can start with confidence.",
    q1t: "Is AInevoie for customers or businesses?",
    q1d:
      "Both. Customers find services and book; providers receive requests and manage work in the app.",
    q2t: "How do I choose the right provider?",
    q2d:
      "You can see reviews, services, rates and availability. Choose what matters most to you.",
    q3t: "How do I send a request as a customer?",
    q3d:
      "Pick a category, describe your need and select location and time window. Then choose an available provider.",
    q4t: "In which cities is the app available?",
    q4d:
      "We roll out gradually. Join the launch list and we will tell you when we are in your area.",
    q5t: "Can I reschedule or cancel a request?",
    q5d:
      "Yes. Reschedule or cancel in the app and the provider is notified. Some options may roll out in phases (coming soon).",
    q6t: "How do payments work?",
    q6d:
      "Payment happens in the app (when enabled at launch). You see status and history for each order.",
    q7t: "If I do not want in-app payment, is there an alternative?",
    q7d:
      "We will communicate available options at launch. The goal is simplicity and transparency for both sides.",
    q8t: "Are providers verified?",
    q8d:
      "Providers create an account and complete profile details. Depending on category, extra validation steps may apply.",
    q9t: "How do I become a provider on AInevoie?",
    q9d:
      "Create an account, complete your profile (services, area, availability) and you are ready to receive requests.",
    q10t: "Are subscriptions for customers or providers?",
    q10d:
      "Subscriptions are mainly for providers, by volume and needs. Using the app as a customer is free.",
    q11t: "How do reviews work?",
    q11d:
      "After the service, the customer can leave a rating. Reviews help keep quality high on the platform.",
    q12t: "How do I contact support?",
    q12d:
      "Write us via the contact form and we will respond as soon as possible.",
  },
  Blog: {
    localeNote:
      "Blog posts are published in their original language. Our current posts are in Romanian.",
  },
  ErrorPage: {
    title: "Something went wrong",
    back: "Back home",
  },
  Legal: {
    termsTitle: "Terms & conditions",
    privacyTitle: "Privacy policy",
    cookiesTitle: "Cookie policy",
    gdprTitle: "GDPR",
  },
};

writeFileSync(join(root, "messages/ro.json"), JSON.stringify(ro, null, 2), "utf8");
writeFileSync(join(root, "messages/en.json"), JSON.stringify(en, null, 2), "utf8");
console.log("Wrote messages/ro.json and messages/en.json");
