# 📖 Familiens Kokebok

**Digitaliser gamle kokebøker og oppskrifter fra bestemødre og oldemødre**

En profesjonell webapp for å bevare familiens kulinariske arv. Last opp bilder av gamle, håndskrevne oppskrifter og transkriber dem til digitalt format.

## ✨ Funksjoner

### 📸 Bildeopplasting
- Last opp bilder av håndskrevne oppskrifter
- Ta bilder direkte med kamera (mobil/nettbrett)
- Automatisk bildekomprimering for raskere lasting
- Se originalbilder i fullskjermvisning

### 📝 Oppskriftsorganisering
- Transkriber ingredienser og fremgangsmåte
- Legg til kilde (hvem oppskriften er fra)
- Organiser i kategorier (forrett, hovedrett, dessert, etc.)
- Legg til emneknagger for enkel søking
- Søk i alle oppskrifter

### 📚 Digitale Kokebøker
- Opprett kokebøker for å samle relaterte oppskrifter
- Legg til omslagsbilde og beskrivelse
- Les som digital bok med sidevending
- Eksporter som HTML for utskrift

### 🔐 Sikkerhet & Synkronisering
- Logg inn med Google-konto
- All data er privat og kun tilgjengelig for deg
- Synkroniseres automatisk på tvers av enheter
- Eksporter/importer data for backup

### 📱 Fungerer Overalt
- Progressive Web App (PWA)
- Installer som app på iPhone, iPad, Android og PC
- Fungerer offline (med cached data)
- Responsivt design

---

## 🚀 Oppsett

### 1. Opprett Firebase-prosjekt

1. Gå til [Firebase Console](https://console.firebase.google.com)
2. Klikk "Add project" / "Opprett prosjekt"
3. Gi prosjektet et navn (f.eks. "familiens-kokebok")
4. Deaktiver Google Analytics (valgfritt)
5. Klikk "Create project"

### 2. Aktiver Google-autentisering

1. I Firebase Console, gå til **Authentication** → **Sign-in method**
2. Klikk på **Google**
3. Aktiver det og legg til prosjektnavn
4. Lagre

### 3. Opprett Firestore Database

1. Gå til **Firestore Database**
2. Klikk "Create database"
3. Velg **Production mode**
4. Velg lokasjon nær deg (f.eks. `europe-west1`)
5. Klikk "Enable"

### 4. Sett opp Security Rules

Gå til **Firestore Database** → **Rules** og lim inn:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Klikk "Publish".

### 5. Registrer Web App

1. Gå til **Project settings** (tannhjulet øverst)
2. Scroll ned til "Your apps" og klikk **</>** (Web)
3. Gi appen et navn (f.eks. "Kokebok Web")
4. Klikk "Register app"
5. Kopier `firebaseConfig`-objektet

### 6. Oppdater firebase-config.js

Åpne `firebase-config.js` og erstatt med din config:

```javascript
const firebaseConfig = {
    apiKey: "DIN_API_KEY",
    authDomain: "ditt-prosjekt.firebaseapp.com",
    projectId: "ditt-prosjekt",
    storageBucket: "ditt-prosjekt.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123"
};
```

### 7. Legg til autoriserte domener

1. Gå til **Authentication** → **Settings** → **Authorized domains**
2. Legg til ditt GitHub Pages-domene:
   - `thorsenh1.github.io`
   
---

## 🌐 Deploy til GitHub Pages

### 1. Opprett GitHub Repository

1. Gå til [github.com/new](https://github.com/new)
2. Repo navn: `kokebok` (eller hva du vil)
3. Velg **Public**
4. Klikk "Create repository"

### 2. Last opp filene

```bash
cd Kokebok
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/ThorsenH1/kokebok.git
git push -u origin main
```

### 3. Aktiver GitHub Pages

1. Gå til repository → **Settings** → **Pages**
2. Under "Source", velg **main** branch
3. Klikk "Save"
4. Vent noen minutter, så er appen live på:
   `https://thorsenh1.github.io/kokebok/`

---

## 📱 Installer som App

### iPhone/iPad
1. Åpne Safari og gå til appen
2. Trykk på dele-ikonet (firkant med pil opp)
3. Velg "Legg til på Hjem-skjerm"
4. Trykk "Legg til"

### Android
1. Åpne Chrome og gå til appen
2. Trykk på menyknappen (tre prikker)
3. Velg "Legg til på startskjermen"
4. Trykk "Legg til"

### PC (Chrome)
1. Åpne Chrome og gå til appen
2. Klikk på installasjons-ikonet i adressefeltet
3. Klikk "Installer"

---

## 🎨 Tilpasning

### Endre farger
Rediger CSS-variablene i `style.css`:

```css
:root {
    --primary: #8B4513;        /* Hovedfarge */
    --primary-light: #A0522D;  /* Lysere variant */
    --primary-dark: #5D2E0D;   /* Mørkere variant */
    --accent: #F4A460;         /* Aksentfarge */
    /* ... */
}
```

### Legge til kategorier
Rediger `DEFAULT_CATEGORIES` i `app.js`:

```javascript
const DEFAULT_CATEGORIES = [
    { id: 'forrett', name: 'Forretter', icon: '🥗' },
    { id: 'hovedrett', name: 'Hovedretter', icon: '🍽️' },
    // Legg til flere her...
];
```

---

## 📋 Filstruktur

```
Kokebok/
├── index.html          # Hovedside med HTML-struktur
├── style.css           # All styling
├── app.js              # Hovedapplikasjon
├── firebase-config.js  # Firebase-konfigurasjon
├── manifest.json       # PWA-manifest
├── sw.js               # Service Worker
├── README.md           # Denne filen
└── icons/
    ├── icon-192.svg    # App-ikon (liten)
    └── icon-512.svg    # App-ikon (stor)
```

---

## 🔒 Sikkerhet

- **Ingen data lagres lokalt** - alt synkroniseres med Firebase
- **Google-autentisering** - kun du kan logge inn
- **Firestore Security Rules** - data er kun tilgjengelig for eieren
- **HTTPS** - all kommunikasjon er kryptert

---

## 📞 Support

Har du spørsmål eller problemer? Opprett et issue på GitHub!

---

## 📜 Lisens

Opphavsrett (c) 2026. Alle rettigheter reservert.

Koden og innholdet i dette prosjektet kan ikke kopieres, distribueres, endres eller brukes kommersielt uten skriftlig tillatelse og/eller gyldig lisensavtale. Kontakt utvikler for lisensiering.

---

Laget med ❤️ for å bevare familietradisjoner
