# Admin Dashboard / Backoffice Gap List (Next.js vs Expo Mobile)

Actualizat: 2026-05-08

## Scop

Acest document inventariaza ce ar mai trebui adaugat in Admin Panel-ul din `next-js` ca sa fie suficient de util operational pentru aplicatia `expo-mobile-app`.

Focus: informatii actionabile pentru operatiuni zilnice (marketplace, suport, plati, moderare, risc), nu doar vizualizare.

## Observatie Cheie (Navigatie)

`Setari` nu ar trebui sa stea sub `Newsletter`.

Pagina `next-js/src/app/(studio)/admin/settings/page.tsx` contine:
- newsletter settings
- email templates
- mobile app update settings

Deci `Setari` trebuie tratata ca zona operationala / configurare sistem, nu marketing.

## Structura Recomandata In Sidebar

```text
Operatiuni
- Dashboard
- Prestatori
- Utilizatori
- Programari
- Plati
- Suport
- Setari

Moderare
- Recenzii
- Conversatii
- Audit

Marketing
- Newsletter (overview)
- Campanii
- Abonati
- Loguri newsletter
```

## Ce Lipseste Din Dashboard (Primul Ecran)

Dashboard-ul actual acopera baza (cozi + distributii status + audit recent), dar pentru operatiuni reale lipsesc metrici, alerte si drilldowns pe fluxurile din mobile.

### KPI / Metrici (de adaugat)
- Utilizatori noi: azi, 7 zile, 30 zile; useri fara locatie; useri fara booking.
- Conversie user -> booking: utilizatori cu cel putin o programare; booking-uri create per zi/saptamana.
- Prestatori incompleti: fara servicii, fara disponibilitate, documente lipsa/expirate, profil incomplet.
- Calitate prestatori: rating mediu, review count, rata acceptare, rata anulare, timp mediu raspuns.
- Plati: total pe perioada, in progres, esuate, refund-uri, reconciliere webhook (cand e cazul).
- Review-uri: noi in ultimele 24h/7z, scoruri mici recente, hidden/flagged.
- Suport: tichete deschise, urgente, timp mediu de rezolvare (cand exista model real).
- Conversatii: conversatii active, unread total, conversatii legate de booking-uri cu probleme.
- Notificari: trimise / livrare esuata / push devices active vs inactive (cand exista date suficiente).
- Sanatate sistem: callables lipsa/nedeployate, webhook Stripe recent, erori recurente in logs/audit.

### Cozi Operationale (de extins)
- Plati in `in_progress` prea mult timp (stuck).
- Programari cu multe reprogramari (risc/dispute).
- Booking-uri cu status inconsistent fata de payment status.
- Prestatori `approved` dar fara servicii active / fara availability (nepublicabili operational).
- Review-uri negative recente pentru acelasi prestator (semnal de calitate).

## Pagini Admin Care Lipsesc (Backoffice Complet)

### 1) Plati: `/admin/plati`
Obligatoriu pentru operatiuni reale si suport.

Functionalitati:
- lista plati + filtre (status, perioada, provider/user, processor id)
- link catre booking + user + provider
- Stripe refs (PaymentIntent/Charge) daca exista
- reconciliere: webhook missing/delayed (cand apare)
- export CSV (contabilitate / suport)

Surse date (schema):
- `payments/{paymentId}`
- `bookings/{bookingId}`

### 2) Recenzii: `/admin/recenzii`
In mobile exista review flow; in admin lipseste moderarea.

Functionalitati:
- lista + filtre (provider, user, rating, status, perioada)
- link catre booking/provider/user
- moderare: hide/re-publish (status-based), note interne
- export CSV pentru investigatii (optional)

Surse date:
- `reviews/{bookingId}`
- `bookings/{bookingId}` (context)

### 3) Audit Operational: `/admin/audit`
Separat de logurile newsletter. Necesita cautare si filtrare.

Functionalitati:
- lista evenimente audit
- filtre: actorUid, actorRole, resourceType, resourceId, action, result
- cautare libera (minim)
- link direct catre resursa (booking/provider/user) cand este posibil
- export CSV (suport, securitate, postmortem)

Surse date:
- `auditEvents/{eventId}`

### 4) Suport: `/admin/suport`
In `expo-mobile-app`, e inca demo/local (form + Alert). Pentru productie trebuie model real.

Recomandare model:
- `supportTickets/{ticketId}`
- `supportTickets/{ticketId}/messages/{messageId}` (optional)

Functionalitati:
- lista tichete + status/priority
- asignare, note interne, legare la booking/provider/user
- istoricul discutiilor (daca se implementeaza)
- SLA simplu: open/in_progress/waiting_user/resolved/closed

### 5) Conversatii: `/admin/conversatii`
Messaging este activ in mobile (conversatii + membership + mesaje).

Functionalitati:
- lista conversatii (search dupa booking/provider/user)
- read-only timeline mesaje (pentru dispute)
- flag/report conversation (status + audit)
- block participant (daca exista conceptul in model)

Surse date (schema propusa deja in docs):
- `conversations/{conversationId}`
- `conversationMemberships/{conversationId_uid}`
- `conversations/{conversationId}/messages/{messageId}`

### 6) Notificari: `/admin/notificari`
In mobile exista colectia `notifications` si push device callables.

Functionalitati:
- istoric livrari/erori (cand se introduce delivery tracking)
- segmentare (user vs provider) + template-uri
- retry logic pentru esecuri (cand exista)

Surse date:
- `notifications/{notificationId}`
- `pushDevices/*` (daca exista in backend)

### 7) Marketplace Config: `/admin/marketplace` (sau tab in Setari)
Reducem schimbari din cod pentru configurari de business.

Functionalitati:
- servicii/categorii disponibile
- judete/orase active
- reguli booking (durate, limite, status transitions)
- documente obligatorii provider + reguli de publicare
- feature flags administrabile (daca se doreste)

### 8) Echipa / RBAC: `/admin/echipa`
Extinde rolurile (admin/support/moderator/finance/readonly) si defineste clar drepturile.

## Prioritizare (Ce As Face Prima Data)

### Faza 1 (cel mai mare impact, efort mic-mediu)
- Mutare `Setari` sub `Operatiuni` (si split clar pe tabs)
- Adaugare `/admin/recenzii`
- Adaugare `/admin/audit`
- Adaugare `/admin/plati` (chiar si read-only initial)

### Faza 2 (operatiuni suport)
- Model real `supportTickets` + `/admin/suport`
- Interventii admin pe booking (anulare cu motiv, nota interna, marcare disputa)
- Conversatii read-only pentru dispute

### Faza 3 (risc/financiar/quality)
- scoring prestatori (rate acceptare/anulare, rating trends)
- alerte automate (plati stuck, booking-uri problematice)
- exporturi CSV standardizate (plati/audit/reviews)

## Note Tehnice

- Actiunile critice trebuie sa scrie in `auditEvents`.
- Pentru liste mari: evitati scan pe colectii, mutati pe query paginat + indexuri Firestore.
- Dashboard-ul bun are drilldown: fiecare card/alerta trebuie sa duca la o lista filtrata.

