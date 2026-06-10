# Kokebok Changelog

## v5.0.0 - Stor refaktorering og feilretting 🔧
**Released:** 10. juni 2026

### 🏗️ Refaktorering
- `app.js` (16 832 linjer) delt opp i 15 oversiktlige moduler under `js/`
- Ubrukt skjelettkode fjernet (`functions/`, `dontknow/`, `dataconnect/`, `src/`, npm-filer)
- Sidemenyen ryddet: dupliserte seksjoner og oppføringer slått sammen, utdaterte «NY»-merker fjernet

### 🐛 Kritiske feilrettinger
- **Service worker**: network-first med versjonert cache – brukere får nå alltid nyeste kode (hovedårsak til at gamle feil «aldri ble fikset»)
- **Handleliste**: tomme varer i handlemodus/smart liste/opplesing (feil feltnavn) – fikset
- **Timer**: `setTimerMinutes` manglet, hurtigtimer og talekommandoer krasjet – fikset
- **Priser**: Kassal-API-svar feiltolket (0 kr på alt) + ingredienser priset tegn-for-tegn – fikset
- **Utstyr**: bilder komprimeres nå (lagring feilet pga. Firestores 1 MB-grense); «Avbryt»-knappen fungerer
- **Innstillinger**: ble lastet fra tilfeldig dokument i settings-samlingen – leser nå `user-settings`
- **Manglende funksjoner**: `applyBudgetPlanToWeek` og `retryAnalysis` implementert
- **Ultraprosessert-analyse**: krasjet på ingrediens-strenger – fikset

## v4.0.0 - Social Update 🎉
**Released:** 2025

### ✨ Nye funksjoner

#### 👥 Vennesystem
- **Legg til venner** med e-postadresse
- **Venneforespørsler** - send, motta, godta eller avslå
- **Venneliste** med oversikt over alle dine venner
- **Venneprofiler** - se statistikk, nivå og prestasjoner for venner

#### 🏆 Toppliste & Konkurranse  
- **Global toppliste** - sammenlign XP og nivå med alle brukere
- **Vennetoppliste** - konkurrer direkte med dine venner
- **Rangering** - se hvor du plasserer deg

#### 📤 Oppskriftsdeling
- **Del oppskrifter** direkte med venner i appen
- **Motta delte oppskrifter** - lagre direkte til din kokebok
- **Delingsnotifikasjoner** - få beskjed når noen deler med deg

#### 🔔 Real-time oppdateringer
- **Øyeblikkelige varsler** når du får nye venneforespørsler
- **Notifikasjonsbadge** på venneknappen
- **Sosialt kort på dashboardet** med vennestatus

#### 🏅 Nye prestasjoner
- **Ny venn** 🤝 - Fikk din første venn
- **Sosial sommerfugl** 🦋 - Har 5 venner
- **Populær kokk** 🌟 - Har 10 venner
- **Matinfluenser** 📱 - Har 25 venner
- **Sjenerøs kokk** 💝 - Delte 5 oppskrifter
- **Delingskonge** 👑 - Delte 20 oppskrifter
- **Gavemottaker** 🎁 - Mottok 5 oppskrifter
- **Topp 10** 🏅 - Kom på topp 10 på topplisten
- **Venneleder** 🏆 - Topp 1 blant venner

### 🎨 UI/UX forbedringer
- Ny venneknapp i header med notification badge
- Sosialt kort på dashboardet
- Forbedret delingsmeny med vennevalg
- Nye innstillinger for offentlig profil
- Oppdatert design for sosiale funksjoner

### ⚙️ Innstillinger
- **Offentlig profil** - velg om andre kan finne deg på topplisten

### 🔧 Teknisk
- Firebase Firestore for sosiale data
- Real-time listeners for øyeblikkelige oppdateringer
- Offentlige brukerprofiler for leaderboard

---

## v3.6.1 - iPhone & Safari Fiks
- Fikset innloggingsproblemer på iPhone/Safari
- La til popup-first strategi for iOS-enheter
- Forbedret SESSION persistence
- Premium "Dagens oppskrift" kort
- Daglige utfordringer
- Cooking streak tracking

## v3.6.0 - Gamification Update
- Porsjonsskalering
- 35+ prestasjoner
- XP og nivå-system
- Forbedret achievements UI

## v3.5.x - Core Features
- URL-import av oppskrifter
- AI måltidsplanlegger
- Handlemodus
- Oppskriftsskalerer
- Rester-hjelper
- Næringsberegner
- Kokedagbok
