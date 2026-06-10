// =====================================================
// v4.3.0 - PREMIUM FEATURES
// =====================================================

// ===== NUTRITION CALCULATOR =====
const NUTRITION_DATABASE = {
    // Per 100g - kalorier, protein, karbs, fett
    'mel': { cal: 364, protein: 10, carbs: 76, fat: 1 },
    'sukker': { cal: 387, protein: 0, carbs: 100, fat: 0 },
    'smør': { cal: 717, protein: 1, carbs: 0, fat: 81 },
    'egg': { cal: 155, protein: 13, carbs: 1, fat: 11 },
    'melk': { cal: 42, protein: 3, carbs: 5, fat: 1 },
    'fløte': { cal: 340, protein: 2, carbs: 3, fat: 36 },
    'ost': { cal: 402, protein: 25, carbs: 1, fat: 33 },
    'kylling': { cal: 239, protein: 27, carbs: 0, fat: 14 },
    'laks': { cal: 208, protein: 20, carbs: 0, fat: 13 },
    'torsk': { cal: 82, protein: 18, carbs: 0, fat: 1 },
    'kjøttdeig': { cal: 254, protein: 17, carbs: 0, fat: 20 },
    'biff': { cal: 250, protein: 26, carbs: 0, fat: 15 },
    'svinekjøtt': { cal: 242, protein: 27, carbs: 0, fat: 14 },
    'bacon': { cal: 541, protein: 37, carbs: 1, fat: 42 },
    'ris': { cal: 130, protein: 3, carbs: 28, fat: 0 },
    'pasta': { cal: 131, protein: 5, carbs: 25, fat: 1 },
    'brød': { cal: 265, protein: 9, carbs: 49, fat: 3 },
    'poteter': { cal: 77, protein: 2, carbs: 17, fat: 0 },
    'gulrot': { cal: 41, protein: 1, carbs: 10, fat: 0 },
    'brokkoli': { cal: 34, protein: 3, carbs: 7, fat: 0 },
    'spinat': { cal: 23, protein: 3, carbs: 4, fat: 0 },
    'tomat': { cal: 18, protein: 1, carbs: 4, fat: 0 },
    'løk': { cal: 40, protein: 1, carbs: 9, fat: 0 },
    'hvitløk': { cal: 149, protein: 6, carbs: 33, fat: 1 },
    'paprika': { cal: 31, protein: 1, carbs: 6, fat: 0 },
    'avokado': { cal: 160, protein: 2, carbs: 9, fat: 15 },
    'banan': { cal: 89, protein: 1, carbs: 23, fat: 0 },
    'eple': { cal: 52, protein: 0, carbs: 14, fat: 0 },
    'appelsin': { cal: 47, protein: 1, carbs: 12, fat: 0 },
    'honning': { cal: 304, protein: 0, carbs: 82, fat: 0 },
    'olivenolje': { cal: 884, protein: 0, carbs: 0, fat: 100 },
    'rømme': { cal: 193, protein: 3, carbs: 4, fat: 18 },
    'yoghurt': { cal: 59, protein: 10, carbs: 4, fat: 0 },
    'cottage cheese': { cal: 98, protein: 11, carbs: 3, fat: 4 },
    'mandler': { cal: 579, protein: 21, carbs: 22, fat: 50 },
    'peanøtter': { cal: 567, protein: 26, carbs: 16, fat: 49 },
    'sjokolade': { cal: 546, protein: 5, carbs: 60, fat: 31 },
    'kakao': { cal: 228, protein: 20, carbs: 58, fat: 14 },
    'hvetemel': { cal: 364, protein: 10, carbs: 76, fat: 1 },
    'havregryn': { cal: 389, protein: 17, carbs: 66, fat: 7 },
    'linser': { cal: 116, protein: 9, carbs: 20, fat: 0 },
    'bønner': { cal: 127, protein: 9, carbs: 23, fat: 1 },
    'kikerter': { cal: 164, protein: 9, carbs: 27, fat: 3 },
    'tofu': { cal: 76, protein: 8, carbs: 2, fat: 5 }
};

// Allergen database
const ALLERGEN_DATABASE = {
    'gluten': ['mel', 'hvetemel', 'pasta', 'brød', 'spaghetti', 'nudler', 'couscous', 'bulgur', 'seitan', 'øl', 'bygg', 'rug', 'havre'],
    'melk': ['melk', 'fløte', 'smør', 'ost', 'rømme', 'yoghurt', 'iskrem', 'krem', 'cottage', 'mozzarella', 'parmesan', 'cheddar'],
    'egg': ['egg', 'eggehvite', 'eggeplomme', 'majones', 'majonez'],
    'nøtter': ['mandler', 'valnøtter', 'hasselnøtter', 'cashew', 'pistasjnøtter', 'pekannøtter', 'macadamia', 'nøtter'],
    'peanøtter': ['peanøtter', 'peanøttsmør', 'jordnøtter'],
    'soya': ['soya', 'tofu', 'edamame', 'tempeh', 'soyasaus', 'miso'],
    'fisk': ['laks', 'torsk', 'sei', 'makrell', 'ørret', 'kveite', 'hyse', 'sardiner', 'ansjos', 'tuna'],
    'skalldyr': ['reker', 'krabbe', 'hummer', 'blåskjell', 'østers', 'kamskjell', 'scampi'],
    'selleri': ['selleri', 'stangselleri', 'sellerirot'],
    'sennep': ['sennep', 'sennepsfrø'],
    'sesam': ['sesam', 'sesamfrø', 'tahini'],
    'sulfitter': ['vin', 'tørket frukt', 'syltet']
};

function openNutritionCalculator(recipe = null) {
    const currentRecipe = recipe || state.currentRecipe;
    
    if (!currentRecipe?.ingredients) {
        showToast('Ingen ingredienser å beregne', 'warning');
        return;
    }
    
    const ingredients = getIngredientsAsString(currentRecipe.ingredients);
    const nutrition = calculateNutrition(ingredients);
    const servings = parseServings(currentRecipe.servings) || 4;
    const perServing = {
        cal: Math.round(nutrition.cal / servings),
        protein: Math.round(nutrition.protein / servings),
        carbs: Math.round(nutrition.carbs / servings),
        fat: Math.round(nutrition.fat / servings)
    };
    
    const allergensFound = detectAllergens(ingredients);
    
    const html = `
        <div class="nutrition-calculator">
            <div class="nutrition-header">
                <h3>${escapeHtml(currentRecipe.name)}</h3>
                <p>${servings} porsjoner</p>
            </div>
            
            <div class="nutrition-cards">
                <div class="nutrition-card total">
                    <div class="nutrition-icon">📊</div>
                    <div class="nutrition-label">Totalt</div>
                    <div class="nutrition-values">
                        <div class="nv-item cal"><span>${nutrition.cal}</span> kcal</div>
                        <div class="nv-item"><span>${nutrition.protein}g</span> protein</div>
                        <div class="nv-item"><span>${nutrition.carbs}g</span> karbo</div>
                        <div class="nv-item"><span>${nutrition.fat}g</span> fett</div>
                    </div>
                </div>
                
                <div class="nutrition-card per-serving">
                    <div class="nutrition-icon">🍽️</div>
                    <div class="nutrition-label">Per porsjon</div>
                    <div class="nutrition-values">
                        <div class="nv-item cal"><span>${perServing.cal}</span> kcal</div>
                        <div class="nv-item"><span>${perServing.protein}g</span> protein</div>
                        <div class="nv-item"><span>${perServing.carbs}g</span> karbo</div>
                        <div class="nv-item"><span>${perServing.fat}g</span> fett</div>
                    </div>
                </div>
            </div>
            
            <div class="macro-chart">
                <h4>Makrofordeling</h4>
                <div class="macro-bars">
                    <div class="macro-bar">
                        <div class="macro-label">Protein</div>
                        <div class="macro-track">
                            <div class="macro-fill protein" style="width: ${Math.min(100, (nutrition.protein * 4 / nutrition.cal) * 100)}%"></div>
                        </div>
                        <div class="macro-percent">${Math.round((nutrition.protein * 4 / nutrition.cal) * 100)}%</div>
                    </div>
                    <div class="macro-bar">
                        <div class="macro-label">Karbohydrater</div>
                        <div class="macro-track">
                            <div class="macro-fill carbs" style="width: ${Math.min(100, (nutrition.carbs * 4 / nutrition.cal) * 100)}%"></div>
                        </div>
                        <div class="macro-percent">${Math.round((nutrition.carbs * 4 / nutrition.cal) * 100)}%</div>
                    </div>
                    <div class="macro-bar">
                        <div class="macro-label">Fett</div>
                        <div class="macro-track">
                            <div class="macro-fill fat" style="width: ${Math.min(100, (nutrition.fat * 9 / nutrition.cal) * 100)}%"></div>
                        </div>
                        <div class="macro-percent">${Math.round((nutrition.fat * 9 / nutrition.cal) * 100)}%</div>
                    </div>
                </div>
            </div>
            
            ${allergensFound.length > 0 ? `
                <div class="allergen-warning">
                    <h4>⚠️ Allergener oppdaget</h4>
                    <div class="allergen-tags">
                        ${allergensFound.map(a => `<span class="allergen-tag">${a}</span>`).join('')}
                    </div>
                    <p class="allergen-hint">Basert på ingredienslisten. Sjekk alltid produktetiketter.</p>
                </div>
            ` : `
                <div class="allergen-ok">
                    <span>✅</span> Ingen vanlige allergener oppdaget
                </div>
            `}
            
            <p class="nutrition-disclaimer">
                ⓘ Estimater basert på standardverdier. Faktisk næringsinnhold kan variere.
            </p>
        </div>
    `;
    
    showModal('🥗 Næringsinnhold', html, []);
}
window.openNutritionCalculator = openNutritionCalculator;

function calculateNutrition(ingredientsStr) {
    const nutrition = { cal: 0, protein: 0, carbs: 0, fat: 0 };
    const lines = ingredientsStr.toLowerCase().split('\n');
    
    for (const line of lines) {
        // Parse amount (look for numbers with units)
        const amountMatch = line.match(/(\d+(?:[.,]\d+)?)\s*(g|gram|kg|dl|l|ml|ss|ts|stk)?/);
        let grams = 100; // Default assumption
        
        if (amountMatch) {
            const num = parseFloat(amountMatch[1].replace(',', '.'));
            const unit = amountMatch[2] || '';
            
            // Convert to grams
            if (unit === 'kg' || unit === 'kilo') grams = num * 1000;
            else if (unit === 'g' || unit === 'gram') grams = num;
            else if (unit === 'dl') grams = num * 100;
            else if (unit === 'l' || unit === 'liter') grams = num * 1000;
            else if (unit === 'ml') grams = num;
            else if (unit === 'ss') grams = num * 15;
            else if (unit === 'ts') grams = num * 5;
            else if (unit === 'stk') grams = num * 50; // Rough estimate for "pieces"
            else grams = num * 10; // Default multiplier
        }
        
        // Find matching ingredient
        for (const [ingredient, values] of Object.entries(NUTRITION_DATABASE)) {
            if (line.includes(ingredient)) {
                const factor = grams / 100;
                nutrition.cal += Math.round(values.cal * factor);
                nutrition.protein += Math.round(values.protein * factor);
                nutrition.carbs += Math.round(values.carbs * factor);
                nutrition.fat += Math.round(values.fat * factor);
                break;
            }
        }
    }
    
    return nutrition;
}

function detectAllergens(ingredientsStr) {
    const found = new Set();
    const ingredientsLower = ingredientsStr.toLowerCase();
    
    for (const [allergen, keywords] of Object.entries(ALLERGEN_DATABASE)) {
        for (const keyword of keywords) {
            if (ingredientsLower.includes(keyword)) {
                found.add(allergen.charAt(0).toUpperCase() + allergen.slice(1));
                break;
            }
        }
    }
    
    return Array.from(found);
}

// ===== VOICE COMMANDS =====
let voiceRecognition = null;
let voiceEnabled = false;

function initVoiceCommands() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.log('Stemmegjenkjenning ikke støttet');
        return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    voiceRecognition = new SpeechRecognition();
    voiceRecognition.continuous = true;
    voiceRecognition.interimResults = false;
    voiceRecognition.lang = 'nb-NO';
    
    voiceRecognition.onresult = (event) => {
        const last = event.results.length - 1;
        const command = event.results[last][0].transcript.toLowerCase().trim();
        processVoiceCommand(command);
    };
    
    voiceRecognition.onerror = (event) => {
        console.error('Voice error:', event.error);
        if (event.error === 'not-allowed') {
            showToast('Mikrofontilgang nektet', 'error');
        }
    };
}

function toggleVoiceCommands() {
    if (!voiceRecognition) {
        initVoiceCommands();
    }
    
    if (!voiceRecognition) {
        showToast('Stemmekommandoer støttes ikke i denne nettleseren', 'warning');
        return;
    }
    
    voiceEnabled = !voiceEnabled;
    
    if (voiceEnabled) {
        voiceRecognition.start();
        showToast('🎤 Stemmekommandoer aktivert! Si "hjelp" for kommandoer.', 'success');
    } else {
        voiceRecognition.stop();
        showToast('🎤 Stemmekommandoer deaktivert', 'info');
    }
}
window.toggleVoiceCommands = toggleVoiceCommands;

function processVoiceCommand(command) {
    console.log('Voice command:', command);
    
    // Timer commands
    if (command.includes('start timer') || command.includes('sett timer')) {
        const minutes = command.match(/(\d+)\s*(minutt|min)/);
        if (minutes) {
            setTimerMinutes(parseInt(minutes[1]));
            startTimer();
            speak(`Timer satt til ${minutes[1]} minutter`);
        } else {
            speak('Hvor mange minutter?');
        }
    } else if (command.includes('stopp timer') || command.includes('pause timer')) {
        pauseTimer();
        speak('Timer pauset');
    } else if (command.includes('nullstill timer') || command.includes('reset timer')) {
        resetTimer();
        speak('Timer nullstilt');
    }
    // Navigation
    else if (command.includes('åpne oppskrift') || command.includes('vis oppskrift')) {
        navigateTo('recipeListView');
        speak('Åpner oppskrifter');
    } else if (command.includes('åpne handleliste') || command.includes('vis handleliste')) {
        openShoppingList();
        speak('Åpner handlelisten');
    } else if (command.includes('åpne matkammer') || command.includes('vis matkammer')) {
        openPantryTracker();
        speak('Åpner matkammeret');
    } else if (command.includes('hjem') || command.includes('gå hjem')) {
        navigateTo('dashboardView');
        speak('Går til forsiden');
    }
    // Recipe actions
    else if (command.includes('neste steg') || command.includes('neste trinn')) {
        speak('Går til neste steg');
        showToast('➡️ Neste steg', 'info');
    } else if (command.includes('forrige steg') || command.includes('forrige trinn')) {
        speak('Går tilbake');
        showToast('⬅️ Forrige steg', 'info');
    } else if (command.includes('legg til i handleliste')) {
        addScaledToShoppingList();
        speak('Ingredienser lagt til i handlelisten');
    }
    // Help
    else if (command.includes('hjelp') || command.includes('kommandoer')) {
        speak('Du kan si: start timer, stopp timer, åpne oppskrifter, åpne handleliste, og mer.');
        showVoiceHelp();
    }
    // Search
    else if (command.includes('søk etter')) {
        const searchTerm = command.replace('søk etter', '').trim();
        if (searchTerm) {
            performRecipeSearch(searchTerm);
            speak(`Søker etter ${searchTerm}`);
        }
    }
}

function speak(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'nb-NO';
        utterance.rate = 1.0;
        speechSynthesis.speak(utterance);
    }
}

function showVoiceHelp() {
    const html = `
        <div class="voice-help">
            <div class="voice-status ${voiceEnabled ? 'active' : ''}">
                <span class="voice-icon">${voiceEnabled ? '🎤' : '🔇'}</span>
                <span>${voiceEnabled ? 'Lytter...' : 'Mikrofon av'}</span>
            </div>
            
            <h4>Tilgjengelige kommandoer:</h4>
            
            <div class="voice-commands-list">
                <div class="voice-cmd-group">
                    <h5>⏱️ Timer</h5>
                    <ul>
                        <li>"Start timer 10 minutter"</li>
                        <li>"Stopp timer"</li>
                        <li>"Nullstill timer"</li>
                    </ul>
                </div>
                
                <div class="voice-cmd-group">
                    <h5>📱 Navigasjon</h5>
                    <ul>
                        <li>"Åpne oppskrifter"</li>
                        <li>"Åpne handleliste"</li>
                        <li>"Åpne matkammer"</li>
                        <li>"Gå hjem"</li>
                    </ul>
                </div>
                
                <div class="voice-cmd-group">
                    <h5>🍳 Matlaging</h5>
                    <ul>
                        <li>"Neste steg"</li>
                        <li>"Forrige steg"</li>
                        <li>"Legg til i handleliste"</li>
                    </ul>
                </div>
                
                <div class="voice-cmd-group">
                    <h5>🔍 Søk</h5>
                    <ul>
                        <li>"Søk etter lasagne"</li>
                    </ul>
                </div>
            </div>
            
            <button class="btn btn-primary" onclick="toggleVoiceCommands()">
                ${voiceEnabled ? '🔇 Deaktiver mikrofon' : '🎤 Aktiver mikrofon'}
            </button>
        </div>
    `;
    
    showModal('🎤 Stemmekommandoer', html, []);
}
window.showVoiceHelp = showVoiceHelp;

// ===== COOKING TIP OF THE DAY =====
const COOKING_TIPS = [
    { tip: "Salt pasta-vannet godt - det skal smake som sjøvann!", category: "Pasta" },
    { tip: "La kjøtt hvile etter steking for saftigere resultat.", category: "Kjøtt" },
    { tip: "Bruk romtemperert egg for luftigere kaker.", category: "Baking" },
    { tip: "Hakk urter med litt salt for å forhindre at de blir brune.", category: "Urter" },
    { tip: "Test om oljen er varm nok med en trekulepinne - bobler = klar!", category: "Steking" },
    { tip: "Tilsett sitronjuice til avokado for å forhindre brunfarging.", category: "Frukt" },
    { tip: "Oppbevar ingefær i fryseren - lettere å rive!", category: "Krydder" },
    { tip: "Bruk kald smør i paideig for flakete resultat.", category: "Baking" },
    { tip: "Tilsett en klype sukker til tomatsaus for å balansere syrligheten.", category: "Saus" },
    { tip: "Skjær løk under rennende kaldt vann for å unngå tårer.", category: "Grønnsaker" },
    { tip: "Legg bacon i kald panne og stek langsomt for sprøere resultat.", category: "Kjøtt" },
    { tip: "Bruk steketerm til presist stekt kjøtt hver gang.", category: "Kjøtt" },
    { tip: "Tilsett salt til bønner først etter koking - ellers blir de harde.", category: "Belgfrukter" },
    { tip: "Rist krydder i tørr panne for å frigjøre aromaner.", category: "Krydder" },
    { tip: "La deig hvile i kjøleskapet for lettere håndtering.", category: "Baking" },
    { tip: "Bruk iskaldt vann når du lager tempura for sprøere deig.", category: "Steking" },
    { tip: "Tilsett litt eddik til posjert egg-vannet for bedre form.", category: "Egg" },
    { tip: "Oppbevar ferske urter i glass med vann i kjøleskapet.", category: "Oppbevaring" },
    { tip: "Bruk mandolin for jevne skiver - men vær forsiktig!", category: "Teknikk" },
    { tip: "La stekepannen bli ordentlig varm før du legger i maten.", category: "Steking" },
    { tip: "Tilsett pasta-vann til sausen for silkemyk konsistens.", category: "Pasta" },
    { tip: "Frys sitroner og lime for enklere riving av skall.", category: "Frukt" },
    { tip: "Bruk bakepapir mellom hamburgerkarbonadene før frysing.", category: "Oppbevaring" },
    { tip: "Tilsett honning til marinader for bedre bruning.", category: "Marinade" },
    { tip: "Skyll ris til vannet er klart for løsere, fluffigere ris.", category: "Ris" },
    { tip: "Bruk en skje til å skrelle ingefær - mindre svinn!", category: "Teknikk" },
    { tip: "Tilsett litt kaffe til sjokoladeoppskrifter for dypere smak.", category: "Baking" },
    { tip: "Oppbevar nøtter i fryser for å holde dem ferske lenger.", category: "Oppbevaring" },
    { tip: "Bruk stekebrett på baksiden for større arbeidsflate.", category: "Teknikk" },
    { tip: "Tilsett grønnsaker i rekkefølge etter koketid.", category: "Grønnsaker" }
];

function showCookingTip() {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const tipIndex = seed % COOKING_TIPS.length;
    const { tip, category } = COOKING_TIPS[tipIndex];
    
    const html = `
        <div class="cooking-tip">
            <div class="tip-icon">💡</div>
            <div class="tip-category">${category}</div>
            <p class="tip-text">${tip}</p>
            <div class="tip-actions">
                <button class="btn btn-secondary" onclick="saveTipToFavorites('${tip.replace(/'/g, "\\'")}')">
                    ⭐ Lagre tips
                </button>
                <button class="btn btn-secondary" onclick="showAllTips()">
                    📚 Alle tips
                </button>
            </div>
        </div>
    `;
    
    showModal('💡 Dagens kokketips', html, []);
}
window.showCookingTip = showCookingTip;

function saveTipToFavorites(tip) {
    const savedTips = JSON.parse(localStorage.getItem('kokebok_saved_tips') || '[]');
    if (!savedTips.includes(tip)) {
        savedTips.push(tip);
        localStorage.setItem('kokebok_saved_tips', JSON.stringify(savedTips));
        showToast('⭐ Tips lagret!', 'success');
    } else {
        showToast('Tips allerede lagret', 'info');
    }
}
window.saveTipToFavorites = saveTipToFavorites;

function showAllTips() {
    const savedTips = JSON.parse(localStorage.getItem('kokebok_saved_tips') || '[]');
    
    const html = `
        <div class="all-tips">
            <div class="tips-tabs">
                <button class="tip-tab active" onclick="showTipsTab('all')">Alle tips (${COOKING_TIPS.length})</button>
                <button class="tip-tab" onclick="showTipsTab('saved')">Lagrede (${savedTips.length})</button>
            </div>
            
            <div class="tips-content" id="tipsAllContent">
                ${COOKING_TIPS.map((t, i) => `
                    <div class="tip-item">
                        <span class="tip-num">${i + 1}</span>
                        <div class="tip-body">
                            <span class="tip-cat-badge">${t.category}</span>
                            <p>${t.tip}</p>
                        </div>
                        <button class="tip-save-btn" onclick="saveTipToFavorites('${t.tip.replace(/'/g, "\\'")}')">⭐</button>
                    </div>
                `).join('')}
            </div>
            
            <div class="tips-content hidden" id="tipsSavedContent">
                ${savedTips.length > 0 ? savedTips.map((t, i) => `
                    <div class="tip-item saved">
                        <span class="tip-num">⭐</span>
                        <p>${t}</p>
                    </div>
                `).join('') : '<p class="no-tips">Ingen lagrede tips ennå</p>'}
            </div>
        </div>
    `;
    
    showModal('📚 Kokketips-samling', html, []);
}
window.showAllTips = showAllTips;

function showTipsTab(tab) {
    document.querySelectorAll('.tip-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tips-content').forEach(c => c.classList.add('hidden'));
    
    if (tab === 'all') {
        document.querySelector('.tip-tab:first-child').classList.add('active');
        document.getElementById('tipsAllContent').classList.remove('hidden');
    } else {
        document.querySelector('.tip-tab:last-child').classList.add('active');
        document.getElementById('tipsSavedContent').classList.remove('hidden');
    }
}
window.showTipsTab = showTipsTab;

// ===== SEASONAL CALENDAR =====
const SEASONAL_PRODUCE = {
    1: { // Januar
        vegetables: ['Kål', 'Gulrot', 'Potet', 'Selleri', 'Purre', 'Rosenkål'],
        fruits: ['Eple', 'Pære', 'Sitrus'],
        proteins: ['Torsk', 'Sei', 'Svinekjøtt']
    },
    2: { // Februar
        vegetables: ['Kål', 'Gulrot', 'Potet', 'Selleri', 'Purre'],
        fruits: ['Eple', 'Pære', 'Sitrus'],
        proteins: ['Torsk', 'Skrei', 'Lam']
    },
    3: { // Mars
        vegetables: ['Kål', 'Gulrot', 'Potet', 'Purre', 'Spinat'],
        fruits: ['Eple', 'Rabarbra'],
        proteins: ['Skrei', 'Lam', 'Kylling']
    },
    4: { // April
        vegetables: ['Spinat', 'Reddiker', 'Asparges', 'Salat'],
        fruits: ['Rabarbra'],
        proteins: ['Lam', 'Kylling', 'Ørret']
    },
    5: { // Mai
        vegetables: ['Asparges', 'Spinat', 'Reddiker', 'Salat', 'Vårløk'],
        fruits: ['Rabarbra', 'Jordbær'],
        proteins: ['Lam', 'Ørret', 'Makrell']
    },
    6: { // Juni
        vegetables: ['Asparges', 'Erter', 'Agurk', 'Tomater', 'Salat', 'Nypoteter'],
        fruits: ['Jordbær', 'Rips', 'Stikkelsbær', 'Kirsebær'],
        proteins: ['Makrell', 'Reker', 'Krabbe']
    },
    7: { // Juli
        vegetables: ['Tomater', 'Agurk', 'Squash', 'Mais', 'Bønner', 'Paprika'],
        fruits: ['Jordbær', 'Bringebær', 'Blåbær', 'Kirsebær', 'Plommer'],
        proteins: ['Reker', 'Krabbe', 'Hummer']
    },
    8: { // August
        vegetables: ['Tomater', 'Squash', 'Mais', 'Paprika', 'Aubergine', 'Brokkoli'],
        fruits: ['Bringebær', 'Blåbær', 'Plommer', 'Eple', 'Pære'],
        proteins: ['Hummer', 'Krabbe', 'Villsvin']
    },
    9: { // September
        vegetables: ['Squash', 'Gresskar', 'Kål', 'Brokkoli', 'Løk', 'Rotgrønnsaker'],
        fruits: ['Eple', 'Pære', 'Plommer', 'Druer'],
        proteins: ['Elg', 'Hjort', 'Rype']
    },
    10: { // Oktober
        vegetables: ['Gresskar', 'Kål', 'Rosenkål', 'Rotgrønnsaker', 'Sopp'],
        fruits: ['Eple', 'Pære'],
        proteins: ['Elg', 'Hjort', 'Rype', 'Torsk']
    },
    11: { // November
        vegetables: ['Kål', 'Rosenkål', 'Gulrot', 'Potet', 'Purre'],
        fruits: ['Eple', 'Pære', 'Sitrus'],
        proteins: ['Torsk', 'Svin', 'Vilt']
    },
    12: { // Desember
        vegetables: ['Kål', 'Rosenkål', 'Gulrot', 'Potet', 'Selleri'],
        fruits: ['Eple', 'Pære', 'Sitrus', 'Klementin'],
        proteins: ['Torsk', 'Ribbe', 'Pinnekjøtt']
    }
};

const MONTH_NAMES = ['Januar', 'Februar', 'Mars', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Desember'];

function openSeasonalCalendar() {
    const currentMonth = new Date().getMonth() + 1;
    const data = SEASONAL_PRODUCE[currentMonth];
    
    const html = `
        <div class="seasonal-calendar">
            <div class="season-nav">
                <button onclick="changeSeasonMonth(-1)">←</button>
                <h3 id="seasonMonth">${MONTH_NAMES[currentMonth - 1]}</h3>
                <button onclick="changeSeasonMonth(1)">→</button>
            </div>
            
            <div class="season-grid" id="seasonContent">
                ${renderSeasonContent(currentMonth)}
            </div>
            
            <div class="season-legend">
                <span class="legend-item"><span class="legend-dot veg"></span> Grønnsaker</span>
                <span class="legend-item"><span class="legend-dot fruit"></span> Frukt & bær</span>
                <span class="legend-item"><span class="legend-dot protein"></span> Kjøtt & fisk</span>
            </div>
            
            <button class="btn btn-secondary" onclick="findSeasonalRecipes(${currentMonth})">
                🔍 Finn oppskrifter med sesongens råvarer
            </button>
        </div>
    `;
    
    showModal('🌱 Sesongkalender', html, []);
    window.currentSeasonMonth = currentMonth;
}
window.openSeasonalCalendar = openSeasonalCalendar;

function renderSeasonContent(month) {
    const data = SEASONAL_PRODUCE[month];
    return `
        <div class="season-section">
            <h4>🥬 Grønnsaker</h4>
            <div class="season-items">
                ${data.vegetables.map(v => `<span class="season-item veg">${v}</span>`).join('')}
            </div>
        </div>
        
        <div class="season-section">
            <h4>🍎 Frukt & bær</h4>
            <div class="season-items">
                ${data.fruits.map(f => `<span class="season-item fruit">${f}</span>`).join('')}
            </div>
        </div>
        
        <div class="season-section">
            <h4>🥩 Kjøtt & fisk</h4>
            <div class="season-items">
                ${data.proteins.map(p => `<span class="season-item protein">${p}</span>`).join('')}
            </div>
        </div>
    `;
}

function changeSeasonMonth(delta) {
    window.currentSeasonMonth = ((window.currentSeasonMonth - 1 + delta + 12) % 12) + 1;
    document.getElementById('seasonMonth').textContent = MONTH_NAMES[window.currentSeasonMonth - 1];
    document.getElementById('seasonContent').innerHTML = renderSeasonContent(window.currentSeasonMonth);
}
window.changeSeasonMonth = changeSeasonMonth;

function findSeasonalRecipes(month) {
    const data = SEASONAL_PRODUCE[month];
    const allIngredients = [...data.vegetables, ...data.fruits, ...data.proteins].map(i => i.toLowerCase());
    
    const matches = state.recipes.filter(recipe => {
        const ingredients = getIngredientsAsString(recipe.ingredients).toLowerCase();
        return allIngredients.some(seasonal => ingredients.includes(seasonal.toLowerCase()));
    });
    
    if (matches.length === 0) {
        showToast('Ingen oppskrifter med sesongens råvarer funnet', 'info');
        return;
    }
    
    const html = `
        <div class="seasonal-recipes">
            <p>Fant ${matches.length} oppskrift${matches.length > 1 ? 'er' : ''} med sesongens råvarer:</p>
            <div class="recipe-matches">
                ${matches.slice(0, 10).map(r => `
                    <div class="recipe-match" onclick="viewRecipe('${r.id}'); closeGenericModal();">
                        <span class="match-icon">${getCategoryIcon(r.category)}</span>
                        <span class="match-name">${escapeHtml(r.name)}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    showModal(`🌱 Sesongoppskrifter - ${MONTH_NAMES[month - 1]}`, html, []);
}
window.findSeasonalRecipes = findSeasonalRecipes;

// ===== ADVANCED STATISTICS DASHBOARD =====
function openStatsDashboard() {
    const stats = calculateDetailedStats();
    
    const html = `
        <div class="stats-dashboard">
            <div class="stats-hero">
                <div class="stat-hero-item">
                    <span class="hero-num">${stats.totalRecipes}</span>
                    <span class="hero-label">Oppskrifter</span>
                </div>
                <div class="stat-hero-item">
                    <span class="hero-num">${stats.totalBooks}</span>
                    <span class="hero-label">Kokebøker</span>
                </div>
                <div class="stat-hero-item">
                    <span class="hero-num">${stats.favorites}</span>
                    <span class="hero-label">Favoritter</span>
                </div>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <h4>📊 Kategorier</h4>
                    <div class="category-breakdown">
                        ${stats.byCategory.slice(0, 5).map(c => `
                            <div class="cat-bar">
                                <span class="cat-icon">${c.icon}</span>
                                <span class="cat-name">${c.name}</span>
                                <div class="cat-progress">
                                    <div class="cat-fill" style="width: ${c.percent}%"></div>
                                </div>
                                <span class="cat-count">${c.count}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="stat-card">
                    <h4>⏱️ Koketider</h4>
                    <div class="time-breakdown">
                        <div class="time-stat">
                            <span class="time-icon">⚡</span>
                            <span>${stats.quickRecipes}</span>
                            <span class="time-label">Under 30 min</span>
                        </div>
                        <div class="time-stat">
                            <span class="time-icon">🍳</span>
                            <span>${stats.mediumRecipes}</span>
                            <span class="time-label">30-60 min</span>
                        </div>
                        <div class="time-stat">
                            <span class="time-icon">🍲</span>
                            <span>${stats.longRecipes}</span>
                            <span class="time-label">Over 60 min</span>
                        </div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <h4>📅 Aktivitet</h4>
                    <div class="activity-stats">
                        <p>🗓️ Oppskrifter denne måneden: <strong>${stats.thisMonth}</strong></p>
                        <p>📆 Siste 7 dager: <strong>${stats.lastWeek}</strong></p>
                        <p>🏆 Lengste streak: <strong>${stats.streak} dager</strong></p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <h4>🛒 Matkammer</h4>
                    <div class="pantry-stats-detail">
                        <p>📦 Totalt varer: <strong>${stats.pantryItems}</strong></p>
                        <p>💰 Estimert verdi: <strong>~${stats.pantryValue} kr</strong></p>
                        <p>⚠️ Utløper snart: <strong>${stats.expiringItems}</strong></p>
                    </div>
                </div>
                
                <div class="stat-card wide">
                    <h4>🍽️ Kokede oppskrifter</h4>
                    ${stats.recentlyCooked.length > 0 ? `
                        <div class="cooked-history">
                            ${stats.recentlyCooked.map(c => `
                                <div class="cooked-item">
                                    <span class="cooked-name">${escapeHtml(c.name)}</span>
                                    <span class="cooked-date">${c.date}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p class="no-data">Ingen registrerte kokinger ennå</p>'}
                </div>
            </div>
            
            <div class="stats-achievements">
                <h4>🏆 Prestasjoner</h4>
                <div class="achievement-badges">
                    ${stats.totalRecipes >= 1 ? '<span class="badge earned">👶 Første oppskrift</span>' : '<span class="badge">👶 Første oppskrift</span>'}
                    ${stats.totalRecipes >= 10 ? '<span class="badge earned">📚 10 oppskrifter</span>' : '<span class="badge">📚 10 oppskrifter</span>'}
                    ${stats.totalRecipes >= 50 ? '<span class="badge earned">🏅 50 oppskrifter</span>' : '<span class="badge">🏅 50 oppskrifter</span>'}
                    ${stats.totalRecipes >= 100 ? '<span class="badge earned">🏆 100 oppskrifter</span>' : '<span class="badge">🏆 100 oppskrifter</span>'}
                    ${stats.favorites >= 5 ? '<span class="badge earned">⭐ 5 favoritter</span>' : '<span class="badge">⭐ 5 favoritter</span>'}
                    ${stats.totalBooks >= 3 ? '<span class="badge earned">📖 3 kokebøker</span>' : '<span class="badge">📖 3 kokebøker</span>'}
                </div>
            </div>
        </div>
    `;
    
    showModal('📈 Statistikk-dashboard', html, []);
}
window.openStatsDashboard = openStatsDashboard;

function calculateDetailedStats() {
    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Category breakdown
    const categoryCount = {};
    state.recipes.forEach(r => {
        const cat = state.categories.find(c => c.id === r.category) || { name: 'Annet', icon: '🍽️' };
        if (!categoryCount[cat.name]) {
            categoryCount[cat.name] = { count: 0, icon: cat.icon };
        }
        categoryCount[cat.name].count++;
    });
    
    const byCategory = Object.entries(categoryCount)
        .map(([name, data]) => ({
            name,
            icon: data.icon,
            count: data.count,
            percent: Math.round((data.count / Math.max(1, state.recipes.length)) * 100)
        }))
        .sort((a, b) => b.count - a.count);
    
    // Time breakdown
    let quickRecipes = 0, mediumRecipes = 0, longRecipes = 0;
    state.recipes.forEach(r => {
        const time = parseTime(r.prepTime);
        if (time > 0) {
            if (time < 30) quickRecipes++;
            else if (time <= 60) mediumRecipes++;
            else longRecipes++;
        }
    });
    
    // Cooked history
    const cookedHistory = JSON.parse(localStorage.getItem('kokebok_cooked_history') || '[]');
    const recentlyCooked = cookedHistory.slice(-5).reverse().map(c => {
        const recipe = state.recipes.find(r => r.id === c.recipeId);
        return {
            name: recipe?.name || 'Ukjent',
            date: new Date(c.cookedAt).toLocaleDateString('nb-NO')
        };
    });
    
    // Pantry stats
    const pantryItems = state.pantryItems?.length || 0;
    let pantryValue = 0;
    let expiringItems = 0;
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    
    state.pantryItems?.forEach(item => {
        pantryValue += (item.estimatedPrice || 25) * (item.quantity || 1);
        if (item.expiryDate && new Date(item.expiryDate) <= threeDaysFromNow) {
            expiringItems++;
        }
    });
    
    return {
        totalRecipes: state.recipes.length,
        totalBooks: state.books.length,
        favorites: state.recipes.filter(r => r.favorite).length,
        byCategory,
        quickRecipes,
        mediumRecipes,
        longRecipes,
        thisMonth: state.recipes.filter(r => r.createdAt?.toDate?.() >= monthAgo).length,
        lastWeek: state.recipes.filter(r => r.createdAt?.toDate?.() >= weekAgo).length,
        streak: calculateStreak(),
        pantryItems,
        pantryValue: Math.round(pantryValue),
        expiringItems,
        recentlyCooked
    };
}

function parseTime(timeStr) {
    if (!timeStr) return 0;
    const match = String(timeStr).match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
}

function calculateStreak() {
    const cookedHistory = JSON.parse(localStorage.getItem('kokebok_cooked_history') || '[]');
    if (cookedHistory.length === 0) return 0;
    
    // Group by day
    const days = new Set();
    cookedHistory.forEach(c => {
        days.add(new Date(c.cookedAt).toDateString());
    });
    
    // Calculate longest streak
    const sortedDays = Array.from(days).sort((a, b) => new Date(b) - new Date(a));
    let streak = 1;
    let maxStreak = 1;
    
    for (let i = 1; i < sortedDays.length; i++) {
        const diff = (new Date(sortedDays[i-1]) - new Date(sortedDays[i])) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
            streak++;
            maxStreak = Math.max(maxStreak, streak);
        } else {
            streak = 1;
        }
    }
    
    return maxStreak;
}

// ===== FOOD WASTE TRACKER =====
function openWasteTracker() {
    const wasteData = JSON.parse(localStorage.getItem('kokebok_waste_log') || '[]');
    const thisMonth = wasteData.filter(w => {
        const date = new Date(w.date);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
    
    const totalWaste = thisMonth.reduce((sum, w) => sum + (w.quantity || 1), 0);
    const totalValue = thisMonth.reduce((sum, w) => sum + (w.estimatedValue || 0), 0);
    
    const html = `
        <div class="waste-tracker">
            <div class="waste-summary">
                <div class="waste-stat">
                    <span class="waste-num">${totalWaste}</span>
                    <span class="waste-label">Varer kastet</span>
                </div>
                <div class="waste-stat">
                    <span class="waste-num">~${totalValue} kr</span>
                    <span class="waste-label">Estimert verdi</span>
                </div>
            </div>
            
            <div class="waste-goal">
                <p>🎯 Mål: Reduser matsvinn med 20% denne måneden</p>
                <div class="goal-progress">
                    <div class="goal-bar" style="width: ${Math.min(100, 100 - (totalWaste * 10))}%"></div>
                </div>
            </div>
            
            <button class="btn btn-primary" onclick="logWaste()">
                🗑️ Loggfør kastet mat
            </button>
            
            <div class="waste-log">
                <h4>Siste loggføringer</h4>
                ${wasteData.slice(-5).reverse().map(w => `
                    <div class="waste-item">
                        <span class="waste-name">${escapeHtml(w.name)}</span>
                        <span class="waste-reason">${w.reason || 'Ikke spesifisert'}</span>
                        <span class="waste-date">${new Date(w.date).toLocaleDateString('nb-NO')}</span>
                    </div>
                `).join('') || '<p class="no-waste">Ingen loggføringer ennå - flott!</p>'}
            </div>
            
            <div class="waste-tips">
                <h4>💡 Tips for å redusere matsvinn</h4>
                <ul>
                    <li>Planlegg måltider og handlelister</li>
                    <li>Sjekk matkammeret før handling</li>
                    <li>Bruk "først inn, først ut"-prinsippet</li>
                    <li>Frys mat som nærmer seg utløp</li>
                    <li>Lag "resteopskrifter" med det du har</li>
                </ul>
            </div>
        </div>
    `;
    
    showModal('♻️ Matsvinn-tracker', html, []);
}
window.openWasteTracker = openWasteTracker;

function logWaste() {
    const html = `
        <div class="log-waste-form">
            <div class="form-group">
                <label>Hva kastet du?</label>
                <input type="text" id="wasteName" placeholder="f.eks. Brød, melk, grønnsaker...">
            </div>
            <div class="form-group">
                <label>Hvorfor?</label>
                <select id="wasteReason">
                    <option value="expired">Gått ut på dato</option>
                    <option value="spoiled">Blitt dårlig</option>
                    <option value="leftover">Rester ble ikke spist</option>
                    <option value="bought_too_much">Kjøpte for mye</option>
                    <option value="forgot">Glemte at jeg hadde det</option>
                    <option value="other">Annet</option>
                </select>
            </div>
            <div class="form-group">
                <label>Estimert verdi (kr)</label>
                <input type="number" id="wasteValue" placeholder="0" value="25">
            </div>
            <button class="btn btn-primary" onclick="saveWasteLog()">Lagre</button>
        </div>
    `;
    
    showModal('🗑️ Loggfør matsvinn', html, []);
}
window.logWaste = logWaste;

function saveWasteLog() {
    const name = document.getElementById('wasteName')?.value;
    const reason = document.getElementById('wasteReason')?.value;
    const value = parseInt(document.getElementById('wasteValue')?.value) || 0;
    
    if (!name) {
        showToast('Skriv hva du kastet', 'warning');
        return;
    }
    
    const wasteData = JSON.parse(localStorage.getItem('kokebok_waste_log') || '[]');
    wasteData.push({
        name,
        reason,
        estimatedValue: value,
        date: new Date().toISOString()
    });
    localStorage.setItem('kokebok_waste_log', JSON.stringify(wasteData));
    
    closeGenericModal();
    showToast('Loggført - du er på god vei til å redusere matsvinn!', 'success');
    openWasteTracker();
}
window.saveWasteLog = saveWasteLog;

// ===== QUICK RECIPE MODE (Step-by-step cooking) =====
let cookingModeActive = false;
let currentCookingStep = 0;
let cookingSteps = [];

function startCookingMode() {
    const recipe = state.currentRecipe;
    if (!recipe?.instructions) {
        showToast('Ingen fremgangsmåte tilgjengelig', 'warning');
        return;
    }
    
    // Parse instructions into steps
    cookingSteps = recipe.instructions
        .split(/\n+/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.match(/^[\d.)\-]+$/));
    
    if (cookingSteps.length === 0) {
        showToast('Kunne ikke dele opp i steg', 'warning');
        return;
    }
    
    currentCookingStep = 0;
    cookingModeActive = true;
    renderCookingStep();
}
window.startCookingMode = startCookingMode;

function renderCookingStep() {
    const recipe = state.currentRecipe;
    const step = cookingSteps[currentCookingStep];
    const progress = Math.round(((currentCookingStep + 1) / cookingSteps.length) * 100);
    
    const html = `
        <div class="cooking-mode">
            <div class="cooking-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <span class="progress-text">Steg ${currentCookingStep + 1} av ${cookingSteps.length}</span>
            </div>
            
            <div class="cooking-step-content">
                <p class="step-text">${escapeHtml(step)}</p>
            </div>
            
            <div class="cooking-controls">
                <button class="cook-btn prev" onclick="prevCookingStep()" ${currentCookingStep === 0 ? 'disabled' : ''}>
                    ← Forrige
                </button>
                
                <button class="cook-btn timer" onclick="showQuickTimer()">
                    ⏱️ Timer
                </button>
                
                ${currentCookingStep === cookingSteps.length - 1 ? `
                    <button class="cook-btn finish" onclick="finishCooking()">
                        ✅ Ferdig!
                    </button>
                ` : `
                    <button class="cook-btn next" onclick="nextCookingStep()">
                        Neste →
                    </button>
                `}
            </div>
            
            <button class="btn btn-secondary btn-small" onclick="exitCookingMode()">
                Avslutt kokmodus
            </button>
        </div>
    `;
    
    showModal(`👨‍🍳 ${escapeHtml(recipe.name)}`, html, []);
}

function nextCookingStep() {
    if (currentCookingStep < cookingSteps.length - 1) {
        currentCookingStep++;
        renderCookingStep();
    }
}
window.nextCookingStep = nextCookingStep;

function prevCookingStep() {
    if (currentCookingStep > 0) {
        currentCookingStep--;
        renderCookingStep();
    }
}
window.prevCookingStep = prevCookingStep;

function finishCooking() {
    cookingModeActive = false;
    closeGenericModal();
    
    const recipe = state.currentRecipe;
    if (recipe) {
        onRecipeCooked(recipe.id);
    }
    
    showToast('🎉 Gratulerer! Du har fullført oppskriften!', 'success');
}
window.finishCooking = finishCooking;

function exitCookingMode() {
    cookingModeActive = false;
    closeGenericModal();
}
window.exitCookingMode = exitCookingMode;

function showQuickTimer() {
    const html = `
        <div class="quick-timer">
            <div class="timer-presets">
                <button onclick="setAndStartTimer(1)">1 min</button>
                <button onclick="setAndStartTimer(3)">3 min</button>
                <button onclick="setAndStartTimer(5)">5 min</button>
                <button onclick="setAndStartTimer(10)">10 min</button>
                <button onclick="setAndStartTimer(15)">15 min</button>
                <button onclick="setAndStartTimer(30)">30 min</button>
            </div>
            <button class="btn btn-secondary" onclick="closeQuickTimer()">Tilbake</button>
        </div>
    `;
    
    showModal('⏱️ Sett timer', html, []);
}
window.showQuickTimer = showQuickTimer;

function setAndStartTimer(minutes) {
    setTimerMinutes(minutes);
    startTimer();
    closeGenericModal();
    showToast(`⏱️ Timer satt til ${minutes} minutter`, 'success');
    
    // Return to cooking mode if active
    if (cookingModeActive) {
        setTimeout(renderCookingStep, 500);
    }
}
window.setAndStartTimer = setAndStartTimer;

function closeQuickTimer() {
    if (cookingModeActive) {
        renderCookingStep();
    } else {
        closeGenericModal();
    }
}
window.closeQuickTimer = closeQuickTimer;

// ===== INITIALIZE PREMIUM FEATURES =====
function initPremiumFeatures() {
    // Initialize voice commands if supported
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        console.log('Voice commands available');
    }
    
    // Show cooking tip on first visit of the day
    const lastTipDate = localStorage.getItem('kokebok_last_tip_date');
    const today = new Date().toDateString();
    if (lastTipDate !== today && state.recipes.length > 0) {
        localStorage.setItem('kokebok_last_tip_date', today);
        setTimeout(showCookingTip, 2000);
    }
}

