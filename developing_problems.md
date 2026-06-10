# Kokebok - Problemer og Løsninger

## ✅ FIKSET: Timer funksjon
**Problem:** Timer-knappene fungerte ikke fordi JavaScript brukte feil element-IDer.
**Løsning:** Rettet ID-mismatch mellom HTML (`startTimerBtn`, `pauseTimerBtn`, `resetTimerBtn`, `timerValue`) og JavaScript. Lagt til forbedret funksjonalitet med Start/Pause toggle.

## ✅ FIKSET: Kategorier på hjemmesiden
**Problem:** Bare topp 8 kategorier ble vist på dashbordet.
**Løsning:** Endret `renderCategories()` til å vise ALLE kategorier i stedet for bare de 8 første.

## ✅ FIKSET: Oversettelse fungerer dårlig
**Problem:** Begrenset oversettelsesordbok for norsk-engelsk API-søk.
**Løsning:** Utvidet `norwegianToEnglish` ordboken med 150+ nye matrelaterte ord inkludert:
- Proteiner (kylling, biff, fisk, sjømat, etc.)
- Pasta og karbohydrater
- Supper og gryteretter
- Desserter og søtsaker
- Frukt og grønnsaker
- Meieriprodukter
- Matlagingsmetoder
- Norsk tradisjonsmat
- Internasjonale kjøkken

## ✅ FIKSET: Gjentatte varsler ved innlogging
**Problem:** Brukere fikk varsler om venner og delte oppskrifter hver gang de logget inn.
**Løsning:** Lagt til `socialDataInitialLoadComplete` flag som forhindrer varsler i de første 3 sekundene etter innlogging. Kun nye hendelser etter initial lasting trigger varsler.

## ✅ FIKSET: Test-runner error
**Problem:** `Cannot read properties of null (reading 'style')` på linje 522.
**Løsning:** La til null-sjekk for `empty-state` elementet før styling: `if (emptyState) emptyState.style.display = 'none'`.

## ✅ FIKSET: Ukentlig backup system
**Problem:** Ingen automatisk backup av data.
**Løsning:** Implementert komplett backup-system:
- **Automatisk backup hver uke** til IndexedDB (for større data)
- Fallback til localStorage (for mindre data)
- Beholder siste 4 backups (ca. 1 måned)
- Manuell backup-knapp i Innstillinger
- Gjenoppretting fra tidligere backups
- Push-varsel når backup er fullført

## ✅ FIKSET: Bildevisning - Zoom og Rotasjon
**Problem:** Kunne ikke zoome eller rotere bilder i oppskrifter.
**Løsning:** Implementert avansert bildevisning med:
- **Pinch-to-zoom** på mobile enheter
- **Scroll-zoom** på PC
- **Rotasjon** 90° i begge retninger
- **Drag-to-pan** når zoomet inn
- **Dobbeltklikk** for å tilbakestille
- Nye kontrollknapper i bildeviseren

## 📝 NOTAT: Flere bilder per oppskrift
**Status:** Allerede støttet! App-en håndterer flere bilder (`state.tempImages` array, `recipe.images` array). Du kan laste opp flere bilder når du redigerer en oppskrift.

## 📝 NOTAT: AI-funksjonalitet
**Status:** AI-funksjonene krever API-nøkler:
- **Gemini (GRATIS):** Gå til Innstillinger → Legg inn Gemini API-nøkkel
- **OpenAI (Betalt):** Krever OpenAI API-nøkkel
- Uten API-nøkler vil AI-skanning ikke fungere. Hent gratis nøkkel fra Google AI Studio.

## ✅ FIKSET (v5.0.0): Gammel kode ble servert fra cache – hovedårsaken til «fortsatt ødelagt»
**Problem:** Service workeren brukte cache-first med et cachenavn som aldri ble oppdatert. Brukere fikk derfor GAMMEL JavaScript selv etter at feil var rettet og deployet. Dette forklarte at timer, bilderotasjon og handleliste «fortsatt» var ødelagt etter fikser.
**Løsning:** Ny service worker (v5.0.0) med network-first for appens egne filer, versjonert cache, `skipWaiting`/`clients.claim`, og automatisk reload/varsel når ny versjon er klar.

## ✅ FIKSET (v5.0.0): Tomme elementer i handlelisten
**Problem:** Varer lagres som `{ text, checked }`, men handlemodus, smart handleliste, «fullfør handletur» og opplesing brukte `item.name || item` – navnet ble aldri funnet, så radene var tomme/ødelagte.
**Løsning:** Alle visninger og operasjoner bruker nå `getItemName()`. Gamle ødelagte varer ryddes automatisk av `normalizeShoppingListItems()` ved innlasting.

## ✅ FIKSET (v5.0.0): Timer på hjemskjermen sto på 00:00
**Problem:** Hurtigtimeren og talekommandoer kalte `setTimerMinutes()` – en funksjon som ikke fantes (ReferenceError), så timeren startet aldri ordentlig.
**Løsning:** `setTimerMinutes()` er implementert (js/06-shopping-timer.js). Den flytende timeren oppdateres av samme ticker som modal-timeren.

## ✅ FIKSET (v5.0.0): Prisestimat viste 0 / meningsløse tall
**Problem:** Kassal-API-et kan returnere `current_price` som tall eller objekt – koden antok alltid objekt og fikk `undefined` → 0. I tillegg itererte `estimateRecipeCost`/`showPriceComparison` over ingrediens-STRENGEN tegn for tegn.
**Løsning:** Ny `getKassalPrice()`-hjelper håndterer begge formater, og alle kostnadsfunksjoner deler nå ingrediensteksten i linjer før estimering.

## ✅ FIKSET (v5.0.0): Kunne ikke legge til utstyr
**Problem:** (1) Utstyrsbilder ble lagret ukomprimert som base64 – mobilbilder overskred Firestores 1 MB-grense slik at lagring alltid feilet. (2) «Avbryt»-knappen lukket feil modal og virket død.
**Løsning:** Bilder komprimeres nå (maks ~700 KB), og `closeModal()` lukker begge modaltyper.

## ✅ FIKSET (v5.0.0): Bilderotasjon lagres permanent
Rotasjon lagres i `recipe.imageRotations` i Firestore og brukes både i bildeviseren og på oppskriftssiden. (Koden fantes, men nådde aldri brukerne pga. cache-problemet over.)

## ✅ FIKSET (v5.0.0): Innstillinger ble lastet tilfeldig
**Problem:** `loadAllData` leste `settings[0]` – som kunne være handlelisten eller ukeplanen i stedet for brukerinnstillingene.
**Løsning:** Leser nå eksplisitt dokumentet `user-settings`.

## ✅ FIKSET (v5.0.0): Manglende funksjoner
`applyBudgetPlanToWeek()` (budsjettplan → ukemeny) og `retryAnalysis()` (AI-skanner «Prøv igjen») fantes ikke og er nå implementert.

## 🏗️ REFAKTORERT (v5.0.0)
- `app.js` (16 832 linjer) er delt opp i 15 moduler under `js/` (lastes i rekkefølge, samme globale funksjoner som før).
- Ubrukt skjelettkode fjernet: `functions/`, `dontknow/`, `dataconnect/`, `src/`, `node_modules/`, `package.json`.
- Sidemenyen ryddet: duplikatseksjoner slått sammen, dupliserte oppføringer og utdaterte «NY»-merker fjernet.

---
*Sist oppdatert: 10. juni 2026 (v5.0.0)*

