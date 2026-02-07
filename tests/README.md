# 🧪 Kokebok Test Suite v4.6.0

## Oversikt

Dette er en omfattende test-suite for Familiens Kokebok-applikasjonen. Test-suiten er designet for å fange feil før de når brukerne, og dekker alle hovedfunksjoner i applikasjonen.

## 📁 Filstruktur

```
tests/
├── test-suite.js           # Test framework og hjelpefunksjoner
├── unit-tests.js           # Unit tests for individuelle funksjoner
├── integration-tests.js    # Integrasjonstester
├── e2e-tests.js            # End-to-end scenariotester
├── security-tests.js       # Sikkerhetstester
├── performance-tests.js    # Ytelsestester
├── test-runner.html        # Visuell test-runner for nettleser
└── README.md               # Denne filen
```

## 🚀 Hvordan kjøre testene

### I nettleser (anbefalt)
1. Åpne `test-runner.html` i en nettleser
2. Klikk "Kjør alle tester" eller velg en spesifikk test-kategori
3. Se resultatene i sanntid

### Lokal server (for å unngå CORS-problemer)
```bash
# Med Python
python -m http.server 8080

# Med Node.js (etter å ha installert http-server)
npx http-server -p 8080

# Åpne deretter http://localhost:8080/tests/test-runner.html
```

## 📋 Test-kategorier

### Unit Tests (`unit-tests.js`)
Tester individuelle funksjoner isolert:
- **Helper Functions**: `escapeHtml`, `getCategoryName`, `getCategoryIcon`, etc.
- **State Management**: State-objektstruktur og innstillinger
- **Recipe Functions**: Skalering, validering, filtrering, sortering
- **Gamification**: XP-beregning, nivåer, achievements, streaks
- **Social Features**: Venneforespørsler, deling, leaderboard
- **Meal Planning**: Datoberegning, handlelistegenerering
- **Settings**: Dark mode, fontstørrelse, notifikasjoner
- **Timer**: Formatering, nedtelling
- **Data Export/Import**: Struktur og validering
- **Search**: Oppskriftssøk, oversettelse
- **Image Handling**: Base64-validering, komprimering
- **Kitchen Equipment**: Utløpsdatoer, kategorisering
- **Cookbook Sharing**: Eksport/import format
- **Error Handling**: Toast-meldinger, nettverksfeil

### Integration Tests (`integration-tests.js`)
Tester samspill mellom komponenter:
- **Firebase Integration**: CRUD-operasjoner, batch writes
- **Authentication**: Auth state changes, profilopprettelse
- **Recipe-Category**: Filtrering, opptelling
- **Cookbook-Recipe**: Linking, legg til/fjern
- **Gamification Integration**: Fullstendig XP/achievement flow
- **Social Integration**: To-veis vennskap, delingsflyt
- **Meal Planning Integration**: Plan til handleliste
- **Settings Integration**: Lagring og synkronisering
- **Timer Integration**: Flere samtidige timere

### E2E Tests (`e2e-tests.js`)
Tester komplette brukerscenarier:
- **User Onboarding**: Registrering, profilopprettelse, standardinnstillinger
- **Recipe Workflow**: Opprett, rediger, del, slett
- **Gamification Flow**: Aktiver, opptjen achievements, level up
- **Friendship Flow**: Send forespørsel, aksepter, se leaderboard
- **Meal Planning**: Planlegg uke, generer handleliste
- **Cookbook Sharing**: Opprett, fyll, del, motta
- **Data Export/Import**: Full eksport og reimport
- **Error Recovery**: Nettverksfeil, korrupt data
- **Timer Scenario**: Flere timere under matlaging

### Security Tests (`security-tests.js`)
Tester sikkerhet og validering:
- **XSS Prevention**: HTML-escaping, script-injeksjon
- **Input Validation**: E-post, oppskriftvalidering, venneforespørsler
- **Data Integrity**: JSON-parsing, prototype pollution
- **Authentication Security**: Brukervalidering, tilgangskontroll
- **Rate Limiting**: Handlingsgrenser, login-forsøk
- **Content Security**: Bilde-URL-validering, filstørrelse
- **Firestore Security Rules**: Simulert regelsjekk

### Performance Tests (`performance-tests.js`)
Tester ytelse og optimalisering:
- **Rendering Performance**: Rendering av mange oppskrifter
- **Virtual Scrolling**: Synlig område-beregning
- **Search Performance**: Søk i store datasett
- **Data Structure Performance**: Map vs Object, indeksering
- **Memory Optimization**: Event listeners, state updates
- **Debounce/Throttle**: Funksjonskallbegrensning
- **Lazy Loading**: Bilder, paginering
- **Caching**: Memoization, LRU cache

## 🔧 Test Framework Features

### KokebokTestSuite klasse
```javascript
const suite = new KokebokTestSuite();

// Grupper tester
suite.describe('Kategori', () => {
    suite.test('testnavn', () => {
        // test-kode
    });
    
    suite.test('async test', async () => {
        // async test-kode
    });
});

// Kjør alle tester
const results = await suite.runAll();
```

### Assertion-metoder
```javascript
assert.equal(actual, expected, message);
assert.notEqual(actual, expected, message);
assert.deepEqual(actual, expected, message);
assert.isTrue(value, message);
assert.isFalse(value, message);
assert.isDefined(value, message);
assert.isUndefined(value, message);
assert.isNull(value, message);
assert.isNotNull(value, message);
assert.isArray(value, message);
assert.isObject(value, message);
assert.isFunction(value, message);
assert.lengthOf(array, expected, message);
assert.contains(array, item, message);
assert.hasProperty(obj, prop, message);
assert.throws(fn, message);
assert.rejects(promise, message);
assert.greaterThan(a, b, message);
assert.lessThan(a, b, message);
assert.greaterThanOrEqual(a, b, message);
assert.lessThanOrEqual(a, b, message);
assert.matches(str, regex, message);
```

### Mock-objekter
```javascript
// Firebase mock
const mockDb = mockFirebase.firestore();
const mockAuth = mockFirebase.auth();

// localStorage mock
const storage = mockLocalStorage();

// DOM mock
const element = mockDOM.createElement('div');
```

## 📊 Test-resultater

Etter å ha kjørt testene vises:
- **Totalt antall tester**
- **Antall bestått**
- **Antall feilet**
- **Total tid**
- **Detaljerte feilmeldinger for mislykkede tester**
- **Gruppering etter kategori**
- **Filtrering av resultater**

## 🎯 Testdekning

Test-suiten dekker følgende hovedområder:

| Område | Dekning |
|--------|---------|
| Helper-funksjoner | ✅ Komplett |
| Oppskriftshåndtering | ✅ Komplett |
| Gamification | ✅ Komplett |
| Sosiale funksjoner | ✅ Komplett |
| Måltidsplanlegging | ✅ Komplett |
| Innstillinger | ✅ Komplett |
| Timer | ✅ Komplett |
| Import/Eksport | ✅ Komplett |
| Sikkerhet | ✅ Komplett |
| Ytelse | ✅ Komplett |

## 🔄 Kontinuerlig testing

For å opprettholde kodekvalitet:
1. Kjør testene før hver commit
2. Kjør alle tester etter større endringer
3. Legg til nye tester når du legger til nye funksjoner
4. Oppdater eksisterende tester når funksjonalitet endres

## 🐛 Rapportere feil

Hvis en test avdekker en feil:
1. Noter hvilken test som feilet
2. Les feilmeldingen nøye
3. Reproduser feilen manuelt
4. Fiks koden
5. Kjør testene på nytt for å verifisere

## 📝 Legge til nye tester

```javascript
// Legg til i passende test-fil
suite.describe('Ny kategori', () => {
    suite.test('ny test', () => {
        // Setup
        const input = 'test';
        
        // Execute
        const result = functionToTest(input);
        
        // Assert
        assert.equal(result, expectedValue);
    });
});
```

## 🏆 Mål

- **100% testdekning** for kritiske funksjoner
- **< 50ms** for individuelle tester
- **< 5 sekunder** for fullstendig test-suite
- **0 sikkerhetshull** oppdaget

---

*Utviklet for Familiens Kokebok v4.6.0*
