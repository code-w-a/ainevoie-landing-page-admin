# AI Nevoie Admin Panel - analiza si roadmap de completare

## Context

Admin panel-ul din `next-js` functioneaza deja ca suprafata de administrare pentru newsletter si ca inceput de back-office pentru marketplace-ul din `expo-mobile-app`.

In prezent exista zone vizibile pentru:

- newsletter overview;
- campanii;
- abonati;
- loguri newsletter;
- setari newsletter;
- prestatori;
- programari.

Backend-ul din `expo-mobile-app/functions` expune deja servicii admin pentru:

- sumar operational;
- listare si detalii prestatori;
- listare si detalii programari;
- listare review-uri;
- listare audit events;
- decizii admin pentru prestatori: aprobare, respingere, suspendare, reactivare.

Concluzia principala: adminul nu este gol, dar este inca incomplet ca panou operational complet pentru o aplicatie marketplace. Lipsesc mai ales zonele pentru clienti, moderare, suport, plati, audit operational dedicat si configurare de business.

## Ce exista deja

### Newsletter

Zona de newsletter este cea mai completa:

- sumar abonati;
- campanii create, programate si trimise;
- abonati cu statusuri;
- loguri de livrare;
- setari;
- actiuni de creare, programare, trimitere, duplicare si stergere campanii.

### Prestatori

Zona de prestatori acopera deja o parte importanta din fluxul de onboarding:

- lista prestatori;
- filtre dupa status, judet, oras si serviciu;
- detalii prestator;
- documente;
- disponibilitate;
- servicii active;
- timeline operational;
- actiuni admin pentru aprobare, respingere, suspendare si reactivare.

### Programari

Zona de programari permite monitorizare, dar in mare parte read-only:

- lista booking-uri;
- filtre dupa status booking si status plata;
- detalii booking;
- detalii plata;
- client si prestator;
- audit recent asociat.

### Autorizare admin

Exista separare intre `admin` si `support`, cu acces de citire pentru suport si actiuni critice rezervate adminului.

## Lipsuri majore pentru un admin complet

## 1. Dashboard operational real

Pagina principala `/admin` este orientata in prezent spre newsletter. Pentru un admin complet, primul ecran ar trebui sa fie un sumar operational al aplicatiei mobile.

Ar trebui sa includa:

- prestatori in asteptare la review;
- booking-uri neconfirmate;
- booking-uri cu plata esuata;
- reprogramari propuse;
- review-uri recente;
- clienti noi;
- venit brut estimat;
- alerte operationale;
- ultimele evenimente de audit.

Backend-ul are deja baza pentru asta prin sumarul care numara `providers`, `bookings`, `payments`, `reviews` si `auditEvents`.

Prioritate: foarte mare.

## 2. Administrare clienti

Lipseste o zona dedicata clientilor din aplicatia mobila.

Ar trebui implementata ruta:

```text
/admin/clienti
```

Functionalitati recomandate:

- lista clienti;
- cautare dupa nume, email, telefon, UID;
- status cont;
- data creare cont;
- ultima activitate;
- numar booking-uri;
- valoare totala booking-uri;
- review-uri lasate;
- conversatii;
- preferinte notificari;
- detalii profil;
- suspendare sau dezactivare cont;
- note interne.

Aceasta zona este obligatorie pentru suport, frauda, GDPR si operatiuni zilnice.

Prioritate: foarte mare.

## 3. Moderare review-uri

Backend-ul expune deja `listAdminReviews`, dar UI-ul nu are o pagina dedicata.

Ar trebui implementata ruta:

```text
/admin/recenzii
```

Functionalitati recomandate:

- lista review-uri;
- filtre dupa prestator, client, rating, status si data;
- cautare in textul review-ului;
- link catre booking;
- link catre prestator;
- link catre client;
- ascundere review;
- republicare review;
- marcare ca abuziv;
- note interne de moderare.

Nu as sterge review-uri fizic decat in cazuri foarte clare. Mai sigur este status-based moderation: `published`, `hidden`, `flagged`, `removed`.

Prioritate: foarte mare.

## 4. Audit operational dedicat

Exista `auditEvents`, dar logurile vizibile in admin sunt orientate spre newsletter. Adminul are nevoie de o pagina dedicata pentru auditul aplicatiei mobile.

Ar trebui implementata ruta:

```text
/admin/audit
```

Functionalitati recomandate:

- lista evenimente audit;
- filtre dupa actor;
- filtre dupa rol actor;
- filtre dupa resource type;
- filtre dupa resource id;
- filtre dupa actiune;
- filtre dupa rezultat;
- cautare libera;
- export CSV;
- link direct catre booking/prestator/client cand resursa este cunoscuta.

Aceasta pagina este importanta pentru debugging, suport, securitate si trasabilitate.

Prioritate: foarte mare.

## 5. Interventii admin pe programari

Detaliul de programare este momentan mai degraba read-only. Pentru suport real, adminul trebuie sa poata interveni controlat.

Functionalitati recomandate:

- anulare booking cu motiv;
- reprogramare asistata;
- confirmare manuala in cazuri exceptionale;
- marcare ca disputa;
- marcare ca rezolvata;
- trimitere mesaj catre client/prestator;
- link catre conversatie;
- atasare nota interna;
- istoric complet al tranzitiilor de status.

Toate aceste actiuni trebuie sa scrie in `auditEvents`.

Prioritate: mare.

## 6. Plati si reconciliere financiara

Exista colectia `payments` si integrare Stripe, dar lipseste o zona admin pentru finante.

Ar trebui implementata ruta:

```text
/admin/plati
```

Functionalitati recomandate:

- lista plati;
- filtre dupa status, procesator, metoda, data;
- total pe perioada;
- plati esuate;
- plati in progres;
- booking asociat;
- client;
- prestator;
- Stripe PaymentIntent;
- Stripe Charge;
- refund status;
- link catre Stripe Dashboard;
- reconciliere manuala in caz de webhook intarziat sau esuat.

Daca produsul va avea comision sau payout catre prestatori, aceasta zona trebuie extinsa cu:

- comision platforma;
- venit net prestator;
- payout status;
- raport lunar;
- export contabil.

MVP implementat pentru payout manual:

- platforma incaseaza integral plata Stripe;
- `platformFeePercent` se configureaza in Admin -> Settings;
- `payments` pastreaza `grossAmount`, `platformFeeAmount`, `providerNetAmount` si `providerPayoutStatus`;
- providerul cere payout din aplicatia mobila, din Profil -> Plati si sold;
- adminul vede cererile in `/admin/plati` si le marcheaza `paid` dupa transfer bancar manual;
- Stripe Connect ramane etapa ulterioara pentru automatizarea transferurilor.

Prioritate: mare.

## 7. Inbox de suport

In aplicatia mobila, suportul pare inca local/demo. Pentru productie, trebuie introdus un model real de tichete.

Model recomandat:

```text
supportTickets/{ticketId}
```

Campuri recomandate:

- `ticketId`;
- `createdByUid`;
- `createdByRole`;
- `topic`;
- `subject`;
- `message`;
- `status`: `open`, `in_progress`, `waiting_user`, `resolved`, `closed`;
- `priority`: `low`, `normal`, `high`, `urgent`;
- `assignedAdminUid`;
- `relatedBookingId`;
- `relatedProviderId`;
- `relatedUserId`;
- `createdAt`;
- `updatedAt`;
- `resolvedAt`;
- `internalNotes`.

Ruta admin recomandata:

```text
/admin/suport
```

Prioritate: mare.

## 8. Moderare conversatii

Messaging este activ in aplicatia mobila, dar adminul nu are vizibilitate dedicata asupra conversatiilor.

Ar trebui implementata ruta:

```text
/admin/conversatii
```

Functionalitati recomandate:

- lista conversatii;
- cautare dupa booking, client, prestator;
- status conversatie;
- unread count;
- ultimul mesaj;
- detalii read-only ale mesajelor;
- report conversation;
- block participant;
- export conversatie pentru disputa.

Adminul nu ar trebui sa editeze mesaje. Pentru moderare, se pot introduce statusuri sau flag-uri, cu audit strict.

Prioritate: medie spre mare.

## 9. Configurare marketplace

O aplicatie marketplace nu trebuie administrata doar din cod. Unele valori ar trebui mutate in configurari administrabile.

Ar trebui implementata ruta:

```text
/admin/marketplace
```

Functionalitati recomandate:

- categorii de servicii;
- servicii disponibile;
- orase si judete active;
- zone acoperite;
- pret minim;
- durata minima/maxima booking;
- comision platforma;
- documente obligatorii pentru prestatori;
- versiuni termeni si politici;
- reguli de publicare provider;
- feature flags.

Prioritate: medie.

## 10. Scoring si calitate prestatori

Pagina de prestator poate deveni mult mai utila daca include indicatori de calitate.

Metrici recomandate:

- rating mediu;
- numar review-uri;
- rata de acceptare booking;
- rata de anulare;
- timp mediu de raspuns;
- booking-uri finalizate;
- booking-uri respinse;
- plangeri;
- documente expirate;
- disponibilitate neactualizata;
- profil incomplet.

Aceste date ar ajuta adminul sa ia decizii mai bune decat simpla verificare manuala a profilului.

Prioritate: medie.

## 11. RBAC si administrare echipa admin

Exista deja roluri de baza, dar lipseste o interfata de gestionare a adminilor.

Ar trebui implementata ruta:

```text
/admin/echipa
```

Roluri recomandate:

- `admin`: acces complet;
- `support`: citire si operatiuni suport non-critice;
- `moderator`: review-uri, conversatii, continut;
- `finance`: plati, refund-uri, rapoarte;
- `readonly`: audit si vizualizare.

Actiunile critice trebuie protejate separat, nu doar prin ascunderea butoanelor in UI.

Prioritate: medie.

## 12. Notificari catre utilizatori

In mobile, notificari/favorites/wallet sunt dezactivate prin feature flags. Cand notificari devine functie reala, adminul ar trebui sa controleze comunicarea operationala.

Ar trebui implementata ruta:

```text
/admin/notificari
```

Functionalitati recomandate:

- notificari tranzactionale;
- notificari manuale catre user/prestator;
- template-uri;
- segmente;
- istoric livrare;
- retry pentru trimiteri esuate;
- opt-in/opt-out respectat per utilizator.

Prioritate: medie.

## Roadmap recomandat

### Faza 1 - completare rapida folosind backend existent

Obiectiv: sa facem vizibile in UI capabilitatile deja existente.

Task-uri:

- transformare `/admin` in dashboard operational real;
- adaugare `/admin/recenzii`;
- adaugare `/admin/audit`;
- adaugare linkuri noi in sidebar;
- conectare UI la callable-urile existente;
- pastrare newsletter sub o sectiune separata.

Impact: mare.
Efort: mic spre mediu.

### Faza 2 - operatiuni suport

Obiectiv: adminul poate rezolva probleme reale din aplicatia mobila.

Task-uri:

- adaugare `/admin/clienti`;
- adaugare detalii client;
- extindere detalii booking cu interventii admin;
- model `supportTickets`;
- ruta `/admin/suport`;
- note interne pe client, provider si booking.

Impact: foarte mare.
Efort: mediu.

### Faza 3 - financiar si risc

Obiectiv: vizibilitate clara asupra platilor si cazurilor cu risc.

Task-uri:

- adaugare `/admin/plati`;
- reconciliere Stripe;
- refund tracking;
- export CSV;
- metrici provider;
- alerte pentru plati esuate si booking-uri blocate.

Impact: mare.
Efort: mediu spre mare.

### Faza 4 - configurare si scalare

Obiectiv: echipa poate opera marketplace-ul fara modificari de cod pentru orice schimbare mica.

Task-uri:

- adaugare `/admin/marketplace`;
- configurare categorii si servicii;
- configurare reguli booking;
- configurare documente provider;
- feature flags administrabile;
- administrare echipa admin si permisiuni.

Impact: mare pe termen lung.
Efort: mare.

## Navigatie propusa

Structura recomandata pentru sidebar:

```text
Operatiuni
- Dashboard
- Programari
- Clienti
- Prestatori
- Plati
- Suport

Moderare
- Recenzii
- Conversatii
- Audit

Marketing
- Newsletter overview
- Campanii
- Abonati
- Loguri newsletter
- Setari newsletter

Configurare
- Marketplace
- Notificari
- Echipa admin
- Setari sistem
```

## Prioritati concrete

### Must-have inainte de productie

- dashboard operational;
- clienti;
- audit operational;
- moderare review-uri;
- suport/tichete;
- plati;
- actiuni controlate pe booking-uri;
- RBAC minim.

### Should-have

- conversatii read-only pentru dispute;
- scoring prestatori;
- exporturi CSV;
- configurare marketplace;
- notificari manuale.

### Later

- rapoarte avansate;
- cohort analytics;
- fraud scoring;
- payout automation;
- administrare completa feature flags;
- SLA pentru suport.

## Observatii tehnice

- Pentru actiunile critice, logarea in `auditEvents` trebuie sa fie obligatorie.
- Paginile noi ar trebui sa foloseasca acelasi model de proxy API din `next-js`, cu validare admin server-side.
- `support` poate avea acces de citire si actiuni non-distructive, dar aprobarile, suspendarile, refund-urile si modificarile financiare trebuie rezervate pentru `admin` sau rol dedicat.
- Pentru liste mari, backend-ul ar trebui mutat treptat de la scanare colectie completa la query-uri paginated/indexed in Firestore.
- Pentru GDPR, stergerea conturilor, exportul datelor si consimtamantul trebuie tratate explicit in admin.

## Primul pas recomandat

Cel mai bun prim pas este Faza 1:

1. schimbam `/admin` din newsletter overview in dashboard operational;
2. mutam newsletter overview intr-o ruta dedicata, de exemplu `/admin/newsletter`;
3. adaugam `/admin/recenzii`;
4. adaugam `/admin/audit`;
5. actualizam sidebar-ul.

Aceasta etapa foloseste in mare parte servicii deja existente si creste imediat utilitatea admin panel-ului.
